import { Module } from '@nestjs/common';

import { GasModule } from './gas/gas.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [TelegramModule, GasModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
