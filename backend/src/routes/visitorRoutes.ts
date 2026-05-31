import express from 'express';
import {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitorStatus,
  updateVisitor,
  deleteVisitor,
} from '../controllers/visitorController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('guard', 'admin'), createVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.patch('/:id/status', authorize('resident', 'guard', 'admin'), updateVisitorStatus);
router.put('/:id', authorize('guard', 'admin'), updateVisitor);
router.delete('/:id', authorize('guard', 'admin'), deleteVisitor);

export default router;
