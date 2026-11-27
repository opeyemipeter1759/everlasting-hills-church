import ProgramEditorClient from "@/components/dashboard/programs/ProgramEditor";

export const metadata = { title: "Edit program | Everlasting Hills Church" };

export default function EditProgramPage({ params }: { params: { id: string } }) {
  return <ProgramEditorClient id={params.id} />;
}
