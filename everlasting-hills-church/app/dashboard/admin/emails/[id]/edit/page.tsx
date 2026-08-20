"use client";

import { useParams } from "next/navigation";
import EmailComposerPage from "@/components/dashboard/admin/emails/EmailComposerPage";

export default function EditEmailTemplatePage() {
  const params = useParams();
  const id = params.id as string;

  return <EmailComposerPage mode="edit" templateId={id} />;
}
