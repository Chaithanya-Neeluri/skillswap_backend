// api/index.js (temporary minimal test)
import express from "express";
import serverless from "serverless-http";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("✅ Minimal health check OK");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

export default serverless(app);
