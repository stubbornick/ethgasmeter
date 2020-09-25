import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GasModule } from './gas/gas.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TelegramModule,
    GasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
