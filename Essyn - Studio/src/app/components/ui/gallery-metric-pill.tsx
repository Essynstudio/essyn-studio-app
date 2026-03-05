/* ═══════════════════════════════════════════════════ */
/*  GalleryMetricPill — Compact metric indicators      */
/*  Views | Downloads | Favoritos | Seleções           */
/*  Sizes: xs (8px ultra-compact) | sm (9px default)   */
/*  Colors ONLY in icon tint — text always neutral     */
/* ═══════════════════════════════════════════════════ */

import { Eye, Download, Heart, CheckSquare } from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

export type GalleryMetric = "views" | "downloads" | "favoritos" | "selecoes";
export type GalleryMetricSize = "xs" | "sm";

export const metricConfig: Record<GalleryMetric, { label: string; icon: ReactNode; iconColor: string }> = {
  views:      { label: "Views",      icon: <Eye className="w-2.5 h-2.5" />,         iconColor: "text-[#8E8E93]" },
  downloads:  { label: "Downloads",  icon: <Download className="w-2.5 h-2.5" />,    iconColor: "text-[#34C759]" },
  favoritos:  { label: "Favoritos",  icon: <Heart className="w-2.5 h-2.5" />,       iconColor: "text-[#FF3B30]" },
  selecoes:   { label: "Seleções",   icon: <CheckSquare className="w-2.5 h-2.5" />, iconColor: "text-[#AF52DE]" },
};

interface GalleryMetricPillProps {
  metric: GalleryMetric;
  value: number;
  size?: GalleryMetricSize;
}

export function GalleryMetricPill({
  metric,
  value,
  size = "sm",
}: GalleryMetricPillProps) {
  const { isDark } = useDk();
  const cfg = metricConfig[metric];
  const sizeClass = size === "xs"
    ? "px-1.5 py-px text-[8px] gap-1 rounded"
    : "px-2 py-[2px] text-[9px] gap-1.5 rounded-md";

  return (
    <span
      className={`inline-flex items-center border ${sizeClass} ${isDark ? "bg-[#2C2C2E] border-[#3C3C43]" : "bg-[#F2F2F7] border-[#E5E5EA]"}`}
    >
      <span className={`shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
      <span
        className={`numeric ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
        style={{ fontWeight: 600 }}
      >
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
    </span>
  );
}