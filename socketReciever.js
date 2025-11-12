// socketTestReceiver.js
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

socket.emit("joinRoom", "room123");

socket.on("receiveOffer", ({ callerId, offer }) => {
  console.log("Got offer:", offer);
  socket.emit("sendAnswer", {
    chatId: "room123",
    answer: { sdp: "fake-answer", type: "answer" },
  });
});
