import "dotenv/config";
import os from "node:os";

const REQUIRED = ["MONGODB_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
const NODE_ENVS = ["development", "production", "test"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const nodeEnv = process.env.NODE_ENV ?? "development";
if (!NODE_ENVS.includes(nodeEnv)) {
  throw new Error(`NODE_ENV must be one of: ${NODE_ENVS.join(", ")}`);
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const MAX_WORKERS = 5;
const requestedConcurrency = Number(process.env.WEB_CONCURRENCY ?? os.availableParallelism());
if (!Number.isInteger(requestedConcurrency) || requestedConcurrency <= 0) {
  throw new Error("WEB_CONCURRENCY must be a positive integer");
}
const webConcurrency = Math.min(requestedConcurrency, MAX_WORKERS);

if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must differ");
}


/**
 * Validated, immutable application configuration.
 * @type {Readonly<{
 *   PORT: number,
 *   WEB_CONCURRENCY: number,
 *   NODE_ENV: "development" | "production" | "test",
 *   MONGODB_URI: string,
 *   ACCESS_TOKEN_SECRET: string,
 *   REFRESH_TOKEN_SECRET: string,
 *   isProduction: boolean
 * }>}
 */
export const env = Object.freeze({
  PORT: port,
  WEB_CONCURRENCY: webConcurrency,
  NODE_ENV: /** @type {"development" | "production" | "test"} */ (nodeEnv),
  MONGODB_URI: /** @type {string} */ (process.env.MONGODB_URI),
  ACCESS_TOKEN_SECRET: /** @type {string} */ (process.env.ACCESS_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: /** @type {string} */ (process.env.REFRESH_TOKEN_SECRET),
  isProduction: nodeEnv === "production",
});
