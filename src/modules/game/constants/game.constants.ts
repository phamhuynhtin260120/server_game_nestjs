export const GAME_TICK_INTERVAL_MS = 50;
export const MAP_LIMIT_X = 500;
export const MAP_LIMIT_Y = 500;
export const PLAYER_MOVE_SPEED = 20;
export const DEFAULT_PLAYER_HP = 100;
export const MAX_PLAYER_NAME_LENGTH = 20;
export const DEFAULT_ROOM_ID = 'lobby';
export const MAX_ROOM_ID_LENGTH = 40;

export const GAME_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  ROOM_JOINED: 'roomJoined',
  MOVE: 'move',
  PING: 'ping',
  PONG: 'pong',
  WORLD_UPDATE: 'worldUpdate',
} as const;
