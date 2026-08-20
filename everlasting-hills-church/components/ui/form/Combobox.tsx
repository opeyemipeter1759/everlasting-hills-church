"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface ComboOption {
  id: string;
  label: string;
}

interface ComboboxProps {
  options: ComboOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  emptyText?: string;
  /** Called with the raw typed query, for callers that search server-side
   * (in addition to the built-in client-side filter over `options`). */
  onQueryChange?: (query: string) => void;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option…",
  searchPlaceholder = "Search…",
  loading = false,
  disabled = false,
  emptyText = "No results found.",
  onQueryChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.id === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function handleOpen() {
    if (disabled || loading) return;
    const selectedIndex = options.findIndex((option) => option.id === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleClose({ restoreFocus = false } = {}) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleSelect(opt: ComboOption) {
    onChange(opt.id);
    handleClose({ restoreFocus: true });
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      handleClose({ restoreFocus: true });
      return;
    }

    if (event.key === "Tab") {
      handleClose();
      return;
    }

    if (filtered.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(filtered[Math.min(activeIndex, filtered.length - 1)]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#87102C]/25 focus:border-[#87102C]/40 transition disabled:opacity-50 text-left"
      >
        <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-400"}>
          {loading ? "Loading…" : selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2e] shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-white/8">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-label={searchPlaceholder}
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={filtered[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
                onQueryChange?.(e.target.value);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* Options */}
          <ul id={listboxId} role="listbox" className="max-h-48 no-scrollbar overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li role="presentation" className="px-3 py-2.5 text-xs text-gray-400 text-center">{emptyText}</li>
            ) : (
              filtered.map((opt, index) => (
                <li
                  key={opt.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={opt.id === value}
                  onMouseMove={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`w-full flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-colors text-left ${
                    index === activeIndex ? "bg-gray-50 dark:bg-white/5" : ""
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.id === value && (
                    <Check size={13} aria-hidden="true" className="text-[#87102C] shrink-0" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
