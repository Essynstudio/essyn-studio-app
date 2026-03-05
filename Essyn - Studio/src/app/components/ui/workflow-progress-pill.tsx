import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  WorkflowProgressPill — Apple whispered color      */
/*  Subtle semantic bar + muted SLA text              */
/*  Color exists but is quiet                         */
/* ═══════════════════════════════════════════════════ */

export type WorkflowProgressVariant = "default" | "compact";

interface WorkflowProgressPillProps {
  /** Current step number (1-based) */
  current: number;
  /** Total steps */
  total: number;
  /** SLA days remaining (e.g. 30 → "D+30", -2 → "D-2") */
  slaDays: number;
  /** Variant: default for lists, compact for drawers */
  variant?: WorkflowProgressVariant;
  /** Override progress color when atrasado */
  isLate?: boolean;
}

export function WorkflowProgressPill({
  current,
  total,
  slaDays,
  variant = "default",
  isLate = false,
}: WorkflowProgressPillProps) {
  const { isDark } = useDk();
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current >= total;
  const slaLabel = slaDays >= 0 ? `D+${slaDays}` : `D${slaDays}`;

  /* ── Whispered bar color — semantic but muted ── */
  const barColor = isLate
    ? "#FF3B30"
    : isComplete
    ? "#34C759"
    : progress >= 60
    ? "#8E8E93"
    : isDark ? "#3C3C43" : "#E5E5EA";

  const trackBg = isDark ? "#2C2C2E" : "#F2F2F7";

  /* ── SLA styling — subtle semantic tint ── */
  const slaStyle = isLate
    ? { color: "#FF3B30", bg: isDark ? "#3A1A18" : "#FBF5F4" }
    : slaDays <= 2
    ? { color: "#FF9500", bg: isDark ? "#2E2A1A" : "#FAF7F0" }
    : { color: isDark ? "#636366" : "#C7C7CC", bg: isDark ? "#2C2C2E" : "#F5F5F7" };

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5">
        {/* Step fraction */}
        <span
          className={`text-[9px] numeric ${isDark ? "text-[#636366]" : "text-[#C7C7CC]"}`}
          style={{ fontWeight: 500 }}
        >
          {current}/{total}
        </span>

        {/* Micro bar */}
        <div
          className="w-[28px] h-[3px] rounded-full overflow-hidden"
          style={{ background: trackBg }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: barColor,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* SLA */}
        <span
          className="px-1 py-px rounded text-[8px] numeric"
          style={{
            fontWeight: 500,
            color: slaStyle.color,
            background: slaStyle.bg,
          }}
        >
          {slaLabel}
        </span>
      </div>
    );
  }

  /* ── Default variant ── */
  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-1 rounded-lg"
      style={{ background: isDark ? "#1C1C1E" : "#FAFAFA" }}
    >
      {/* Step fraction */}
      <div className="flex items-center gap-1.5">
        <span
          className={`text-[10px] numeric ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
          style={{ fontWeight: 500 }}
        >
          {current}
          <span className={`mx-px ${isDark ? "text-[#3C3C43]" : "text-[#E5E5EA]"}`}>/</span>
          {total}
        </span>

        {/* Progress bar */}
        <div
          className="w-[36px] h-[3px] rounded-full overflow-hidden"
          style={{ background: trackBg }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: barColor,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Separator */}
      <span className={`w-px h-2.5 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />

      {/* SLA */}
      <span
        className="px-1 py-px rounded text-[9px] numeric"
        style={{
          fontWeight: 500,
          color: slaStyle.color,
          background: slaStyle.bg,
        }}
      >
        {slaLabel}
      </span>
    </div>
  );
}