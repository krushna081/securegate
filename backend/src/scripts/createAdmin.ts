import 'dotenv/config';
import connectDB from '../config/db';
import { assertConfig } from '../config/env';
import User from '../models/User';
import Society from '../models/Society';
import { getDefaultSociety } from '../utils/society';

async function main(): Promise<void> {
  const [, , emailArg, fullNameArg, phoneArg, societyArg] = process.argv;

  if (!emailArg || !fullNameArg) {
    console.error(
      'Usage: npm run create-admin -- <email> <fullName> [phoneNumber] [societyName]',
    );
    process.exit(1);
  }

  assertConfig();
  await connectDB();

  const email = emailArg.trim().toLowerCase();
  const fullName = fullNameArg.trim();
  const phoneNumber = (phoneArg || '0000000000').trim();
  const society = societyArg
    ? await Society.findOneAndUpdate(
        { name: societyArg.trim() },
        { $setOnInsert: { name: societyArg.trim(), address: '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
    : await getDefaultSociety();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.fullName = fullName;
    existing.phoneNumber = phoneNumber;
    existing.role = 'admin';
    existing.societyId = society._id;
    existing.isActive = true;
    await existing.save();
    console.log(`Updated existing user as admin: ${email}`);
  } else {
    await User.create({
      email,
      fullName,
      phoneNumber,
      role: 'admin',
      societyId: society._id,
      tokenVersion: 0,
      isActive: true,
    });
    console.log(`Created admin: ${email}`);
  }

  console.log(`Society: ${society.name}`);
  console.log('Sign in with email OTP to access the admin account.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to create admin:', error instanceof Error ? error.message : error);
  process.exit(1);
});
