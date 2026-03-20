// ═══════════════════════════════════════════════
// ESSYN STUDIO — Design Tokens
// Apple HIG 2026 · Ultra-Minimal
// ═══════════════════════════════════════════════

// Spacing scale (px)
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  page: 32,
} as const;

// Border radius scale (px)
export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// ── Utility Patterns ────────────────────────────

export const LINK_CLS =
  "text-[var(--info)] hover:opacity-80 transition-opacity";

export const PILL_CLS =
  "px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-[-0.01em]";

// Ghost icon button — for close/action icons
export const GHOST_BTN =
  "p-2 rounded-[8px] text-[var(--fg-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--fg-secondary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none";

// Primary CTA — Apple blue, standard system action
export const PRIMARY_CTA =
  "h-11 px-5 rounded-[10px] bg-[var(--info)] text-white text-[13px] font-semibold tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2";

// Secondary CTA — subtle, ghost feel
export const SECONDARY_CTA =
  "h-11 px-4 rounded-[10px] bg-[var(--bg-subtle)] text-[13px] text-[var(--fg-secondary)] font-medium tracking-[-0.01em] hover:bg-[var(--border-subtle)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2";

// Accent CTA — brand orange, sparingly used
export const ACCENT_CTA =
  "h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[13px] font-semibold tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2";

// Input field — Apple form style
export const INPUT_CLS =
  "w-full h-11 px-4 rounded-[10px] border border-[var(--border-field)] bg-[var(--bg-elevated)] text-[16px] sm:text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] disabled:opacity-50 disabled:pointer-events-none transition-[border-color,box-shadow]";

// Input error state — red border
export const INPUT_ERROR_CLS =
  "w-full h-11 px-4 rounded-[10px] border border-[var(--error)] bg-[var(--bg-elevated)] text-[16px] sm:text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--error)]/50 focus:border-[var(--error)] transition-[border-color,box-shadow]";

// Textarea
export const TEXTAREA_CLS =
  "w-full px-4 py-3 rounded-[10px] border border-[var(--border-field)] bg-[var(--bg-elevated)] text-[16px] sm:text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] disabled:opacity-50 disabled:pointer-events-none transition-[border-color,box-shadow] resize-none";

// Select field
export const SELECT_CLS =
  "w-full h-11 px-4 rounded-[10px] border border-[var(--border-field)] bg-[var(--bg-elevated)] text-[16px] sm:text-[13px] text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] disabled:opacity-50 disabled:pointer-events-none transition-[border-color,box-shadow] appearance-none cursor-pointer";

// Label
export const LABEL_CLS =
  "block text-[12px] font-medium text-[var(--fg-secondary)] mb-1.5 tracking-[-0.004em]";

// Row hover (for table/list rows)
export const ROW_HOVER =
  "hover:bg-[var(--card-hover)] transition-colors cursor-pointer";

// Danger CTA — destructive action
export const DANGER_CTA =
  "h-11 px-5 rounded-[10px] bg-[var(--error)] text-white text-[13px] font-semibold tracking-[-0.01em] hover:opacity-88 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[var(--error)] focus-visible:ring-offset-2";

// Stat number — for KPI values
export const STAT_VALUE =
  "text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums";

// Stat label — for KPI labels
export const STAT_LABEL =
  "text-[11px] font-medium text-[var(--fg-muted)] mt-1.5";

// Section title — uppercase small
export const SECTION_TITLE =
  "text-[12px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.05em]";

// Compact CTA variants — for toolbars, table actions, inline buttons
export const COMPACT_PRIMARY_CTA =
  "h-8 px-3 rounded-[8px] bg-[var(--info)] text-white text-[11px] font-semibold tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 select-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2";

export const COMPACT_SECONDARY_CTA =
  "h-8 px-3 rounded-[8px] bg-[var(--bg-subtle)] text-[11px] text-[var(--fg-secondary)] font-medium tracking-[-0.01em] hover:bg-[var(--border-subtle)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 select-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2";
