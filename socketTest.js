import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // ✅ correct port

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  // Join a chat room
  socket.emit("joinRoom", "room123");

  // Send a message
  socket.emit("sendMessage", {
    roomId: "room123",
    senderId: "user1",
    receiverId: "user2",
    message: "Hey Lilly 💕 how are you?",
  });
});

// Receive messages
socket.on("receiveMessage", (msg) => {
  console.log("💬 New message:", msg);
});
