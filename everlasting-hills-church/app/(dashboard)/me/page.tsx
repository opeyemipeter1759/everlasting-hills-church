import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { getMemberAttendance, getTodayService } from "@/services/attendance.service";
import { isAdmin } from "@/lib/auth/rbac";
import MemberProfileClient from "@/components/dashboard/MemberProfileClient";

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profileWithMember, attendanceRecords] = await Promise.all([
    getMemberWithProfile(user.id),
    getMemberAttendance(user.id),
  ]);

  // Admins go to the admin dashboard
  if (profileWithMember && isAdmin(profileWithMember.role)) {
    redirect("/dashboard");
  }

  const member = profileWithMember?.member ?? null;

  const memberData = member
    ? {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        dateOfBirth: member.dateOfBirth
          ? member.dateOfBirth.toISOString().split("T")[0]
          : null,
      }
    : null;

  // Determine check-in state
  const todayService = await getTodayService();
  const hasCheckedInToday = todayService
    ? attendanceRecords.some((r) => r.serviceId === todayService.id)
    : false;

  const recentAttendance = attendanceRecords.slice(0, 6).map((r) => ({
    serviceName: r.service.name,
    date: r.service.scheduledAt,
  }));

  return (
    <MemberProfileClient
      member={memberData}
      userEmail={user.email ?? undefined}
      attendanceCount={attendanceRecords.length}
      recentAttendance={recentAttendance}
      hasCheckedInToday={hasCheckedInToday}
    />
  );
}
