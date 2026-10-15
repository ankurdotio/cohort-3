import mongoose from 'mongoose';
import { env } from './env.js';

/** Connect to MongoDB before accepting HTTP traffic. @returns {Promise<void>} */
export async function connectDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
}
