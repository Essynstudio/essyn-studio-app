/**
 * MaiaFocusChatWrapper — Orchestrates the dimensional shift.
 *
 * When Focus Mode activates:
 *   1. AppContent dissolves (handled by AppLayout)
 *   2. A soft veil rises to cover the old world (z-999)
 *   3. MaiaFocusChat emerges on top (z-1000)
 *
 * The veil matches Maia's background (#F5F5F7) for a seamless,
 * clean transition — no dark flash, no jarring contrast.
 */
import { AnimatePresence, motion } from "motion/react";
import { useMaia } from "./MaiaProvider";
import { MaiaFocusChat } from "./MaiaFocusChat";
import { useDk } from "../../lib/useDarkColors";

export function MaiaFocusChatWrapper() {
  const { isFocusMode } = useMaia();
  const { isDark } = useDk();

  return (
    <AnimatePresence>
      {isFocusMode && (
        /* Soft veil — seamless cover between worlds */
        <motion.div
          key="maia-dimensional-veil"
          className="fixed inset-0 z-[999]"
          style={{ background: isDark ? "#0A0A0A" : "#F5F5F7" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        />
      )}
      {isFocusMode && <MaiaFocusChat key="maia-focus-chat" />}
    </AnimatePresence>
  );
}