import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

/**
 * Connects to MongoDB, then starts the HTTP server.
 * @returns {Promise<void>}
 */
const start = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
