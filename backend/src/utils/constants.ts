export const VISITOR_TYPES = [
  'guest', 'delivery', 'maid', 'electrician',
  'plumber', 'courier', 'technician', 'driver', 'maintenance'
] as const;

export const USER_ROLES = ['guard', 'resident', 'admin'] as const;

export const VISITOR_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const OTP_EXPIRY_MINUTES = 10;
