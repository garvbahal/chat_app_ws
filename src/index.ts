import mongoose from "mongoose";
import { WebSocketServer, WebSocket } from "ws";
import { Message } from "./db.js";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    roomId: string;
    username: string;
}

mongoose
    .connect(`mongodb://localhost:27017/chat_app`)
    .then(() => console.log("DB connection successfull"))
    .catch((err) => console.log(err));

let allSockets: User[] = [];

wss.on("connection", (socket) => {
    socket.on("message", async (message: string) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === "join") {
            allSockets = allSockets.filter((s) => s.socket !== socket);

            allSockets.push({
                socket,
                roomId: parsedMessage.payload.roomId,
                username: parsedMessage.payload.username,
            });
        }

        if (parsedMessage.type === "chat") {
            const user = allSockets.find((s) => s.socket === socket);
            if (!user) return;

            const payload = {
                message: parsedMessage.payload.message,
                roomId: user?.roomId,
                username: user?.username,
            };

            const savedMessage = await Message.create({
                message: payload.message,
                roomId: payload.roomId,
                username: payload.username,
            });

            const obj = {
                type: "chat",
                payload: {
                    ...savedMessage.toObject(),
                },
            };

            allSockets.forEach((s) => {
                if (s.roomId === user?.roomId) {
                    s.socket.send(JSON.stringify(obj));
                }
            });
        }

        if (parsedMessage.type === "leave") {
            allSockets = allSockets.filter((s) => s.socket !== socket);
        }
    });
    socket.on("close", () => {
        allSockets = allSockets.filter((x) => x.socket !== socket);
        console.log("User disconnected");
    });
});
