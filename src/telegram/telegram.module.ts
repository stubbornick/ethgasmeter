import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GasModule } from '../gas/gas.module';
import { TelegramService } from './telegram.service';
import { UserThresholdEntity } from './user-threshold.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserThresholdEntity]),
    GasModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
