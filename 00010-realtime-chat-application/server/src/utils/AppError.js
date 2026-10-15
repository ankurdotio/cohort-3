export class AppError extends Error {
  /** Create a safe operational error. @param {number} statusCode @param {string} message @param {Array<object>} errors */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
