const mongoose = require("mongoose");

// NOTE: no indexes in any model on purpose (no unique, no index: true).
// Duplicate emails are checked in the register controller instead.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "owner"], default: "customer" },
    city: { type: String, trim: true },
    // bcrypt hash of the user's current refresh token (null when logged out)
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("User", userSchema);
