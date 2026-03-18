import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
    },
    username: {
        type: String,
    },
    message: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Message = mongoose.model("Message", messageSchema);
