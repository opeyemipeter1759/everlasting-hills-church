import Member from "@/components/sermons/Member/Member";
import { QueryHydration } from "@/lib/api/QueryHydration";
import { safeGet } from "../../(dashboard)/_loaders/shared";
import { sermonOverviewEntries, type SermonOverview } from "./sermon-overview";

export const metadata = { title: "My Sermons — Dashboard" };
export const dynamic = "force-dynamic";

/**
 * My Sermons: one request to /sermons/me/overview on the server, handed to
 * the page's sections so none of them fetch when it opens.
 */
export default async function SermonPage() {
  const data = await safeGet<SermonOverview>("/sermons/me/overview");
  return (
    <QueryHydration entries={sermonOverviewEntries(data)}>
      <Member />
    </QueryHydration>
  );
}
