import { Suspense } from "react";
import Attendance from "@/components/dashboard/admin/attendance/Attendance";

export default function AttendancePage() {
  // Attendance reads ?tab= to open on Insights; useSearchParams needs a Suspense boundary.
  return (
    <Suspense>
      <Attendance />
    </Suspense>
  );
}
