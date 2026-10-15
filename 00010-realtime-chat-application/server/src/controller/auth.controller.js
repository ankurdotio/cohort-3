import {
  createUser,
  findUserByEmail,
  findUserByIdWithRefreshToken,
  updateRefreshToken,
  clearRefreshToken,
} from '../DAO/user.dao.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { issueTokens, verifyToken, isTokenError } from '../utils/jwt.js';

const cookieName = 'refreshToken';
const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
};

/** @param {object} user @returns {import('../types/user.js').PublicUser} */
function toPublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function startSession(res, user, expectedToken = undefined) {
  const tokens = issueTokens(user);
  const updatedUser = await updateRefreshToken(
    String(user._id),
    tokens.refreshToken,
    expectedToken,
  );

  if (!updatedUser) {
    throw new AppError(401, 'Session expired. Please sign in again');
  }

  res.cookie(cookieName, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
  };
}

/** Create an account and session. @param {object} req @param {object} res @returns {Promise<void>} @throws {AppError} */
export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await createUser({ name, email, password });
  const session = await startSession(res, user);
  sendSuccess(res, 201, 'Registration successful', session);
}

/** Authenticate without distinguishing missing accounts from wrong passwords. @param {object} req @param {object} res @throws {AppError} */
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError(401, 'Invalid credentials');
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid credentials');
  }

  const session = await startSession(res, user);
  sendSuccess(res, 200, 'Login successful', session);
}

/** Rotate an existing cookie session using an atomic token comparison. @param {object} req @param {object} res @throws {AppError} */
export async function refresh(req, res) {
  const token = req.cookies[cookieName];
  if (!token) {
    throw new AppError(401, 'Session expired. Please sign in again');
  }

  const payload = verifyToken(token, 'refresh');
  const user = await findUserByIdWithRefreshToken(payload.id);
  if (!user || user.refreshToken !== token) {
    throw new AppError(401, 'Session expired. Please sign in again');
  }

  const session = await startSession(res, user, token);
  sendSuccess(res, 200, 'Session refreshed', session);
}

/** Invalidate the current cookie session; expired cookies are safe to clear. @param {object} req @param {object} res @throws {Error} */
export async function logout(req, res) {
  const token = req.cookies[cookieName];
  if (token) {
    let payload;
    try {
      payload = verifyToken(token, 'refresh');
    } catch (error) {
      // Invalid or expired cookies can still be cleared during logout.
      if (!(error instanceof AppError) && !isTokenError(error)) {
        throw error;
      }
    }

    if (payload) {
      await clearRefreshToken(payload.id, token);
    }
  }

  res.clearCookie(cookieName, cookieOptions);
  sendSuccess(res, 200, 'Logout successful', {});
}

/** Return only public account information. @param {object} req @param {object} res */
export function me(req, res) {
  sendSuccess(res, 200, 'Profile retrieved', { user: toPublicUser(req.user) });
}
