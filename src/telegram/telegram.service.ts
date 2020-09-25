import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/context';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { inspect } from 'util';

import { GasInfo } from '../gas/gas-info.interface';
import { GasService } from '../gas/gas.service';
import { UserThresholdEntity } from './user-threshold.entity';

const helpText = `Available commands:
  /help - show this text,
  /gasprice - get current gas price in USD,
  /setthreshold <threshold> - set gas price threshold in USD for notifications,
  /stop - stop notifications.`;

const getUserId = (ctx: TelegrafContext) => ctx.chat.id;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  private readonly token = process.env.TELEGRAM_BOT_TOKEN;

  private readonly bot = new Telegraf(this.token);

  constructor(
    private gasService: GasService,
    @InjectRepository(UserThresholdEntity)
    private userThresholdRepository: Repository<UserThresholdEntity>,
  ) {}

  public async onModuleInit() {
    this.gasService.addHandler(this.handleInfoUpdate);

    this.bot.start((ctx) => {
      this.logger.log(`New client: id = ${ctx.chat.id}`);
      ctx.reply(`Greetings! \n\n${helpText}`);
    });

    this.bot.help((ctx) => {
      ctx.reply(helpText);
    });

    this.bot.command('gasprice', this.getGasPriceCommand.bind(this));
    this.bot.command('setthreshold', this.setThresholdCommand.bind(this));
    this.bot.command('stop', this.stopCommand.bind(this));

    this.bot.on('message', (ctx) => {
      ctx.reply('Unknown command. Try /help for command list');
    });

    this.bot.catch(this.handleError.bind(this));

    await this.bot.launch();

    this.logger.log('Telegram interface initialized');
  }

  public onModuleDestroy() {
    this.gasService.removeHandler(this.handleInfoUpdate);
    return this.bot.stop();
  }

  public handleError(error: any) {
    this.logger.error(`Error occured: ${inspect(error)}`);
  }

  public sendMessage(userId: number | string, message: string) {
    this.bot.telegram.sendMessage(userId, message);
  }

  private getGasPriceCommand(ctx: TelegrafContext) {
    ctx.reply(`Gas price: ${this.gasService.getGasPriceInUsd()} $`);
  }

  private async setThresholdCommand(ctx: TelegrafContext): Promise<void> {
    const threshold = Number.parseFloat(ctx.message.text.split(' ')[1]);

    if (Number.isNaN(threshold)) {
      return ctx.reply('Usage:\n/setthreshold 0.0001');
    }

    const userTelegramId = getUserId(ctx);
    const user = await this.userThresholdRepository.findOne(userTelegramId);

    if (!user) {
      const newUser = new UserThresholdEntity();
      newUser.userTelegramId = userTelegramId;
      newUser.threshold = threshold;
      await this.userThresholdRepository.save(newUser);
    } else {
      user.threshold = threshold;
      user.isNotified = false;
      await this.userThresholdRepository.save(user);
    }

    return ctx.reply(`Threshold for you is set to ${threshold} $`);
  }

  private async stopCommand(ctx: TelegrafContext): Promise<void> {
    const userTelegramId = getUserId(ctx);
    const user = await this.userThresholdRepository.findOne(userTelegramId);

    if (!user || !user.threshold) {
      return ctx.reply('Ooops, you\'ve already have no threshold');
    }

    user.threshold = null;
    await this.userThresholdRepository.save(user);
    return ctx.reply('Notification stopped');
  }

  private handleInfoUpdate = async (info: GasInfo) => {
    const needsNotification = await this.userThresholdRepository.find({
      threshold: MoreThanOrEqual(info.gasPriceUsd),
      isNotified: false,
    });

    await Promise.all(needsNotification.map((user) => {
      return this.sendMessage(
        user.userTelegramId,
        `Notification!\nGas price: ${info.gasPriceUsd} $`,
      );
    }));

    await this.userThresholdRepository.save(
      needsNotification.map((user) => {
        // eslint-disable-next-line no-param-reassign
        user.isNotified = true;
        return user;
      }),
    );

    const needsRenew = await this.userThresholdRepository.find({
      threshold: LessThan(info.gasPriceUsd),
      isNotified: true,
    });

    await this.userThresholdRepository.save(
      needsRenew.map((user) => {
        // eslint-disable-next-line no-param-reassign
        user.isNotified = false;
        return user;
      }),
    );
  }
}
