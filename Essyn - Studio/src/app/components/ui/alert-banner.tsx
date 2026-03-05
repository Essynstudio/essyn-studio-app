import type { ReactNode } from "react";
import { X, ChevronRight, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springFadeIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  AlertBanner — Apple Premium Inline Banner         */
/*  Typographic. 2px left accent hairline.            */
/*  Small outline icon. No filled circles, no cards,  */
/*  no shadows. Pure inline signal.                   */
/* ═══════════════════════════════════════════════════ */

export type AlertBannerVariant = "danger" | "warning" | "info";

interface AlertBannerProps {
  title: string;
  desc?: string;
  cta?: () => void;
  ctaLabel?: string;
  variant?: AlertBannerVariant;
  icon?: ReactNode;
  compact?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const ACCENT: Record<AlertBannerVariant, string> = {
  danger: "#FF3B30",
  warning: "#FF9500",
  info: "#007AFF",
};

const ICON_COLOR: Record<AlertBannerVariant, string> = {
  danger: "#FF3B30",
  warning: "#CC7700",
  info: "#007AFF",
};

const IconMap: Record<AlertBannerVariant, typeof AlertCircle> = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertBanner({
  title,
  desc,
  cta,
  ctaLabel,
  variant = "danger",
  compact = false,
  dismissible = false,
  onDismiss,
}: AlertBannerProps) {
  const { isDark } = useDk();
  const isClickable = !!cta;
  const IconComponent = IconMap[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={springFadeIn}
        onClick={isClickable ? cta : undefined}
        className={`group/banner transition-colors duration-150 ${
          isClickable
            ? isDark
              ? "cursor-pointer hover:bg-[#1C1C1E] active:bg-[#2C2C2E]"
              : "cursor-pointer hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"
            : ""
        }`}
        style={{ borderRadius: 8 }}
      >
        <div
          className={`flex items-start gap-2.5 ${
            compact ? "py-2 pl-3.5" : "py-2.5 pl-4"
          } pr-2`}
        >
          {/* Left accent hairline — 2px */}
          <div
            className="self-stretch shrink-0 rounded-full"
            style={{ width: 2, background: ACCENT[variant] }}
          />

          {/* Small outline icon */}
          <IconComponent
            className={`shrink-0 mt-[2px] ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`}
            style={{ color: ICON_COLOR[variant] }}
          />

          {/* Text */}
          <div className="flex flex-col gap-0 flex-1 min-w-0">
            <span
              className={`${compact ? "text-[12px]" : "text-[13px]"} ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
              style={{ fontWeight: 500, lineHeight: 1.45 }}
            >
              {title}
            </span>
            {desc && (
              <span
                className={`${compact ? "text-[11px]" : "text-[12px]"} ${isDark ? "text-[#636366]" : "text-[#8E8E93]"} line-clamp-2`}
                style={{ fontWeight: 400, lineHeight: 1.5 }}
              >
                {desc}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 pt-[1px]">
            {ctaLabel && cta && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cta();
                }}
                className={`shrink-0 flex items-center gap-0.5 ${
                  compact ? "text-[11px]" : "text-[12px]"
                } ${isDark ? "text-[#AEAEB2] hover:text-[#D1D1D6] active:text-[#F5F5F7]" : "text-[#636366] hover:text-[#48484A] active:text-[#1D1D1F]"} transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] rounded px-1.5 py-0.5`}
                style={{ fontWeight: 500 }}
              >
                {ctaLabel}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {!ctaLabel && isClickable && (
              <ChevronRight
                className={`w-3.5 h-3.5 ${isDark ? "text-[#3C3C43] group-hover/banner:text-[#636366]" : "text-[#D1D1D6] group-hover/banner:text-[#8E8E93]"} transition-colors duration-200`}
              />
            )}
            {dismissible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss?.();
                }}
                className={`shrink-0 flex items-center justify-center ${
                  compact ? "w-5 h-5" : "w-6 h-6"
                } rounded-lg ${isDark ? "text-[#3C3C43] hover:text-[#636366] active:text-[#8E8E93]" : "text-[#D1D1D6] hover:text-[#8E8E93] active:text-[#636366]"} transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]`}
                aria-label="Fechar alerta"
              >
                <X className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}