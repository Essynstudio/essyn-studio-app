import { type ReactNode } from "react";
import { ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springSidebar, withDelay, springContentIn } from "../../lib/motion-tokens";
import {
  C,
  WIDGET_STYLE,
  WIDGET_SHADOW,
  LINK_CLS,
  SKELETON_CLS,
} from "../../lib/apple-style";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  WidgetCard — Apple Premium Card Container                     */
/*  Material: white bg, radius 20, imperceptible shadow.          */
/*  Header: title 15/600 + count + "Ver tudo" link.               */
/*  Internal hairlines. Animated entrance via Motion.              */
/* ═══════════════════════════════════════════════════════════════ */

export interface WidgetCardProps {
  /** Section title rendered in the header */
  title?: string;
  /** Numeric count badge next to the title */
  count?: string | number;
  /** Link text in the header (e.g. "Ver tudo") */
  action?: string;
  /** Handler for the header link */
  onAction?: () => void;
  /** Card body */
  children: ReactNode;
  /** Optional footer slot (below body, separated by hairline) */
  footer?: ReactNode;
  /** Stagger delay for entrance animation (seconds) */
  delay?: number;
  /** Extra className on the root element */
  className?: string;
}

export function WidgetCard({
  title,
  count,
  action,
  onAction,
  children,
  footer,
  delay = 0,
  className = "",
}: WidgetCardProps) {
  const { isDark } = useDk();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springSidebar, delay)}
      className={`flex flex-col overflow-hidden ${isDark ? "bg-[#141414]" : "bg-white"} ${className}`}
      style={isDark ? { ...WIDGET_STYLE, boxShadow: "0 0.5px 1px #000000, 0 1px 3px #000000" } : WIDGET_STYLE}
    >
      {title && (
        <>
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-baseline gap-2">
              <h2
                className={`text-[15px] tracking-[-0.01em] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                style={{ fontWeight: 600 }}
              >
                {title}
              </h2>
              {count !== undefined && (
                <span
                  className="text-[13px] text-[#AEAEB2] numeric"
                  style={{ fontWeight: 400 }}
                >
                  {count}
                </span>
              )}
            </div>
            {action && (
              <button
                onClick={onAction}
                className={LINK_CLS}
                style={{ fontWeight: 500 }}
              >
                {action}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
        </>
      )}
      <div className="flex flex-col">{children}</div>
      {footer}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  WidgetSkeleton — Loading state with pulse bars                */
/* ═══════════════════════════════════════════════════════════════ */

function SkeletonLine({ w = "w-3/4", h = "h-3" }: { w?: string; h?: string }) {
  return (
    <div
      className={`${w} ${h} ${SKELETON_CLS}`}
      style={{ borderRadius: 4 }}
    />
  );
}

export function WidgetSkeleton({
  rows = 4,
  withAvatar = false,
  delay = 0,
}: {
  rows?: number;
  withAvatar?: boolean;
  delay?: number;
}) {
  const { isDark } = useDk();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={withDelay(springSidebar, delay)}
      className={`flex flex-col overflow-hidden ${isDark ? "bg-[#141414]" : "bg-white"}`}
      style={isDark ? { ...WIDGET_STYLE, boxShadow: "0 0.5px 1px #000000, 0 1px 3px #000000" } : WIDGET_STYLE}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-2">
          <div className={`w-28 h-4 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />
          <div className={`w-6 h-3.5 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />
        </div>
        <div className={`w-16 h-3.5 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />
      </div>
      <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          {i > 0 && <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />}
          <div className="flex items-start gap-3 px-5 py-3.5">
            {withAvatar && (
              <div className={`w-7 h-7 shrink-0 rounded-full animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} />
            )}
            {!withAvatar && <div className={`w-10 h-3.5 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />}
            <div className="flex-1 flex flex-col gap-2">
              <div className={`${i % 2 === 0 ? "w-4/5" : "w-3/5"} h-3.5 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />
              <div className={`w-2/5 h-2.5 rounded-sm animate-pulse ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`} style={{ borderRadius: 4 }} />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* Metrics-strip skeleton */
export function MetricsSkeleton() {
  const { isDark } = useDk();
  const sepColor = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  const skBg = isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`relative ${
            i < 3 ? `lg:border-r lg:border-[${isDark ? "#2C2C2E" : "#F2F2F7"}]` : ""
          } ${i < 2 ? `border-b lg:border-b-0 border-[${isDark ? "#2C2C2E" : "#F2F2F7"}]` : ""}`}
        >
          <div
            className="flex flex-col gap-2.5 py-4"
            style={{ paddingLeft: 20, paddingRight: 20 }}
          >
            <div className={`w-20 h-2.5 ${skBg} rounded-sm animate-pulse`} />
            <div className={`w-16 h-6 ${skBg} rounded-sm animate-pulse`} />
            <div className={`w-24 h-2.5 ${skBg} rounded-sm animate-pulse`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  WidgetEmptyState — icon + message + optional CTA              */
/* ═══════════════════════════════════════════════════════════════ */

export function WidgetEmptyState({
  icon,
  message,
  cta,
  onCta,
}: {
  icon: ReactNode;
  message: string;
  cta?: string;
  onCta?: () => void;
}) {
  const { isDark } = useDk();

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-2">
      <span className={isDark ? "text-[#48484A]" : "text-[#D1D1D6]"}>{icon}</span>
      <span
        className={`text-[13px] text-center ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
        style={{ fontWeight: 400, lineHeight: 1.5, maxWidth: 220 }}
      >
        {message}
      </span>
      {cta && onCta && (
        <button
          onClick={onCta}
          className={`mt-1 text-[12px] transition-colors duration-150 cursor-pointer focus-visible:outline-none ${
            isDark ? "text-[#636366] hover:text-[#8E8E93]" : "text-[#8E8E93] hover:text-[#48484A]"
          }`}
          style={{ fontWeight: 500 }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  WidgetErrorState — minimal error + retry                      */
/* ═══════════════════════════════════════════════════════════════ */

export function WidgetErrorState({
  message = "Nao foi possivel carregar.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { isDark } = useDk();

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-2.5">
      <AlertTriangle className={`w-5 h-5 ${isDark ? "text-[#48484A]" : "text-[#D1D1D6]"}`} />
      <span
        className={`text-[13px] text-center ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
        style={{ fontWeight: 400, lineHeight: 1.5 }}
      >
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-1.5 mt-0.5 text-[12px] transition-colors duration-150 cursor-pointer focus-visible:outline-none ${
            isDark ? "text-[#636366] hover:text-[#8E8E93]" : "text-[#8E8E93] hover:text-[#48484A]"
          }`}
          style={{ fontWeight: 500 }}
        >
          <RefreshCw className="w-3 h-3" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  WidgetHairline — internal separator                            */
/* ═══════════════════════════════════════════════════════════════ */

export function WidgetHairline({
  indent,
  className = "",
}: {
  /** Left indent in px (e.g. 56 for timeline items) */
  indent?: number;
  className?: string;
}) {
  const { isDark } = useDk();

  return (
    <div
      className={`mr-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"} ${className}`}
      style={indent ? { marginLeft: indent } : { marginLeft: 20, marginRight: 20 }}
    />
  );
}