import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  GalleryStatusBadge — Gallery lifecycle states      */
/*  Rascunho → Prévia → Final → Arquivada             */
/*  SEPARATE from StatusBadge (financial lifecycle)    */
/*  Sizes: sm (9px) | md (10px)                        */
/*  Colors ONLY in badges — never in CTAs              */
/* ═══════════════════════════════════════════════════ */

export type GalleryStatus = "rascunho" | "previa" | "final" | "arquivada";
export type GalleryStatusSize = "sm" | "md";

export const galleryStatusConfig: Record<GalleryStatus, { label: string; cls: string; clsDark: string; dot: string }> = {
  rascunho:  { label: "Rascunho",  cls: "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]",  clsDark: "bg-[#2C2C2E] text-[#AEAEB2] border-[#3C3C43]",  dot: "bg-[#D1D1D6]" },
  previa:    { label: "Prévia",    cls: "bg-[#F4F7FB] text-[#007AFF] border-[#DCE7F3]",   clsDark: "bg-[#1A222E] text-[#007AFF] border-[#2C3A4E]",   dot: "bg-[#007AFF]" },
  final:     { label: "Final",     cls: "bg-[#F2F8F4] text-[#34C759] border-[#D4EDDB]",   clsDark: "bg-[#1A2E1C] text-[#34C759] border-[#2A3E2C]",   dot: "bg-[#34C759]" },
  arquivada: { label: "Arquivada", cls: "bg-[#F5F5F7] text-[#AF52DE] border-[#E5E5EA]",   clsDark: "bg-[#2A1A3A] text-[#AF52DE] border-[#3A2A4E]",   dot: "bg-[#AF52DE]" },
};

interface GalleryStatusBadgeProps {
  status: GalleryStatus;
  size?: GalleryStatusSize;
  showDot?: boolean;
}

export function GalleryStatusBadge({
  status,
  size = "sm",
  showDot = false,
}: GalleryStatusBadgeProps) {
  const { isDark } = useDk();
  const cfg = galleryStatusConfig[status];
  const sizeClass = size === "sm"
    ? "px-1.5 py-[1px] text-[9px] rounded-md"
    : "px-2 py-[2px] text-[10px] rounded-lg";

  return (
    <span
      className={`inline-flex items-center gap-1 border ${isDark ? cfg.clsDark : cfg.cls} ${sizeClass}`}
      style={{ fontWeight: 600 }}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />}
      {cfg.label}
    </span>
  );
}