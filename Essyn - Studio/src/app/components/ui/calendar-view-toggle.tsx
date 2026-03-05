import type { ReactNode } from "react";
import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { Calendar, Clock, List, LayoutGrid } from "lucide-react";

/* ═══════════════════════════════════════════════════ */
/*  CalendarViewToggle — Segmented view switcher       */
/*  Views: Mês | Semana | Dia | Lista                  */
/*  States: default / active / hover / disabled         */
/*  Spring pill animation (layoutId)                    */
/*  CTA accent: none — neutral only                     */
/*  Ref: Apple Calendar view picker + Linear toggle     */
/* ═══════════════════════════════════════════════════ */

export type CalendarViewId = "mes" | "semana" | "dia" | "lista";

export interface CalendarViewOption {
  id: CalendarViewId;
  label: string;
  icon: ReactNode;
}

const defaultViews: CalendarViewOption[] = [
  { id: "mes", label: "Mês", icon: <LayoutGrid className="w-3 h-3" /> },
  { id: "semana", label: "Semana", icon: <Calendar className="w-3 h-3" /> },
  { id: "dia", label: "Dia", icon: <Clock className="w-3 h-3" /> },
  { id: "lista", label: "Lista", icon: <List className="w-3 h-3" /> },
];

interface CalendarViewToggleProps {
  /** Currently active view */
  active: CalendarViewId;
  /** Change handler */
  onChange: (view: CalendarViewId) => void;
  /** Custom views override */
  views?: CalendarViewOption[];
  /** Disabled views list */
  disabledViews?: CalendarViewId[];
  /** Compact mode — smaller padding */
  compact?: boolean;
  /** Unique layoutId prefix for multiple instances */
  layoutId?: string;
}

export function CalendarViewToggle({
  active,
  onChange,
  views = defaultViews,
  disabledViews = [],
  compact = false,
  layoutId = "calendar-view-pill",
}: CalendarViewToggleProps) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-[#F2F2F7] border border-[#E5E5EA] rounded-xl ${
        compact ? "p-[3px]" : "p-0.5"
      }`}
      role="tablist"
    >
      {views.map((v) => {
        const isActive = active === v.id;
        const isDisabled = disabledViews.includes(v.id);

        return (
          <button
            key={v.id}
            onClick={() => !isDisabled && onChange(v.id)}
            disabled={isDisabled}
            role="tab"
            aria-selected={isActive}
            className={`relative flex items-center gap-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]"
            } ${
              isDisabled
                ? "text-[#D1D1D6] cursor-not-allowed"
                : isActive
                ? "text-[#48484A] cursor-pointer"
                : "text-[#AEAEB2] hover:text-[#8E8E93] cursor-pointer"
            }`}
            style={{ fontWeight: isActive ? 500 : 400 }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_3px_#E5E5EA]"
                transition={springDefault}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {v.icon}
              {v.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { defaultViews as calendarViewOptions };