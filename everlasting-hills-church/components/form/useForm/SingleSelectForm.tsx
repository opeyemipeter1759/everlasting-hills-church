import { useState, memo, useEffect, useRef } from "react";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type Option = {
  value: string;
  text: string;
};

type SingleSelectFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  options?: Option[];
  register: UseFormRegister<T>;
  setValue?: (name: Path<T>, value: any, options?: any) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  maxHeight?: string;
  expandParent?: boolean;
  defaultValue?: string;
};

const SingleSelectForm = memo(
  <T extends FieldValues>({
    label,
    name,
    options = [],
    register,
    setValue,
    error,
    placeholder = "Select an option",
    required = false,
    disabled = false,
    searchable = true,
    maxHeight = "16rem",
    expandParent = false,
    defaultValue = "",
  }: SingleSelectFormProps<T>) => {
    const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownHeight, setDropdownHeight] = useState(0);

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const dropdownContentRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Register with RHF
    useEffect(() => {
      if (register && name) {
        register(name, {
          required: required ? `${label || "This field"} is required` : false,
        });
      }
    }, [register, name, required, label]);

    // Sync value to RHF
    useEffect(() => {
      if (setValue && name) {
        setValue(name, selectedValue);
      }
    }, [selectedValue, setValue, name]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Focus search
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Measure height
    useEffect(() => {
      if (expandParent) {
        if (isOpen && dropdownContentRef.current) {
          setDropdownHeight(dropdownContentRef.current.offsetHeight);
        } else {
          setDropdownHeight(0);
        }
      }
    }, [isOpen, searchQuery, options, expandParent]);

    const toggleDropdown = () => {
      if (!disabled) setIsOpen((p) => !p);
    };

    const handleSelect = (value: string) => {
      setSelectedValue(value);
      setIsOpen(false);
      setSearchQuery("");
    };

    const clearSelection = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedValue("");
    };

    const selectedOption = options.find(
      (opt) => opt.value === selectedValue
    );
    const selectedText = selectedOption?.text || "";

    const filteredOptions =
      searchable && searchQuery
        ? options.filter((opt) =>
            opt.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    return (
      <div
        ref={containerRef}
        className="w-full transition-all duration-300 ease-in-out"
        style={{
          paddingBottom:
            expandParent && isOpen ? `${dropdownHeight + 8}px` : "0px",
        }}
      >
        <div ref={dropdownRef}>
          {label && (
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {label}
              {required && (
                <span className="text-red-500 ml-0.5">*</span>
              )}
            </label>
          )}

          <div className="relative w-full flex items-center gap-2">
            <button
              type="button"
              id={name}
              onClick={toggleDropdown}
              disabled={disabled}
              className={`
                flex-1 flex items-center justify-between rounded-lg px-4 py-2.5 text-left
                bg-white dark:bg-gray-800 border
                ${
                  error
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={
                  selectedText
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                {selectedText || placeholder}
              </span>

              <svg
                className={`w-5 h-5 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            {selectedValue && !disabled && (
              <button
                type="button"
                onClick={clearSelection}
                className="w-10 h-[2.75rem] border rounded-lg"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div
              ref={dropdownContentRef}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow"
              style={{ maxHeight }}
            >
              {searchable && (
                <div className="p-2 border-b">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}

              <div className="overflow-y-auto">
                {filteredOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isSelected ? "bg-blue-100" : ""
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}

                {filteredOptions.length === 0 && (
                  <div className="p-4 text-center text-gray-400">
                    No options found
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

SingleSelectForm.displayName = "SingleSelectForm";
export default SingleSelectForm;