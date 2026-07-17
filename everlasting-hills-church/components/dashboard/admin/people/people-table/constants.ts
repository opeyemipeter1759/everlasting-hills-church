// Sticky-left column geometry (must stay in sync across header + body).
export const COL = {
  check: { left: 0, width: 48 },
  id: { left: 48, width: 104 },
  name: { left: 152, width: 240 },
};

export const TH =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 whitespace-nowrap bg-[#FFF4F6] dark:bg-[#1a1014] border-b border-[#E7CDD3]/60 dark:border-white/10";
export const TD = "px-4 py-3 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]";

// Solid background so scrolling content passes *under* the frozen columns.
export function stickyBg(isSel: boolean) {
  return isSel
    ? "bg-[#FFF4F6] dark:bg-[#1d1116]"
    : "bg-white dark:bg-[#140b10] group-hover:bg-[#fdeef1] dark:group-hover:bg-[#170e12]";
}
