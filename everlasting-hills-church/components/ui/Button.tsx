"use client";
import { LoadingIcon2 } from "@/components/icons";
import {
  useState,
  useRef,
  ReactNode,
  MouseEvent,
  ButtonHTMLAttributes,
} from "react";
import Link from "next/link";

type ButtonVariant =
  | "primary"
  | "outline-primary"
  | "danger"
  | "outline-danger"
  | "light"
  | "outline-light"
  | "dark"
  | "outline-dark"
  | "ghost"
  | "neutral";

type Ripple = {
  x: number;
  y: number;
  size: number;
  id: number;
};

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  href?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

const Button = ({
  children,
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  href,
  title,
  className = "",
  disabled = false,
  type = "button",
  loading = false,
  target = "_self",
  rel = "",
}: ButtonProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLElement | null>(null);

  const createRipple = (event: MouseEvent<HTMLElement>) => {
    if (disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;

    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) =>
        prev.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, 600);

    onClick?.(event);
  };

  const baseClasses =
    "h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-5 gap-2 relative overflow-hidden";

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-[#119bd6] via-[#0d8ac0] to-[#0a7eb3] text-white rounded-lg shadow-md font-semibold hover:shadow-xl hover:brightness-110 active:brightness-95 active:scale-[0.97] transition-all duration-200 ease-out",

    "outline-primary":
      "bg-transparent border-2 border-[#119bd6] text-[#119bd6] rounded-lg font-semibold hover:bg-[#119bd6]/10 hover:border-[#0d8ac0] hover:shadow-md active:scale-[0.97] active:bg-[#119bd6]/20 transition-all duration-200 ease-out",

    danger:
      "bg-gradient-to-r from-[#eb2225] via-[#d41e21] to-[#c11a1d] text-white rounded-lg shadow-md font-semibold hover:shadow-xl hover:brightness-110 active:brightness-95 active:scale-[0.97] transition-all duration-200 ease-out",

    "outline-danger":
      "bg-transparent border-2 border-[#eb2225] text-[#eb2225] rounded-lg font-semibold hover:bg-[#eb2225]/10 hover:border-[#d41e21] hover:shadow-md active:scale-[0.97] active:bg-[#eb2225]/20 transition-all duration-200 ease-out",

    light:
      "bg-white text-gray-700 rounded-lg shadow-md border border-gray-200 font-semibold hover:shadow-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] active:bg-gray-100 transition-all duration-200 ease-out dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",

    "outline-light":
      "bg-transparent border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-100 hover:border-gray-400 hover:shadow-md active:scale-[0.97] active:bg-gray-200 transition-all duration-200 ease-out dark:border-gray-600 dark:text-gray-300",

    dark:
      "bg-gradient-to-r from-[#101828] via-[#1a2235] to-[#0f1624] text-white rounded-lg shadow-md font-semibold hover:shadow-xl hover:brightness-125 active:brightness-100 active:scale-[0.97] transition-all duration-200 ease-out",

    "outline-dark":
      "bg-transparent border-2 border-gray-600 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 hover:border-gray-700 hover:shadow-md active:scale-[0.97] active:bg-gray-200 transition-all duration-200 ease-out dark:border-gray-500 dark:text-gray-300",

    ghost:
      "bg-gray-200/90 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 hover:shadow-md active:scale-[0.97] active:bg-gray-400/80 transition-all duration-200 ease-out dark:bg-gray-700/90 dark:text-gray-200",

    neutral:
      "bg-gray-200/90 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 hover:shadow-md active:scale-[0.97] active:bg-gray-400/80 transition-all duration-200 ease-out dark:bg-gray-700/90 dark:text-gray-200",
  };

  const disabledClasses =
    disabled || loading
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer";

  const focusClasses =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#119bd6] dark:focus-visible:ring-offset-gray-900";

  const combinedClasses = `
    inline-flex items-center justify-center
    ${
      variant !== "neutral"
        ? baseClasses
        : "text-xs p-2 gap-1 relative overflow-hidden"
    }
    ${variantClasses[variant]}
    ${disabledClasses}
    ${focusClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const renderStartIcon = () => {
    if (loading) return <LoadingIcon2 />;
    if (startIcon) {
      return (
        <span className="flex items-center shrink-0">
          {startIcon}
        </span>
      );
    }
    return null;
  };

  const renderEndIcon = () => {
    if (endIcon && !loading) {
      return (
        <span className="flex items-center shrink-0">
          {endIcon}
        </span>
      );
    }
    return null;
  };

  const RippleEffect = () => (
    <>
      {ripples.map((ripple) => (
        <span
          data-testid="ripple"
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            transform: "scale(0)",
            animation: "ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      ))}

      <style>{`
        @keyframes ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );

  const ButtonContent = () => (
    <>
      {renderStartIcon()}

      {!loading && (
        <span className="truncate flex items-center gap-1 font-semibold">
          {children}
        </span>
      )}

      {renderEndIcon()}
      <RippleEffect />
    </>
  );

  if (href && !disabled && !loading) {
    const isExternal =
      href.startsWith("http") || href.startsWith("//");

    const finalRel =
      rel ||
      (target === "_blank"
        ? "noopener noreferrer"
        : "");

    return isExternal ? (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={finalRel}
        title={title}
        className={`group ${combinedClasses}`}
        onClick={createRipple}
      >
        <ButtonContent />
      </a>
    ) : (
      <Link
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={finalRel}
        title={title}
        className={`group ${combinedClasses}`}
        onClick={createRipple}
      >
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      title={title}
      type={type}
      className={`group ${combinedClasses}`}
      onClick={createRipple}
      disabled={disabled || loading}
    >
      <ButtonContent />
    </button>
  );
};

export default Button;