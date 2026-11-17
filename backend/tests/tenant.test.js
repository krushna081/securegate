const { describe, expect, it } = require('@jest/globals');
const {
  assertStatusTransition,
  tenantFilter,
  visitorAccessFilter,
} = require('../dist/utils/tenant');

describe('tenant isolation', () => {
  it('scopes non-admin users to their society', () => {
    expect(tenantFilter({ _id: '1', role: 'guard', societyId: 'soc-1' })).toEqual({
      societyId: 'soc-1',
    });
  });

  it('gives super-admins no society restriction', () => {
    expect(tenantFilter({ _id: '1', role: 'admin' })).toEqual({});
  });

  it('restricts residents to their own visitors', () => {
    expect(
      visitorAccessFilter({ _id: 'user-1', role: 'resident' }, 'visitor-1'),
    ).toEqual({ _id: 'visitor-1', residentId: 'user-1' });
  });

  it('allows residents to approve or reject only pending visitors', () => {
    expect(assertStatusTransition('resident', 'pending', 'approved')).toBe(true);
    expect(assertStatusTransition('resident', 'approved', 'rejected')).toBe(false);
    expect(assertStatusTransition('guard', 'approved', 'pending')).toBe(true);
  });
});
