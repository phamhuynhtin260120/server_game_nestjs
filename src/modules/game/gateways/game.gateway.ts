import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Interval } from '@nestjs/schedule';
import { Server, Socket } from 'socket.io';
import {
  DEFAULT_ROOM_ID,
  GAME_EVENTS,
  GAME_TICK_INTERVAL_MS,
} from '../constants/game.constants';
import { JoinRoomDto } from '../dto/join-room.dto';
import { MoveInputDto } from '../dto/move-input.dto';
import { GameStateService } from '../services/game-state.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameStateService: GameStateService) {}

  @Interval(GAME_TICK_INTERVAL_MS)
  handleGameTick(): void {
    const gameStates = this.gameStateService.createWorldSnapshots();

    for (const gameState of gameStates) {
      this.server
        .to(gameState.roomId)
        .emit(GAME_EVENTS.WORLD_UPDATE, gameState);
    }
  }

  @SubscribeMessage(GAME_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    client: Socket,
    payload: JoinRoomDto | string,
  ): Promise<void> {
    const input = this.parsePayload<JoinRoomDto>(payload);

    if (!input) {
      console.error('Khong the parse du lieu joinRoom:', payload);
      return;
    }

    const previousRoomId = this.gameStateService.getPlayerRoomId(client.id);
    const player = this.gameStateService.joinRoom(client.id, input);
    const nextRoomId =
      this.gameStateService.getPlayerRoomId(client.id) ?? DEFAULT_ROOM_ID;

    if (previousRoomId && previousRoomId !== nextRoomId) {
      await client.leave(previousRoomId);
    }

    await client.join(nextRoomId);

    client.emit(GAME_EVENTS.ROOM_JOINED, {
      roomId: nextRoomId,
      player,
    });

    console.log(`Nguoi choi [${player.name}] da vao room [${nextRoomId}]`);
  }

  @SubscribeMessage(GAME_EVENTS.MOVE)
  handleMove(client: Socket, payload: MoveInputDto | string): void {
    const input = this.parsePayload<MoveInputDto>(payload);

    if (!input) {
      console.error('Khong the parse du lieu:', payload);
      return;
    }

    const player = this.gameStateService.movePlayer(client.id, input);

    if (!player) {
      return;
    }

    console.log(
      `Lenh hop le: ${input.direction}. Vi tri moi:`,
      player.position,
    );
  }

  async handleConnection(client: Socket): Promise<void> {
    const playerName =
      (client.handshake.query.name as string | undefined) ??
      `Guest_${client.id.slice(0, 4)}`;

    const roomId = this.gameStateService.normalizeRoomId(
      client.handshake.query.roomId as string | undefined,
    );
    const newPlayer = this.gameStateService.addPlayer(
      client.id,
      playerName,
      roomId,
    );

    await client.join(roomId);

    console.log('Nguoi choi da tham gia o vi tri:', newPlayer.position);
    console.log(`Nguoi choi [${newPlayer.name}] da tham gia room [${roomId}]!`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Nguoi choi da roi di: ${client.id}`);
    this.gameStateService.removePlayer(client.id);
  }

  @SubscribeMessage(GAME_EVENTS.PING)
  handlePing(client: Socket, data: unknown) {
    console.log('Nhan ping tu client:', client.id, data);

    return {
      event: GAME_EVENTS.PONG,
      data: { serverTime: Date.now() },
    };
  }

  private parsePayload<TPayload>(payload: TPayload | string): TPayload | null {
    if (typeof payload !== 'string') {
      return payload;
    }

    try {
      return JSON.parse(payload) as TPayload;
    } catch {
      return null;
    }
  }
}
