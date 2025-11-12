// models/Call.js
import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // optional link
  status: { type: String, enum: ["ringing","ongoing","ended","missed","rejected"], default: "ringing" },
  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number,
}, { timestamps: true, collection: "CALLS" });

export default mongoose.models.Call || mongoose.model("Call", callSchema);
