export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type MarkedBy = 'SELF' | 'ADMIN';
export type SortOrder = 'ASC' | 'DESC';

export interface ListAttendanceQuery {
  page?: number;
  limit?: number;
  name?: string;
  status?: AttendanceStatus;
  serviceKey?: string;
  year?: string;
  month?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  markedBy?: MarkedBy;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface MemberHistoryRow {
  id: string;
  serviceName: string;
  date: string;
  status: 'present' | 'absent';
  mode: 'onsite' | null;
}

export const WAT_OFFSET_MS = 60 * 60 * 1000;

export function getTodayBounds() {
  const now = new Date();
  const localNow = new Date(now.getTime() + WAT_OFFSET_MS);
  const midnightWAT = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );
  const startUtc = new Date(midnightWAT - WAT_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}
