const { describe, expect, it } = require('@jest/globals');
const {
  createAccountSchema,
  visitorCreateSchema,
  visitorStatusSchema,
} = require('../dist/validation/schemas');

describe('validation schemas', () => {
  it('rejects public admin registration', () => {
    const result = createAccountSchema.safeParse({
      registrationToken: 'a'.repeat(32),
      fullName: 'Test User',
      phoneNumber: '9999999999',
      role: 'admin',
      flatNumber: '101',
      blockName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('requires flat details for residents', () => {
    const result = createAccountSchema.safeParse({
      registrationToken: 'a'.repeat(32),
      fullName: 'Test User',
      phoneNumber: '9999999999',
      role: 'resident',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid visitor creation payload', () => {
    const result = visitorCreateSchema.safeParse({
      visitorName: 'Guest',
      visitorType: 'guest',
      phoneNumber: '9999999999',
      flatId: '507f1f77bcf86cd799439011',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown visitor statuses', () => {
    const result = visitorStatusSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });
});
