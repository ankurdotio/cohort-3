import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * @type {import('express').ErrorRequestHandler}
 * Converts every failure to the shared API envelope without exposing unknown failures.
 */
export function errorHandler(error, _req, res, _next) {
  let status = 500;
  let message = 'Internal server error';
  let errors = [];
  if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error.code === 11000) {
    status = 409;
    message = 'An account with this email already exists';
    errors = [{ field: 'email', message }];
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid value';
    errors = [{ field: error.path, message }];
  } else if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
    status = 401;
    message = 'Invalid or expired token';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else {
    console.error('Unhandled request error:', error);
  }
  /** @type {import('../types/api.js').ApiError} */
  const body = { success: false, message, errors };
  if (env.nodeEnv !== 'production') body.stack = error.stack;
  res.status(status).json(body);
}
