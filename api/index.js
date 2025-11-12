// api/index.js
import serverless from "serverless-http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// If you need dotenv locally, it's harmless on Vercel, but optional.
// import dotenv from "dotenv";
// dotenv.config();

// ---- Lazy DB connector (won't crash module on import)
let connPromise = null;
async function ensureDb() {
  if (!connPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      // Don't throw at import-time; throw inside handler so you see a clean 500 with message
      throw new Error("MONGO_URI is not set");
    }
    connPromise = mongoose
      .connect(uri, { dbName: "skillswap" })
      .then(() => {
        console.log("✅ MongoDB connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err?.message || err);
        // Re-throw so request fails fast with a message
        throw err;
      });
  }
  return connPromise;
}

const app = express();
app.use(express.json());

// ---- CORS (allow mobile apps and no-origin requests)
const allowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
  : ["*"];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes("*") || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed from: " + origin));
    },
  })
);

// ---- Ensure DB per request (first hit will connect)
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (e) {
    console.error("DB init failed:", e?.message || e);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ---- Your routes
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";
import chatRoutes from "../chat/chatRoute.js";
import videoRoutes from "../chat/videoRoutes.js";

app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes);

app.get("/", (req, res) => {
  res.send("🚀 SkillSwap API is up on Vercel.");
});

// ✅ Vercel needs a *default* export (not a named one)
export default serverless(app);
