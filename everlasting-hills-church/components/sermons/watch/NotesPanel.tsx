'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useSermonNote } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';

export default function NotesPanel({
  sermonId,
  initialNote,
  isLoggedIn,
}: {
  sermonId: string;
  initialNote: string;
  isLoggedIn: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const saveNote = useSermonNote();
  const synced = useRef(false);

  // initialNote often arrives after first render (fetched client-side in the player bar
  // drawer / member dashboard page), so the useState above can start empty even when a note
  // already exists. Sync once when the real value shows up — don't keep re-syncing after
  // that, or we'd clobber whatever the member is actively typing.
  useEffect(() => {
    if (synced.current || !initialNote) return;
    setNote(initialNote);
    synced.current = true;
  }, [initialNote]);

  function handleSave() {
    saveNote.mutate(
      { sermonId, content: note },
      {
        onSuccess: () => showToast.success('Note saved'),
        onError: () => showToast.error('Could not save your note — try again'),
      },
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Lock size={20} className="text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Private notes are for members</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 max-w-xs">
          Log in to jot down reflections while you listen — only you can see these.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 dark:text-gray-500">Private — only you can see this note.</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={7}
        placeholder="Write your personal notes, reflections, or key takeaways…"
        className="w-full text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveNote.isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all"
        >
          {saveNote.isPending && <Loader2 size={12} className="animate-spin" />}
          {saveNote.isPending ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}
