import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

/** Issue uniquely identifiable access and refresh tokens, even within the same second. @param {object} user @returns {{accessToken:string,refreshToken:string}} */
export function issueTokens(user) {
  const payload = { id: String(user._id), email: user.email };
  return {
    accessToken: jwt.sign(payload, env.accessTokenSecret, {
      expiresIn: '15m',
      jwtid: randomUUID(),
    }),
    refreshToken: jwt.sign(payload, env.refreshTokenSecret, {
      expiresIn: '7d',
      jwtid: randomUUID(),
    }),
  };
}

/** Verify a JWT and validate its identity claims. @param {string} token @param {'access'|'refresh'} kind @returns {object} @throws {AppError} */
export function verifyToken(token, kind) {
  const secret = kind === 'access' ? env.accessTokenSecret : env.refreshTokenSecret;
  const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

  if (
    typeof payload !== 'object' ||
    !/^[a-f\d]{24}$/i.test(payload.id ?? '') ||
    typeof payload.email !== 'string'
  ) {
    throw new AppError(401, 'Invalid authentication token');
  }
  return payload;
}

/** Identify expected JWT verification failures. @param {Error} error @returns {boolean} */
export function isTokenError(error) {
  return error instanceof jwt.JsonWebTokenError;
}
