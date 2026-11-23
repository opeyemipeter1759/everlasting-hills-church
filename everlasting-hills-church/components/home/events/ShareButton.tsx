/** Small white square button on the event banner (share link, WhatsApp, invite). */
export default function ShareButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E7E2E4] bg-white text-[#555] shadow-sm outline-none transition-colors hover:border-[#87102C]/30 hover:text-[#87102C] focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
    >
      {children}
    </button>
  );
}
