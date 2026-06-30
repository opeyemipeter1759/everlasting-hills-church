import { redirect } from "next/navigation";

/**
 * "Manage Users" has been merged into the unified People console at
 * /dashboard/members. This redirect keeps old links and bookmarks working.
 */
export default function ManageUsersPage() {
  redirect("/dashboard/members");
}
