import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.patch("/update-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { age, gender, country, bio } = req.body;

    const updated = await User.findOneAndUpdate(
      { userId },
      { $set: { age, gender, country, bio } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
