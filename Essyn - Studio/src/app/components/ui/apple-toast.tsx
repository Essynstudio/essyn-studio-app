import { Toaster as SonnerToaster } from "sonner";
import { C, RADIUS } from "../../lib/apple-style";

/* ═══════════════════════════════════════════════════════════════ */
/*  AppleToaster — Apple Premium Toast Configuration              */
/*  ─────────────────────────────────────────────────────────────  */
/*  Wraps Sonner with Apple Premium visual tokens.                */
/*  Surface: white, radius 12, whispered shadow.                  */
/*  Text: 13px #1D1D1F primary, 12px #8E8E93 description.        */
/*  Zero transparency. Solid borders.                             */
/*                                                                 */
/*  Usage:                                                         */
/*  1. Place <AppleToaster /> once in your App root.              */
/*  2. Fire toasts: `toast("Projeto salvo")`.                     */
/*  3. Variants: toast.success(), toast.error(), toast.info().    */
/*                                                                 */
/*  Rules:                                                         */
/*  - Keep toast text under 60 characters.                         */
/*  - Use toast.success for confirmations, toast.error for fails. */
/*  - Max 1 action per toast (optional).                           */
/*  - Position: bottom-right (default).                            */
/*  - Auto-dismiss: 4s for info, 6s for errors.                   */
/* ═══════════════════════════════════════════════════════════════ */

export function AppleToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          fontFamily:
            '"Inter", "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          borderRadius: RADIUS.lg,
          boxShadow: `0 4px 16px ${C.separatorDark}, 0 1px 3px ${C.separator}`,
          border: `1px solid ${C.separatorDark}`,
          background: C.surface,
          color: C.primary,
          padding: "12px 16px",
        },
        descriptionStyle: {
          fontSize: 12,
          fontWeight: 400,
          color: C.quaternary,
        },
        actionButtonStyle: {
          fontSize: 12,
          fontWeight: 500,
          color: C.blue,
          background: "transparent",
          border: "none",
          padding: "4px 8px",
          borderRadius: RADIUS.xs,
          cursor: "pointer",
        },
        cancelButtonStyle: {
          fontSize: 12,
          fontWeight: 500,
          color: C.quaternary,
          background: "transparent",
          border: "none",
          padding: "4px 8px",
          cursor: "pointer",
        },
      }}
    />
  );
}
