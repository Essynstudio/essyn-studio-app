"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isAfter,
  parseISO,
  differenceInDays,
  differenceInHours,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  Circle,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Ban,
  FileText,
  CreditCard,
  ChevronRight as ArrowRight,
  Coffee,
  Lock,
  Package,
  Pencil,
  Trash2,
  ExternalLink,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  PageTransition,
  AppleModal,
  StatusBadge,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { useDrawer } from "@/components/drawers/drawer-provider";

type EventStatus = "agendado" | "confirmado" | "concluido" | "cancelado";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  status: EventStatus;
  project_id: string | null;
  all_day: boolean;
  color: string | null;
  google_calendar_event_id: string | null;
  client_google_event_id: string | null;
  created_at: string;
  projects: { id: string; name: string; client_id?: string | null } | null;
}

function syncGoogleCalendar(
  action: "create" | "update" | "delete",
  event?: EventItem,
  googleEventId?: string,
  clientGoogleEventId?: string | null,
  clientId?: string | null
) {
  fetch("/api/integrations/google-calendar/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, event, googleEventId, clientGoogleEventId, clientId }),
  }).catch(() => {});
}

interface ProjectOption {
  id: string;
  name: string;
}

interface NextProject {
  id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  event_location: string | null;
  status: string;
  value: number;
  paid: number;
  team_ids: string[];
  pack_id: string | null;
  clients: { id: string; name: string } | null;
  installments: { id: string; status: string; amount: number }[];
  project_workflows: { id: string; status: string }[];
}

interface AgendaStats {
  todayCount: number;
  monthCount: number;
  saturdays: { date: string; hasEvent: boolean }[];
  monthSummary: { evento: number; reuniao: number; entrega: number; bloqueio: number };
}

const statusConfig: Record<EventStatus, { label: string; color: string; bg: string }> = {
  agendado: { label: "Agendado", color: "var(--info)", bg: "var(--info)" },
  confirmado: { label: "Confirmado", color: "var(--success)", bg: "var(--success)" },
  concluido: { label: "Concluído", color: "var(--fg-muted)", bg: "var(--fg-muted)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error)" },
};

const presetColors = [
  "#2C444D", "#2D7A4F", "#C87A20", "#B84233", "#6B5B8D",
  "#A0566B", "#5A8A96", "#4A6741", "#7A5C3E", "#3D5A80",
];

function getEventColor(title: string, color: string | null): string {
  if (color && color !== "#4285F4") return color;
  const t = title.toLowerCase();
  if (t.includes("casamento") || t.includes("pré wedding") || t.includes("pre wedding") || t.includes("noivado")) return "#EC4899";
  if (t.includes("ensaio")) return "#8B5CF6";
  if (t.includes("reunião") || t.includes("reuniao") || t.includes("meeting")) return "#F97316";
  if (t.includes("bloqueio") || t.includes("indisponível") || t.includes("indisponivel")) return "#EF4444";
  if (t.includes("entrega") || t.includes("álbum") || t.includes("album")) return "#F59E0B";
  if (t.includes("freela") || t.includes("freelance")) return "#6366F1";
  return "#4285F4";
}

function classifyEvent(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("casamento") || t.includes("pré wedding") || t.includes("pre wedding") || t.includes("noivado")) return "casamento";
  if (t.includes("ensaio")) return "ensaio";
  if (t.includes("reunião") || t.includes("reuniao")) return "reuniao";
  if (t.includes("bloqueio") || t.includes("indisponível") || t.includes("indisponivel")) return "bloqueio";
  if (t.includes("entrega") || t.includes("álbum") || t.includes("album")) return "entrega";
  return "outros";
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_TYPE_LABELS: Record<string, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

export function AgendaClient({
  events: initialEvents,
  projects,
  studioId,
  stats,
  nextProject,
}: {
  events: EventItem[];
  projects: ProjectOption[];
  studioId: string;
  stats: AgendaStats;
  nextProject: NextProject | null;
}) {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const [events, setEvents] = useState(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { locale: ptBR }));
  const [activeFilter, setActiveFilter] = useState<"todos" | "casamento" | "ensaio" | "reuniao" | "entrega" | "bloqueio" | "gcal">("todos");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quickType, setQuickType] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<EventItem | null>(null);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<{
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    htmlLink?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  } | null>(null);
  const [googleEventToImport, setGoogleEventToImport] = useState<{
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  } | null>(null);

  // Google Calendar events overlay
  const [googleEvents, setGoogleEvents] = useState<{ id: string; summary?: string; description?: string; location?: string; htmlLink?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }[]>([]);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(true);

  useEffect(() => {
    setGcalLoading(true);
    const timeMin = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const timeMax = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
    fetch(`/api/integrations/google-calendar/fetch-events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.connected) {
          setGcalConnected(true);
          setGoogleEvents(d.events || []);
        } else {
          setGcalConnected(false);
          setGoogleEvents([]);
        }
      })
      .catch(() => {})
      .finally(() => setGcalLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth.getFullYear(), currentMonth.getMonth()]);

  // Filter out Google Calendar events that already exist as Essyn events
  // (synced from Essyn → avoids showing the same event twice)
  const googleEventsFiltered = useMemo(() => {
    const essynGcalIds = new Set(
      events
        .filter(e => e.google_calendar_event_id)
        .map(e => e.google_calendar_event_id)
    );
    return googleEvents.filter(gev => !essynGcalIds.has(gev.id));
  }, [googleEvents, events]);

  const googleEventsByDate = useMemo(() => {
    const map: Record<string, typeof googleEventsFiltered> = {};
    googleEventsFiltered.forEach(ev => {
      const raw = ev.start.date || (ev.start.dateTime ? ev.start.dateTime.split("T")[0] : null);
      if (!raw) return;
      const key = raw.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [googleEventsFiltered]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    events.forEach((ev) => {
      const key = format(parseISO(ev.start_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const today = new Date();

  const todayEvents = useMemo(() => {
    const todayKey = format(today, "yyyy-MM-dd");
    return eventsByDate[todayKey] || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsByDate]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    return events.find((ev) => isAfter(parseISO(ev.start_at), now)) || null;
  }, [events]);

  // Unified stats computed client-side from Essyn + Google Calendar events
  const computedStats = useMemo(() => {
    const todayKey = format(today, "yyyy-MM-dd");
    const monthY = currentMonth.getFullYear();
    const monthM = currentMonth.getMonth();

    // GCal helpers
    const gcalDateKey = (ev: typeof googleEventsFiltered[0]) =>
      (ev.start.date || ev.start.dateTime || "").split("T")[0];

    const gcalInMonth = googleEventsFiltered.filter((ev) => {
      const d = new Date(gcalDateKey(ev));
      return d.getFullYear() === monthY && d.getMonth() === monthM;
    });

    const todayGcal = (googleEventsByDate[todayKey] || []).length;

    const monthEssyn = events.filter((ev) => {
      const d = new Date(ev.start_at);
      return d.getFullYear() === monthY && d.getMonth() === monthM;
    });

    const todayCount = todayEvents.length + todayGcal;
    const monthCount = monthEssyn.length + gcalInMonth.length;

    const classifyForStats = (title: string) => {
      const t = title.toLowerCase();
      if (t.includes("bloqueio")) return "bloqueio";
      if (t.includes("reunião") || t.includes("reuniao")) return "reuniao";
      if (t.includes("entrega")) return "entrega";
      return "evento";
    };

    const monthSummary = { evento: 0, reuniao: 0, entrega: 0, bloqueio: 0 };
    monthEssyn.forEach((ev) => { monthSummary[classifyForStats(ev.title)]++; });
    gcalInMonth.forEach((ev) => { monthSummary[classifyForStats(ev.summary || "")]++; });

    return { todayCount, monthCount, monthSummary };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, googleEventsFiltered, googleEventsByDate, todayEvents, currentMonth]);

  // Dynamic saturdays — follows the currently viewed month, includes GCal events
  const viewedSaturdays = useMemo(() => {
    const viewedMonth = currentMonth;
    const first = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), 1);
    const last = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0);
    const sats: { date: string; hasEvent: boolean }[] = [];
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 6) {
        const dateStr = format(d, "yyyy-MM-dd");
        const hasEssyn = events.some((ev) => ev.start_at.split("T")[0] === dateStr);
        const hasGcal = !!(googleEventsByDate[dateStr]?.length);
        sats.push({ date: dateStr, hasEvent: hasEssyn || hasGcal });
      }
    }
    return sats;
  }, [currentMonth, events, googleEventsByDate]);

  const freeSaturdays = viewedSaturdays.filter((s) => !s.hasEvent).length;
  const totalSaturdays = viewedSaturdays.length;

  // Next event — checks both Essyn and GCal
  const nextEventCountdown = useMemo(() => {
    const now = new Date();
    // Find nearest future event across both sources
    let nearestDate: Date | null = null;
    let nearestTitle = "";

    if (nextEvent) {
      nearestDate = parseISO(nextEvent.start_at);
      nearestTitle = nextEvent.title;
    }

    for (const gev of googleEventsFiltered) {
      const raw = gev.start.dateTime || gev.start.date;
      if (!raw) continue;
      const d = new Date(raw);
      if (isAfter(d, now) && (!nearestDate || d < nearestDate)) {
        nearestDate = d;
        nearestTitle = gev.summary || "Evento";
      }
    }

    if (!nearestDate) return { label: null, title: "Nenhum evento" };

    const days = differenceInDays(nearestDate, now);
    const hours = differenceInHours(nearestDate, now);
    const label = days > 0 ? `em ${days}d` : hours > 0 ? `em ${hours}h` : "agora";
    return { label, title: nearestTitle };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextEvent, googleEventsFiltered]);

  const upcomingCombined = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    type UpcomingItem = {
      key: string;
      title: string;
      date: Date;
      timeLabel: string;
      color: string;
      onClick: () => void;
    };

    const items: UpcomingItem[] = [];

    // Essyn events
    events.forEach(ev => {
      const d = new Date(ev.start_at);
      if (d >= startOfToday) {
        items.push({
          key: `essyn-${ev.id}`,
          title: ev.title,
          date: d,
          timeLabel: ev.all_day ? "Dia inteiro" : format(d, "HH:mm"),
          color: getEventColor(ev.title, ev.color),
          onClick: () => setSelectedEvent(ev),
        });
      }
    });

    // GCal events
    googleEventsFiltered.forEach(gev => {
      const raw = gev.start.dateTime || gev.start.date;
      if (!raw) return;
      const d = new Date(raw);
      if (d >= startOfToday) {
        items.push({
          key: `gcal-${gev.id}`,
          title: gev.summary || "Evento Google",
          date: d,
          timeLabel: gev.start.dateTime ? format(d, "HH:mm") : "Dia inteiro",
          color: "#4285F4",
          onClick: () => setSelectedGoogleEvent(gev),
        });
      }
    });

    return items
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 7);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, googleEventsFiltered]);

  // Project checklist
  const projectChecklist = useMemo(() => {
    if (!nextProject) return [];
    const checks: { label: string; done: boolean; icon: typeof FileText }[] = [];
    // Has team assigned
    checks.push({
      label: "Equipe definida",
      done: (nextProject.team_ids || []).length > 0,
      icon: Users,
    });
    // Has pack
    checks.push({
      label: "Pacote selecionado",
      done: !!nextProject.pack_id,
      icon: Package,
    });
    // Deposit paid (first installment)
    const paidInstallments = nextProject.installments.filter((i) => i.status === "pago");
    checks.push({
      label: "Sinal pago",
      done: paidInstallments.length > 0,
      icon: CreditCard,
    });
    // All workflows started
    const totalWorkflows = nextProject.project_workflows.length;
    const completedWorkflows = nextProject.project_workflows.filter(
      (w) => w.status === "concluido"
    ).length;
    if (totalWorkflows > 0) {
      checks.push({
        label: `Produção ${completedWorkflows}/${totalWorkflows}`,
        done: completedWorkflows === totalWorkflows,
        icon: CheckCircle2,
      });
    }
    return checks;
  }, [nextProject]);

  const monthName = format(currentMonth, "MMMM", { locale: ptBR });

  return (
    <PageTransition>
      {/* Unified Header + Stats Card */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Agenda</h1>
                {gcalLoading ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--fg-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                    <Loader2 size={9} className="animate-spin" />
                    Google Calendar
                  </span>
                ) : gcalConnected ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[#4285F4] bg-[color-mix(in_srgb,#4285F4_10%,transparent)] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                    Google Calendar
                  </span>
                ) : (
                  <a href="/integracoes" className="flex items-center gap-1 text-[10px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full transition-colors">
                    + Conectar Google Calendar
                  </a>
                )}
              </div>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                {computedStats.todayCount} compromisso{computedStats.todayCount !== 1 ? "s" : ""} hoje · {computedStats.monthCount} evento{computedStats.monthCount !== 1 ? "s" : ""} em {monthName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuickType("Reunião — ");
                  setSelectedDate(null);
                  setShowNewModal(true);
                }}
                className={SECONDARY_CTA}
              >
                <Coffee size={15} />
                Reunião
              </button>
              <button
                onClick={() => {
                  setQuickType("Ensaio — ");
                  setSelectedDate(null);
                  setShowNewModal(true);
                }}
                className={SECONDARY_CTA}
              >
                <Camera size={15} />
                Ensaio
              </button>
              <button
                onClick={() => {
                  setQuickType("Bloqueio — ");
                  setSelectedDate(null);
                  setShowNewModal(true);
                }}
                className={SECONDARY_CTA}
              >
                <Lock size={15} />
                Bloqueio
              </button>
              <button
                onClick={() => {
                  setQuickType("");
                  setSelectedDate(null);
                  setShowNewModal(true);
                }}
                className={PRIMARY_CTA}
              >
                <Plus size={16} />
                Novo evento
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          <div
            className="px-5 py-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
            onClick={() => { setCalView("month"); setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
          >
            <p className="text-[24px] font-bold text-[var(--info)] tracking-[-0.026em] leading-none tabular-nums">{computedStats.todayCount}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Hoje</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{computedStats.todayCount === 0 ? "Dia livre" : `compromisso${computedStats.todayCount !== 1 ? "s" : ""}`}</p>
          </div>
          <div
            className="px-5 py-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
            onClick={() => { setCalView("month"); setCurrentMonth(new Date()); setSelectedDate(null); }}
          >
            <p className="text-[24px] font-bold text-[var(--accent)] tracking-[-0.026em] leading-none tabular-nums">{computedStats.monthCount}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5 capitalize">{monthName}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">evento{computedStats.monthCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="px-5 py-4">
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${freeSaturdays <= 1 ? "text-[var(--error)]" : "text-[var(--success)]"}`}>{freeSaturdays}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Sáb. livres</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">de {totalSaturdays} sábados</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[24px] font-bold text-[var(--warning)] tracking-[-0.026em] leading-none tabular-nums">{nextEventCountdown.label || "—"}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Próximo</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5 truncate">{nextEventCountdown.title}</p>
          </div>
        </div>
      </div>

      {/* Main layout: Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Left: Calendar */}
        <div className="space-y-4">
          <div className="bg-[var(--card)] rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => calView === "month" ? setCurrentMonth(subMonths(currentMonth, 1)) : setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                  className={GHOST_BTN}
                >
                  <ChevronLeft size={18} />
                </button>
                {calView === "month" && !isSameMonth(currentMonth, today) && (
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[var(--info)] border border-[var(--info)] hover:bg-[color-mix(in_srgb,var(--info)_8%,transparent)] transition-colors"
                  >
                    Hoje
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-medium text-[var(--fg)] capitalize">
                  {calView === "month"
                    ? format(currentMonth, "MMMM yyyy", { locale: ptBR })
                    : (() => {
                        const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
                        return `${format(days[0], "d MMM", { locale: ptBR })} – ${format(days[6], "d MMM yyyy", { locale: ptBR })}`;
                      })()
                  }
                </h2>
                {gcalConnected && gcalLoading && (
                  <Loader2 size={11} className="animate-spin text-[#4285F4] opacity-60" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg p-0.5">
                  <button
                    onClick={() => setCalView("month")}
                    className={`h-6 px-2.5 rounded-md text-[10px] font-medium transition-colors ${
                      calView === "month" ? "bg-[var(--card)] text-[var(--fg)] shadow-sm" : "text-[var(--fg-muted)]"
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setCalView("week")}
                    className={`h-6 px-2.5 rounded-md text-[10px] font-medium transition-colors ${
                      calView === "week" ? "bg-[var(--card)] text-[var(--fg)] shadow-sm" : "text-[var(--fg-muted)]"
                    }`}
                  >
                    Semana
                  </button>
                </div>
                <button
                  onClick={() => calView === "month" ? setCurrentMonth(addMonths(currentMonth, 1)) : setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                  className={GHOST_BTN}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {([
                { key: "todos", label: "Todos", color: "var(--fg-muted)" },
                { key: "casamento", label: "Casamentos", color: "#EC4899" },
                { key: "ensaio", label: "Ensaios", color: "#8B5CF6" },
                { key: "reuniao", label: "Reuniões", color: "#F97316" },
                { key: "entrega", label: "Entregas", color: "#F59E0B" },
                { key: "bloqueio", label: "Bloqueios", color: "#EF4444" },
                { key: "gcal", label: "Google Calendar", color: "#4285F4" },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`h-6 px-2.5 rounded-full text-[10px] font-medium transition-colors ${
                    activeFilter === f.key
                      ? "text-white"
                      : "text-[var(--fg-muted)] bg-[var(--bg-muted)] hover:text-[var(--fg)]"
                  }`}
                  style={activeFilter === f.key ? { backgroundColor: f.color === "var(--fg-muted)" ? "var(--fg-secondary)" : f.color } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {calView === "month" ? (
              <>
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[11px] font-medium text-[var(--fg-muted)] py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayEvents = eventsByDate[dateKey] || [];
                    const dayGoogleEvents = googleEventsByDate[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, today);
                    const isSaturday = day.getDay() === 6;

                    const filteredDayEvents = activeFilter === "todos" ? dayEvents
                      : activeFilter === "gcal" ? []
                      : dayEvents.filter(ev => classifyEvent(ev.title) === activeFilter);

                    const filteredDayGoogleEvents = activeFilter === "gcal" ? dayGoogleEvents
                      : activeFilter === "todos" ? dayGoogleEvents
                      : [];

                    const totalDots = filteredDayEvents.length + filteredDayGoogleEvents.length;
                    const rawTotal = dayEvents.length + dayGoogleEvents.length;

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (rawTotal === 0) {
                            setSelectedDate(day);
                            setShowNewModal(true);
                          } else {
                            setSelectedDate(day);
                          }
                        }}
                        className={`
                          relative flex flex-col p-1 min-h-[80px] border-t border-[var(--border)] transition-colors cursor-pointer
                          ${isCurrentMonth ? "hover:bg-[var(--card-hover)]" : "opacity-40 pointer-events-none"}
                          ${isToday ? "bg-[var(--card-hover)]" : ""}
                          ${isSaturday && isCurrentMonth ? "bg-[color-mix(in_srgb,var(--warning)_4%,transparent)]" : ""}
                        `}
                      >
                        <span
                          className={`
                            text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full self-end mb-0.5
                            ${isToday ? "bg-[var(--bg-ink)] text-[var(--fg-light)]" : "text-[var(--fg-secondary)]"}
                          `}
                        >
                          {format(day, "d")}
                        </span>
                        <div className="w-full space-y-0.5 overflow-hidden">
                          {filteredDayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className="w-full px-1.5 py-[2px] rounded-[3px] text-[9px] font-medium truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: getEventColor(ev.title, ev.color) }}
                            >
                              {ev.all_day ? ev.title : `${format(parseISO(ev.start_at), "HH:mm")} ${ev.title}`}
                            </div>
                          ))}
                          {filteredDayGoogleEvents.slice(0, Math.max(0, 2 - Math.min(filteredDayEvents.length, 2))).map((ev) => (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedGoogleEvent(ev); }}
                              className="w-full px-1.5 py-[2px] rounded-[3px] text-[9px] font-medium truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: "#4285F4" }}
                            >
                              {ev.summary || "Evento Google"}
                            </div>
                          ))}
                          {totalDots > 2 && (
                            <p className="text-[9px] text-[var(--fg-muted)] pl-1">+{totalDots - 2} mais</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <WeekView
                weekStart={currentWeekStart}
                onPrev={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                onNext={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                onToday={() => setCurrentWeekStart(startOfWeek(new Date(), { locale: ptBR }))}
                eventsByDate={eventsByDate}
                googleEventsByDate={googleEventsByDate}
                activeFilter={activeFilter}
                onEventClick={(ev) => setSelectedEvent(ev)}
                onGoogleEventClick={(ev) => setSelectedGoogleEvent(ev)}
                onDayClick={(date) => { setSelectedDate(date); setShowNewModal(false); }}
              />
            )}
          </div>

          {/* Day Panel (when a date is selected) */}
          <AnimatePresence>
            {selectedDate && !showNewModal && !selectedEvent && (
              <motion.div {...springContentIn}>
                <DayPanel
                  date={selectedDate}
                  events={eventsByDate[format(selectedDate, "yyyy-MM-dd")] || []}
                  googleEvents={googleEventsByDate[format(selectedDate, "yyyy-MM-dd")] || []}
                  onClose={() => setSelectedDate(null)}
                  onEventClick={(ev) => setSelectedEvent(ev)}
                  onGoogleEventClick={(ev) => setSelectedGoogleEvent(ev)}
                  onNewEvent={() => setShowNewModal(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Today's Timeline */}
          <div className="bg-[var(--card)] rounded-2xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-[var(--fg)]">Hoje</h3>
              <span className="text-[10px] font-medium text-[var(--fg-muted)]">
                {format(today, "d MMM", { locale: ptBR })}
              </span>
            </div>
            {todayEvents.length === 0 && !googleEventsByDate[format(today, "yyyy-MM-dd")]?.length ? (
              <p className="text-[11px] text-[var(--fg-muted)] py-3 text-center">
                Nenhum compromisso hoje
              </p>
            ) : (
              <div className="space-y-0">
                {todayEvents.map((ev, idx) => {
                  const evTime = parseISO(ev.start_at);
                  const now = new Date();
                  const endTime = ev.end_at ? parseISO(ev.end_at) : null;
                  const isPast = !ev.all_day && (endTime ? endTime < now : evTime < now);
                  const isNow =
                    !ev.all_day &&
                    evTime <= now &&
                    (!endTime || endTime >= now);

                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="flex items-start gap-3 w-full text-left py-2 px-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
                      style={{ opacity: isPast ? 0.45 : 1 }}
                    >
                      {/* Timeline line */}
                      <div className="flex flex-col items-center pt-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: getEventColor(ev.title, ev.color),
                            boxShadow: isNow
                              ? `0 0 0 3px color-mix(in srgb, ${getEventColor(ev.title, ev.color)} 30%, transparent)`
                              : "none",
                          }}
                        />
                        {idx < todayEvents.length - 1 && (
                          <div className="w-px h-full min-h-[20px] bg-[var(--border)] mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-[var(--fg-muted)] tabular-nums">
                            {ev.all_day
                              ? "Dia inteiro"
                              : format(evTime, "HH:mm")}
                          </span>
                          {isNow && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--success)] text-[var(--fg-light)] uppercase">
                              Agora
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] font-medium text-[var(--fg)] truncate">
                          {ev.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {googleEventsByDate[format(today, "yyyy-MM-dd")]?.map((ev) => {
                  const startRaw = ev.start.dateTime || ev.start.date;
                  const endRaw = ev.end.dateTime || ev.end.date;
                  const isAllDay = !ev.start.dateTime;
                  const isGcalPast = !isAllDay && startRaw && new Date(startRaw) < new Date();
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedGoogleEvent(ev)}
                      className="flex items-start gap-3 w-full text-left py-2 hover:bg-[var(--sidebar-hover)] rounded-lg px-1 transition-colors -mx-1"
                      style={{ opacity: isGcalPast ? 0.45 : 1 }}
                    >
                      <div className="flex flex-col items-center pt-0.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#4285F4" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium tabular-nums text-[var(--fg-secondary)]">
                            {isAllDay ? "Dia inteiro" : startRaw ? format(parseISO(startRaw), "HH:mm") : ""}
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-[var(--fg)] truncate">{ev.summary || "Evento Google"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-[var(--card)] rounded-2xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="text-[13px] font-medium text-[var(--fg)] mb-3">Próximos eventos</h3>
            {upcomingCombined.length === 0 ? (
              <p className="text-[11px] text-[var(--fg-muted)] py-3 text-center">Nenhum evento próximo</p>
            ) : (
              <div className="space-y-0">
                {upcomingCombined.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className="flex items-center gap-3 w-full text-left py-2 px-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[var(--fg)] truncate">{item.title}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{item.timeLabel}</p>
                    </div>
                    {!isSameDay(item.date, today) && (
                      <span className="text-[10px] text-[var(--fg-muted)] shrink-0">
                        {format(item.date, "d MMM", { locale: ptBR })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next Project */}
          {nextProject && (
            <div className="bg-[var(--card)] rounded-2xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <h3 className="text-[13px] font-medium text-[var(--fg)] mb-3">
                Próximo Projeto
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--fg)]">
                    {nextProject.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge
                      label={EVENT_TYPE_LABELS[nextProject.event_type] || nextProject.event_type}
                      color="var(--info)"
                      bg="var(--info-subtle)"
                    />
                    {nextProject.event_date && (
                      <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                        <CalendarDays size={10} />
                        {format(parseISO(nextProject.event_date), "d MMM", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  {nextProject.clients && (
                    <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                      {nextProject.clients.name}
                    </p>
                  )}
                </div>

                {/* Checklist */}
                {projectChecklist.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-[var(--fg-muted)]">
                      Checklist ({projectChecklist.filter((c) => c.done).length}/
                      {projectChecklist.length})
                    </p>
                    {projectChecklist.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 py-1"
                      >
                        {item.done ? (
                          <CheckCircle2
                            size={14}
                            className="text-[var(--success)] shrink-0"
                          />
                        ) : (
                          <AlertCircle
                            size={14}
                            className="text-[var(--warning)] shrink-0"
                          />
                        )}
                        <span
                          className={`text-[11px] ${
                            item.done
                              ? "text-[var(--fg-muted)] line-through"
                              : "text-[var(--fg)] font-medium"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => openDrawer(nextProject.id)}
                  className="w-full h-8 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors flex items-center justify-center gap-1.5"
                >
                  Abrir Projeto
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Saturdays */}
          <div className="bg-[var(--card)] rounded-2xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-[var(--fg)]">
                Sábados{" "}
                <span className="text-[var(--fg-muted)] font-normal capitalize">
                  {format(currentMonth, "MMM", { locale: ptBR })}
                </span>
              </h3>
              <span className="text-[10px] font-medium text-[var(--fg-muted)]">
                {freeSaturdays} livre{freeSaturdays !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {viewedSaturdays.map((sat) => {
                const satDate = parseISO(sat.date);
                const isPast = satDate < today && !isSameDay(satDate, today);
                return (
                  <div
                    key={sat.date}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border transition-colors ${
                      sat.hasEvent
                        ? "border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)]"
                        : isPast
                          ? "border-[var(--border)] opacity-40"
                          : "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)]"
                    }`}
                  >
                    <span className="text-[12px] font-semibold text-[var(--fg)]">
                      {format(satDate, "d")}
                    </span>
                    <span className="text-[9px] text-[var(--fg-muted)] capitalize">
                      {format(satDate, "MMM", { locale: ptBR })}
                    </span>
                    {sat.hasEvent ? (
                      <Ban size={10} className="text-[var(--error)] mt-1" />
                    ) : (
                      <CheckCircle2
                        size={10}
                        className={`mt-1 ${isPast ? "text-[var(--fg-muted)]" : "text-[var(--success)]"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-[var(--card)] rounded-2xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <h3 className="text-[13px] font-medium text-[var(--fg)] mb-3 capitalize">
              Resumo de {monthName}
            </h3>
            <div className="space-y-2">
              <SummaryRow
                icon={Calendar}
                label="Eventos"
                count={computedStats.monthSummary.evento}
                color="var(--info)"
              />
              <SummaryRow
                icon={Coffee}
                label="Reuniões"
                count={computedStats.monthSummary.reuniao}
                color="var(--warning)"
              />
              <SummaryRow
                icon={Package}
                label="Entregas"
                count={computedStats.monthSummary.entrega}
                color="var(--success)"
              />
              <SummaryRow
                icon={Lock}
                label="Bloqueios"
                count={computedStats.monthSummary.bloqueio}
                color="var(--error)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(ev) => {
          setSelectedEvent(null);
          setEditingEvent(ev);
          setShowNewModal(true);
        }}
        onRequestDelete={(ev) => {
          setSelectedEvent(null);
          setConfirmDelete(ev);
        }}
        onOpenProject={(projectId) => {
          setSelectedEvent(null);
          openDrawer(projectId);
        }}
      />

      {selectedGoogleEvent && (
        <GoogleEventModal
          event={selectedGoogleEvent}
          onClose={() => setSelectedGoogleEvent(null)}
          onEdit={(ev) => {
            setSelectedGoogleEvent(null);
            setGoogleEventToImport(ev);
            setShowNewModal(true);
          }}
        />
      )}

      {/* Confirm Delete */}
      <AppleModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir evento"
        maxWidth="max-w-sm"
      >
        {confirmDelete && (
          <ConfirmDeleteContent
            event={confirmDelete}
            studioId={studioId}
            onCancel={() => setConfirmDelete(null)}
            onDeleted={(id) => {
              setEvents(events.filter((e) => e.id !== id));
              setConfirmDelete(null);
              toast.success("Evento excluído!");
              router.refresh();
            }}
          />
        )}
      </AppleModal>

      <EventFormModal
        open={showNewModal}
        projects={projects}
        studioId={studioId}
        defaultDate={selectedDate}
        defaultTitle={quickType}
        editingEvent={editingEvent}
        googleEventToImport={googleEventToImport}
        onClose={() => {
          setShowNewModal(false);
          setSelectedDate(null);
          setQuickType("");
          setEditingEvent(null);
          setGoogleEventToImport(null);
        }}
        onSaved={(ev, isEdit) => {
          if (isEdit) {
            setEvents(
              events.map((e) => (e.id === ev.id ? ev : e)).sort((a, b) => a.start_at.localeCompare(b.start_at))
            );
            toast.success("Evento atualizado!");
          } else {
            setEvents(
              [...events, ev].sort((a, b) => a.start_at.localeCompare(b.start_at))
            );
            toast.success("Evento criado com sucesso!");
          }
          setShowNewModal(false);
          setSelectedDate(null);
          setQuickType("");
          setEditingEvent(null);
          setGoogleEventToImport(null);
          router.refresh();
        }}
      />
    </PageTransition>
  );
}


/* ═══════════ Week View ═══════════ */

function WeekView({
  weekStart,
  onPrev,
  onNext,
  onToday,
  eventsByDate,
  googleEventsByDate,
  activeFilter,
  onEventClick,
  onGoogleEventClick,
  onDayClick,
}: {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  eventsByDate: Record<string, EventItem[]>;
  googleEventsByDate: Record<string, {id:string; summary?:string; start:{dateTime?:string;date?:string}; end:{dateTime?:string;date?:string}; htmlLink?:string; location?:string; description?:string}[]>;
  activeFilter: string;
  onEventClick: (ev: EventItem) => void;
  onGoogleEventClick: (ev: {id:string; summary?:string; start:{dateTime?:string;date?:string}; end:{dateTime?:string;date?:string}; htmlLink?:string; location?:string; description?:string}) => void;
  onDayClick: (date: Date) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = isSameDay(day, today);
          const isSat = day.getDay() === 6;
          const dayEvents = eventsByDate[dateStr] || [];
          const dayGCal = googleEventsByDate[dateStr] || [];

          const filteredEvents = activeFilter === "todos" ? dayEvents
            : activeFilter === "gcal" ? []
            : dayEvents.filter(ev => classifyEvent(ev.title) === activeFilter);

          const filteredGCal = (activeFilter === "todos" || activeFilter === "gcal") ? dayGCal : [];

          return (
            <div
              key={dateStr}
              className={`rounded-xl p-2 min-h-[160px] flex flex-col gap-1 cursor-pointer transition-colors ${
                isToday
                  ? "bg-[color-mix(in_srgb,var(--info)_8%,transparent)] border border-[color-mix(in_srgb,var(--info)_30%,transparent)]"
                  : isSat
                  ? "bg-[color-mix(in_srgb,var(--warning)_4%,transparent)] border border-[var(--border-subtle)]"
                  : "border border-[var(--border-subtle)] hover:bg-[var(--card-hover)]"
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className={`text-center text-[11px] font-semibold mb-1 ${isToday ? "text-[var(--info)]" : "text-[var(--fg-secondary)]"}`}>
                <div className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">{format(day, "EEE", { locale: ptBR })}</div>
                <div className={`w-6 h-6 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-[var(--bg-ink)] text-[var(--fg-light)]" : ""}`}>
                  {format(day, "d")}
                </div>
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {filteredEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className="w-full px-1.5 py-1 rounded-md text-[9px] font-medium truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getEventColor(ev.title, ev.color) }}
                  >
                    {ev.all_day ? ev.title : `${format(parseISO(ev.start_at), "HH:mm")} ${ev.title}`}
                  </div>
                ))}
                {filteredGCal.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onGoogleEventClick(ev); }}
                    className="w-full px-1.5 py-1 rounded-md text-[9px] font-medium truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "#4285F4" }}
                  >
                    {ev.summary || "Evento Google"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════ Summary Row ═══════════ */

function SummaryRow({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: typeof Calendar;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[12px] text-[var(--fg-secondary)]">{label}</span>
      </div>
      <span className="text-[13px] font-semibold text-[var(--fg)]">{count}</span>
    </div>
  );
}

/* ═══════════ Day Panel ═══════════ */

function DayPanel({
  date,
  events,
  googleEvents = [],
  onClose,
  onEventClick,
  onGoogleEventClick,
  onNewEvent,
}: {
  date: Date;
  events: EventItem[];
  googleEvents?: { id: string; summary?: string; description?: string; location?: string; htmlLink?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }[];
  onClose: () => void;
  onEventClick: (ev: EventItem) => void;
  onGoogleEventClick: (ev: { id: string; summary?: string; description?: string; location?: string; htmlLink?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => void;
  onNewEvent: () => void;
}) {
  const hasAny = events.length > 0 || googleEvents.length > 0;
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium text-[var(--fg)] capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={onNewEvent} className={GHOST_BTN}>
            <Plus size={16} />
          </button>
          <button onClick={onClose} className={GHOST_BTN}>
            <X size={16} />
          </button>
        </div>
      </div>
      {!hasAny ? (
        <p className="text-[11px] text-[var(--fg-muted)]">Nenhum evento neste dia.</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
            >
              <Circle size={8} fill={getEventColor(ev.title, ev.color)} stroke="none" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg)] truncate">{ev.title}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">
                  {ev.all_day ? "Dia inteiro" : `${format(parseISO(ev.start_at), "HH:mm")}${ev.end_at ? ` – ${format(parseISO(ev.end_at), "HH:mm")}` : ""}`}
                </p>
              </div>
            </button>
          ))}
          {googleEvents.map((ev) => {
            const startRaw = ev.start.dateTime || ev.start.date;
            const endRaw = ev.end.dateTime || ev.end.date;
            const isAllDay = !ev.start.dateTime;
            const timeStr = isAllDay ? "Dia inteiro" : startRaw
              ? `${format(parseISO(startRaw), "HH:mm")}${endRaw && ev.end.dateTime ? ` – ${format(parseISO(endRaw), "HH:mm")}` : ""}`
              : "";
            return (
              <button key={ev.id} onClick={() => onGoogleEventClick(ev)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg bg-[var(--sidebar-hover)] hover:bg-[var(--card-hover)] transition-colors">
                <Circle size={8} fill="#4285F4" stroke="none" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">{ev.summary || "Sem título"}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4285F4]/10 text-[#4285F4] font-medium shrink-0">Google</span>
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)]">{timeStr}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Event Detail Modal ═══════════ */

function EventDetailModal({
  event,
  onClose,
  onEdit,
  onRequestDelete,
  onOpenProject,
}: {
  event: EventItem | null;
  onClose: () => void;
  onEdit: (ev: EventItem) => void;
  onRequestDelete: (ev: EventItem) => void;
  onOpenProject: (projectId: string) => void;
}) {
  const status = event ? statusConfig[event.status] : null;

  return (
    <AppleModal
      open={!!event}
      onClose={onClose}
      title={event?.title || ""}
      maxWidth="max-w-md"
    >
      {event && (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: getEventColor(event.title, event.color),
              }}
            />
            <StatusBadge
              label={status?.label || event.status}
              color={status?.color || "var(--fg-muted)"}
              bg={`color-mix(in srgb, ${status?.bg || "var(--info)"} 15%, transparent)`}
            />
            {event.google_calendar_event_id && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#4285F4] bg-[color-mix(in_srgb,#4285F4_10%,transparent)] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                Google Calendar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--fg-secondary)]">
            <CalendarDays size={14} />
            <span>
              {format(
                parseISO(event.start_at),
                "d 'de' MMMM 'de' yyyy",
                { locale: ptBR }
              )}
            </span>
          </div>
          {!event.all_day && (
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--fg-secondary)]">
              <Clock size={14} />
              <span>
                {format(parseISO(event.start_at), "HH:mm")}
                {event.end_at &&
                  ` – ${format(parseISO(event.end_at), "HH:mm")}`}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--fg-secondary)]">
              <MapPin size={14} />
              <span>{event.location}</span>
            </div>
          )}

          {event.projects && (
            <button
              onClick={() => onOpenProject(event.projects!.id)}
              className="flex items-center gap-2 text-[13px] font-medium text-[var(--info)] hover:underline"
            >
              <FileText size={14} />
              {event.projects.name}
            </button>
          )}

          {event.description && (
            <div>
              <p className="text-[11px] text-[var(--fg-muted)] mb-1">
                Descrição
              </p>
              <p className="text-[13px] font-medium text-[var(--fg-secondary)] whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => onRequestDelete(event)}
              className="h-9 px-3 rounded-lg text-[13px] font-medium text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_8%,transparent)] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Excluir
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className={SECONDARY_CTA}>
                Fechar
              </button>
              <button
                onClick={() => onEdit(event)}
                className={PRIMARY_CTA}
              >
                <Pencil size={14} />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppleModal>
  );
}

/* ═══════════ Google Event Detail Modal ═══════════ */

function GoogleEventModal({
  event,
  onClose,
  onEdit,
}: {
  event: { id: string; summary?: string; description?: string; location?: string; htmlLink?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } } | null;
  onClose: () => void;
  onEdit: (ev: { id: string; summary?: string; description?: string; location?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => void;
}) {
  if (!event) return null;

  const startRaw = event.start.dateTime || event.start.date;
  const endRaw = event.end.dateTime || event.end.date;
  const isAllDay = !event.start.dateTime;

  const dateStr = startRaw
    ? format(parseISO(startRaw), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";
  const timeStr = isAllDay
    ? "Dia inteiro"
    : startRaw
    ? `${format(parseISO(startRaw), "HH:mm")}${endRaw && event.end.dateTime ? ` – ${format(parseISO(endRaw), "HH:mm")}` : ""}`
    : "";

  return (
    <AppleModal open={!!event} onClose={onClose} title="">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: "#4285F4" }} />
          <div className="flex-1">
            <h2 className="text-[17px] font-semibold text-[var(--fg)] leading-snug">
              {event.summary || "Sem título"}
            </h2>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#4285F4]/10 text-[#4285F4]">
              Google Calendar
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-[13px] text-[var(--fg-secondary)]">
            <CalendarDays size={14} className="text-[var(--fg-muted)] shrink-0" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[var(--fg-secondary)]">
            <Clock size={14} className="text-[var(--fg-muted)] shrink-0" />
            <span>{timeStr}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2.5 text-[13px] text-[var(--fg-secondary)]">
              <MapPin size={14} className="text-[var(--fg-muted)] shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="rounded-xl bg-[var(--sidebar-hover)] p-3">
            <p className="text-[12px] text-[var(--fg-secondary)] whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={SECONDARY_CTA}>
              Fechar
            </button>
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              >
                <ExternalLink size={12} />
                Google Calendar
              </a>
            )}
          </div>
          <button
            onClick={() => onEdit(event)}
            className={PRIMARY_CTA}
          >
            <Pencil size={14} />
            Editar no Essyn
          </button>
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════ Confirm Delete ═══════════ */

function ConfirmDeleteContent({
  event,
  studioId,
  onCancel,
  onDeleted,
}: {
  event: EventItem;
  studioId: string;
  onCancel: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", event.id).eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      setDeleting(false);
      return;
    }
    if (event.google_calendar_event_id) {
      syncGoogleCalendar("delete", undefined, event.google_calendar_event_id, event.client_google_event_id, event.projects?.client_id);
    }
    onDeleted(event.id);
  }

  return (
    <div className="p-6 space-y-4">
      <p className="text-[13px] text-[var(--fg-secondary)]">
        Tem certeza que deseja excluir <strong className="text-[var(--fg)]">{event.title}</strong>?
        Esta ação não pode ser desfeita.
      </p>
      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel} className={SECONDARY_CTA}>
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-10 px-5 rounded-lg bg-[var(--error)] text-[var(--fg-light)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {deleting && <Loader2 size={14} className="animate-spin" />}
          Excluir evento
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Event Form Modal (Create + Edit) ═══════════ */

function EventFormModal({
  open,
  projects,
  studioId,
  defaultDate,
  defaultTitle,
  editingEvent,
  googleEventToImport,
  onClose,
  onSaved,
}: {
  open: boolean;
  projects: ProjectOption[];
  studioId: string;
  defaultDate: Date | null;
  defaultTitle: string;
  editingEvent: EventItem | null;
  googleEventToImport?: {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  } | null;
  onClose: () => void;
  onSaved: (event: EventItem, isEdit: boolean) => void;
}) {
  const isEdit = !!editingEvent;

  const initialForm = useMemo(() => {
    if (editingEvent) {
      const startLocal = editingEvent.start_at.slice(0, 16); // "yyyy-MM-ddTHH:mm"
      const endLocal = editingEvent.end_at ? editingEvent.end_at.slice(0, 16) : "";
      return {
        title: editingEvent.title,
        description: editingEvent.description || "",
        start_at: startLocal,
        end_at: endLocal,
        location: editingEvent.location || "",
        status: editingEvent.status,
        project_id: editingEvent.project_id || "",
        all_day: editingEvent.all_day,
        color: editingEvent.color || presetColors[0],
      };
    }
    if (googleEventToImport) {
      const gStart = googleEventToImport.start.dateTime || (googleEventToImport.start.date ? googleEventToImport.start.date + "T09:00" : "");
      const gEnd = googleEventToImport.end.dateTime || (googleEventToImport.end.date ? googleEventToImport.end.date + "T10:00" : "");
      const isAllDay = !googleEventToImport.start.dateTime;
      return {
        title: googleEventToImport.summary || "",
        description: googleEventToImport.description || "",
        start_at: gStart.slice(0, 16),
        end_at: gEnd.slice(0, 16),
        location: googleEventToImport.location || "",
        status: "confirmado" as EventStatus,
        project_id: "",
        all_day: isAllDay,
        color: "#4285F4",
      };
    }
    return {
      title: defaultTitle || "",
      description: "",
      start_at: defaultDate ? format(defaultDate, "yyyy-MM-dd") + "T09:00" : "",
      end_at: defaultDate ? format(defaultDate, "yyyy-MM-dd") + "T10:00" : "",
      location: "",
      status: "agendado" as EventStatus,
      project_id: "",
      all_day: false,
      color: presetColors[0],
    };
  }, [editingEvent, googleEventToImport, defaultDate, defaultTitle]);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Reset form when modal opens with new props
  const formKey = editingEvent?.id || googleEventToImport?.id || `${defaultDate?.toISOString()}-${defaultTitle}`;
  useEffect(() => {
    setForm(initialForm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const selectFields = `
    id, title, description, start_at, end_at,
    location, status, project_id, all_day, color,
    google_calendar_event_id, client_google_event_id, created_at,
    projects (id, name, client_id)
  `;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.start_at) return;

    // Validate end is after start
    if (!form.all_day && form.end_at && form.start_at && form.end_at <= form.start_at) {
      toast.error("O horário de término deve ser após o início.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_at: form.all_day
        ? form.start_at.split("T")[0] + "T00:00:00"
        : (form.start_at.length === 16 ? form.start_at + ":00" : form.start_at),
      end_at: form.end_at
        ? form.all_day
          ? form.end_at.split("T")[0] + "T23:59:59"
          : (form.end_at.length === 16 ? form.end_at + ":00" : form.end_at)
        : null,
      location: form.location.trim() || null,
      status: form.status,
      project_id: form.project_id || null,
      all_day: form.all_day,
      color: form.color,
    };

    if (isEdit) {
      const { data, error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingEvent!.id)
        .eq("studio_id", studioId)
        .select(selectFields)
        .single();

      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
        setLoading(false);
        return;
      }
      const saved = data as unknown as EventItem;
      syncGoogleCalendar("update", saved);
      onSaved(saved, true);
    } else {
      // When importing from Google Calendar, pre-set google_calendar_event_id
      // so the sync will UPDATE (not create) the existing Google event
      if (googleEventToImport) {
        payload.google_calendar_event_id = googleEventToImport.id;
      }

      const { data, error } = await supabase
        .from("events")
        .insert({ ...payload, studio_id: studioId })
        .select(selectFields)
        .single();

      if (error) {
        toast.error("Erro ao criar evento: " + error.message);
        setLoading(false);
        return;
      }
      const saved = data as unknown as EventItem;
      // If importing from Google, update the existing GCal event; otherwise create new
      if (googleEventToImport) {
        syncGoogleCalendar("update", saved);
      } else {
        syncGoogleCalendar("create", saved);
      }
      onSaved(saved, false);
    }
  }

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar evento" : googleEventToImport ? "Editar evento do Google Calendar" : "Novo evento"}
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        <div>
          <label className={LABEL_CLS}>Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Ensaio pré-casamento"
            required
            autoFocus
            className={INPUT_CLS}
          />
          {(form.title === "Reunião — " || form.title === "Reunião —") && (
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">
              ✏️ Continue digitando o nome do cliente ou assunto
            </p>
          )}
          {(form.title === "Ensaio — " || form.title === "Ensaio —") && (
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">
              ✏️ Continue digitando o nome do cliente
            </p>
          )}
          {(form.title === "Bloqueio — " || form.title === "Bloqueio —") && (
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">
              ✏️ Continue digitando o motivo do bloqueio
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.all_day}
            onChange={(e) =>
              setForm({ ...form, all_day: e.target.checked })
            }
            className="w-4 h-4 rounded border-[var(--border)] accent-[var(--info)]"
          />
          <span className="text-[11px] text-[var(--fg-secondary)]">
            Dia inteiro
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Início *</label>
            <input
              type={form.all_day ? "date" : "datetime-local"}
              value={
                form.all_day ? form.start_at.split("T")[0] : form.start_at
              }
              onChange={(e) =>
                setForm({ ...form, start_at: e.target.value })
              }
              required
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Fim</label>
            <input
              type={form.all_day ? "date" : "datetime-local"}
              value={
                form.all_day ? (form.end_at ? form.end_at.split("T")[0] : "") : form.end_at
              }
              onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Local</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            placeholder="Endereço ou nome do local"
            className={INPUT_CLS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as EventStatus,
                })
              }
              className={`w-full ${SELECT_CLS}`}
            >
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Projeto</label>
            <select
              value={form.project_id}
              onChange={(e) =>
                setForm({ ...form, project_id: e.target.value })
              }
              className={`w-full ${SELECT_CLS}`}
            >
              <option value="">Nenhum</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Cor</label>
          <div className="flex items-center gap-2 flex-wrap">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor:
                    form.color === c ? "var(--fg)" : "transparent",
                  transform:
                    form.color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) =>
                setForm({ ...form, color: e.target.value })
              }
              className="w-7 h-7 rounded-full border border-[var(--border)] cursor-pointer bg-transparent"
              title="Cor personalizada"
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={3}
            placeholder="Detalhes sobre o evento..."
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[13px] font-medium text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--info)] focus:border-transparent transition-shadow resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={SECONDARY_CTA}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.title.trim() || !form.start_at}
            className={PRIMARY_CTA}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {isEdit ? "Salvando..." : "Criando..."}
              </>
            ) : (
              isEdit ? "Salvar alterações" : "Criar evento"
            )}
          </button>
        </div>
      </form>
    </AppleModal>
  );
}
