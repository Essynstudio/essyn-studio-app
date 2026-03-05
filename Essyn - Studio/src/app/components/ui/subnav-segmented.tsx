import { type ReactNode } from "react";
import { motion } from "motion/react";
import { springSidebar } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  SubnavSegmented — Generic segmented control        */
/*  Spring animation via motion layoutId               */
/*  Badge support for pending counts                   */
/*  Ref: Odoo (modular) + Apple (spring physics)       */
/* ═══════════════════════════════════════════════════ */

export interface SubnavTab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface SubnavSegmentedProps {
  tabs: SubnavTab[];
  active: string;
  onChange: (id: string) => void;
  layoutId: string;
}

export function SubnavSegmented({
  tabs,
  active,
  onChange,
  layoutId,
}: SubnavSegmentedProps) {
  const dk = useDk();
  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-2xl border overflow-x-auto no-scrollbar"
      style={{
        backgroundColor: dk.isDark ? "#1C1C1E" : "#F2F2F7",
        borderColor: dk.isDark ? "#2C2C2E" : "#E5E5EA",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? dk.isDark ? "#F5F5F7" : "#1D1D1F"
                : dk.isDark ? "#8E8E93" : "#636366",
            }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                style={{
                  backgroundColor: dk.isDark ? "#2C2C2E" : "#FFFFFF",
                  boxShadow: dk.isDark
                    ? "0 1px 2px #000000, 0 2px 6px #000000"
                    : "0 1px 2px #D1D1D6, 0 2px 6px #E5E5EA",
                }}
                transition={springSidebar}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <span
                style={{
                  color: isActive
                    ? dk.isDark ? "#AEAEB2" : "#3C3C43"
                    : dk.isDark ? "#636366" : "#8E8E93",
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="text-[9px] numeric px-1.5 py-[1px] rounded-md"
                  style={{
                    fontWeight: 600,
                    backgroundColor: isActive
                      ? "#FDEDEF"
                      : dk.isDark ? "#3A2C2C" : "#F5E6E6",
                    color: isActive
                      ? "#CC6B65"
                      : dk.isDark ? "#CC6B65" : "#B85C56",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}