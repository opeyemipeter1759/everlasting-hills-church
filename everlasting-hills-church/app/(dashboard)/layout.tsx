import { QueryProvider } from "@/lib/api/QueryProvider";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <h3>Yes</h3>
      {children}
    </QueryProvider>
  );
}