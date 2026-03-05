import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  LeadStageBadge — CRM pipeline stage indicator     */
/*  Novo | Contato | Reunião | Proposta | Negociação  */
/*  | Ganho | Perdido                                  */
/*  Sizes: sm (9px) | md (10px)                        */
/*  Colors ONLY in badges — never in CTAs              */
/*  SEPARATE from StatusBadge (financial) and          */
/*  ProductionStageBadge (production)                  */
/* ═══════════════════════════════════════════════════ */

export type LeadStage =
  | "novo"
  | "contato"
  | "reuniao"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export type LeadStageBadgeSize = "sm" | "md";

export const leadStageConfig: Record<
  LeadStage,
  { label: string; cls: string; clsDark: string; dot: string }
> = {
  novo: {
    label: "Novo",
    cls: "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]",
    clsDark: "bg-[#2C2C2E] text-[#AEAEB2] border-[#3C3C43]",
    dot: "bg-[#D1D1D6]",
  },
  contato: {
    label: "Contato",
    cls: "bg-[#F2F2F7] text-[#5B8AD6] border-[#E5E5EA]",
    clsDark: "bg-[#1A222E] text-[#5B8AD6] border-[#2C3A4E]",
    dot: "bg-[#007AFF]",
  },
  reuniao: {
    label: "Reunião",
    cls: "bg-[#F2F2F7] text-[#8B5CF6] border-[#E5E5EA]",
    clsDark: "bg-[#2A1A3A] text-[#8B5CF6] border-[#3A2A4E]",
    dot: "bg-[#7C3AED]",
  },
  proposta: {
    label: "Proposta",
    cls: "bg-[#F2F2F7] text-[#C48A06] border-[#E5E5EA]",
    clsDark: "bg-[#2E2A1A] text-[#C48A06] border-[#3E3A2A]",
    dot: "bg-[#FF9500]",
  },
  negociacao: {
    label: "Negociação",
    cls: "bg-[#F2F2F7] text-[#D4702E] border-[#E5E5EA]",
    clsDark: "bg-[#2E1A10] text-[#D4702E] border-[#3E2A1A]",
    dot: "bg-[#EA580C]",
  },
  ganho: {
    label: "Ganho",
    cls: "bg-[#F2F2F7] text-[#3D9A5E] border-[#E5E5EA]",
    clsDark: "bg-[#1A2E1C] text-[#3D9A5E] border-[#2A3E2C]",
    dot: "bg-[#34C759]",
  },
  perdido: {
    label: "Perdido",
    cls: "bg-[#F2F2F7] text-[#C75B5B] border-[#E5E5EA]",
    clsDark: "bg-[#3A1A18] text-[#C75B5B] border-[#4A2A28]",
    dot: "bg-[#FF3B30]",
  },
};

interface LeadStageBadgeProps {
  stage: LeadStage;
  size?: LeadStageBadgeSize;
  showDot?: boolean;
}

export function LeadStageBadge({
  stage,
  size = "sm",
  showDot = false,
}: LeadStageBadgeProps) {
  const { isDark } = useDk();
  const cfg = leadStageConfig[stage];
  const sizeClass =
    size === "sm"
      ? "px-1.5 py-[1px] text-[9px] rounded-md"
      : "px-2 py-[2px] text-[10px] rounded-lg";

  return (
    <span
      className={`inline-flex items-center gap-1 border ${isDark ? cfg.clsDark : cfg.cls} ${sizeClass}`}
      style={{ fontWeight: 600 }}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      )}
      {cfg.label}
    </span>
  );
}