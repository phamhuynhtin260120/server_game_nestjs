import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({
    cors: { origin: '*' }, // Cho phép mọi nguồn kết nối (để tiện test)
  })
  export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;
  
    // Khi có một người chơi mới kết nối
    handleConnection(client: Socket) {
      console.log(`Người chơi kết nối: ${client.id}`);
    }
  
    // Khi người chơi thoát game
    handleDisconnect(client: Socket) {
      console.log(`Người chơi đã rời đi: ${client.id}`);
    }
  
    // Lắng nghe tin nhắn 'ping' từ Client
    @SubscribeMessage('ping')
    handlePing(client: Socket, data: any) {
      console.log('Nhận ping từ client:', data);
      // Phản hồi lại 'pong' kèm thời gian server
      return { event: 'pong', data: { serverTime: Date.now() } };
    }
  }