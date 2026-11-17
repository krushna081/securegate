import express from 'express';
import { createMeeting, getMeetings, deleteMeeting } from '../controllers/meetingController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { meetingCreateSchema } from '../validation/schemas';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('guard', 'admin'), validateBody(meetingCreateSchema), createMeeting);
router.get('/', getMeetings);
router.delete('/:id', authorize('guard', 'admin'), deleteMeeting);

export default router;
