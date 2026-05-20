import { memo, useState, useEffect, ChangeEvent, FocusEvent } from "react";
import {
  UseFormRegister,
  UseFormSetValue,
  FieldValues,
  Path,
  UseFormWatch,
} from "react-hook-form";

type Option = {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
};

type RadioSelectFormProps<T extends FieldValues> = {
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
  error?: string;
  required?: boolean;
  options?: Option[];
  validationRules?: Record<string, any>;
  disabled?: boolean;
  description?: string;
  layout?: "vertical" | "horizontal" | "grid";
  enableOther?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
  otherMinLength?: number;
  otherRequired?: boolean;
  className?: string;
};

const RadioSelectFormComponent = <T extends FieldValues,>({
  label,
  name,
  register,
  setValue,
  watch,
  error,
  required = false,
  options = [],
  validationRules = {},
  disabled = false,
  description,
  layout = "vertical",
  enableOther = false,
  otherLabel = "Other",
  otherPlaceholder = "Please specify",
  className = "",
}: RadioSelectFormProps<T>) => {
  const [otherValue, setOtherValue] = useState("");

  const currentValue = watch(name);
  const isOtherSelected = currentValue === "other";

  const validation = {
    required: required ? `${label || String(name)} is required` : false,
    ...validationRules,
  };

  const layoutClasses = {
    vertical: "flex flex-col gap-3",
    horizontal: "flex flex-wrap gap-3",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(name, value as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleOtherChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherValue(value);

    setValue(`${String(name)}_other_text` as any, value as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    if (enableOther) {
      register(`${String(name)}_other_text` as any);
    }
  }, [register, name, enableOther]);

  return (
    <fieldset disabled={disabled} className={className}>
      {label && (
        <legend className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
      )}

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      )}

      <div className={layoutClasses[layout]}>
        {options.map((option) => {
          const isSelected = currentValue === option.id;
          return (
            <label
              key={option.id}
              className={`
                flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer
                transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                }
              `}
            >
              <input
                type="radio"
                value={option.id}
                {...register(name, validation)}
                onChange={handleChange}
                disabled={disabled || option.disabled}
                className="sr-only peer"
              />

              <div className="relative mt-1 flex-shrink-0">
                <div className={`
                  w-5 h-5 rounded-full border-2 transition-all duration-200
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-500 shadow-md"
                      : "border-gray-300 dark:border-gray-600"
                  }
                `} />
                {isSelected && (
                  <div className="absolute inset-0 rounded-full bg-white dark:bg-white opacity-100 m-1" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <div className={`text-sm font-semibold transition-colors ${
                  isSelected
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-800 dark:text-gray-200"
                }`}>
                  {option.name}
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

        {enableOther && (
          <label className={`
            flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer
            transition-all duration-200
            ${
              isOtherSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            }
          `}>
            <input
              type="radio"
              value="other"
              {...register(name, validation)}
              onChange={handleChange}
              className="sr-only peer"
            />

            <div className="relative mt-1 flex-shrink-0">
              <div className={`
                w-5 h-5 rounded-full border-2 transition-all duration-200
                ${
                  isOtherSelected
                    ? "border-blue-500 bg-blue-500 shadow-md"
                    : "border-gray-300 dark:border-gray-600"
                }
              `} />
              {isOtherSelected && (
                <div className="absolute inset-0 rounded-full bg-white dark:bg-white opacity-100 m-1" />
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <div className={`text-sm font-semibold transition-colors ${
                isOtherSelected
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-800 dark:text-gray-200"
              }`}>
                {otherLabel}
              </div>
            </div>
          </label>
        )}
      </div>

      {isOtherSelected && enableOther && (
        <div className="mt-4 animate-in fade-in">
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherChange}
            placeholder={otherPlaceholder}
            className={`
              w-full px-4 py-3 rounded-xl border-2 font-medium
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-200/50 dark:focus:ring-blue-900/50
            `}
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-3 flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18.101 12.93l-.9-1.572A6.986 6.986 0 0018 10a7 7 0 10-14 0c0 .113.011.226.027.338l-.9 1.572A.75.75 0 003.75 15h12.5a.75.75 0 00.851-.07zM12 13a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  );
};

const RadioSelectForm = memo(
  RadioSelectFormComponent
) as typeof RadioSelectFormComponent;

export default RadioSelectForm;