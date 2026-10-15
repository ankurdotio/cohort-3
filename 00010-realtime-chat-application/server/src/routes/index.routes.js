import { Router } from 'express';
import { authRouter } from './auth.routes.js';

/** Versioned API router. */
export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
