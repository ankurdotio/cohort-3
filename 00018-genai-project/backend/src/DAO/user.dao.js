import { UserModel } from '../models/user.model.js';

/**
 * @param {import('../types/user.js').RegisterInput} input Validated registration.
 * @returns {Promise<import('../types/user.js').User>} Persisted user.
 */
export async function createUser(input) {
  return UserModel.create(input);
}

/**
 * @param {string} email Normalized email.
 * @returns {Promise<import('mongoose').HydratedDocument<import('../types/user.js').User> | null>} User with password for comparison.
 */
export async function findUserByEmail(email) {
  return UserModel.findOne({ email }).select('+password').exec();
}

/**
 * @param {string} id User identifier.
 * @returns {Promise<import('../types/user.js').User | null>} Publicly selectable user fields.
 */
export async function findUserById(id) {
  return UserModel.findById(id).exec();
}

/**
 * @param {string} id User identifier.
 * @returns {Promise<import('../types/user.js').User | null>} User including stored refresh token.
 */
export async function findUserByIdWithRefreshToken(id) {
  return UserModel.findById(id).select('+refreshToken').exec();
}

/**
 * Atomically compare-and-swap on rotation so a token cannot be consumed twice.
 * @param {string} id User identifier.
 * @param {string} token New refresh token.
 * @param {string} [expectedToken] Current token required for rotation.
 * @returns {Promise<import('../types/user.js').User | null>} Updated user or null on stale rotation.
 */
export async function updateRefreshToken(id, token, expectedToken) {
  const filter = { _id: id };
  if (expectedToken !== undefined) filter.refreshToken = expectedToken;
  return UserModel.findOneAndUpdate(filter, { refreshToken: token }, { new: true }).exec();
}

/**
 * @param {string} id User identifier.
 * @param {string} token Only revoke the session represented by this cookie.
 * @returns {Promise<import('../types/user.js').User | null>} Updated user or null.
 */
export async function clearRefreshToken(id, token) {
  return UserModel.findOneAndUpdate(
    { _id: id, refreshToken: token }, { refreshToken: null }, { new: true },
  ).exec();
}
