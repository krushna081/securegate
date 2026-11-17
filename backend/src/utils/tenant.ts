import mongoose, { Types } from 'mongoose';

export type UserRole = 'guard' | 'resident' | 'admin';
export type VisitorStatus = 'pending' | 'approved' | 'rejected';

export interface TenantUser {
  _id: Types.ObjectId | string;
  role: UserRole;
  societyId?: Types.ObjectId | string;
}

export function isSuperAdmin(user: TenantUser): boolean {
  return user.role === 'admin' && !user.societyId;
}

export function hasTenant(user: TenantUser): boolean {
  return Boolean(user.societyId) || isSuperAdmin(user);
}

/**
 * Returns a MongoDB filter that restricts a query to the caller's society.
 * Super-admins (admins without a society) are intentionally the only users
 * allowed to cross society boundaries.
 */
export function tenantFilter(user: TenantUser): Record<string, unknown> {
  if (isSuperAdmin(user)) return {};
  if (!user.societyId) return { _id: { $exists: false } };
  return { societyId: user.societyId };
}

export function canAccessSociety(user: TenantUser, societyId: unknown): boolean {
  if (isSuperAdmin(user)) return true;
  if (!user.societyId || !societyId) return false;
  return String(user.societyId) === String(societyId);
}

export function residentVisitorFilter(
  user: TenantUser,
  visitorId?: string,
): Record<string, unknown> {
  return {
    ...(visitorId ? { _id: visitorId } : {}),
    residentId: user._id,
  };
}

export function visitorAccessFilter(
  user: TenantUser,
  visitorId?: string,
): Record<string, unknown> {
  if (user.role === 'resident') {
    return residentVisitorFilter(user, visitorId);
  }

  return {
    ...(visitorId ? { _id: visitorId } : {}),
    ...tenantFilter(user),
  };
}

export function assertStatusTransition(
  role: UserRole,
  current: VisitorStatus,
  next: VisitorStatus,
): boolean {
  if (current === next) return false;
  if (role === 'resident') {
    return current === 'pending' && (next === 'approved' || next === 'rejected');
  }
  return true;
}

export function toObjectId(value: unknown): Types.ObjectId | null {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}
