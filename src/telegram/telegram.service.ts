import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { inspect } from 'util';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  private readonly token = process.env.TELEGRAM_BOT_TOKEN

  private readonly bot = new Telegraf(this.token)

  public async onModuleInit() {
    this.bot.start((ctx) => {
      this.logger.log(`New client: id = ${ctx.chat.id}`);
      ctx.reply('Hello');
    });

    this.bot.command('hello', (ctx) => {
      ctx.reply('Hello, World!');
    });

    await this.bot.launch();

    this.logger.log('Telegram interface initialized');
  }

  public handleError(error: any) {
    this.logger.error(`Error occured: ${inspect(error)}`);
  }
}
