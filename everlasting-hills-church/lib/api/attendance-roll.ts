import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** The admin attendance roll: one row per member per service. Deactivated members are never on it. */
export interface AttendanceRow {
  id: string;
  sessionId: string;
  serviceName: string;
  serviceKey: string;
  date: string;
  userId: string;
  userName: string;
  photoUrl: string | null;
  gender: "MALE" | "FEMALE" | null;
  status: "PRESENT" | "ABSENT";
  markedBy: "SELF" | "ADMIN";
  markedAt: string | null;
}

export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  name?: string;
  status?: "PRESENT" | "ABSENT";
  serviceKey?: string;
  /** One service; narrower than serviceKey. */
  serviceId?: string;
  gender?: "male" | "female";
  year?: string;
  month?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  markedBy?: "SELF" | "ADMIN";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface AttendanceListResponse {
  data: AttendanceRow[];
  filters: Record<string, string | null>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    /** Present and absent rows across every page the other filters match, ignoring the status filter. */
    presentCount: number;
    absentCount: number;
  };
}

const ROLL_KEYS = [["attendance", "admin", "list"], ["attendance", "service-overview"], ["admin", "stats", "overview"]];

function useInvalidateRoll() {
  const queryClient = useQueryClient();
  return () => ROLL_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

export function useAttendanceList(query: AttendanceListQuery = {}) {
  return useQuery({
    queryKey: ["attendance", "admin", "list", query],
    queryFn: () => api.get<AttendanceListResponse>("/attendance", query as Record<string, unknown>),
    enabled: typeof window !== "undefined",
    placeholderData: (prev) => prev,
  });
}

export function useOverrideAttendance() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateRoll();
  return useMutation({
    mutationFn: ({ sessionId, userId, status }: { sessionId: string; userId: string; status: "PRESENT" | "ABSENT" }) =>
      api.patch(`/attendance/session/${sessionId}/member/${userId}`, { status }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["attendance", "feed"] });
    },
  });
}

export function useBulkMarkAttendance() {
  const invalidate = useInvalidateRoll();
  return useMutation({
    mutationFn: ({ sessionId, userIds, status }: { sessionId: string; userIds: string[]; status: "PRESENT" | "ABSENT" }) =>
      api.patch(`/attendance/session/${sessionId}/bulk`, { userIds, status }),
    onSuccess: invalidate,
  });
}

export async function downloadAttendanceCsv(params: AttendanceListQuery = {}) {
  const { apiClient } = await import("@/lib/api/axios");
  const res = await apiClient.get("/attendance/export", { params, responseType: "blob" });
  const blob = new Blob([res.data as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "attendance-export.xlsx";
  a.click();
  URL.revokeObjectURL(href);
}

export interface ServiceHeadcountSummary {
  men: number;
  women: number;
  boys: number;
  girls: number;
  children: number;
  firstTimers: number;
  total: number;
  status: "DRAFT" | "CONFIRMED";
}

export interface OverviewService {
  id: string;
  name: string;
  serviceType: "SUNDAY" | "WEDNESDAY" | "SPECIAL";
  /** WAT calendar day, YYYY-MM-DD. */
  date: string;
  /** The ushers' count of everyone in the room; null until they record it. */
  headcount: ServiceHeadcountSummary | null;
  /** Active members who checked in on the app, and those marked absent. */
  checkedIn: number;
  absent: number;
}

export interface ServiceOverviewResponse {
  activeMembers: number;
  /** Newest first. */
  services: OverviewService[];
}

export function useServiceOverview(limit = 24) {
  return useQuery({
    queryKey: ["attendance", "service-overview", limit],
    queryFn: () => api.get<ServiceOverviewResponse>(`/attendance/service-overview?limit=${limit}`),
    enabled: typeof window !== "undefined",
  });
}
