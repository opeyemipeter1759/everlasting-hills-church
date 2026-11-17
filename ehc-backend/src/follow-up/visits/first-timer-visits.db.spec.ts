import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { findPossibleReturn } from '../../forms/services/first-timer-return';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { PossibleReturnService } from './possible-return.service';
import { visitsTestTenant } from './visits-test.helpers';

/**
 * Visits and possible return visits against a disposable Postgres with the
 * migrations applied. Set PIPELINE_TEST_DATABASE_URL to run it; it is skipped
 * otherwise. It seeds a tenant of its own and deletes it afterwards.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
jest.setTimeout(120_000); // generous: a cold or busy local database can be slow to seed

maybe('First-timer visits against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const t = visitsTestTenant(prisma);
  const pipeline = new PipelineRepository(prisma as never, t.config);
  const visits = new FirstTimerVisitsService(prisma as never, pipeline, t.config);
  const returns = new PossibleReturnService(prisma as never, t.config);

  beforeAll(async () => {
    await t.setup();
    // The latest service held is the late one on 14 March UTC, which is 15 March in Lagos.
    await t.service('2026-03-01T08:00:00Z');
    await t.service('2026-03-14T23:30:00Z');
    await t.service('2026-03-21T08:00:00Z', { cancelledAt: new Date('2026-03-20T00:00:00Z') });
    await t.service('2099-01-04T08:00:00Z');
  });

  afterAll(async () => {
    await t.cleanup();
    await prisma.$disconnect();
  });

  describe('Came again', () => {
    let v: string;
    beforeAll(async () => {
      v = await t.visitor({ first: 'Came', firstVisit: '2026-02-01' });
    });

    it('defaults to the latest service held, in Lagos time, and the same day twice is one visit', async () => {
      const first = await visits.cameAgain(t.actor(), v);
      expect(first).toMatchObject({ added: true, date: '2026-03-15' });
      expect(first.person).toMatchObject({ visits: 2, status: 'SECOND_TIMER' });

      const again = await visits.cameAgain(t.actor(), v);
      expect(again).toMatchObject({ added: false, date: '2026-03-15' });
      expect(again.person.visits).toBe(2);

      const third = await visits.cameAgain(t.actor(), v, '2026-03-22');
      expect(third.person).toMatchObject({ visits: 3, status: 'THIRD_TIMER' });
    });

    it('refuses a future date, a date before the first visit, and a day that does not exist', async () => {
      await expect(visits.cameAgain(t.actor(), v, '2099-01-01')).rejects.toThrow(BadRequestException);
      await expect(visits.cameAgain(t.actor(), v, '2026-01-20')).rejects.toThrow(BadRequestException);
      await expect(visits.cameAgain(t.actor(), v, '2026-02-30')).rejects.toThrow(BadRequestException);
    });

    it('undoes a Came again visit, but never the first visit or a confirmed return', async () => {
      expect((await visits.undo(t.actor(), v, '2026-03-22')).visits).toBe(2);
      await expect(visits.undo(t.actor(), v, '2026-02-01')).rejects.toThrow(BadRequestException);
      await t.visit(v, '2026-03-29', 'RETURN_FORM');
      await expect(visits.undo(t.actor(), v, '2026-03-29')).rejects.toThrow(BadRequestException);
      await expect(visits.undo(t.actor(), v, '2026-04-05')).rejects.toThrow(NotFoundException);
    });

    it('lists how each visit was recorded, with the day Came again would use', async () => {
      const list = await visits.list(v);
      expect(list.latestServiceDate).toBe('2026-03-15');
      expect(list.recorded).toEqual([
        { date: '2026-02-01', source: 'FORM' },
        { date: '2026-03-15', source: 'CAME_AGAIN' },
        { date: '2026-03-29', source: 'RETURN_FORM' },
      ]);
    });
  });

  describe('first visit correction', () => {
    it('moves the first visit, its FORM row and the month they count in', async () => {
      const w = await t.visitor({ first: 'Late-card', firstVisit: '2026-04-07' });
      await t.visit(w, '2026-04-12');
      const person = await visits.correctFirstVisit(t.actor(), w, '2026-03-29');
      expect(person).toMatchObject({ firstVisitDate: '2026-03-29', visits: 2, visitDates: ['2026-03-29', '2026-04-12'] });

      const form = await prisma.firstTimerVisit.findMany({ where: { visitorId: w, source: 'FORM' } });
      expect(form.map((r) => r.visitedOn.toISOString().slice(0, 10))).toEqual(['2026-03-29']);
      expect((await pipeline.list({ year: 2026, month: 3, visitorIds: [w] })).total).toBe(1);
      expect((await pipeline.list({ year: 2026, month: 4, visitorIds: [w] })).total).toBe(0);

      await expect(visits.correctFirstVisit(t.actor(), w, '2026-04-12')).rejects.toThrow(BadRequestException);
      await expect(visits.correctFirstVisit(t.actor(), w, '2099-01-01')).rejects.toThrow(BadRequestException);
    });
  });

  describe('status from visits, check-ins included', () => {
    it('counts two check-ins on one date as one visit, a fourth visit as Third timer, and lets stage win', async () => {
      const memberId = await t.member('Checked-in');
      const v = await t.visitor({ first: 'Checked-in', firstVisit: '2026-05-03', extra: { convertedAt: new Date(), convertedToMemberId: memberId } });
      // Morning and evening service on 10 May, plus a Came again on the same day: one visit.
      await t.attend(memberId, await t.service('2026-05-10T07:00:00Z'));
      await t.attend(memberId, await t.service('2026-05-10T16:00:00Z'));
      await t.visit(v, '2026-05-10');
      expect(await pipeline.one(v)).toMatchObject({ visits: 2, status: 'SECOND_TIMER' });

      await t.attend(memberId, await t.service('2026-05-17T07:00:00Z'));
      await t.attend(memberId, await t.service('2026-05-24T07:00:00Z'));
      await t.attend(memberId, await t.service('2026-05-31T07:00:00Z'), false);
      expect(await pipeline.one(v)).toMatchObject({ visits: 4, status: 'THIRD_TIMER' });

      await t.entry(v, 'CONFIRMED');
      expect((await pipeline.one(v))?.status).toBe('INTEGRATED');
      await prisma.member.update({ where: { id: memberId }, data: { status: 'INACTIVE' } });
      expect((await pipeline.one(v))?.status).toBe('OPTED_OUT');
    });

    it('reads Opted out from the stage, whatever the visits', async () => {
      const v = await t.visitor({ first: 'Stage-out', firstVisit: '2026-05-03' });
      for (const d of ['2026-05-10', '2026-05-17']) await t.visit(v, d);
      await t.entry(v, 'OPTED_OUT');
      expect(await pipeline.one(v)).toMatchObject({ visits: 3, status: 'OPTED_OUT' });
    });
  });

  describe('possible return visit', () => {
    const fields = { firstName: true, lastName: true, phone: true, email: true, convertedToMemberId: true, firstVisitDate: true };

    it('flags a form whose phone is already on record', async () => {
      const a = await t.visitor({ first: 'Flag-original', firstVisit: '2026-06-07', phone: '08031230001' });
      expect(await findPossibleReturn(prisma as never, t.tenantId, '2348031230001', null)).toEqual({ visitorId: a, memberId: null });
    });

    it('Same person adds a visit to the original and archives the new form, merging nothing', async () => {
      const a = await t.visitor({ first: 'Ada', firstVisit: '2026-06-07', phone: '08031230002' });
      const b = await t.visitor({ first: 'Ada-again', firstVisit: '2026-06-21', phone: '2348031230002', extra: { possibleReturnVisitorId: a } });
      expect((await pipeline.one(b))?.possibleReturn).toBe(true);
      const before = await prisma.visitor.findMany({ where: { id: { in: [a, b] } }, select: { id: true, ...fields }, orderBy: { id: 'asc' } });
      const count = await prisma.visitor.count({ where: { tenantId: t.tenantId } });

      expect(await returns.confirm(t.actor(), b)).toEqual({ originalVisitorId: a, memberId: null, date: '2026-06-21' });

      expect(await pipeline.one(a)).toMatchObject({ visits: 2, status: 'SECOND_TIMER', visitDates: ['2026-06-07', '2026-06-21'] });
      expect(await pipeline.one(b)).toBeNull();
      const archived = await prisma.visitor.findUniqueOrThrow({ where: { id: b } });
      expect(archived.archivedAt).not.toBeNull();
      expect(archived.archivedById).toBe(t.profileId);
      expect(archived.possibleReturnResolvedAt).not.toBeNull();
      // Both records are still there, unchanged, and the new form keeps its own visit.
      expect(await prisma.visitor.findMany({ where: { id: { in: [a, b] } }, select: { id: true, ...fields }, orderBy: { id: 'asc' } })).toEqual(before);
      expect(await prisma.visitor.count({ where: { tenantId: t.tenantId } })).toBe(count);
      expect(await prisma.firstTimerVisit.count({ where: { visitorId: b, source: 'FORM' } })).toBe(1);

      await expect(returns.confirm(t.actor(), b)).rejects.toThrow(ConflictException);
    });

    it('Different person only clears the flag', async () => {
      const a = await t.visitor({ first: 'Bola', firstVisit: '2026-06-07', phone: '08031230003' });
      const c = await t.visitor({ first: 'Bola-sister', firstVisit: '2026-06-28', phone: '08031230003', extra: { possibleReturnVisitorId: a } });
      const before = await prisma.visitor.findMany({ where: { id: { in: [a, c] } }, select: { id: true, ...fields }, orderBy: { id: 'asc' } });

      expect(await returns.dismiss(t.actor(), c)).toEqual({ resolved: true });

      expect(await pipeline.one(c)).toMatchObject({ possibleReturn: false, visits: 1 });
      expect(await pipeline.one(a)).toMatchObject({ visits: 1 });
      expect((await prisma.visitor.findUniqueOrThrow({ where: { id: c } })).archivedAt).toBeNull();
      expect(await prisma.visitor.findMany({ where: { id: { in: [a, c] } }, select: { id: true, ...fields }, orderBy: { id: 'asc' } })).toEqual(before);
      expect(await returns.dismiss(t.actor(), c)).toEqual({ resolved: true });
    });

    it('notes it on the member thread when the match is a member who never filled in the form', async () => {
      const memberId = await t.member('Chi');
      const d = await t.visitor({ first: 'Chi', firstVisit: '2026-07-05', extra: { possibleReturnMemberId: memberId } });
      expect(await returns.confirm(t.actor(), d)).toEqual({ originalVisitorId: null, memberId, date: '2026-07-05' });
      const notes = await prisma.followUpNote.findMany({ where: { subjectKind: 'MEMBER', subjectId: memberId } });
      expect(notes).toHaveLength(1);
      expect(notes[0].body).toContain('5 Jul 2026');
      expect(await prisma.member.findUniqueOrThrow({ where: { id: memberId }, select: { firstName: true, status: true } })).toEqual({ firstName: 'Chi', status: 'ACTIVE' });
    });

    it('puts the visit on the form behind a matched member, and only one of two staff wins', async () => {
      const memberId = await t.member('Dayo');
      const e = await t.visitor({ first: 'Dayo', firstVisit: '2026-07-05', extra: { convertedAt: new Date(), convertedToMemberId: memberId } });
      const f = await t.visitor({ first: 'Dayo-again', firstVisit: '2026-07-12', extra: { possibleReturnMemberId: memberId } });

      const results = await Promise.allSettled([returns.confirm(t.actor(), f), returns.confirm(t.actor(), f)]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const lost = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(lost.reason).toBeInstanceOf(ConflictException);
      expect(await pipeline.one(e)).toMatchObject({ visits: 2, visitDates: ['2026-07-05', '2026-07-12'] });
    });
  });
});
