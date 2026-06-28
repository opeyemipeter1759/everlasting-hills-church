import { redirect } from "next/navigation";

// /me now lives inside /dashboard — all roles use the unified dashboard shell.
export default function MePage() {
  redirect("/dashboard");
}
