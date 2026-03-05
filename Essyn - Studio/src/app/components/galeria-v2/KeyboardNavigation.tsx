import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Command, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";

interface KeyboardNavigationProps {
  items: Array<{ id: string }>;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  enabled: boolean;
}

export function useKeyboardNavigation({ items, onSelect, onPreview, enabled }: KeyboardNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Show hint on first load
    const timer = setTimeout(() => setShowHint(true), 2000);

    function handleKeyDown(e: KeyboardEvent) {
      // j/k navigation (Vim-style)
      if (e.key === "j" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
        setShowHint(false);
      }

      if (e.key === "k" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        setShowHint(false);
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }

      // Enter to select
      if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        onSelect(items[focusedIndex].id);
      }

      // Space to preview
      if (e.key === " " && focusedIndex >= 0) {
        e.preventDefault();
        onPreview(items[focusedIndex].id);
      }

      // Home/End
      if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
      }

      if (e.key === "End") {
        e.preventDefault();
        setFocusedIndex(items.length - 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [enabled, items, focusedIndex, onSelect, onPreview]);

  return { focusedIndex, showHint, setShowHint };
}

// Hint flutuante
export function KeyboardNavigationHint({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {show && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9998]"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1D1D1F] text-white border border-[#48484A]"
            style={{ boxShadow: "0 12px 40px #48484A" }}
          >
            <Command className="w-4 h-4 text-[#007AFF]" />
            <div className="flex items-center gap-2 text-[11px]" style={{ fontWeight: 500 }}>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[#48484A] border border-[#636366] font-mono">j</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-[#48484A] border border-[#636366] font-mono">k</kbd>
                <span className="text-[#AEAEB2]">Navegar</span>
              </div>
              <span className="text-[#6B6967]">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[#48484A] border border-[#636366] font-mono">↵</kbd>
                <span className="text-[#AEAEB2]">Abrir</span>
              </div>
              <span className="text-[#6B6967]">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[#48484A] border border-[#636366] font-mono">Space</kbd>
                <span className="text-[#AEAEB2]">Preview</span>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="ml-2 w-5 h-5 rounded-full bg-[#48484A] hover:bg-[#636366] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="text-[10px]">✕</span>
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
  );
}

// Focus ring component
export function FocusRing({ isFocused }: { isFocused: boolean }) {
  return (
    <AnimatePresence>
      {isFocused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-[18px] border-2 border-[#007AFF] pointer-events-none z-10"
        />
      )}
    </AnimatePresence>
  );
}