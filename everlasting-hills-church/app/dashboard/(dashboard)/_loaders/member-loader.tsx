import MemberHome from "@/components/dashboard/member/MemberHome";
import { HomeQueryHydration } from "@/components/dashboard/member/member-home/HomeQueryHydration";
import { safeGet } from "./shared";
import { toMemberHomeProps } from "./member-home/to-props";
import type { MemberHomeData } from "./member-home/types";

/**
 * The member dashboard's home page: one request to /member-home on the
 * server. Its answer becomes the page's props, and fills the cards' own
 * queries so none of them fetch on first load.
 */
export async function MemberDashboard() {
  const data = await safeGet<MemberHomeData>("/member-home");
  return (
    <HomeQueryHydration data={data}>
      <MemberHome {...toMemberHomeProps(data)} />
    </HomeQueryHydration>
  );
}
