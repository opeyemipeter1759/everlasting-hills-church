'use client';

import { useState } from 'react';
import { Loader2, Send, Search, X, PenLine, HelpCircle, ChevronDown, Inbox } from 'lucide-react';
import { useSermonDirectMessages, useSendDirectMessage, useMemberSearch } from '@/lib/api';
import { showToast } from '@/components/ui/toast/toast';
import { timeAgo, Avatar } from './chatUi';
import type { SermonDirectMessage, DirectMessageType, MemberPickerResult } from '@/lib/api/sermon-types';

const TYPES: { id: DirectMessageType; label: string; icon: typeof PenLine }[] = [
  { id: 'NOTE', label: 'Share a Note', icon: PenLine },
  { id: 'QUESTION', label: 'Ask a Question', icon: HelpCircle },
];

/** Search-as-you-type picker for who a note/question is addressed to. */
function RecipientPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: MemberPickerResult | null;
  onSelect: (m: MemberPickerResult) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState('');
  const { data: results, isFetching } = useMemberSearch(q);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2">
        <Avatar member={selected} className="w-6 h-6 text-[9px]" />
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">
          {selected.firstName} {selected.lastName}
        </span>
        <button type="button" onClick={onClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a member by name…"
        className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 placeholder:text-gray-400"
      />
      {q.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#242426] shadow-lg py-1">
          {isFetching ? (
            <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-gray-300" /></div>
          ) : !results || results.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">No members found</p>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onSelect(m); setQ(''); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Avatar member={m} className="w-6 h-6 text-[9px]" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{m.firstName} {m.lastName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** One thread — the top-level note/question plus its reply chain, chat-bubble style. */
function ThreadCard({
  message,
  currentMemberId,
  sermonId,
}: {
  message: SermonDirectMessage;
  currentMemberId?: string;
  sermonId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState('');
  const sendMessage = useSendDirectMessage();

  const iAmSender = message.senderId === currentMemberId;
  const partner = iAmSender ? message.recipient : message.sender;
  const isQuestion = message.type === 'QUESTION';
  const allMessages = [message, ...message.replies];

  function sendReply() {
    const trimmed = reply.trim();
    if (!trimmed) return;
    sendMessage.mutate(
      {
        sermonId,
        recipientMemberId: iAmSender ? message.recipientId : message.senderId,
        type: message.type,
        content: trimmed,
        parentId: message.id,
      },
      {
        onSuccess: () => setReply(''),
        onError: () => showToast.error('Could not send your reply'),
      },
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <Avatar member={partner} className="w-8 h-8 text-[11px]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {iAmSender ? 'To ' : 'From '}{partner.firstName} {partner.lastName}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              isQuestion ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {isQuestion ? 'Question' : 'Note'}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{message.content}</p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(message.createdAt)}</span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-white/8 px-3.5 py-3 space-y-3 bg-gray-50/50 dark:bg-white/[0.02]">
          {allMessages.map((m) => {
            const isMine = m.senderId === currentMemberId;
            return (
              <div key={m.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                <Avatar member={m.sender} className="w-6 h-6 text-[9px]" />
                <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMine
                        ? 'bg-[#87102C] text-white rounded-tr-sm'
                        : 'bg-white dark:bg-white/[0.06] border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{timeAgo(m.createdAt)}</span>
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-1">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={`Reply to ${partner.firstName}…`}
              onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={sendReply}
              disabled={sendMessage.isPending || !reply.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-all"
            >
              {sendMessage.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DirectMessagesPanel({
  sermonId,
  currentMemberId,
}: {
  sermonId: string;
  currentMemberId?: string;
}) {
  const { data: messages, isLoading } = useSermonDirectMessages(sermonId);
  const sendMessage = useSendDirectMessage();

  const [type, setType] = useState<DirectMessageType>('QUESTION');
  const [recipient, setRecipient] = useState<MemberPickerResult | null>(null);
  const [content, setContent] = useState('');

  function send() {
    const trimmed = content.trim();
    if (!trimmed || !recipient) return;
    sendMessage.mutate(
      { sermonId, recipientMemberId: recipient.id, type, content: trimmed },
      {
        onSuccess: () => {
          showToast.success(`Sent to ${recipient.firstName}`);
          setContent('');
          setRecipient(null);
        },
        onError: () => showToast.error('Could not send — try again'),
      },
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Composer ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-white/5 p-1 w-fit">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                  active ? 'bg-white dark:bg-[#2a2a2e] text-[#87102C] dark:text-[#e8768a] shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        <RecipientPicker selected={recipient} onSelect={setRecipient} onClear={() => setRecipient(null)} />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder={type === 'QUESTION' ? 'What would you like to ask?' : 'What do you want to share?'}
          className="w-full text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 placeholder:text-gray-400"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sendMessage.isPending || !content.trim() || !recipient}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-all"
          >
            {sendMessage.isPending && <Loader2 size={12} className="animate-spin" />}
            <Send size={12} /> Send {type === 'QUESTION' ? 'Question' : 'Note'}
          </button>
        </div>
      </div>

      {/* ── Threads ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-gray-300" />
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Inbox size={20} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No private notes or questions yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => (
            <ThreadCard key={m.id} message={m} currentMemberId={currentMemberId} sermonId={sermonId} />
          ))}
        </div>
      )}
    </div>
  );
}
