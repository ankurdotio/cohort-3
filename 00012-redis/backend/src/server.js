import cluster from "node:cluster";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Primary process: forks one worker per CPU core (or `WEB_CONCURRENCY`), restarts
 * workers that crash after starting, and coordinates graceful shutdown.
 * @returns {void}
 */
const startPrimary = () => {
  let shuttingDown = false;
  console.log(`Primary ${process.pid} starting ${env.WEB_CONCURRENCY} workers`);

  /** Worker ids that reached the listening state; failures before that are fatal. */
  const ready = new Set();

  for (let i = 0; i < env.WEB_CONCURRENCY; i += 1) cluster.fork();

  cluster.on("listening", (worker) => ready.add(worker.id));

  cluster.on("exit", (worker, code, signal) => {
    const wasReady = ready.delete(worker.id);
    if (shuttingDown) {
      if (Object.keys(cluster.workers ?? {}).length === 0) process.exit(0);
      return;
    }

    if (!wasReady) {
      console.error(`Worker ${worker.process.pid} failed during startup (code ${code}); shutting down`);
      shutdown(1);
      return;
    }

    console.warn(`Worker ${worker.process.pid} died (${signal ?? code}); starting a replacement`);
    cluster.fork();
  });

  /**
   * Asks every worker to stop, then exits once they have.
   * @param {number} [exitCode=0] - Exit code used if workers do not stop in time.
   * @returns {void}
   */
  const shutdown = (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Primary ${process.pid} shutting down workers`);

    const workers = Object.values(cluster.workers ?? {});
    if (workers.length === 0) process.exit(exitCode);
    for (const worker of workers) worker?.process.kill("SIGTERM");

    setTimeout(() => process.exit(exitCode || 1), SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
};

/**
 * Worker process: connects to MongoDB, serves HTTP on the shared port, and
 * closes connections gracefully on SIGTERM/SIGINT.
 * @returns {Promise<void>}
 */
const startWorker = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`Worker ${process.pid} failed to connect to MongoDB:`, error);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    server.closeIdleConnections();
  };

  process.on("SIGTERM", close);
  // Ctrl+C is delivered to the whole process group; let the primary drive shutdown.
  process.on("SIGINT", () => {});
};

if (cluster.isPrimary) {
  startPrimary();
} else {
  startWorker();
}
