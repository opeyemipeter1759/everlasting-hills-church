import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import { createAdminClient } from '../members-supabase-admin.util';
import { MemberDeletionService } from './member-deletion.service';

jest.mock('../members-supabase-admin.util', () => ({
  createAdminClient: jest.fn(),
}));

const memberId = 'member-to-delete';
const profileId = 'profile-to-delete';
const authId = 'auth-to-delete';
const tenantId = 'church-tenant';
const actor: AuthUser = {
  userId: 'actor-auth',
  email: 'admin@example.com',
  role: Role.ADMIN_HEAD,
  effectiveRoles: [Role.ADMIN_HEAD],
  unitLeadOf: [],
  hodOf: [],
  headUsher: false,
  profileId: 'actor-profile',
  memberId: 'actor-member',
  tenantId,
};

type Member = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  Profile: { id: string; userId: string | null } | null;
};

const member: Member = {
  id: memberId,
  tenantId,
  firstName: 'Test',
  lastName: 'Member',
  email: 'member@example.com',
  Profile: { id: profileId, userId: authId },
};

const delegateName = (model: string) => model[0].toLowerCase() + model.slice(1);

function setup(record: Member | null = member) {
  // Plain delegate mocks; the schema guard below checks the real FK metadata.
  const tx = Object.fromEntries(
    Prisma.dmmf.datamodel.models.map((model) => [
      delegateName(model.name),
      {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue({}),
      },
    ]),
  ) as Record<string, { deleteMany: jest.Mock; delete: jest.Mock }>;
  const committed = jest.fn();
  const prisma = {
    member: { findUnique: jest.fn().mockResolvedValue(record) },
    $transaction: jest.fn(
      async (callback: (client: typeof tx) => Promise<void>) => {
        await callback(tx);
        committed();
      },
    ),
  };
  const effectiveRoles = {
    getEffectiveRoles: jest
      .fn()
      .mockResolvedValue({ primaryRole: Role.MEMBER }),
  };
  const admin = { deleteUser: jest.fn().mockResolvedValue({ error: null }) };
  (createAdminClient as jest.Mock).mockReturnValue({ auth: { admin } });
  const service = new MemberDeletionService(
    prisma as never,
    effectiveRoles as never,
    { get: jest.fn().mockReturnValue(tenantId) } as never,
  );
  return { service, prisma, tx, effectiveRoles, admin, committed };
}

// Prisma defaults required relations to Restrict and optional ones to SetNull.
// Deriving this list means a newly added blocking FK requires cleanup coverage.
const blockingRelations = Prisma.dmmf.datamodel.models.flatMap((model) =>
  model.fields
    .filter((field) => {
      const action =
        field.relationOnDelete ?? (field.isRequired ? 'Restrict' : 'SetNull');
      return (
        field.kind === 'object' &&
        ['Member', 'Profile'].includes(field.type) &&
        !!field.relationFromFields?.length &&
        ['Restrict', 'NoAction'].includes(action)
      );
    })
    .map((field) => ({
      name: `${model.name}.${field.name}`,
      child: delegateName(model.name),
      parent: delegateName(field.type),
      foreignKeys: field.relationFromFields!,
    })),
);

describe('MemberDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(blockingRelations)(
    'clears the blocking $name relation before its parent',
    async (relation) => {
      const { service, tx } = setup();

      await service.deleteMember(actor, memberId);

      expect(relation.foreignKeys).toHaveLength(1);
      const isMemberProfileLink =
        relation.child === 'member' && relation.parent === 'profile';
      const operation = isMemberProfileLink
        ? tx.member.delete
        : tx[relation.child].deleteMany;
      const expectedFilter = isMemberProfileLink
        ? { id: memberId }
        : {
            [relation.foreignKeys[0]]:
              relation.parent === 'member' ? memberId : profileId,
          };
      const callIndex = operation.mock.calls.findIndex(([args]) =>
        [args.where, ...(args.where.OR ?? [])].some(
          (filter) => JSON.stringify(filter) === JSON.stringify(expectedFilter),
        ),
      );

      expect(callIndex).toBeGreaterThanOrEqual(0);
      expect(operation.mock.invocationCallOrder[callIndex]).toBeLessThan(
        tx[relation.parent].delete.mock.invocationCallOrder[0],
      );
    },
  );

  it('scopes both endpoints of care assignments, greetings, and messages to this member', async () => {
    const { service, tx } = setup();

    await service.deleteMember(actor, memberId);

    expect(tx.careAssignment.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ memberId }, { leaderId: memberId }] },
    });
    expect(tx.birthdayGreeting.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ memberId }, { authorMemberId: memberId }] },
    });
    expect(tx.sermonDirectMessage.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ senderId: memberId }, { recipientId: memberId }] },
    });
  });

  it('removes follow-up subjects and authors using their distinct Member and Profile IDs', async () => {
    const { service, tx } = setup();

    await service.deleteMember(actor, memberId);

    expect(tx.followUpContactLog.deleteMany).toHaveBeenCalledWith({
      where: { byId: memberId },
    });
    expect(tx.followUpConnection.deleteMany).toHaveBeenCalledWith({
      where: { suggestedMemberId: memberId },
    });
    expect(tx.followUpEntry.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.followUpEntry.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ memberId }, { addedById: profileId }] },
    });
    expect(
      tx.followUpContactLog.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.followUpEntry.deleteMany.mock.invocationCallOrder[0]);
    expect(
      tx.followUpEntry.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.member.delete.mock.invocationCallOrder[0]);
  });

  it('removes authored comments before their tasks and reports', async () => {
    const { service, tx } = setup();

    await service.deleteMember(actor, memberId);

    expect(
      tx.unitTaskComment.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.unitTask.deleteMany.mock.invocationCallOrder[0]);
    expect(
      tx.reportComment.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.report.deleteMany.mock.invocationCallOrder[0]);
  });

  it('never issues an unfiltered delete or targets another member, profile, or auth account', async () => {
    const { service, tx, admin } = setup();

    await service.deleteMember(actor, memberId);

    for (const delegate of Object.values(tx)) {
      for (const operation of [delegate.deleteMany, delegate.delete]) {
        for (const [args] of operation.mock.calls) {
          const branches = args.where.OR ?? [args.where];
          expect(branches.length).toBeGreaterThan(0);
          for (const branch of branches) {
            expect(Object.keys(branch)).toHaveLength(1);
            expect([memberId, profileId]).toContain(Object.values(branch)[0]);
          }
        }
      }
    }
    expect(admin.deleteUser).toHaveBeenCalledTimes(1);
    expect(admin.deleteUser).toHaveBeenCalledWith(authId);
  });

  it('supports a member without a Profile without issuing undefined author filters', async () => {
    const { service, tx, effectiveRoles, admin } = setup({
      ...member,
      Profile: null,
    });

    await expect(service.deleteMember(actor, memberId)).resolves.toEqual({
      success: true,
      deletedId: memberId,
    });

    expect(tx.followUpEntry.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ memberId }] },
    });
    expect(tx.profile.delete).not.toHaveBeenCalled();
    expect(tx.unitTask.deleteMany).not.toHaveBeenCalled();
    expect(effectiveRoles.getEffectiveRoles).not.toHaveBeenCalled();
    expect(admin.deleteUser).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it.each([null, { ...member, tenantId: 'another-church' }])(
    'rejects a missing member or a member from another tenant before deleting anything',
    async (record) => {
      const { service, prisma, effectiveRoles } = setup(record);

      await expect(
        service.deleteMember(actor, memberId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(effectiveRoles.getEffectiveRoles).not.toHaveBeenCalled();
      expect(createAdminClient).not.toHaveBeenCalled();
    },
  );

  it('rejects deletion of a higher effective role before opening a transaction', async () => {
    const { service, prisma, effectiveRoles } = setup();
    effectiveRoles.getEffectiveRoles.mockResolvedValue({
      primaryRole: Role.PASTOR,
    });

    await expect(service.deleteMember(actor, memberId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(effectiveRoles.getEffectiveRoles).toHaveBeenCalledWith(profileId);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it.each(['statement', 'commit'])(
    'does not delete auth when the transaction %s fails',
    async (stage) => {
      const { service, prisma, tx, admin, committed } = setup();
      const failure = new Error('Database transaction failed');
      if (stage === 'statement') {
        tx.member.delete.mockRejectedValue(failure);
      } else {
        prisma.$transaction.mockImplementation(async (callback) => {
          await callback(tx);
          throw failure;
        });
      }

      await expect(service.deleteMember(actor, memberId)).rejects.toBe(failure);

      expect(committed).not.toHaveBeenCalled();
      expect(createAdminClient).not.toHaveBeenCalled();
      expect(admin.deleteUser).not.toHaveBeenCalled();
    },
  );

  it('deletes the auth account only after the database transaction has committed', async () => {
    const { service, committed, admin } = setup();

    await expect(service.deleteMember(actor, memberId)).resolves.toEqual({
      success: true,
      deletedId: memberId,
    });

    expect(committed).toHaveBeenCalledTimes(1);
    expect(committed.mock.invocationCallOrder[0]).toBeLessThan(
      admin.deleteUser.mock.invocationCallOrder[0],
    );
  });

  it('keeps the completed database deletion successful when auth cleanup fails', async () => {
    const { service, committed, admin } = setup();
    admin.deleteUser.mockResolvedValue({
      error: { message: 'Auth unavailable' },
    });

    await expect(service.deleteMember(actor, memberId)).resolves.toEqual({
      success: true,
      deletedId: memberId,
    });

    expect(committed).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('Auth unavailable'),
    );
  });
});
