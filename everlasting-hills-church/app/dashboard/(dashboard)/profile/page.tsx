import { redirect } from "next/navigation";
import ProfileView from "@/components/dashboard/profile/ProfileView";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { serverApi } from "@/lib/api/server";

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
    weddingAnniversary: string | null;
    gender: string | null;
    tags: string[];
    household: string | null;
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    tiktok: string | null;
    bio: string | null;
    photoUrl: string | null;
    joinedAt: string;
    units: {
      id: string;
      name: string;
      description: string | null;
      isLead: boolean;
      isAssistant: boolean;
    }[];
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
    gender: me.member?.gender ?? null,
    dateOfBirth: me.member?.dateOfBirth ?? null,
    weddingAnniversary: me.member?.weddingAnniversary ?? null,
    tags: me.member?.tags ?? [],
    household: me.member?.household ?? null,
    instagram: me.member?.instagram ?? null,
    facebook: me.member?.facebook ?? null,
    twitter: me.member?.twitter ?? null,
    linkedin: me.member?.linkedin ?? null,
    tiktok: me.member?.tiktok ?? null,
    units: me.member?.units ?? [],
  };

  return <ProfileView profile={profile} />;
}
