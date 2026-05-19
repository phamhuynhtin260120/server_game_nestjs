import {
  DEFAULT_PLAYER_HP,
  DEFAULT_ROOM_ID,
  MAP_LIMIT_X,
  MAP_LIMIT_Y,
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
        position: {
          x: MAP_LIMIT_X / 2,
          y: MAP_LIMIT_Y / 2,
        },
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
      x: MAP_LIMIT_X / 2 + PLAYER_MOVE_SPEED,
      y: MAP_LIMIT_Y / 2,
    });

    for (let i = 0; i < 100; i++) {
      service.movePlayer('socket-1', { direction: 'right' });
      service.movePlayer('socket-1', { direction: 'down' });
    }

    expect(service.getPlayer('socket-1')?.position).toEqual({
      x: MAP_LIMIT_X,
      y: MAP_LIMIT_Y,
    });
  });

  it('ignores invalid movement directions', () => {
    service.addPlayer('socket-1', 'Zen');

    const player = service.movePlayer('socket-1', { direction: 'teleport' });

    expect(player?.position).toEqual({
      x: MAP_LIMIT_X / 2,
      y: MAP_LIMIT_Y / 2,
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
        position: {
          x: MAP_LIMIT_X / 2,
          y: MAP_LIMIT_Y / 2,
        },
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
            x: MAP_LIMIT_X / 2 + PLAYER_MOVE_SPEED,
            y: MAP_LIMIT_Y / 2,
          },
          hp: DEFAULT_PLAYER_HP,
          status: 'alive',
        },
      ],
    });
    expect(arenaTwoSnapshot.players).toEqual([
      {
        id: 'socket-2',
        name: 'Kai',
        position: {
          x: MAP_LIMIT_X / 2,
          y: MAP_LIMIT_Y / 2,
        },
        hp: DEFAULT_PLAYER_HP,
        status: 'alive',
      },
    ]);
  });

  it('normalizes invalid room ids to lobby', () => {
    service.addPlayer('socket-1', 'Zen', '   !!!   ');

    expect(service.getPlayerRoomId('socket-1')).toBe(DEFAULT_ROOM_ID);
  });
});
