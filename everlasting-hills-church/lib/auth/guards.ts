import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser } from "./session";
import { hasMinimumRole } from "./rbac";
import { db } from "@/lib/db/prisma";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(minimum: Role) {
  const user = await requireAuth();

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || !hasMinimumRole(profile.role, minimum)) {
    redirect("/dashboard");
  }

  return { user, profile };
}
