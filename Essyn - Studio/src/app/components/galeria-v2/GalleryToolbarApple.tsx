import { motion } from "motion/react";
import { Search, SlidersHorizontal, Grid3x3, LayoutList, Calendar, LayoutGrid, CheckSquare, X } from "lucide-react";
import type { ViewMode } from "./ViewModeSwitcher";
import { useDk } from "../../lib/useDarkColors";

interface GalleryToolbarAppleProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterToggle: () => void;
  filterCount: number;
  showFilterPanel: boolean;
  isSelectionMode: boolean;
  onSelectionModeToggle: () => void;
}

export function GalleryToolbarApple({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onFilterToggle,
  filterCount,
  showFilterPanel,
  isSelectionMode,
  onSelectionModeToggle,
}: GalleryToolbarAppleProps) {
  const dk = useDk();
  const viewModes: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: "grid",     icon: <Grid3x3 className="w-[14px] h-[14px]" />,    label: "Grade" },
    { id: "list",     icon: <LayoutList className="w-[14px] h-[14px]" />,  label: "Lista" },
    { id: "timeline", icon: <Calendar className="w-[14px] h-[14px]" />,    label: "Linha do tempo" },
    { id: "masonry",  icon: <LayoutGrid className="w-[14px] h-[14px]" />,  label: "Mosaico" },
  ];

  return (
    <div className="flex items-center gap-3 mb-5">
      {/* ── Search ── */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: dk.textSubtle }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar em ESSYN…"
          className="w-full pl-9 pr-9 py-2.5 rounded-[12px] border border-transparent text-[14px] placeholder:text-[#C7C7CC] focus-visible:outline-none transition-all"
          style={{
            fontWeight: 400,
            backgroundColor: dk.bgMuted,
            color: dk.textPrimary,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ backgroundColor: dk.textSubtle }}
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        )}
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── View mode: segmented control ── */}
      <div
        className="flex items-center p-0.5 rounded-[10px] border"
        style={{ backgroundColor: dk.bgMuted, borderColor: dk.border }}
        title="Vista"
      >
        {viewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            title={mode.label}
            className="relative px-2.5 py-1.5 rounded-[8px] cursor-pointer transition-all"
          >
            {viewMode === mode.id && (
              <motion.div
                layoutId="activeViewMode"
                className="absolute inset-0 rounded-[8px] border"
                style={{ backgroundColor: dk.bg, borderColor: dk.border, boxShadow: dk.shadowCard }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <div
              className="relative z-10 transition-colors"
              style={{ color: viewMode === mode.id ? dk.textPrimary : dk.textMuted }}
            >
              {mode.icon}
            </div>
          </button>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="w-px h-6" style={{ backgroundColor: dk.border }} />

      {/* ── Selection mode ── */}
      <motion.button
        onClick={onSelectionModeToggle}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] transition-all cursor-pointer"
        style={{
          fontWeight: 500,
          backgroundColor: isSelectionMode ? dk.textPrimary : "transparent",
          color: isSelectionMode ? (dk.isDark ? "#0A0A0A" : "#FFFFFF") : dk.textSecondary,
        }}
        title="Modo de seleção"
      >
        <CheckSquare className="w-[14px] h-[14px]" />
        <span>{isSelectionMode ? "Cancelar" : "Selecionar"}</span>
      </motion.button>

      {/* ── Filter button ── */}
      <motion.button
        onClick={onFilterToggle}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] transition-all cursor-pointer"
        style={{
          fontWeight: 500,
          backgroundColor: showFilterPanel || filterCount > 0 ? "#007AFF" : "transparent",
          color: showFilterPanel || filterCount > 0 ? "#FFFFFF" : dk.textSecondary,
        }}
      >
        <SlidersHorizontal className="w-[14px] h-[14px]" />
        <span>Filtros</span>
        {filterCount > 0 && (
          <span
            className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px]"
            style={{
              fontWeight: 700,
              backgroundColor: showFilterPanel || filterCount > 0 ? "#FFFFFF" : "#007AFF",
              color: showFilterPanel || filterCount > 0 ? "#007AFF" : "#FFFFFF",
            }}
          >
            {filterCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}