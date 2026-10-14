"use client";

const STEP_LABELS = ["Your details", "Your need", "Review"];

export default function WelfareProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const isDone = n < step;
          const isActive = n === step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                    isDone
                      ? "bg-[#87102C] text-white"
                      : isActive
                        ? "bg-[#87102C] text-white"
                        : "bg-[#F5E6E9] text-[#87102C]/50"
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`hidden text-xs font-semibold sm:inline ${
                    isActive || isDone ? "text-[#2B1114]" : "text-[#8a7e80]"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span className="h-px flex-1 bg-[#F0DDE1]" aria-hidden="true">
                  <span
                    className="block h-px bg-[#87102C] transition-all duration-500 ease-out"
                    style={{ width: isDone ? "100%" : "0%" }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#87102C]/70 sm:hidden">
        Step {step} of 3: {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}
