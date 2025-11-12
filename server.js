import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";


import userRoutes from "./auth/userRoutes.js";
import profileRoutes from "./profile/profileRoutes.js";
import skillRoutes from "./skill/skillRoutes.js";
import searchRoutes from "./searchForTutor/search.js";
import chatRoutes from "./chat/chatRoute.js";
import videoRoutes from "./chat/videoRoutes.js";

import handleVideoSocket from "./socket/videoSocket.js"; 

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());


const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { dbName: "skillswap" })
  .then(() => console.log("✅ MongoDB Connected to 'skillswap' database"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes); 


app.get("/", (req, res) => {
  res.send("🚀 SkillSwap API is running successfully!");
});

// ✅ Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
