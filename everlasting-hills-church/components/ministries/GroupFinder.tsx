"use client";

import { useState } from "react";
import { Crown, Heart, Zap, Users, MessageCircle, RotateCcw, ChevronRight } from "lucide-react";

// ── Replace with real WhatsApp group invite links ─────────────────────────
const WHATSAPP_LINKS = {
  men:     "https://chat.whatsapp.com/REPLACE_MEN_LINK",
  women:   "https://chat.whatsapp.com/REPLACE_WOMEN_LINK",
  teens:   "https://chat.whatsapp.com/REPLACE_TEENS_LINK",
  couples: "https://chat.whatsapp.com/REPLACE_COUPLES_LINK",
};

type Group = keyof typeof WHATSAPP_LINKS;
type Step  = "age" | "gender" | "married" | "result";

const GROUP_META: Record<Group, { name: string; icon: typeof Crown; tag: string }> = {
  men:     { name: "Men's Ministry",    icon: Crown, tag: "For Men"          },
  women:   { name: "Women's Ministry",  icon: Heart, tag: "For Women"        },
  teens:   { name: "Teen's Ministry",   icon: Zap,   tag: "Ages 13 – 19"    },
  couples: { name: "Couple's Ministry", icon: Users, tag: "Married Couples"  },
};

const STEPS: Step[] = ["age", "gender", "married"];

function derive(age: "teen" | "adult", gender: "male" | "female" | null, married: "yes" | "no" | null): Group[] {
  if (age === "teen") return ["teens"];
  if (married === "yes") return gender === "male" ? ["men", "couples"] : ["women", "couples"];
  return gender === "male" ? ["men"] : ["women"];
}

export default function GroupFinder() {
  const [step,    setStep]    = useState<Step>("age");
  const [age,     setAge]     = useState<"teen" | "adult" | null>(null);
  const [gender,  setGender]  = useState<"male" | "female" | null>(null);
  const [married, setMarried] = useState<"yes" | "no" | null>(null);

  const groups: Group[] =
    age === "teen" ? ["teens"] :
    age && gender && married ? derive(age, gender, married) : [];

  function reset() {
    setStep("age"); setAge(null); setGender(null); setMarried(null);
  }

  const currentStepIndex = STEPS.indexOf(step);

  return (
    /* glassmorphic container — for use on dark backgrounds */
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-10">

      {/* header */}
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40 mb-1">
        Find Your Group
      </p>
      <h3 className="text-xl font-bold tracking-tight text-white mb-8 text-balance">
        Which WhatsApp group should I join?
      </h3>

      {/* progress indicator */}
      {step !== "result" && (
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < currentStepIndex
                  ? "w-6 bg-[#87102C]"
                  : i === currentStepIndex
                    ? "w-8 bg-[#FFB3C1]"
                    : "w-4 bg-white/15"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Age ── */}
      {step === "age" && (
        <Question label="How old are you?">
          <Choice onClick={() => { setAge("teen"); setStep("result"); }}>
            13 – 19 years old
          </Choice>
          <Choice onClick={() => { setAge("adult"); setStep("gender"); }}>
            20 and above
          </Choice>
        </Question>
      )}

      {/* ── Gender ── */}
      {step === "gender" && (
        <Question label="What is your gender?">
          <Choice onClick={() => { setGender("male");   setStep("married"); }}>Male</Choice>
          <Choice onClick={() => { setGender("female"); setStep("married"); }}>Female</Choice>
        </Question>
      )}

      {/* ── Married ── */}
      {step === "married" && (
        <Question label="Are you married?">
          <Choice onClick={() => { setMarried("yes"); setStep("result"); }}>Yes, I am married</Choice>
          <Choice onClick={() => { setMarried("no");  setStep("result"); }}>No, not yet</Choice>
        </Question>
      )}

      {/* ── Result ── */}
      {step === "result" && groups.length > 0 && (
        <div>
          <p className="text-sm text-white/45 mb-5">
            {groups.length > 1 ? "You belong to both of these groups:" : "Your group is:"}
          </p>

          <div className="space-y-4">
            {groups.map((g) => {
              const { name, icon: Icon, tag } = GROUP_META[g];
              return (
                <div key={g} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#87102C]/30 text-[#FFB3C1]">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-bold text-white leading-tight">{name}</p>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-white/35 mt-0.5">{tag}</p>
                    </div>
                  </div>
                  <a
                    href={WHATSAPP_LINKS[g]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center gap-2 rounded-full bg-[#87102C] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/30"
                  >
                    <MessageCircle size={14} />
                    Join on WhatsApp
                    <ChevronRight size={14} className="opacity-70 group-hover/btn:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              );
            })}
          </div>

          <button
            onClick={reset}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-white/25 transition-colors hover:text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C] rounded"
          >
            <RotateCcw size={11} />
            Start over
          </button>
        </div>
      )}
    </div>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold text-white/75 mb-5">{label}</p>
      {children}
    </div>
  );
}

function Choice({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-sm font-medium text-white/60 transition-all duration-200 hover:border-[#87102C]/60 hover:bg-[#87102C]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]"
    >
      {children}
      <ChevronRight
        size={15}
        className="shrink-0 opacity-25 transition-all group-hover:opacity-75 group-hover:translate-x-0.5"
      />
    </button>
  );
}
