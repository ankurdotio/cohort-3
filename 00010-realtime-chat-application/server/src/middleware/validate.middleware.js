import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

/** Forward field validation failures to the central error handler. @param {object} req @param {object} res @param {Function} next @throws {AppError} */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const fieldErrors = result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    throw new AppError(422, 'Validation failed', fieldErrors);
  }

  next();
}
