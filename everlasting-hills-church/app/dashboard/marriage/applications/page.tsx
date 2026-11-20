import { Suspense } from "react";
import CasesClient from "@/components/dashboard/marriage/CasesClient";

export const metadata = { title: "Pre-marital applications · Dashboard" };

export default function MarriageApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <CasesClient />
    </Suspense>
  );
}
