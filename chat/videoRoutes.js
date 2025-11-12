// routes/videoRoutes.js
import express from "express";
import Call from "../models/call.js";

const router = express.Router();


router.post("/start-call", async (req, res) => {
  try {
    const { callerId, receiverId, chatId, offer } = req.body;

    
    if (!callerId || !receiverId || !chatId || !offer) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const call = new Call({
      callerId,
      receiverId,
      chatId,
      offer,
      status: "pending",
      createdAt: new Date(),
    });

    await call.save();
    res.status(201).json({ message: "Call created successfully", call });
  } catch (err) {
    console.error("Error creating call:", err);
    res.status(500).json({ message: err.message });
  }
});


router.get("/:callId", async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
