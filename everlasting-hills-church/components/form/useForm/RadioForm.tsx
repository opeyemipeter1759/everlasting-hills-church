import { memo } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type Option = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type RadioFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  register?: UseFormRegister<T>;
  error?: string;
  required?: boolean;
  options?: Option[];
  validationRules?: Record<string, any>;
  disabled?: boolean;
  description?: string;
  layout?: "vertical" | "horizontal" | "grid";
};

const RadioForm = memo(
  <T extends FieldValues>({
    label,
    name,
    register,
    error,
    required = false,
    options = [],
    validationRules = {},
    disabled = false,
    description,
    layout = "vertical",
  }: RadioFormProps<T>) => {
    const validation = {
      required: required ? `${label || name} is required` : false,
      ...validationRules,
    };

    const layoutClasses = {
      vertical: "flex flex-col gap-2",
      horizontal: "flex flex-wrap gap-3",
      grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    };

    return (
      <fieldset disabled={disabled}>
        {label && (
          <legend className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
            {label}
            {required && (
              <span className="text-red-500 ml-0.5 font-bold">*</span>
            )}
          </legend>
        )}

        {description && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {description}
          </p>
        )}

        <div
          className={layoutClasses[layout]}
          role="radiogroup"
          aria-labelledby={label ? `${name}-label` : undefined}
          aria-required={required}
        >
          {options.map((option) => {
            const isDisabled = disabled || option.disabled;

            return (
              <label
                key={option.value}
                className={`
                  group relative flex items-start gap-3 py-2.5 px-3 rounded-xl
                  border transition-all duration-200 ease-out
                  ${
                    isDisabled
                      ? "cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      : "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-blue-500/50 dark:hover:border-cyan-400/50"
                  }
                  bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
                `}
              >
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="radio"
                    value={option.value}
                    {...(register ? register(name, validation) : {})}
                    disabled={isDisabled}
                    className="sr-only peer"
                    aria-describedby={error ? `${name}-error` : undefined}
                    aria-label={option.label}
                  />

                  <div className="w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 peer-checked:border-blue-500 peer-checked:bg-blue-500" />

                  <div className="absolute inset-0 rounded-full peer-focus:animate-ping pointer-events-none" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-200">
                    {option.label}
                  </div>

                  {option.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
            id={`${name}-error`}
            className="text-red-500 text-xs mt-2 animate-slide-down"
            role="alert"
          >
            {error}
          </p>
        )}

        <style>{`
          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
        `}</style>
      </fieldset>
    );
  }
);

RadioForm.displayName = "RadioForm";
export default RadioForm;