/** Write a consistent success envelope. @param {object} res @param {number} statusCode @param {string} message @param {*} data @returns {object} */
export function sendSuccess(res, statusCode, message, data = {}) {
  /** @type {import('../types/api.js').ApiSuccess} */
  const response = { success: true, message, data };
  return res.status(statusCode).json(response);
}
