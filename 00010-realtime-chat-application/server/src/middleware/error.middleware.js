import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { isTokenError } from '../utils/jwt.js';

/** Normalize all errors without exposing unexpected failures. @param {Error} error @param {object} req @param {object} res @param {Function} next @returns {object|void} */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

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
  } else if (isTokenError(error)) {
    status = 401;
    message = 'Invalid or expired authentication token';
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
  const response = {
    success: false,
    message,
    errors,
  };

  if (env.nodeEnv !== 'production' && error instanceof AppError) {
    response.stack = error.stack;
  }

  return res.status(status).json(response);
}
