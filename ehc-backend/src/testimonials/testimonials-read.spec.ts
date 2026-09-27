import { NotFoundException } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';

describe('Marking a testimony read', () => {
  function setup(found = true) {
    const update = jest.fn(async ({ data }) => ({ id: 't1', ...data }));
    const prisma = {
      testimonial: { findFirst: jest.fn().mockResolvedValue(found ? { id: 't1' } : null), update },
      member: { findFirst: jest.fn().mockResolvedValue({ firstName: 'Bola', lastName: 'Ade' }) },
    };
    const svc = new TestimonialsService(prisma as never, { get: () => 'tenant' } as never);
    return { svc, update, prisma };
  }

  it('moves it to Read, saying who read it and when', async () => {
    const { svc, update } = setup();
    const res = await svc.markRead('t1', true, 'p1');
    expect(update.mock.calls[0][0].data).toMatchObject({ readByName: 'Bola Ade', readAt: expect.any(Date) });
    expect(res.readByName).toBe('Bola Ade');
  });

  it('moves it back to Unread', async () => {
    const { svc, update, prisma } = setup();
    await svc.markRead('t1', false, 'p1');
    expect(update.mock.calls[0][0].data).toEqual({ readAt: null, readByName: null });
    expect(prisma.member.findFirst).not.toHaveBeenCalled();
  });

  it("won't touch a testimony from another church", async () => {
    await expect(setup(false).svc.markRead('t1', true, 'p1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
