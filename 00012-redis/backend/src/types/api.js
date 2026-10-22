/**
 * Shared API response envelope types.
 */

/**
 * @typedef {Object} ApiFieldError
 * @property {string} field
 * @property {string} message
 */

/**
 * @template [T=unknown]
 * @typedef {Object} ApiSuccess
 * @property {true} success
 * @property {string} message
 * @property {T} data
 */

/**
 * @typedef {Object} ApiError
 * @property {false} success
 * @property {string} message
 * @property {ApiFieldError[]} errors
 * @property {string} [stack]
 */

export {};
