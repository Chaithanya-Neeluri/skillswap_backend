// api/index.js
import serverless from "serverless-http";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Import your route modules (adjust paths if needed)
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";
import chatRoutes from "../chat/chatRoute.js";
import videoRoutes from "../chat/videoRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Configure CORS using ALLOWED_ORIGINS env var (comma-separated)
const allowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
  : ["*"];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowed.includes("*") || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed from origin: " + origin));
    }
  }
}));

// MongoDB connection caching (avoid reconnecting on every invocation)
let cached = global.__mongoosePromise;
if (!cached) {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in environment");
  } else {
    cached = mongoose.connect(process.env.MONGO_URI, {
      dbName: "skillswap",
      // any other recommended mongoose options
    }).then(m => {
      console.log("✅ MongoDB Connected (serverless cached connection)");
      return m;
    }).catch(err => {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    });
    global.__mongoosePromise = cached;
  }
}

// Use your routes
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);       // note: chat routes that require sockets may need changes
app.use("/api/video", videoRoutes);     // video routes that depend on sockets need an external socket server

app.get("/", (req, res) => {
  res.json({ message: "🚀 SkillSwap API (Vercel serverless) is running" });
});

// Export handler for Vercel
export const handler = serverless(app);
