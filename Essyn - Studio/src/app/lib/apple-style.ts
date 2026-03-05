/* ═══════════════════════════════════════════════════════════════ */
/*  Apple Premium — Shared Design Tokens for ESSYN                */
/*  ─────────────────────────────────────────────────────────────  */
/*  All system screens import from here for visual consistency.   */
/*  Zero transparency rule: no rgba(), no hex alpha, no /[0.x].   */
/*  Only CSS opacity property when needed.                         */
/* ═══════════════════════════════════════════════════════════════ */

import type React from "react";

/* ── Color Palette (Apple HIG 2026) ── */
export const C = {
  /* Text hierarchy */
  primary: "#1D1D1F",
  secondaryDark: "#3C3C43",
  secondary: "#48484A",
  tertiary: "#636366",
  quaternary: "#8E8E93",
  muted: "#AEAEB2",
  placeholder: "#C7C7CC",
  disabled: "#D1D1D6",

  /* Surfaces & separators */
  separator: "#F2F2F7",
  separatorDark: "#E5E5EA",
  hoverBg: "#FAFAFA",
  pressedBg: "#F5F5F7",
  activeBg: "#EDEDF0",
  systemBg: "#F5F5F7",
  surface: "#FFFFFF",

  /* Accent — surgical usage */
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  purple: "#AF52DE",

  /* Status (whispered) */
  dangerBg: "#FBF5F4",
  dangerText: "#FF3B30",
  dangerBorder: "#F2DDD9",
  warningBg: "#FAF7F0",
  warningText: "#FF9500",
  warningBorder: "#EFEAD8",
  infoBg: "#F4F7FB",
  infoText: "#7DA2D4",
  infoBorder: "#DCE7F3",
  successBg: "#F2F8F4",
  successText: "#34C759",
  successBorder: "#D4EDDB",
} as const;

/* ── Spacing Scale (px) ── */
export const SPACE = {
  /** 4px  — micro gaps (icon-text) */
  xs: 4,
  /** 8px  — tight gaps */
  sm: 8,
  /** 12px — compact padding */
  md: 12,
  /** 16px — standard padding */
  lg: 16,
  /** 20px — card internal padding */
  xl: 20,
  /** 24px — section gaps */
  xxl: 24,
  /** 32px — page-level padding (ContentSlot) */
  page: 32,
} as const;

/* ── Border Radius Scale ── */
export const RADIUS = {
  /** 6px  — badges, chips, small elements */
  xs: 6,
  /** 8px  — inputs, inline banners */
  sm: 8,
  /** 10px — search bars, tags */
  md: 10,
  /** 12px — buttons, compact cards, popovers */
  lg: 12,
  /** 16px — secondary cards, modals */
  xl: 16,
  /** 20px — primary widget cards */
  xxl: 20,
  /** 9999px — pills */
  full: 9999,
} as const;

/* ── Typography Scale (fontWeight as inline style) ── */
export const TYPE = {
  /** Page title: 28px / 700 / -0.025em */
  pageTitle: { size: 28, weight: 700, tracking: "-0.025em" },
  /** Section title: 15px / 600 / -0.01em */
  sectionTitle: { size: 15, weight: 600, tracking: "-0.01em" },
  /** Body/row primary: 13px / 500 */
  body: { size: 13, weight: 500 },
  /** Subtitle/secondary: 12px / 400 */
  subtitle: { size: 12, weight: 400 },
  /** Caption: 11px / 400-500 */
  caption: { size: 11, weight: 400 },
  /** Micro label: 10px / 500 */
  micro: { size: 10, weight: 500 },
  /** Large metric value: 26px / 600 / -0.02em */
  metric: { size: 26, weight: 600, tracking: "-0.02em" },
  /** Compact metric value: 18px / 600 / -0.02em */
  metricCompact: { size: 18, weight: 600, tracking: "-0.02em" },
} as const;

/* ── Focus Ring ── */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]";

export const FOCUS_RING_BLUE =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2";

/* ── Widget Material (Apple card) ── */
export const WIDGET_STYLE: React.CSSProperties = {
  borderRadius: 20,
  boxShadow: "0 0.5px 1px #E5E5EA, 0 1px 3px #E5E5EA",
};

export const WIDGET_SHADOW = "0 0.5px 1px #E5E5EA, 0 1px 3px #E5E5EA";

/* Smaller cards (12-16px radius) */
export const CARD_STYLE: React.CSSProperties = {
  borderRadius: 16,
  boxShadow: WIDGET_SHADOW,
};

/* Popover / dropdown */
export const POPOVER_STYLE: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: "0 4px 16px #E5E5EA",
};

/* Modal / dialog — minimal elevation, no glow */
export const MODAL_SHADOW = "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA";
export const MODAL_SHADOW_DARK = "0 1px 3px #000000, 0 4px 16px #000000";

export const MODAL_STYLE: React.CSSProperties = {
  borderRadius: 16,
  boxShadow: MODAL_SHADOW,
};

/* ── Interactive class patterns ── */

/** Link/action text — ghost with chevron */
export const LINK_CLS =
  "flex items-center gap-0.5 text-[13px] text-[#8E8E93] hover:text-[#48484A] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] rounded px-1.5 py-0.5 active:bg-[#F5F5F7]";

/** Quick action pill (icon + text) */
export const PILL_CLS =
  "group flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 transition-all duration-150 cursor-pointer hover:bg-[#F2F2F7] active:bg-[#EDEDF0] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]";

/** Expand / show more button */
export const EXPAND_CLS =
  "flex items-center justify-center gap-1 py-3 text-[12px] text-[#8E8E93] hover:text-[#48484A] hover:bg-[#FAFAFA] active:bg-[#F5F5F7] transition-colors duration-150 cursor-pointer focus-visible:outline-none";

/** Row hover */
export const ROW_HOVER = "transition-colors duration-150 hover:bg-[#FAFAFA] active:bg-[#F5F5F7]";

/** Ghost icon button (28px) */
export const GHOST_BTN =
  "flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]";

/** Primary CTA button (blue accent — max 1 per zone) */
export const PRIMARY_CTA =
  "flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2";

/** Secondary CTA (ghost with border) */
export const SECONDARY_CTA =
  "flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-[#636366] bg-white border border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] active:bg-[#F5F5F7] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]";

/** Hairline separator */
export const HAIRLINE = "h-px bg-[#F2F2F7]";
export const HAIRLINE_DARK = "h-px bg-[#E5E5EA]";

/* ── Section header inside a card ── */
export const SECTION_TITLE =
  "text-[15px] text-[#1D1D1F] tracking-[-0.01em]";
export const SECTION_TITLE_WEIGHT = 600;

export const PAGE_TITLE =
  "text-[28px] text-[#1D1D1F] tracking-[-0.025em]";
export const PAGE_TITLE_WEIGHT = 700;

/* ── Tab patterns ── */
export const TAB_ACTIVE = "text-[#1D1D1F]";
export const TAB_INACTIVE = "text-[#AEAEB2] hover:text-[#8E8E93]";
export const TAB_INDICATOR_COLOR = "#1D1D1F";

/* ── Badge/chip patterns ── */
export const BADGE_NEUTRAL_BG = "#F2F2F7";
export const BADGE_NEUTRAL_TEXT = "#8E8E93";

/* ── Skeleton ── */
export const SKELETON_BG = "#F2F2F7";
export const SKELETON_CLS = "bg-[#F2F2F7] animate-pulse";

/* ═══════════════════════════════════════════════════════════════ */
/*  Transparency → Solid Mapping Reference                         */
/*  ─────────────────────────────────────────────────────────────  */
/*  For #0a0a0a/XX → solid equivalents:                            */
/*    /75 → #48484A   /65 → #48484A   /60 → #636366              */
/*    /55 → #636366   /50 → #8E8E93   /45 → #8E8E93              */
/*    /40 → #8E8E93   /35 → #AEAEB2   /30 → #AEAEB2              */
/*    /25 → #C7C7CC   /20 → #D1D1D6   /15 → #D1D1D6              */
/*    /10 → #E5E5EA   /8  → #E5E5EA                               */
/*    /[0.04] → #F2F2F7   /[0.03] → #F5F5F7                      */
/*    /[0.02] → #FAFAFA                                            */
/*  For solid #0a0a0a → #1D1D1F (primary text)                    */
/*  For hover:bg-[#1a1a1a] → hover:bg-[#48484A]                  */
/*                                                                  */
/*  For #16A34A/70 → #48B877  (green value text)                  */
/*  For #DC2626/60 → #E86B6B  (red value text)                    */
/*  For #2563EB/60 → #6F92F1  (blue suggestion text)              */
/*  For #2563EB/30 → #A1BDF7  (blue light)                        */
/*  For #EFF6FF/30 → #F5F5F7  (blue bg tint)                      */
/* ═══════════════════════════════════════════════════════════════ */