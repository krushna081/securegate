import { AppError } from '../middleware/errorHandler';
import Society from '../models/Society';
import Flat from '../models/Flat';
import { env } from '../config/env';
import { Types } from 'mongoose';

export async function getDefaultSociety() {
  return Society.findOneAndUpdate(
    { name: env.societyName },
    {
      $setOnInsert: {
        name: env.societyName,
        address: env.societyAddress,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function assignResidentFlat(
  societyId: Types.ObjectId,
  flatNumber: string,
  blockName: string,
  userId: Types.ObjectId,
) {
  const flat = await Flat.findOneAndUpdate(
    {
      societyId,
      flatNumber,
      blockName,
      $or: [
        { residentId: { $exists: false } },
        { residentId: null },
        { residentId: userId },
      ],
    },
    { $set: { residentId: userId } },
    { new: true },
  );

  if (flat) return flat;

  const existing = await Flat.findOne({ societyId, flatNumber, blockName });
  if (existing) {
    throw new AppError(
      'That flat is already registered to another resident. Contact your society admin.',
      409,
    );
  }

  try {
    return await Flat.create({
      societyId,
      flatNumber,
      blockName,
      residentId: userId,
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new AppError('That flat is already registered.', 409);
    }
    throw error;
  }
}

export async function releaseResidentFlat(userId: Types.ObjectId): Promise<void> {
  await Flat.updateMany({ residentId: userId }, { $unset: { residentId: '' } });
}
