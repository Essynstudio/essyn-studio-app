import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  SettingsCard — Settings item card                  */
/*  Title, description, icon, CTA "Abrir"              */
/*  States: default / hover                            */
/*  CTA always black — no color outside badges         */
/*  Primitivo: /ui/settings-card.tsx                   */
/* ═══════════════════════════════════════════════════ */

export interface SettingsCardProps {
  /** Lucide icon or custom ReactNode rendered in the icon slot */
  icon: ReactNode;
  /** Card title */
  title: string;
  /** Short description */
  description: string;
  /** Optional tag rendered after the title */
  tag?: ReactNode;
  /** CTA label (default: "Abrir") */
  ctaLabel?: string;
  /** Click handler for the entire card / CTA */
  onClick?: () => void;
  /** Disable hover + CTA interaction */
  disabled?: boolean;
}

export function SettingsCard({
  icon,
  title,
  description,
  tag,
  ctaLabel = "Abrir",
  onClick,
  disabled = false,
}: SettingsCardProps) {
  const { isDark } = useDk();
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl border
        text-left transition-all group
        ${
          disabled
            ? isDark
              ? "border-[#2C2C2E] opacity-50 cursor-not-allowed"
              : "border-[#E5E5EA] opacity-50 cursor-not-allowed"
            : isDark
            ? "bg-[#141414] border-[#2C2C2E] hover:border-[#3C3C43] cursor-pointer active:scale-[0.995]"
            : "bg-white border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-[0_2px_8px_#F2F2F7] cursor-pointer active:scale-[0.995]"
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          transition-colors
          ${isDark
            ? `bg-[#2C2C2E] ${!disabled ? "group-hover:bg-[#3C3C43]" : ""}`
            : `bg-[#F2F2F7] ${!disabled ? "group-hover:bg-[#E5E5EA]" : ""}`
          }
        `}
      >
        <span className={`[&>svg]:w-[18px] [&>svg]:h-[18px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}>
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[13px] truncate ${isDark ? "text-[#AEAEB2]" : "text-[#636366]"}`}
            style={{ fontWeight: 500 }}
          >
            {title}
          </span>
          {tag}
        </div>
        <span
          className={`text-[12px] truncate ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
          style={{ fontWeight: 400 }}
        >
          {description}
        </span>
      </div>

      {/* CTA */}
      {!disabled && (
        <span
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-xl shrink-0
            text-[11px]
            opacity-0 group-hover:opacity-100 transition-all
            ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F]" : "bg-[#1D1D1F] text-white"}
          `}
          style={{ fontWeight: 500 }}
        >
          {ctaLabel}
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}