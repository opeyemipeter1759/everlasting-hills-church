import { useState } from "react";

type SwitchProps = {
  label?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
  checked?: boolean;
};

const Switch = ({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
  checked,
}: SwitchProps) => {
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);

  const isControlled = typeof checked === "boolean";
  const isChecked = isControlled ? (checked as boolean) : internalChecked;

  const handleToggle = () => {
    if (disabled) return;

    const newCheckedState = !isChecked;

    if (!isControlled) {
      setInternalChecked(newCheckedState);
    }

    onChange?.(newCheckedState);
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500"
            : "bg-gray-200 dark:bg-gray-700/50",
          track: isChecked
            ? "shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]"
            : "shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]",
          knob: isChecked
            ? "bg-white shadow-[0_2px_8px_rgba(99,102,241,0.4),0_0_0_1px_rgba(255,255,255,0.1)] dark:shadow-[0_2px_12px_rgba(99,102,241,0.6)]"
            : "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]",
          glow: isChecked
            ? "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-blue-400 before:to-indigo-500 before:opacity-20 before:blur-md"
            : "",
        }
      : {
          background: isChecked
            ? "bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100"
            : "bg-gray-200 dark:bg-gray-700/50",
          track: isChecked
            ? "shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]"
            : "shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]",
          knob: isChecked
            ? "bg-white dark:bg-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)]"
            : "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]",
          glow: isChecked
            ? "before:absolute before:inset-0 before:rounded-full before:bg-gray-400 before:opacity-10 before:blur-md dark:before:bg-gray-300"
            : "",
        };

  return (
    <label
      className={`flex flex-col cursor-pointer select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {label && (
        <span
          className={`text-sm font-semibold tracking-tight transition-all duration-200 ${
            disabled
              ? "text-gray-400 dark:text-gray-400"
              : "text-gray-600 dark:text-gray-100"
          }`}
        >
          {label}
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`group relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/30 ${
          disabled ? "cursor-not-allowed" : "hover:scale-105 active:scale-95"
        } ${switchColors.background} ${switchColors.track} ${
          switchColors.glow
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full ring-0 transition-all duration-300 ease-out ${
            isChecked ? "translate-x-6 rotate-180" : "translate-x-1 rotate-0"
          } ${switchColors.knob} ${
            isChecked ? "mt-1 scale-110" : "mt-1 scale-100"
          } ${disabled ? "" : "group-hover:scale-110 group-active:scale-95"}`}
        >
          <span
            className={`absolute inset-0 m-auto h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              isChecked
                ? "bg-gradient-to-br from-blue-400 to-indigo-600 opacity-60 blur-[2px]"
                : "bg-gray-300 opacity-0"
            }`}
          />
        </span>
      </button>
    </label>
  );
};

export default Switch;