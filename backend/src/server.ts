import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, assertConfig } from './config/env';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import visitorRoutes from './routes/visitorRoutes';
import userRoutes from './routes/userRoutes';
import preApprovalRoutes from './routes/preApprovalRoutes';
import meetingRoutes from './routes/meetingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { authLimiter, apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

assertConfig();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!env.isProduction) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  const dbReady = (await import('mongoose')).default.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/visitors', apiLimiter, visitorRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/pre-approvals', apiLimiter, preApprovalRoutes);
app.use('/api/meetings', apiLimiter, meetingRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

connectDB().catch((error) => {
  console.error('Database connection failed:', error instanceof Error ? error.message : error);
});

if (!process.env.VERCEL) {
  const port = env.port;
  const host = '0.0.0.0';
  const server = app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (!process.env.VERCEL) process.exit(1);
});

export default app;
