import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import { UsersAuthService } from './users-auth.service';
import { UsersDeletionService } from './users-deletion.service';

const tenantId = 'church-tenant';
const profileId = 'target-profile';
const memberId = 'target-member';
const authId = 'target-auth';
const actor: AuthUser = {
  userId: 'admin-auth',
  email: 'admin@example.com',
  role: Role.ADMIN_HEAD,
  effectiveRoles: [Role.ADMIN_HEAD],
  unitLeadOf: [],
  hodOf: [],
  headUsher: false,
  profileId: 'admin-profile',
  memberId: 'admin-member',
  tenantId,
};
const target = {
  id: profileId,
  userId: authId,
  tenantId,
  Member: { id: memberId, firstName: 'Test', lastName: 'Person', email: 'person@example.com' },
};
type Target = Omit<typeof target, 'Member'> & { Member: typeof target.Member | null };
type Delegate = { deleteMany: jest.Mock; delete: jest.Mock };
const delegateName = (model: string) => model[0].toLowerCase() + model.slice(1);

function setup(record: Target | null = target) {
  const tx = Object.fromEntries(
    Prisma.dmmf.datamodel.models.map((model) => [
      delegateName(model.name),
      {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue({}),
      },
    ]),
  ) as Record<string, Delegate>;
  const committed = jest.fn();
  const prisma = {
    profile: { findUnique: jest.fn().mockResolvedValue(record) },
    $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => {
      await callback(tx);
      committed();
    }),
  };
  const effectiveRoles = {
    getEffectiveRoles: jest.fn().mockResolvedValue({ primaryRole: Role.MEMBER }),
  };
  const config = { get: jest.fn().mockReturnValue(tenantId) };
  const auth = new UsersAuthService(prisma as never, effectiveRoles as never, config as never);
  const admin = { deleteUser: jest.fn().mockResolvedValue({ error: null }) };
  const supabaseAdmin = { getClient: jest.fn().mockReturnValue({ auth: { admin } }) };
  const service = new UsersDeletionService(
    prisma as never,
    auth,
    supabaseAdmin as never,
    config as never,
  );
  return { service, prisma, tx, effectiveRoles, admin, supabaseAdmin, committed };
}

// The People screen deletes by Profile through this service. Checking the actual
// schema prevents this endpoint from silently retaining an older cleanup list.
const blockingRelations = Prisma.dmmf.datamodel.models.flatMap((model) =>
  model.fields
    .filter((field) => {
      const onDelete = field.relationOnDelete ?? (field.isRequired ? 'Restrict' : 'SetNull');
      return (
        field.kind === 'object' &&
        ['Member', 'Profile'].includes(field.type) &&
        !!field.relationFromFields?.length &&
        ['Restrict', 'NoAction'].includes(onDelete)
      );
    })
    .map((field) => ({
      name: `${model.name}.${field.name}`,
      child: delegateName(model.name),
      parent: delegateName(field.type),
      foreignKeys: field.relationFromFields!,
    })),
);

function expectRelationCleared(
  tx: Record<string, Delegate>,
  relation: (typeof blockingRelations)[number],
) {
  expect(relation.foreignKeys).toHaveLength(1);
  const memberProfileLink = relation.child === 'member' && relation.parent === 'profile';
  const operation = memberProfileLink ? tx.member.delete : tx[relation.child].deleteMany;
  const expectedWhere = memberProfileLink
    ? { id: memberId }
    : { [relation.foreignKeys[0]]: relation.parent === 'member' ? memberId : profileId };
  const callIndex = operation.mock.calls.findIndex(([args]) =>
    [args.where, ...(args.where.OR ?? [])].some(
      (where) => JSON.stringify(where) === JSON.stringify(expectedWhere),
    ),
  );
  expect({ relation: relation.name, cleared: callIndex >= 0 }).toEqual({
    relation: relation.name,
    cleared: true,
  });
  expect(operation.mock.invocationCallOrder[callIndex]).toBeLessThan(
    tx[relation.parent].delete.mock.invocationCallOrder[0],
  );
}

describe('UsersDeletionService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('clears every restrictive Member and Profile dependency before deleting either parent', async () => {
    const { service, tx, prisma } = setup();

    await expect(service.deleteUser(actor, profileId)).resolves.toEqual({
      success: true,
      deletedProfileId: profileId,
    });

    expect(prisma.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: profileId } }),
    );
    for (const relation of blockingRelations) expectRelationCleared(tx, relation);
    expect(tx.member.delete).toHaveBeenCalledWith({ where: { id: memberId } });
    expect(tx.profile.delete).toHaveBeenCalledWith({ where: { id: profileId } });
  });

  it('removes profile-only users without undefined member predicates or unfiltered deletes', async () => {
    const { service, tx, admin } = setup({ ...target, Member: null });

    await service.deleteUser(actor, profileId);

    for (const relation of blockingRelations.filter(
      (relation) => relation.parent === 'profile' && relation.child !== 'member',
    )) {
      expectRelationCleared(tx, relation);
    }
    expect(tx.member.delete).not.toHaveBeenCalled();
    expect(tx.member.deleteMany).not.toHaveBeenCalled();
    for (const delegate of Object.values(tx)) {
      for (const operation of [delegate.delete, delegate.deleteMany]) {
        for (const [args] of operation.mock.calls) {
          expect(args.where).toBeDefined();
          const branches = args.where.OR ?? [args.where];
          expect(branches.length).toBeGreaterThan(0);
          for (const branch of branches) {
            expect(Object.keys(branch)).toHaveLength(1);
            expect(Object.values(branch)).toEqual([profileId]);
          }
        }
      }
    }
    expect(admin.deleteUser).toHaveBeenCalledWith(authId);
  });

  it.each([null, { ...target, tenantId: 'another-tenant' }])(
    'rejects missing and foreign-tenant profiles before checking roles or mutating records',
    async (record) => {
      const { service, prisma, effectiveRoles, supabaseAdmin } = setup(record);

      await expect(service.deleteUser(actor, profileId)).rejects.toBeInstanceOf(NotFoundException);

      expect(effectiveRoles.getEffectiveRoles).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(supabaseAdmin.getClient).not.toHaveBeenCalled();
    },
  );

  it.each([Role.ADMIN_HEAD, Role.PASTOR])(
    'rejects a target with equal or higher effective role %s before opening a transaction',
    async (role) => {
      const { service, prisma, effectiveRoles, supabaseAdmin } = setup();
      effectiveRoles.getEffectiveRoles.mockResolvedValue({ primaryRole: role });

      await expect(service.deleteUser(actor, profileId)).rejects.toBeInstanceOf(ForbiddenException);

      expect(effectiveRoles.getEffectiveRoles).toHaveBeenCalledWith(profileId);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(supabaseAdmin.getClient).not.toHaveBeenCalled();
    },
  );

  it.each(['statement', 'commit'])('never deletes auth when a transaction %s fails', async (stage) => {
    const { service, prisma, tx, committed, admin, supabaseAdmin } = setup();
    const failure = new Error('Database failure');
    if (stage === 'statement') {
      tx.profile.delete.mockRejectedValue(failure);
    } else {
      prisma.$transaction.mockImplementation(async (callback) => {
        await callback(tx);
        throw failure;
      });
    }

    await expect(service.deleteUser(actor, profileId)).rejects.toBe(failure);

    expect(committed).not.toHaveBeenCalled();
    expect(supabaseAdmin.getClient).not.toHaveBeenCalled();
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes only the target auth identity after the database commit', async () => {
    const { service, committed, admin } = setup();

    await service.deleteUser(actor, profileId);

    expect(committed).toHaveBeenCalledTimes(1);
    expect(admin.deleteUser).toHaveBeenCalledTimes(1);
    expect(admin.deleteUser).toHaveBeenCalledWith(authId);
    expect(committed.mock.invocationCallOrder[0]).toBeLessThan(
      admin.deleteUser.mock.invocationCallOrder[0],
    );
  });
});
