import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import initSocketServer from './sockets/socket.server.js';
import { createServer } from 'http';

try {
  await connectDB();

  const httpServer = createServer(app);
  initSocketServer(httpServer);

  const server = httpServer.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  server.on('error', (error) => {
    console.error('HTTP server failed:', error);
    process.exit(1);
  });
  function shutdown() {
    server.close(async () => {
      try {
        await mongoose.disconnect();
        process.exit(0);
      } catch (error) {
        console.error('Database shutdown failed:', error.message);
        process.exit(1);
      }
    });

    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error('Server startup failed:', error.message);
  process.exit(1);
}
