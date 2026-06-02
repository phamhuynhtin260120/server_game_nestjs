# Server Game NestJS

Backend realtime game server duoc xay dung bang NestJS, TypeScript va Socket.IO.

Du an hien tai tap trung vao phan loi cua mot multiplayer game server: nguoi choi ket noi vao room, server luu game state trong memory, xu ly lenh di chuyen va broadcast world state theo game tick.

## Cong nghe chinh

- NestJS 11: framework backend Node.js theo kien truc module/service/gateway.
- TypeScript: ngon ngu chinh, giup mo ta type cho player, room, DTO va game state.
- Socket.IO: giao tiep realtime giua client va server.
- Nest Schedule: chay game tick dinh ky moi `50ms`.
- Jest: unit test cho service va controller.
- Docker: build va chay server bang container.
- PostgreSQL: da co cau hinh Docker Compose va `DATABASE_URL`, hien tai chua duoc su dung trong game state.

## Tinh nang hien co

- Client ket noi vao game server bang Socket.IO.
- Tu dong tao player khi client connect.
- Ho tro room rieng qua `roomId`.
- Ho tro event `joinRoom` de chuyen room.
- Ho tro event `move` voi cac huong `up`, `down`, `left`, `right`.
- Server gioi han vi tri player trong map.
- Server spawn player theo danh sach spawn point mac dinh.
- Server broadcast `worldUpdate` theo tung room moi `50ms`.
- Co event `ping`/`pong` de test ket noi realtime.
- Co unit test cho `GameStateService`.

## Cau truc thu muc

```text
src/
├── core/          # App-wide infrastructure: auth, config, redis, mail, database providers
├── common/        # Generic reusable utilities: pipes, decorators, filters, types
├── integrations/  # External/internal service wrappers: Stripe, AWS, Firebase, APIs
├── modules/       # Domain-driven modules
│   └── game/      # Realtime game module
├── events/        # Domain event publishers/listeners
├── commands/      # CLI jobs, CRON logic, workers, maintenance tasks
├── app.module.ts  # Root NestJS module
└── main.ts        # Application bootstrap
```

## Game module

```text
src/modules/game/
├── constants/
│   └── game.constants.ts
├── dto/
│   ├── join-room.dto.ts
│   └── move-input.dto.ts
├── gateways/
│   └── game.gateway.ts
├── models/
│   ├── player.model.ts
│   ├── room.model.ts
│   ├── spawn-point.model.ts
│   └── vector.model.ts
├── services/
│   ├── game-state.service.ts
│   └── game-state.service.spec.ts
└── game.module.ts
```

### `GameGateway`

`GameGateway` la lop giao tiep realtime voi client. Lop nay lang nghe Socket.IO events, goi `GameStateService` de xu ly logic va emit ket qua ve client.

Nhiem vu chinh:

- Xu ly client connect/disconnect.
- Cho player join Socket.IO room.
- Nhan event `joinRoom`.
- Nhan event `move`.
- Broadcast `worldUpdate` moi game tick.
- Phan hoi `ping` bang `pong`.

### `GameStateService`

`GameStateService` la lop quan ly game state trong memory.

Nhiem vu chinh:

- Luu danh sach room bang `Map<string, GameRoom>`.
- Luu player dang o room nao bang `Map<string, string>`.
- Tao player moi khi client connect.
- Xoa player khi client disconnect.
- Chuyen player giua cac room.
- Di chuyen player theo direction.
- Clamp vi tri player trong map.
- Tao world snapshot de gateway gui ve client.
- Quan ly spawn point va spawn cursor cua tung room.

## Socket.IO events

### Client -> Server

#### `joinRoom`

Cho player vao room moi hoac cap nhat ten player.

```json
{
  "roomId": "arena-1",
  "name": "PlayerName"
}
```

Server se emit lai `roomJoined` cho client vua join.

#### `move`

Di chuyen player.

```json
{
  "direction": "right"
}
```

Gia tri hop le cua `direction`:

- `up`
- `down`
- `left`
- `right`

#### `ping`

Dung de test ket noi.

```json
{
  "message": "hello"
}
```

### Server -> Client

#### `roomJoined`

Tra ve sau khi player join room thanh cong.

```json
{
  "roomId": "arena-1",
  "player": {
    "id": "socket-id",
    "name": "PlayerName",
    "position": { "x": 40, "y": -40 },
    "hp": 100,
    "status": "alive",
    "joinedAt": 1710000000000
  }
}
```

#### `worldUpdate`

Duoc server broadcast moi `50ms` cho tung room.

```json
{
  "roomId": "arena-1",
  "tick": 1,
  "players": [
    {
      "id": "socket-id",
      "name": "PlayerName",
      "position": { "x": 41, "y": -40 },
      "hp": 100,
      "status": "alive"
    }
  ],
  "spawnPoints": [
    { "id": "spawn-1", "position": { "x": 40, "y": -40 } }
  ]
}
```

#### `pong`

Tra ve khi client gui `ping`.

```json
{
  "serverTime": 1710000000000
}
```

## Game constants

Gia tri cau hinh hien tai nam trong `src/modules/game/constants/game.constants.ts`.

- Game tick: `50ms`
- Map X: tu `-50` den `80`
- Map Y: tu `-50` den `50`
- Move speed: `1`
- Default HP: `100`
- Default room: `lobby`
- Max player name length: `20`
- Max room id length: `40`

## Cai dat

```bash
npm install
```

## Chay local

```bash
npm run start:dev
```

Server mac dinh chay tai:

```text
http://localhost:3000
```

Co the doi port bang bien moi truong:

```bash
PORT=4000 npm run start:dev
```

## Chay bang Docker

Build image:

```bash
npm run docker:build
```

Chay server va PostgreSQL:

```bash
npm run docker:up
```

Dung container:

```bash
npm run docker:down
```

Docker Compose se chay:

- Game server tai port `3000`
- PostgreSQL expose ra may host tai port `5433`

## Test

Chay unit test:

```bash
npm test
```

Chay test coverage:

```bash
npm run test:cov
```

Chay build:

```bash
npm run build
```

## Design patterns dang ap dung

- Modular Architecture: game logic nam trong `GameModule`.
- Service Layer: `GameStateService` xu ly business logic, gateway chi xu ly realtime transport.
- DTO Pattern: `JoinRoomDto` va `MoveInputDto` mo ta input tu client.
- Model Pattern: `Player`, `GameRoom`, `Vector2`, `SpawnPoint` mo ta domain data.
- Constants Pattern: event names va game settings duoc gom vao mot file rieng.
- Dependency Injection: NestJS inject `GameStateService` vao `GameGateway`.

## Huong phat trien tiep theo

- Them validation cho DTO.
- Them authentication cho player.
- Luu player/room/match vao database.
- Them Redis adapter cho Socket.IO neu chay nhieu server instance.
- Them combat, collision, item, leaderboard hoac matchmaking.
- Tach game loop nang cao hon neu logic realtime phuc tap hon.
