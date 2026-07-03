'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, Pencil, Users } from 'lucide-react';
import { useAnswerQuestion } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';
import type { WatchDiscussionQuestion } from '@/lib/api/sermon-types';

function QuestionCard({
  index,
  question,
  isLoggedIn,
  currentMemberId,
}: {
  index: number;
  question: WatchDiscussionQuestion;
  isLoggedIn: boolean;
  currentMemberId?: string;
}) {
  const answerQuestion = useAnswerQuestion();
  const mine = question.responses.find((r) => r.memberId === currentMemberId);
  const others = question.responses.filter((r) => r.memberId !== currentMemberId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mine?.content ?? '');

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    answerQuestion.mutate(
      { questionId: question.id, content: trimmed },
      {
        onSuccess: () => {
          showToast.success(mine ? 'Answer updated' : 'Thanks for sharing');
          setEditing(false);
        },
        onError: () => showToast.error('Could not save your answer — try again'),
      },
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] p-4 space-y-3">
      <div className="flex gap-3">
        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{question.question}</p>
      </div>

      {isLoggedIn && (
        <div className="pl-8">
          {mine && !editing ? (
            <div className="rounded-lg border border-[#87102C]/15 bg-[#87102C]/[0.04] dark:bg-[#87102C]/10 px-3.5 py-2.5">
              <p className="text-[11px] font-bold text-[#87102C] dark:text-[#e8768a] uppercase tracking-wide">Your answer</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{mine.content}</p>
              <button
                type="button"
                onClick={() => { setDraft(mine.content); setEditing(true); }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
              >
                <Pencil size={10} /> Edit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="Share your answer…"
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400"
              />
              <div className="flex justify-end gap-2">
                {editing && (
                  <button type="button" onClick={() => setEditing(false)} className="text-xs font-semibold text-gray-400 px-3 py-1.5">
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={answerQuestion.isPending || !draft.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all"
                >
                  {answerQuestion.isPending && <Loader2 size={11} className="animate-spin" />}
                  {mine ? 'Update Answer' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="pl-8 space-y-2 pt-1 border-t border-gray-100 dark:border-white/8">
          <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 pt-2">
            <Users size={11} /> {others.length} other response{others.length !== 1 ? 's' : ''}
          </p>
          {others.slice(0, 3).map((r) => (
            <div key={r.id} className="text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{r.member.firstName}:</span>{' '}
              <span className="text-gray-500 dark:text-gray-400">{r.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReflectionPanel({
  questions,
  isLoggedIn,
  currentMemberId,
}: {
  questions: WatchDiscussionQuestion[];
  isLoggedIn: boolean;
  currentMemberId?: string;
}) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Lightbulb size={20} className="text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">No reflection questions for this message yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q, i) => (
          <QuestionCard key={q.id} index={i} question={q} isLoggedIn={isLoggedIn} currentMemberId={currentMemberId} />
        ))}
    </div>
  );
}
