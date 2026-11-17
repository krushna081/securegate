import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: 'auth' | 'profile',
): Promise<boolean> {
  if (!resend) return false;

  const subject =
    purpose === 'auth'
      ? 'Your SecureGate sign-in code'
      : 'Confirm your SecureGate profile change';

  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f2742;">
        <h2 style="margin-bottom: 8px;">SecureGate</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; text-align: center; background: #f1f5f9; padding: 18px; border-radius: 12px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #52657a;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend delivery failed:', error.message);
    return false;
  }

  return true;
}
