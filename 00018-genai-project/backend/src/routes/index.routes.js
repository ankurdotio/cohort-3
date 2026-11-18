import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();
router.use('/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, authRoutes);

export default router;
