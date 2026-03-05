import { motion } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { GalleryCardApple } from "./GalleryCardApple";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { useDk } from "../../lib/useDarkColors";

interface TimelineCollection {
  id: string;
  nome: string;
  coverUrl?: string;
  photoCount: number;
  status: V2GalleryStatus;
  privacy: V2GalleryPrivacy;
  views: number;
  downloads: number;
  favoritos: number;
  cliente: string;
  dataCriacao: string;
  tipo: string;
  dataEvento?: string;
}

interface TimelineViewProps {
  collections: TimelineCollection[];
  onOpenCollection: (id: string) => void;
  onQuickAction: (id: string, action: "share" | "duplicate" | "archive" | "delete") => void;
  onQuickPreview: (id: string) => void;
}

export function TimelineView({ collections, onOpenCollection, onQuickAction, onQuickPreview }: TimelineViewProps) {
  const dk = useDk();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Agrupa por mês
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, TimelineCollection[]> = {};

    collections.forEach((col) => {
      const date = new Date(col.dataEvento || col.dataCriacao);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(col);
    });

    // Ordena por data descrescente
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.dataEvento || a.dataCriacao).getTime();
        const dateB = new Date(b.dataEvento || b.dataCriacao).getTime();
        return dateB - dateA;
      });
    });

    return groups;
  }, [collections]);

  // Gera meses disponíveis
  const availableMonths = useMemo(() => {
    return Object.keys(groupedByMonth).sort().reverse();
  }, [groupedByMonth]);

  function goToPrevMonth() {
    const currentIndex = availableMonths.indexOf(
      `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`
    );
    if (currentIndex < availableMonths.length - 1) {
      const [year, month] = availableMonths[currentIndex + 1].split("-");
      setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1));
    }
  }

  function goToNextMonth() {
    const currentIndex = availableMonths.indexOf(
      `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`
    );
    if (currentIndex > 0) {
      const [year, month] = availableMonths[currentIndex - 1].split("-");
      setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1));
    }
  }

  const currentKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const currentCollections = groupedByMonth[currentKey] || [];

  const monthName = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      {/* Timeline header */}
      <div className="flex items-center justify-between p-6 rounded-2xl border" style={{ backgroundColor: dk.bgMuted, borderColor: dk.border }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bg }}>
            <Calendar className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div>
            <h2 className="text-[20px] capitalize tracking-[-0.01em]" style={{ fontWeight: 700, color: dk.textPrimary }}>
              {monthName}
            </h2>
            <p className="text-[12px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
              {currentCollections.length} {currentCollections.length === 1 ? "coleção" : "coleções"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            disabled={
              availableMonths.indexOf(currentKey) === availableMonths.length - 1
            }
            className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            style={{ backgroundColor: dk.bg, borderColor: dk.border }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: dk.textSecondary }} />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={availableMonths.indexOf(currentKey) === 0}
            className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            style={{ backgroundColor: dk.bg, borderColor: dk.border }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: dk.textSecondary }} />
          </button>
        </div>
      </div>

      {/* Timeline entries */}
      {currentCollections.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-[14px]" style={{ fontWeight: 400, color: dk.textMuted }}>
            Nenhuma coleção neste mês
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: dk.border }} />

          {/* Entries */}
          <div className="flex flex-col gap-8">
            {currentCollections.map((col, index) => {
              const eventDate = new Date(col.dataEvento || col.dataCriacao);
              const day = eventDate.getDate();

              return (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative flex items-start gap-6"
                >
                  {/* Date badge */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#007AFF] flex items-center justify-center">
                      <span className="text-[18px] text-[#007AFF]" style={{ fontWeight: 700 }}>
                        {day}
                      </span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1">
                    <GalleryCardApple
                      {...col}
                      onClick={() => onOpenCollection(col.id)}
                      onQuickAction={(action) => onQuickAction(col.id, action)}
                      onQuickPreview={() => onQuickPreview(col.id)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}