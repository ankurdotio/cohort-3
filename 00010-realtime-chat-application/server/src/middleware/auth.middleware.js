import { findUserById } from '../DAO/user.dao.js';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

/** Resolve the bearer token to a persisted user. @param {object} req @param {object} res @param {Function} next @throws {AppError} */
export async function authenticate(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
  if (!match) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = verifyToken(match[1], 'access');
  const user = await findUserById(payload.id);
  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  req.user = user;
  next();
}
