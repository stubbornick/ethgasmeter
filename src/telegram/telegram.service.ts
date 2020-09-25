import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/context';
import { Repository } from 'typeorm';
import { inspect } from 'util';

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
    this.bot.start((ctx) => {
      this.logger.log(`New client: id = ${ctx.chat.id}`);
      ctx.reply(`Greetings! \n\n${helpText}`);
    });

    this.bot.help((ctx) => {
      ctx.reply(helpText);
    });

    this.bot.command('gasprice', this.getGasPriceCommand.bind(this));
    this.bot.command('setthreshold', this.setThresholdCommand.bind(this));

    this.bot.catch(this.handleError.bind(this));

    await this.bot.launch();

    this.logger.log('Telegram interface initialized');
  }

  public onModuleDestroy() {
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

  private async setThresholdCommand(ctx: TelegrafContext) {
    const threshold = Number.parseFloat(ctx.message.text.split(' ')[1]);

    if (Number.isNaN(threshold)) {
      ctx.reply('Usage:\n/setthreshold 0.0001');
      return;
    }

    const userTelegramId = getUserId(ctx);
    const user = await this.userThresholdRepository.findOne();

    if (!user) {
      const newUser = new UserThresholdEntity();
      newUser.userTelegramId = userTelegramId;
      newUser.threshold = threshold;
      await this.userThresholdRepository.save(newUser);
    } else {
      user.threshold = threshold;
      await this.userThresholdRepository.save(user);
    }

    ctx.reply(`Threshold for you is set to ${threshold} $`);
  }
}
