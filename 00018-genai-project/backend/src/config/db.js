import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect before accepting requests; wait for declared indexes, including unique email.
 * @returns {Promise<void>}
 * @throws {Error} When MongoDB is unavailable or index creation fails.
 */
export async function connectDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

/** @returns {Promise<void>} Close the database connection during shutdown. */
export async function disconnectDB() {
  await mongoose.disconnect();
}
