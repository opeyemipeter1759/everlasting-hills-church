import { Prisma } from '@prisma/client';

export const WAT_OFFSET_MS = 60 * 60 * 1000;

export type ServiceState = 'SCHEDULED' | 'LIVE' | 'ENDED';

export type HeadcountRow = Prisma.ServiceHeadcountGetPayload<{}>;

export function variance(hc: HeadcountRow) {
  if (hc.reportedTotal == null || hc.reportedTotal === hc.total) return null;
  return { hasVariance: true, reportedTotal: hc.reportedTotal, computedTotal: hc.total, delta: hc.reportedTotal - hc.total };
}

/** Shape a row for the API: adds derived children, variance, and an edited flag. */
export function toDto(hc: HeadcountRow) {
  const edited = hc.updatedAt.getTime() - hc.recordedAt.getTime() > 2000;
  return {
    id: hc.id,
    serviceId: hc.serviceId,
    men: hc.men,
    women: hc.women,
    boys: hc.boys,
    girls: hc.girls,
    children: hc.boys + hc.girls, // derived, never stored
    firstTimers: hc.firstTimers,
    total: hc.total, // = men+women+boys+girls; first-timers are an overlapping subset, not added
    reportedTotal: hc.reportedTotal,
    notes: hc.notes,
    status: hc.status,
    recordedBy: hc.recordedBy,
    recordedAt: hc.recordedAt.toISOString(),
    updatedAt: hc.updatedAt.toISOString(),
    edited,
    variance: variance(hc),
  };
}
