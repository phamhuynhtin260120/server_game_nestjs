export const GAME_TICK_INTERVAL_MS = 50;
export const MAP_MIN_X = -50;
export const MAP_MAX_X = 80;
export const MAP_MIN_Y = -50;
export const MAP_MAX_Y = 50;
export const PLAYER_MOVE_SPEED = 1;
export const DEFAULT_PLAYER_HP = 100;
export const MAX_PLAYER_NAME_LENGTH = 20;
export const DEFAULT_ROOM_ID = 'lobby';
export const MAX_ROOM_ID_LENGTH = 40;
export const DEFAULT_SPAWN_POINTS = [
  { id: 'spawn-1', position: { x: 40, y: -40 } },
  { id: 'spawn-2', position: { x: 40, y: 40 } },
  { id: 'spawn-3', position: { x: 80, y: 0 } },
  { id: 'spawn-4', position: { x: 0, y: 0 } },
] as const;

export const GAME_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  ROOM_JOINED: 'roomJoined',
  MOVE: 'move',
  PING: 'ping',
  PONG: 'pong',
  WORLD_UPDATE: 'worldUpdate',
} as const;
