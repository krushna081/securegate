import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import visitorRoutes from './routes/visitorRoutes';
import userRoutes from './routes/userRoutes';
import preApprovalRoutes from './routes/preApprovalRoutes';
import meetingRoutes from './routes/meetingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many login attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/visitors', apiLimiter, visitorRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/pre-approvals', apiLimiter, preApprovalRoutes);
app.use('/api/meetings', apiLimiter, meetingRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

app.use(errorHandler);

connectDB();

// Start server only when not on Vercel (Vercel imports app as serverless function)
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

export default app;
