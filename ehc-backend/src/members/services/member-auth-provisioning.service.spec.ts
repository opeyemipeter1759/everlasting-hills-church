import { ConflictException } from '@nestjs/common';
import { MemberAuthProvisioningService } from './member-auth-provisioning.service';
import { createAdminClient } from '../members-supabase-admin.util';

jest.mock('../members-supabase-admin.util', () => ({ createAdminClient: jest.fn() }));

const duplicateError = { message: 'User already registered' };

function setup(profile: { id: string } | null) {
  const admin = {
    createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: duplicateError }),
    listUsers: jest.fn().mockResolvedValue({
      data: { users: [{ id: 'auth-existing', email: 'person@example.com' }] },
      error: null,
    }),
    updateUserById: jest.fn(),
    deleteUser: jest.fn(),
  };
  (createAdminClient as jest.Mock).mockReturnValue({
    auth: { admin, resetPasswordForEmail: jest.fn() },
  });
  const prisma = {
    profile: { findUnique: jest.fn().mockResolvedValue(profile) },
  };
  const config = {
    get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://church.test' : undefined)),
  };
  return {
    service: new MemberAuthProvisioningService(prisma as never, config as never),
    admin,
  };
}

describe('MemberAuthProvisioningService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never mutates a duplicate auth identity that already has a Profile', async () => {
    const { service, admin } = setup({ id: 'profile-1' });

    await expect(service.createOrReuseAuthUser('person@example.com')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(admin.updateUserById).not.toHaveBeenCalled();
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it('reuses an orphan identity, resetting only its password', async () => {
    const { service, admin } = setup(null);
    admin.updateUserById.mockResolvedValue({ error: null });

    const result = await service.createOrReuseAuthUser('person@example.com');
    expect(result.userId).toBe('auth-existing');
    expect(result.created).toBe(false);

    // The orphan's existing password is unknown (it may be a legacy unusable
    // blob), so it is re-set to the temp password the caller is handed. That
    // must be the only field touched — confirmation state and role stay put.
    expect(admin.updateUserById).toHaveBeenCalledTimes(1);
    const [userId, patch] = admin.updateUserById.mock.calls[0];
    expect(userId).toBe('auth-existing');
    expect(patch.password).toBe(result.tempPassword);
    expect(patch.user_metadata).toMatchObject({ needs_password_change: true });
    expect(patch).not.toHaveProperty('email_confirm');
    expect(patch).not.toHaveProperty('app_metadata');
  });

  it('does not derive a new auth password from contact data', async () => {
    const admin = {
      createUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'auth-new' } },
        error: null,
      }),
    };
    (createAdminClient as jest.Mock).mockReturnValue({ auth: { admin } });
    const service = new MemberAuthProvisioningService(
      { profile: { findUnique: jest.fn() } } as never,
      { get: jest.fn().mockReturnValue('https://church.test') } as never,
    );

    await service.createOrReuseAuthUser('person@example.com');
    const request = admin.createUser.mock.calls[0][0];
    // 12 CSPRNG characters, not 64: this password is emailed to the member as a
    // usable temp password they type once, so it has to be typeable. What still
    // matters is that it is generated, never derived from the address.
    expect(request.password).toHaveLength(12);
    expect(request.password).not.toContain('person@example.com');
    expect(request.password).not.toContain('person');
    expect(request.app_metadata).toEqual({ role: 'MEMBER' });
  });

  it('uses a caller-supplied temp password as-is, and only when long enough', async () => {
    const admin = {
      createUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'auth-new' } }, error: null }),
    };
    (createAdminClient as jest.Mock).mockReturnValue({ auth: { admin } });
    const service = new MemberAuthProvisioningService(
      { profile: { findUnique: jest.fn() } } as never,
      { get: jest.fn().mockReturnValue('https://church.test') } as never,
    );

    // Admins provision members with a known temp password (their phone number)
    // so onboarding can tell them what to type.
    await service.createOrReuseAuthUser('person@example.com', ' 08012345678 ');
    expect(admin.createUser.mock.calls[0][0].password).toBe('08012345678');

    // Below Supabase's minimum it is ignored rather than passed through and
    // rejected at the API.
    await service.createOrReuseAuthUser('other@example.com', '123');
    expect(admin.createUser.mock.calls[1][0].password).toHaveLength(12);
  });
});
