import { Check } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  RowSelectCheckbox — Standalone selection checkbox  */
/*  For bulk operations in lists and tables            */
/*  States: unchecked / checked / indeterminate        */
/*  Visibility: hidden by default, visible on hover    */
/*  or when checked. Use group class on parent.        */
/*  Ref: QuickBooks + Zoho bulk selection              */
/* ═══════════════════════════════════════════════════ */

export type CheckboxState = "unchecked" | "checked" | "indeterminate";

interface RowSelectCheckboxProps {
  state: CheckboxState;
  onChange: () => void;
  /** Always visible (e.g. header checkbox) vs. show on group-hover */
  alwaysVisible?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Disabled state */
  disabled?: boolean;
}

export function RowSelectCheckbox({
  state,
  onChange,
  alwaysVisible = false,
  size = "md",
  disabled = false,
}: RowSelectCheckboxProps) {
  const { isDark } = useDk();
  const isChecked = state === "checked";
  const isIndeterminate = state === "indeterminate";
  const isActive = isChecked || isIndeterminate;

  const dims = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  const radius = size === "sm" ? "rounded-[4px]" : "rounded-[5px]";
  const iconSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      disabled={disabled}
      className={`${dims} ${radius} border-[1.5px] flex items-center justify-center shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
        isActive
          ? isDark
            ? "bg-[#F5F5F7] border-[#F5F5F7]"
            : "bg-[#1D1D1F] border-[#1D1D1F]"
          : `${isDark ? "border-[#636366] hover:border-[#8E8E93]" : "border-[#D1D1D6] hover:border-[#AEAEB2]"} ${
              alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            }`
      } ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : ""
      }`}
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      role="checkbox"
    >
      {isChecked && <Check className={`${iconSize} ${isDark ? "text-[#1D1D1F]" : "text-white"}`} />}
      {isIndeterminate && (
        <div className={`${size === "sm" ? "w-2 h-[1.5px]" : "w-2.5 h-[1.5px]"} ${isDark ? "bg-[#1D1D1F]" : "bg-white"} rounded-full`} />
      )}
    </button>
  );
}