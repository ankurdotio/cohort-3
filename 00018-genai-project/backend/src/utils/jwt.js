import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const issuer = 'downbot';

/**
 * @param {{id: string, email: string}} user User claims.
 * @returns {import('../types/user.js').TokenPair} Independently signed, uniquely identified JWTs.
 */
export function issueTokens(user) {
  const payload = { id: String(user.id), email: user.email };
  return {
    accessToken: jwt.sign(payload, env.accessTokenSecret, {
      algorithm: 'HS256', expiresIn: '15m', issuer, audience: 'downbot:access', jwtid: randomUUID(),
    }),
    refreshToken: jwt.sign(payload, env.refreshTokenSecret, {
      algorithm: 'HS256', expiresIn: '7d', issuer, audience: 'downbot:refresh', jwtid: randomUUID(),
    }),
  };
}

function verify(token, secret, audience) {
  const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience });
  if (typeof payload !== 'object' || !/^[a-f\d]{24}$/i.test(payload.id)
    || typeof payload.email !== 'string') {
    throw new AppError(401, 'Invalid or expired token');
  }
  return payload;
}

/**
 * @param {string} token Bearer access token.
 * @returns {import('jsonwebtoken').JwtPayload} Verified user claims.
 * @throws {Error} Invalid or expired JWT.
 */
export function verifyAccessToken(token) {
  return verify(token, env.accessTokenSecret, 'downbot:access');
}

/**
 * @param {string} token Refresh cookie value.
 * @returns {import('jsonwebtoken').JwtPayload} Verified user claims.
 * @throws {Error} Invalid or expired JWT.
 */
export function verifyRefreshToken(token) {
  return verify(token, env.refreshTokenSecret, 'downbot:refresh');
}
