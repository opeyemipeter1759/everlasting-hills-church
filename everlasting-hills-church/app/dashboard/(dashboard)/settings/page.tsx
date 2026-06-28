import { redirect } from "next/navigation";
import SettingsClient from "@/components/dashboard/settings/SettingsClient";
import { serverApi } from "@/lib/api/server";

export const metadata = { title: "Settings — Dashboard" };
export const dynamic = "force-dynamic";

interface MeResponse {
  profileId: string | null;
  role: string | null;
  tenantId: string | null;
  member: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
    joinedAt: string;
  } | null;
}

export default async function SettingsPage() {
  let me: MeResponse;
  try {
    me = await serverApi.get<MeResponse>("/auth/me", { cache: "no-store" });
  } catch (err) {
    // 401 means our cookie session expired — bounce to /login. Any other failure
    // bubbles to the route error boundary.
    const status = (err as { status?: number }).status;
    if (status === 401) redirect("/login");
    throw err;
  }

  const user = {
    firstName: me.member?.firstName ?? null,
    lastName: me.member?.lastName ?? null,
    email: me.member?.email ?? null,
    phone: me.member?.phone ?? null,
    bio: me.member?.bio ?? null,
    photoUrl: me.member?.photoUrl ?? null,
    role: me.role,
  };

  return <SettingsClient user={user} />;
}
