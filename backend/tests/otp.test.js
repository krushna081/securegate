const { describe, expect, it } = require('@jest/globals');
const {
  escapeRegex,
  generateOtp,
  hashOtp,
  normalizeEmail,
  safeCompare,
} = require('../dist/utils/otp');

describe('otp utilities', () => {
  it('generates a six-digit code', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it('normalizes email addresses', () => {
    expect(normalizeEmail('  User@Example.com ')).toBe('user@example.com');
  });

  it('hashes deterministically and compares safely', () => {
    const hashA = hashOtp('123456', 'user@example.com', 'auth');
    const hashB = hashOtp('123456', 'user@example.com', 'auth');
    expect(hashA).toBe(hashB);
    expect(safeCompare(hashA, hashB)).toBe(true);
    expect(safeCompare(hashA, 'nope')).toBe(false);
  });

  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b+c*d')).toBe('a\\.b\\+c\\*d');
  });
});
