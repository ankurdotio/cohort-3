// The ONLY place that reads process.env.
// Every other file does: const env = require("../config/env");
require("dotenv").config({ quiet: true });

// Reads a positive whole number, or returns the fallback
function readCount(name, fallback) {
  const value = parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  MONGO_URI: process.env.MONGO_URI,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",

  // Only used by the seed script
  CUSTOMER_COUNT: readCount("CUSTOMER_COUNT", 900000),
  OWNER_COUNT: readCount("OWNER_COUNT", 100000),
  RESTAURANT_COUNT: readCount("RESTAURANT_COUNT", 1000000),
  ORDER_COUNT: readCount("ORDER_COUNT", 10000000),
  REVIEW_COUNT: readCount("REVIEW_COUNT", 2000000),
  SEED_END_DATE: process.env.SEED_END_DATE || "",
};

// Freeze so no file can change a setting by accident
module.exports = Object.freeze(env);
