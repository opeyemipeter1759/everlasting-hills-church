import PastorReportEditorClient from "@/components/dashboard/pastor/PastorReportEditorClient";

export const metadata = { title: "New Report — Dashboard" };

export default function NewPastorReportPage() {
  return <PastorReportEditorClient mode="create" />;
}
