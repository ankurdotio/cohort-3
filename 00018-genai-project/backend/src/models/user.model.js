import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  refreshToken: { type: String, default: null, select: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});

/**
 * @param {string} candidate Plaintext password to compare.
 * @returns {Promise<boolean>} Whether the password matches.
 */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = mongoose.model('User', userSchema);
