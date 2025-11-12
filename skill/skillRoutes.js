import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config(); 

const JWT_SECRET = process.env.JWT_SECRET;



const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI); 

router.post("/add-skill", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { skillName, proficiency } = req.body;
    if (!skillName) return res.status(400).json({ message: "Skill required" });

    const skillExists = user.skills.some(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (skillExists)
      return res.status(400).json({ message: "Skill already exists" });

    user.skills.push({
      name: skillName,
      proficiency: proficiency || 0,
      verified: false,
    });
    await user.save();

    res.status(200).json({
      message: "Skill added successfully",
      skills: user.skills,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/generate-quiz", async (req, res) => {
  try {
    const { skillName } = req.body;
    if (!skillName)
      return res.status(400).json({ message: "Skill name required" });

    const prompt = `
    Generate a 20-question multiple-choice quiz to test basic to intermediate understanding of ${skillName}.
    Each question should have 4 options and indicate the correct answer in valid JSON array only.
    Respond ONLY with JSON, no extra text or markdown.
    Format:
    [
      {"question": "...", "options": ["A","B","C","D"], "answer": "B", "complexity": "medium"}
    ]
    `;

    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });


    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text().trim();


    if (content.startsWith("```json")) content = content.replace(/```json|```/g, "");
    if (content.startsWith("```")) content = content.replace(/```/g, "");

    let quiz;
    try {
      quiz = JSON.parse(content);
    } catch (err) {
      console.error("⚠️ JSON parse error:", err.message);
      console.error("Raw content:", content);
      return res.status(500).json({
        message: "Invalid JSON from Gemini",
        raw: content,
      });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error("❌ Error generating quiz:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
router.post("/update-skill-proficiency", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader)
      return res.status(401).json({ message: "No authorization token" });

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { skillName, proficiency } = req.body;
    if (!skillName)
      return res.status(400).json({ message: "Skill name is required" });

    const skillIndex = user.skills.findIndex(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (skillIndex === -1) {
      // Skill not found → add new
      user.skills.push({ name: skillName, proficiency });
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Skill added successfully",
        skills: user.skills,
      });
    }

    user.skills[skillIndex].proficiency = proficiency;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Skill proficiency updated successfully",
      skills: user.skills,
    });
  } catch (error) {
    console.error("❌ Error updating proficiency:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
