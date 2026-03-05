import { type ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { C } from "../../lib/apple-style";
import { springDrawerIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  AppleDrawer — Apple Premium Side Panel                        */
/*  ─────────────────────────────────────────────────────────────  */
/*  Slides from right. Full height. Max-width 520px.              */
/*  Overlay: #1D1D1F at opacity 0.4.                              */
/*  Header: title 17/600 + subtitle + close btn, hairline below.  */
/*  Footer: optional action bar with hairline above.              */
/*  ESC closes. Body scroll locked. Zero transparency.            */
/*                                                                 */
/*  Rules:                                                         */
/*  - Header always visible (shrink-0). Body scrolls.             */
/*  - Footer sticks at bottom for primary actions.                 */
/*  - Max 1 primary CTA per footer zone.                          */
/*  - Use for detail views, forms, configuration panels.           */
/*  - For tab-based drawers, manage tabs in the body.             */
/* ═══════════════════════════════════════════════════════════════ */

type DrawerWidth = "sm" | "md" | "lg";

const WIDTH_MAP: Record<DrawerWidth, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
};

export interface AppleDrawerProps {
  /** Controls visibility */
  open: boolean;
  /** Called when drawer should close */
  onClose: () => void;
  /** Drawer title (17/600) */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Drawer width */
  width?: DrawerWidth;
  /** Body content */
  children: ReactNode;
  /** Footer slot (action buttons) */
  footer?: ReactNode;
  /** Header right slot (tabs, badges, actions) */
  headerRight?: ReactNode;
  /** Prevent closing on overlay click */
  persistent?: boolean;
}

export function AppleDrawer({
  open,
  onClose,
  title,
  subtitle,
  width = "md",
  children,
  footer,
  headerRight,
  persistent = false,
}: AppleDrawerProps) {
  const { isDark } = useDk();

  /* Body scroll lock */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ESC to close */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !persistent) onClose();
    },
    [open, onClose, persistent],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex justify-end">
          {/* Overlay */}
          <motion.div
            key="apple-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#1D1D1F]"
            onClick={persistent ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="apple-drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springDrawerIn}
            className={`relative ml-auto w-full ${WIDTH_MAP[width]} ${isDark ? "bg-[#141414]" : "bg-white"} flex flex-col h-full`}
            style={{
              boxShadow: isDark
                ? `0 8px 24px #000000, 0 2px 8px #000000`
                : `0 8px 24px ${C.disabled}, 0 2px 8px ${C.separatorDark}`,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apple-drawer-title"
          >
            {/* Header */}
            <div className={`shrink-0 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
              <div className="flex items-start justify-between px-6 pt-5 pb-4">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <h2
                    id="apple-drawer-title"
                    className={`text-[17px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"} tracking-[-0.01em] truncate`}
                    style={{ fontWeight: 600 }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      className={`text-[12px] ${isDark ? "text-[#636366]" : "text-[#8E8E93]"} truncate`}
                      style={{ fontWeight: 400 }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {headerRight}
                  <button
                    onClick={onClose}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] ${
                      isDark
                        ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]"
                        : "text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7]"
                    }`}
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={`shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t ${
                isDark ? "border-[#2C2C2E] bg-[#141414]" : "border-[#F2F2F7] bg-white"
              }`}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}