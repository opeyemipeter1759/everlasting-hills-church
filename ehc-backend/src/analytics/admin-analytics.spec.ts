import { PrayerRequestStatus, QuestionStatus } from '@prisma/client';
import { fetchAdminAnalytics } from './admin-analytics';

function makePrisma() {
  return {
    member: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    visitor: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    prayerRequest: {
      count: jest.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(4),
      findMany: jest.fn().mockResolvedValue([]),
    },
    question: { count: jest.fn().mockResolvedValue(3) },
    testimonial: { count: jest.fn().mockResolvedValue(2) },
    givingRecord: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    service: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('fetchAdminAnalytics pastoral queues', () => {
  it('reports only work still waiting for pastoral review', async () => {
    const prisma = makePrisma();

    const result = await fetchAdminAnalytics(prisma as never, 'tenant-1');

    expect(result).toEqual(
      expect.objectContaining({
        totalPrayers: 7,
        pendingPrayers: 4,
        pendingQuestions: 3,
        draftTestimonials: 2,
      }),
    );
    expect(prisma.question.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', status: QuestionStatus.PENDING },
    });
    expect(prisma.testimonial.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', published: false },
    });
    expect(prisma.prayerRequest.count).toHaveBeenNthCalledWith(2, {
      where: { tenantId: 'tenant-1', status: PrayerRequestStatus.PENDING },
    });
  });
});
