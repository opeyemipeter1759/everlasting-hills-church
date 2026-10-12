import { Suspense } from "react";
import FamilyDirectory from "@/components/dashboard/member/family/FamilyDirectory";

export const metadata = { title: "Church Family — Dashboard" };

export default function FamilyPage() {
  // The search and page are read from the address, which needs a boundary.
  return (
    <Suspense fallback={null}>
      <FamilyDirectory />
    </Suspense>
  );
}
