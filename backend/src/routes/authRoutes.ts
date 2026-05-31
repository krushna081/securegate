import express from 'express';
import { sendOtp, verifyOtp, createAccount } from '../controllers/authController';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/create-account', createAccount);

export default router;
