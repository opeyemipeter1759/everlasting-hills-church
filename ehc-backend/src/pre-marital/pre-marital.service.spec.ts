import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../auth/types/auth-user';
import type { PrismaService } from '../prisma/prisma.service';
import {
  PreMaritalService,
  referenceCode,
  requirePastoral,
} from './pre-marital.service';
import { validApplication } from './pre-marital.fixture-spec';

const actor = (roles: Role[]): AuthUser => ({
  userId: 'u1',
  email: 'x@example.com',
  role: roles[roles.length - 1] ?? null,
  effectiveRoles: roles,
  unitLeadOf: [],
  hodOf: [],
  headUsher: false,
  profileId: 'p1',
  memberId: 'm1',
  tenantId: 't1',
});

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

function setup() {
  const db = {
    preMaritalApplication: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ status: 'NEW', _count: { _all: 2 } }]),
      updateMany: jest.fn(),
    },
    member: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ firstName: 'Okunola', lastName: 'Peter' }),
    },
  };
  const config = { get: () => 'tenant-1' } as unknown as ConfigService<
    never,
    true
  >;
  return {
    db,
    service: new PreMaritalService(
      db as unknown as PrismaService,
      config as never,
    ),
  };
}

describe('PreMaritalService', () => {
  it('saves an application and answers with its reference only, never the answers', async () => {
    const { db, service } = setup();
    db.preMaritalApplication.create.mockImplementation(async ({ data }) => ({
      referenceCode: data.referenceCode,
      submittedAt: new Date(),
    }));
    const out = await service.submit(validApplication());

    expect(Object.keys(out).sort()).toEqual(['referenceCode', 'submittedAt']);
    expect(out.referenceCode).toMatch(/^PMC-[A-Z2-9]{6}$/);
    const data = db.preMaritalApplication.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      tenantId: 'tenant-1',
      groomEmail: 'tunde@example.com',
      relationshipLength: '1_TO_2_YEARS',
      weddingDate: null,
    });
    expect(data).not.toHaveProperty('consent');
  });

  it('a double click or a retry with the same key gets the first application back, not a second one', async () => {
    const { db, service } = setup();
    const first = {
      referenceCode: 'PMC-AAAAAA',
      submittedAt: new Date('2026-11-19T09:00:00Z'),
    };
    db.preMaritalApplication.create.mockRejectedValueOnce(uniqueViolation());
    db.preMaritalApplication.findUnique.mockResolvedValueOnce(first);

    await expect(service.submit(validApplication())).resolves.toEqual(first);
    expect(db.preMaritalApplication.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_submissionKey: {
            tenantId: 'tenant-1',
            submissionKey: validApplication().submissionKey,
          },
        },
      }),
    );
  });

  it('tries a new reference code when only the code collided', async () => {
    const { db, service } = setup();
    db.preMaritalApplication.create
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce({
        referenceCode: 'PMC-BBBBBB',
        submittedAt: new Date(),
      });
    db.preMaritalApplication.findUnique.mockResolvedValueOnce(null);
    await expect(service.submit(validApplication())).resolves.toMatchObject({
      referenceCode: 'PMC-BBBBBB',
    });
    expect(db.preMaritalApplication.create).toHaveBeenCalledTimes(2);
  });

  it('refuses an invalid application before touching the database', async () => {
    const { db, service } = setup();
    await expect(
      service.submit({ ...validApplication(), brideEmail: 'nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.preMaritalApplication.create).not.toHaveBeenCalled();
  });

  it('lets pastors and Super Admins read and update, and nobody else', async () => {
    expect(() =>
      requirePastoral(actor([Role.MEMBER, Role.PASTOR])),
    ).not.toThrow();
    expect(() =>
      requirePastoral(actor([Role.MEMBER, Role.SUPER_ADMIN])),
    ).not.toThrow();
    for (const roles of [
      [Role.MEMBER],
      [Role.MEMBER, Role.ADMIN_HEAD],
      [Role.MEMBER, Role.UNIT_LEAD],
      [Role.MEMBER, Role.FIRST_TIMER_CONTACT],
    ]) {
      expect(() => requirePastoral(actor(roles))).toThrow(ForbiddenException);
    }
    const { db, service } = setup();
    await expect(
      service.list(actor([Role.MEMBER, Role.ADMIN]), {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.updateStatus(actor([Role.MEMBER]), 'a1', { status: 'CLOSED' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.preMaritalApplication.findMany).not.toHaveBeenCalled();
    expect(db.preMaritalApplication.updateMany).not.toHaveBeenCalled();
  });

  it('lists with counts by status, and shows one without its retry key', async () => {
    const { db, service } = setup();
    await expect(service.list(actor([Role.PASTOR]), {})).resolves.toEqual({
      items: [],
      counts: { NEW: 2, IN_REVIEW: 0, CLOSED: 0 },
    });
    db.preMaritalApplication.findFirst.mockResolvedValueOnce({
      id: 'a1',
      tenantId: 'tenant-1',
      submissionKey: 'k',
      status: 'IN_REVIEW',
      statusUpdatedById: 'p9',
    });
    const one = await service.get(actor([Role.PASTOR]), 'a1');
    expect(one).toEqual({
      id: 'a1',
      status: 'IN_REVIEW',
      statusUpdatedById: 'p9',
      statusUpdatedByName: 'Okunola Peter',
    });
  });

  it('records who changed the status, and refuses a status that does not exist', async () => {
    const { db, service } = setup();
    db.preMaritalApplication.updateMany.mockResolvedValueOnce({ count: 1 });
    db.preMaritalApplication.findFirst.mockResolvedValueOnce({
      id: 'a1',
      tenantId: 'tenant-1',
      submissionKey: 'k',
      status: 'CLOSED',
      statusUpdatedById: 'p1',
    });
    await service.updateStatus(actor([Role.PASTOR]), 'a1', {
      status: 'CLOSED',
    });
    expect(db.preMaritalApplication.updateMany.mock.calls[0][0]).toMatchObject({
      where: { id: 'a1', tenantId: 'tenant-1' },
      data: { status: 'CLOSED', statusUpdatedById: 'p1' },
    });
    await expect(
      service.updateStatus(actor([Role.PASTOR]), 'a1', { status: 'APPROVED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('makes reference codes that are easy to read aloud', () => {
    for (let i = 0; i < 50; i++)
      expect(referenceCode()).toMatch(/^PMC-[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{6}$/);
  });
});
