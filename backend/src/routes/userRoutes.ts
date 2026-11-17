import express from 'express';
import {
  createStaff,
  deleteAccount,
  getAllUsers,
  getFlats,
  getProfile,
  getSocieties,
  getUserById,
  registerPushToken,
  searchFlats,
  sendProfileOtp,
  unregisterPushToken,
  updateProfile,
  verifyProfileOtp,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import {
  profileOtpSchema,
  profileUpdateSchema,
  pushTokenSchema,
  staffCreateSchema,
} from '../validation/schemas';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validateBody(profileUpdateSchema), updateProfile);
router.post('/send-otp', authLimiter, sendProfileOtp);
router.post('/verify-otp', authLimiter, validateBody(profileOtpSchema), verifyProfileOtp);

router.get('/all', authorize('guard', 'admin'), getAllUsers);
router.get('/flats', authorize('guard', 'admin'), getFlats);
router.get('/flats/search', authorize('guard', 'admin'), searchFlats);
router.get('/societies', authorize('admin'), getSocieties);
router.post('/staff', authorize('admin'), validateBody(staffCreateSchema), createStaff);
router.get('/:id', authorize('guard', 'admin'), getUserById);

router.post('/push-token', validateBody(pushTokenSchema), registerPushToken);
router.delete('/push-token', unregisterPushToken);
router.delete('/me', deleteAccount);

export default router;
