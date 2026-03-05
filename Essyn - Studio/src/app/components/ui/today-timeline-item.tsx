import { MapPin, Check, Pencil, X, ChevronRight } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════
   TodayTimelineItem — Apple Premium List Row (Polished)
   ─────────────────────────────────────────────────────
   Unified interactions:
     hover:   bg-[#FAFAFA]
     active:  bg-[#F5F5F7]
     focus:   ring-1 ring-inset ring-[#D1D1D6]
   Color tokens:
     Primary:    #1D1D1F
     Secondary:  #48484A (boosted for meta text legibility)
     Tertiary:   #636366
     Quaternary: #8E8E93
     Muted:      #AEAEB2
     Disabled:   #C7C7CC
   Badge colors — strong ONLY for critical:
     em_andamento: #007AFF (system blue)
     atrasada:     #FF3B30 (system red)
     others:       neutral grays
   ═══════════════════════════════════════════════════════ */

export type TimelineItemTipo = "evento" | "reuniao" | "entrega" | "lembrete";
export type TimelineItemStatus = "pendente" | "em_andamento" | "concluido";

export interface TodayTimelineItemData {
  id: string;
  hora: string;
  titulo: string;
  tipo: TimelineItemTipo;
  status: TimelineItemStatus;
  local?: string;
  cliente?: string;
}

interface TodayTimelineItemProps {
  item: TodayTimelineItemData;
  showConnector?: boolean;
  compact?: boolean;
  onView?: (id: string) => void;
  onMarkDone?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const tipoLabels: Record<TimelineItemTipo, string> = {
  evento: "Evento",
  reuniao: "Reuniao",
  entrega: "Entrega",
  lembrete: "Lembrete",
};

const stateMap: Record<
  TimelineItemStatus,
  {
    dotBg: string;
    dotRing?: string;
    timeColor: string;
    timeWeight: number;
    titleColor: string;
    titleWeight: number;
    titleDecoration?: string;
    labelColor: string;
    statusLabel?: string;
    statusColor?: string;
  }
> = {
  concluido: {
    dotBg: "#D1D1D6",
    timeColor: "text-[#C7C7CC]",
    timeWeight: 400,
    titleColor: "text-[#C7C7CC]",
    titleWeight: 400,
    titleDecoration: "line-through",
    labelColor: "#C7C7CC",
  },
  em_andamento: {
    dotBg: "#007AFF",
    dotRing: "0 0 0 3px #D6EAFF",
    timeColor: "text-[#1D1D1F]",
    timeWeight: 600,
    titleColor: "text-[#1D1D1F]",
    titleWeight: 600,
    labelColor: "#48484A",
    statusLabel: "Agora",
    statusColor: "#007AFF",
  },
  pendente: {
    dotBg: "#D1D1D6",
    timeColor: "text-[#48484A]",
    timeWeight: 500,
    titleColor: "text-[#1D1D1F]",
    titleWeight: 500,
    labelColor: "#8E8E93",
  },
};

/* Unified micro-button for row actions */
const ACTION_BTN =
  "flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]";

export function TodayTimelineItem({
  item,
  compact = false,
  onView,
  onMarkDone,
  onEdit,
  onCancel,
}: TodayTimelineItemProps) {
  const s = stateMap[item.status];
  const isConcluido = item.status === "concluido";
  const { isDark } = useDk();

  return (
    <div
      className={`flex items-start gap-3 group transition-colors duration-150 ${
        compact ? "px-3.5 py-2.5" : "px-5 py-3"
      } ${!isConcluido
        ? isDark ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"
        : ""}`}
    >
      {/* Time */}
      <span
        className={`shrink-0 numeric tracking-[-0.01em] text-right pt-[1px] ${s.timeColor}`}
        style={{ fontWeight: s.timeWeight, fontSize: 13, lineHeight: 1.4, width: 40 }}
      >
        {item.hora}
      </span>

      {/* Dot */}
      <div className="shrink-0 pt-[6px]">
        <div
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: s.dotBg,
            boxShadow: s.dotRing,
            transition: "box-shadow 0.2s ease",
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start gap-2 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[13px] truncate ${s.titleColor}`}
              style={{
                fontWeight: s.titleWeight,
                textDecoration: s.titleDecoration,
                lineHeight: 1.4,
              }}
            >
              {item.titulo}
            </span>
            {s.statusLabel && (
              <span
                className="shrink-0 text-[10px] tracking-[0.02em] uppercase"
                style={{ fontWeight: 600, color: s.statusColor }}
              >
                {s.statusLabel}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-1.5 flex-wrap" style={{ lineHeight: 1.4 }}>
            <span
              className="text-[11px]"
              style={{ color: s.labelColor, fontWeight: 500 }}
            >
              {tipoLabels[item.tipo]}
            </span>
            {item.cliente && (
              <>
                <span className="text-[#D1D1D6] text-[10px]">&middot;</span>
                <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{item.cliente}</span>
              </>
            )}
            {item.local && (
              <>
                <span className="text-[#D1D1D6] text-[10px]">&middot;</span>
                <span className="flex items-center gap-0.5 text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  <MapPin className="w-2.5 h-2.5" />
                  {item.local}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick actions — ghost icons on hover */}
        {!isConcluido && (onMarkDone || onEdit || onCancel || onView) && (
          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {onMarkDone && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkDone(item.id); }}
                className={`${ACTION_BTN} text-[#C7C7CC] hover:text-[#34C759] hover:bg-[#F2F2F7] active:bg-[#EDEDF0]`}
                aria-label="Concluir"
                title="Concluir"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                className={`${ACTION_BTN} text-[#C7C7CC] hover:text-[#636366] hover:bg-[#F2F2F7] active:bg-[#EDEDF0]`}
                aria-label="Editar"
                title="Editar"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(item.id); }}
                className={`${ACTION_BTN} text-[#C7C7CC] hover:text-[#FF3B30] hover:bg-[#F2F2F7] active:bg-[#EDEDF0]`}
                aria-label="Cancelar"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {onView && !onMarkDone && !onEdit && !onCancel && (
              <button
                onClick={() => onView(item.id)}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] text-[#8E8E93] hover:text-[#48484A] active:bg-[#F5F5F7] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]"
                style={{ fontWeight: 500 }}
              >
                Ver
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const timelineTipoConfig = tipoLabels;
export const timelineStatusConfig = stateMap;