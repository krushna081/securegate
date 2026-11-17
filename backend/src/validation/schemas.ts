import { z } from 'zod';

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

const email = z
  .string()
  .trim()
  .min(3, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address')
  .transform((value) => value.toLowerCase());

const otp = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Phone number is too long')
  .regex(/^[+]?[\d\s-]{7,20}$/, 'Enter a valid phone number');

const photo = z
  .string()
  .max(1_500_000, 'Photo is too large')
  .refine(
    (value) =>
      value.startsWith('data:image/jpeg;base64,') ||
      value.startsWith('data:image/png;base64,') ||
      value.startsWith('data:image/webp;base64,') ||
      value.startsWith('https://'),
    'Photo must be an image data URL or an HTTPS URL',
  );

export const emailSchema = z.object({ email });

export const verifyOtpSchema = z.object({ email, otp });

export const profileOtpSchema = z.object({ otp });

export const createAccountSchema = z
  .object({
    registrationToken: z.string().min(20, 'Registration verification is required'),
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    phoneNumber: phone,
    role: z.enum(['resident', 'guard']).default('resident'),
    inviteCode: z.string().trim().max(128).optional(),
    flatNumber: z.string().trim().max(20).optional(),
    blockName: z.string().trim().max(20).optional(),
  })
  .refine(
    (value) =>
      value.role !== 'resident' || (Boolean(value.flatNumber) && Boolean(value.blockName)),
    {
      message: 'Flat number and block are required for residents',
      path: ['flatNumber'],
    },
  );

export const staffCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email,
  phoneNumber: phone,
  role: z.enum(['guard', 'admin']),
  gateNumber: z.string().trim().max(40).optional(),
  societyId: objectId.optional(),
});

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80).optional(),
    phoneNumber: phone.optional(),
    phoneNumber2: phone.optional(),
    photoUrl: photo.nullable().optional(),
    flatNumber: z.string().trim().max(20).optional(),
    blockName: z.string().trim().max(20).optional(),
    gateNumber: z.string().trim().max(40).optional(),
    verificationToken: z.string().min(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No changes supplied');

export const visitorCreateSchema = z.object({
  visitorName: z.string().trim().min(2, 'Visitor name is required').max(80),
  visitorType: z.enum([
    'guest',
    'delivery',
    'maid',
    'electrician',
    'plumber',
    'courier',
    'technician',
    'driver',
    'maintenance',
  ]),
  photoUrl: photo.optional(),
  phoneNumber: phone,
  flatId: objectId,
  notes: z.string().trim().max(500).optional(),
  vehicleNumber: z.string().trim().max(24).optional(),
});

export const visitorUpdateSchema = z
  .object({
    visitorName: z.string().trim().min(2).max(80).optional(),
    visitorType: z
      .enum([
        'guest',
        'delivery',
        'maid',
        'electrician',
        'plumber',
        'courier',
        'technician',
        'driver',
        'maintenance',
      ])
      .optional(),
    phoneNumber: phone.optional(),
    flatId: objectId.optional(),
    notes: z.string().trim().max(500).optional(),
    vehicleNumber: z.string().trim().max(24).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No changes supplied');

export const visitorStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

export const preApprovalCreateSchema = z.object({
  guestName: z.string().trim().min(2, 'Guest name is required').max(80),
  numberOfPeople: z.coerce.number().int().min(1).max(20).default(1),
  vehicleType: z.enum(['none', '2-wheeler', '4-wheeler']).default('none'),
  vehicleNumber: z.string().trim().max(24).optional(),
  expectedTime: z.string().datetime({ offset: true }).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const preApprovalUpdateSchema = preApprovalCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'No changes supplied',
);

export const preApprovalStatusSchema = z.object({
  status: z.enum(['expected', 'approved', 'arrived']),
});

export const meetingCreateSchema = z.object({
  societyId: objectId.optional(),
  title: z.string().trim().min(2, 'Title is required').max(100),
  description: z.string().trim().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  time: z.string().trim().min(3).max(20),
  location: z.string().trim().max(100).optional(),
});

export const pushTokenSchema = z.object({
  pushToken: z.string().trim().min(10, 'Push token is required').max(200),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const visitorQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  flatId: objectId.optional(),
});

export const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1, 'Enter a flat or block').max(60),
});

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['guard', 'resident', 'admin']).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type VisitorCreateInput = z.infer<typeof visitorCreateSchema>;
export type VisitorUpdateInput = z.infer<typeof visitorUpdateSchema>;
export type PreApprovalCreateInput = z.infer<typeof preApprovalCreateSchema>;
export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;
