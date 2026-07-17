export interface ServiceRow {
  id: string;
  name: string;
  scheduledAt: string;
  serviceType: string;
  isOpen: boolean;
  openAt: string | null;
  closeAt: string | null;
  _count?: { AttendanceRecord: number };
}

export const TYPES = ["SUNDAY", "WEDNESDAY", "SPECIAL"];
