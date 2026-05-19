import { memo, useState, useEffect, ChangeEvent, FocusEvent } from "react";
import { UseFormRegister, UseFormSetValue, FieldValues, Path, UseFormWatch } from "react-hook-form";

type Option = {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
};

type RadioSelectFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  register?: UseFormRegister<T>;
  setValue?: UseFormSetValue<T>;
  watch?: UseFormWatch<T>;
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

const RadioSelectForm = memo(
  <T extends FieldValues>({
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
    otherMinLength = 2,
    otherRequired = true,
    className = "",
  }: RadioSelectFormProps<T>) => {
    const [otherValue, setOtherValue] = useState<string>("");

    const currentValue = watch ? watch(name) : undefined;
    const isOtherSelected = currentValue === "other";

    useEffect(() => {
      if (watch && isOtherSelected) {
        const val = watch(`${name}_other_text` as any);
        if (val && val !== otherValue) {
          setOtherValue(val);
        }
      }
    }, [watch, name, isOtherSelected, otherValue]);

    const validation = {
      required: required ? `${label || String(name)} is required` : false,
      ...validationRules,
    };

    const layoutClasses = {
      vertical: "flex flex-col gap-2.5",
      horizontal: "flex flex-wrap gap-3",
      grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    };

    const handleOtherInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setOtherValue(value);

      setValue?.(`${name}_other_text` as any, value as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    const handleOtherInputFocus = () => {
      if (setValue && !isOtherSelected) {
        setValue(name, "other" as any, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    };

    const handleOtherInputBlur = (_e: FocusEvent<HTMLInputElement>) => {
      if (setValue && isOtherSelected) {
        setValue(`${name}_other_text` as any, otherValue as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    };

    useEffect(() => {
      if (register && enableOther) {
        register(`${name}_other_text` as any);
      }
    }, [register, name, enableOther]);

    const otherFieldError = error;

    return (
      <fieldset disabled={disabled} className={`mb-6 ${className}`}>
        {label && (
          <legend className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
            {label}
            {required && (
              <span className="text-red-500 ml-1.5 font-bold">*</span>
            )}
          </legend>
        )}

        {description && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}

        <div className={layoutClasses[layout]}>
          {options.map((option) => {
            const isDisabled = disabled || option.disabled;

            return (
              <label
                key={option.id}
                className="flex items-start gap-3 p-3 border rounded-xl bg-white dark:bg-gray-800"
              >
                <input
                  type="radio"
                  value={option.id}
                  {...(register ? register(name, validation) : {})}
                  disabled={isDisabled}
                  className="sr-only"
                />

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {option.name}
                  </div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}

          {enableOther && (
            <div className="border rounded-xl p-3">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  value="other"
                  {...(register ? register(name, validation) : {})}
                  disabled={disabled}
                  className="sr-only"
                />

                <span className="text-sm font-medium">{otherLabel}</span>
              </label>

              <input
                type="text"
                value={otherValue}
                onChange={handleOtherInputChange}
                onFocus={handleOtherInputFocus}
                onBlur={handleOtherInputBlur}
                disabled={disabled}
                placeholder={otherPlaceholder}
                className="w-full mt-2 px-3 py-2 border rounded-lg"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-xs mt-2" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioSelectForm.displayName = "RadioSelectForm";
export default RadioSelectForm;