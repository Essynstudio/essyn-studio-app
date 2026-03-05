import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

interface SelectionModeProps {
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function SelectionMode({ isSelectionMode, isSelected, onToggleSelect }: SelectionModeProps) {
  const dk = useDk();
  return (
    <AnimatePresence>
      {isSelectionMode && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-3 left-3 z-20"
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all"
            style={{
              backgroundColor: isSelected ? "#007AFF" : dk.bg,
              borderColor: isSelected ? "#007AFF" : dk.border,
              boxShadow: isSelected ? dk.shadowCard : "none",
            }}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating counter durante seleção
interface SelectionCounterProps {
  count: number;
}

export function SelectionCounter({ count }: SelectionCounterProps) {
  const dk = useDk();
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 right-6 z-[60]"
        >
          <div
            className="px-4 py-2 rounded-full bg-[#007AFF] text-white flex items-center gap-2"
            style={{ boxShadow: dk.shadow }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[13px]" style={{ fontWeight: 700 }}>
              {count} selecionada{count !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}