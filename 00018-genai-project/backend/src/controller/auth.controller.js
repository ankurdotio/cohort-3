import bcrypt from 'bcryptjs';
import {
  createUser, findUserByEmail, findUserByIdWithRefreshToken, updateRefreshToken, clearRefreshToken,
} from '../DAO/user.dao.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { issueTokens, verifyRefreshToken } from '../utils/jwt.js';

const cookieName = 'refreshToken';
const cookieOptions = Object.freeze({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
});
const maxAge = 7 * 24 * 60 * 60 * 1000;
const dummyHash = bcrypt.hashSync('downbot-timing-equalization', 10);

/**
 * @param {import('../types/user.js').User} user Stored user.
 * @returns {import('../types/user.js').PublicUser} Explicit safe field allowlist.
 */
function toPublicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, createdAt: user.createdAt };
}

function setRefreshCookie(res, token) {
  res.cookie(cookieName, token, { ...cookieOptions, maxAge });
}

async function establishSession(user, res) {
  const tokens = issueTokens({ id: String(user._id), email: user.email });
  const updated = await updateRefreshToken(String(user._id), tokens.refreshToken);
  if (!updated) throw new AppError(401, 'Authentication required');
  setRefreshCookie(res, tokens.refreshToken);
  return { user: toPublicUser(updated), accessToken: tokens.accessToken };
}

/**
 * @type {import('express').RequestHandler}
 * @returns {Promise<void>}
 * @throws {Error} Database failure or duplicate email.
 */
export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await createUser({ name, email, password });
  sendSuccess(res, 201, 'Account created', await establishSession(user, res));
}

/**
 * @type {import('express').RequestHandler}
 * @returns {Promise<void>}
 * @throws {AppError} Identical failure for missing user and incorrect password.
 */
export async function login(req, res) {
  const user = await findUserByEmail(req.body.email);
  const matches = user
    ? await user.comparePassword(req.body.password)
    : await bcrypt.compare(req.body.password, dummyHash);
  if (!user || !matches) throw new AppError(401, 'Invalid credentials');
  sendSuccess(res, 200, 'Login successful', await establishSession(user, res));
}

/**
 * @type {import('express').RequestHandler}
 * @returns {Promise<void>}
 * @throws {AppError} Absent, invalid, revoked, or already-consumed refresh cookie.
 */
export async function refresh(req, res) {
  const token = req.cookies[cookieName];
  if (!token) throw new AppError(401, 'Session expired. Please sign in again.');
  const payload = verifyRefreshToken(token);
  const user = await findUserByIdWithRefreshToken(payload.id);
  if (!user || user.refreshToken !== token) {
    throw new AppError(401, 'Session expired. Please sign in again.');
  }
  const tokens = issueTokens({ id: String(user._id), email: user.email });
  const updated = await updateRefreshToken(String(user._id), tokens.refreshToken, token);
  if (!updated) throw new AppError(401, 'Session expired. Please sign in again.');
  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, 200, 'Session refreshed', {
    user: toPublicUser(updated), accessToken: tokens.accessToken,
  });
}

/**
 * @type {import('express').RequestHandler}
 * @returns {Promise<void>}
 * @throws {Error} Invalid cookie or database failure; the browser cookie is still cleared.
 */
export async function logout(req, res) {
  res.clearCookie(cookieName, cookieOptions);
  const token = req.cookies[cookieName];
  if (token) {
    const payload = verifyRefreshToken(token);
    await clearRefreshToken(payload.id, token);
  }
  sendSuccess(res, 200, 'Logged out', {});
}

/**
 * @type {import('express').RequestHandler}
 * @returns {void} Current public user.
 */
export function me(req, res) {
  sendSuccess(res, 200, 'Profile retrieved', { user: toPublicUser(req.user) });
}
