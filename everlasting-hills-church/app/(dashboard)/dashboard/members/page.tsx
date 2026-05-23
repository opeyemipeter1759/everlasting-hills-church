import { getAllMembers, getUpcomingBirthdays, getAbsentMembers } from "@/services/member.service";
import MemberDirectory from "@/components/dashboard/admin/MemberDirectory";

export default async function MembersPage() {
  const [members, birthdays, absent] = await Promise.all([
    getAllMembers(),
    getUpcomingBirthdays(7),
    getAbsentMembers(3),
  ]);

  const serialised = members.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    status: m.status,
    photoUrl: m.photoUrl,
    joinedAt: m.joinedAt.toISOString(),
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    attendanceCount: m._count.attendance,
  }));

  const absentIds = new Set(absent.map((a) => a.id));

  return (
    <MemberDirectory
      members={serialised}
      birthdayIds={birthdays.map((b) => b.id)}
      absentIds={Array.from(absentIds)}
    />
  );
}
