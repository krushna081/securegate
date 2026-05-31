import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Flat from '../models/Flat';
import Otp from '../models/Otp';
import Society from '../models/Society';
import Notification from '../models/Notification';
import Visitor from '../models/Visitor';
import { sendOtpEmail } from '../services/emailService';
import jwt from 'jsonwebtoken';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .populate('societyId', 'name address')
      .populate('flatId', 'flatNumber blockName');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, phoneNumber2, photoUrl, flatNumber, blockName, gateNumber, phoneVerifiedToken } = req.body;
    const updates: any = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (gateNumber !== undefined) updates.gateNumber = gateNumber;
    if (phoneNumber2 !== undefined) updates.phoneNumber2 = phoneNumber2;

    if (phoneNumber !== undefined) {
      if (!phoneVerifiedToken) {
        return res.status(400).json({ message: 'Phone change requires OTP verification' });
      }
      try {
        const decoded = jwt.verify(phoneVerifiedToken, process.env.JWT_SECRET!) as any;
        if (!decoded.verified || decoded.email !== req.user!.email) {
          return res.status(400).json({ message: 'Invalid verification token' });
        }
      } catch {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }
      updates.phoneNumber = phoneNumber;
    }

    if (flatNumber !== undefined && flatNumber.toString().trim() !== '') {
      const society = await Society.findById(req.user!.societyId);
      if (!society) {
        return res.status(400).json({ message: 'No society assigned to your account' });
      }

      const oldFlat = await Flat.findById(req.user!.flatId);
      if (oldFlat) {
        await Flat.findByIdAndUpdate(oldFlat._id, { residentId: null });
      }

      let flat = await Flat.findOne({ flatNumber: flatNumber.toString(), blockName: blockName || 'A', societyId: society._id });
      if (flat) {
        if (flat.residentId && flat.residentId.toString() !== req.user!._id.toString()) {
          return res.status(400).json({ message: `Flat ${flatNumber} is already assigned to another resident` });
        }
        updates.flatId = flat._id;
        await Flat.findByIdAndUpdate(flat._id, { residentId: req.user!._id });
      } else {
        flat = await Flat.create({
          societyId: society._id,
          flatNumber: flatNumber.toString(),
          blockName: blockName || 'A',
          residentId: req.user!._id,
        });
        updates.flatId = flat._id;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      updates,
      { new: true }
    ).populate('societyId', 'name address')
     .populate('flatId', 'flatNumber blockName');

    res.json({ user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const sendProfileOtp = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.user!.email;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp: otpCode, expiresAt });

    await sendOtpEmail(email, otpCode);

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_XXXXXXXXXXXXXXXXXXXXXXXX') {
      res.json({ message: 'OTP sent (dev mode)', devOtp: otpCode });
      return;
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyProfileOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body;
    const email = req.user!.email;

    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await Otp.deleteOne({ email: email.toLowerCase() });

    const verifyToken = jwt.sign(
      { verified: true, email },
      process.env.JWT_SECRET!,
      { expiresIn: '10m' }
    );

    res.json({ verified: true, phoneVerifiedToken: verifyToken });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (req.user!.societyId) {
      filter.societyId = req.user!.societyId;
    }

    const users = await User.find(filter)
      .populate('societyId', 'name')
      .populate('flatId', 'flatNumber blockName')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getFlats = async (req: AuthRequest, res: Response) => {
  try {
    const { societyId } = req.query;
    const filter: any = {};
    if (societyId) filter.societyId = societyId;

    const flats = await Flat.find(filter)
      .populate('residentId', 'fullName email phoneNumber')
      .sort({ blockName: 1, flatNumber: 1 });

    res.json({ flats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flats' });
  }
};

export const searchFlats = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ flats: [] });
    }

    const flats = await Flat.find({
      flatNumber: { $regex: q, $options: 'i' },
    })
      .populate('residentId', 'fullName email phoneNumber')
      .sort({ blockName: 1, flatNumber: 1 })
      .limit(20);

    res.json({ flats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search flats' });
  }
};

export const registerPushToken = async (req: AuthRequest, res: Response) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    await User.findByIdAndUpdate(req.user!._id, { pushToken });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register push token' });
  }
};

export const unregisterPushToken = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user!._id, { $unset: { pushToken: '' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unregister push token' });
  }
};

export const getSocieties = async (_req: AuthRequest, res: Response) => {
  try {
    const societies = await Society.find().sort({ name: 1 });
    res.json({ societies });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch societies' });
  }
};
