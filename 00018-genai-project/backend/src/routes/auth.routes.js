import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, refresh, logout, me } from '../controller/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validate, validateLogin } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => next(new AppError(429, 'Too many attempts. Try again in 15 minutes.')),
});

router.post('/register', credentialsLimiter, registerValidator, validate, asyncHandler(register));
router.post('/login', credentialsLimiter, loginValidator, validateLogin, asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
