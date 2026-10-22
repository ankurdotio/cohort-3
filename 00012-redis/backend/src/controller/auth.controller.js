import { env } from "../config/env.js";
import {
  clearRefreshToken,
  createUser,
  findUserByEmail,
  findUserByIdWithRefreshToken,
  updateRefreshToken,
} from "../DAO/user.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

/**
 * @typedef {import("../types/user.js").User} User
 * @typedef {import("../types/user.js").PublicUser} PublicUser
 * @typedef {import("../types/user.js").TokenPair} TokenPair
 * @typedef {import("../types/user.js").RegisterInput} RegisterInput
 * @typedef {import("../types/user.js").LoginInput} LoginInput
 */

const REFRESH_COOKIE = "refreshToken";

/** @type {import("express").CookieOptions} */
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "strict",
  path: "/api/v1/auth",
};

/**
 * Maps a user to its client-safe representation.
 * @param {User} user - User document.
 * @returns {PublicUser} Public user.
 */
const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Issues a new token pair and persists the refresh token.
 * @param {User} user - Authenticated user.
 * @returns {Promise<TokenPair>} New tokens.
 * @throws {AppError} 401 if the user disappeared before persisting.
 */
const issueTokens = async (user) => {
  const payload = { id: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const updated = await updateRefreshToken(payload.id, refreshToken);
  if (!updated) throw new AppError(401, "Invalid credentials");
  return { accessToken, refreshToken };
};

/**
 * Sets the refresh-token cookie.
 * @param {import("express").Response} res - Express response.
 * @param {string} refreshToken - Refresh token.
 * @returns {void}
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
};

/**
 * POST /api/v1/auth/register — creates an account and signs the user in.
 * @param {import("express").Request} req - Body: `{ name, email, password }`.
 * @param {import("express").Response} res - 201 with `{ user, accessToken }`.
 * @returns {Promise<void>}
 * @throws {AppError} 409 when the email is already registered.
 */
export const register = asyncHandler(async (req, res) => {
  /** @type {RegisterInput} */
  const { name, email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError(409, "Email already registered", [
      { field: "email", message: "Email already registered" },
    ]);
  }

  const user = await createUser({ name, email, password });
  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, 201, "Registration successful", { user: toPublicUser(user), accessToken });
});

/**
 * POST /api/v1/auth/login — authenticates with email and password.
 * @param {import("express").Request} req - Body: `{ email, password }`.
 * @param {import("express").Response} res - 200 with `{ user, accessToken }`.
 * @returns {Promise<void>}
 * @throws {AppError} 401 "Invalid credentials" for unknown email or wrong password.
 */
export const login = asyncHandler(async (req, res) => {
  /** @type {LoginInput} */
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  const valid = user ? await user.comparePassword(password) : false;
  if (!user || !valid) throw new AppError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, 200, "Login successful", { user: toPublicUser(user), accessToken });
});

/**
 * POST /api/v1/auth/refresh — rotates the token pair using the refresh cookie.
 * @param {import("express").Request} req - Requires the `refreshToken` cookie.
 * @param {import("express").Response} res - 200 with `{ accessToken }`.
 * @returns {Promise<void>}
 * @throws {AppError} 401 when the cookie is missing, invalid, or not the current token.
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (typeof token !== "string" || !token) throw new AppError(401, "Refresh token missing");

  const payload = verifyRefreshToken(token);
  const user = await findUserByIdWithRefreshToken(payload.id);

  if (!user || !user.refreshToken || user.refreshToken !== token) {
    // A valid-but-stale token signals possible reuse; revoke the session.
    if (user) await clearRefreshToken(user._id.toString());
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    throw new AppError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, 200, "Token refreshed", { accessToken });
});

/**
 * POST /api/v1/auth/logout — revokes the stored refresh token and clears the cookie.
 * Idempotent: succeeds even if the cookie is missing or invalid.
 * @param {import("express").Request} req - Optional `refreshToken` cookie.
 * @param {import("express").Response} res - 200 with `data: null`.
 * @returns {Promise<void>}
 */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (typeof token === "string" && token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await findUserByIdWithRefreshToken(payload.id);
      if (user && user.refreshToken === token) await clearRefreshToken(payload.id);
    } catch {
      // Invalid or expired token: nothing to revoke server-side.
    }
  }

  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  sendSuccess(res, 200, "Logout successful", null);
});

/**
 * GET /api/v1/auth/me — returns the authenticated user.
 * @param {import("express").Request} req - `req.user` set by `requireAuth`.
 * @param {import("express").Response} res - 200 with `{ user }`.
 * @returns {Promise<void>}
 * @throws {AppError} 401 when unauthenticated.
 */
export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  sendSuccess(res, 200, "Current user", { user: toPublicUser(req.user) });
});
