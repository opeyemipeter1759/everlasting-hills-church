"use client";

type Props = {
  bank: string;
  currency?: string;
  size?: number;
};

export default function BankLogo({ bank, currency, size = 40 }: Props) {
  const initials = bank
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const flag = currency === "USD" ? "🇺🇸" : currency === "NGN" ? "🇳🇬" : "🏳️";

  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className="flex items-center justify-center rounded-full bg-white/6 text-sm font-bold text-white"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: Math.max(12, size / 2.8) }}>{flag}</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">{bank}</div>
        <div className="text-xs text-white/60">{initials}</div>
      </div>
    </div>
  );
}
