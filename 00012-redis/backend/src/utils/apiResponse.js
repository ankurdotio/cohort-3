/**
 * Sends a standard success envelope.
 * @template T
 * @param {import("express").Response} res - Express response.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Human-readable message.
 * @param {T} [data] - Payload; defaults to `{}`.
 * @returns {import("express").Response} The response.
 */
export const sendSuccess = (res, statusCode, message, data) => {
  /** @type {import("../types/api.js").ApiSuccess<T | {}>} */
  const body = { success: true, message, data: data === undefined ? {} : data };
  return res.status(statusCode).json(body);
};
