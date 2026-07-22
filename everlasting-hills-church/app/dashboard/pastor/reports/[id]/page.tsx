"use client";

import { useParams } from "next/navigation";
import PastorReportEditorClient from "@/components/dashboard/pastor/PastorReportEditorClient";

export default function PastorReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <PastorReportEditorClient mode="edit" reportId={id} />;
}
