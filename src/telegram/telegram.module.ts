import { Module } from '@nestjs/common';

import { GasModule } from '../gas/gas.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [GasModule],
  providers: [TelegramService],
})
export class TelegramModule {}
