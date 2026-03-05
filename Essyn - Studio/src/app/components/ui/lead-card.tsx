import type { ReactNode } from "react";
import { Camera, Heart, Building2, Gift, GraduationCap, Baby } from "lucide-react";
import { LeadStageBadge, type LeadStage } from "./lead-stage-badge";
import { NextActionPill, type NextActionVariant } from "./next-action-pill";
import { LeadSourceTag, type LeadSource } from "./lead-source-tag";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  LeadCard — CRM pipeline card (Kanban item)        */
/*  Fields: nome, tipo, valor, proximaAcao, origem,   */
/*          stage, tags (max 3 visible + overflow)     */
/*  States: default / hover / selected                 */
/*  CTA area uses black on selection — not as CTA      */
/*  Ref: Pipedrive deal card + Monday.com item card    */
/* ═══════════════════════════════════════════════════ */

export type LeadTipo =
  | "casamento"
  | "ensaio"
  | "corporativo"
  | "aniversario"
  | "formatura"
  | "batizado";

const tipoConfig: Record<LeadTipo, { label: string; icon: ReactNode }> = {
  casamento: {
    label: "Casamento",
    icon: <Heart className="w-3 h-3" />,
  },
  ensaio: {
    label: "Ensaio",
    icon: <Camera className="w-3 h-3" />,
  },
  corporativo: {
    label: "Corporativo",
    icon: <Building2 className="w-3 h-3" />,
  },
  aniversario: {
    label: "Aniversário",
    icon: <Gift className="w-3 h-3" />,
  },
  formatura: {
    label: "Formatura",
    icon: <GraduationCap className="w-3 h-3" />,
  },
  batizado: {
    label: "Batizado",
    icon: <Baby className="w-3 h-3" />,
  },
};

export interface LeadCardData {
  id: string;
  nome: string;
  tipo: LeadTipo;
  /** Formatted value (e.g. "R$ 8.500") */
  valor: string;
  /** Next action variant for urgency */
  proximaAcao: NextActionVariant;
  /** Optional next action label override */
  proximaAcaoLabel?: string;
  /** Lead source */
  origem: LeadSource;
  /** Current pipeline stage */
  stage: LeadStage;
  /** Additional string tags */
  tags?: string[];
}

interface LeadCardProps {
  lead: LeadCardData;
  selected?: boolean;
  onClick?: (id: string) => void;
  /** Compact mode for smaller pipeline columns */
  compact?: boolean;
  /** Flat row mode — no border/shadow/radius, flush inside parent card */
  flat?: boolean;
}

export function LeadCard({
  lead,
  selected = false,
  onClick,
  compact = false,
  flat = false,
}: LeadCardProps) {
  const { isDark } = useDk();
  const tipo = tipoConfig[lead.tipo];
  const MAX_TAGS = 3;
  const visibleTags = lead.tags?.slice(0, MAX_TAGS) ?? [];
  const overflowCount = (lead.tags?.length ?? 0) - MAX_TAGS;

  return (
    <div
      className={`flex flex-col gap-2.5 transition-all ${
        flat
          ? `${compact ? "px-3.5 py-2.5" : "px-4 py-3"} ${
              isDark
                ? `hover:bg-[#1C1C1E] ${selected ? "bg-[#1C1C1E]" : ""}`
                : `hover:bg-[#FAFAFA] ${selected ? "bg-[#F5F5F7]" : ""}`
            }`
          : `rounded-xl border ${compact ? "px-3 py-2.5" : "px-3.5 py-3"} ${
              selected
                ? isDark
                  ? "border-[#3C3C43] bg-[#1C1C1E] ring-1 ring-[#2C2C2E] shadow-[0_2px_8px_#000000]"
                  : "border-[#C7C7CC] bg-[#FAFAFA] ring-1 ring-[#E5E5EA] shadow-[0_2px_8px_#E5E5EA]"
                : isDark
                ? "border-[#2C2C2E] bg-[#141414] hover:border-[#3C3C43] hover:shadow-[0_2px_8px_#000000]"
                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:shadow-[0_2px_8px_#F2F2F7]"
            }`
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={() => onClick?.(lead.id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* ── Row 1: Nome + Stage badge ── */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[13px] ${isDark ? "text-[#D1D1D6]" : "text-[#636366]"} truncate flex-1 min-w-0`}
          style={{ fontWeight: 500 }}
        >
          {lead.nome}
        </span>
        <LeadStageBadge stage={lead.stage} size="sm" showDot />
      </div>

      {/* ── Row 2: Tipo + Valor ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={isDark ? "text-[#48484A]" : "text-[#C7C7CC]"}>{tipo.icon}</span>
          <span
            className={`text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
            style={{ fontWeight: 400 }}
          >
            {tipo.label}
          </span>
        </div>
        <span
          className={`text-[12px] ${isDark ? "text-[#AEAEB2]" : "text-[#636366]"} numeric`}
          style={{ fontWeight: 600 }}
        >
          {lead.valor}
        </span>
      </div>

      {/* ── Row 3: Next action + Source ── */}
      <div className="flex items-center justify-between gap-2">
        <NextActionPill
          variant={lead.proximaAcao}
          size="xs"
          label={lead.proximaAcaoLabel}
        />
        <LeadSourceTag source={lead.origem} />
      </div>

      {/* ── Row 4: Tags (max 3 + overflow) ── */}
      {visibleTags.length > 0 && (
        <div className={`flex items-center gap-1 flex-wrap pt-0.5 border-t ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-1.5 py-px rounded-md border text-[8px] ${
                isDark
                  ? "bg-[#1C1C1E] border-[#2C2C2E] text-[#636366]"
                  : "bg-[#F2F2F7] border-[#E5E5EA] text-[#AEAEB2]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span
              className={`inline-flex items-center px-1 py-px rounded text-[8px] ${isDark ? "text-[#48484A]" : "text-[#C7C7CC]"}`}
              style={{ fontWeight: 500 }}
            >
              +{overflowCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { tipoConfig };