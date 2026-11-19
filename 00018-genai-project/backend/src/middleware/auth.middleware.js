import { findUserById } from '../DAO/user.dao.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @type {import('express').RequestHandler}
 * @throws {AppError} Missing bearer token or deleted account.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) throw new AppError(401, 'Authentication required');
  const payload = verifyAccessToken(match[ 1 ]);
  req.user = payload;
  next();
});
