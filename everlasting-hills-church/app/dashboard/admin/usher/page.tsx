import { redirect } from "next/navigation";

/**
 * Ushering moved out of Administration into its own module: HEAD_USHER is a role
 * in its own right, and the people who hold it are not administrators. This
 * redirect keeps old links and bookmarks working.
 */
export default function LegacyUsherPage() {
  redirect("/dashboard/usher");
}
