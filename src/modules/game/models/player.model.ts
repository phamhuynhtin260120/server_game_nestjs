import { Vector2 } from './vector.model';

export type PlayerStatus = 'alive' | 'dead';

export interface Player {
  id: string;
  name: string;
  position: Vector2;
  hp: number;
  status: PlayerStatus;
  joinedAt: number;
}

export interface PlayerSnapshot {
  id: string;
  name: string;
  position: Vector2;
  hp: number;
  status: PlayerStatus;
}
