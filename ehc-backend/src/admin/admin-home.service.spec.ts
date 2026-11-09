import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { AdminHomeService } from './admin-home.service';

function actorWith(...roles: Role[]): AuthUser {
  return {
    userId: 'u1', email: 'a@b.c', role: roles[roles.length - 1], effectiveRoles: [Role.MEMBER, ...roles],
    unitLeadOf: [], hodOf: [], headUsher: false, profileId: null, memberId: null, tenantId: null,
  };
}

function build() {
  const admin = {
    getDashboardSummary: jest.fn().mockResolvedValue({ stats: [{ key: 'members', value: 10 }] }),
    getAttendanceTrend: jest.fn().mockResolvedValue({ points: [] }),
  };
  const analytics = {
    getGivingSummary: jest.fn().mockResolvedValue({ thisMonthNaira: 5000, momChange: 2 }),
    getGivingByCategory: jest.fn().mockResolvedValue([]),
    getAdminAnalytics: jest.fn().mockResolvedValue({ pendingPrayers: 1 }),
    getDepartmentStats: jest.fn().mockResolvedValue([]),
  };
  const birthdays = { getUpcomingBirthdays: jest.fn().mockResolvedValue([]), getTodayAnniversaries: jest.fn().mockResolvedValue([]) };
  const pastoralCare = {
    listOpenFollowUpTasks: jest.fn().mockResolvedValue([{}, {}]),
    getAbsentMembers: jest.fn().mockResolvedValue([]),
  };
  const risk = { getMembersAtRisk: jest.fn().mockResolvedValue({ absentConsecutiveWeeks: [], neverAttended: [], belowFiftyPercent: [] }) };
  const followUps = { list: jest.fn().mockResolvedValue([{}, {}, {}]) };
  const events = { calendarSummary: jest.fn().mockResolvedValue({ upcoming: [] }) };
  const audit = { list: jest.fn().mockResolvedValue([]) };
  const service = new AdminHomeService(
    admin as never, analytics as never, birthdays as never, pastoralCare as never,
    risk as never, followUps as never, events as never, audit as never,
  );
  return { service, analytics, followUps, audit };
}

describe('AdminHomeService', () => {
  it('gives a pastor everything, counting the follow-up lists', async () => {
    const { service } = build();
    const home = await service.load(actorWith(Role.PASTOR));

    expect(home.givingSummary).toEqual({ thisMonthNaira: 5000, momChange: 2 });
    expect(home.recentActivity).toEqual([]);
    expect(home.unassignedFollowUps).toBe(3);
    expect(home.openFollowUpTasks).toBe(2);
    expect(home.unavailable).toEqual([]);
  });

  it('leaves giving and the audit log out for an admin below pastor, without calling them', async () => {
    const { service, analytics, audit } = build();
    const home = await service.load(actorWith(Role.ADMIN));

    expect(home.givingSummary).toBeNull();
    expect(home.givingCategories).toBeNull();
    expect(home.recentActivity).toBeNull();
    expect(analytics.getGivingSummary).not.toHaveBeenCalled();
    expect(audit.list).not.toHaveBeenCalled();
    expect(home.unavailable).toEqual([]);
  });

  it('marks a failed part unavailable and still returns the rest', async () => {
    const { service, followUps } = build();
    followUps.list.mockRejectedValue(new Error('You need to be part of a team'));
    const home = await service.load(actorWith(Role.ADMIN));

    expect(home.unassignedFollowUps).toBeNull();
    expect(home.unavailable).toEqual(['unassignedFollowUps']);
    expect(home.summary).toEqual({ stats: [{ key: 'members', value: 10 }] });
  });
});
