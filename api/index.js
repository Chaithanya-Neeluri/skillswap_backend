// api/index.js
import serverless from "serverless-http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// ✅ Lazy DB connection with cache
let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("❌ MONGO_URI not set in env");
    cached.promise = mongoose
      .connect(uri, { dbName: "skillswap" })
      .then((mongoose) => {
        console.log("✅ MongoDB connected (cached)");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// ✅ Middleware ensures DB but doesn’t hang
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connect failed:", err.message);
    return res.status(500).json({ error: "DB connection failed" });
  }
});

// ✅ Import routes safely
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";

// ✅ Apply routes
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);

// ✅ Health route
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

// ✅ Root route (simple, instant)
app.get("/", (req, res) => {
  res.status(200).send("🚀 SkillSwap API running successfully on Vercel!");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message,
  });
});

// ✅ Must export *default*
export default serverless(app);
