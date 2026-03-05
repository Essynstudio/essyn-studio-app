import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, User, Image, TrendingUp, Tag, Filter } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { useDk } from "../../lib/useDarkColors";

interface FilterState {
  status: V2GalleryStatus[];
  privacy: V2GalleryPrivacy[];
  dateRange: { start: string; end: string };
  photoCountMin: number;
  photoCountMax: number;
  viewsMin: number;
  cliente: string;
  tipo: string[];
}

interface AdvancedFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function AdvancedFilterPanel({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: AdvancedFilterPanelProps) {
  const dk = useDk();
  const statusOptions: { value: V2GalleryStatus; label: string; color: string }[] = [
    { value: "draft", label: "Rascunho", color: "#D1D1D6" },
    { value: "proofing", label: "Aprovação", color: "#FF9500" },
    { value: "final", label: "Final", color: "#34C759" },
    { value: "delivered", label: "Entregue", color: "#007AFF" },
  ];

  const privacyOptions: { value: V2GalleryPrivacy; label: string; color: string }[] = [
    { value: "publico", label: "Público", color: "#34C759" },
    { value: "senha", label: "Senha", color: "#FF9500" },
    { value: "privado", label: "Privado", color: "#8E8E93" },
    { value: "expira", label: "Expira", color: "#FF3B30" },
  ];

  const tipoOptions = [
    { value: "wedding", label: "Casamento" },
    { value: "portrait", label: "Ensaio" },
    { value: "corporate", label: "Corporativo" },
    { value: "event", label: "Evento" },
    { value: "newborn", label: "Newborn" },
    { value: "maternity", label: "Gestante" },
  ];

  function toggleArrayValue<T>(array: T[], value: T): T[] {
    return array.includes(value) ? array.filter((v) => v !== value) : [...array, value];
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.privacy.length > 0 ||
    filters.tipo.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.photoCountMin > 0 ||
    filters.viewsMin > 0 ||
    filters.cliente;

  return (
    <AnimatePresence>
      {open && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[#1D1D1F]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-full max-w-md flex flex-col"
            style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: dk.border }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                  <Filter className="w-5 h-5 text-[#007AFF]" />
                </div>
                <div>
                  <h2 className="text-[18px]" style={{ fontWeight: 700, color: dk.textSecondary }}>
                    Filtros avançados
                  </h2>
                  {hasActiveFilters && (
                    <p className="text-[11px] text-[#007AFF]" style={{ fontWeight: 600 }}>
                      {[
                        filters.status.length && `${filters.status.length} status`,
                        filters.privacy.length && `${filters.privacy.length} privacidade`,
                        filters.tipo.length && `${filters.tipo.length} tipos`,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: dk.bgMuted }}
              >
                <X className="w-4 h-4" style={{ color: dk.textTertiary }} />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-6">
                {/* Status */}
                <FilterSection icon={<Tag className="w-4 h-4" />} label="Status">
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => {
                      const isActive = filters.status.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              status: toggleArrayValue(filters.status, option.value),
                            })
                          }
                          className="px-3 py-2 rounded-lg border text-[12px] transition-all cursor-pointer"
                          style={{
                            fontWeight: 600,
                            backgroundColor: isActive ? option.color : "transparent",
                            borderColor: isActive ? "transparent" : dk.border,
                            color: isActive ? "#FFFFFF" : dk.textSecondary,
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Privacy */}
                <FilterSection icon={<Tag className="w-4 h-4" />} label="Privacidade">
                  <div className="flex flex-wrap gap-2">
                    {privacyOptions.map((option) => {
                      const isActive = filters.privacy.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              privacy: toggleArrayValue(filters.privacy, option.value),
                            })
                          }
                          className="px-3 py-2 rounded-lg border text-[12px] transition-all cursor-pointer"
                          style={{
                            fontWeight: 600,
                            backgroundColor: isActive ? option.color : "transparent",
                            borderColor: isActive ? "transparent" : dk.border,
                            color: isActive ? "#FFFFFF" : dk.textSecondary,
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Tipo */}
                <FilterSection icon={<Image className="w-4 h-4" />} label="Tipo de galeria">
                  <div className="flex flex-wrap gap-2">
                    {tipoOptions.map((option) => {
                      const isActive = filters.tipo.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              tipo: toggleArrayValue(filters.tipo, option.value),
                            })
                          }
                          className="px-3 py-2 rounded-lg border text-[12px] transition-all cursor-pointer"
                          style={{
                            fontWeight: 600,
                            backgroundColor: isActive ? "#007AFF" : "transparent",
                            borderColor: isActive ? "#007AFF" : dk.border,
                            color: isActive ? "#FFFFFF" : dk.textSecondary,
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Date Range */}
                <FilterSection icon={<Calendar className="w-4 h-4" />} label="Período">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ fontWeight: 500, color: dk.textTertiary }}>
                        De
                      </label>
                      <input
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            dateRange: { ...filters.dateRange, start: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all cursor-pointer"
                        style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ fontWeight: 500, color: dk.textTertiary }}>
                        Até
                      </label>
                      <input
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            dateRange: { ...filters.dateRange, end: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all cursor-pointer"
                        style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                      />
                    </div>
                  </div>
                </FilterSection>

                {/* Photo Count */}
                <FilterSection icon={<Image className="w-4 h-4" />} label="Número de fotos">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ fontWeight: 500, color: dk.textTertiary }}>
                        Mínimo
                      </label>
                      <input
                        type="number"
                        value={filters.photoCountMin || ""}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            photoCountMin: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all"
                        style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ fontWeight: 500, color: dk.textTertiary }}>
                        Máximo
                      </label>
                      <input
                        type="number"
                        value={filters.photoCountMax || ""}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            photoCountMax: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="∞"
                        className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all"
                        style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                      />
                    </div>
                  </div>
                </FilterSection>

                {/* Views */}
                <FilterSection icon={<TrendingUp className="w-4 h-4" />} label="Visualizações">
                  <input
                    type="number"
                    value={filters.viewsMin || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        viewsMin: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Mínimo de visualizações"
                    className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all"
                    style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                  />
                </FilterSection>

                {/* Cliente */}
                <FilterSection icon={<User className="w-4 h-4" />} label="Cliente">
                  <input
                    type="text"
                    value={filters.cliente}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        cliente: e.target.value,
                      })
                    }
                    placeholder="Nome do cliente"
                    className="w-full px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-none focus-visible:border-[#007AFF] transition-all"
                    style={{ fontWeight: 400, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                  />
                </FilterSection>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-5 border-t" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
              <button
                onClick={onReset}
                className="flex-1 px-4 py-3 rounded-xl border text-[13px] transition-all cursor-pointer"
                style={{ fontWeight: 600, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
              >
                Limpar tudo
              </button>
              <button
                onClick={() => {
                  onApply();
                  onClose();
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] transition-all cursor-pointer"
                style={{ fontWeight: 600 }}
              >
                Aplicar filtros
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
}

function FilterSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const dk = useDk();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="text-[#007AFF]">{icon}</div>
        <span className="text-[12px]" style={{ fontWeight: 600, color: dk.textSecondary }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}