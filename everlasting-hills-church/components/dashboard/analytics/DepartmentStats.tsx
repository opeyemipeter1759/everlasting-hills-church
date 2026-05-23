"use client";

import type { DeptStats } from "@/services/department-analytics.service";
import { Network, Users, TrendingUp } from "lucide-react";

type UnitAttendee = {
  memberId: string;
  name: string;
  photoUrl: string | null;
  isLead: boolean;
  status: string;
  attended: number;
  total: number;
  rate: number;
};

type Props = {
  departments: DeptStats;
  selectedUnitMembers?: UnitAttendee[];
  selectedUnitName?: string;
};

export default function DepartmentStats({
  departments,
  selectedUnitMembers,
  selectedUnitName,
}: Props) {
  const maxAttendance = Math.max(...departments.map((d) => d.attendanceRate), 1);

  return (
    <div className="space-y-6">
      {/* Department grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400 flex-shrink-0">
                <Network size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {dept.name}
                </p>
                {dept.leadName && (
                  <p className="text-xs text-gray-400">Lead: {dept.leadName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total Members</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dept.totalMembers}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dept.activeMembers}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attended (30d)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dept.recentAttendees}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Attendance Rate</span>
                <span
                  className={`font-bold ${
                    dept.attendanceRate >= 70
                      ? "text-green-500"
                      : dept.attendanceRate >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {dept.attendanceRate}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    dept.attendanceRate >= 70
                      ? "bg-green-500"
                      : dept.attendanceRate >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.round((dept.attendanceRate / maxAttendance) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="col-span-3 text-center text-sm text-gray-400 py-8">
            No departments set up yet.
          </div>
        )}
      </div>

      {/* Unit member detail */}
      {selectedUnitMembers && selectedUnitMembers.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {selectedUnitName ? `${selectedUnitName} — ` : ""}Member Attendance (last 3 months)
          </p>
          <div className="space-y-2">
            {selectedUnitMembers.map((m) => (
              <div key={m.memberId} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                      {m.name}
                    </span>
                    {m.isLead && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.rate >= 70
                            ? "bg-green-500"
                            : m.rate >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${m.rate}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {m.attended}/{m.total}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold w-8 text-right ${
                    m.rate >= 70
                      ? "text-green-500"
                      : m.rate >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {m.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
