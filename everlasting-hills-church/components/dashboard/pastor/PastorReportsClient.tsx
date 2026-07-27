"use client";

import { Church } from "lucide-react";
import ReportsPageShell from "@/components/dashboard/reports/ReportsPageShell";

export default function PastorReportsClient() {
  return (
    <ReportsPageShell
      scope="PASTOR"
      icon={Church}
      title="Pastoral Reports"
      subtitle="Log your own status reports — ministry updates, needs, wins, and concerns — for the Super Admin to review."
      basePath="/dashboard/pastor/reports"
    />
  );
}
