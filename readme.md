# Pulse Chat Backend

Realtime backend for the Pulse Chat application, built with Express, WebSocket, MongoDB, and Zod.

## Live Deployment

Backend is deployed at:

- `https://api.pulse-chat.live`

Production endpoints:

- Health: `https://api.pulse-chat.live/api/v1/health`
- Messages: `https://api.pulse-chat.live/api/v1/messages/:roomId`

## Features

- Realtime room-based chat over WebSocket
- REST endpoint to fetch room message history
- Input validation with Zod
- MongoDB persistence with Mongoose
- CORS protection configured via environment variable
- Health-check endpoint for uptime checks

## Tech Stack

- Node.js
- TypeScript
- Express
- ws (WebSocket)
- MongoDB + Mongoose
- Zod
- dotenv

## Project Structure

```text
src/
	db.ts           # Mongoose model
	index.ts        # Express + WebSocket server entry
	inputSchema.ts  # Zod request/message schemas
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB instance (local or cloud)

## Environment Variables

Create a `.env` file in the backend root:

```env
MONGODB_URI=mongodb://localhost:27017/chat_app
FRONTEND_URL=http://localhost:5173
PORT=4000
```

### Variable Notes

- `MONGODB_URI`: MongoDB connection string used by Mongoose
- `FRONTEND_URL`: Allowed browser origin for CORS
- `PORT`: Server port (defaults to `4000` if omitted)

## Install Dependencies

```bash
npm install
```

## Available Scripts

- `npm run build`: Compile TypeScript into `dist/`
- `npm run start`: Run compiled backend from `dist/index.js`
- `npm run dev`: Watch TypeScript files and recompile on change

## Run the Backend

```bash
npm run build
npm run start
```

Server URL (default):

- `http://localhost:4000`

## REST API

### Health

- Method: `GET`
- Route: `/api/v1/health`

Response:

```json
{
    "success": true,
    "status": "ok"
}
```

### Get Messages by Room

- Method: `GET`
- Route: `/api/v1/messages/:roomId`

Success response:

```json
{
    "success": true,
    "messages": [
        {
            "_id": "67da1234abcd...",
            "username": "Alya",
            "message": "Hello",
            "createdAt": "2026-03-19T12:40:00.000Z"
        }
    ]
}
```

Error response:

```json
{
    "success": false,
    "message": "Invalid roomId"
}
```

## WebSocket Contract

Connect to:

- `ws://localhost:4000`

### Client -> Server: Join Room

```json
{
    "type": "join",
    "payload": {
        "roomId": "ABC123",
        "username": "Alya"
    }
}
```

### Client -> Server: Send Message

```json
{
    "type": "chat",
    "payload": {
        "roomId": "ABC123",
        "message": "Hi everyone"
    }
}
```

### Client -> Server: Leave Room

```json
{
    "type": "leave",
    "payload": {
        "roomId": "ABC123",
        "username": "Alya"
    }
}
```

### Server -> Client: Chat Broadcast

```json
{
    "type": "chat",
    "payload": {
        "_id": "67da1234abcd...",
        "roomId": "ABC123",
        "username": "Alya",
        "message": "Hi everyone",
        "createdAt": "2026-03-19T12:42:10.000Z"
    }
}
```

### Server -> Client: Validation Error

```json
{
    "type": "error",
    "message": "Invalid message format"
}
```

## Validation Rules

- `roomId` must be a string
- `username` must be a string
- `chat.message` must be a non-empty trimmed string

## Quick Local Test Flow

1. Start MongoDB.
2. Start backend with `npm run build && npm run start`.
3. Open frontend app (or WebSocket client) and join a room.
4. Send messages and verify realtime broadcast.
5. Hit `GET /api/v1/messages/:roomId` to verify persistence.

## Troubleshooting

- If MongoDB fails to connect, check `MONGODB_URI`.
- If browser requests fail with CORS, verify `FRONTEND_URL`.
- If WebSocket fails, confirm frontend uses `ws://` URL and correct port.
- If room history is empty, ensure clients joined the same room code.
