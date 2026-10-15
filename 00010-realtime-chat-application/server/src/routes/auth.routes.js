import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controller/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

/** Authentication endpoints mounted beneath /api/v1/auth. */
export const authRouter = Router();
authRouter.post('/register', registerValidator, validate, register);
authRouter.post('/login', loginValidator, validate, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
