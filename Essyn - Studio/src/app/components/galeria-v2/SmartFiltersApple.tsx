import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

interface FilterPill {
  id: string;
  label: string;
  value: string;
  color: string;
  count?: number;
}

interface SmartFiltersAppleProps {
  activeFilters: FilterPill[];
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  onAddFilter: () => void;
}

export function SmartFiltersApple({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  onAddFilter,
}: SmartFiltersAppleProps) {
  const dk = useDk();
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-8">
      {/* Active filters */}
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter) => (
          <motion.div
            key={filter.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="flex items-center gap-2 pl-3.5 pr-2.5 py-2 rounded-full border"
              style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, boxShadow: dk.shadowCard }}
            >
              <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                {filter.label}
              </span>
              {filter.count !== undefined && (
                <span className="text-[11px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                  {filter.count}
                </span>
              )}
              <motion.button
                onClick={() => onRemoveFilter(filter.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: dk.bgActive }}
              >
                <X className="w-2.5 h-2.5" style={{ color: dk.textTertiary }} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Clear all */}
      {activeFilters.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClearAll}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-3 py-2 text-[13px] transition-all cursor-pointer"
          style={{ fontWeight: 500, color: dk.textTertiary }}
        >
          Limpar tudo
        </motion.button>
      )}

      {/* Add filter hint */}
      <motion.button
        onClick={onAddFilter}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
        style={{ backgroundColor: dk.bgActive }}
      >
        <Plus className="w-3.5 h-3.5" style={{ color: dk.textTertiary }} />
      </motion.button>
    </div>
  );
}