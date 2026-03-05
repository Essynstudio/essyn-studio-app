import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TagPill — Apple whispered color                   */
/*  Subtle semantic tinting — readable but quiet      */
/* ═══════════════════════════════════════════════════ */

export type TagVariant = "neutral" | "success" | "warning" | "danger" | "info" | "purple" | "gold";
export type TagSize = "xs" | "sm";

const tagStyles: Record<TagVariant, { text: string; bg: string; bgDark: string }> = {
  neutral: {
    text: "text-[#AEAEB2]",
    bg: "#F5F5F7",
    bgDark: "#2C2C2E",
  },
  success: {
    text: "text-[#34C759]",
    bg: "#F2F8F4",
    bgDark: "#1A2E1C",
  },
  warning: {
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
  },
  danger: {
    text: "text-[#FF3B30]",
    bg: "#FBF5F4",
    bgDark: "#3A1A18",
  },
  info: {
    text: "text-[#7DA2D4]",
    bg: "#F4F7FB",
    bgDark: "#1A222E",
  },
  purple: {
    text: "text-[#AF52DE]",
    bg: "#F5F5F7",
    bgDark: "#2A1A3A",
  },
  gold: {
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
  },
};

export function TagPill({
  children,
  variant = "neutral",
  size = "sm",
}: {
  children: ReactNode;
  variant?: TagVariant;
  size?: TagSize;
}) {
  const { isDark } = useDk();
  const cfg = tagStyles[variant] || tagStyles.neutral;

  const sizeClass = size === "xs"
    ? "px-1 py-px text-[8px] gap-0.5 rounded"
    : "px-1.5 py-[1px] text-[9px] gap-1 rounded-md";

  return (
    <span
      className={`inline-flex items-center ${cfg.text} ${sizeClass}`}
      style={{ fontWeight: 500, background: isDark ? cfg.bgDark : cfg.bg }}
    >
      {children}
    </span>
  );
}