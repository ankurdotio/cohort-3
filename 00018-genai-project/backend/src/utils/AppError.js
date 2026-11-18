export class AppError extends Error {
  /**
   * @param {number} statusCode HTTP error status.
   * @param {string} message Safe public message.
   * @param {import('../types/api.js').ApiFieldError[]} [errors] Field errors.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
