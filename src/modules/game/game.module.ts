import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameStateService } from './services/game-state.service';

@Module({
  providers: [GameGateway, GameStateService],
})
export class GameModule {}
