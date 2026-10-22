/**
 * Wraps an async request handler and forwards rejections to the error middleware.
 * @template {import("express").RequestHandler} H
 * @param {H} handler - Async Express handler.
 * @returns {import("express").RequestHandler} Wrapped handler.
 */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
