"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, MessageCircle, Pencil, Reply, Send, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteUnitMessage, useMarkUnitConversationRead, useSendUnitMessage, useUnitMessages, useUpdateUnitMessage } from "@/lib/api";
import type { UnitMessage } from "@/types";
import { showToast } from "@/components/ui/toast/toast";

type Recipient = { id: string; name: string; photoUrl: string | null };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function UnitConversationPanel({
  unitId,
  recipient,
  onClose,
}: {
  unitId: string;
  recipient: Recipient | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<UnitMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const conversation = useUnitMessages(unitId, recipient?.id ?? null);
  const send = useSendUnitMessage();
  const update = useUpdateUnitMessage();
  const remove = useDeleteUnitMessage();
  const markRead = useMarkUnitConversationRead();

  useEffect(() => {
    if (recipient) {
      markRead.mutate({ unitId, recipientId: recipient.id });
    }
  }, [unitId, recipient?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.data?.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!recipient || !content || send.isPending || update.isPending) return;

    try {
      if (editingId) {
        await update.mutateAsync({ unitId, messageId: editingId, message: content });
      } else {
        const optimisticId = `temporary-${Date.now()}`;
        const optimisticMessage: UnitMessage = {
          id: optimisticId,
          content,
          senderId: "me",
          recipientId: recipient.id,
          createdAt: new Date().toISOString(),
          editedAt: null,
          deletedAt: null,
          readAt: null,
          isRead: false,
          replyToId: replyingTo?.id ?? null,
          ReplyTo: replyingTo
            ? { id: replyingTo.id, content: replyingTo.content, senderId: replyingTo.senderId, deletedAt: replyingTo.deletedAt }
            : null,
          isMine: true,
        };
        addOptimisticMessage(optimisticMessage);
        setMessage("");
        setReplyingTo(null);
        try {
          await send.mutateAsync({ unitId, recipientId: recipient.id, message: content, replyToId: replyingTo?.id });
        } catch (error) {
          removeOptimisticMessage(optimisticId);
          throw error;
        }
      }
      setMessage("");
      setEditingId(null);
      setReplyingTo(null);
      await queryClient.invalidateQueries({ queryKey: ["units", unitId, "messages", recipient?.id] });
    } catch (error) {
      showToast.error((error as { message?: string })?.message ?? "Couldn't send message");
    }
  }

  async function handleDelete(item: UnitMessage) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await remove.mutateAsync({ unitId, messageId: item.id });
      if (editingId === item.id) {
        setEditingId(null);
        setMessage("");
      }
      await queryClient.invalidateQueries({ queryKey: ["units", unitId, "messages", recipient?.id] });
    } catch (error) {
      showToast.error((error as { message?: string })?.message ?? "Couldn't delete message");
    }
  }

  function startEdit(item: UnitMessage) {
    setEditingId(item.id);
    setReplyingTo(null);
    setMessage(item.content);
  }

  function startReply(item: UnitMessage) {
    setEditingId(null);
    setReplyingTo(item);
    setMessage("");
  }

  function addOptimisticMessage(item: UnitMessage) {
    queryClient.setQueryData<UnitMessage[]>(["units", unitId, "messages", recipient?.id], (current = []) => [...current, item]);
  }

  function removeOptimisticMessage(id: string) {
    queryClient.setQueryData<UnitMessage[]>(["units", unitId, "messages", recipient?.id], (current = []) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_12px_35px_-20px_rgba(42,4,16,0.45)] dark:border-white/10 dark:bg-[#171719]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#87102C]/10 bg-gradient-to-r from-[#fffaf8] to-[#f8f1ee] px-4 py-3.5 dark:border-white/10 dark:from-[#23171a] dark:to-[#1c1718]">
        {recipient ? <>
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#87102C]/10 text-xs font-bold text-[#87102C] ring-2 ring-white dark:bg-[#87102C]/20 dark:text-[#e8768a] dark:ring-[#302124]">
          {recipient.photoUrl ? <img src={recipient.photoUrl} alt="" className="h-full w-full object-cover" /> : initials(recipient.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-gray-900 dark:text-white">{recipient.name}</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">Conversation history</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close conversation" className="rounded-xl p-2 text-gray-400 transition hover:bg-[#87102C]/10 hover:text-[#87102C] dark:hover:bg-white/10 dark:hover:text-white">
          <X size={17} />
        </button>
        </> : <div><p className="text-[15px] font-bold text-gray-900 dark:text-white">Unit conversation</p><p className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">Select a member to view your chat</p></div>}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f7f3f0] px-3 py-5 dark:bg-[#111113] sm:px-5" style={{ backgroundImage: "radial-gradient(rgba(135,16,44,0.07) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {conversation.isLoading && <div className="flex min-h-[15rem] items-center justify-center"><Loader2 className="animate-spin text-[#87102C]" size={20} /></div>}
        {!recipient && (
          <div className="flex h-56 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#87102C] shadow-sm dark:bg-white/10 dark:text-[#e8768a]"><MessageCircle size={22} /></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Choose a member</p>
            <p className="mt-1 text-xs">Select someone from the roster to view the conversation.</p>
          </div>
        )}
        {recipient && !conversation.isLoading && conversation.data?.length === 0 && (
          <div className="flex h-56 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#87102C] shadow-sm dark:bg-white/10 dark:text-[#e8768a]"><MessageCircle size={22} /></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Start the conversation</p>
            <p className="mt-1 text-xs">Your messages with {recipient.name.split(" ")[0]} will stay here.</p>
          </div>
        )}
        {conversation.data?.map((item) => (
          <div key={item.id} className={`flex ${item.isMine ? "justify-end" : "justify-start"}`}>
            <div className={`group relative max-w-[84%] rounded-2xl px-3.5 py-2.5 shadow-[0_3px_10px_-7px_rgba(0,0,0,0.5)] ${item.isMine ? "rounded-br-md bg-[#87102C] text-white" : "rounded-bl-md border border-black/[0.04] bg-white text-gray-800 dark:border-white/5 dark:bg-white/10 dark:text-gray-100"}`}>
              <div className="mb-1 flex items-center justify-between gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => startReply(item)} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${item.isMine ? "text-white/75 hover:text-white" : "text-gray-500 hover:text-[#87102C] dark:text-gray-400 dark:hover:text-white"}`}><Reply size={11} /> Reply</button>
                {item.isMine && !item.deletedAt && <span className="flex items-center gap-1"><button type="button" onClick={() => startEdit(item)} aria-label="Edit message" className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"><Pencil size={11} /></button><button type="button" onClick={() => handleDelete(item)} aria-label="Delete message" className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"><Trash2 size={11} /></button></span>}
              </div>
              {item.replyToId && item.ReplyTo && <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-[11px] ${item.isMine ? "border-white/50 bg-white/10 text-white/75" : "border-[#87102C]/40 bg-[#87102C]/5 text-gray-500 dark:text-gray-400"}`}>{item.ReplyTo.deletedAt ? "Message deleted" : item.ReplyTo.content}</div>}
              <p className={`whitespace-pre-wrap break-words text-[13px] leading-relaxed ${item.deletedAt ? "italic opacity-70" : ""}`}>{item.deletedAt ? "This message was deleted" : item.content}</p>
              <p className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] font-medium ${item.isMine ? "text-white/65" : "text-gray-400 dark:text-gray-500"}`}>
                {timeLabel(item.createdAt)}{item.editedAt && !item.deletedAt ? " · edited" : ""}
                {item.isMine && (item.isRead ? <CheckCheck size={13} className="text-sky-200" aria-label="Seen" /> : <Check size={13} aria-label="Sent" />)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {(send.isError || update.isError || remove.isError) && (
        <p className="border-t border-red-100 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {((send.error || update.error || remove.error) as { message?: string })?.message ?? "Message action failed. Please try again."}
        </p>
      )}
      {(editingId || replyingTo) && <div className="flex items-center gap-2 border-t border-[#87102C]/10 bg-[#fffaf8] px-3.5 py-2 text-xs dark:border-white/10 dark:bg-[#23171a]"><span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-300">{editingId ? "Editing your message" : `Replying to ${replyingTo?.isMine ? "your message" : recipient?.name}`}</span><button type="button" onClick={() => { setEditingId(null); setReplyingTo(null); setMessage(""); }} aria-label="Cancel message action" className="text-gray-400 hover:text-[#87102C]"><X size={14} /></button></div>}
      <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-gray-100 bg-white p-3.5 dark:border-white/10 dark:bg-[#171719]">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={1000}
          rows={1}
          placeholder={editingId ? "Edit your message..." : replyingTo ? "Write a reply..." : recipient ? `Message ${recipient.name.split(" ")[0]}...` : "Select a member first..."}
          className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-gray-200 bg-[#fafafa] px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#87102C]/40 focus:bg-white focus:ring-2 focus:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
        />
        <button type="submit" disabled={!recipient || !message.trim() || send.isPending || update.isPending} aria-label={editingId ? "Save message" : "Send message"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#87102C] bg-[#87102C] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#6f0d24] hover:shadow-md disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:border-white/10 dark:disabled:bg-white/10 dark:disabled:text-white/40">
          {send.isPending || update.isPending ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Pencil size={16} /> : <Send size={16} />}
        </button>
      </form>
    </section>
  );
}
