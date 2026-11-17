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
import { validateBody } from '../middleware/validate';
import {
  preApprovalCreateSchema,
  preApprovalStatusSchema,
  preApprovalUpdateSchema,
} from '../validation/schemas';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('resident'), validateBody(preApprovalCreateSchema), createPreApproval);
router.get('/my', getMyPreApprovals);
router.get('/all', authorize('guard', 'admin'), getAllPreApprovalsBySociety);
router.put('/:id', validateBody(preApprovalUpdateSchema), updatePreApproval);
router.patch('/:id/status', validateBody(preApprovalStatusSchema), updatePreApprovalStatus);
router.delete('/:id', deletePreApproval);

export default router;
