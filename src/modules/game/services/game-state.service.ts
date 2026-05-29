import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PLAYER_HP,
  DEFAULT_ROOM_ID,
  DEFAULT_SPAWN_POINTS,
  MAP_MAX_X,
  MAP_MAX_Y,
  MAP_MIN_X,
  MAP_MIN_Y,
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROOM_ID_LENGTH,
  PLAYER_MOVE_SPEED,
} from '../constants/game.constants';
import { JoinRoomDto } from '../dto/join-room.dto';
import { MoveDirection, MoveInputDto } from '../dto/move-input.dto';
import { Player, PlayerSnapshot } from '../models/player.model';
import { GameRoom } from '../models/room.model';
import { SpawnPoint } from '../models/spawn-point.model';
import { Vector2 } from '../models/vector.model';

export interface WorldSnapshot {
  roomId: string;
  tick: number;
  players: PlayerSnapshot[];
  spawnPoints: SpawnPoint[];
}

@Injectable()
export class GameStateService {
  private readonly rooms: Map<string, GameRoom> = new Map();
  private readonly playerRoomIds: Map<string, string> = new Map();

  addPlayer(id: string, name: string, roomId = DEFAULT_ROOM_ID): Player {
    const normalizedRoomId = this.normalizeRoomId(roomId);

    this.removePlayer(id);

    const room = this.getOrCreateRoom(normalizedRoomId);
    const newPlayer: Player = {
      id,
      name: this.normalizePlayerName(name, id),
      position: this.pickSpawnPosition(room),
      hp: DEFAULT_PLAYER_HP,
      status: 'alive',
      joinedAt: Date.now(),
    };

    room.players.set(id, newPlayer);
    this.playerRoomIds.set(id, room.id);

    return newPlayer;
  }

  joinRoom(id: string, input: JoinRoomDto): Player {
    return this.addPlayer(
      id,
      input.name ?? this.getPlayer(id)?.name ?? '',
      input.roomId,
    );
  }

  removePlayer(id: string): void {
    const roomId = this.playerRoomIds.get(id);

    if (!roomId) {
      return;
    }

    const room = this.rooms.get(roomId);
    room?.players.delete(id);
    this.playerRoomIds.delete(id);

    if (room && room.players.size === 0 && room.id !== DEFAULT_ROOM_ID) {
      this.rooms.delete(room.id);
    }
  }

  movePlayer(id: string, input: MoveInputDto): Player | undefined {
    const player = this.getPlayer(id);

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

    if (direction === 'up') player.position.y += PLAYER_MOVE_SPEED;
    else if (direction === 'down') player.position.y -= PLAYER_MOVE_SPEED;
    else if (direction === 'left') player.position.x -= PLAYER_MOVE_SPEED;
    else if (direction === 'right') player.position.x += PLAYER_MOVE_SPEED;

    player.position.x = this.clamp(player.position.x, MAP_MIN_X, MAP_MAX_X);
    player.position.y = this.clamp(player.position.y, MAP_MIN_Y, MAP_MAX_Y);

    return player;
  }

  createWorldSnapshots(): WorldSnapshot[] {
    return Array.from(this.rooms.values()).map((room) =>
      this.createWorldSnapshot(room.id),
    );
  }

  createWorldSnapshot(roomId = DEFAULT_ROOM_ID): WorldSnapshot {
    const room = this.getOrCreateRoom(roomId);
    room.tick++;

    return {
      roomId: room.id,
      tick: room.tick,
      players: Array.from(room.players.values()).map((player) =>
        this.toPlayerSnapshot(player),
      ),
      spawnPoints: this.getSpawnPoints(),
    };
  }

  getPlayer(id: string): Player | undefined {
    const roomId = this.playerRoomIds.get(id);

    if (!roomId) {
      return undefined;
    }

    return this.rooms.get(roomId)?.players.get(id);
  }

  getPlayerRoomId(id: string): string | undefined {
    return this.playerRoomIds.get(id);
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  normalizeRoomId(roomId: string | undefined): string {
    const normalizedRoomId = roomId
      ?.trim()
      .slice(0, MAX_ROOM_ID_LENGTH)
      .replace(/[^a-zA-Z0-9_-]/g, '');

    if (normalizedRoomId && normalizedRoomId.length > 0) {
      return normalizedRoomId;
    }

    return DEFAULT_ROOM_ID;
  }

  private getOrCreateRoom(roomId: string | undefined): GameRoom {
    const normalizedRoomId = this.normalizeRoomId(roomId);
    const existingRoom = this.rooms.get(normalizedRoomId);

    if (existingRoom) {
      return existingRoom;
    }

    const newRoom: GameRoom = {
      id: normalizedRoomId,
      players: new Map(),
      tick: 0,
      spawnCursor: 0,
      createdAt: Date.now(),
    };

    this.rooms.set(newRoom.id, newRoom);

    return newRoom;
  }

  private pickSpawnPosition(room: GameRoom): Vector2 {
    const spawnPoints = this.getSpawnPoints();
    const spawnPoint = spawnPoints[room.spawnCursor % spawnPoints.length];

    room.spawnCursor++;

    return { ...spawnPoint.position };
  }

  private getSpawnPoints(): SpawnPoint[] {
    return DEFAULT_SPAWN_POINTS.map((spawnPoint) => ({
      id: spawnPoint.id,
      position: { ...spawnPoint.position },
    }));
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
