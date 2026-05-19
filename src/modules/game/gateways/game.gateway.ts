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
  GAME_EVENTS,
  GAME_TICK_INTERVAL_MS,
} from '../constants/game.constants';
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
    const gameState = this.gameStateService.createWorldSnapshot();

    this.server.emit(GAME_EVENTS.WORLD_UPDATE, gameState);
  }

  @SubscribeMessage(GAME_EVENTS.MOVE)
  handleMove(client: Socket, payload: MoveInputDto | string): void {
    const input = this.parseMoveInput(payload);

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

  handleConnection(client: Socket): void {
    const playerName =
      (client.handshake.query.name as string | undefined) ??
      `Guest_${client.id.slice(0, 4)}`;

    const newPlayer = this.gameStateService.addPlayer(client.id, playerName);

    console.log('Nguoi choi da tham gia o vi tri:', newPlayer.position);
    console.log(`Nguoi choi [${playerName}] da tham gia tran dau!`);
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

  private parseMoveInput(payload: MoveInputDto | string): MoveInputDto | null {
    if (typeof payload !== 'string') {
      return payload;
    }

    try {
      return JSON.parse(payload) as MoveInputDto;
    } catch {
      return null;
    }
  }
}
