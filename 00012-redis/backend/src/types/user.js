/**
 * User domain types. Import with JSDoc: `@typedef {import("../types/user.js").User} User`.
 */

/**
 * @typedef {Object} User
 * @property {import("mongoose").Types.ObjectId} _id
 * @property {string} name
 * @property {string} email
 * @property {string} [password]
 * @property {string | null} [refreshToken]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {User & import("mongoose").Document & {
 *   comparePassword: (candidate: string) => Promise<boolean>
 * }} UserDocument
 */

/**
 * @typedef {Object} RegisterInput
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginInput
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} PublicUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} TokenPair
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} TokenPayload
 * @property {string} id
 * @property {string} email
 */

export { };
