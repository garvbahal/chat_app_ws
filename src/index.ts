import mongoose from "mongoose";
import { WebSocketServer, WebSocket } from "ws";
import { Message } from "./db.js";
import express from "express";
import http from "http";
import cors from "cors";
import { messageSchema, roomSchema } from "./inputSchema.js";
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());

const wss = new WebSocketServer({ server });
app.get("/api/v1/messages/:roomId", async (req, res) => {
    try {
        const { success, data } = roomSchema.safeParse(req.params);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: "Invalid roomId",
            });
        }
        const roomId = data.roomId;

        const messages = await Message.find({
            roomId: roomId,
        })
            .sort({ createdAt: 1 })
            .select("username createdAt message");

        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching the messages",
        });
    }
});

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
        let parsedJSON: unknown;
        try {
            parsedJSON = JSON.parse(message);
        } catch (error) {
            socket.send(
                JSON.stringify({
                    type: "error",
                    message: "Invalid JSON",
                }),
            );
            return;
        }
        const { success, data } = messageSchema.safeParse(parsedJSON);
        if (!success) {
            return socket.send(
                JSON.stringify({
                    type: "error",
                    message: "Invalid message format",
                }),
            );
        }
        const parsedMessage = data;
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

server.listen(3000, () => {
    console.log(`App started at 3000 port`);
});
