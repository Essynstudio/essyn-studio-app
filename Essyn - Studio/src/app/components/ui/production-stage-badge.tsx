import type { ReactNode } from "react";
import {
  HardDrive,
  Eye,
  MousePointerClick,
  Palette,
  PackageCheck,
} from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  ProductionStageBadge — Apple whispered color      */
/*  Subtle semantic tint — dot + faint bg + muted text*/
/*  Colors exist but are whispered, never shouted     */
/* ═══════════════════════════════════════════════════ */

export type ProductionStage =
  | "backup"
  | "previa"
  | "selecao"
  | "edicao"
  | "entregue";

export type ProductionStageState =
  | "nao_iniciado"
  | "em_andamento"
  | "aguardando_cliente"
  | "concluido"
  | "atrasado";

export type ProductionStageBadgeSize = "sm" | "md";

/* ── Stage config: icons and labels ── */

const stageConfig: Record<
  ProductionStage,
  { label: string; icon: ReactNode }
> = {
  backup: {
    label: "Backup",
    icon: <HardDrive className="w-2.5 h-2.5" />,
  },
  previa: {
    label: "Prévia",
    icon: <Eye className="w-2.5 h-2.5" />,
  },
  selecao: {
    label: "Seleção",
    icon: <MousePointerClick className="w-2.5 h-2.5" />,
  },
  edicao: {
    label: "Edição",
    icon: <Palette className="w-2.5 h-2.5" />,
  },
  entregue: {
    label: "Entregue",
    icon: <PackageCheck className="w-2.5 h-2.5" />,
  },
};

/* ── State config: whispered semantic colors ── */
/* Muted tones — legible but never loud          */

export const stageStateConfig: Record<
  ProductionStageState,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    bgDark: string;
  }
> = {
  nao_iniciado: {
    label: "Não iniciado",
    dot: "bg-[#D1D1D6]",
    text: "text-[#AEAEB2]",
    bg: "#F5F5F7",
    bgDark: "#2C2C2E",
  },
  em_andamento: {
    label: "Em andamento",
    dot: "bg-[#8E8E93]",
    text: "text-[#636366]",
    bg: "#F5F5F7",
    bgDark: "#2C2C2E",
  },
  aguardando_cliente: {
    label: "Aguardando cliente",
    dot: "bg-[#FF9500]",
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
  },
  concluido: {
    label: "Concluído",
    dot: "bg-[#34C759]",
    text: "text-[#34C759]",
    bg: "#F2F8F4",
    bgDark: "#1A2E1C",
  },
  atrasado: {
    label: "Atrasado",
    dot: "bg-[#FF3B30]",
    text: "text-[#FF3B30]",
    bg: "#FBF5F4",
    bgDark: "#3A1A18",
  },
};

/* ── Component ── */

interface ProductionStageBadgeProps {
  /** Which workflow stage */
  stage: ProductionStage;
  /** Current state of that stage */
  state: ProductionStageState;
  /** sm = 9px (inline/compact), md = 10px (default) */
  size?: ProductionStageBadgeSize;
  /** Show stage icon before label */
  showIcon?: boolean;
  /** Show colored dot before label */
  showDot?: boolean;
  /** Show state label after stage label */
  showState?: boolean;
}

export function ProductionStageBadge({
  stage,
  state,
  size = "sm",
  showIcon = false,
  showDot = false,
  showState = false,
}: ProductionStageBadgeProps) {
  const { isDark } = useDk();
  const s = stageConfig[stage];
  const st = stageStateConfig[state];

  const sizeClass =
    size === "sm"
      ? "px-1.5 py-[1px] text-[9px] rounded-md gap-1"
      : "px-2 py-[2px] text-[10px] rounded-lg gap-1.5";

  return (
    <span
      className={`inline-flex items-center ${st.text} ${sizeClass}`}
      style={{ fontWeight: 500, background: isDark ? st.bgDark : st.bg }}
    >
      {showDot && (
        <span
          className={`w-[5px] h-[5px] rounded-full ${st.dot} shrink-0`}
        />
      )}
      {showIcon && (
        <span className="shrink-0 opacity-60 [&>svg]:w-2.5 [&>svg]:h-2.5">
          {s.icon}
        </span>
      )}
      {s.label}
      {showState && (
        <>
          <span className="opacity-25">·</span>
          <span className="opacity-70">{st.label}</span>
        </>
      )}
    </span>
  );
}

export { stageConfig };