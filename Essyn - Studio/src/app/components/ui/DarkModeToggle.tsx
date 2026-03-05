/**
 * DarkModeToggle — Sun/Moon toggle button
 *
 * Compact icon button for toggling dark mode.
 * Animates between Sun and Moon icons.
 *
 * Apple Premium design, zero transparency rule.
 */
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";
import { springToggle } from "../../lib/motion-tokens";

export function DarkModeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggle } = useDk();

  return (
    <button
      onClick={toggle}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
        isDark
          ? "bg-[#3A3A3C] text-[#FFD60A] hover:bg-[#48484A]"
          : "bg-[#F2F2F7] text-[#FF9500] hover:bg-[#E5E5EA]"
      } ${className}`}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={springToggle}
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
            transition={springToggle}
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}