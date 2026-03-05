import { type ReactNode } from "react";
import { motion } from "motion/react";
import { springSidebar, withDelay } from "../../lib/motion-tokens";
import { KpiCard } from "./kpi-card";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  DashboardKpiGrid — Apple Premium Metrics Strip   */
/*  Single row of metrics with internal hairlines.   */
/*  `flat` mode: no own surface (for embedding).     */
/* ═══════════════════════════════════════════════════ */

export interface DashboardKpiSlot {
  label?: string;
  value: string;
  sub?: string;
  tooltip?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
    positive: boolean;
  };
  icon?: ReactNode;
}

interface DashboardKpiGridProps {
  projetos?: DashboardKpiSlot;
  aReceber?: DashboardKpiSlot;
  producao?: DashboardKpiSlot;
  compromissos?: DashboardKpiSlot;
  compact?: boolean;
  loading?: boolean;
  /** When true, renders without own card surface (parent provides bg) */
  flat?: boolean;
}

const slotLabels: Record<
  "projetos" | "aReceber" | "producao" | "compromissos",
  string
> = {
  projetos: "Projetos Ativos",
  aReceber: "A Receber",
  producao: "Produção",
  compromissos: "Compromissos",
};

export function DashboardKpiGrid({
  projetos,
  aReceber,
  producao,
  compromissos,
  compact = false,
  loading = false,
  flat = false,
}: DashboardKpiGridProps) {
  const { isDark } = useDk();
  const sepColor = isDark ? "#2C2C2E" : "#F2F2F7";

  const slots: {
    key: "projetos" | "aReceber" | "producao" | "compromissos";
    data?: DashboardKpiSlot;
  }[] = [
    { key: "projetos", data: projetos },
    { key: "aReceber", data: aReceber },
    { key: "producao", data: producao },
    { key: "compromissos", data: compromissos },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, i) => {
          const label = slotLabels[slot.key];
          const d = slot.data;
          if (!d) return null;
          return (
            <motion.div
              key={slot.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={withDelay(springSidebar, i * 0.04)}
            >
              <KpiCard
                label={d.label || label}
                value={d.value}
                sub={d.sub}
                trend={d.trend}
                tooltip={d.tooltip}
                compact
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  const inner = (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {slots.map((slot, i) => {
        const label = slotLabels[slot.key];
        const d = slot.data;
        const isLast = i === slots.length - 1;

        return (
          <div
            key={slot.key}
            className="relative"
            style={{
              borderRight: !isLast ? `1px solid ${sepColor}` : undefined,
              borderBottom: i < 2 ? `1px solid ${sepColor}` : undefined,
            }}
          >
            <div style={{ paddingLeft: 20, paddingRight: 20 }}>
              {loading ? (
                <KpiCard label={label} value="" loading />
              ) : d ? (
                <KpiCard
                  label={d.label || label}
                  value={d.value}
                  sub={d.sub}
                  trend={d.trend}
                  tooltip={d.tooltip}
                />
              ) : (
                <div className="flex flex-col gap-2 py-4">
                  <span
                    className={`text-[11px] uppercase tracking-[0.04em] ${isDark ? "text-[#48484A]" : "text-[#D1D1D6]"}`}
                    style={{ fontWeight: 500 }}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-[26px] numeric tracking-[-0.02em] ${isDark ? "text-[#2C2C2E]" : "text-[#E5E5EA]"}`}
                    style={{ fontWeight: 300 }}
                  >
                    --
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* Flat mode: no container, just the grid */
  if (flat) {
    return inner;
  }

  /* Self-contained card mode */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSidebar}
      className={`overflow-hidden ${isDark ? "bg-[#141414]" : "bg-white"}`}
      style={{
        borderRadius: 20,
        boxShadow: isDark ? "0 0.5px 1px #000000, 0 1px 3px #000000" : "0 0.5px 1px #F2F2F7, 0 1px 3px #F2F2F7",
      }}
    >
      {inner}
    </motion.div>
  );
}