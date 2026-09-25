import { AttendanceAbsenteeMailService } from './attendance-absentee-mail.service';
import { buildAttendanceAbsenceEmail } from '../../notifications/templates/attendance-absence.email';

/**
 * Sunday 2026-09-13. Lagos is UTC+1, so 13:00 WAT (the default Sunday close)
 * is 12:00Z. A service row is scheduled at midnight WAT (23:00Z the day before).
 */
const SUNDAY_BEFORE_CLOSE = '2026-09-13T11:30:00Z'; // 12:30 WAT
const SUNDAY_AFTER_CLOSE = '2026-09-13T12:10:00Z'; // 13:10 WAT
const SUNDAY_AT = new Date('2026-09-12T23:00:00Z');
// Wednesday 2026-09-23 held open to 23:59 WAT (22:59Z).
const WEDNESDAY_AT = new Date('2026-09-22T23:00:00Z');
const WEDNESDAY_2330 = '2026-09-23T22:30:00Z';
const THURSDAY_MORNING = '2026-09-24T07:00:00Z';

type Row = { id: string; name: string; serviceType: string; scheduledAt: Date };

function makeService(opts: {
  now: string;
  /** Services the query returns: SUNDAY/WEDNESDAY, not yet mailed, newest first. */
  services?: Row[];
  presentCount?: number;
  absentees?: { firstName: string; email: string | null }[];
  claimWins?: boolean;
  forceOpen?: boolean;
  wednesdayClose?: string;
}) {
  const env: Record<string, unknown> = {
    DEFAULT_TENANT_ID: 't1',
    FRONTEND_URL: 'https://x.test/',
    ATTENDANCE_SUNDAY_CLOSE: '13:00',
    ATTENDANCE_WEDNESDAY_CLOSE: opts.wednesdayClose ?? '21:00',
    ATTENDANCE_TEST_NOW: opts.now,
    ATTENDANCE_FORCE_OPEN: opts.forceOpen ?? false,
  };
  const dispatch = jest.fn().mockResolvedValue(undefined);
  const prisma = {
    service: {
      findMany: jest.fn().mockResolvedValue(opts.services ?? []),
      updateMany: jest.fn().mockResolvedValue({ count: opts.claimWins === false ? 0 : 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    attendanceRecord: {
      count: jest.fn().mockResolvedValue(opts.presentCount ?? 0),
      findMany: jest.fn().mockResolvedValue((opts.absentees ?? []).map((Member) => ({ Member }))),
    },
  };
  const absence = { markMissingAsAbsent: jest.fn().mockResolvedValue({ marked: 0 }) };
  const svc = new AttendanceAbsenteeMailService(
    prisma as never,
    { dispatch } as never,
    absence as never,
    { get: (k: string) => env[k] } as never,
  );
  return { svc, dispatch, prisma, absence };
}

const SUNDAY_SERVICE: Row = { id: 's1', name: 'Sunday Service — 13 Sep', serviceType: 'SUNDAY', scheduledAt: SUNDAY_AT };
const WEDNESDAY_SERVICE: Row = { id: 'w1', name: 'Midweek Service — 23 Sep', serviceType: 'WEDNESDAY', scheduledAt: WEDNESDAY_AT };

describe('AttendanceAbsenteeMailService', () => {
  it('does nothing when no service is due', async () => {
    const { svc, dispatch } = makeService({ now: SUNDAY_AFTER_CLOSE });
    expect((await svc.run()).skipped).toBe('NO_SERVICE_DUE');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('only looks at unmailed Sunday/Wednesday services from the last 48 hours', async () => {
    const { svc, prisma } = makeService({ now: SUNDAY_AFTER_CLOSE });
    await svc.run();
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          serviceType: { in: ['SUNDAY', 'WEDNESDAY'] },
          absenteeMailSentAt: null,
          scheduledAt: { gte: new Date('2026-09-11T12:10:00Z'), lte: new Date(SUNDAY_AFTER_CLOSE) },
        }),
      }),
    );
  });

  it('waits while the attendance window is still open (or held open for testing)', async () => {
    expect((await makeService({ now: SUNDAY_BEFORE_CLOSE, services: [SUNDAY_SERVICE] }).svc.run()).skipped).toBe('WINDOW_STILL_OPEN');
    expect((await makeService({ now: SUNDAY_AFTER_CLOSE, services: [SUNDAY_SERVICE], forceOpen: true }).svc.run()).skipped).toBe('WINDOW_STILL_OPEN');
  });

  it('catches up the next day on a Wednesday held open past the last evening run', async () => {
    const opts = {
      services: [WEDNESDAY_SERVICE],
      wednesdayClose: '23:59',
      presentCount: 12,
      absentees: [{ firstName: 'Daphne', email: 'daphne@x.test' }],
    };
    // 23:30 WAT: still open, as happened on 23 September.
    expect((await makeService({ ...opts, now: WEDNESDAY_2330 }).svc.run()).skipped).toBe('WINDOW_STILL_OPEN');
    // Thursday morning: now closed, so it is mailed rather than forgotten.
    const { svc, dispatch } = makeService({ ...opts, now: THURSDAY_MORNING });
    expect(await svc.run()).toEqual({ serviceId: 'w1', absent: 1, emailed: 1 });
    expect(dispatch.mock.calls[0][0].subject).toBe('We missed you at Midweek Service, Daphne');
  });

  it('never mails the whole church when attendance was not taken', async () => {
    const { svc, dispatch } = makeService({ now: SUNDAY_AFTER_CLOSE, services: [SUNDAY_SERVICE], presentCount: 0 });
    expect((await svc.run()).skipped).toBe('NOBODY_CHECKED_IN');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('mails each absent active member once the window has closed, and records the count', async () => {
    const { svc, dispatch, prisma, absence } = makeService({
      now: SUNDAY_AFTER_CLOSE,
      services: [SUNDAY_SERVICE],
      presentCount: 40,
      absentees: [
        { firstName: 'Daphne', email: 'daphne@x.test' },
        { firstName: 'Tunde', email: 'tunde@x.test' },
      ],
    });
    const result = await svc.run();
    expect(result).toEqual({ serviceId: 's1', absent: 2, emailed: 2 });
    expect(absence.markMissingAsAbsent).toHaveBeenCalledWith('s1');
    expect(dispatch).toHaveBeenCalledTimes(2);
    const first = dispatch.mock.calls[0][0];
    expect(first.to).toBe('daphne@x.test');
    expect(first.subject).toBe('We missed you at Sunday Service, Daphne');
    expect(first.html).toContain('Hello Daphne,');
    expect(first.tag).toBe('attendance-absence');
    // Only ACTIVE members with an email are asked for.
    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ present: false, Member: { status: 'ACTIVE', email: { not: null } } }) }),
    );
    expect(prisma.service.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { absenteeMailCount: 2 } });
  });

  it('claims the service before sending so a retry cannot mail twice', async () => {
    const { svc, dispatch, prisma } = makeService({
      now: SUNDAY_AFTER_CLOSE,
      services: [SUNDAY_SERVICE],
      presentCount: 40,
      absentees: [{ firstName: 'Daphne', email: 'daphne@x.test' }],
      claimWins: false,
    });
    expect((await svc.run()).skipped).toBe('ALREADY_SENT');
    expect(prisma.service.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', absenteeMailSentAt: null },
      data: { absenteeMailSentAt: expect.any(Date) },
    });
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('buildAttendanceAbsenceEmail', () => {
  it('reads warmly and points at the prayer-request page', () => {
    const mail = buildAttendanceAbsenceEmail({ email: 'd@x.test', firstName: 'daphne', serviceLabel: 'Midweek Service', appUrl: 'https://x.test/' });
    expect(mail.subject).toBe('We missed you at Midweek Service, Daphne');
    expect(mail.text.startsWith('Hello Daphne,')).toBe(true);
    expect(mail.html).toContain('https://x.test/prayer-request');
    expect(mail.html).not.toMatch(/streak|strike|warning/i);
  });

  it('copes with a missing first name', () => {
    const mail = buildAttendanceAbsenceEmail({ email: 'd@x.test', firstName: null, serviceLabel: 'Sunday Service', appUrl: 'https://x.test' });
    expect(mail.subject).toBe('We missed you at Sunday Service');
    expect(mail.text.startsWith('Hello,')).toBe(true);
  });
});
