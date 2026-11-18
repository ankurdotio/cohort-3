/**
 * @template T
 * @param {import('express').Response} res Express response.
 * @param {number} statusCode HTTP status.
 * @param {string} message Public success message.
 * @param {T} data Response payload.
 * @returns {import('express').Response} Standard response envelope.
 */
export function sendSuccess(res, statusCode, message, data) {
  /** @type {import('../types/api.js').ApiSuccess<T>} */
  const body = { success: true, message, data };
  return res.status(statusCode).json(body);
}
