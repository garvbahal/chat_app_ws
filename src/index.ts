import mongoose from "mongoose";
import { WebSocketServer, WebSocket } from "ws";
import { Message } from "./db.js";
import express from "express";
import http from "http";
import cors from "cors";
import { messageSchema, roomSchema } from "./inputSchema.js";
const app = express();
import "dotenv/config";

const server = http.createServer(app);
app.use(express.json());

const frontend_url = process.env.FRONTEND_URL;
if (!frontend_url) {
    throw new Error("Frontend url is missing from .env file");
}

app.use(
    cors({
        origin: [frontend_url],
        methods: ["GET", "POST"],
        credentials: true,
    }),
);

const wss = new WebSocketServer({ server });
app.get("/api/v1/messages/:roomId", async (req, res) => {
    try {
        console.log("Request hit");
        const { success, data } = roomSchema.safeParse(req.params);
        console.log("Params: ", req.params);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: "Invalid roomId",
            });
        }
        const roomId = data.roomId;
        console.log("Room id: ", roomId);

        const messages = await Message.find({
            roomId: roomId,
        })
            .sort({ createdAt: 1 })
            .select("username createdAt message");

        console.log("Messages fetched: ", messages);

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

app.get("/api/v1/health", (req, res) => {
    return res.status(200).json({
        success: true,
        status: "ok",
    });
});

interface User {
    socket: WebSocket;
    roomId: string;
    username: string;
}
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error("MONGO DB URI is missing in .env");
}

mongoose
    .connect(mongoUri)
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

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`App started at ${PORT} port`);
});
