'use client';

import { useState } from 'react';
import { MessageCircle, Loader2, Trash2, Send } from 'lucide-react';
import { useSermonComments, useAddComment, useDeleteComment } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';
import type { SermonComment } from '@/lib/api/sermon-types';
import { timeAgo, Avatar } from './chatUi';

/** Skeleton bubble — mirrors the real Bubble's shape/alignment so the loading state doesn't jump around. */
function BubbleSkeleton({ isMine, width }: { isMine: boolean; width: string }) {
  return (
    <div className={`flex gap-2 animate-pulse ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-white/10" />
      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-white/10" />}
        <div className={`h-9 rounded-2xl bg-gray-100 dark:bg-white/[0.06] ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'} ${width}`} />
        <div className="h-2 w-10 rounded bg-gray-100 dark:bg-white/[0.06]" />
      </div>
    </div>
  );
}

function CommentsSkeleton() {
  const rows: Array<{ isMine: boolean; width: string }> = [
    { isMine: false, width: 'w-48' },
    { isMine: false, width: 'w-36' },
    { isMine: true, width: 'w-40' },
    { isMine: false, width: 'w-52' },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <BubbleSkeleton key={i} isMine={r.isMine} width={r.width} />
      ))}
    </div>
  );
}

/** One chat bubble — right-aligned for the current member, left-aligned for everyone else. */
function Bubble({
  comment,
  isMine,
  canReply,
  onReply,
  onDelete,
}: {
  comment: SermonComment;
  isMine: boolean;
  canReply: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      <Avatar member={comment.member} />
      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-1">
            {comment.member.firstName} {comment.member.lastName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isMine
              ? 'bg-[#87102C] text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 rounded-tl-sm'
          }`}
        >
          {comment.content}
        </div>
        <div className={`flex items-center gap-2.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
          {canReply && (
            <button type="button" onClick={onReply} className="text-[10px] font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors">
              Reply
            </button>
          )}
          {isMine && (
            <button type="button" onClick={onDelete} className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-0.5">
              <Trash2 size={9} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsPanel({
  sermonId,
  isLoggedIn,
  currentMemberId,
}: {
  sermonId: string;
  isLoggedIn: boolean;
  currentMemberId?: string;
}) {
  const { data: comments, isLoading } = useSermonComments(sermonId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  function post(content: string, parentId?: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    addComment.mutate(
      { sermonId, content: trimmed, parentId },
      {
        onSuccess: () => {
          setDraft('');
          setReplyingTo(null);
        },
        onError: () => showToast.error('Could not post your comment — try again'),
      },
    );
  }

  function remove(commentId: string) {
    deleteComment.mutate(
      { commentId, sermonId },
      { onError: () => showToast.error('Could not delete that comment') },
    );
  }

  const total = (comments ?? []).reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
        {total} comment{total !== 1 ? 's' : ''}
      </p>

      {!isLoggedIn && (
        <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl px-3.5 py-3">
          Log in to join the conversation.
        </p>
      )}

      {isLoading ? (
        <CommentsSkeleton />
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <MessageCircle size={20} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet — be the first to share.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {comments!.map((c) => (
            <div key={c.id} className="space-y-2.5">
              <Bubble
                comment={c}
                isMine={c.memberId === currentMemberId}
                canReply={isLoggedIn}
                onReply={() => setReplyingTo({ id: c.id, name: c.member.firstName })}
                onDelete={() => remove(c.id)}
              />
              {c.replies.map((r) => (
                <div key={r.id} className="pl-8">
                  <Bubble
                    comment={r}
                    isMine={r.memberId === currentMemberId}
                    canReply={isLoggedIn}
                    onReply={() => setReplyingTo({ id: c.id, name: r.member.firstName })}
                    onDelete={() => remove(r.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {isLoggedIn && (
        <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/8">
          {replyingTo && (
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-[11px] text-gray-400">
                Replying to <span className="font-semibold text-gray-600 dark:text-gray-300">{replyingTo.name}</span>
              </span>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 pt-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={1}
              placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Share your thoughts on this message…'}
              className="flex-1 text-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  post(draft, replyingTo?.id);
                }
              }}
            />
            <button
              type="button"
              onClick={() => post(draft, replyingTo?.id)}
              disabled={addComment.isPending || !draft.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-all"
              aria-label="Send"
            >
              {addComment.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
