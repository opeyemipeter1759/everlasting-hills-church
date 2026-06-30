import PeopleConsole from "@/components/dashboard/admin/people/PeopleConsole";

export const metadata = { title: "People — Dashboard" };

/**
 * Unified People console (merged Members + Manage Users).
 *
 * Server shell only — the console is a Client Component because it owns rich
 * interactive state: server-side pagination, filters, sorting, selection, inline
 * role/status edits, create + assign dialogs, and CSV export. Data flows through
 * React Query against /members/directory and friends.
 */
export default function PeoplePage() {
  return <PeopleConsole />;
}
