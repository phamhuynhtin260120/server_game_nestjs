import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Interval } from '@nestjs/schedule';
import { Server, Socket } from 'socket.io';

interface Player {
    id: string;
    name: string;
    position: { x: number; y: number };
}

@WebSocketGateway({
    cors: { origin: '*' }, // Cho phép mọi nguồn kết nối (để tiện test)
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    // Sử dụng Map để quản lý người chơi theo ID cho nhanh
    private players: Map<string, Player> = new Map();
    private tickCount = 0;

    @Interval(50)
    handleGameTick() {
        this.tickCount++;

        // Chuyển Map thành Array để gửi qua Socket
        const playerList = Array.from(this.players.values());

        const gameState = {
            tick: this.tickCount,
            players: playerList, // Gửi danh sách người chơi thực tế
        };

        this.server.emit('worldUpdate', gameState);
    }
    @SubscribeMessage('move')
    handleMove(client: Socket, data: { direction: string }) {
        const player = this.players.get(client.id);
        if (!player) return;

        const moveSpeed = 10;

        // Lưu ý: Phải trỏ đúng vào player.position (nếu code bạn đang dùng cấu trúc này)
        if (data.direction === 'up') player.position.y -= moveSpeed;
        if (data.direction === 'down') player.position.y += moveSpeed;
        if (data.direction === 'left') player.position.x -= moveSpeed;
        if (data.direction === 'right') player.position.x += moveSpeed;

        // Quan trọng: Ghi đè lại vào Map để đảm bảo dữ liệu mới nhất được lưu
        this.players.set(client.id, player);

        console.log(`Player ${client.id} moved to:`, player.position);
    }
    // Khi có một người chơi mới kết nối
    handleConnection(client: Socket) {
        const newPlayer: Player = {
            id: client.id,
            name: `Player ${client.id}`,
            position:
            {
                x: Math.floor(Math.random() * 500),
                y: Math.floor(Math.random() * 500)
            },
        };
        this.players.set(client.id, newPlayer);
        console.log(`Người chơi kết nối: ${client.id}`);
        console.log(`Người chơi ${client.id} gia nhập tại (${newPlayer.position.x}, ${newPlayer.position.y})`);
    }

    // Khi người chơi thoát game
    handleDisconnect(client: Socket) {
        console.log(`Người chơi đã rời đi: ${client.id}`);
        this.players.delete(client.id);
    }

    // Lắng nghe tin nhắn 'ping' từ Client
    @SubscribeMessage('ping')
    handlePing(client: Socket, data: any) {
        console.log('Nhận ping từ client:', data);
        // Phản hồi lại 'pong' kèm thời gian server
        return { event: 'pong', data: { serverTime: Date.now() } };
    }
}