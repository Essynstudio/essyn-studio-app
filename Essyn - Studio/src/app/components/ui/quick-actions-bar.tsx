import { useState, useRef, useEffect, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  QuickActionsBar — Horizontal shortcut strip       */
/*  Max 7 actions, overflow menu with "…" button      */
/*  CTAs always neutral — no color                     */
/*  Ref: Zoho Books quick-action bar                   */
/* ═══════════════════════════════════════════════════ */

export interface QuickAction {
  label: string;
  icon: ReactNode;
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  onAction: (label: string) => void;
  /** Max visible actions before overflow; defaults to 7 */
  maxVisible?: number;
}

export function QuickActionsBar({
  actions,
  onAction,
  maxVisible = 7,
}: QuickActionsBarProps) {
  const { isDark } = useDk();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);
  const hasOverflow = overflowActions.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOverflowOpen(false);
    }
    if (overflowOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [overflowOpen]);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {visibleActions.map((a) => (
        <button
          key={a.label}
          onClick={() => onAction(a.label)}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
            isDark
              ? "border-[#3C3C43] bg-[#1C1C1E] text-[#8E8E93] hover:border-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]"
              : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] hover:bg-[#FAFAFA]"
          }`}
          style={{ fontWeight: 500 }}
        >
          <span className={isDark ? "text-[#636366]" : "text-[#D1D1D6]"}>{a.icon}</span>
          {a.label}
        </button>
      ))}
      {hasOverflow && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOverflowOpen(!overflowOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-xl border transition-all cursor-pointer active:scale-[0.97] shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
              isDark
                ? `border-[#3C3C43] bg-[#1C1C1E] text-[#636366] hover:border-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E] ${overflowOpen ? "border-[#636366] text-[#8E8E93] bg-[#2C2C2E]" : ""}`
                : `border-[#E5E5EA] bg-white text-[#C7C7CC] hover:border-[#D1D1D6] hover:text-[#8E8E93] hover:bg-[#FAFAFA] ${overflowOpen ? "border-[#D1D1D6] text-[#8E8E93] bg-[#FAFAFA]" : ""}`
            }`}
            aria-label="Mais ações"
            aria-expanded={overflowOpen}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {overflowOpen && (
              <motion.div
                key="overflow-menu"
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={springPopoverIn}
                className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border py-1 overflow-hidden ${
                  isDark
                    ? "border-[#3C3C43] bg-[#1C1C1E]"
                    : "border-[#E5E5EA] bg-white"
                }`}
                style={{ boxShadow: isDark ? "0 4px 16px #000000" : "0 4px 16px #E5E5EA" }}
              >
                {overflowActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      onAction(a.label);
                      setOverflowOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-inset ${
                      isDark
                        ? "text-[#AEAEB2] hover:bg-[#2C2C2E]"
                        : "text-[#8E8E93] hover:bg-[#F2F2F7]"
                    }`}
                    style={{ fontWeight: 400 }}
                  >
                    <span className={isDark ? "text-[#636366]" : "text-[#D1D1D6]"}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}