// models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true, collection: "CHATS" }
);

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);
