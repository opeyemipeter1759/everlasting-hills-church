import {
  useState,
  memo,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { UseFormRegister, FieldValues, Path, UseFormSetValue } from "react-hook-form";

type Option = {
  value: string;
  text: string;
};

type MultiSelectFormProps<T extends FieldValues = FieldValues> = {
  label?: string;
  name: Path<T>;
  options?: Option[];
  register: UseFormRegister<T>;
  setValue?: UseFormSetValue<T>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  maxHeight?: string;
  expandParent?: boolean;
  defaultValue?: string[];
  showSelectAll?: boolean;
};

const MultiSelectForm = memo(
  <T extends FieldValues>({
    label,
    name,
    options = [],
    register,
    setValue,
    error,
    placeholder = "Select options",
    required = false,
    disabled = false,
    searchable = true,
    maxHeight = "16rem",
    expandParent = false,
    defaultValue = [],
    showSelectAll = true,
  }: MultiSelectFormProps<T>) => {
    const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownHeight, setDropdownHeight] = useState(0);

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const dropdownContentRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const prevDefaultValueRef = useRef<string[]>(defaultValue);

    // Sync defaultValue
    useEffect(() => {
      const hasChanged =
        defaultValue.length !== prevDefaultValueRef.current.length ||
        defaultValue.some((val, idx) => val !== prevDefaultValueRef.current[idx]);

      if (hasChanged) {
        setSelectedValues(defaultValue);
        prevDefaultValueRef.current = defaultValue;
      }
    }, [defaultValue]);

    // register
    useEffect(() => {
      register(name, {
        required: required ? `${label || "This field"} is required` : false,
      });
    }, [register, name, required, label]);

    // update form value
    useEffect(() => {
      setValue?.(name, selectedValues as any);
    }, [selectedValues, setValue, name]);

    // close outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | any) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // focus search
    useEffect(() => {
      if (isOpen && searchable) {
        searchInputRef.current?.focus();
      }
    }, [isOpen, searchable]);

    // expand parent height
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
      setSelectedValues((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    };

    const removeOption = (value: string, e?: MouseEvent) => {
      e?.stopPropagation();
      setSelectedValues((prev) => prev.filter((v) => v !== value));
    };

    const clearAll = (e?: MouseEvent) => {
      e?.stopPropagation();
      setSelectedValues([]);
    };

    const filteredOptions =
      searchable && searchQuery
        ? options.filter((opt) =>
            opt.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const selectedOptions = selectedValues
      .map((val) => options.find((opt) => opt.value === val))
      .filter(Boolean) as Option[];

    const isSelected = (value: string) => selectedValues.includes(value);

    const allFilteredSelected =
      filteredOptions.length > 0 &&
      filteredOptions.every((opt) => selectedValues.includes(opt.value));

    const someFilteredSelected =
      filteredOptions.length > 0 &&
      filteredOptions.some((opt) => selectedValues.includes(opt.value)) &&
      !allFilteredSelected;

    const handleSelectAll = (e: MouseEvent) => {
      e.stopPropagation();

      const filteredValues = filteredOptions.map((o) => o.value);

      const allSelected = filteredValues.every((v) =>
        selectedValues.includes(v)
      );

      if (allSelected) {
        setSelectedValues((prev) =>
          prev.filter((v) => !filteredValues.includes(v))
        );
      } else {
        setSelectedValues((prev) =>
          Array.from(new Set([...prev, ...filteredValues]))
        );
      }
    };

    return (
      <div
        ref={containerRef}
        className="w-full transition-all duration-300"
        style={{
          paddingBottom:
            expandParent && isOpen ? `${dropdownHeight + 8}px` : "0px",
        }}
      >
        <div ref={dropdownRef}>
          {label && (
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          <div className="relative w-full">
            <div
              onClick={toggleDropdown}
              className={`flex-1 flex justify-between rounded-lg px-4 py-2.5 border cursor-pointer ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            >
              <div className="flex flex-wrap gap-1">
                {selectedOptions.length ? (
                  selectedOptions.map((opt) => (
                    <span
                      key={opt.value}
                      className="bg-blue-100 px-2 py-1 rounded text-xs"
                    >
                      {opt.text}
                      <button
                        onClick={(e) => removeOption(opt.value, e)}
                        className="ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">{placeholder}</span>
                )}
              </div>
            </div>

            {isOpen && (
              <div
                ref={dropdownContentRef}
                className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow"
              >
                {searchable && (
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.target.value)
                    }
                    className="w-full p-2 border-b"
                    placeholder="Search..."
                  />
                )}

                {showSelectAll && (
                  <button onClick={handleSelectAll} className="p-2 w-full">
                    {allFilteredSelected ? "Deselect All" : "Select All"}
                  </button>
                )}

                <div style={{ maxHeight }} className="overflow-y-auto">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left p-2 ${
                        isSelected(opt.value) ? "bg-blue-100" : ""
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      </div>
    );
  }
);

MultiSelectForm.displayName = "MultiSelectForm";
export default MultiSelectForm;