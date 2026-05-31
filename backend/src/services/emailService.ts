let resend: any = null;

try {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_XXXXXXXXXXXXXXXXXXXXXXXX') {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch {
  console.warn('Resend not configured. Email sending disabled.');
}

export const sendOtpEmail = async (email: string, otp: string) => {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: 'SecureGate <no-reply@securegate.app>',
    to: email,
    subject: 'Your SecureGate Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>SecureGate OTP Verification</h2>
        <p>Your one-time password is:</p>
        <h1 style="font-size: 36px; letter-spacing: 8px; text-align: center; background: #f0f0f0; padding: 16px; border-radius: 8px;">
          ${otp}
        </h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });
};
