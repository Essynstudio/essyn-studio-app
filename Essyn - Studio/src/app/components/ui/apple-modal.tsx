import { type ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { C, RADIUS } from "../../lib/apple-style";
import { springDrawerIn } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  AppleModal — Apple Premium Centered Modal                     */
/*  ─────────────────────────────────────────────────────────────  */
/*  Surface: white, radius 16, shadow whispered.                  */
/*  Overlay: #1D1D1F at opacity 0.4.                              */
/*  Header: 15/600 title + optional subtitle + close btn.         */
/*  Footer: optional action bar, top-hairline.                    */
/*  ESC closes. Body scroll locked. Zero transparency.            */
/*                                                                 */
/*  Rules:                                                         */
/*  - Max 1 primary CTA (blue) per modal footer.                  */
/*  - Keep content concise: prefer list/form, not dense text.     */
/*  - Use size "sm" for confirmations, "md" for forms,            */
/*    "lg" for complex editors.                                    */
/*  - Always provide a clear title.                                */
/*  - Footer actions: cancel left, confirm right.                  */
/* ═══════════════════════════════════════════════════════════════ */

type ModalSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
};

export interface AppleModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal title (15/600) */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Modal size */
  size?: ModalSize;
  /** Body content */
  children: ReactNode;
  /** Footer slot (action buttons) */
  footer?: ReactNode;
  /** Hide the close button */
  hideClose?: boolean;
  /** Prevent closing on overlay click */
  persistent?: boolean;
}

export function AppleModal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  hideClose = false,
  persistent = false,
}: AppleModalProps) {
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
        <>
          {/* Overlay */}
          <motion.div
            key="apple-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#1D1D1F] z-[9998]"
            onClick={persistent ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apple-modal-title"
          >
            <motion.div
              key="apple-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={springDrawerIn}
              className={`relative ${isDark ? "bg-[#141414]" : "bg-white"} w-full ${SIZE_MAP[size]} flex flex-col max-h-[calc(100vh-80px)] overflow-hidden`}
              style={{
                borderRadius: RADIUS.xl,
                boxShadow: isDark
                  ? `0 1px 3px #000000, 0 4px 16px #000000`
                  : `0 1px 3px ${C.separatorDark}, 0 4px 16px ${C.separatorDark}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h2
                    id="apple-modal-title"
                    className={`text-[15px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"} tracking-[-0.01em] truncate`}
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
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] ${
                      isDark
                        ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]"
                        : "text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7]"
                    }`}
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className={`shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}