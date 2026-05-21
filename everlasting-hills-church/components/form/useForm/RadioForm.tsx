import { memo } from "react";
import {
  UseFormRegister,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";

type Option = {
  value: string | boolean;
  label: string;
  description?: string;
  disabled?: boolean;
};

type RadioFormProps<T extends FieldValues> = {
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
  options: Option[];
  validationRules?: RegisterOptions<T, Path<T>>;
  disabled?: boolean;
  description?: string;
  layout?: "vertical" | "horizontal" | "grid";
};

const RadioForm = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  required = false,
  options,
  validationRules,
  disabled = false,
  description,
  layout = "vertical",
}: RadioFormProps<T>) => {
  const layoutClasses = {
    vertical: "flex flex-col gap-3",
    horizontal: "flex flex-wrap gap-3",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  };

  const validation: RegisterOptions<T, Path<T>> = {
    ...(required && {
      required: `${label || String(name)} is required`,
    }),
    ...validationRules,
  };

  return (
    <fieldset disabled={disabled}>
      {label && (
        <legend className="block mb-3 text-[15px] font-semibold text-black">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
      )}

      {description && (
        <p className="text-sm text-black mb-4">{description}</p>
      )}

      <div className={layoutClasses[layout]} role="radiogroup">
        {options.map((option) => {
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={String(option.value)}
              className={`
                relative flex items-start gap-3 px-5 py-4 rounded-2xl
                bg-[#EEF2FA]
                transition-all duration-200
                ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:opacity-90"
                }
              `}
            >
              <input
                type="radio"
                value={String(option.value)}
                {...register(name, validation)}
                disabled={isDisabled}
                className="peer sr-only"
                aria-invalid={!!error}
                aria-describedby={error ? `${String(name)}-error` : undefined}
              />

              {/* Radio UI */}
              <div className="mt-1 flex-shrink-0 relative">
                <div
                  className="
                    w-5 h-5 rounded-full
                    border-2 border-[#98A2B3]
                    peer-checked:border-[#800020]
                    transition-all duration-200
                  "
                />

                <div
                  className="
                    absolute top-1/2 left-1/2
                    w-2.5 h-2.5 rounded-full
                    bg-[#800020]
                    -translate-x-1/2 -translate-y-1/2
                    opacity-0 peer-checked:opacity-100
                    transition-all duration-200
                  "
                />
              </div>

              <div className="flex-1">
                <p className="text-[15px] font-semibold text-black">
                  {option.label}
                </p>

                {option.description && (
                  <p className="text-sm text-black/70 mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={`${String(name)}-error`}
          className="mt-3 text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18.101 12.93l-.9-1.572A6.986 6.986 0 0018 10a7 7 0 10-14 0c0 .113.011.226.027.338l-.9 1.572A.75.75 0 003.75 15h12.5a.75.75 0 00.851-.07zM12 13a1 1 0 11-2 0 1 1 0 012 0z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  );
};

RadioForm.displayName = "RadioForm";

export default memo(RadioForm);