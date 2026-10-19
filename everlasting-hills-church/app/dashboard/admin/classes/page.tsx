import { Suspense } from "react";
import AdminClassesClient from "@/components/classes/admin/AdminClassesClient";

export const metadata = { title: "Classes | Dashboard" };

export default function AdminClassesPage() {
  return (
    <Suspense>
      <AdminClassesClient />
    </Suspense>
  );
}
