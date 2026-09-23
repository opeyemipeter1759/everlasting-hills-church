import { Suspense } from "react";
import FunnelPage from "@/components/dashboard/admin/funnel/FunnelPage";
import Loading from "./loading";

export const metadata = { title: "Newcomer funnel — Dashboard" };

export default function AdminFunnelPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FunnelPage />
    </Suspense>
  );
}
