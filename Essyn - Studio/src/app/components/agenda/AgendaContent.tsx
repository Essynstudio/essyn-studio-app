import { useState, useMemo, type ReactNode } from "react";
import {
  Ban,
  Calendar,
  CalendarPlus,
  Camera,
  ChevronLeft,
  ChevronRight,
  Gift,
  LoaderCircle,
  Lock,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springFadeIn, springDefault, springSidebar, withDelay } from "../../lib/motion-tokens";
import {
  WIDGET_STYLE,
  GHOST_BTN, FOCUS_RING, SKELETON_CLS,
} from "../../lib/apple-style";
import { useDk } from "../../lib/useDarkColors";
import {
  WidgetCard, WidgetEmptyState, WidgetErrorState, WidgetSkeleton,
  WidgetHairline,
} from "../ui/widget-card";
import { HeaderWidget } from "../ui/header-widget";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import { InlineBanner } from "../ui/inline-banner";
import { toast } from "sonner";

/* ── Data imports ── */
import { type ProjetoTab } from "../../lib/navigation";

/* ── SET 11 Primitives (5/5) ── */
import {
  CalendarViewToggle,
  type CalendarViewId,
} from "../ui/calendar-view-toggle";
import {
  CalendarEventBlock,
  type CalendarEventData,
  type CalendarEventTipo,
  calendarEventTipoConfig,
} from "../ui/calendar-event-block";
import {
  AgendaSidebarPanel,
  type ProximoProjetoData,
  type ChecklistItemData,
} from "../ui/agenda-sidebar-panel";
import { type AvailabilityPillData } from "../ui/availability-pill";
import { SERIF } from "../ui/editorial";
import {
  TodayTimelineItem,
  type TodayTimelineItemData,
} from "../ui/today-timeline-item";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";

/** Internal event type — extends CalendarEventData with date + project link */
interface Evento extends CalendarEventData {
  data: string; // YYYY-MM-DD
  projetoId?: string;
}

/* ═══════════════════════════════════════════════════ */
/*  CONSTANTS                                         */
/* ═══════════════════════════════════════════════════ */

const HOJE = new Date(2026, 1, 22); // 22 Feb 2026 (Sunday)
const HOJE_ISO = "2026-02-22";
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ════════════════════════════════════════════════ */

const mockEventos: Evento[] = [
  {
    id: "ev1",
    titulo: "Sessão pré-wedding Oliveira",
    tipo: "evento",
    data: "2026-02-22",
    hora: "14:00",
    horaFim: "17:00",
    local: "Parque das Mangabeiras",
    cliente: "Ana Oliveira",
    projeto: "Casamento Oliveira & Santos",
    projetoId: "proj-001",
  },
  {
    id: "ev2",
    titulo: "Reunião financeiro — TechCo",
    tipo: "reuniao",
    data: "2026-02-22",
    hora: "18:30",
    horaFim: "19:30",
    local: "Escritório",
    cliente: "TechCo Brasil",
    projeto: "Corporativo TechCo Annual",
    projetoId: "proj-002",
  },
  {
    id: "ev3",
    titulo: "Entrega álbum — Batizado Gabriel",
    tipo: "entrega",
    data: "2026-02-22",
    hora: "10:00",
    horaFim: "10:30",
    cliente: "Pedro Costa",
    projeto: "Batizado Gabriel Costa",
    projetoId: "proj-004",
  },
  {
    id: "ev4",
    titulo: "Casamento Oliveira & Santos",
    tipo: "evento",
    data: "2026-02-28",
    hora: "15:00",
    horaFim: "23:00",
    local: "Espaço Vila Nobre",
    cliente: "Ana Oliveira",
    projeto: "Casamento Oliveira & Santos",
    projetoId: "proj-001",
  },
  {
    id: "ev5",
    titulo: "Ensaio 15 Anos Isabela",
    tipo: "evento",
    data: "2026-02-25",
    hora: "09:00",
    horaFim: "12:00",
    local: "Estúdio Central",
    cliente: "Renata Mendes",
    projeto: "15 Anos Isabela Mendes",
    projetoId: "proj-003",
  },
  {
    id: "ev6",
    titulo: "Bloqueio — Manutenção equipamento",
    tipo: "bloqueio",
    data: "2026-02-24",
    hora: "08:00",
    horaFim: "12:00",
  },
  {
    id: "ev7",
    titulo: "Alinhamento Formatura UFMG",
    tipo: "reuniao",
    data: "2026-02-26",
    hora: "10:00",
    horaFim: "11:00",
    local: "Google Meet",
    cliente: "Carla Dias",
    projeto: "Formatura Direito UFMG",
    projetoId: "proj-006",
  },
  {
    id: "ev8",
    titulo: "Entrega fotos — Ensaio gestante",
    tipo: "entrega",
    data: "2026-02-27",
    hora: "16:00",
    horaFim: "16:30",
    cliente: "Fernanda Lima",
    projeto: "Ensaio Gestante — Família Lima",
    projetoId: "proj-005",
  },
  {
    id: "ev9",
    titulo: "Formatura Direito UFMG — Baile",
    tipo: "evento",
    data: "2026-03-06",
    hora: "20:00",
    horaFim: "04:00",
    local: "Buffet Ouro Fino",
    cliente: "Carla Dias",
    projeto: "Formatura Direito UFMG",
    projetoId: "proj-006",
  },
  {
    id: "ev10",
    titulo: "Ensaio Newborn — Baby Laura",
    tipo: "evento",
    data: "2026-03-02",
    hora: "10:00",
    horaFim: "13:00",
    local: "Estúdio Central",
    cliente: "Juliana Costa",
  },
  {
    id: "ev11",
    titulo: "Lembrete: Enviar contrato Pereira",
    tipo: "lembrete",
    data: "2026-02-23",
    hora: "09:00",
    cliente: "Marcos Pereira",
  },
  {
    id: "ev12",
    titulo: "Reunião equipe — Planejamento Março",
    tipo: "reuniao",
    data: "2026-02-28",
    hora: "09:00",
    horaFim: "10:00",
    local: "Escritório",
  },
];

/** Sidebar: próximo projeto (uses AgendaSidebarPanel primitive) */
const proximoProjeto: ProximoProjetoData = {
  nome: "Casamento Oliveira & Santos",
  cliente: "Ana Oliveira",
  data: "28 Fev 2026",
  diasRestantes: 6,
  local: "Espaço Vila Nobre",
};

/** Sidebar: checklist (uses AgendaSidebarPanel primitive) */
const checklistProjeto: ChecklistItemData[] = [
  { id: "ck1", label: "Contrato assinado", done: true },
  { id: "ck2", label: "Sinal pago (50%)", done: true },
  { id: "ck3", label: "Equipe confirmada", done: true },
  { id: "ck4", label: "Reunião pré-evento", done: false },
  { id: "ck5", label: "Checklist equipamento", done: false },
];

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                           */
/* ═══════════════════════════════════════════════════ */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const start = new Date(baseDate);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Build AvailabilityPillData[] for all Saturdays (uses AvailabilityPill primitive) */
function buildSabadosPillData(year: number, month: number, eventos: Evento[]): AvailabilityPillData[] {
  const dias = getDaysInMonth(year, month);
  const pills: AvailabilityPillData[] = [];
  const mesLabel = MESES[month].slice(0, 3);
  for (let d = 1; d <= dias; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 6) {
      const iso = formatDateISO(year, month, d);
      const temEvento = eventos.some((e) => e.data === iso && e.tipo === "evento");
      const temPreReserva = !temEvento && eventos.some((e) => e.data === iso && e.tipo === "reuniao");
      pills.push({
        date: `Sáb ${String(d).padStart(2, "0")} ${mesLabel}`,
        status: temEvento ? "ocupado" : temPreReserva ? "pre_reserva" : "livre",
      });
    }
  }
  return pills;
}

/** Convert Evento → CalendarEventData for CalendarEventBlock primitive */
function eventoToCalendarEvent(ev: Evento): CalendarEventData {
  return {
    id: ev.id,
    titulo: ev.titulo,
    tipo: ev.tipo,
    hora: ev.hora,
    horaFim: ev.horaFim,
    local: ev.local,
    cliente: ev.cliente,
    projeto: ev.projeto,
  };
}

/** Deep link mapping: tipo → ProjetoDrawer tab */
function getTabForEventType(tipo: CalendarEventTipo): ProjetoTab {
  switch (tipo) {
    case "evento":
    case "reuniao":
    case "lembrete":
      return "cadastro";
    case "entrega":
      return "producao";
    case "bloqueio":
      return "cadastro";
  }
}

/* ═══════════════════════════════════════════════════ */
/*  CALENDAR VIEWS (consume CalendarEventBlock)       */
/* ═══════════════════════════════════════════════════ */

/* ── Month Navigation ── */

function MonthNav({
  year, month, onPrev, onNext, onToday,
}: {
  year: number; month: number; onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-3">
      <h2
        className="text-[16px] min-w-[160px]"
        style={{ fontWeight: 600, color: dk.textSecondary }}
      >
        {MESES[month]} {year}
      </h2>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="Mês anterior"
          className={`${GHOST_BTN}`}
          style={{ color: dk.textMuted }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onToday}
          className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${FOCUS_RING}`}
          style={{ fontWeight: 500, color: dk.textMuted }}
        >
          Hoje
        </button>
        <button
          onClick={onNext}
          aria-label="Próximo mês"
          className={`${GHOST_BTN}`}
          style={{ color: dk.textMuted }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Month Grid — uses CalendarEventBlock compact ── */

function MonthGrid({
  year, month, eventos, selectedDate, onSelectDate, onEventClick,
}: {
  year: number; month: number; eventos: Evento[];
  selectedDate: string | null; onSelectDate: (iso: string) => void;
  onEventClick: (ev: Evento) => void;
}) {
  const dk = useDk();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  const cells: { day: number; inMonth: boolean; iso: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, inMonth: false, iso: formatDateISO(y, m, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, iso: formatDateISO(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, inMonth: false, iso: formatDateISO(y, m, d) });
  }

  return (
    <div className="overflow-hidden" style={{ ...WIDGET_STYLE, backgroundColor: dk.bg, boxShadow: dk.shadowCard }}>
      {/* Header row */}
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px]"
            style={{ fontWeight: 500, color: dk.textMuted }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, ci) => {
          const dayEvents = eventos.filter((e) => e.data === cell.iso);
          const isToday = cell.iso === HOJE_ISO;
          const isSelected = cell.iso === selectedDate;
          const isSaturday = ci % 7 === 6;

          return (
            <div
              key={cell.iso}
              onClick={() => onSelectDate(cell.iso)}
              className="relative flex flex-col items-start gap-0.5 min-h-[88px] p-1.5 transition-colors cursor-pointer"
              style={{
                borderBottom: `1px solid ${dk.hairline}`,
                borderRight: `1px solid ${dk.hairline}`,
                backgroundColor: isSelected ? dk.bgHover : undefined,
                opacity: !cell.inMonth ? 0.3 : 1,
              }}
            >
              <span
                className="w-6 h-6 flex items-center justify-center rounded-full text-[12px] numeric"
                style={{
                  fontWeight: isToday ? 600 : 400,
                  backgroundColor: isToday ? (dk.isDark ? "#F5F5F7" : "#1D1D1F") : undefined,
                  color: isToday
                    ? (dk.isDark ? "#1D1D1F" : "#FFFFFF")
                    : isSaturday && cell.inMonth
                      ? dk.textTertiary
                      : dk.textMuted,
                }}
              >
                {cell.day}
              </span>
              <div className="flex flex-col gap-0.5 w-full min-w-0">
                {dayEvents.slice(0, 2).map((e) => (
                  <CalendarEventBlock
                    key={e.id}
                    event={eventoToCalendarEvent(e)}
                    variant="compact"
                    onClick={e.projetoId ? () => onEventClick(e) : undefined}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <span
                    className="text-[9px] pl-1"
                    style={{ fontWeight: 500, color: dk.textDisabled }}
                  >
                    +{dayEvents.length - 2} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week Grid — uses CalendarEventBlock compact ── */

function WeekGrid({
  baseDate, eventos, selectedDate, onSelectDate, onEventClick,
}: {
  baseDate: Date; eventos: Evento[];
  selectedDate: string | null; onSelectDate: (iso: string) => void;
  onEventClick: (ev: Evento) => void;
}) {
  const dk = useDk();
  const weekDates = getWeekDates(baseDate);
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  return (
    <div className="overflow-hidden" style={{ ...WIDGET_STYLE, backgroundColor: dk.bg, boxShadow: dk.shadowCard }}>
      {/* Header */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
        <div className="p-2" />
        {weekDates.map((d, i) => {
          const iso = formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
          const isToday = iso === HOJE_ISO;
          const isSelected = iso === selectedDate;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(iso)}
              aria-label={`${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`}
              className="flex flex-col items-center gap-0.5 py-2 transition-colors cursor-pointer"
              style={{
                borderLeft: `1px solid ${dk.hairline}`,
                backgroundColor: isSelected ? dk.bgHover : undefined,
              }}
            >
              <span
                className="text-[10px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                {DIAS_SEMANA[d.getDay()]}
              </span>
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-[13px] numeric"
                style={{
                  fontWeight: isToday ? 600 : 400,
                  backgroundColor: isToday ? (dk.isDark ? "#F5F5F7" : "#1D1D1F") : undefined,
                  color: isToday ? (dk.isDark ? "#1D1D1F" : "#FFFFFF") : dk.textTertiary,
                }}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[480px] overflow-y-auto">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="px-2 py-3 text-right" style={{ borderBottom: `1px solid ${dk.hairline}`, borderRight: `1px solid ${dk.hairline}` }}>
                <span
                  className="text-[10px] numeric"
                  style={{ fontWeight: 400, color: dk.textDisabled }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
              {weekDates.map((d, di) => {
                const iso = formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
                const hourEvents = eventos.filter(
                  (e) => e.data === iso && e.hora && parseInt(e.hora.split(":")[0]) === h
                );
                return (
                  <div
                    key={di}
                    className="min-h-[44px] p-0.5 flex flex-col gap-0.5"
                    style={{ borderBottom: `1px solid ${dk.hairline}`, borderLeft: `1px solid ${dk.hairline}` }}
                  >
                    {hourEvents.map((ev) => (
                      <CalendarEventBlock
                        key={ev.id}
                        event={eventoToCalendarEvent(ev)}
                        variant="compact"
                        onClick={ev.projetoId ? () => onEventClick(ev) : undefined}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Day View — uses CalendarEventBlock expanded ── */

function DayView({
  date, eventos, onEventClick,
}: {
  date: Date; eventos: Evento[]; onEventClick: (ev: Evento) => void;
}) {
  const dk = useDk();
  const iso = formatDateISO(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEvents = eventos
    .filter((e) => e.data === iso)
    .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  return (
    <div className="overflow-hidden" style={{ ...WIDGET_STYLE, backgroundColor: dk.bg, boxShadow: dk.shadowCard }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
        <span
          className="w-9 h-9 flex items-center justify-center rounded-full text-[16px] numeric"
          style={{
            fontWeight: 600,
            backgroundColor: iso === HOJE_ISO ? (dk.isDark ? "#F5F5F7" : "#1D1D1F") : undefined,
            color: iso === HOJE_ISO ? (dk.isDark ? "#1D1D1F" : "#FFFFFF") : dk.textTertiary,
          }}
        >
          {date.getDate()}
        </span>
        <div className="flex flex-col">
          <span
            className="text-[13px]"
            style={{ fontWeight: 500, color: dk.textSecondary }}
          >
            {DIAS_SEMANA[date.getDay()]}, {date.getDate()} de {MESES[date.getMonth()]}
          </span>
          <span
            className="text-[11px]"
            style={{ fontWeight: 400, color: dk.textSubtle }}
          >
            {dayEvents.length} evento{dayEvents.length !== 1 && "s"}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[520px] overflow-y-auto">
        {hours.map((h) => {
          const hourEvents = dayEvents.filter(
            (e) => e.hora && parseInt(e.hora.split(":")[0]) === h
          );
          return (
            <div key={h} className="flex" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
              <div className="w-[56px] shrink-0 px-2 py-3 text-right" style={{ borderRight: `1px solid ${dk.hairline}` }}>
                <span
                  className="text-[10px] numeric"
                  style={{ fontWeight: 400, color: dk.textDisabled }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
              <div className="flex-1 min-h-[44px] p-1 flex flex-col gap-1">
                {hourEvents.map((ev) => (
                  <CalendarEventBlock
                    key={ev.id}
                    event={eventoToCalendarEvent(ev)}
                    variant="expanded"
                    onClick={ev.projetoId ? () => onEventClick(ev) : undefined}
                    showCta={!!ev.projetoId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── List View — uses CalendarEventBlock default ── */

function ListView({
  eventos, onEventClick,
}: {
  eventos: Evento[]; onEventClick: (ev: Evento) => void;
}) {
  const dk = useDk();
  const grouped = useMemo(() => {
    const sorted = [...eventos].sort((a, b) => {
      const dc = a.data.localeCompare(b.data);
      if (dc !== 0) return dc;
      return (a.hora || "").localeCompare(b.hora || "");
    });
    const groups: Record<string, Evento[]> = {};
    sorted.forEach((e) => {
      if (!groups[e.data]) groups[e.data] = [];
      groups[e.data].push(e);
    });
    return groups;
  }, [eventos]);

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(grouped).map(([dateStr, evts]) => {
        const d = new Date(dateStr + "T12:00:00");
        const isToday = dateStr === HOJE_ISO;
        return (
          <div key={dateStr} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-1">
              <span
                className="text-[12px]"
                style={{ fontWeight: 500, color: isToday ? dk.textSecondary : dk.textMuted }}
              >
                {DIAS_SEMANA[d.getDay()]}, {d.getDate()} de {MESES[d.getMonth()]}
              </span>
              {isToday && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{
                    fontWeight: 500,
                    backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
                    color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
                  }}
                >
                  Hoje
                </span>
              )}
            </div>
            {evts.map((ev) => (
              <CalendarEventBlock
                key={ev.id}
                event={eventoToCalendarEvent(ev)}
                variant="default"
                onClick={ev.projetoId ? () => onEventClick(ev) : undefined}
                showCta={!!ev.projetoId}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STATE SCREENS                                     */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  const dk = useDk();
  const skelBg = dk.isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  const skelCls = `${skelBg} animate-pulse`;
  return (
    <div className="flex gap-6">
      {/* Calendar skeleton */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-5 rounded ${skelCls}`} style={{ width: 140 }} />
            <div className="flex items-center gap-1">
              {[24, 36, 24].map((w, i) => (
                <div key={i} className={`h-7 rounded-lg ${skelCls}`} style={{ width: w }} />
              ))}
            </div>
          </div>
          <div className={`h-8 rounded-xl ${skelCls}`} style={{ width: 200 }} />
        </div>

        <div className="overflow-hidden" style={{ ...WIDGET_STYLE, backgroundColor: dk.bg, boxShadow: dk.shadowCard }}>
          <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-2 py-2 flex justify-center">
                <div className={`h-3 rounded ${skelCls}`} style={{ width: 24 }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[88px] p-1.5" style={{ borderBottom: `1px solid ${dk.hairline}`, borderRight: `1px solid ${dk.hairline}` }}>
                <div className={`w-6 h-6 rounded-full ${skelCls} mb-1`} />
                {i % 5 === 0 && <div className={`h-4 rounded-md ${skelCls} mb-0.5`} />}
                {i % 7 === 2 && <div className={`h-4 rounded-md ${skelCls}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-4">
          <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} />
          <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
            Carregando agenda...
          </span>
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="w-[280px] shrink-0 flex flex-col gap-4">
        <WidgetSkeleton rows={3} delay={0.1} />
        <WidgetSkeleton rows={2} delay={0.2} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <WidgetEmptyState
      icon={<Calendar className="w-7 h-7" />}
      message="Nenhum evento ou bloqueio agendado neste mês. Crie um evento para organizar sua agenda."
      cta="Novo evento / bloqueio"
      onCta={() => {}}
    />
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <WidgetErrorState
      message="Não foi possível carregar seus eventos. Verifique sua conexão e tente novamente."
      onRetry={onRetry}
    />
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN — AgendaContent                              */
/*  Primitives consumed: CalendarViewToggle,          */
/*  CalendarEventBlock, AgendaSidebarPanel,            */
/*  AvailabilityPill (via AgendaSidebarPanel),         */
/*  TodayTimelineItem                                  */
/* ═══════════════════════════════════════════════════ */

export function AgendaContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projetoId: string, tab?: ProjetoTab) => void;
}) {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [calendarView, setCalendarView] = useState<CalendarViewId>("mes");
  const [currentYear, setCurrentYear] = useState(HOJE.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(HOJE.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(HOJE_ISO);

  function navigatePrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function navigateNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(HOJE.getFullYear());
    setCurrentMonth(HOJE.getMonth());
    setSelectedDate(HOJE_ISO);
  }

  const baseDate = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-").map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(currentYear, currentMonth, 1);
  }, [selectedDate, currentYear, currentMonth]);

  /* ── Deep link: event click → navigate to project with correct tab ── */
  function handleEventClick(ev: Evento) {
    if (ev.projetoId && onNavigateToProject) {
      const tab = getTabForEventType(ev.tipo);
      onNavigateToProject(ev.projetoId, tab);
    }
  }

  /* ── Sidebar: AgendaSidebarPanel data ── */
  const sidebarSabados: AvailabilityPillData[] = useMemo(
    () => buildSabadosPillData(currentYear, currentMonth, mockEventos),
    [currentYear, currentMonth],
  );

  /* ── Today timeline: TodayTimelineItem data ── */
  const todayTimelineItems: TodayTimelineItemData[] = useMemo(
    () =>
      mockEventos
        .filter((e) => e.data === HOJE_ISO && e.hora)
        .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
        .map((e) => ({
          id: e.id,
          hora: e.hora!,
          titulo: e.titulo,
          tipo: (e.tipo === "bloqueio" ? "evento" : e.tipo) as TodayTimelineItemData["tipo"],
          status: "pendente" as const,
          local: e.local,
          cliente: e.cliente,
        })),
    [],
  );

  /* ── Month summary stats (uses calendarEventTipoConfig from CalendarEventBlock) ── */
  const monthPrefix = formatDateISO(currentYear, currentMonth, 1).slice(0, 7);
  const monthStats = useMemo(() => {
    const tipos: { key: CalendarEventTipo; icon: ReactNode; color: string }[] = [
      { key: "evento", icon: <Camera className="w-3 h-3" />, color: "text-[#C4BDD6]" },
      { key: "reuniao", icon: <Users className="w-3 h-3" />, color: "text-[#AEAEB2]" },
      { key: "entrega", icon: <Gift className="w-3 h-3" />, color: "text-[#B8C9AE]" },
      { key: "bloqueio", icon: <Ban className="w-3 h-3" />, color: "text-[#D1D1D6]" },
    ];
    return tipos.map((t) => ({
      label: calendarEventTipoConfig[t.key].label,
      count: mockEventos.filter((e) => e.tipo === t.key && e.data.startsWith(monthPrefix)).length,
      icon: t.icon,
      color: t.color,
    }));
  }, [monthPrefix]);

  /* ── Spring transitions ── */
  const springTransition = springFadeIn;
  const springFade = springDefault;

  /* ── KPI data ── */
  const todayCount = mockEventos.filter((e) => e.data === HOJE_ISO).length;
  const monthTotal = mockEventos.filter((e) => e.data.startsWith(monthPrefix)).length;
  const eventosCount = monthStats.find((s) => s.label === calendarEventTipoConfig.evento.label)?.count ?? 0;
  const blockedCount = monthStats.find((s) => s.label === calendarEventTipoConfig.bloqueio.label)?.count ?? 0;
  const sabadosLivres = sidebarSabados.filter((s) => s.status === "livre").length;

  /* ── Context line ── */
  const contextLine = `${todayCount} compromisso${todayCount !== 1 ? "s" : ""} hoje · ${monthTotal} evento${monthTotal !== 1 ? "s" : ""} em ${MESES[currentMonth]}`;

  /* ── Alert: próximo projeto com checklist incompleta ── */
  const pendingChecklist = checklistProjeto.filter((c) => !c.done).length;
  const [alertDismissed, setAlertDismissed] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══════════════════════════════════════════════ */}
      {/* WIDGET 1 — HEADER (Dashboard pattern)          */}
      {/* ═══════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Agenda"
        userName=""
        contextLine={contextLine}
        quickActions={[
          { label: "Novo evento", icon: <CalendarPlus className="w-4 h-4" />, onClick: () => toast("Novo evento") },
          { label: "Bloqueio", icon: <Lock className="w-4 h-4" />, onClick: () => toast("Novo bloqueio") },
          { label: "Reunião", icon: <Video className="w-4 h-4" />, onClick: () => toast("Nova reunião") },
        ]}
      >
        {/* ─── Alerts (Dashboard pattern) ─── */}
        {!alertDismissed && pendingChecklist > 0 && proximoProjeto.diasRestantes <= 7 && (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <div className="flex flex-col px-2 py-1">
              <InlineBanner
                variant="warning"
                title={`${pendingChecklist} item${pendingChecklist > 1 ? "ns" : ""} pendente${pendingChecklist > 1 ? "s" : ""} para "${proximoProjeto.nome}"`}
                desc={`Evento em ${proximoProjeto.diasRestantes} dias. Revise o checklist de preparação.`}
                ctaLabel="Ver projeto"
                cta={() => onNavigateToProject?.("proj-001", "cadastro")}
                dismissible
                onDismiss={() => setAlertDismissed(true)}
              />
            </div>
          </>
        )}

        {/* ─── KPIs (Dashboard pattern — flat inside HeaderWidget) ─── */}
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
        <DashboardKpiGrid
          flat
          projetos={{
            label: "Hoje",
            value: String(todayCount),
            sub: todayCount > 0 ? `${todayCount} compromisso${todayCount !== 1 ? "s" : ""}` : "dia livre",
          }}
          aReceber={{
            label: "Eventos",
            value: String(eventosCount),
            sub: `${MESES[currentMonth].slice(0, 3)} ${currentYear}`,
          }}
          producao={{
            label: "Sáb. livres",
            value: String(sabadosLivres),
            sub: `de ${sidebarSabados.length} sábado${sidebarSabados.length !== 1 ? "s" : ""}`,
          }}
          compromissos={{
            label: "Total mês",
            value: String(monthTotal),
            sub: blockedCount > 0 ? `${blockedCount} bloqueio${blockedCount !== 1 ? "s" : ""}` : "sem bloqueios",
          }}
        />
      </HeaderWidget>

      {/* ═══════════════════════════════════════════════ */}
      {/* CONTENT — Calendar + Sidebar                    */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springTransition}
          >
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={springTransition}
          >
            <EmptyState />
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={springTransition}
          >
            <ErrorState onRetry={() => setViewState("ready")} />
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springTransition}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* ── Left: Calendar ── */}
              <div className="lg:col-span-8 col-span-1 flex flex-col gap-4">
                {/* Toolbar inside WidgetCard */}
                <WidgetCard delay={0.06}>
                  <div className="flex items-center justify-between px-5 py-3">
                    <MonthNav
                      year={currentYear}
                      month={currentMonth}
                      onPrev={navigatePrev}
                      onNext={navigateNext}
                      onToday={goToToday}
                    />
                    <CalendarViewToggle
                      active={calendarView}
                      onChange={setCalendarView}
                      layoutId="agenda-view-pill"
                    />
                  </div>
                </WidgetCard>

                {/* Calendar view */}
                <AnimatePresence mode="wait">
                  {calendarView === "mes" && (
                    <motion.div
                      key="month"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springFade}
                    >
                      <MonthGrid
                        year={currentYear}
                        month={currentMonth}
                        eventos={mockEventos}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        onEventClick={handleEventClick}
                      />
                    </motion.div>
                  )}
                  {calendarView === "semana" && (
                    <motion.div
                      key="week"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springFade}
                    >
                      <WeekGrid
                        baseDate={baseDate}
                        eventos={mockEventos}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        onEventClick={handleEventClick}
                      />
                    </motion.div>
                  )}
                  {calendarView === "dia" && (
                    <motion.div
                      key="day"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springFade}
                    >
                      <DayView
                        date={baseDate}
                        eventos={mockEventos}
                        onEventClick={handleEventClick}
                      />
                    </motion.div>
                  )}
                  {calendarView === "lista" && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springFade}
                    >
                      <ListView
                        eventos={mockEventos}
                        onEventClick={handleEventClick}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Right: Sidebar ── */}
              <div className="lg:col-span-4 col-span-1 flex flex-col gap-4">
                {/* AgendaSidebarPanel */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={withDelay(springSidebar, 0.1)}
                >
                  <AgendaSidebarPanel
                    proximoProjeto={proximoProjeto}
                    checklist={checklistProjeto}
                    sabados={sidebarSabados}
                    onAbrirProjeto={() => onNavigateToProject?.("proj-001", "cadastro")}
                    variant="compact"
                  />
                </motion.div>

                {/* Today's Timeline */}
                {todayTimelineItems.length > 0 && (
                  <WidgetCard
                    title="Hoje"
                    count={todayTimelineItems.length}
                    delay={0.15}
                  >
                    {todayTimelineItems.map((item, i) => (
                      <div key={item.id}>
                        {i > 0 && <WidgetHairline indent={44} />}
                        <TodayTimelineItem
                          item={item}
                          showConnector={false}
                          compact
                          onView={(id) => {
                            const ev = mockEventos.find((e) => e.id === id);
                            if (ev) handleEventClick(ev);
                          }}
                        />
                      </div>
                    ))}
                  </WidgetCard>
                )}

                {/* Month summary — WidgetCard */}
                <WidgetCard
                  title="Resumo do mês"
                  delay={0.2}
                >
                  {monthStats.map((stat, i) => (
                    <div key={stat.label}>
                      {i > 0 && <WidgetHairline />}
                      <div className="flex items-center justify-between px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={stat.color}>{stat.icon}</span>
                          <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                            {stat.label}
                          </span>
                        </div>
                        <span
                          className="text-[13px] numeric"
                          style={{ fontWeight: 500, color: dk.textSecondary }}
                        >
                          {stat.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </WidgetCard>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}