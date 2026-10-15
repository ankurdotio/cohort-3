import { UserModel } from '../models/user.model.js';

/** Persist a user; the model hashes their password. @param {object} input @returns {Promise<object>} */
export async function createUser(input) {
  return UserModel.create(input);
}

/** Find credentials by normalized email. @param {string} email @returns {Promise<object|null>} */
export async function findUserByEmail(email) {
  return UserModel.findOne({ email }).select('+password');
}

/** Find a public-profile document. @param {string} id @returns {Promise<object|null>} */
export async function findUserById(id) {
  return UserModel.findById(id);
}

/** Find a user with their current refresh token. @param {string} id @returns {Promise<object|null>} */
export async function findUserByIdWithRefreshToken(id) {
  return UserModel.findById(id).select('+refreshToken');
}

/**
 * Store a token, optionally comparing the previous value atomically to prevent replay races.
 * @param {string} id @param {string} token @param {string|null|undefined} expectedToken
 * @returns {Promise<object|null>}
 */
export async function updateRefreshToken(id, token, expectedToken = undefined) {
  const filter = { _id: id };
  if (expectedToken !== undefined) {
    filter.refreshToken = expectedToken;
  }

  return UserModel.findOneAndUpdate(filter, { refreshToken: token }, { new: true });
}

/** Invalidate only the supplied session, not a newer login. @param {string} id @param {string} token @returns {Promise<object|null>} */
export async function clearRefreshToken(id, token) {
  return UserModel.findOneAndUpdate(
    { _id: id, refreshToken: token },
    { refreshToken: null },
    { new: true },
  );
}
