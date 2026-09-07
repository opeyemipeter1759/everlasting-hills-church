import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import CalendarPageClient from "@/components/dashboard/calendar/CalendarPageClient";

export const metadata = { title: "Calendar — Dashboard" };
export const dynamic = "force-dynamic";

export default async function MemberCalendarPage() {
  try {
    await serverApi.get("/auth/me", { cache: "no-store" });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) redirect("/login");
    throw err;
  }

  return <CalendarPageClient />;
}
