import express from 'express';
import { createAccount, logout, sendOtp, verifyOtp } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import {
  createAccountSchema,
  emailSchema,
  verifyOtpSchema,
} from '../validation/schemas';

const router = express.Router();

router.post('/send-otp', validateBody(emailSchema), sendOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/create-account', validateBody(createAccountSchema), createAccount);
router.post('/logout', authenticate, logout);

export default router;
