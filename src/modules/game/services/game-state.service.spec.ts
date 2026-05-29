import {
  DEFAULT_PLAYER_HP,
  DEFAULT_ROOM_ID,
  DEFAULT_SPAWN_POINTS,
  MAP_MAX_X,
  MAP_MAX_Y,
  MAP_MIN_X,
  MAP_MIN_Y,
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_MOVE_SPEED,
} from '../constants/game.constants';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    service = new GameStateService();
  });

  it('creates a player with default game state', () => {
    const beforeJoin = Date.now();

    const player = service.addPlayer('socket-1', 'Zen');

    expect(player).toEqual(
      expect.objectContaining({
        id: 'socket-1',
        name: 'Zen',
        hp: DEFAULT_PLAYER_HP,
        status: 'alive',
        position: DEFAULT_SPAWN_POINTS[0].position,
      }),
    );
    expect(player.joinedAt).toBeGreaterThanOrEqual(beforeJoin);
    expect(player.joinedAt).toBeLessThanOrEqual(Date.now());
  });

  it('normalizes empty and long player names', () => {
    const guest = service.addPlayer('abcd-1234', '   ');
    const namedPlayer = service.addPlayer(
      'socket-2',
      'VeryVeryVeryLongPlayerName',
    );

    expect(guest.name).toBe('Guest_abcd');
    expect(namedPlayer.name).toHaveLength(MAX_PLAYER_NAME_LENGTH);
  });

  it('moves alive players and keeps them inside map bounds', () => {
    service.addPlayer('socket-1', 'Zen');

    const movedPlayer = service.movePlayer('socket-1', { direction: 'right' });

    expect(movedPlayer?.position).toEqual({
      x: DEFAULT_SPAWN_POINTS[0].position.x + PLAYER_MOVE_SPEED,
      y: DEFAULT_SPAWN_POINTS[0].position.y,
    });

    for (let i = 0; i < 100; i++) {
      service.movePlayer('socket-1', { direction: 'right' });
      service.movePlayer('socket-1', { direction: 'up' });
    }

    expect(service.getPlayer('socket-1')?.position).toEqual({
      x: MAP_MAX_X,
      y: MAP_MAX_Y,
    });
  });

  it('ignores invalid movement directions', () => {
    service.addPlayer('socket-1', 'Zen');

    const player = service.movePlayer('socket-1', { direction: 'teleport' });

    expect(player?.position).toEqual({
      x: DEFAULT_SPAWN_POINTS[0].position.x,
      y: DEFAULT_SPAWN_POINTS[0].position.y,
    });
  });

  it('creates public world snapshots without private player fields', () => {
    service.addPlayer('socket-1', 'Zen');

    const snapshot = service.createWorldSnapshot();

    expect(snapshot.roomId).toBe(DEFAULT_ROOM_ID);
    expect(snapshot.tick).toBe(1);
    expect(snapshot.players).toEqual([
      {
        id: 'socket-1',
        name: 'Zen',
        position: DEFAULT_SPAWN_POINTS[0].position,
        hp: DEFAULT_PLAYER_HP,
        status: 'alive',
      },
    ]);
    expect(snapshot.players[0]).not.toHaveProperty('joinedAt');
  });

  it('moves players between rooms', () => {
    service.addPlayer('socket-1', 'Zen');

    const player = service.joinRoom('socket-1', {
      roomId: 'arena-1',
      name: 'Zen',
    });

    expect(player.name).toBe('Zen');
    expect(service.getPlayerRoomId('socket-1')).toBe('arena-1');
    expect(service.getRoom(DEFAULT_ROOM_ID)?.players.size).toBe(0);
    expect(service.getRoom('arena-1')?.players.has('socket-1')).toBe(true);
  });

  it('creates isolated world snapshots per room', () => {
    service.addPlayer('socket-1', 'Zen', 'arena-1');
    service.addPlayer('socket-2', 'Kai', 'arena-2');
    service.movePlayer('socket-1', { direction: 'right' });

    const arenaOneSnapshot = service.createWorldSnapshot('arena-1');
    const arenaTwoSnapshot = service.createWorldSnapshot('arena-2');

    expect(arenaOneSnapshot).toEqual({
      roomId: 'arena-1',
      tick: 1,
      players: [
        {
          id: 'socket-1',
          name: 'Zen',
          position: {
            x: DEFAULT_SPAWN_POINTS[0].position.x + PLAYER_MOVE_SPEED,
            y: DEFAULT_SPAWN_POINTS[0].position.y,
          },
          hp: DEFAULT_PLAYER_HP,
          status: 'alive',
        },
      ],
      spawnPoints: DEFAULT_SPAWN_POINTS.map((spawnPoint) => ({
        id: spawnPoint.id,
        position: spawnPoint.position,
      })),
    });
    expect(arenaTwoSnapshot.players).toEqual([
      {
        id: 'socket-2',
        name: 'Kai',
        position: DEFAULT_SPAWN_POINTS[0].position,
        hp: DEFAULT_PLAYER_HP,
        status: 'alive',
      },
    ]);
  });

  it('normalizes invalid room ids to lobby', () => {
    service.addPlayer('socket-1', 'Zen', '   !!!   ');

    expect(service.getPlayerRoomId('socket-1')).toBe(DEFAULT_ROOM_ID);
  });

  it('assigns spawn points in round-robin order per room', () => {
    const firstPlayer = service.addPlayer('socket-1', 'Zen', 'arena-1');
    const secondPlayer = service.addPlayer('socket-2', 'Kai', 'arena-1');
    const thirdPlayer = service.addPlayer('socket-3', 'Mina', 'arena-1');
    const fourthPlayer = service.addPlayer('socket-4', 'Rin', 'arena-1');
    const fifthPlayer = service.addPlayer('socket-5', 'Neo', 'arena-1');

    expect(firstPlayer.position).toEqual(DEFAULT_SPAWN_POINTS[0].position);
    expect(secondPlayer.position).toEqual(DEFAULT_SPAWN_POINTS[1].position);
    expect(thirdPlayer.position).toEqual(DEFAULT_SPAWN_POINTS[2].position);
    expect(fourthPlayer.position).toEqual(DEFAULT_SPAWN_POINTS[3].position);
    expect(fifthPlayer.position).toEqual(DEFAULT_SPAWN_POINTS[0].position);
  });

  it('keeps every configured spawn point inside map bounds', () => {
    for (const spawnPoint of DEFAULT_SPAWN_POINTS) {
      expect(spawnPoint.position.x).toBeGreaterThanOrEqual(MAP_MIN_X);
      expect(spawnPoint.position.x).toBeLessThanOrEqual(MAP_MAX_X);
      expect(spawnPoint.position.y).toBeGreaterThanOrEqual(MAP_MIN_Y);
      expect(spawnPoint.position.y).toBeLessThanOrEqual(MAP_MAX_Y);
    }
  });

  it('includes spawn points in world snapshots', () => {
    const snapshot = service.createWorldSnapshot('arena-1');

    expect(snapshot.spawnPoints).toEqual(
      DEFAULT_SPAWN_POINTS.map((spawnPoint) => ({
        id: spawnPoint.id,
        position: spawnPoint.position,
      })),
    );
  });
});
