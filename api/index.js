// api/index.js
import express from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";
import cors from "cors";

// --------------------
// ✅ Safe DB Connect (no top-level await)
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

// ✅ Middleware to ensure DB for each request (safe + fast)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connect failed:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Test root route
app.get("/", async (req, res) => {
  res.status(200).send("🚀 SkillSwap API running perfectly on Vercel!");
});

// ✅ Health check
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: mongoose.connection.readyState === 1,
    mongo: states[mongoose.connection.readyState],
    time: new Date().toISOString(),
  });
});

// ✅ Import other routes (after DB ready)
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";

app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// ✅ Export for Vercel
export default serverless(app);
