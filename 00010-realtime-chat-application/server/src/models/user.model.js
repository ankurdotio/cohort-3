import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

/** Compare a plaintext password with the stored hash. @param {string} password @returns {Promise<boolean>} */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const UserModel = mongoose.model('User', userSchema);
