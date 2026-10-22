import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/** @typedef {import("../types/user.js").TokenPayload} TokenPayload */

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Signs a 15-minute access token.
 * @param {TokenPayload} payload - `{ id, email }`.
 * @returns {string} Signed JWT.
 */
export const signAccessToken = ({ id, email }) =>
  jwt.sign({ id, email }, env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

/**
 * Signs a 7-day refresh token.
 * @param {TokenPayload} payload - `{ id, email }`.
 * @returns {string} Signed JWT.
 */
export const signRefreshToken = ({ id, email }) =>
  jwt.sign({ id, email }, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

/**
 * Verifies an access token.
 * @param {string} token - JWT.
 * @returns {TokenPayload} Decoded payload.
 * @throws {import("jsonwebtoken").JsonWebTokenError | import("jsonwebtoken").TokenExpiredError} When invalid or expired.
 */
export const verifyAccessToken = (token) =>
  /** @type {TokenPayload} */ (jwt.verify(token, env.ACCESS_TOKEN_SECRET));

/**
 * Verifies a refresh token.
 * @param {string} token - JWT.
 * @returns {TokenPayload} Decoded payload.
 * @throws {import("jsonwebtoken").JsonWebTokenError | import("jsonwebtoken").TokenExpiredError} When invalid or expired.
 */
export const verifyRefreshToken = (token) =>
  /** @type {TokenPayload} */ (jwt.verify(token, env.REFRESH_TOKEN_SECRET));
