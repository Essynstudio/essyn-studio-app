import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  AvailabilityPill — Saturday availability indicator */
/*  Variants: livre / ocupado / pre_reserva            */
/*  Fields: data curta + estado                         */
/*  Sizes: sm (compact list) | md (default)             */
/*  Colors only in pill — never in CTAs                 */
/*  Ref: Apple Calendar availability + Calendly slots   */
/* ═══════════════════════════════════════════════════ */

export type AvailabilityStatus = "livre" | "ocupado" | "pre_reserva";

export interface AvailabilityPillData {
  /** Short date display (e.g., "Sáb 07") */
  date: string;
  /** Status */
  status: AvailabilityStatus;
  /** Optional tooltip / extra info */
  detail?: string;
}

interface AvailabilityPillProps {
  data: AvailabilityPillData;
  /** Size variant */
  size?: "sm" | "md";
  /** Click handler */
  onClick?: (data: AvailabilityPillData) => void;
}

/* ── Status config ── */

const statusConfig: Record<
  AvailabilityStatus,
  {
    label: string;
    dot: string;
    text: string;
    border: string;
    borderDark: string;
    hoverBg: string;
    hoverBgDark: string;
  }
> = {
  livre: {
    label: "Livre",
    dot: "bg-[#34C759]",
    text: "text-[#34C759]",
    border: "border-[#E5E5EA]",
    borderDark: "border-[#2C2C2E]",
    hoverBg: "hover:bg-[#FAFAFA]",
    hoverBgDark: "hover:bg-[#1C1C1E]",
  },
  ocupado: {
    label: "Ocupado",
    dot: "bg-[#FF3B30]",
    text: "text-[#FF3B30]",
    border: "border-[#E5E5EA]",
    borderDark: "border-[#2C2C2E]",
    hoverBg: "hover:bg-[#FAFAFA]",
    hoverBgDark: "hover:bg-[#1C1C1E]",
  },
  pre_reserva: {
    label: "Pré-reserva",
    dot: "bg-[#FF9500]",
    text: "text-[#FF9500]",
    border: "border-[#E5E5EA]",
    borderDark: "border-[#2C2C2E]",
    hoverBg: "hover:bg-[#FAFAFA]",
    hoverBgDark: "hover:bg-[#1C1C1E]",
  },
};

export function AvailabilityPill({
  data,
  size = "md",
  onClick,
}: AvailabilityPillProps) {
  const { isDark } = useDk();
  const cfg = statusConfig[data.status];
  const isSm = size === "sm";

  const pill = (
    <span
      className={`inline-flex items-center gap-1.5 border transition-colors ${cfg.text} ${isDark ? cfg.borderDark : cfg.border} ${
        onClick ? `cursor-pointer ${isDark ? cfg.hoverBgDark : cfg.hoverBg}` : ""
      } ${
        isSm
          ? "px-2 py-[2px] text-[10px] rounded-lg gap-1"
          : "px-2.5 py-1 text-[11px] rounded-xl"
      }`}
      style={{ fontWeight: 500 }}
      title={data.detail}
    >
      <span
        className={`rounded-full shrink-0 ${cfg.dot} ${
          isSm ? "w-1 h-1" : "w-1.5 h-1.5"
        }`}
      />
      <span className="numeric" style={{ fontWeight: 400 }}>
        {data.date}
      </span>
      <span className={isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}>|</span>
      <span style={{ fontWeight: 600 }}>{cfg.label}</span>
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={() => onClick(data)}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 rounded-xl"
      >
        {pill}
      </button>
    );
  }

  return pill;
}

export { statusConfig as availabilityStatusConfig };