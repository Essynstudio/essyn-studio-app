import { useState, type ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════
   KpiCard — Apple Premium Metric Cell
   ─────────────────────────────────────────────────────
   Flat metric inside a shared strip. No individual card.
   Inter numeric 600 value, muted label, subtle trend.
   Parent provides the surface + hairline dividers.
   ═══════════════════════════════════════════════════════ */

export type KpiRange = "7d" | "30d";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down";
    label: string;
    positive: boolean;
  };
  tooltip?: string;
  toggleRange?: boolean;
  range?: KpiRange;
  onToggleRange?: () => void;
  compact?: boolean;
  loading?: boolean;
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  tooltip,
  toggleRange,
  range,
  onToggleRange,
  compact = false,
  loading = false,
}: KpiCardProps) {
  const [showTip, setShowTip] = useState(false);
  const { isDark } = useDk();

  /* ── Compact (drawer / modal) ── */
  if (compact) {
    return (
      <div
        className={`flex-1 min-w-0 px-4 py-3 flex flex-col gap-1 border ${
          isDark ? "bg-[#1C1C1E] border-[#2C2C2E]" : "bg-white border-[#E5E5EA]"
        }`}
        style={{ borderRadius: 12 }}
      >
        <span
          className="text-[11px] uppercase text-[#8E8E93] tracking-[0.04em]"
          style={{ fontWeight: 500 }}
        >
          {label}
        </span>
        <span
          className={`text-[18px] tracking-[-0.02em] numeric ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
          style={{ fontWeight: 600 }}
        >
          {value}
        </span>
        {sub && (
          <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            {sub}
          </span>
        )}
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    const skBg = isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]";
    return (
      <div className="flex-1 min-w-0 flex flex-col py-4 px-1">
        <div className={`h-2.5 w-16 ${skBg} rounded-sm mb-3.5 animate-pulse`} />
        <div className={`h-7 w-20 ${skBg} rounded-sm animate-pulse`} />
        <div className={`h-2.5 w-24 ${skBg} rounded-sm mt-2.5 animate-pulse`} />
      </div>
    );
  }

  /* ── Default — flat metric cell ── */
  return (
    <div className="group relative flex-1 min-w-0 flex flex-col py-4 px-1">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] uppercase text-[#8E8E93] tracking-[0.04em]"
          style={{ fontWeight: 500 }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          {toggleRange && range && onToggleRange && (
            <button
              onClick={onToggleRange}
              className="px-1.5 py-0.5 rounded text-[10px] text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer numeric focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]"
              style={{ fontWeight: 600 }}
            >
              {range}
            </button>
          )}
          {tooltip && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="w-4 h-4 rounded-full flex items-center justify-center cursor-help text-[9px] text-[#C7C7CC] hover:text-[#8E8E93] transition-colors duration-150 focus-visible:outline-none"
                style={{ fontWeight: 500 }}
              >
                ?
              </button>
              <AnimatePresence>
                {showTip && (
                  <motion.div
                    key="kpi-tooltip"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={springPopoverIn}
                    className="absolute right-0 bottom-full mb-2 w-[200px] px-3 py-2.5 bg-[#1C1C1E] text-white text-[12px] z-50"
                    style={{
                      fontWeight: 400,
                      lineHeight: 1.5,
                      borderRadius: 10,
                      boxShadow: "0 4px 16px #E5E5EA",
                    }}
                  >
                    {tooltip}
                    <div className="absolute right-3 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#1C1C1E]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <span
        className={`text-[26px] tracking-[-0.02em] numeric ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
        style={{ fontWeight: 600, lineHeight: 1 }}
      >
        {value}
      </span>

      {/* Trend + sub */}
      {(sub || trend) && (
        <div className="flex flex-col gap-0.5 mt-2">
          {trend && (
            <span
              className={`flex items-center gap-0.5 text-[11px] ${
                trend.positive ? "text-[#34C759]" : "text-[#FF3B30]"
              }`}
              style={{ fontWeight: 500, lineHeight: 1.4 }}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend.label}
            </span>
          )}
          {sub && (
            <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: 1.4 }}>
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  );
}