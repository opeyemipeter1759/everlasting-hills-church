import { serverApi } from "@/lib/api/server";
import OnlineAudienceClient, {
  type OnlineAudienceListResponse,
} from "@/components/dashboard/admin/OnlineAudienceClient";

export const metadata = { title: "Online Audience — Dashboard" };
export const dynamic = "force-dynamic";

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch {
    return fallback;
  }
}

export default async function OnlineAudiencePage() {
  const initialData = await safeGet<OnlineAudienceListResponse>("/online-attendance?take=100&skip=0", {
    data: [],
    meta: { total: 0, take: 100, skip: 0 },
  });

  return <OnlineAudienceClient initialData={initialData} />;
}
