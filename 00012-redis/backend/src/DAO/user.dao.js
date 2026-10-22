import { UserModel } from "../models/user.model.js";

/**
 * @typedef {import("../types/user.js").UserDocument} UserDocument
 * @typedef {import("../types/user.js").RegisterInput} RegisterInput
 */

/**
 * Creates and persists a new user. The password is hashed by the model hook.
 * @param {RegisterInput} input - Registration data.
 * @returns {Promise<UserDocument>} The created user document.
 */
export const createUser = async (input) => {
  const user = await UserModel.create(input);
  return /** @type {UserDocument} */ (/** @type {unknown} */ (user));
};

/**
 * Finds a user by email, including the password hash for credential checks.
 * @param {string} email - Normalized email address.
 * @returns {Promise<UserDocument | null>} The user or null.
 */
export const findUserByEmail = async (email) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+password");
  return /** @type {UserDocument | null} */ (/** @type {unknown} */ (user));
};

/**
 * Finds a user by id without sensitive fields.
 * @param {string} id - User id.
 * @returns {Promise<UserDocument | null>} The user or null.
 */
export const findUserById = async (id) => {
  const user = await UserModel.findById(id);
  return /** @type {UserDocument | null} */ (/** @type {unknown} */ (user));
};

/**
 * Finds a user by id, including the persisted refresh token.
 * @param {string} id - User id.
 * @returns {Promise<UserDocument | null>} The user or null.
 */
export const findUserByIdWithRefreshToken = async (id) => {
  const user = await UserModel.findById(id).select("+refreshToken");
  return /** @type {UserDocument | null} */ (/** @type {unknown} */ (user));
};

/**
 * Persists the user's current refresh token.
 * @param {string} id - User id.
 * @param {string} refreshToken - Newly issued refresh token.
 * @returns {Promise<UserDocument | null>} The updated user or null.
 */
export const updateRefreshToken = async (id, refreshToken) => {
  const user = await UserModel.findByIdAndUpdate(id, { refreshToken }, { new: true });
  return /** @type {UserDocument | null} */ (/** @type {unknown} */ (user));
};

/**
 * Removes the user's persisted refresh token.
 * @param {string} id - User id.
 * @returns {Promise<UserDocument | null>} The updated user or null.
 */
export const clearRefreshToken = async (id) => {
  const user = await UserModel.findByIdAndUpdate(id, { refreshToken: null }, { new: true });
  return /** @type {UserDocument | null} */ (/** @type {unknown} */ (user));
};
