const { describe, expect, it } = require('@jest/globals');
const { signAuthToken, verifyToken } = require('../dist/utils/tokens');

describe('auth tokens', () => {
  it('signs and verifies an auth token', () => {
    const token = signAuthToken({
      _id: 'user-1',
      role: 'resident',
      tokenVersion: 2,
    });

    const decoded = verifyToken(token);
    expect(decoded.purpose).toBe('auth');
    expect(decoded.userId).toBe('user-1');
    expect(decoded.tokenVersion).toBe(2);
  });
});
