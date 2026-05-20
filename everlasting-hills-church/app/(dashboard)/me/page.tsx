import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { isAdmin } from "@/lib/auth/rbac";
import MemberProfileClient from "@/components/dashboard/MemberProfileClient";

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profileWithMember = await getMemberWithProfile(user.id);

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

  return (
    <MemberProfileClient
      member={memberData}
      userEmail={user.email ?? undefined}
    />
  );
}
