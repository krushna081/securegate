import { Request, Response } from 'express';
import User from '../models/User';
import Otp from '../models/Otp';
import Flat from '../models/Flat';
import Society from '../models/Society';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../services/emailService';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp: otpCode, expiresAt });

    await sendOtpEmail(email, otpCode);

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_XXXXXXXXXXXXXXXXXXXXXXXX') {
      res.json({ message: 'OTP sent (dev mode)', devOtp: otpCode });
      return;
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('sendOtp error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ email: email.toLowerCase() })
      .populate('societyId', 'name address')
      .populate('flatId', 'flatNumber blockName');

    if (!user) {
      await Otp.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ message: 'No account found. Please create an account first.' });
    }

    await Otp.deleteOne({ email: email.toLowerCase() });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        phoneNumber2: user.phoneNumber2,
        role: user.role,
        societyId: user.societyId,
        flatId: user.flatId,
      },
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phoneNumber, role, flatNumber, blockName } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!phoneNumber || !phoneNumber.toString().trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (role === 'resident') {
      if (!flatNumber || !flatNumber.toString().trim()) {
        return res.status(400).json({ message: 'Flat number is required for residents' });
      }
      if (!blockName || !blockName.toString().trim()) {
        return res.status(400).json({ message: 'Block name is required for residents' });
      }
    }

    let flatId: string | undefined;

    if (flatNumber) {
      let society = await Society.findOne({});
      if (!society) {
        society = await Society.create({ name: 'Default Society', address: 'Main Address' });
      }

      let flat = await Flat.findOne({ flatNumber: flatNumber.toString(), blockName: blockName || 'A' });
      if (flat) {
        if (flat.residentId) {
          return res.status(400).json({ message: `Flat ${flatNumber} is already assigned to another resident` });
        }
        flatId = flat._id.toString();
      } else {
        flat = await Flat.create({
          societyId: society._id,
          flatNumber: flatNumber.toString(),
          blockName: blockName || 'A',
        });
        flatId = flat._id.toString();
      }
    }

    user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber.toString().trim(),
      role: role || 'resident',
      flatId: flatId,
      societyId: flatId ? (await Flat.findById(flatId))?.societyId : undefined,
    });

    if (flatId) {
      await Flat.findByIdAndUpdate(flatId, { residentId: user._id });
    }

    const populated = await User.findById(user._id)
      .populate('flatId', 'flatNumber blockName')
      .populate('societyId', 'name');

    res.json({ message: 'Account created. Please login.', user: populated });
  } catch (error) {
    console.error('createAccount error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
};
