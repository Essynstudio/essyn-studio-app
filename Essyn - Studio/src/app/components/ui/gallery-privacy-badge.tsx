/* ═══════════════════════════════════════════════════ */
/*  GalleryPrivacyBadge — Privacy / access level      */
/*  Público | Privado | Senha | Expira                */
/*  Sizes: sm (9px) | md (10px)                       */
/*  Colors ONLY in badges — never in CTAs             */
/* ═══════════════════════════════════════════════════ */

import { Globe, Lock, KeyRound, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

export type GalleryPrivacy = "publico" | "privado" | "senha" | "expira";
export type GalleryPrivacySize = "sm" | "md";

export const privacyConfig: Record<GalleryPrivacy, { label: string; cls: string; clsDark: string; dot: string; icon: ReactNode }> = {
  publico: {
    label: "Público",
    cls: "bg-[#F2F8F4] text-[#34C759] border-[#D4EDDB]",
    clsDark: "bg-[#1A2E1C] text-[#34C759] border-[#2A3E2C]",
    dot: "bg-[#34C759]",
    icon: <Globe className="w-2.5 h-2.5" />,
  },
  privado: {
    label: "Privado",
    cls: "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]",
    clsDark: "bg-[#2C2C2E] text-[#AEAEB2] border-[#3C3C43]",
    dot: "bg-[#D1D1D6]",
    icon: <Lock className="w-2.5 h-2.5" />,
  },
  senha: {
    label: "Senha",
    cls: "bg-[#F2F8F4] text-[#34C759] border-[#D4EDDB]",
    clsDark: "bg-[#1A2E1C] text-[#34C759] border-[#2A3E2C]",
    dot: "bg-[#34C759]",
    icon: <KeyRound className="w-2.5 h-2.5" />,
  },
  expira: {
    label: "Expira",
    cls: "bg-[#FBF5F4] text-[#FF3B30] border-[#F2DDD9]",
    clsDark: "bg-[#3A1A18] text-[#FF3B30] border-[#4A2A28]",
    dot: "bg-[#FF3B30]",
    icon: <Timer className="w-2.5 h-2.5" />,
  },
};

interface GalleryPrivacyBadgeProps {
  privacy: GalleryPrivacy;
  size?: GalleryPrivacySize;
  showIcon?: boolean;
}

export function GalleryPrivacyBadge({
  privacy,
  size = "sm",
  showIcon = true,
}: GalleryPrivacyBadgeProps) {
  const { isDark } = useDk();
  const cfg = privacyConfig[privacy];
  const sizeClass = size === "sm"
    ? "px-1.5 py-[1px] text-[9px] gap-1 rounded-md"
    : "px-2 py-[2px] text-[10px] gap-1.5 rounded-lg";

  return (
    <span
      className={`inline-flex items-center border ${isDark ? cfg.clsDark : cfg.cls} ${sizeClass}`}
      style={{ fontWeight: 600 }}
    >
      {showIcon && <span className="shrink-0">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}