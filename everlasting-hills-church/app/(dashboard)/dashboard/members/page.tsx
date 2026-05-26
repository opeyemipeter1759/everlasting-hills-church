import { Users } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";

export const metadata = { title: "Members — Dashboard" };

/**
 * Placeholder until the NestJS Members module ships (tracked as Week 3).
 * Page route stays intact so navigation/breadcrumbs keep working.
 */
export default function MembersPage() {
  return (
    <ComingSoon
      title="Member directory"
      description="The members module is being rebuilt against the new NestJS backend. Listing, search, and member detail will return shortly."
      icon={Users}
    />
  );
}
