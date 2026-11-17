import express from 'express';
import {
  createVisitor,
  getVisitorById,
  getVisitors,
  getVisitorStats,
  updateVisitor,
  updateVisitorStatus,
  deleteVisitor,
} from '../controllers/visitorController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import {
  visitorCreateSchema,
  visitorStatusSchema,
  visitorUpdateSchema,
} from '../validation/schemas';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getVisitorStats);
router.post('/', authorize('guard', 'admin'), validateBody(visitorCreateSchema), createVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.patch('/:id/status', authorize('resident', 'guard', 'admin'), validateBody(visitorStatusSchema), updateVisitorStatus);
router.put('/:id', authorize('guard', 'admin'), validateBody(visitorUpdateSchema), updateVisitor);
router.delete('/:id', authorize('guard', 'admin'), deleteVisitor);

export default router;
