import EmailComposerPage from "@/components/dashboard/admin/emails/EmailComposerPage";

export const metadata = {
  title: "New Email Template — Everlasting Hills Church",
};

export default function NewEmailTemplatePage() {
  return <EmailComposerPage mode="create" />;
}
