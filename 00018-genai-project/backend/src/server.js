import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

try {
  await connectDB();
  const server = app.listen(env.port, () => {
    console.info(`Downbot API listening on http://localhost:${env.port}`);
  });
  server.on('error', (error) => {
    console.error('HTTP server failed:', error);
    process.exit(1);
  });

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => {
      console.error('Graceful shutdown timed out');
      process.exit(1);
    }, 10000).unref();
    server.close(async () => {
      try {
        await disconnectDB();
        clearTimeout(timeout);
      } catch (error) {
        console.error('Database shutdown failed:', error);
        process.exitCode = 1;
      }
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('Unable to start Downbot API:', error);
  process.exitCode = 1;
}
