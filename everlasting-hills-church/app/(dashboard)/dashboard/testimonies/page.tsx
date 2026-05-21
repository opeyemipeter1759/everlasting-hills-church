import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import { MessageSquare } from "lucide-react";

export default function TestimoniesPage() {
  return (
    <ComingSoon
      title="Testimonies"
      description="Review submitted testimonies. Approve for public display and feature on the website."
      icon={MessageSquare}
    />
  );
}
