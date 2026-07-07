import DepartmentDetail from "@/components/dashboard/admin/departments/DepartmentDetail";

export const metadata = { title: "Department · Dashboard" };

export default function DepartmentDetailPage({ params }: { params: { id: string } }) {
  return <DepartmentDetail id={params.id} />;
}
