import { MoreHorizontal } from "lucide-react";
import type { LeadStage } from "./lead-stage-badge";
import { leadStageConfig } from "./lead-stage-badge";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  PipelineStageHeader — Kanban column header        */
/*  Shows: colored dot + stage name + count + "..."   */
/*  Variants: default / active                         */
/*  CRM pipeline board column header                   */
/* ═══════════════════════════════════════════════════ */

interface PipelineStageHeaderProps {
  /** Pipeline stage key (drives color & label) */
  stage: LeadStage;
  /** Override label text */
  label?: string;
  /** Number of leads in this stage */
  count: number;
  /** Active = currently focused column */
  active?: boolean;
  /** Optional menu callback */
  onMenuClick?: () => void;
  /** Flat mode — flush inside parent card, no bg/border/radius */
  flat?: boolean;
}

export function PipelineStageHeader({
  stage,
  label,
  count,
  active = false,
  onMenuClick,
  flat = false,
}: PipelineStageHeaderProps) {
  const { isDark } = useDk();
  const cfg = leadStageConfig[stage];
  const displayLabel = label || cfg.label;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors ${
        flat
          ? ""
          : `rounded-xl ${
              active
                ? isDark
                  ? "bg-[#1C1C1E] border border-[#2C2C2E]"
                  : "bg-[#F5F5F7] border border-[#E5E5EA]"
                : isDark
                ? "bg-[#141414] border border-[#2C2C2E]"
                : "bg-[#FAFAFA] border border-[#E5E5EA]"
            }`
      }`}
    >
      {/* Colored dot */}
      <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />

      {/* Label */}
      <span
        className={`text-[12px] flex-1 min-w-0 truncate ${
          active
            ? isDark ? "text-[#D1D1D6]" : "text-[#636366]"
            : isDark ? "text-[#8E8E93]" : "text-[#8E8E93]"
        }`}
        style={{ fontWeight: 600 }}
      >
        {displayLabel}
      </span>

      {/* Count */}
      <span
        className={`text-[10px] numeric px-1.5 py-0.5 rounded-md shrink-0 ${
          active
            ? "bg-[#1D1D1F] text-white"
            : isDark ? "bg-[#2C2C2E] text-[#636366]" : "bg-[#F2F2F7] text-[#AEAEB2]"
        }`}
        style={{ fontWeight: 600 }}
      >
        {count}
      </span>

      {/* Menu trigger */}
      {onMenuClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isDark
              ? "text-[#48484A] hover:text-[#8E8E93] hover:bg-[#2C2C2E]"
              : "text-[#D1D1D6] hover:text-[#AEAEB2] hover:bg-[#F5F5F7]"
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}