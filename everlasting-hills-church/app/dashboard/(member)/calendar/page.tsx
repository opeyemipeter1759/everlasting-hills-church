import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";
import CalendarPageClient from "@/components/dashboard/calendar/CalendarPageClient";

export const metadata = { title: "Calendar — Dashboard" };
export const dynamic = "force-dynamic";

export default async function MemberCalendarPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Google's OAuth redirect_uri points at this exact page (not a separate
  // route) so the flow stays on the app's own branded domain. code+state
  // means Google just finished consent — forward straight to the real
  // handler on the backend before any of the normal auth/render logic below
  // runs. Identity travels in the signed `state`, not a session cookie, so a
  // session that lapsed during the round trip shouldn't strand the user on
  // a login wall instead of completing the connection.
  if (typeof searchParams?.code === "string" && typeof searchParams?.state === "string") {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") qs.set(key, value);
    }
    redirect(`${getBackendBaseUrl()}/calendar/google/callback?${qs.toString()}`);
  }

  try {
    await serverApi.get("/auth/me", { cache: "no-store" });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) redirect("/login");
    throw err;
  }

  return <CalendarPageClient />;
}
