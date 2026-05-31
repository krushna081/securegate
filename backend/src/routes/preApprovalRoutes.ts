import express from 'express';
import {
  createPreApproval,
  getMyPreApprovals,
  getAllPreApprovalsBySociety,
  updatePreApproval,
  updatePreApprovalStatus,
  deletePreApproval,
} from '../controllers/preApprovalController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('resident'), createPreApproval);
router.get('/my', getMyPreApprovals);
router.get('/all', authorize('guard', 'admin'), getAllPreApprovalsBySociety);
router.put('/:id', updatePreApproval);
router.patch('/:id/status', updatePreApprovalStatus);
router.delete('/:id', deletePreApproval);

export default router;
