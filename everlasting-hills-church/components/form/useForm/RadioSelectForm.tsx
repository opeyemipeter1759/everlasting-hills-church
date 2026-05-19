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
    vertical: "flex flex-col gap-2.5",
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
        <legend className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>
      )}

      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <div className={layoutClasses[layout]}>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 p-3 border rounded-xl bg-white dark:bg-gray-800 cursor-pointer"
          >
            <input
              type="radio"
              value={option.id}
              {...register(name, validation)}
              onChange={handleChange}
              disabled={disabled || option.disabled}
              className="sr-only"
            />

            <div>
              <div className="text-sm font-medium">{option.name}</div>
              {option.description && (
                <div className="text-xs text-gray-500">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}

        {enableOther && (
          <div className="border rounded-xl p-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="other"
                {...register(name, validation)}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="text-sm font-medium">{otherLabel}</span>
            </label>

            {isOtherSelected && (
              <input
                type="text"
                value={otherValue}
                onChange={handleOtherChange}
                placeholder={otherPlaceholder}
                className="w-full mt-2 px-3 py-2 border rounded-lg"
              />
            )}
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
};

const RadioSelectForm = memo(
  RadioSelectFormComponent
) as typeof RadioSelectFormComponent;

export default RadioSelectForm;