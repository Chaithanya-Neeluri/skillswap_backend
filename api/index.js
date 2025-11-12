// api/index.js
import express from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";
import cors from "cors";

// --------------------
// ✅ Mongoose Setup
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
    if (!uri) throw new Error("❌ MONGO_URI missing in environment");
    cached.promise = mongoose
      .connect(uri, { dbName: "skillswap" })
      .then((m) => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        console.error("❌ Mongo connection failed:", err.message);
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --------------------
// ✅ Express Setup
// --------------------
const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Run DB connect once at cold start (not inside every request)
await connectDB().catch((e) => console.error("Startup DB connect error:", e));

// --------------------
// ✅ Routes
// --------------------
app.get("/", (req, res) => {
  res.status(200).send("🚀 SkillSwap API running perfectly on Vercel!");
});

app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: state === 1,
    state: states[state],
    time: new Date().toISOString(),
  });
});

// Import routes *after* connection is ready
import userRoutes from "../auth/userRoutes.js";
import profileRoutes from "../profile/profileRoutes.js";
import skillRoutes from "../skill/skillRoutes.js";
import searchRoutes from "../searchForTutor/search.js";

app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/search", searchRoutes);

// --------------------
// ✅ Global Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err?.message });
});

// --------------------
// ✅ Export for Vercel
// --------------------
export default serverless(app);
