// ═══════════════════════════════════════════════
// ESSYN STUDIO — Motion Tokens
// Rule: type "spring" ALWAYS (except spinners)
// ═══════════════════════════════════════════════

export const springDefault = { type: "spring" as const, stiffness: 300, damping: 26 };
export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 28 };
export const springGentle = { type: "spring" as const, stiffness: 300, damping: 24 };
export const springStiff = { type: "spring" as const, stiffness: 380, damping: 32 };
export const springBounce = { type: "spring" as const, stiffness: 500, damping: 20 };
export const springToggle = { type: "spring" as const, stiffness: 500, damping: 30 };

// Composites
export const springContentIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: springDefault,
};

export const springFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { ...springGentle, stiffness: 200 },
};

export const springPopoverIn = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -4 },
  transition: springSnappy,
};

export const springDrawerIn = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: springStiff,
};

export const springModalIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: springSnappy,
};

export const springCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: springDefault,
};

export const springOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const springMarketing = { type: "spring" as const, stiffness: 200, damping: 22 };

// Exception: only non-spring, for spinners
export const linearSpin = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: "linear" },
};

// Page transition wrapper
export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: springDefault,
};
