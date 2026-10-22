import { AppError } from "../utils/AppError.js";

/**
 * Handles unmatched routes.
 * @param {import("express").Request} _req - Express request.
 * @param {import("express").Response} _res - Express response.
 * @param {import("express").NextFunction} _next - Next callback.
 * @returns {never}
 * @throws {AppError} Always 404.
 */
export const notFound = (_req, _res, _next) => {
  throw new AppError(404, "Route not found");
};
