import { Router } from 'express';
import authRoutes from './auth.routes.js';
import conversationRoutes from './conversation.routes.js';

const router = Router();
router.use('/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, authRoutes);
router.use("/conversation", conversationRoutes);

export default router;
