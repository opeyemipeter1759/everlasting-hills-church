import { redirect } from "next/navigation";
import ProfileView, {
  type ProfileViewModel,
} from "@/components/dashboard/profile/ProfileView";
import { serverApi } from "@/lib/api/server";

export const metadata = { title: "Profile — Dashboard" };
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

export default async function ProfilePage() {
  let me: MeResponse;
  try {
    me = await serverApi.get<MeResponse>("/auth/me", { cache: "no-store" });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) redirect("/login");
    throw err;
  }

  const profile: ProfileViewModel = {
    firstName: me.member?.firstName ?? null,
    lastName: me.member?.lastName ?? null,
    email: me.member?.email ?? null,
    phone: me.member?.phone ?? null,
    bio: me.member?.bio ?? null,
    photoUrl: me.member?.photoUrl ?? null,
    address: me.member?.address ?? null,
    role: me.role,
    joinedAt: me.member?.joinedAt ?? null,
  };

  return <ProfileView profile={profile} />;
}
