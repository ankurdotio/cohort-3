/**
 * @param {import('express').RequestHandler} handler Async route handler.
 * @returns {import('express').RequestHandler} Handler forwarding rejected promises.
 */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
