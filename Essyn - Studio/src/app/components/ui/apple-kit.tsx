/* ═══════════════════════════════════════════════════════════════ */
/*  Apple Premium KIT — Barrel Export (Source of Truth)            */
/*  ─────────────────────────────────────────────────────────────  */
/*  Import everything from here for Apple Premium consistency:     */
/*                                                                 */
/*  import {                                                       */
/*    WidgetCard, WidgetSkeleton, WidgetEmptyState,               */
/*    WidgetErrorState, WidgetHairline,                            */
/*    HeaderWidget, SectionHeader, ListRow,                        */
/*    ActionPill, ActionPillGroup,                                 */
/*    MetricsStrip, InlineBanner,                                  */
/*    CTAButton, ConfirmDialog,                                    */
/*    AppleModal, AppleDrawer, AppleToaster,                       */
/*    AppleTable, AppleTableHeader, AppleTableBody,               */
/*    AppleTableRow, AppleTableHead, AppleTableCell,              */
/*  } from "../ui/apple-kit";                                      */
/*                                                                 */
/*  Tokens: import { C, SPACE, RADIUS, TYPE, ... }                */
/*          from "../../lib/apple-style";                           */
/*                                                                 */
/*  Motion: import { springDefault, springDrawerIn, ... }          */
/*          from "../../lib/motion-tokens";                         */
/* ═══════════════════════════════════════════════════════════════ */

/* ── 1. WidgetCard + states ── */
export {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  WidgetHairline,
  MetricsSkeleton,
} from "./widget-card";
export type { WidgetCardProps } from "./widget-card";

/* ── 2. HeaderWidget ── */
export { HeaderWidget } from "./header-widget";
export type { HeaderWidgetProps } from "./header-widget";

/* ── 3. SectionHeader ── */
export { SectionHeader } from "./section-header";
export type { SectionHeaderProps } from "./section-header";

/* ── 4. ListRow ── */
export { ListRow } from "./list-row";
export type { ListRowProps } from "./list-row";

/* ── 5. ActionPill ── */
export { ActionPill, ActionPillGroup } from "./action-pill";
export type { ActionPillProps, ActionPillGroupProps } from "./action-pill";

/* ── 6. MetricsStrip ── */
export { MetricsStrip } from "./metrics-strip";
export type { MetricsStripProps, MetricSlot } from "./metrics-strip";

/* ── 7. InlineBanner (alias for AlertBanner) ── */
export { InlineBanner } from "./inline-banner";
export type { InlineBannerVariant } from "./inline-banner";

/* ── 8. CTAButton (Primary + Secondary) ── */
export { CTAButton } from "./cta-button";
export type { CTAButtonProps } from "./cta-button";

/* ── 9. ConfirmDialog (Destructive/Info Modal) ── */
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";

/* ── 10. AppleModal (Centered Modal) ── */
export { AppleModal } from "./apple-modal";
export type { AppleModalProps } from "./apple-modal";

/* ── 11. AppleDrawer (Side Panel) ── */
export { AppleDrawer } from "./apple-drawer";
export type { AppleDrawerProps } from "./apple-drawer";

/* ── 12. AppleToaster (Sonner config) ── */
export { AppleToaster } from "./apple-toast";

/* ── 13. AppleTable (Data Table) ── */
export {
  AppleTable,
  AppleTableHeader,
  AppleTableBody,
  AppleTableFooter,
  AppleTableRow,
  AppleTableHead,
  AppleTableCell,
  AppleTableCaption,
} from "./apple-table";

/* ── 14. ShellContext (Page-level shell config) ── */
export { useShellConfig, useShellConfigValue, ShellConfigProvider } from "./ShellContext";
export type { ShellConfig } from "./ShellContext";