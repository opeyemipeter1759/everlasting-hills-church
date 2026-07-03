'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, BookOpen, Loader2, Save, Link, Upload } from 'lucide-react';
import { useCreateSermon, useUpdateSermon, useSermon } from '@/lib/api';
import FileUpload from '@/components/ui/form/FileUpload';
import type {
  CreateSermonPayload,
  SermonEpisodeInput,
  SermonType,
  SermonStatus,
  LatestSermon,
} from '@/types';

/* ── shared classnames ─────────────────────────────────────────────── */
const INPUT =
  'font-sans w-full rounded-xl border border-gray-200 dark:border-white/10 ' +
  'bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-sm ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 ' +
  'focus:border-[#87102C]/60 focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 transition-colors';

const LABEL = 'font-sans text-[11.5px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block';

/* ── helpers ───────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600">
        {title}
      </p>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ── episode row type ──────────────────────────────────────────────── */
type AudioMode = 'upload' | 'url';

type EpisodeRow = {
  id?: string;
  title: string;
  url: string;           // audio URL — filled by upload or typed
  duration: string;
  order: string;
  audioMode: AudioMode;  // UI-only: which audio input mode is active
};

const BLANK_EPISODE: EpisodeRow = {
  title: '',
  url: '',
  duration: '',
  order: '0',
  audioMode: 'upload',
};

/* ── form state ────────────────────────────────────────────────────── */
type FormState = {
  title: string;
  speaker: string;
  date: string;
  type: SermonType;
  status: SermonStatus;
  description: string;
  scriptureRef: string;
  series: string;
  tagsRaw: string;
  audioUrl: string;      // SINGLE only
  audioDuration: string; // SINGLE only (auto-filled from upload)
  videoUrl: string;      // SINGLE only
  thumbnailUrl: string;  // both modes — in Content section
  scheduledFor: string;
  transcript: string;
};

const BLANK_FORM: FormState = {
  title: '',
  speaker: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'SINGLE',
  status: 'DRAFT',
  description: '',
  scriptureRef: '',
  series: '',
  tagsRaw: '',
  audioUrl: '',
  audioDuration: '',
  videoUrl: '',
  thumbnailUrl: '',
  scheduledFor: '',
  transcript: '',
};

function sermonToForm(sermon: LatestSermon): FormState {
  return {
    title: sermon.title,
    speaker: sermon.speaker,
    date: sermon.date.slice(0, 10),
    type: sermon.type ?? 'SINGLE',
    status: sermon.status as SermonStatus,
    description: sermon.description ?? '',
    scriptureRef: sermon.scriptureRef ?? '',
    series: sermon.series ?? '',
    tagsRaw: (sermon.tags ?? []).join(', '),
    audioUrl: sermon.audioUrl ?? '',
    audioDuration: sermon.audioDuration != null ? String(sermon.audioDuration) : '',
    videoUrl: sermon.videoUrl ?? '',
    thumbnailUrl: sermon.thumbnailUrl ?? '',
    scheduledFor: sermon.scheduledFor ? sermon.scheduledFor.slice(0, 16) : '',
    transcript: sermon.transcript ?? '',
  };
}

function episodesToRows(episodes?: SermonEpisodeInput[]): EpisodeRow[] {
  return (episodes ?? []).map((ep) => ({
    id: ep.id,
    title: ep.title,
    url: ep.url,
    duration: ep.duration != null ? String(ep.duration) : '',
    order: String(ep.order),
    audioMode: 'upload' as AudioMode,
  }));
}

/* ── audio mode tab strip ──────────────────────────────────────────── */
function AudioModeTabs({
  mode,
  onChange,
}: {
  mode: AudioMode;
  onChange: (m: AudioMode) => void;
}) {
  const base =
    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all';
  const active = 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm';
  const idle = 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300';
  return (
    <div className="mb-2.5 flex w-fit items-center gap-0.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] p-1">
      <button type="button" onClick={() => onChange('upload')} className={`${base} ${mode === 'upload' ? active : idle}`}>
        <Upload size={11} /> Upload File
      </button>
      <button type="button" onClick={() => onChange('url')} className={`${base} ${mode === 'url' ? active : idle}`}>
        <Link size={11} /> Enter URL
      </button>
    </div>
  );
}

/* ── component ─────────────────────────────────────────────────────── */
type SermonFormProps = { mode: 'create' | 'edit' };

export default function SermonForm({ mode }: SermonFormProps) {
  const router = useRouter();
  const params = useParams();
  const sermonId = mode === 'edit' ? (params.id as string) : undefined;

  const { data: sermon, isLoading: isLoadingSermon } = useSermon(sermonId);
  const { mutate: createSermon, isPending: isCreating } = useCreateSermon();
  const { mutate: updateSermon, isPending: isUpdating } = useUpdateSermon();

  const isPending = isCreating || isUpdating;

  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('upload');

  /* populate form when editing */
  useEffect(() => {
    if (mode === 'edit' && sermon && !initialized) {
      setForm(sermonToForm(sermon));
      setEpisodes(episodesToRows(sermon.episodes));
      setInitialized(true);
    }
  }, [sermon, mode, initialized]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* episode helpers */
  function addEpisode() {
    setEpisodes((prev) => [
      ...prev,
      { ...BLANK_EPISODE, order: String(prev.length) },
    ]);
  }

  function updateEpisode<K extends keyof EpisodeRow>(i: number, key: K, value: EpisodeRow[K]) {
    setEpisodes((prev) => prev.map((ep, idx) => (idx === i ? { ...ep, [key]: value } : ep)));
  }

  function removeEpisode(i: number) {
    setEpisodes((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((ep, idx) => ({ ...ep, order: String(idx) })),
    );
  }

  /* submit */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const isSeries = form.type === 'SERIES';

    const payload: CreateSermonPayload = {
      title: form.title,
      speaker: form.speaker,
      date: new Date(form.date).toISOString(),
      type: form.type,
      status: form.status,
      ...(form.description && { description: form.description }),
      ...(form.transcript && { transcript: form.transcript }),
      ...(form.scriptureRef && { scriptureRef: form.scriptureRef }),
      ...(form.series && { series: form.series }),
      ...(form.tagsRaw && {
        tags: form.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
      }),
      ...(form.thumbnailUrl && { thumbnailUrl: form.thumbnailUrl }),
      ...(form.scheduledFor && { scheduledFor: new Date(form.scheduledFor).toISOString() }),
      /* SINGLE-only media fields */
      ...(!isSeries && form.audioUrl && { audioUrl: form.audioUrl }),
      ...(!isSeries && form.audioDuration && { audioDuration: Number(form.audioDuration) }),
      ...(!isSeries && form.videoUrl && { videoUrl: form.videoUrl }),
      /* SERIES episodes */
      ...(isSeries &&
        episodes.length > 0 && {
          episodes: episodes.map(
            (ep, i): SermonEpisodeInput => ({
              ...(ep.id && { id: ep.id }),
              title: ep.title,
              url: ep.url,
              duration: Number(ep.duration || 0),
              order: ep.order ? Number(ep.order) : i,
            }),
          ),
        }),
    };

    const onError = (err: unknown) => {
      setError(
        (err as { message?: string })?.message ?? 'Something went wrong. Please try again.',
      );
    };

    if (mode === 'create') {
      createSermon(payload, {
        onSuccess: () => router.push('/dashboard/pastor/sermons'),
        onError,
      });
    } else {
      updateSermon(
        { id: sermonId!, payload },
        {
          onSuccess: () => router.push('/dashboard/pastor/sermons'),
          onError,
        },
      );
    }
  }

  /* loading skeleton while fetching sermon in edit mode */
  if (mode === 'edit' && isLoadingSermon) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#87102C]" />
      </div>
    );
  }

  const isSeries = form.type === 'SERIES';

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-[1400px]">
      {/* ── header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-t-2xl bg-gradient-to-br from-[#87102C] via-[#6e0c24] to-[#4a0617] px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pastor/sermons')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <BookOpen size={17} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold italic leading-tight text-white">
                {mode === 'create' ? 'New Sermon' : 'Edit Sermon'}
              </h2>
              <p className="font-sans text-[11px] text-white/55">
                {mode === 'create'
                  ? 'Fill in the details and publish or save as draft'
                  : 'Update the sermon details below'}
              </p>
            </div>
          </div>
        </div>

        {/* desktop action bar */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pastor/sermons')}
            disabled={isPending}
            className="font-sans rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sermon-form"
            disabled={isPending}
            className="font-sans inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#87102C] shadow-lg shadow-black/20 hover:bg-church-warm active:scale-[0.97] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {mode === 'create' ? 'Creating…' : 'Saving…'}
              </>
            ) : mode === 'create' ? (
              <>
                <Plus size={14} strokeWidth={2.5} /> Create Sermon
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── form body ──────────────────────────────────────────────── */}
      <div className="rounded-b-2xl border border-t-0 border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#141414]">
        <form id="sermon-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-3">

          {error && (
            <div className="font-sans lg:col-span-3 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Main column ────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

          {/* ── Basic Information ──────────────────────────────────── */}
          <Section title="Basic Information">
            <Field label="Sermon Title" required>
              <input
                required
                type="text"
                placeholder="e.g. The Power of Faith"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={INPUT}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Speaker" required>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pastor John"
                  value={form.speaker}
                  onChange={(e) => set('speaker', e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Date" required>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>
          </Section>

          <hr className="border-gray-100 dark:border-white/[0.06]" />

          {/* ── Content ────────────────────────────────────────────── */}
          <Section title="Content">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Scripture Reference">
                <input
                  type="text"
                  placeholder="e.g. Hebrews 11:1"
                  value={form.scriptureRef}
                  onChange={(e) => set('scriptureRef', e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Series Name">
                <input
                  type="text"
                  placeholder="e.g. Faith Series"
                  value={form.series}
                  onChange={(e) => set('series', e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={3}
                placeholder="A brief description of this message…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={`${INPUT} resize-none`}
              />
            </Field>

            <Field label="Tags" hint="(comma-separated)">
              <input
                type="text"
                placeholder="faith, hope, grace"
                value={form.tagsRaw}
                onChange={(e) => set('tagsRaw', e.target.value)}
                className={INPUT}
              />
            </Field>

            <Field label="Transcript">
              <textarea
                rows={5}
                placeholder="Full sermon transcript…"
                value={form.transcript}
                onChange={(e) => set('transcript', e.target.value)}
                className={`${INPUT} resize-none`}
              />
            </Field>
          </Section>

          {/* ── Media (SINGLE only) ────────────────────────────────── */}
          {!isSeries && (
            <>
              <hr className="border-gray-100 dark:border-white/[0.06]" />
              <Section title="Media">
                <Field label="Audio">
                  <AudioModeTabs mode={audioMode} onChange={setAudioMode} />
                  {audioMode === 'upload' ? (
                    <FileUpload
                      type="audio"
                      endpoint="/sermons/upload-audio"
                      value={form.audioUrl}
                      onChange={(url) => set('audioUrl', url)}
                      onDurationDetected={(secs) => set('audioDuration', String(secs))}
                      disabled={isPending}
                    />
                  ) : (
                    <input
                      type="url"
                      placeholder="https://cdn.example.com/sermon.mp3"
                      value={form.audioUrl}
                      onChange={(e) => set('audioUrl', e.target.value)}
                      className={INPUT}
                    />
                  )}
                </Field>

                {form.audioUrl && (
                  <Field label="Audio Duration" hint="(seconds — auto-filled on upload)">
                    <input
                      type="number"
                      min={0}
                      placeholder="3150"
                      value={form.audioDuration}
                      onChange={(e) => set('audioDuration', e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                )}

                <Field label="Video URL">
                  <div className="relative">
                    <Link size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=…"
                      value={form.videoUrl}
                      onChange={(e) => set('videoUrl', e.target.value)}
                      className={`${INPUT} pl-8`}
                    />
                  </div>
                </Field>
              </Section>
            </>
          )}

          {/* ── Episodes (SERIES only) ──────────────────────────────── */}
          {isSeries && (
            <>
              <hr className="border-gray-100 dark:border-white/[0.06]" />
              <Section title="Episodes">
                {episodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10 py-8 text-center">
                    <p className="font-sans mb-3 text-sm text-gray-400 dark:text-gray-500">
                      No episodes yet
                    </p>
                    <button
                      type="button"
                      onClick={addEpisode}
                      className="font-sans inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#87102C]/30 px-3 py-1.5 text-xs font-bold text-[#87102C] dark:text-[#e8768a] hover:bg-[#87102C]/5 transition-colors"
                    >
                      <Plus size={12} strokeWidth={2.5} /> Add First Episode
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {episodes.map((ep, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] p-4 space-y-3"
                      >
                        {/* episode header */}
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Episode {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEpisode(i)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* episode title */}
                        <div>
                          <label className={LABEL}>Episode Title</label>
                          <input
                            type="text"
                            placeholder="Episode title"
                            value={ep.title}
                            onChange={(e) => updateEpisode(i, 'title', e.target.value)}
                            className={INPUT}
                          />
                        </div>

                        {/* audio — upload or URL */}
                        <div>
                          <label className={LABEL}>Audio</label>
                          <AudioModeTabs
                            mode={ep.audioMode}
                            onChange={(m) => updateEpisode(i, 'audioMode', m)}
                          />
                          {ep.audioMode === 'upload' ? (
                            <FileUpload
                              type="audio"
                              endpoint="/sermons/upload-audio"
                              value={ep.url}
                              onChange={(url) => updateEpisode(i, 'url', url)}
                              onDurationDetected={(secs) =>
                                updateEpisode(i, 'duration', String(secs))
                              }
                              disabled={isPending}
                            />
                          ) : (
                            <input
                              type="url"
                              placeholder="https://cdn.example.com/episode.mp3"
                              value={ep.url}
                              onChange={(e) => updateEpisode(i, 'url', e.target.value)}
                              className={INPUT}
                            />
                          )}
                        </div>

                        {/* duration + order */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={LABEL}>
                              Duration{' '}
                              <span className="font-normal text-gray-400">(sec — auto-filled)</span>
                              <span className="ml-0.5 text-red-500">*</span>
                            </label>
                            <input
                              required
                              type="number"
                              min={0}
                              placeholder="e.g. 2700"
                              value={ep.duration}
                              onChange={(e) => updateEpisode(i, 'duration', e.target.value)}
                              className={INPUT}
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Order</label>
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={ep.order}
                              onChange={(e) => updateEpisode(i, 'order', e.target.value)}
                              className={INPUT}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addEpisode}
                      className="font-sans inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#87102C]/30 px-3 py-1.5 text-xs font-bold text-[#87102C] dark:text-[#e8768a] hover:bg-[#87102C]/5 transition-colors"
                    >
                      <Plus size={12} strokeWidth={2.5} /> Add Episode
                    </button>
                  </div>
                )}
              </Section>
            </>
          )}
          </div>

          {/* ── Sidebar column ─────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] p-5">
              <Section title="Publishing">
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value as SermonType)}
                    className={INPUT}
                  >
                    <option value="SINGLE">Single</option>
                    <option value="SERIES">Series</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => set('status', e.target.value as SermonStatus)}
                    className={INPUT}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </Field>

                {form.status === 'SCHEDULED' && (
                  <Field label="Scheduled For">
                    <input
                      type="datetime-local"
                      value={form.scheduledFor}
                      onChange={(e) => set('scheduledFor', e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                )}
              </Section>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] p-5">
              <Section title="Thumbnail">
                <Field label="Cover Image">
                  <FileUpload
                    type="image"
                    endpoint="/uploads/image"
                    value={form.thumbnailUrl}
                    onChange={(url) => set('thumbnailUrl', url)}
                    disabled={isPending}
                  />
                </Field>
              </Section>
            </div>
          </div>
        </form>

        {/* ── mobile footer (desktop uses the sticky header actions) ─── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/[0.07] px-6 py-4 sm:hidden">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pastor/sermons')}
            disabled={isPending}
            className="font-sans rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sermon-form"
            disabled={isPending}
            className="font-sans inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#87102C]/25 hover:bg-[#6E0C24] active:scale-[0.97] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {mode === 'create' ? 'Creating…' : 'Saving…'}
              </>
            ) : mode === 'create' ? (
              <>
                <Plus size={14} strokeWidth={2.5} /> Create Sermon
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
