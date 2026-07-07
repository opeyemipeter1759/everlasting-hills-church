import { Check } from "lucide-react";

interface RegisterButtonProps {
  onClick: () => void;
  registering: boolean;
  registered: boolean;
}

export default function RegisterButton({ onClick, registering, registered }: RegisterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={registering || registered}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed ${
        registered
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 disabled:opacity-100"
          : "bg-[#87102C] text-white hover:bg-[#6E0C24] hover:shadow-md hover:shadow-[#87102C]/25 disabled:opacity-70"
      }`}
    >
      {registering ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Registering…
        </>
      ) : registered ? (
        <>
          <Check size={14} />
          Registered
        </>
      ) : (
        "Register Now"
      )}
    </button>
  );
}
