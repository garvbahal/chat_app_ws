import { z } from "zod";

const joinSchema = z.object({
    type: z.literal("join"),
    payload: z.object({
        roomId: z.string(),
        username: z.string(),
    }),
});

const chatSchema = z.object({
    type: z.literal("chat"),
    payload: z.object({
        roomId: z.string(),
        message: z.string().trim().min(1, "Message cannot be empty"),
    }),
});

const leaveRoomSchema = z.object({
    type: z.literal("leave"),
    payload: z.object({
        roomId: z.string(),
        username: z.string(),
    }),
});

export const roomSchema = z.object({
    roomId: z.string(),
});

export const messageSchema = z.union([joinSchema, chatSchema, leaveRoomSchema]);
