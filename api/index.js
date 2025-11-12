// api/index.js
import serverless from "serverless-http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

let connPromise = null;
async function ensureDb() {
  if (!connPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
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

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (e) {
    console.error("DB init failed:", e?.message || e);
    res.status(500).json({ error: "Database connection failed" });
  }
});

import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";


app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.send("🚀 SkillSwap API is up on Vercel.");
});

export default serverless(app);
