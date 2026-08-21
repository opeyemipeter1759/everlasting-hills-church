import { createGatheringSchema, updateGatheringSchema } from './gatherings.schemas';

const valid = {
  title: 'Morning Prayer',
  recurrenceRule: 'FREQ=DAILY',
  startDate: '2026-01-01',
  startTime: '05:30',
};

describe('createGatheringSchema', () => {
  it('fills in the church defaults', () => {
    const parsed = createGatheringSchema.parse(valid);
    expect(parsed.durationMinutes).toBe(60);
    expect(parsed.timezone).toBe('Africa/Lagos');
    expect(parsed.isActive).toBe(true);
  });

  it('rejects a rule no reminder could ever fire from', () => {
    const result = createGatheringSchema.safeParse({ ...valid, recurrenceRule: 'FREQ=MONTHLY' });
    expect(result.success).toBe(false);
  });

  it('rejects a timezone the platform cannot resolve', () => {
    const result = createGatheringSchema.safeParse({ ...valid, timezone: 'Mars/Olympus_Mons' });
    expect(result.success).toBe(false);
  });

  it('rejects a wall time that is not HH:MM', () => {
    expect(createGatheringSchema.safeParse({ ...valid, startTime: '5:30' }).success).toBe(false);
    expect(createGatheringSchema.safeParse({ ...valid, startTime: '25:00' }).success).toBe(false);
  });

  it('rejects an anchor date that is not YYYY-MM-DD', () => {
    expect(createGatheringSchema.safeParse({ ...valid, startDate: '01/01/2026' }).success).toBe(
      false,
    );
  });

  it('caps duration at a single day', () => {
    expect(createGatheringSchema.safeParse({ ...valid, durationMinutes: 1441 }).success).toBe(
      false,
    );
    expect(createGatheringSchema.safeParse({ ...valid, durationMinutes: 0 }).success).toBe(false);
  });
});

describe('updateGatheringSchema', () => {
  it('accepts a single field', () => {
    const result = updateGatheringSchema.safeParse({ title: 'Evening Prayer' });
    expect(result.success).toBe(true);
  });

  it('does not apply create-time defaults to fields the caller left out', () => {
    // A PATCH that omits durationMinutes must not silently reset it to 60.
    const parsed = updateGatheringSchema.parse({ title: 'Evening Prayer' });
    expect(parsed.durationMinutes).toBeUndefined();
    expect(parsed.timezone).toBeUndefined();
    expect(parsed.isActive).toBeUndefined();
  });

  it('rejects an empty body rather than reporting a no-op as success', () => {
    expect(updateGatheringSchema.safeParse({}).success).toBe(false);
  });

  it('still enforces the recurrence rule on partial input', () => {
    expect(updateGatheringSchema.safeParse({ recurrenceRule: 'FREQ=YEARLY' }).success).toBe(false);
  });
});
