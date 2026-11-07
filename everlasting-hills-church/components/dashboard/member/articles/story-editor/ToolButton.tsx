export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-current px-1 font-sans text-[10px] font-medium leading-4 opacity-80">{children}</kbd>;
}

/** An icon button for the toolbar (light) or the selection menu (dark), with a tooltip. */
export function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  tone = "light",
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const colours =
    tone === "dark"
      ? active
        ? "bg-white/15 text-white"
        : "text-white/75 hover:bg-white/10 hover:text-white"
      : active
        ? "bg-[var(--m-brand-soft)] text-[var(--m-brand)]"
        : "text-[var(--m-gray)] hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]";
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        aria-keyshortcuts={shortcut?.replace("⌘", "Meta").replace("Ctrl", "Control")}
        disabled={disabled}
        // Keep the selection in the editor when the button is pressed.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--m-brand)] disabled:pointer-events-none disabled:opacity-30 ${colours}`}
      >
        {children}
      </button>
      {tone === "light" && (
        <span
          role="presentation"
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--m-black)] px-2 py-1 font-sans text-[11px] font-medium text-[var(--m-on-black)] shadow-lg group-hover:flex"
        >
          {label}
          {shortcut && <Kbd>{shortcut}</Kbd>}
        </span>
      )}
    </span>
  );
}

export function Separator({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <span aria-hidden="true" className={`mx-1 h-5 w-px shrink-0 ${tone === "dark" ? "bg-white/20" : "bg-[var(--m-line)]"}`} />;
}
