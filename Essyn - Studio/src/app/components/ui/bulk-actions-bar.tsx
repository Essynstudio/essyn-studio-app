import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { springFadeIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  BulkActionsBar — Floating bulk operation bar      */
/*  Appears when 1+ items are selected                 */
/*  Always black background (system primary)           */
/*  Ref: QuickBooks + Zoho bulk ops                    */
/* ═══════════════════════════════════════════════════ */

export interface BulkAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface BulkActionsBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionsBar({
  count,
  actions,
  onClear,
}: BulkActionsBarProps) {
  const { isDark } = useDk();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={springFadeIn}
      className={`sticky top-0 z-20 flex items-center justify-between px-5 py-3 rounded-2xl text-white ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F]" : "bg-[#1D1D1F]"}`}
      style={{ boxShadow: isDark ? "0 4px 16px #000000" : "0 4px 16px #E5E5EA" }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center justify-center min-w-[24px] h-6 px-2 rounded-lg text-[12px] numeric ${isDark ? "bg-[#D1D1D6] text-[#1D1D1F]" : "bg-[#3C3C43] text-white"}`}
          style={{ fontWeight: 600 }}
        >
          {count}
        </span>
        <span
          className={`text-[13px] ${isDark ? "text-[#636366]" : "text-[#C7C7CC]"}`}
          style={{ fontWeight: 400 }}
        >
          {count === 1 ? "item selecionado" : "itens selecionados"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-0 ${isDark ? "bg-[#E5E5EA] text-[#1D1D1F] hover:bg-[#D1D1D6]" : "bg-[#48484A] text-white hover:bg-[#636366]"}`}
            style={{ fontWeight: 500 }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        <span className={`w-px h-5 mx-1 ${isDark ? "bg-[#D1D1D6]" : "bg-[#48484A]"}`} />
        <button
          onClick={onClear}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-0 ${isDark ? "text-[#8E8E93] hover:text-[#636366] hover:bg-[#D1D1D6]" : "text-[#8E8E93] hover:text-[#C7C7CC] hover:bg-[#3C3C43]"}`}
          aria-label="Limpar seleção"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}