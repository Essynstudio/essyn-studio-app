import { forwardRef, type ReactNode } from "react";
import { PRIMARY_CTA, SECONDARY_CTA } from "../../lib/apple-style";

/* ═══════════════════════════════════════════════════════════════ */
/*  CTAButton — Apple Premium Call-to-Action                      */
/*                                                                 */
/*  Primary: bg System Blue #007AFF (max 1 per visual zone).      */
/*  Secondary: ghost with hairline border.                         */
/*  Both: rounded-xl, 13px Inter Medium, active scale(0.98).      */
/* ═══════════════════════════════════════════════════════════════ */

type CTAVariant = "primary" | "secondary";

export interface CTAButtonProps {
  /** Button label */
  label: string;
  /** Icon before label */
  icon?: ReactNode;
  /** Visual variant */
  variant?: CTAVariant;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** HTML type attribute */
  type?: "button" | "submit" | "reset";
  /** Border radius (default: 12) */
  radius?: number;
  /** Extra className */
  className?: string;
}

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(
  function CTAButton(
    {
      label,
      icon,
      variant = "primary",
      onClick,
      disabled = false,
      type = "button",
      radius = 12,
      className = "",
    },
    ref,
  ) {
    const base = variant === "primary" ? PRIMARY_CTA : SECONDARY_CTA;

    return (
      <button
        ref={ref}
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`${base} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
        style={{ fontWeight: 500, borderRadius: radius }}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  },
);
