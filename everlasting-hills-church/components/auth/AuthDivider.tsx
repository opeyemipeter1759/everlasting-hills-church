export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center mb-3">
      <span className="block w-6 h-px bg-[#87102C]/30" />
      <span className="px-3 text-[10px] tracking-[0.3em] uppercase text-[#87102C] font-bold">
        {label}
      </span>
      <span className="block w-6 h-px bg-[#87102C]/30" />
    </div>
  );
}
