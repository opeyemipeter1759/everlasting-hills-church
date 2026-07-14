"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PersonRow } from "@/lib/api/people";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";

/** Replace a person's full tag set (table row "Tag" action). */
export default function TagDialog({
  person,
  onClose,
}: {
  person: PersonRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [value, setValue] = useState("");
  const [seedId, setSeedId] = useState<string | undefined>(undefined);

  if (person && person.id !== seedId) {
    setSeedId(person.id);
    setValue((person.tags ?? []).join(", "));
  }

  const save = useMutation({
    mutationFn: (tags: string[]) =>
      api.patch(`/members/${person!.id}/tags`, { tags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      onClose();
    },
  });

  function submit() {
    const tags = value
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    save.mutate(Array.from(new Set(tags)));
  }

  return (
    <FormModal
      open={person !== null}
      onClose={onClose}
      title={person ? `Tags · ${person.name}` : "Tags"}
      subtitle="Comma-separated. Tags power filtering and segmentation."
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={save.isPending} onClick={submit}>
            {save.isPending ? "Saving…" : "Save tags"}
          </button>
        </>
      }
    >
      <input
        autoFocus
        className={fieldCls}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="e.g. choir, youth, first-timer"
      />
    </FormModal>
  );
}
