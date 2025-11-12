
import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/Messages.js";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { userId, tutorId } = req.body;
    if (!userId || !tutorId) return res.status(400).json({ message: "Both userId and tutorId are required" });

    let chat = await Chat.findOne({ users: { $all: [userId, tutorId] } });
    if (!chat) {
      chat = new Chat({ users: [userId, tutorId] });
      await chat.save();
    }

    res.status(200).json({ message: "Chat room created successfully", chat });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post("/send", async (req, res) => {
  try {
    const { chatId, senderId, receiverId, message, type } = req.body;
    if (!chatId || !senderId || !receiverId || !message) return res.status(400).json({ message: "All fields are required" });

    const newMessage = new Message({ chatId, senderId, receiverId, message, type: type || "text" });
    await newMessage.save();

    res.status(200).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/messages/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ users: userId }).populate("users", "name email");
    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
