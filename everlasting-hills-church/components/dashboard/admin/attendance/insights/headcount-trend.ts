import type { OverviewService } from "@/lib/api/attendance-roll";

export type TrendKind = "SUNDAY" | "WEDNESDAY";

/** The last `max` services of one kind, oldest first, counted or not. */
export function trendPoints(services: OverviewService[], kind: TrendKind, max = 12): OverviewService[] {
  return services.filter((s) => s.serviceType === kind).slice(0, max).reverse();
}

export interface TrendSummary {
  counted: number;
  average: number;
  highest: { total: number; date: string } | null;
  /** Share of everyone counted who were children, across the counted services. */
  childrenShare: number;
}

export function trendSummary(points: OverviewService[]): TrendSummary {
  const counted = points.filter((p) => p.headcount);
  if (counted.length === 0) return { counted: 0, average: 0, highest: null, childrenShare: 0 };
  const total = counted.reduce((sum, p) => sum + p.headcount!.total, 0);
  const children = counted.reduce((sum, p) => sum + p.headcount!.children, 0);
  const top = counted.reduce((best, p) => (p.headcount!.total > best.headcount!.total ? p : best));
  return {
    counted: counted.length,
    average: Math.round(total / counted.length),
    highest: { total: top.headcount!.total, date: top.date },
    childrenShare: total > 0 ? Math.round((children / total) * 100) : 0,
  };
}
