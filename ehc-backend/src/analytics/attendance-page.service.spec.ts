import { AttendancePageService } from './attendance-page.service';

function build() {
  const overview = {
    getOverview: jest.fn().mockResolvedValue({ attendanceRate: 80 }),
    getTrend: jest.fn().mockResolvedValue([]),
    getSplit: jest.fn().mockResolvedValue({ present: 8, absent: 2, total: 10, rate: 80 }),
    getRateTrend: jest.fn().mockResolvedValue([]),
    getAbsenteeTrend: jest.fn().mockResolvedValue([]),
  };
  const comparison = {
    getServiceComparison: jest.fn().mockResolvedValue([]),
    getMemberGrowth: jest.fn().mockResolvedValue([]),
    getLeaderboard: jest.fn().mockResolvedValue([]),
  };
  const insights = {
    getFirstTimers: jest.fn().mockResolvedValue([]),
    getRetention: jest.fn().mockResolvedValue({ rate: 50 }),
    getPeakHours: jest.fn().mockResolvedValue([]),
  };
  const alerts = {
    getConsistency: jest.fn().mockResolvedValue([]),
    getServiceHealth: jest.fn().mockResolvedValue([]),
    getAlerts: jest.fn().mockResolvedValue([]),
  };
  const service = new AttendancePageService(overview as never, comparison as never, insights as never, alerts as never);
  return { service, overview, comparison, alerts };
}

describe('AttendancePageService', () => {
  const filter = { period: 'month' as const, serviceType: 'sunday' };

  it('passes the page filter to every part, without the service type where those charts never used it', async () => {
    const { service, overview, comparison, alerts } = build();
    const page = await service.load(filter);

    expect(overview.getOverview).toHaveBeenCalledWith(filter);
    expect(comparison.getLeaderboard).toHaveBeenCalledWith(filter, 10);
    expect(alerts.getConsistency).toHaveBeenCalledWith(filter, 10);
    expect(comparison.getServiceComparison).toHaveBeenCalledWith({ period: 'month', serviceType: undefined });
    expect(comparison.getMemberGrowth).toHaveBeenCalledWith({ period: 'month', serviceType: undefined });
    expect(page.overview).toEqual({ attendanceRate: 80 });
    expect(page.unavailable).toEqual([]);
  });

  it('marks a failed part unavailable and still returns the rest', async () => {
    const { service, overview } = build();
    overview.getTrend.mockRejectedValue(new Error('pool exhausted'));
    const page = await service.load(filter);

    expect(page.trend).toBeNull();
    expect(page.unavailable).toEqual(['trend']);
    expect(page.split).toEqual({ present: 8, absent: 2, total: 10, rate: 80 });
  });
});
