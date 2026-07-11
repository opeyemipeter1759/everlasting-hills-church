interface LoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const SIZE_MAP: Record<NonNullable<LoaderProps["size"]>, string> = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

/** Spinner that inherits the surrounding text color — drop it into a button or next to text. */
export default function Loader({ size = "sm", className = "", label }: LoaderProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className={`inline-block rounded-full border-current/25 border-t-current animate-spin ${SIZE_MAP[size]}`}
      />
      {label ? (
        <span className="text-sm text-gray-500 dark:text-white/50">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  );
}
