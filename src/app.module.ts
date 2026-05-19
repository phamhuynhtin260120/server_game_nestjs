import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [ScheduleModule.forRoot(), GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
