import express from "express";
import mongoose from "mongoose";

const router = express.Router();


const User =
  mongoose.models.User ||
  mongoose.model("User", new mongoose.Schema({}, { strict: false }), "USERS");

router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i"); 

    const tutors = await User.find({
      $or: [{ name: { $regex: regex } }, { "skills.name": { $regex: regex } }],
    });

    if (!tutors || tutors.length === 0) {
      return res.status(404).json({ message: "No tutors found" });
    }

    res.status(200).json({
      message: "Tutors found",
      count: tutors.length,
      tutors,
    });
  } catch (error) {
    console.error("❌ Error searching tutors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
