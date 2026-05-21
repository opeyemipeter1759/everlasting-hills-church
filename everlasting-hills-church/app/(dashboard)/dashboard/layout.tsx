import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import DashboardShell from "@/components/dashboard/shell/DashboardShell";
import type { SessionUser } from "@/components/dashboard/shell/DashboardShell";

export default async function DashboardAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    include: { member: true },
  });

  if (!profile) redirect("/login");
  if (profile.role === Role.VISITOR) redirect("/");

  // Members and unit leads use the /me member portal for now.
  // Step 2 will build the member dashboard view here.
  if (profile.role === Role.MEMBER || profile.role === Role.UNIT_LEAD) {
    redirect("/me");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email ?? "",
    role: profile.role as SessionUser["role"],
    firstName: profile.member?.firstName ?? null,
    lastName: profile.member?.lastName ?? null,
  };

  return <DashboardShell user={sessionUser}>{children}</DashboardShell>;
}
