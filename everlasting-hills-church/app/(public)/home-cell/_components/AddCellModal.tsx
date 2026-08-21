"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, AlertCircle } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  email: "",
  whyRegister: "",
  submittedToPastor: "" as "yes" | "no" | "",
  homeAddress: "",
  capacity: "",
  phone: "",
};

function FormField({ label, required, input }: { label: string; required?: boolean; input: React.ReactElement }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1.5">
        {label}{required && <span className="text-church-accent ml-0.5">*</span>}
      </label>
      <div className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white bg-white/[0.03] focus-within:border-church-accent/40 focus-within:bg-white/[0.05] transition-all [&_input]:w-full [&_input]:bg-transparent [&_input]:outline-none [&_input]:placeholder:text-white/20 [&_textarea]:w-full [&_textarea]:bg-transparent [&_textarea]:outline-none [&_textarea]:placeholder:text-white/20 [&_textarea]:resize-none">
        {input}
      </div>
    </div>
  );
}

export default function AddCellModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function field(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const valid =
    form.name.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length > 5 &&
    form.submittedToPastor !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/home-cell-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          whyRegister: form.whyRegister.trim(),
          submittedToPastor: form.submittedToPastor,
          homeAddress: form.homeAddress.trim(),
          capacity: form.capacity.trim(),
          phone: form.phone.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full sm:max-w-lg bg-[#12040c] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        <div className="sm:hidden w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-1 flex-shrink-0" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-church-accent mb-0.5">Home Cell</p>
            <h3 className="text-white font-black text-lg leading-tight">Register Your Cell</h3>
            <p className="text-white/35 text-xs mt-0.5">A confirmation will be sent to your email.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={26} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-black text-xl mb-2">Registration Received</h4>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                  Thank you, <span className="text-white/60 font-semibold">{form.name}</span>. We&apos;ve sent a confirmation to{" "}
                  <span className="text-white/60 font-semibold">{form.email}</span>. Our pastoral team will reach out to you shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 rounded-full bg-church-maroon text-white text-sm font-black hover:bg-[#6E0C24] transition-colors"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <FormField
                label="Full Name"
                required
                input={
                  <input
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                }
              />
              <FormField
                label="Email Address"
                required
                input={
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => field("email", e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                }
              />
              <FormField
                label="Phone Number"
                required
                input={
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    placeholder="+234 801 234 5678"
                    required
                  />
                }
              />
              <FormField
                label="Why did you decide to register your home for Home Cell?"
                input={
                  <textarea
                    value={form.whyRegister}
                    onChange={(e) => field("whyRegister", e.target.value)}
                    placeholder="Share your heart and vision for this cell…"
                    rows={3}
                  />
                }
              />

              {/* Are you submitted to Pastor Opeyemi Peter */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-2">
                  Are you submitted to Pastor Opeyemi Peter?<span className="text-church-accent ml-0.5">*</span>
                </p>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => field("submittedToPastor", opt)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                        form.submittedToPastor === opt
                          ? "bg-church-maroon border-church-maroon text-white"
                          : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                      }`}
                    >
                      {opt === "yes" ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                label="Home Address"
                input={
                  <input
                    value={form.homeAddress}
                    onChange={(e) => field("homeAddress", e.target.value)}
                    placeholder="14 University Road, Bodija, Ibadan"
                  />
                }
              />
              <FormField
                label="Capacity of the Home"
                input={
                  <input
                    value={form.capacity}
                    onChange={(e) => field("capacity", e.target.value)}
                    placeholder="e.g. 15 people"
                  />
                }
              />

              {err && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle size={13} />
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={!valid || loading}
                className="w-full py-3.5 rounded-2xl bg-church-maroon text-white font-black text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6E0C24] transition-all mt-2"
              >
                {loading ? "Submitting…" : "Register Your Cell"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
