import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PLAYER_HP,
  MAP_LIMIT_X,
  MAP_LIMIT_Y,
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_MOVE_SPEED,
} from '../constants/game.constants';
import { MoveDirection, MoveInputDto } from '../dto/move-input.dto';
import { Player, PlayerSnapshot } from '../models/player.model';

export interface WorldSnapshot {
  tick: number;
  players: PlayerSnapshot[];
}

@Injectable()
export class GameStateService {
  private readonly players: Map<string, Player> = new Map();
  private tickCount = 0;

  addPlayer(id: string, name: string): Player {
    const newPlayer: Player = {
      id,
      name: this.normalizePlayerName(name, id),
      position: {
        x: MAP_LIMIT_X / 2,
        y: MAP_LIMIT_Y / 2,
      },
      hp: DEFAULT_PLAYER_HP,
      status: 'alive',
      joinedAt: Date.now(),
    };

    this.players.set(id, newPlayer);

    return newPlayer;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  movePlayer(id: string, input: MoveInputDto): Player | undefined {
    const player = this.players.get(id);

    if (!player) {
      return undefined;
    }

    if (player.status !== 'alive') {
      return player;
    }

    const direction = this.normalizeDirection(input.direction);

    if (!direction) {
      return player;
    }

    if (direction === 'up') player.position.y -= PLAYER_MOVE_SPEED;
    else if (direction === 'down') player.position.y += PLAYER_MOVE_SPEED;
    else if (direction === 'left') player.position.x -= PLAYER_MOVE_SPEED;
    else if (direction === 'right') player.position.x += PLAYER_MOVE_SPEED;

    player.position.x = this.clamp(player.position.x, 0, MAP_LIMIT_X);
    player.position.y = this.clamp(player.position.y, 0, MAP_LIMIT_Y);

    this.players.set(id, player);

    return player;
  }

  createWorldSnapshot(): WorldSnapshot {
    this.tickCount++;

    return {
      tick: this.tickCount,
      players: Array.from(this.players.values()).map((player) =>
        this.toPlayerSnapshot(player),
      ),
    };
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  private toPlayerSnapshot(player: Player): PlayerSnapshot {
    return {
      id: player.id,
      name: player.name,
      position: { ...player.position },
      hp: player.hp,
      status: player.status,
    };
  }

  private normalizePlayerName(name: string, id: string): string {
    const normalizedName = name.trim().slice(0, MAX_PLAYER_NAME_LENGTH);

    if (normalizedName.length > 0) {
      return normalizedName;
    }

    return `Guest_${id.slice(0, 4)}`;
  }

  private normalizeDirection(
    direction: MoveInputDto['direction'],
  ): MoveDirection | undefined {
    const normalizedDirection = direction?.trim();

    if (
      normalizedDirection === 'up' ||
      normalizedDirection === 'down' ||
      normalizedDirection === 'left' ||
      normalizedDirection === 'right'
    ) {
      return normalizedDirection;
    }

    return undefined;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
