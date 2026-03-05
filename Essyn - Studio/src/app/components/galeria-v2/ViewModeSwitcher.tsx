import { motion } from "motion/react";
import { Grid3x3, List, Calendar, LayoutGrid } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

export type ViewMode = "grid" | "list" | "timeline" | "masonry";

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitcher({ currentMode, onChange }: ViewModeSwitcherProps) {
  const dk = useDk();
  const modes: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: "grid", icon: <Grid3x3 className="w-4 h-4" />, label: "Grade" },
    { id: "list", icon: <List className="w-4 h-4" />, label: "Lista" },
    { id: "timeline", icon: <Calendar className="w-4 h-4" />, label: "Linha do tempo" },
    { id: "masonry", icon: <LayoutGrid className="w-4 h-4" />, label: "Masonry" },
  ];

  return (
    <div
      className="relative flex items-center p-1 rounded-xl border"
      style={{ backgroundColor: dk.bgMuted, borderColor: dk.border }}
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className="relative z-10 flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer"
            style={{
              fontWeight: isActive ? 600 : 500,
              color: isActive ? dk.textPrimary : dk.textTertiary,
            }}
            title={mode.label}
          >
            {mode.icon}
            <span className="text-[12px] hidden md:inline">{mode.label}</span>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeViewMode"
                className="absolute inset-0 rounded-lg"
                style={{ zIndex: -1, backgroundColor: dk.bg, boxShadow: dk.shadowCard, border: `1px solid ${dk.border}` }}
                transition={{ type: "tween", duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}