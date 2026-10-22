import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB using the configured URI.
 * @returns {Promise<typeof mongoose>} The connected mongoose instance.
 * @throws {Error} When the connection cannot be established.
 */
export const connectDB = async () => {
  const connection = await mongoose.connect(env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};
