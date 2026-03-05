import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { Lock } from "lucide-react";
import { useState, useRef, type ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

export type NavItemState = "default" | "hover" | "active" | "disabled" | "locked";

export interface NavItemProps {
  icon: ReactNode;
  label: string;
  state?: NavItemState;
  badge?: number;
  collapsed?: boolean;
  /** Tooltip reason for disabled/locked state */
  disabledReason?: string;
  /** Standard click — fires for default, hover, active states */
  onClick?: () => void;
  /**
   * Locked click — fires ONLY when state === "locked".
   * Use this to open the PaywallDrawerSheet.
   * Unlike "disabled", "locked" items are interactive.
   */
  onLockedClick?: () => void;
}

const stateStyles: Record<NavItemState, string> = {
  default:
    "text-[#636366] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] cursor-pointer",
  hover: "bg-[#F5F5F7] text-[#1D1D1F] cursor-pointer",
  active: "bg-[#F2F2F7] text-[#1D1D1F]",
  disabled: "text-[#D1D1D6] cursor-not-allowed",
  locked:
    "text-[#8E8E93] hover:bg-[#FAFAFA] hover:text-[#636366] cursor-pointer",
};

const darkStateStyles: Record<NavItemState, string> = {
  default:
    "text-[#8E8E93] hover:bg-[#1C1C1E] hover:text-[#F5F5F7] cursor-pointer",
  hover: "bg-[#1C1C1E] text-[#F5F5F7] cursor-pointer",
  active: "bg-[#1C1C1E] text-[#F5F5F7]",
  disabled: "text-[#48484A] cursor-not-allowed",
  locked:
    "text-[#636366] hover:bg-[#1C1C1E] hover:text-[#8E8E93] cursor-pointer",
};

/* ─── Custom Tooltip ─── */

function Tooltip({
  label,
  badge,
  children,
  disabledReason,
}: {
  label: string;
  badge?: number;
  children: ReactNode;
  disabledReason?: string;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  function handleEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
    setShow(true);
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      className="relative"
    >
      {children}
      {show && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ top: coords.top, left: coords.left, transform: "translateY(-50%)" }}
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1D1D1F] shadow-[0_4px_16px_#E5E5EA] whitespace-nowrap">
            <span
              className="text-[12px] text-[#E5E5EA]"
              style={{ fontWeight: 500 }}
            >
              {label}
            </span>
            {badge !== undefined && badge > 0 && (
              <span
                className="text-[10px] text-[#8E8E93] bg-[#3C3C43] px-1.5 py-0.5 rounded numeric"
                style={{ fontWeight: 500 }}
              >
                {badge}
              </span>
            )}
            {disabledReason && (
              <span
                className="text-[10px] text-[#636366]"
                style={{ fontWeight: 400 }}
              >
                · {disabledReason}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NavItem ─── */

export function NavItem({
  icon,
  label,
  state = "default",
  badge,
  collapsed = false,
  disabledReason,
  onClick,
  onLockedClick,
}: NavItemProps) {
  const isLocked = state === "locked";
  const isDisabled = state === "disabled";
  const showLockIcon = isLocked || isDisabled;
  const { isDark } = useDk();
  const styles = isDark ? darkStateStyles : stateStyles;

  function handleClick() {
    if (isLocked) {
      onClick?.();
    } else if (!isDisabled) {
      onClick?.();
    }
  }

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`group relative flex items-center gap-3 rounded-xl transition-all w-full ${
        collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5 mx-2"
      } ${styles[state]} ${
        collapsed && state === "active" ? (isDark ? "!bg-[#1C1C1E]" : "!bg-[#F2F2F7]") : ""
      }`}
    >
      {/* Active indicator bar */}
      {state === "active" && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full ${isDark ? "bg-[#F5F5F7]" : "bg-[#1D1D1F]"} ${
            collapsed ? "w-[3px] h-5" : "w-[3px] h-4"
          }`}
          transition={springDefault}
        />
      )}

      {/* Icon */}
      <div className={`flex items-center justify-center w-5 h-5 shrink-0 ${
        collapsed && state === "active" ? (isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]") : ""
      }`}>
        {icon}
      </div>

      {/* Label */}
      {!collapsed && (
        <span
          className="text-[13px] flex-1 truncate text-left"
          style={{ fontWeight: state === "active" ? 500 : 400 }}
        >
          {label}
        </span>
      )}

      {/* Badge — expanded: pill counter */}
      {badge !== undefined && badge > 0 && !collapsed && (
        <span
          className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] numeric ${
            isDark ? "bg-[#2C2C2E] text-[#8E8E93]" : "bg-[#F2F2F7] text-[#636366]"
          }`}
          style={{ fontWeight: 600 }}
        >
          {badge}
        </span>
      )}

      {/* Badge — collapsed: dot */}
      {badge !== undefined && badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full bg-red-500" />
      )}

      {/* Lock icon — expanded */}
      {showLockIcon && !collapsed && (
        <Lock className={`w-3 h-3 shrink-0 ${
          isLocked ? "text-[#D1D1D6]" : "text-[#E5E5EA]"
        }`} />
      )}

      {/* Lock icon — collapsed */}
      {showLockIcon && collapsed && (
        <span className="absolute bottom-0.5 right-1 w-[10px] h-[10px] rounded-full bg-[#F2F2F7] flex items-center justify-center">
          <Lock className={`w-[6px] h-[6px] ${
            isLocked ? "text-[#D1D1D6]" : "text-[#E5E5EA]"
          }`} />
        </span>
      )}
    </button>
  );

  // In collapsed mode, wrap with custom tooltip
  if (collapsed) {
    return (
      <Tooltip
        label={label}
        badge={badge}
        disabledReason={showLockIcon ? disabledReason : undefined}
      >
        {button}
      </Tooltip>
    );
  }

  return button;
}