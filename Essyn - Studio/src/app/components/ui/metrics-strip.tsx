import { type ReactNode } from "react";
import { motion } from "motion/react";
import { springSidebar, withDelay } from "../../lib/motion-tokens";
import { WIDGET_STYLE } from "../../lib/apple-style";
import { KpiCard } from "./kpi-card";
import { MetricsSkeleton } from "./widget-card";

/* ═══════════════════════════════════════════════════════════════ */
/*  MetricsStrip — Apple Premium Metrics Row                      */
/*  Generic row of KpiCard cells with internal hairline dividers. */
/*  Two modes: flat (for embedding inside a parent card) or       */
/*  self-contained (own card surface with radius 20 + shadow).    */
/* ═══════════════════════════════════════════════════════════════ */

export interface MetricSlot {
  /** Label above the value */
  label: string;
  /** Big numeric value */
  value: string;
  /** Sub-text below value */
  sub?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Trend indicator */
  trend?: {
    direction: "up" | "down";
    label: string;
    positive: boolean;
  };
  /** Optional icon */
  icon?: ReactNode;
}

export interface MetricsStripProps {
  /** Array of metric slots (2-6 recommended) */
  slots: MetricSlot[];
  /** Loading state — shows skeleton */
  loading?: boolean;
  /** Flat mode: no own surface, parent provides bg */
  flat?: boolean;
  /** Compact mode: 2-col grid with bordered cards */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
  /** Extra className */
  className?: string;
}

export function MetricsStrip({
  slots,
  loading = false,
  flat = false,
  compact = false,
  delay = 0,
  className = "",
}: MetricsStripProps) {
  if (loading) {
    return <MetricsSkeleton />;
  }

  /* Compact: bordered card grid */
  if (compact) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {slots.map((slot, i) => (
          <motion.div
            key={slot.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={withDelay(springSidebar, delay + i * 0.04)}
          >
            <KpiCard
              label={slot.label}
              value={slot.value}
              sub={slot.sub}
              trend={slot.trend}
              tooltip={slot.tooltip}
              compact
            />
          </motion.div>
        ))}
      </div>
    );
  }

  /* Standard strip */
  const colClass =
    slots.length <= 2
      ? "grid-cols-2"
      : slots.length === 3
      ? "grid-cols-3"
      : `grid-cols-2 lg:grid-cols-${Math.min(slots.length, 6)}`;

  const inner = (
    <div className={`grid ${colClass} ${className}`}>
      {slots.map((slot, i) => {
        const isLast = i === slots.length - 1;
        return (
          <div
            key={slot.label}
            className={`relative ${
              !isLast ? `lg:border-r lg:border-[#F2F2F7]` : ""
            } ${i < Math.ceil(slots.length / 2) && slots.length > 2 ? "border-b lg:border-b-0 border-[#F2F2F7]" : ""}`}
          >
            <div style={{ paddingLeft: 20, paddingRight: 20 }}>
              <KpiCard
                label={slot.label}
                value={slot.value}
                sub={slot.sub}
                trend={slot.trend}
                tooltip={slot.tooltip}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (flat) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springSidebar, delay)}
      className="bg-white overflow-hidden"
      style={WIDGET_STYLE}
    >
      {inner}
    </motion.div>
  );
}

/* Re-export for convenience */
export { MetricsSkeleton };
