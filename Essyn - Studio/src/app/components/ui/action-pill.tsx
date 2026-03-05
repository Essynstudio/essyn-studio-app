import { type ReactNode } from "react";
import { motion } from "motion/react";
import { springSidebar, withDelay } from "../../lib/motion-tokens";
import { PILL_CLS } from "../../lib/apple-style";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  ActionPill — Apple Premium Quick Action Button                */
/*  Rounded pill with icon + label. Ghost style.                  */
/*  hover: bg #F2F2F7, active: bg #EDEDF0 + scale(0.98).         */
/* ═══════════════════════════════════════════════════════════════ */

export interface ActionPillProps {
  /** Button label */
  label: string;
  /** Icon rendered before the label */
  icon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Stagger delay for entrance animation */
  delay?: number;
  /** Disable the pill */
  disabled?: boolean;
  /** Extra className */
  className?: string;
}

export function ActionPill({
  label,
  icon,
  onClick,
  delay = 0,
  disabled = false,
  className = "",
}: ActionPillProps) {
  const { isDark } = useDk();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springSidebar, delay)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] ${
        isDark
          ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E]"
          : "hover:bg-[#F2F2F7] active:bg-[#EDEDF0]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {icon && (
        <span className={`transition-colors duration-150 ${
          isDark ? "text-[#48484A] group-hover:text-[#8E8E93]" : "text-[#C7C7CC] group-hover:text-[#636366]"
        }`}>
          {icon}
        </span>
      )}
      <span
        className={`text-[13px] transition-colors duration-150 whitespace-nowrap ${
          isDark
            ? "text-[#636366] group-hover:text-[#F5F5F7]"
            : "text-[#8E8E93] group-hover:text-[#1D1D1F]"
        }`}
        style={{ fontWeight: 500 }}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ─── Convenience: group of pills ─── */

export interface ActionPillGroupProps {
  actions: Array<{ label: string; icon?: ReactNode; onClick?: () => void }>;
  /** Base delay for staggered entrance */
  baseDelay?: number;
  className?: string;
}

export function ActionPillGroup({
  actions,
  baseDelay = 0.04,
  className = "",
}: ActionPillGroupProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {actions.map((qa, i) => (
        <ActionPill
          key={qa.label}
          label={qa.label}
          icon={qa.icon}
          onClick={qa.onClick}
          delay={baseDelay + i * 0.03}
        />
      ))}
    </div>
  );
}