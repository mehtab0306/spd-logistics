"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  [key: string]: any;
}

interface HybridComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: ComboboxOption) => void;
  options: (ComboboxOption | string)[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  emptyText?: string;
}

export function HybridCombobox({
  value,
  onChange,
  onSelectOption,
  options,
  placeholder = "",
  className,
  inputClassName,
  required,
  disabled,
  id,
  name,
  emptyText = "Type custom value...",
}: HybridComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to ComboboxOption objects
  const normalizedOptions: ComboboxOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Filter options based on typed input
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!value) return true;
    const q = value.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    if (onSelectOption) {
      onSelectOption(option);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", isOpen ? "z-[9999]" : "z-10", className)}
    >
      <div className="relative flex items-center">
        <Input
          id={id}
          name={name}
          type="text"
          value={value}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pr-9 transition-colors text-xs font-medium",
            inputClassName
          )}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Toggle options"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 right-0 top-full w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden text-xs py-1 animate-in fade-in-0 zoom-in-95">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected =
                opt.value.toLowerCase() === (value || "").toLowerCase() ||
                opt.label.toLowerCase() === (value || "").toLowerCase();
              return (
                <div
                  key={`${opt.value}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80",
                    isSelected && "bg-spd-blue/10 text-spd-blue font-bold"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2 break-words whitespace-normal">
                    <span className="break-words font-medium">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-muted-foreground break-words">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-spd-blue shrink-0" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-muted-foreground italic text-center">
              {value ? `Custom value: "${value}"` : emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HybridCombobox;
