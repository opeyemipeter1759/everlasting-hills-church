import UnitsCmsClient from "@/components/dashboard/admin/UnitsCmsClient";

export const metadata = { title: "Units — Dashboard" };

/**
 * Units management page.
 *
 * Server Component shell — the actual master/detail UI lives in a Client Component
 * because it owns interactive selection, add/remove member forms, and refetch state.
 *
 * Middleware gates the route to UNIT_LEAD+; the backend enforces the finer rules
 * (UNIT_LEAD can only mutate units they lead; ADMIN+ has full control).
 */
export default function UnitsAdminPage() {
  return <UnitsCmsClient />;
}
