import DepartmentReportEditorClient from "@/components/dashboard/admin/departments/DepartmentReportEditorClient";

export const metadata = { title: "New Report · Dashboard" };

export default function NewDepartmentReportPage() {
  return <DepartmentReportEditorClient mode="create" />;
}
