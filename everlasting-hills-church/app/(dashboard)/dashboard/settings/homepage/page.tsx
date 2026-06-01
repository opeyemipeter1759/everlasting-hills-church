import { redirect } from "next/navigation";
import SiteSettingsEditor from "@/components/dashboard/site-settings/SiteSettingsEditor";
import { serverApi } from "@/lib/api/server";
import type { SiteSectionName } from "@/lib/site-settings";

export const metadata = { title: "Homepage Content — Dashboard" };
export const dynamic = "force-dynamic";

interface SectionRow {
  section: SiteSectionName;
  content: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

export default async function HomepageContentPage() {
  let rows: Record<SiteSectionName, SectionRow>;
  try {
    rows = await serverApi.get<Record<SiteSectionName, SectionRow>>(
      "/site-settings",
      { cache: "no-store" },
    );
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) redirect("/login");
    throw err;
  }

  return <SiteSettingsEditor initial={rows} />;
}
