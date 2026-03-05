// Monochrome Canvas — design tokens & editorial primitives
/**
 * Shared editorial primitives for ESSYN "Monochrome Canvas" identity.
 *
 * Components:
 *   GR          — GSAP scroll-triggered reveal (IntersectionObserver)
 *   SectionNum  — Large watermark number
 *   MagBtn      — Magnetic button with sweep fill
 *   MagLink     — Magnetic Link with sweep fill
 *
 * Tokens:
 *   DISPLAY     — Instrument Serif font stack (editorial display)
 *   SANS        — Inter font stack (UI body)
 *   MONO        — JetBrains Mono font stack (code)
 *   EASE        — Cubic bezier for premium transitions
 *
 *   Legacy aliases: SERIF, SERIF_SWASH → DISPLAY
 *
 * CSS Utilities:
 *   .numeric    — Inter + tabular-nums + lining-nums
 *   .editorial-swash — Instrument Serif decorative first-letter
 *
 * Colors:
 *   BG          — Near-white background (#F5F5F7)
 *   INK         — Deep neutral ink (#1D1D1F)
 *   ACCENT      — System Blue accent (#007AFF) — app context
 *   ACCENT_LIGHT — Light accent (#5AC8FA)
 *   SURFACE     — Subtle surface (#F5F5F7)
 *   BORDER_W    — Neutral border (#E5E5EA)
 *
 *   NOTE: Marketing pages may still use GOLD (#9C8B7A) as brand identity.
 *   App shell + modules MUST use ACCENT (#007AFF).
 */
import { useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import gsap from "gsap";

/* ── Design tokens ── */

export const DISPLAY = "\"Instrument Serif\", Georgia, \"Times New Roman\", serif";
export const SANS = "\"Inter\", \"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", system-ui, sans-serif";
export const MONO = "\"JetBrains Mono\", \"SF Mono\", \"Fira Code\", Menlo, Monaco, Consolas, monospace";
export const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

/* Legacy aliases */
export const SERIF = DISPLAY;
export const SERIF_SWASH = DISPLAY;
export const ROUNDED = SANS;

/* Colors — Apple HIG 2026 */
export const BG = "#F5F5F7";
export const INK = "#1D1D1F";
export const ACCENT = "#007AFF";
export const ACCENT_LIGHT = "#5AC8FA";
export const SURFACE = "#F5F5F7";
export const BORDER_W = "#E5E5EA";

/* Marketing-only brand gold — DO NOT use in app modules */
export const GOLD = "#9C8B7A";
export const GOLD_LIGHT = "#C4B8AB";

/* ══════════════════════════════════════════
   GR — GsapReveal (scroll-triggered)
   ══════════════════════════════════════════ */

interface GRProps {
  children: ReactNode;
  className?: string;
  /** Stagger between [data-g] children (default 0.08) */
  stagger?: number;
  /** Additional delay before animation starts */
  delay?: number;
  /** Custom y-offset (default 24) */
  y?: number;
}

export function GR({ children, className = "", stagger = 0.08, delay = 0, y = 24 }: GRProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const kids = el.querySelectorAll("[data-g]");
    const targets = kids.length > 0 ? kids : [el];

    gsap.set(targets, { y, opacity: 0 });

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(targets, {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger,
            delay,
          });
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [stagger, delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════
   SectionNum — editorial watermark
   ══════════════════════════════════════════ */

interface SectionNumProps {
  n: string;
  className?: string;
}

export function SectionNum({ n, className = "" }: SectionNumProps) {
  return (
    <span
      className={`absolute select-none pointer-events-none text-[clamp(120px,18vw,240px)] tracking-[-0.06em] ${className}`}
      style={{ fontWeight: 800, lineHeight: 1, fontFeatureSettings: "'tnum'", color: "#F2F2F7" }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

/* ══════════════════════════════════════════
   MagBtn — magnetic button (onClick)
   ══════════════════════════════════════════ */

interface MagBtnProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "dark" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
}

export function MagBtn({
  children,
  onClick,
  className = "",
  variant = "dark",
  disabled = false,
  type = "button",
}: MagBtnProps) {
  const base =
    variant === "dark"
      ? "bg-[#1D1D1F] text-white"
      : "bg-white text-[#1D1D1F] border border-[#E5E5EA]";
  const fill = variant === "dark" ? "bg-[#9C8B7A]" : "bg-[#F2F2F7]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center gap-3 text-[15px] px-8 py-4 rounded-full overflow-hidden transition-transform duration-300 active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:cursor-default ${base} ${className}`}
      style={{ fontWeight: 500, transitionTimingFunction: EASE }}
      onMouseEnter={(e) => !disabled && gsap.to(e.currentTarget, { scale: 1.03, duration: 0.3, ease: "power2.out" })}
      onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power2.out" })}
    >
      <span
        className={`absolute inset-0 ${fill} translate-y-full group-hover:translate-y-0 transition-transform duration-500`}
        style={{ transitionTimingFunction: EASE }}
      />
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════
   MagLink — magnetic Link (navigation)
   ══════════════════════════════════════════ */

interface MagLinkProps {
  children: ReactNode;
  to: string;
  className?: string;
  variant?: "dark" | "outline";
}

export function MagLink({ children, to, className = "", variant = "dark" }: MagLinkProps) {
  const base =
    variant === "dark"
      ? "bg-[#1D1D1F] text-white"
      : "bg-white text-[#1D1D1F] border border-[#E5E5EA]";
  const fill = variant === "dark" ? "bg-[#9C8B7A]" : "bg-[#F2F2F7]";

  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center gap-3 text-[15px] px-8 py-4 rounded-full overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97] ${base} ${className}`}
      style={{ fontWeight: 500, transitionTimingFunction: EASE }}
      onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.03, duration: 0.3, ease: "power2.out" })}
      onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power2.out" })}
    >
      <span
        className={`absolute inset-0 ${fill} translate-y-full group-hover:translate-y-0 transition-transform duration-500`}
        style={{ transitionTimingFunction: EASE }}
      />
      {children}
    </Link>
  );
}