// socket/videoSocket.js
import Call from "../models/call.js";

export default function handleVideoSocket(io) {
  io.on("connection", (socket) => {
    console.log("✅ User connected for video:", socket.id);

    // User joins a chat room
    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
      console.log(`📞 User ${socket.id} joined room: ${chatId}`);
    });

    // Send offer (caller -> receiver)
    socket.on("sendOffer", async ({ chatId, callerId, receiverId, offer }) => {
      console.log("🎥 Offer received:", { chatId, callerId, receiverId });
      const call = new Call({
        chatId,
        callerId,
        receiverId,
        offer,
        status: "pending",
        createdAt: new Date(),
      });
      await call.save();

      // Notify the receiver
      io.to(chatId).emit("receiveOffer", { callerId, offer });
    });

    // Send answer (receiver -> caller)
    socket.on("sendAnswer", async ({ chatId, answer }) => {
      console.log("🎥 Answer received for:", chatId);
      io.to(chatId).emit("receiveAnswer", { answer });

      // Optional: update DB call status
      await Call.findOneAndUpdate({ chatId }, { answer, status: "connected" });
    });

    // Send ICE candidates (both sides)
    socket.on("sendCandidate", ({ chatId, candidate }) => {
      io.to(chatId).emit("receiveCandidate", { candidate });
    });

    // End call
    socket.on("endCall", async ({ chatId }) => {
      io.to(chatId).emit("callEnded");
      await Call.findOneAndUpdate({ chatId }, { status: "ended" });
      console.log(`📴 Call ended for room: ${chatId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected from video:", socket.id);
    });
  });
}
