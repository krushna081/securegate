import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  catchUpMissedVisitors,
  getPendingVisitorsCatchup,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.get('/catchup', catchUpMissedVisitors);
router.get('/pending-visitors', getPendingVisitorsCatchup);

export default router;
