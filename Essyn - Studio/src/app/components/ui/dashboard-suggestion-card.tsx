import { motion, AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { springSnappy, springSidebar } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════
   DashboardSuggestionCard — Apple Widget
   ─────────────────────────────────────────────────────
   White card on system bg. Sparkle icon for AI hint.
   CTA is the single blue element. Subtle Apple shadow.
   ═══════════════════════════════════════════════════════ */

export type SuggestionVariant = "info" | "warning";

interface DashboardSuggestionCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
  variant?: SuggestionVariant;
  confidence?: number;
  ctaIcon?: ReactNode;
}

const WIDGET_SHADOW = "0 0.5px 1px #F2F2F7, 0 1px 3px #F2F2F7";
const WIDGET_SHADOW_DARK = "0 0.5px 1px #000000, 0 1px 3px #000000";

export function DashboardSuggestionCard({
  title,
  description,
  ctaLabel,
  onCtaClick,
  dismissLabel = "Ignorar",
  onDismiss,
  variant = "info",
  confidence,
  ctaIcon,
}: DashboardSuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const isWarning = variant === "warning";
  const { isDark } = useDk();

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <AnimatePresence mode="wait">
      {dismissed ? (
        <motion.div
          key="dismissed"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springSnappy}
          className={`flex flex-col items-center justify-center py-10 px-6 gap-2 ${isDark ? "bg-[#141414]" : "bg-white"}`}
          style={{ borderRadius: 20, boxShadow: isDark ? WIDGET_SHADOW_DARK : WIDGET_SHADOW }}
        >
          <span
            className={`text-[12px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
            style={{ fontWeight: 400 }}
          >
            Sugestao descartada
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={springSidebar}
          className={`relative flex flex-col overflow-hidden ${isDark ? "bg-[#141414]" : "bg-white"}`}
          style={{ borderRadius: 20, boxShadow: isDark ? WIDGET_SHADOW_DARK : WIDGET_SHADOW }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? "text-[#48484A]" : "text-[#C7C7CC]"}`} />
              <span
                className="text-[11px] uppercase text-[#8E8E93] tracking-[0.04em]"
                style={{ fontWeight: 500 }}
              >
                {isWarning ? "Atencao" : "Sugestao"}
              </span>
              {confidence !== undefined && (
                <>
                  <span className={`w-px h-2.5 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
                  <span
                    className="text-[11px] text-[#AEAEB2] numeric"
                    style={{ fontWeight: 400 }}
                  >
                    {confidence}%
                  </span>
                </>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] ${
                  isDark ? "text-[#48484A] hover:text-[#8E8E93]" : "text-[#D1D1D6] hover:text-[#8E8E93]"
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3.5 px-5 pt-3 pb-5">
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-[14px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                style={{ fontWeight: 500, lineHeight: 1.4 }}
              >
                {title}
              </span>
              <p
                className={`text-[12px] ${isDark ? "text-[#8E8E93]" : "text-[#636366]"}`}
                style={{ fontWeight: 400, lineHeight: 1.55 }}
              >
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onCtaClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-[#007AFF] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#007AFF] border ${
                  isDark
                    ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E] border-[#2C2C2E] hover:border-[#3C3C43]"
                    : "hover:bg-[#F2F2F7] active:bg-[#EDEDF0] border-[#E5E5EA] hover:border-[#D1D1D6]"
                }`}
                style={{ fontWeight: 500, borderRadius: 10 }}
              >
                {ctaIcon || <ArrowRight className="w-3.5 h-3.5" />}
                {ctaLabel}
              </button>
              {dismissLabel && (
                <button
                  onClick={handleDismiss}
                  className={`px-2 py-2 text-[12px] transition-colors duration-150 cursor-pointer focus-visible:outline-none ${
                    isDark ? "text-[#48484A] hover:text-[#8E8E93] active:text-[#AEAEB2]" : "text-[#AEAEB2] hover:text-[#636366] active:text-[#48484A]"
                  }`}
                  style={{ fontWeight: 400 }}
                >
                  {dismissLabel}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}