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
      vertical: "flex flex-col gap-2",
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
          <legend className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
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
                  flex items-start gap-3 py-2.5 px-3 rounded-xl border
                  transition-all duration-200
                  bg-white dark:bg-gray-800
                  border-gray-200 dark:border-gray-700
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:shadow-md hover:border-blue-500/50"
                  }
                `}
              >
                <input
                  type="radio"
                  {...register(name, validation)}
                  disabled={isDisabled}
                  className="sr-only peer"
                  aria-invalid={!!error}
                  aria-describedby={error ? `${String(name)}-error` : undefined}
                />

                {/* radio UI */}
                <div className="relative mt-0.5">
                  <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 peer-checked:bg-blue-500 peer-checked:border-blue-500" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
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
            className="text-red-500 text-xs mt-2"
            role="alert"
          >
            {error}
          </p>
        )}
      </fieldset>
    );
  }

RadioForm.displayName = "RadioForm";

export default RadioForm;