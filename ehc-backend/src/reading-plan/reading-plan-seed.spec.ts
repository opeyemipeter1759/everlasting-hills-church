import { PrismaClient, ReadingTrack } from '@prisma/client';
import { main, publishReadingPlan } from '../../scripts/seed-reading-plans';
import type { ReadingPlanTemplate } from './reading-plan-templates';

const spec: ReadingPlanTemplate = {
  slug: 'fixture', title: 'Fixture', description: 'Fixture', track: ReadingTrack.GROWING,
  durationDays: 1, version: 2, subtitle: () => 'Fixture',
  streams: [{ label: 'Today', selection: [{ bookId: 1 }] }],
};
const corpus = {
  chaptersByBook: new Map([[1, [{ bookId: 1, chapter: 1, startVerseId: 1_001_001, endVerseId: 1_001_031, wordCount: 800 }]]]),
  bookNames: new Map([[1, 'Genesis']]),
};

function database(existing: boolean) {
  const tx = {
    readingPlan: { create: jest.fn(), update: jest.fn() },
    readingPlanDay: { createMany: jest.fn() },
    readingPlanPortion: { createMany: jest.fn() },
  };
  const prisma = {
    readingPlan: { findFirst: jest.fn().mockResolvedValue(existing ? { id: 'existing-plan' } : null) },
    $transaction: jest.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  return { prisma, tx, client: prisma as unknown as PrismaClient };
}

describe('reading plan seed safeguards', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('does not mutate existing published plans or subscribed progress on reruns', async () => {
    const { client, prisma } = database(true);
    expect(await publishReadingPlan(client, spec, corpus)).toBe('skipped');
    expect(prisma.readingPlan.findFirst).toHaveBeenCalledWith({
      where: { tenantId: null, slug: 'fixture', version: 2 }, select: { id: true },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('generates a dry run without starting any write transaction', async () => {
    const { client, prisma } = database(false);
    expect(await publishReadingPlan(client, spec, corpus, true)).toBe('previewed');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('publishes a new version with all days in one transaction and never rewrites the old version', async () => {
    const { client, prisma, tx } = database(false);
    expect(await publishReadingPlan(client, spec, corpus)).toBe('published');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const created = tx.readingPlan.create.mock.calls[0][0].data;
    expect(created).toMatchObject({ version: 2, slug: 'fixture', status: 'DRAFT' });
    expect(tx.readingPlanDay.createMany.mock.calls[0][0].data[0]).toMatchObject({ planId: created.id, dayIndex: 1 });
    expect(tx.readingPlan.update).toHaveBeenCalledWith({ where: { id: created.id }, data: { status: 'PUBLISHED' } });
  });

  it('rejects the old destructive --force command before creating a database client', async () => {
    await expect(main(['--force'])).rejects.toThrow('preserve member progress');
  });
});
