import { NotFoundException } from '@nestjs/common';
import { ReadingPlanShareService } from './reading-plan-share.service';

const plan = {
  id: 'plan-v3',
  slug: 'bible-in-four-months',
  title: 'The Bible in four months',
  subtitle: 'The Bible’s divisions side by side, with the Epistles twice.',
};

function makeService(detail: jest.Mock) {
  const announceReadingPlan = jest.fn().mockResolvedValue({ id: 'announcement-1', recipients: 312 });
  const service = new ReadingPlanShareService(
    { detail } as never,
    { announceReadingPlan } as never,
  );
  return { service, announceReadingPlan };
}

describe('ReadingPlanShareService', () => {
  it('announces a published plan to the church and reports how many members were notified', async () => {
    const detail = jest.fn().mockResolvedValue(plan);
    const { service, announceReadingPlan } = makeService(detail);

    const result = await service.shareWithChurch('plan-v3', { note: 'Starting Monday.' }, 'admin-profile');

    expect(detail).toHaveBeenCalledWith('plan-v3');
    expect(announceReadingPlan).toHaveBeenCalledWith({
      plan: { title: plan.title, subtitle: plan.subtitle, slug: plan.slug },
      note: 'Starting Monday.',
      sendEmail: false,
      sharedById: 'admin-profile',
    });
    expect(result).toEqual({ announcementId: 'announcement-1', recipients: 312 });
  });

  it('emails the church only when the admin asks for it', async () => {
    const { service, announceReadingPlan } = makeService(jest.fn().mockResolvedValue(plan));

    await service.shareWithChurch('plan-v3', { sendEmail: true }, 'admin-profile');

    expect(announceReadingPlan).toHaveBeenCalledWith(expect.objectContaining({ sendEmail: true }));
  });

  it('notifies nobody about a plan the church cannot start', async () => {
    const detail = jest.fn().mockRejectedValue(new NotFoundException('Reading plan not found'));
    const { service, announceReadingPlan } = makeService(detail);

    await expect(service.shareWithChurch('draft-plan', {}, 'admin-profile')).rejects.toBeInstanceOf(NotFoundException);
    expect(announceReadingPlan).not.toHaveBeenCalled();
  });
});
