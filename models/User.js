import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: String,
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    country: String,
    bio: String,
    skills: [
      {
        name: String,
        proficiency: Number,
        verified: Boolean,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    coins: { type: Number, default: 100 },
    availability: [String],
    rating: { type: Number, default: 0 },
  },
  {
    collection: "USERS",
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
