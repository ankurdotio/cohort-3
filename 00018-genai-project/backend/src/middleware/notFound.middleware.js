import { AppError } from '../utils/AppError.js';

/**
 * @type {import('express').RequestHandler}
 * @throws {AppError} Unknown API route.
 */
export function notFound(_req, _res, _next) {
  throw new AppError(404, 'Route not found');
}
