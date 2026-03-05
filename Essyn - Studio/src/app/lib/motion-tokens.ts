/* ═══════════════════════════════════════════════════════════════════ */
/*  ESSYN — Motion Tokens (single source of truth)                   */
/*  All motion transitions MUST use these tokens                     */
/*  Rule: type: "spring" everywhere (no tween)                       */
/*  Exception: spinners use linearSpin (ease: "linear")              */
/* ═══════════════════════════════════════════════════════════════════ */

/* ── Base springs ── */

/** Default spring — content transitions, state switches, tab changes */
export const springDefault = {
  type: "spring" as const,
  damping: 26,
  stiffness: 300,
};

/** Snappy spring — popovers, dropdowns, context menus, tooltips */
export const springSnappy = {
  type: "spring" as const,
  damping: 28,
  stiffness: 400,
};

/** Gentle spring — subtle fades, soft state transitions */
export const springGentle = {
  type: "spring" as const,
  damping: 24,
  stiffness: 300,
};

/** Stiff spring — drawers, overlays, modals */
export const springStiff = {
  type: "spring" as const,
  damping: 32,
  stiffness: 380,
};

/** Sidebar spring — sidebar panels sliding in */
export const springSidebar = {
  type: "spring" as const,
  damping: 30,
  stiffness: 350,
};

/* ── Composite tokens (spring + opacity sub-transition) ── */

/** Content state switch (ready/loading/empty/error), list items, collapsibles */
export const springContentIn = {
  ...springDefault,
  opacity: { duration: 0.12 },
};

/** Fade-heavy content switch — alert banners, bulk bars */
export const springFadeIn = {
  ...springDefault,
  opacity: { duration: 0.15 },
};

/** Popover/dropdown open — snappy with quick opacity */
export const springPopoverIn = {
  ...springSnappy,
  opacity: { duration: 0.1 },
};

/** Gentle state switch — dashboards, patterns */
export const springGentleIn = {
  ...springGentle,
  opacity: { duration: 0.15 },
};

/** Collapse/expand — height animations */
export const springCollapse = {
  type: "spring" as const,
  damping: 28,
  stiffness: 320,
  opacity: { duration: 0.15 },
};

/** Drawer/modal open with stiff spring */
export const springDrawerIn = {
  ...springStiff,
  opacity: { duration: 0.15 },
};

/* ── Intentional exceptions ── */

/** Spinner rotation — the ONLY valid non-spring transition */
export const linearSpin = {
  duration: 1.2,
  repeat: Infinity,
  ease: "linear" as const,
};

/* ── Marketing spring ── */

/** Slightly softer spring for marketing pages */
export const springMarketing = {
  type: "spring" as const,
  stiffness: 200,
  damping: 30,
};

/* ── CRM / overlay spring ── */

/** Fast overlay spring for CRM backdrops */
export const springOverlay = {
  type: "spring" as const,
  damping: 30,
  stiffness: 500,
};

/** Bouncy pop spring — icon/badge pop-in animations */
export const springBounce = {
  type: "spring" as const,
  damping: 15,
  stiffness: 300,
};

/** Toggle switch / pill indicator — very stiff, snaps fast */
export const springToggle = {
  type: "spring" as const,
  damping: 35,
  stiffness: 500,
};

/* ── Helper: add delay to any spring token ── */

export function withDelay<T extends Record<string, unknown>>(
  token: T,
  delay: number,
): T & { delay: number } {
  return { ...token, delay };
}