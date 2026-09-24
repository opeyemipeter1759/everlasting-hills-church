import { Role } from '@prisma/client';
import { FollowUpAssignableService } from './follow-up-assignable.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * A Super Admin has access to everything but is never given follow-up work:
 * they run the system rather than carrying a share of the calls.
 */
function makeService(superAdminMemberIds: string[]) {
  const findMany = jest.fn().mockResolvedValue(superAdminMemberIds.map((id) => ({ id })));
  const prisma = { member: { findMany } } as unknown as PrismaService;
  const config = { get: () => 't1' } as never;
  return { service: new FollowUpAssignableService(prisma, config), findMany };
}

describe('FollowUpAssignableService', () => {
  it('spots a Super Admin by an active role grant', async () => {
    const { service, findMany } = makeService(['m-super']);

    await expect(service.isSuperAdmin('m-super')).resolves.toBe(true);

    const where = findMany.mock.calls[0][0].where;
    expect(where.Profile.RoleGrantOf.some).toEqual({ role: Role.SUPER_ADMIN, endedAt: null });
    expect(where.tenantId).toBe('t1');
  });

  it('treats everyone else as assignable', async () => {
    const { service } = makeService([]);
    await expect(service.isSuperAdmin('m-1')).resolves.toBe(false);
  });

  it('drops Super Admins from a list of candidates, keeping the rest in order', async () => {
    const { service } = makeService(['m-super']);

    const result = await service.assignableOnly([
      { id: 'm-1', name: 'Grace' },
      { id: 'm-super', name: 'The Super Admin' },
      { id: 'm-2', name: 'John' },
    ]);

    expect(result.map((r) => r.name)).toEqual(['Grace', 'John']);
  });

  it('asks the database nothing when there are no candidates', async () => {
    const { service, findMany } = makeService([]);

    await expect(service.assignableOnly([])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
