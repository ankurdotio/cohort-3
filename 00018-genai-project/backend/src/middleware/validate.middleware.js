import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

/**
 * @type {import('express').RequestHandler}
 * @throws {AppError} Field-specific registration validation errors.
 */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new AppError(422, 'Validation failed', result.array().map((error) => ({
      field: error.path || 'request',
      message: error.msg,
    })));
  }
  next();
}

/**
 * @type {import('express').RequestHandler}
 * @throws {AppError} Generic error without identifying the invalid login field.
 */
export function validateLogin(req, _res, next) {
  if (!validationResult(req).isEmpty()) throw new AppError(401, 'Invalid credentials');
  next();
}
