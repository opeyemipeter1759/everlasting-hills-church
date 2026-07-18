"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, MapPin, Clock, Calendar, Phone,
  X, AlertCircle, Plus, Minus,
  CheckCircle, Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { Select } from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Cell {
  id: string;
  name: string;
  leaderName: string;
  leaderPhone: string | null;
  meetingDay: string;
  meetingTime: string;
  address: string;
  state: string;
  city: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CELL_PHOTOS = [
  "/HeroImages/IMG_8931.jpg",
  "/HeroImages/IMG_1080.jpg",
  "/HeroImages/IMG_8248.jpg",
  "/HeroImages/IMG_4667.jpg",
  "/HeroImages/IMG_8470.jpg",
  "/HeroImages/IMG_5684.jpg",
  "/HeroImages/IMG_4565.jpg",
  "/HeroImages/IMG_9014.jpg",
];

const FAQS = [
  { q: "What exactly is a Home Cell?", a: "A Home Cell is a small, home-based gathering of believers who worship, study the Word, and grow together in close community. It's the most personal expression of church life at Everlasting Hills." },
  { q: "Where are Home Cells located?", a: "Cells are spread across different neighbourhoods in Ibadan. We match you to a group close to where you live or work — and if there isn't one nearby yet, you could help start one." },
  { q: "How does a Home Cell help me grow spiritually?", a: "Through weekly Scripture study, honest conversation, prayer, and real accountability, you grow faster than you ever would alone. Every Cell Leader is trained to guide and support their group." },
  { q: "How do I join a Home Cell?", a: "Find a cell above and click 'Join Cell'. You'll be taken directly to a WhatsApp chat with the Cell Leader, who will welcome you and share all the details you need for your first visit." },
  { q: "How is a Home Cell different from a Sunday service?", a: "Sunday is where we gather as one body. A Home Cell is where you are truly known — a smaller circle with space for questions, personal prayer, and the kind of depth a large gathering can't provide." },
  { q: "Can I start a Home Cell in my home?", a: "Absolutely. If you feel called to host and lead, speak with the Discipleship team. We provide training, materials, and ongoing pastoral support for every Cell Leader who steps up." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function cellPhoto(index: number) {
  return CELL_PHOTOS[index % CELL_PHOTOS.length];
}

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border-b border-white/[0.07] last:border-0"
    >
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
        aria-expanded={open}>
        <span className="font-display font-black text-base sm:text-lg text-white/80 group-hover:text-white transition-colors leading-snug">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center mt-0.5 group-hover:border-church-accent/50 group-hover:text-church-accent text-white/40 transition-all">
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-white/45 text-[15px] leading-relaxed max-w-2xl">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Add Cell modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", leaderPhone: "", meetingDay: "", meetingTime: "",
  state: "", city: "", addressDetail: "",
};

function AddCellModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function field(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const valid =
    form.name.trim().length > 1 &&
    form.leaderPhone.trim().length > 5 &&
    form.meetingDay.length > 0 &&
    form.meetingTime.trim().length > 0 &&
    form.state.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true); setErr(null);
    const address = [form.city.trim(), form.addressDetail.trim()].filter(Boolean).join(", ");
    try {
      await apiClient.post("/home-cell", {
        name: form.name.trim(),
        leaderName: "",
        leaderPhone: form.leaderPhone.trim(),
        meetingDay: form.meetingDay,
        meetingTime: form.meetingTime.trim(),
        address: address || form.state,
        city: form.city.trim() || form.state,
        state: form.state,
      });
      setDone(true);
    } catch {
      setErr("Couldn't save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full sm:max-w-lg bg-[#12040c] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        <div className="sm:hidden w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-1 flex-shrink-0" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-church-accent mb-0.5">New Home Cell</p>
            <h3 className="text-white font-black text-lg leading-tight">Add a Cell</h3>
            <p className="text-white/35 text-xs mt-0.5">A super admin will review and approve your submission.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Clock size={24} className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-white font-black text-xl mb-1">Submitted for Review</h4>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                  <span className="text-white/60 font-semibold">{form.name}</span> has been sent to our admin team. It will appear on the directory once approved.
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-8 py-3 rounded-full bg-church-maroon text-white text-sm font-black hover:bg-[#6E0C24] transition-colors">
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <FormField label="Cell Name" required
                input={<input value={form.name} onChange={e => field("name", e.target.value)} placeholder="Grace Light Cell" required />}
              />
              <FormField label="Leader WhatsApp Phone" required
                input={<input value={form.leaderPhone} onChange={e => field("leaderPhone", e.target.value)} placeholder="+234 801 234 5678" required />}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Meeting Day" required
                  input={
                    <Select
                      aria-label="Meeting Day"
                      value={form.meetingDay}
                      onChange={v => field("meetingDay", v)}
                      placeholder="Select day"
                      className="w-full bg-transparent text-white"
                      options={DAYS.map(d => ({ value: d, label: d }))}
                    />
                  }
                />
                <FormField label="Meeting Time" required
                  input={<input value={form.meetingTime} onChange={e => field("meetingTime", e.target.value)} placeholder="6:30 PM" required />}
                />
              </div>
              <FormField label="State" required
                input={
                  <Select
                    aria-label="State"
                    value={form.state}
                    onChange={v => field("state", v)}
                    placeholder="Select state"
                    className="w-full bg-transparent text-white"
                    options={NIGERIAN_STATES.map(s => ({ value: s, label: s }))}
                  />
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City / Area"
                  input={<input value={form.city} onChange={e => field("city", e.target.value)} placeholder="e.g. Bodija" />}
                />
                <FormField label="Street / Venue"
                  input={<input value={form.addressDetail} onChange={e => field("addressDetail", e.target.value)} placeholder="14 University Road" />}
                />
              </div>
              {err && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle size={13} />{err}
                </div>
              )}
              <button type="submit" disabled={!valid || loading}
                className="w-full py-3.5 rounded-2xl bg-church-maroon text-white font-black text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6E0C24] transition-all mt-2">
                {loading ? "Saving…" : "Add Home Cell"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, required, input }: { label: string; required?: boolean; input: React.ReactElement }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1.5">
        {label}{required && <span className="text-church-accent ml-0.5">*</span>}
      </label>
      <div className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white bg-white/[0.03] focus-within:border-church-accent/40 focus-within:bg-white/[0.05] transition-all [&_input]:w-full [&_input]:bg-transparent [&_input]:outline-none [&_input]:placeholder:text-white/20 [&_select]:w-full [&_select]:outline-none [&_select]:text-white [&_select]:appearance-none">
        {input}
      </div>
    </div>
  );
}

// ── Join modal ────────────────────────────────────────────────────────────────

function JoinModal({ cell, onClose }: { cell: Cell; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  const valid = form.name.trim().length > 1 && form.phone.trim().length > 5 && form.email.trim().length > 3;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true); setErr(null);
    try {
      await apiClient.post(`/home-cell/${cell.id}/join`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
      setDone(true);
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full sm:max-w-md bg-[#12040c] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        <div className="sm:hidden w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-1 flex-shrink-0" />

        {/* header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-church-accent mb-0.5">Join Cell</p>
            <h3 className="text-white font-black text-lg leading-tight">{cell.name}</h3>
            <p className="text-white/35 text-xs mt-0.5">Led by {cell.leaderName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-church-maroon/20 border border-church-maroon/30 flex items-center justify-center">
                <CheckCircle size={26} className="text-church-accent" />
              </div>
              <div>
                <h4 className="text-white font-black text-xl mb-1">You&rsquo;re in!</h4>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                  Someone from the {cell.name} Home Cell will reach out to welcome you before your first meeting.
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-8 py-3 rounded-full bg-church-maroon text-white text-sm font-black hover:bg-[#6E0C24] transition-colors">
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {[
                { name: "name",  label: "Full Name",        placeholder: "Tunde Adeyemi",     required: true,  type: "text"  },
                { name: "phone", label: "Phone Number",     placeholder: "+234 801 234 5678",  required: true,  type: "text"  },
                { name: "email", label: "Email", placeholder: "tunde@example.com", required: true, type: "email" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1.5">
                    {f.label}{f.required && <span className="text-church-accent ml-0.5">*</span>}
                  </label>
                  <input
                    name={f.name} type={f.type} required={f.required}
                    value={form[f.name as keyof typeof form]}
                    onChange={handle} placeholder={f.placeholder}
                    className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white bg-white/[0.03] placeholder:text-white/20 focus:outline-none focus:border-church-accent/40 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              ))}

              {err && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle size={13} />{err}
                </div>
              )}

              <button type="submit" disabled={!valid || loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-church-maroon text-white font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6E0C24] transition-colors mt-1">
                {loading ? <><Loader2 size={14} className="animate-spin" />Joining…</> : "Join this Cell"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-church-accent/50 mt-[3px] flex-shrink-0">{icon}</span>
      <p className="text-[12px] text-white/45 leading-snug">
        <span className="font-black text-white/20 tracking-[0.12em] mr-1.5">{label}:</span>
        {value}
      </p>
    </div>
  );
}

// ── Cell card — new design ────────────────────────────────────────────────────

function CellCard({ cell, index, onJoin }: { cell: Cell; index: number; onJoin: () => void }) {
  const locationLabel = cell.city && cell.city !== cell.state ? `${cell.city}, ${cell.state}` : cell.state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-church-maroon/40 transition-all duration-500"
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <img
          src={cellPhoto(index)}
          alt={cell.name}
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        {/* location badge top-left */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-church-maroon/80 backdrop-blur-sm text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
            {locationLabel}
          </span>
        </div>

        {/* day badge top-right */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-black uppercase tracking-[0.15em] text-white/70 border border-white/10">
            {cell.meetingDay}
          </span>
        </div>

        {/* name + leader overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-black text-[1.05rem] text-white leading-tight">
            {cell.name}
          </h3>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 pt-4 pb-3 space-y-2.5">
        <InfoRow icon={<Clock size={11} />}    label="TIME"    value={cell.meetingTime} />
        <InfoRow icon={<Calendar size={11} />} label="DAY"     value={cell.meetingDay} />
        <InfoRow icon={<MapPin size={11} />}   label="VENUE"   value={cell.address} />
        {cell.leaderPhone && (
          <InfoRow icon={<Phone size={11} />}  label="CONTACT" value={cell.leaderPhone} />
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-2 mt-auto">
        <button
          onClick={onJoin}
          className="flex items-center justify-center w-full py-3 rounded-2xl bg-church-maroon text-white text-[11px] font-black tracking-widest uppercase hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-church-maroon/25 transition-all duration-300 group-hover:-translate-y-0.5">
          Join Cell
        </button>
      </div>

      {/* hover ring */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl ring-1 ring-inset ring-church-maroon/20" />
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-pulse">
      <div style={{ aspectRatio: "4/5" }} className="bg-white/[0.05]" />
      <div className="p-4 space-y-2 border-t border-white/[0.05]">
        <div className="h-2 bg-white/[0.05] rounded-full w-3/5" />
      </div>
      <div className="p-4">
        <div className="h-10 bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function FindCellPage() {
  const [cells, setCells]         = useState<Cell[]>([]);
  const [states, setStates]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiErr, setApiErr]       = useState<string | null>(null);
  const [query, setQuery]         = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [visible, setVisible]     = useState(PAGE_SIZE);
  const [joining, setJoining]     = useState<Cell | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setApiErr(null);
      try {
        const [cellsRes, statesRes] = await Promise.all([
          apiClient.get<Cell[]>("/home-cell"),
          apiClient.get<string[]>("/home-cell/states"),
        ]);
        setCells(cellsRes.data);
        setStates(statesRes.data);
      } catch {
        setApiErr("Couldn't load cells. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cells.filter((c) => {
      const matchesState = stateFilter === "All" || c.state === stateFilter;
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.leaderName.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      return matchesState && matchesQuery;
    });
  }, [cells, stateFilter, query]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon selection:text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO + SEARCH + STATE FILTER
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/HeroImages/IMG_1080.jpg" alt=""
            className="w-full h-full object-cover object-center scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-b from-church-dark/90 via-church-dark/80 to-church-dark" />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] rounded-full bg-church-maroon/15 blur-[90px] z-0" />

        <div className="relative z-10 px-4 pt-28 pb-16 text-center max-w-3xl mx-auto">
          {/* Back */}
          <div className="mb-10">
            <Link href="/connect/home-cell"
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-all group">
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Home Cell</span>
            </Link>
          </div>

          {/* Chip */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-church-maroon/40 bg-church-maroon/15 backdrop-blur-sm px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-church-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-church-accent/90">Home Cell</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.4rem,8vw,5rem)] font-display font-black tracking-tighter leading-[0.9] mb-4">
            Find a Home Cell<br />
            <span className="font-serif italic font-normal text-church-accent">near you</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed mb-8">
            Search by state, city, or cell name
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="relative max-w-xl mx-auto mb-10">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(PAGE_SIZE); }}
              placeholder="Search cells, cities, states…"
              className="w-full pl-10 pr-10 py-4 rounded-2xl border border-white/[0.12] bg-white/[0.07] backdrop-blur-sm text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-church-accent/30 focus:border-church-accent/20 transition"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </motion.div>

          {/* State pills — centered wrapping */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
            className="flex flex-wrap justify-center gap-2">
            {["All", ...states].map((s) => (
              <button key={s}
                onClick={() => { setStateFilter(s); setVisible(PAGE_SIZE); }}
                className={`px-5 py-2 rounded-full text-[11px] font-black tracking-[0.08em] border transition-all duration-200 whitespace-nowrap ${
                  stateFilter === s
                    ? "bg-church-maroon border-church-maroon text-white shadow-md shadow-church-maroon/25"
                    : "border-white/[0.10] text-white/35 hover:border-white/25 hover:text-white/65 bg-white/[0.03]"
                }`}>
                {s === "All" ? "All States" : s}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          GRID
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 py-12 max-w-7xl mx-auto">

        {/* count */}
        {!loading && !apiErr && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
              {filtered.length} cell{filtered.length !== 1 ? "s" : ""}{stateFilter !== "All" ? ` · ${stateFilter}` : " · Nigeria"}
            </p>
            {query || stateFilter !== "All" ? (
              <button onClick={() => { setQuery(""); setStateFilter("All"); }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-church-accent/60 hover:text-church-accent transition-colors">
                Clear filters
              </button>
            ) : null}
          </motion.div>
        )}

        {/* skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* error */}
        {!loading && apiErr && (
          <div className="flex flex-col items-center text-center py-24 gap-5">
            <AlertCircle size={28} className="text-rose-400/40" />
            <p className="text-white/35 text-sm">{apiErr}</p>
            <button onClick={() => window.location.reload()}
              className="px-7 py-2.5 rounded-full border border-white/10 text-white/35 text-sm font-bold hover:text-white hover:border-white/25 transition-all">
              Retry
            </button>
          </div>
        )}

        {/* empty */}
        {!loading && !apiErr && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center py-24 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
              <MapPin size={20} className="text-white/15" />
            </div>
            <div>
              <p className="font-display font-black text-lg text-white/40 mb-1">No cells found</p>
              <p className="text-white/25 text-sm max-w-xs leading-relaxed">
                Try a different search or filter.
              </p>
            </div>
            <button onClick={() => { setQuery(""); setStateFilter("All"); }}
              className="px-6 py-2.5 rounded-full border border-white/10 text-white/30 text-sm font-bold hover:text-white hover:border-white/25 transition-all">
              Clear filters
            </button>
          </motion.div>
        )}

        {/* grid */}
        {!loading && !apiErr && shown.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              <AnimatePresence mode="popLayout">
                {shown.map((cell, i) => (
                  <CellCard key={cell.id} cell={cell} index={i} onJoin={() => setJoining(cell)} />
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-14">
                <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="px-10 py-3.5 rounded-full border border-white/[0.1] text-white/40 text-sm font-black tracking-wide hover:border-white/25 hover:text-white transition-all">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD A CELL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 px-6 border-t border-white/[0.06] relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-church-maroon/6 blur-[120px]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-4">Lead a Cell</p>
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05] mb-6">
              Don&rsquo;t just find one.<br />
              <span className="font-serif italic font-normal text-white/40">Start one.</span>
            </h2>
            <p className="text-white/50 text-[15px] leading-relaxed max-w-md">
              If you feel called to open your home and gather people around the Word, we want to hear from you. Adding your cell takes two minutes — our team will review it and reach out to support you.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:flex lg:justify-end">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 max-w-sm w-full">
              <button
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-church-maroon text-white text-sm font-black tracking-wide hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-church-maroon/30 transition-all">
                <Plus size={15} /> Add Your Cell
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 px-4 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05]">
              Honest answers<br />
              <span className="font-serif italic font-normal text-white/40">to honest questions.</span>
            </h2>
          </div>
          <div>
            {FAQS.map((item, i) => <FaqItem key={i} {...item} index={i} />)}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showAdd && (
          <AddCellModal key="add-cell" onClose={() => setShowAdd(false)} />
        )}
        {joining && (
          <JoinModal key="join-cell" cell={joining} onClose={() => setJoining(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
