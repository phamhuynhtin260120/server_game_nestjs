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
    handleMove(client: Socket, payload: any) {
        const player = this.players.get(client.id);
        const MAP_LIMIT_X = 500;
        const MAP_LIMIT_Y = 500;
        if (!player) return;

        let data = payload;

        //  Nếu data gửi lên là chuỗi, ta phải parse nó ra
        if (typeof payload === 'string') {
            try {
                data = JSON.parse(payload);
            } catch (e) {
                console.error("Không thể parse dữ liệu:", payload);
                return;
            }
        }

        const moveSpeed = 20;
        const direction = data.direction?.trim();

        if (direction === 'up') player.position.y -= moveSpeed;
        else if (direction === 'down') player.position.y += moveSpeed;
        else if (direction === 'left') player.position.x -= moveSpeed;
        else if (direction === 'right') player.position.x += moveSpeed;

        if (player.position.x < 0) player.position.x = 0;
        if (player.position.x > MAP_LIMIT_X) player.position.x = MAP_LIMIT_X;

        if (player.position.y < 0) player.position.y = 0;
        if (player.position.y > MAP_LIMIT_Y) player.position.y = MAP_LIMIT_Y;

        this.players.set(client.id, player);

        console.log(`Lệnh hợp lệ: ${direction}. Vị trí mới:`, player.position);
    }
    // Khi có một người chơi mới kết nối
    handleConnection(client: Socket) {
    // Lấy tên từ query string (ví dụ: ws://localhost:3000/?name=Zen)
    const playerName = client.handshake.query.name as string || `Guest_${client.id.slice(0, 4)}`;

    const newPlayer: Player = {
        id: client.id,
        name: playerName, // Sử dụng tên thật
        position: {
            x: 250, // Cho mọi người xuất phát ở giữa map
            y: 250
        },
    };
    console.log('Danh sách người chơi:', this.players);
    console.log('Người chơi đã tham gia ở vị trí:', newPlayer.position);
    this.players.set(client.id, newPlayer);
    console.log(`🎮 Người chơi [${playerName}] đã tham gia trận đấu!`);
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