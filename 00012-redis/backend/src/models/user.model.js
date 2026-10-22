import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/**
 * Compares a plain-text password with the stored hash.
 * Requires the document to have been loaded with `+password`.
 * @param {string} candidate - Plain-text password.
 * @returns {Promise<boolean>} Whether the password matches.
 */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.model("User", userSchema);
