import { Suspense } from "react";
import OneOnOneScreen from "@/components/dashboard/one-on-one/member/OneOnOneScreen";

export const metadata = { title: "One-on-One — Dashboard" };

export default function OneOnOnePage() {
  return (
    <Suspense>
      <OneOnOneScreen />
    </Suspense>
  );
}
