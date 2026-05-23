import { notFound } from "next/navigation";
import { getMemberById } from "@/services/member.service";
import MemberDetail from "@/components/dashboard/admin/MemberDetail";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const member = await getMemberById(params.id);
  if (!member) notFound();

  return (
    <MemberDetail
      member={{
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        bio: member.bio,
        photoUrl: member.photoUrl,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString() : null,
        joinedAt: member.joinedAt.toISOString(),
        status: member.status,
        attendanceCount: member.attendance.length,
        recentAttendance: member.attendance.map((a) => ({
          serviceId: a.serviceId,
          serviceName: a.service.name,
          scheduledAt: a.service.scheduledAt.toISOString(),
        })),
        pastorNotes: member.pastorNotes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt.toISOString(),
        })),
        followUpTasks: member.followUpTasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        })),
        units: member.unitMemberships.map((u) => u.unit.name),
      }}
    />
  );
}
