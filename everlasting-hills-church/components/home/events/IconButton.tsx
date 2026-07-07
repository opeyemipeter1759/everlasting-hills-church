export default function IconButton({
  children,
  onClick,
  title,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#E7CDD3] text-[#87102C] transition-colors hover:bg-[#FFF4F6] ${className}`}
    >
      {children}
    </button>
  );
}
