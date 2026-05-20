import { memo } from "react";
import { UseFormRegister, FieldValues, Path, RegisterOptions } from "react-hook-form";

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
          <legend className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </legend>
        )}

        {description && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}

        <div className={layoutClasses[layout]} role="radiogroup">
          {options.map((option) => {
            const isDisabled = disabled || option.disabled;

            return (
              <label
                key={String(option.value)}
                className={`
                  flex items-start gap-3 py-3.5 px-4 rounded-xl border-2 
                  transition-all duration-200 cursor-pointer
                  bg-white dark:bg-gray-800
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-98"
                  }
                `}
              >
                <input
                  type="radio"
                  value={String(option.value)}
                  {...register(name, validation)}
                  disabled={isDisabled}
                  className="sr-only peer"
                  aria-invalid={!!error}
                  aria-describedby={error ? `${String(name)}-error` : undefined}
                />

                {/* radio UI */}
                <div className="relative mt-1 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:shadow-md transition-all duration-200" />
                  {/* Inner dot for checked state */}
                  <div className="absolute inset-0 rounded-full bg-white dark:bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 m-1" />
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 transition-colors">
                    {option.label}
                  </div>

                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <p
            id={`${String(name)}-error`}
            className="text-red-600 dark:text-red-400 text-sm mt-3 flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18.101 12.93l-.9-1.572A6.986 6.986 0 0018 10a7 7 0 10-14 0c0 .113.011.226.027.338l-.9 1.572A.75.75 0 003.75 15h12.5a.75.75 0 00.851-.07zM12 13a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </fieldset>
    );
  }

RadioForm.displayName = "RadioForm";

export default RadioForm;