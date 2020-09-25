import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { inspect } from 'util';

import { GasService } from '../gas/gas.service';

const helpText = `Available commands:
  /help - show this text,
  /gasprice - get current gas price in USD,
  /setthreshold <threshold> - set gas price threshold in USD for notifications,
  /stop - stop notifications.`;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  private readonly token = process.env.TELEGRAM_BOT_TOKEN;

  private readonly bot = new Telegraf(this.token);

  constructor(private readonly gasService: GasService) {}

  public async onModuleInit() {
    this.bot.start((ctx) => {
      this.logger.log(`New client: id = ${ctx.chat.id}`);
      ctx.reply(`Greetings! \n\n${helpText}`);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(helpText);
    });

    this.bot.command('gasprice', (ctx) => {
      ctx.reply(`Current gas price is: ${this.gasService.getGasPriceInUsd()} $`);
    });

    this.bot.catch(this.handleError.bind(this));

    await this.bot.launch();

    this.logger.log('Telegram interface initialized');
  }

  public handleError(error: any) {
    this.logger.error(`Error occured: ${inspect(error)}`);
  }
}
