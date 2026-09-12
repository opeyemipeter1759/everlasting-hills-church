import ServiceTeamsConsole from "@/components/dashboard/admin/service-teams/ServiceTeamsConsole";

export const metadata = { title: "Service Teams — Dashboard" };

/**
 * Client rendered: the roster is filtered interactively and is never the same
 * for two people looking at it a second apart.
 */
export default function ServiceTeamsPage() {
  return <ServiceTeamsConsole />;
}
