import { AttendanceAbsenteeMailService } from './attendance-absentee-mail.service';
import { buildAttendanceAbsenceEmail } from '../../notifications/templates/attendance-absence.email';

/**
 * Sunday 2026-09-13. Lagos is UTC+1, so 13:00 WAT (the default Sunday close)
 * is 12:00Z.
 */
const SUNDAY_BEFORE_CLOSE = '2026-09-13T11:30:00Z'; // 12:30 WAT
const SUNDAY_AFTER_CLOSE = '2026-09-13T12:10:00Z'; // 13:10 WAT
const TUESDAY = '2026-09-15T12:10:00Z';

function makeService(opts: {
  now: string;
  service?: { id: string; name: string; serviceType: string; absenteeMailSentAt: Date | null } | null;
  presentCount?: number;
  absentees?: { firstName: string; email: string | null }[];
  claimWins?: boolean;
  forceOpen?: boolean;
}) {
  const env: Record<string, unknown> = {
    DEFAULT_TENANT_ID: 't1',
    FRONTEND_URL: 'https://x.test/',
    ATTENDANCE_SUNDAY_CLOSE: '13:00',
    ATTENDANCE_WEDNESDAY_CLOSE: '21:00',
    ATTENDANCE_TEST_NOW: opts.now,
    ATTENDANCE_FORCE_OPEN: opts.forceOpen ?? false,
  };
  const dispatch = jest.fn().mockResolvedValue(undefined);
  const prisma = {
    service: {
      findFirst: jest.fn().mockResolvedValue(opts.service === undefined ? null : opts.service),
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

const SUNDAY_SERVICE = { id: 's1', name: 'Sunday Service — 13 Sep', serviceType: 'SUNDAY', absenteeMailSentAt: null };

describe('AttendanceAbsenteeMailService', () => {
  it('does nothing on a non-service day', async () => {
    const { svc, dispatch } = makeService({ now: TUESDAY });
    expect((await svc.run()).skipped).toBe('NOT_A_SERVICE_DAY');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('waits while the attendance window is still open (or held open for testing)', async () => {
    expect((await makeService({ now: SUNDAY_BEFORE_CLOSE }).svc.run()).skipped).toBe('WINDOW_STILL_OPEN');
    expect((await makeService({ now: SUNDAY_AFTER_CLOSE, forceOpen: true }).svc.run()).skipped).toBe('WINDOW_STILL_OPEN');
  });

  it('never mails the whole church when attendance was not taken', async () => {
    const { svc, dispatch } = makeService({ now: SUNDAY_AFTER_CLOSE, service: SUNDAY_SERVICE, presentCount: 0 });
    expect((await svc.run()).skipped).toBe('NOBODY_CHECKED_IN');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('mails each absent active member once the window has closed, and records the count', async () => {
    const { svc, dispatch, prisma, absence } = makeService({
      now: SUNDAY_AFTER_CLOSE,
      service: SUNDAY_SERVICE,
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
      service: SUNDAY_SERVICE,
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

  it('skips a service that already has the marker without touching the DB again', async () => {
    const { svc, prisma } = makeService({
      now: SUNDAY_AFTER_CLOSE,
      service: { ...SUNDAY_SERVICE, absenteeMailSentAt: new Date() },
    });
    expect((await svc.run()).skipped).toBe('ALREADY_SENT');
    expect(prisma.service.updateMany).not.toHaveBeenCalled();
  });

  it('ignores SPECIAL (one-off / placeholder) services', async () => {
    const { svc } = makeService({ now: SUNDAY_AFTER_CLOSE, service: { ...SUNDAY_SERVICE, serviceType: 'SPECIAL' } });
    expect((await svc.run()).skipped).toBe('SPECIAL_SERVICE');
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
