import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { inspect } from 'util';

import { GasInfo } from './gas-info.interface';

interface EtherscanApiResponse {
  status: string,
  message: string,
  result: any,
}

export type InfoUpdateHandler = (info: GasInfo) => void;

const processApiResponse = (response: AxiosResponse<EtherscanApiResponse>) => {
  if (response.status === 200) {
    if (response.data.status === '1') {
      return response.data.result;
    }
  }

  throw new Error(
    `Bad answer from API: code = ${response.status},`
    + ` body = ${JSON.stringify(response.data, null, 2)}`,
  );
};

const api = axios.create({
  baseURL: 'https://api.etherscan.io/api',
});

const gweiToEth = 0.000000001;

@Injectable()
export class GasService {
  private readonly logger = new Logger(GasService.name);

  private readonly etherscanApiKey = process.env.ETHERSCAN_API_KEY;

  private readonly updateDelay = Number.parseInt(process.env.INFO_UPDATE_DELAY, 10);

  private info: GasInfo;

  private updateTimeout: NodeJS.Timeout;

  private infoUpdateHandlers = new Set<InfoUpdateHandler>()

  public onModuleInit() {
    if (!this.etherscanApiKey || !this.updateDelay || Number.isNaN(this.updateDelay)) {
      throw new Error('Config is not provided or incorrect');
    }

    return this.updateInfo();
  }

  public onModuleDestroy() {
    clearTimeout(this.updateTimeout);
  }

  public getGasPriceInUsd(): number {
    return this.info.gasPriceUsd;
  }

  public addHandler(handler: InfoUpdateHandler) {
    this.infoUpdateHandlers.add(handler);
  }

  public removeHandler(handler: InfoUpdateHandler) {
    this.infoUpdateHandlers.delete(handler);
  }

  private updateInfo() {
    return Promise.all([
      api.get<EtherscanApiResponse>('', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: this.etherscanApiKey,
        },
      }).then((result) => {
        const data = processApiResponse(result);
        return Number.parseInt(data.ProposeGasPrice, 10);
      }),
      api.get<EtherscanApiResponse>('', {
        params: {
          module: 'stats',
          action: 'ethprice',
          apikey: this.etherscanApiKey,
        },
      }).then((result) => {
        const data = processApiResponse(result);
        return Number.parseInt(data.ethusd, 10);
      }),
    ])
    .then(([gasPrice, ethUsd]) => {
      this.handleInfoUpdate(gasPrice, ethUsd);
    })
    .catch((error) => this.handleError(error))
    .finally(() => {
      this.updateTimeout = setTimeout(
        () => this.updateInfo(),
        this.updateDelay,
      );
    });
  }

  private handleInfoUpdate(gasPrice: number, ethUsd: number) {
    const gasPriceUsd = gasPrice * ethUsd * gweiToEth;
    this.info = { gasPrice, ethUsd, gasPriceUsd };

    // this.logger.debug(`New info: ${JSON.stringify(this.info, null, 2)}`);
    this.infoUpdateHandlers.forEach((handler) => handler({ ...this.info }));
  }

  private handleError(error: any) {
    this.logger.error(`Error occured: ${inspect(error)}`);
  }
}
