import express from 'express';
import {
  getProfile,
  updateProfile,
  sendProfileOtp,
  verifyProfileOtp,
  getAllUsers,
  getFlats,
  searchFlats,
  getSocieties,
  registerPushToken,
  unregisterPushToken,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/send-otp', sendProfileOtp);
router.post('/verify-otp', verifyProfileOtp);

router.get('/all', authorize('guard', 'admin'), getAllUsers);
router.get('/flats', getFlats);
router.get('/flats/search', searchFlats);
router.get('/societies', authorize('admin'), getSocieties);

router.post('/push-token', registerPushToken);
router.delete('/push-token', unregisterPushToken);

export default router;
