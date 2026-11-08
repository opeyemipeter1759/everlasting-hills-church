import MemberHome from "@/components/dashboard/member/MemberHome";
import { HomeQueryHydration } from "@/components/dashboard/member/member-home/HomeQueryHydration";
import { safeGet } from "./shared";
import { toMemberHomeProps } from "./member-home/to-props";
import type { MemberHomeData } from "./member-home/types";

export async function MemberDashboard() {
  const data = await safeGet<MemberHomeData>("/member-home");
  return (
    <HomeQueryHydration data={data}>
      <MemberHome {...toMemberHomeProps(data)} />
    </HomeQueryHydration>
  );
}
