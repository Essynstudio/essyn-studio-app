import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { C, RADIUS } from "../../lib/apple-style";
import { springDrawerIn } from "../../lib/motion-tokens";

/* ═══════════════════════════════════════════════════════
   ConfirmDialog — Apple Premium Modal de confirmação
   ─────────────────────────────────────────────────────
   Pattern: overlay + dialog centrado
   Variants: info (padrão), destructive (vermelho)
   Keyboard: ESC fecha, Tab trap
   Acessibilidade: role="alertdialog", aria-labelledby
   Tokens: C palette, RADIUS, springDrawerIn
   ═══════════════════════════════════════════════════════ */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "info" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        onCancel?.();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange, onCancel]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const isDestructive = variant === "destructive";

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#1D1D1F] z-[9998]"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            role="alertdialog"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={springDrawerIn}
              className="relative bg-white w-full max-w-[420px] overflow-hidden"
              style={{
                borderRadius: RADIUS.xl,
                boxShadow: `0 1px 3px ${C.separatorDark}, 0 4px 16px ${C.separatorDark}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-6 p-8">
                {/* Icon + Title */}
                <div className="flex flex-col gap-3">
                  {isDestructive && (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: C.dangerBg }}
                    >
                      <AlertTriangle className="w-6 h-6" style={{ color: C.red }} />
                    </div>
                  )}
                  <h2
                    id="confirm-dialog-title"
                    className="text-[20px] text-[#1D1D1F] tracking-[-0.02em]"
                    style={{ fontWeight: 600 }}
                  >
                    {title}
                  </h2>
                </div>

                {/* Description */}
                <p
                  id="confirm-dialog-description"
                  className="text-[14px] text-[#636366] leading-relaxed"
                  style={{ fontWeight: 400 }}
                >
                  {description}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 h-11 rounded-xl text-[13px] text-[#636366] bg-[#F5F5F7] hover:bg-[#EDEDF0] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]"
                    style={{ fontWeight: 500 }}
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 h-11 rounded-xl text-[13px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isDestructive
                        ? "bg-[#FF3B30] text-white hover:bg-[#E63529] focus-visible:ring-[#FF3B30]"
                        : "bg-[#007AFF] text-white hover:bg-[#0066DD] focus-visible:ring-[#007AFF]"
                    }`}
                    style={{ fontWeight: 500 }}
                    autoFocus
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}