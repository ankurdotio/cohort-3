import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

/**
 * Converts express-validator results into a 422 AppError.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} _res - Express response.
 * @param {import("express").NextFunction} next - Next callback.
 * @returns {void}
 * @throws {AppError} 422 when validation fails.
 */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  /** @type {import("../types/api.js").ApiFieldError[]} */
  const fieldErrors = [];
  const seen = new Set();
  for (const err of result.array()) {
    const field = err.type === "field" ? err.path : err.type;
    if (seen.has(field)) continue;
    seen.add(field);
    fieldErrors.push({ field, message: String(err.msg) });
  }
  throw new AppError(422, "Validation failed", fieldErrors);
};
