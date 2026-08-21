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

  it('reuses an orphan identity without changing its password or metadata', async () => {
    const { service, admin } = setup(null);

    await expect(service.createOrReuseAuthUser('person@example.com')).resolves.toEqual({
      userId: 'auth-existing',
      created: false,
    });
    expect(admin.updateUserById).not.toHaveBeenCalled();
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
    expect(request.password).toHaveLength(64);
    expect(request.password).not.toContain('person@example.com');
    expect(request.app_metadata).toEqual({ role: 'MEMBER' });
  });
});
