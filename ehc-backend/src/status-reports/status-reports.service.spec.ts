import { StatusReportsService } from './status-reports.service';

describe('StatusReportsService legacy content boundary', () => {
  it('sanitizes already-stored report HTML before returning it', async () => {
    const prisma = {
      report: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'report-1',
            scope: 'UNIT',
            title: 'Legacy report',
            content: '<p onclick="steal()">Safe text</p><script>steal()</script>',
            attachmentUrl: null,
            attachmentName: null,
            status: 'SUBMITTED',
            Department: null,
            Unit: null,
            SubmittedBy: null,
            ReviewedBy: null,
            reviewedAt: null,
            _count: { Comments: 0 },
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
          },
        ]),
      },
    };
    const config = { get: jest.fn().mockReturnValue('tenant-1') };
    const service = new StatusReportsService(prisma as never, config as never);

    const [report] = await service.listAll();

    expect(report.content).toBe('<p>Safe text</p>');
    expect(report.content).not.toMatch(/onclick|script/i);
  });
});
