import { Player } from './player.model';

export interface GameRoom {
  id: string;
  players: Map<string, Player>;
  tick: number;
  createdAt: number;
}
