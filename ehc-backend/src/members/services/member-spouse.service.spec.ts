import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MemberSpouseService, effectiveMaritalStatus } from './member-spouse.service';
import { MemberFamilyService } from './member-family.service';
import { MemberProfileService } from './member-profile.service';

const config = { get: () => 'tenant' } as never;
const person = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  firstName: id === 'ada' ? 'Ada' : 'Bayo',
  lastName: 'Obi',
  photoUrl: null,
  profileId: `p-${id}`,
  spouseMemberId: null,
  weddingAnniversary: null,
  ...extra,
});

function setup(me = 'ada') {
  const prisma = {
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn((args) => ({ op: 'member.update', ...args })),
      updateMany: jest.fn((args) => ({ op: 'member.updateMany', ...args })),
    },
    spouseRequest: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn((args) => ({ op: 'request.create', ...args })),
      update: jest.fn((args) => ({ op: 'request.update', ...args })),
      updateMany: jest.fn((args) => ({ op: 'request.updateMany', ...args })),
    },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };
  const selfLookup = { getMyMember: jest.fn().mockResolvedValue({ profileId: `p-${me}`, memberId: me }) };
  const inbox = { createMany: jest.fn().mockResolvedValue(1) };
  const svc = new MemberSpouseService(prisma as never, selfLookup as never, inbox as never, config);
  jest.spyOn(svc, 'mine').mockResolvedValue({} as never);
  return { svc, prisma, inbox, selfLookup };
}

describe('Linking a spouse', () => {
  it('asks the other member, and shows nothing on their profile yet', async () => {
    const { svc, prisma, inbox } = setup();
    prisma.member.findUnique.mockResolvedValue(person('ada'));
    prisma.member.findFirst.mockResolvedValue(person('bayo'));

    await svc.request('u-ada', 'bayo');

    expect(prisma.spouseRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ fromMemberId: 'ada', toMemberId: 'bayo', tenantId: 'tenant' }),
    });
    // No spouse link is written for anyone until they accept.
    for (const [args] of prisma.member.update.mock.calls) expect(args.data).not.toHaveProperty('spouseMemberId');
    expect(inbox.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ profileId: 'p-bayo', title: 'Ada Obi listed you as their spouse', type: 'spouse-request' }),
    ]);
  });

  it('will not link a member to themselves, or to someone already linked', async () => {
    const { svc, prisma } = setup();
    await expect(svc.request('u-ada', 'ada')).rejects.toBeInstanceOf(BadRequestException);

    prisma.member.findUnique.mockResolvedValue(person('ada'));
    prisma.member.findFirst.mockResolvedValue(person('bayo', { spouseMemberId: 'someone' }));
    await expect(svc.request('u-ada', 'bayo')).rejects.toThrow('already linked');
  });

  it('links both members to each other when the spouse accepts, sharing one wedding date', async () => {
    const { svc, prisma, inbox } = setup('bayo');
    const wedding = new Date('2015-06-20T00:00:00Z');
    prisma.spouseRequest.findUnique.mockResolvedValue({
      id: 'r1',
      status: 'PENDING',
      fromMemberId: 'ada',
      toMemberId: 'bayo',
      From: person('ada', { weddingAnniversary: wedding }),
      To: person('bayo'),
    });

    await svc.respond('u-bayo', 'r1', true);

    const updates = prisma.member.update.mock.calls.map(([args]) => args);
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ where: { id: 'ada' }, data: expect.objectContaining({ spouseMemberId: 'bayo', maritalStatus: 'MARRIED', weddingAnniversary: wedding }) }),
        expect.objectContaining({ where: { id: 'bayo' }, data: expect.objectContaining({ spouseMemberId: 'ada', maritalStatus: 'MARRIED', weddingAnniversary: wedding }) }),
      ]),
    );
    expect(prisma.spouseRequest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'ACCEPTED' }) }));
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ profileId: 'p-ada', type: 'spouse-accepted' })]);
  });

  it('links nobody when the spouse declines', async () => {
    const { svc, prisma, inbox } = setup('bayo');
    prisma.spouseRequest.findUnique.mockResolvedValue({
      id: 'r1', status: 'PENDING', fromMemberId: 'ada', toMemberId: 'bayo', From: person('ada'), To: person('bayo'),
    });

    await svc.respond('u-bayo', 'r1', false);

    expect(prisma.member.update).not.toHaveBeenCalled();
    expect(prisma.spouseRequest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'DECLINED' }) }));
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ profileId: 'p-ada', type: 'spouse-declined' })]);
  });

  it('lets only the member who was asked answer', async () => {
    const { svc, prisma } = setup('someone-else');
    prisma.spouseRequest.findUnique.mockResolvedValue({
      id: 'r1', status: 'PENDING', fromMemberId: 'ada', toMemberId: 'bayo', From: person('ada'), To: person('bayo'),
    });
    await expect(svc.respond('u-x', 'r1', true)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('treats asking someone who already asked you as agreeing', async () => {
    const { svc, prisma } = setup('bayo');
    prisma.member.findUnique.mockResolvedValue(person('bayo'));
    prisma.member.findFirst.mockResolvedValue(person('ada'));
    prisma.spouseRequest.findFirst.mockResolvedValue({ id: 'r1' });
    const respond = jest.spyOn(svc, 'respond').mockResolvedValue({} as never);

    await svc.request('u-bayo', 'ada');

    expect(respond).toHaveBeenCalledWith('u-bayo', 'r1', true, undefined);
    expect(prisma.spouseRequest.create).not.toHaveBeenCalled();
  });

  it('removes the link on both sides', () => {
    const { svc, prisma } = setup();
    svc.unlinkOps('ada');
    expect(prisma.member.updateMany).toHaveBeenCalledWith({ where: { spouseMemberId: 'ada' }, data: { spouseMemberId: null } });
    expect(prisma.member.update).toHaveBeenCalledWith({ where: { id: 'ada' }, data: { spouseMemberId: null } });
  });

  it('reads older records, where a wedding date meant married', () => {
    expect(effectiveMaritalStatus({ maritalStatus: null, weddingAnniversary: new Date() })).toBe('MARRIED');
    expect(effectiveMaritalStatus({ maritalStatus: null, weddingAnniversary: null })).toBe('SINGLE');
    expect(effectiveMaritalStatus({ maritalStatus: 'MARRIED', weddingAnniversary: null })).toBe('MARRIED');
  });
});

describe('Choosing Single in the profile', () => {
  it('ends the spouse link for both and clears the wedding date', async () => {
    const tx = jest.fn().mockResolvedValue([]);
    const update = jest.fn().mockResolvedValue({ weddingAnniversary: null });
    const prisma = { member: { findUnique: jest.fn().mockResolvedValue({ spouseMemberId: 'bayo' }), update }, $transaction: tx };
    const spouse = { unlinkOps: jest.fn().mockReturnValue(['unlink']) };
    const svc = new MemberProfileService(
      prisma as never,
      { getMyMember: jest.fn().mockResolvedValue({ memberId: 'ada' }) } as never,
      spouse as never,
    );

    await svc.updateMyProfile('u-ada', { maritalStatus: 'SINGLE' });

    expect(spouse.unlinkOps).toHaveBeenCalledWith('ada');
    expect(tx).toHaveBeenCalledWith(['unlink']);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].data).toMatchObject({ maritalStatus: 'SINGLE', spouseName: null, weddingAnniversary: null });
  });

  it('shares a changed wedding date with a linked spouse', async () => {
    const wedding = new Date('2015-06-20T00:00:00Z');
    const update = jest.fn().mockResolvedValue({ weddingAnniversary: wedding });
    const prisma = { member: { findUnique: jest.fn().mockResolvedValue({ spouseMemberId: 'bayo' }), update }, $transaction: jest.fn() };
    const svc = new MemberProfileService(
      prisma as never,
      { getMyMember: jest.fn().mockResolvedValue({ memberId: 'ada' }) } as never,
      { unlinkOps: jest.fn() } as never,
    );

    await svc.updateMyProfile('u-ada', { maritalStatus: 'MARRIED', weddingAnniversary: '2015-06-20' });

    expect(update).toHaveBeenLastCalledWith({ where: { id: 'bayo' }, data: { weddingAnniversary: wedding } });
  });
});

describe('A member profile as the church family sees it', () => {
  it('leaves out phone, email, address and birth year, and shows a confirmed spouse', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'ada',
      firstName: 'Ada',
      lastName: 'Obi',
      photoUrl: null,
      bio: 'Choir',
      gender: 'Female',
      joinedAt: new Date('2020-01-01'),
      dateOfBirth: new Date('1990-02-18T00:00:00Z'),
      weddingAnniversary: new Date('2015-06-20T00:00:00Z'),
      maritalStatus: 'MARRIED',
      spouseName: null,
      Spouse: { id: 'bayo', firstName: 'Bayo', lastName: 'Obi', photoUrl: null, status: 'ACTIVE' },
      instagram: 'ada',
      facebook: null,
      twitter: null,
      linkedin: null,
      tiktok: null,
      UnitMember: [],
    });
    const svc = new MemberFamilyService({ member: { findFirst } } as never, config);

    const profile = await svc.profile('ada');

    const select = findFirst.mock.calls[0][0].select;
    expect(select).not.toHaveProperty('phone');
    expect(select).not.toHaveProperty('email');
    expect(select).not.toHaveProperty('address');
    expect(findFirst.mock.calls[0][0].where).toMatchObject({ status: 'ACTIVE', tenantId: 'tenant' });
    expect(profile.birthday).toEqual({ day: 18, month: 2 });
    expect(profile).not.toHaveProperty('dateOfBirth');
    expect(profile.spouse).toEqual({ id: 'bayo', name: 'Bayo Obi', photoUrl: null });
    expect(profile.anniversary).toEqual({ day: 20, month: 6 });
  });
});
