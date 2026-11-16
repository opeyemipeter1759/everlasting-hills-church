import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useAddReadinessTasks } from "@/lib/api/service-readiness-tasks";

interface Props {
  serviceId: string;
  unitId: string;
  placeholder?: string;
}

/** Type a task and press Enter. */
export default function AddTaskInput({ serviceId, unitId, placeholder = "Add a task, e.g. Test the wireless mics" }: Props) {
  const add = useAddReadinessTasks();
  const [title, setTitle] = useState("");
  const id = `add-task-${serviceId}-${unitId}`;

  function submit() {
    const t = title.trim();
    if (!t || add.isPending) return;
    add.mutate(
      { serviceId, unitId, titles: [t] },
      {
        onSuccess: () => setTitle(""),
        onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't add the task."),
      },
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">New task</label>
      <div className="relative flex-1">
        <Plus size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          value={title}
          maxLength={200}
          placeholder={placeholder}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#87102C]/40 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:bg-white/[0.06]"
        />
      </div>
      <button
        type="submit"
        disabled={!title.trim() || add.isPending}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white transition-opacity hover:bg-[#6E0C24] disabled:opacity-40"
      >
        {add.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        Add
      </button>
    </form>
  );
}
