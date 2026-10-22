/**
 * Operational error carrying an HTTP status and optional field errors.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code.
   * @param {string} message - Client-safe message.
   * @param {import("../types/api.js").ApiFieldError[]} [errors=[]] - Field-level errors.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
