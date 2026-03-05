import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  StatusBadge — Apple whispered color               */
/*  Financial parcel lifecycle states                  */
/*  Subtle tinted bg + muted semantic text             */
/* ═══════════════════════════════════════════════════ */

export type StatusParcela =
  | "prevista"
  | "vence_hoje"
  | "vencida"
  | "paga"
  | "conciliada"
  | "cancelada";

export const statusBadgeConfig: Record<
  StatusParcela,
  { label: string; text: string; bg: string; bgDark: string; dot: string }
> = {
  prevista: {
    label: "Prevista",
    text: "text-[#AEAEB2]",
    bg: "#F2F2F7",
    bgDark: "#2C2C2E",
    dot: "bg-[#D1D1D6]",
  },
  vence_hoje: {
    label: "Vence hoje",
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
    dot: "bg-[#FF9500]",
  },
  vencida: {
    label: "Vencida",
    text: "text-[#FF3B30]",
    bg: "#FBF5F4",
    bgDark: "#3A1A18",
    dot: "bg-[#FF3B30]",
  },
  paga: {
    label: "Paga",
    text: "text-[#34C759]",
    bg: "#F2F2F7",
    bgDark: "#2C2C2E",
    dot: "bg-[#34C759]",
  },
  conciliada: {
    label: "Conciliada",
    text: "text-[#34C759]",
    bg: "#F2F8F4",
    bgDark: "#1A2E1C",
    dot: "bg-[#34C759]",
  },
  cancelada: {
    label: "Cancelada",
    text: "text-[#C7C7CC]",
    bg: "#F5F5F7",
    bgDark: "#2C2C2E",
    dot: "bg-[#D1D1D6]",
  },
};

export type StatusBadgeSize = "sm" | "md";

interface StatusBadgeProps {
  status: StatusParcela;
  /** sm = 9px (inline/compact), md = 10px (default) */
  size?: StatusBadgeSize;
  /** Show colored dot before label */
  showDot?: boolean;
}

export function StatusBadge({ status, size = "sm", showDot = false }: StatusBadgeProps) {
  const { isDark } = useDk();
  const cfg = statusBadgeConfig[status];
  const sizeClass = size === "sm"
    ? "px-1.5 py-[1px] text-[9px] rounded-md"
    : "px-2 py-[2px] text-[10px] rounded-lg";

  return (
    <span
      className={`inline-flex items-center gap-1 ${cfg.text} ${sizeClass}`}
      style={{ fontWeight: 500, background: isDark ? cfg.bgDark : cfg.bg }}
    >
      {showDot && <span className={`w-[5px] h-[5px] rounded-full ${cfg.dot} shrink-0`} />}
      {cfg.label}
    </span>
  );
}