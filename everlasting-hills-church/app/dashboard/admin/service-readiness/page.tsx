import ServiceReadinessAdmin from "@/components/dashboard/admin/service-readiness/ServiceReadinessAdmin";

export const metadata = { title: "Service Readiness — Dashboard" };

/** The Church Administrator's setup for the four-stage service cycle (Admin Head and above). */
export default function ServiceReadinessPage() {
  return <ServiceReadinessAdmin />;
}
