import express from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";
import cors from "cors";

// --------------------
// ✅ Safe DB Connect (Your code is good!)
// --------------------
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("❌ MONGO_URI missing");
    cached.promise = mongoose
      .connect(uri, { dbName: "skillswap" })
      .then((m) => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        console.error("❌ Mongo connection error:", err.message);
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --------------------
// ✅ Express App Setup
// --------------------
const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// --------------------
// ❌ REMOVED
// --------------------
// DO NOT use global DB connection middleware.
// This blocks simple routes and causes Vercel timeouts.
// app.use(async (req, res, next) => { ... });

// --------------------
// ✨ NEW: DB Connection Middleware
// --------------------
// We will apply this middleware ONLY to routes that need the database
const ensureDbConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connect failed:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
};

// --------------------
// ✅ Public Routes (No DB required)
// --------------------
// These routes respond instantly, making Vercel deployment checks pass.
app.get("/", (req, res) => {
  res.status(200).send("🚀 SkillSwap API running perfectly on Vercel!");
});

app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: mongoose.connection.readyState === 1,
    mongo: states[mongoose.connection.readyState],
    time: new Date().toISOString(),
  });
});

// --------------------
// ✅ API Routes (DB connection IS required)
// --------------------
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";

// Apply the 'ensureDbConnection' middleware to all API routes
app.use("/api/users", ensureDbConnection, userRoutes);
app.use("/api/profile", ensureDbConnection, profileRoutes);
app.use("/api/skill", ensureDbConnection, skillRoutes);
app.use("/api/search", ensureDbConnection, searchRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// ✅ Export for Vercel
export default serverless(app);