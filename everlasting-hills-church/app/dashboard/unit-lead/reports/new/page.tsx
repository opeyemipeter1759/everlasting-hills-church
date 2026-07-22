import UnitReportEditorClient from "@/components/dashboard/unit-lead/UnitReportEditorClient";

export const metadata = { title: "New Report — Dashboard" };

export default function NewUnitReportPage() {
  return <UnitReportEditorClient mode="create" />;
}
