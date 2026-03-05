import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  icon,
  error,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const q = search.toLowerCase();
    return opt.label.toLowerCase().includes(q) || opt.sublabel?.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white text-[13px] text-left transition-all ${
          error
            ? "border-[#FF3B30] ring-2 ring-[#FBF5F4]"
            : open
            ? "border-[#007AFF] ring-2 ring-[#F2F2F7]"
            : "border-[#E5E5EA] hover:border-[#D1D1D6]"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        style={{ fontWeight: 400 }}
      >
        {icon && <span className="text-[#D1D1D6] shrink-0">{icon}</span>}
        <span className={`flex-1 ${selectedOption ? "text-[#48484A]" : "text-[#D1D1D6]"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#C7C7CC] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-[#E5E5EA] overflow-hidden"
            style={{ boxShadow: "0 4px 16px #E5E5EA" }}
          >
            {/* Search */}
            <div className="p-2 border-b border-[#E5E5EA]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#D1D1D6]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[#E5E5EA] bg-[#FAFAFA] text-[12px] text-[#48484A] placeholder:text-[#D1D1D6] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                    Nenhum resultado encontrado
                  </span>
                </div>
              ) : (
                <div className="py-1">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FAFAFA] transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="text-[13px] text-[#48484A]" style={{ fontWeight: 500 }}>
                          {opt.label}
                        </div>
                        {opt.sublabel && (
                          <div className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                      {value === opt.value && (
                        <Check className="w-3.5 h-3.5 text-[#007AFF]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}