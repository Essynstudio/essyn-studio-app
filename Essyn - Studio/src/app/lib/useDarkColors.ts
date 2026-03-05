/* ═══════════════════════════════════════════════════════════════ */
/*  Shared Dark-Mode Color Map                                     */
/*  ─────────────────────────────────────────────────────────────── */
/*  Centralises all dark-vs-light surface / text / border tokens   */
/*  so every content page can `const dk = useDk()` without         */
/*  duplicating the mapping.                                       */
/*  Zero-transparency rule: no rgba / hex-alpha / Tailwind /[0.x]  */
/* ═══════════════════════════════════════════════════════════════ */

import { useDarkMode } from "../components/ui/DarkModeProvider";

export function useDk() {
  const { isDark, toggle, setDark } = useDarkMode();
  return {
    isDark,
    toggle,
    setDark,
    /* Surfaces */
    bg:        isDark ? "#1C1C1E" : "#FFFFFF",
    bgSub:     isDark ? "#141414" : "#FAFAFA",
    bgMuted:   isDark ? "#2C2C2E" : "#F2F2F7",
    bgHover:   isDark ? "#2C2C2E" : "#FAFAFA",
    bgActive:  isDark ? "#3C3C43" : "#F5F5F7",
    bgPage:    isDark ? "#0A0A0A" : "#F5F5F7",
    /* Borders */
    border:    isDark ? "#3C3C43" : "#E5E5EA",
    hairline:  isDark ? "#2C2C2E" : "#F2F2F7",
    /* Text */
    textPrimary:   isDark ? "#F5F5F7" : "#1D1D1F",
    textSecondary: isDark ? "#AEAEB2" : "#636366",
    textTertiary:  isDark ? "#8E8E93" : "#8E8E93",
    textSubtle:    isDark ? "#636366" : "#C7C7CC",
    textDisabled:  isDark ? "#48484A" : "#D1D1D6",
    textMuted:     isDark ? "#AEAEB2" : "#AEAEB2",
    /* Shadows (solid — no alpha) */
    shadow:      isDark ? "0 8px 24px #000000"  : "0 8px 24px #E5E5EA",
    shadowCard:  isDark ? "0 1px 3px #000000"   : "0 1px 3px #E5E5EA",
    shadowModal: isDark ? "0 1px 3px #000000, 0 4px 16px #000000"  : "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA",
    /* Status (dark whispered) */
    dangerBg:    isDark ? "#2C1A1A" : "#FBF5F4",
    dangerBorder: isDark ? "#4A2020" : "#F2DDD9",
    warningBg:   isDark ? "#2C2410" : "#FAF7F0",
    warningBorder: isDark ? "#4A3D18" : "#EFEAD8",
    successBg:   isDark ? "#1A2C1E" : "#F2F8F4",
    successBorder: isDark ? "#204A28" : "#D4EDDB",
    infoBg:      isDark ? "#1A2030" : "#F4F7FB",
    infoBorder:  isDark ? "#203450" : "#DCE7F3",
  } as const;
}

export type DkColors = ReturnType<typeof useDk>;