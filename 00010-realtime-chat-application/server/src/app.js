import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.routes.js';
import { notFound } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(morgan(
  env.nodeEnv === 'production' ? 'combined' : 'dev',
  { skip: () => env.nodeEnv === 'test' },
));
app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);
