import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    room: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
    socket.on("message", (message: string) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === "join") {
            allSockets.push({
                socket,
                room: parsedMessage.payload.roomId,
            });
        }
        if (parsedMessage.type === "chat") {
            const currUserRoom = allSockets.find(
                (x) => x.socket === socket,
            )?.room;

            allSockets.forEach((s) => {
                if (s.room === currUserRoom) {
                    s.socket.send(parsedMessage.payload.message);
                }
            });
        }
    });
    socket.on("close", () => {
        allSockets = allSockets.filter((x) => x.socket !== socket);
        console.log("User disconnected");
    });
});
