import {
  Clock,
  AlertCircle,
  CalendarClock,
  Ban,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  NextActionPill — CRM next-action urgency pill     */
/*  Variants: hoje | amanha | atrasado | sem_data     */
/*  Sizes: xs (8px) | sm (9px)                         */
/*  Colors ONLY in pills — never in CTAs               */
/* ═══════════════════════════════════════════════════ */

export type NextActionVariant = "hoje" | "amanha" | "atrasado" | "sem_data";
export type NextActionPillSize = "xs" | "sm";

const nextActionConfig: Record<
  NextActionVariant,
  { label: string; icon: ReactNode; cls: string; clsDark: string }
> = {
  hoje: {
    label: "Hoje",
    icon: <Clock className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#C48A06] border-[#E5E5EA]",
    clsDark: "bg-[#2E2A1A] text-[#C48A06] border-[#3E3A2A]",
  },
  amanha: {
    label: "Amanhã",
    icon: <CalendarClock className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#5B8AD6] border-[#E5E5EA]",
    clsDark: "bg-[#1A222E] text-[#5B8AD6] border-[#2C3A4E]",
  },
  atrasado: {
    label: "Atrasado",
    icon: <AlertCircle className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#C75B5B] border-[#E5E5EA]",
    clsDark: "bg-[#3A1A18] text-[#C75B5B] border-[#4A2A28]",
  },
  sem_data: {
    label: "Sem data",
    icon: <Ban className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]",
    clsDark: "bg-[#2C2C2E] text-[#AEAEB2] border-[#3C3C43]",
  },
};

interface NextActionPillProps {
  variant: NextActionVariant;
  size?: NextActionPillSize;
  /** Override the label text (e.g. "24 Fev") */
  label?: string;
  showIcon?: boolean;
}

export function NextActionPill({
  variant,
  size = "sm",
  label,
  showIcon = true,
}: NextActionPillProps) {
  const { isDark } = useDk();
  const cfg = nextActionConfig[variant];
  const sizeClass =
    size === "xs"
      ? "px-1 py-px text-[8px] gap-0.5 rounded"
      : "px-1.5 py-[1px] text-[9px] gap-1 rounded-md";

  return (
    <span
      className={`inline-flex items-center border ${isDark ? cfg.clsDark : cfg.cls} ${sizeClass}`}
      style={{ fontWeight: 500 }}
    >
      {showIcon && (
        <span className="shrink-0 [&>svg]:w-2.5 [&>svg]:h-2.5">
          {cfg.icon}
        </span>
      )}
      {label || cfg.label}
    </span>
  );
}

export { nextActionConfig };