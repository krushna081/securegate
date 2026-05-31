import express from 'express';
import { createMeeting, getMeetings, deleteMeeting } from '../controllers/meetingController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('guard', 'admin'), createMeeting);
router.get('/', getMeetings);
router.delete('/:id', authorize('guard', 'admin'), deleteMeeting);

export default router;
