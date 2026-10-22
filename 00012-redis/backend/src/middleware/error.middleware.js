import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

/** @typedef {import("../types/api.js").ApiError} ApiError */
/** @typedef {import("../types/api.js").ApiFieldError} ApiFieldError */

/**
 * Centralized error handler; the only place failure responses are written.
 * @param {any} err - Thrown error.
 * @param {import("express").Request} _req - Express request.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} _next - Next callback (required for Express to detect an error handler).
 * @returns {import("express").Response} The failure response.
 */
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  /** @type {ApiFieldError[]} */
  let errors = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? "unknown";
    statusCode = 409;
    message = "Duplicate value";
    errors = [{ field, message: `${field} already exists` }];
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid value";
    errors = [{ field: String(err.path), message: `Invalid ${err.path}` }];
  } else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON body";
  } else {
    console.error(err);
  }

  /** @type {ApiError} */
  const body = { success: false, message, errors };
  if (!env.isProduction && err?.stack) body.stack = err.stack;

  return res.status(statusCode).json(body);
};
