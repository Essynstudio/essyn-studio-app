import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  FilterChip — Toggleable filter with count badge   */
/*  Variants: default / selected / withCount / disabled */
/*  Colors only for dot indicator                      */
/* ═══════════════════════════════════════════════════ */

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  onClick: () => void;
  disabled?: boolean;
}

export function FilterChip({
  label,
  count,
  active,
  dot,
  chipBg,
  chipText,
  chipBorder,
  onClick,
  disabled = false,
}: FilterChipProps) {
  const { isDark } = useDk();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
        disabled
          ? isDark
            ? "bg-[#1C1C1E] border-[#2C2C2E] text-[#3C3C43] cursor-not-allowed opacity-50"
            : "bg-[#F2F2F7] border-[#E5E5EA] text-[#D1D1D6] cursor-not-allowed opacity-50"
          : active
          ? `${chipBg} ${chipBorder} ${chipText} cursor-pointer`
          : isDark
          ? "bg-[#1C1C1E] border-[#2C2C2E] text-[#636366] hover:border-[#3C3C43] hover:text-[#8E8E93] cursor-pointer"
          : "bg-white border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6] hover:text-[#8E8E93] cursor-pointer"
      }`}
      style={{ fontWeight: 500 }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          disabled ? isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]" : active ? dot : isDark ? "bg-[#48484A]" : "bg-[#D1D1D6]"
        } shrink-0`}
      />
      {label}
      <span
        className={`text-[11px] numeric ${
          disabled ? isDark ? "text-[#2C2C2E]" : "text-[#E5E5EA]" : active ? "opacity-70" : isDark ? "text-[#48484A]" : "text-[#D1D1D6]"
        }`}
        style={{ fontWeight: 600 }}
      >
        {count}
      </span>
    </button>
  );
}