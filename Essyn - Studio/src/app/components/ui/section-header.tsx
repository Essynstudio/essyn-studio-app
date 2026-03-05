import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  SectionHeader — Apple Premium Section Title                   */
/*  Title 15/600 + optional count + "Ver tudo" link.              */
/*  Use inside WidgetCard header or standalone above a section.   */
/* ═══════════════════════════════════════════════════════════════ */

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Numeric count shown as muted badge */
  count?: string | number;
  /** Right-side link text (e.g. "Ver tudo") */
  action?: string;
  /** Handler for the link */
  onAction?: () => void;
  /** Optional icon before title */
  icon?: ReactNode;
  /** "inside" = inside a card (px-5), "standalone" = no horizontal padding */
  variant?: "inside" | "standalone";
  /** Extra className */
  className?: string;
}

export function SectionHeader({
  title,
  count,
  action,
  onAction,
  icon,
  variant = "inside",
  className = "",
}: SectionHeaderProps) {
  const { isDark } = useDk();
  const px = variant === "inside" ? "px-5" : "";

  return (
    <div className={`flex items-center justify-between ${px} ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
            <span className={`[&>svg]:w-3.5 [&>svg]:h-3.5 ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}>
              {icon}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <h2
            className={`text-[15px] tracking-[-0.01em] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
            style={{ fontWeight: 600 }}
          >
            {title}
          </h2>
          {count !== undefined && (
            <span
              className={`text-[13px] numeric ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 400 }}
            >
              {count}
            </span>
          )}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          className={`flex items-center gap-0.5 text-[13px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] rounded px-1.5 py-0.5 ${isDark ? "text-[#636366] hover:text-[#AEAEB2] active:bg-[#2C2C2E]" : "text-[#8E8E93] hover:text-[#48484A] active:bg-[#F5F5F7]"}`}
          style={{ fontWeight: 500 }}
        >
          {action}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}