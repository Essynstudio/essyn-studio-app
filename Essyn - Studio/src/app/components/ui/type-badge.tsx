import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  Clapperboard,
} from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TypeBadge — Apple whispered color                 */
/*  Semantic tint — readable but never loud           */
/*  No double-opacity — color already carries intent  */
/* ═══════════════════════════════════════════════════ */

export type TypeBadgeVariant = "receber" | "pagar" | "alerta" | "fiscal" | "repasse" | "producao";

const typeConfig: Record<
  TypeBadgeVariant,
  { label: string; icon: ReactNode; text: string; bg: string; bgDark: string; dot: string }
> = {
  receber: {
    label: "Receber",
    icon: <ArrowDownRight className="w-2.5 h-2.5" />,
    text: "text-[#34C759]",
    bg: "#F2F8F4",
    bgDark: "#1A2E1C",
    dot: "bg-[#34C759]",
  },
  pagar: {
    label: "Pagar",
    icon: <ArrowUpRight className="w-2.5 h-2.5" />,
    text: "text-[#FF3B30]",
    bg: "#FBF5F4",
    bgDark: "#3A1A18",
    dot: "bg-[#FF3B30]",
  },
  alerta: {
    label: "Alerta",
    icon: <AlertCircle className="w-2.5 h-2.5" />,
    text: "text-[#AEAEB2]",
    bg: "#F5F5F7",
    bgDark: "#2C2C2E",
    dot: "bg-[#C7C7CC]",
  },
  fiscal: {
    label: "Fiscal",
    icon: <FileText className="w-2.5 h-2.5" />,
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
    dot: "bg-[#FF9500]",
  },
  repasse: {
    label: "Repasse",
    icon: <ArrowRightLeft className="w-2.5 h-2.5" />,
    text: "text-[#AF52DE]",
    bg: "#F5F5F7",
    bgDark: "#2A1A3A",
    dot: "bg-[#AF52DE]",
  },
  producao: {
    label: "Produção",
    icon: <Clapperboard className="w-2.5 h-2.5" />,
    text: "text-[#7DA2D4]",
    bg: "#F4F7FB",
    bgDark: "#1A222E",
    dot: "bg-[#7DA2D4]",
  },
};

interface TypeBadgeProps {
  variant: TypeBadgeVariant;
  /** Show icon before label */
  showIcon?: boolean;
  /** Show only dot + label (more compact) */
  dotOnly?: boolean;
}

export function TypeBadge({
  variant,
  showIcon = true,
  dotOnly = false,
}: TypeBadgeProps) {
  const { isDark } = useDk();
  const cfg = typeConfig[variant];

  if (dotOnly) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[9px] ${cfg.text}`}
        style={{ fontWeight: 500 }}
      >
        <span className={`w-[5px] h-[5px] rounded-full ${cfg.dot} shrink-0`} />
        {cfg.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md text-[9px] ${cfg.text}`}
      style={{ fontWeight: 500, background: isDark ? cfg.bgDark : cfg.bg }}
    >
      {showIcon && cfg.icon}
      {cfg.label}
    </span>
  );
}

export { typeConfig };