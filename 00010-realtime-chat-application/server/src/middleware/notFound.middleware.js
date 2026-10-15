import { AppError } from '../utils/AppError.js';

/** Reject unmatched API routes. @throws {AppError} */
export function notFound() {
  throw new AppError(404, 'Route not found');
}
