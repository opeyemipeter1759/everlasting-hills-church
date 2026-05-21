import { redirect } from "next/navigation";

// My Profile lives at /me for now; will be migrated here in Step 6.
export default function ProfilePage() {
  redirect("/me");
}
