import type { ReactNode } from "react";
import {
  Camera,
  Users,
  Gift,
  Ban,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
} from "lucide-react";

/* ═══════════════════════════════════════════════════ */
/*  CalendarEventBlock — Compact calendar event card   */
/*  Fields: título, horário, tipo, local, cliente      */
/*  Tipo: evento | reuniao | entrega | bloqueio        */
/*  Color only in type badge/tag — never in CTA        */
/*  Variants: default / compact / expanded             */
/*  CTA always black (system primary)                  */
/*  Ref: Apple Calendar event block + Google Calendar   */
/* ═══════════════════════════════════════════════════ */

export type CalendarEventTipo = "evento" | "reuniao" | "entrega" | "bloqueio" | "lembrete";

export interface CalendarEventData {
  id: string;
  titulo: string;
  tipo: CalendarEventTipo;
  hora?: string;
  horaFim?: string;
  local?: string;
  cliente?: string;
  projeto?: string;
}

interface CalendarEventBlockProps {
  event: CalendarEventData;
  /** Compact: single-line pill for month grid */
  variant?: "default" | "compact" | "expanded";
  /** Click handler — opens project/drawer */
  onClick?: (id: string) => void;
  /** Show CTA "Ver" on hover */
  showCta?: boolean;
}

/* ── Type config — editorial on-brand palette, no grey fills ── */

const tipoConfig: Record<
  CalendarEventTipo,
  {
    label: string;
    icon: ReactNode;
    text: string;
    dot: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  evento: {
    label: "Evento",
    icon: <Camera className="w-3 h-3" />,
    text: "text-[#AF52DE]",
    dot: "bg-[#AF52DE]",
    badgeText: "text-[#AF52DE]",
    badgeBorder: "border-[#E5E5EA]",
  },
  reuniao: {
    label: "Reunião",
    icon: <Users className="w-3 h-3" />,
    text: "text-[#8E8E93]",
    dot: "bg-[#8E8E93]",
    badgeText: "text-[#8E8E93]",
    badgeBorder: "border-[#E5E5EA]",
  },
  entrega: {
    label: "Entrega",
    icon: <Gift className="w-3 h-3" />,
    text: "text-[#34C759]",
    dot: "bg-[#34C759]",
    badgeText: "text-[#34C759]",
    badgeBorder: "border-[#E5E5EA]",
  },
  bloqueio: {
    label: "Bloqueio",
    icon: <Ban className="w-3 h-3" />,
    text: "text-[#AEAEB2]",
    dot: "bg-[#C7C7CC]",
    badgeText: "text-[#AEAEB2]",
    badgeBorder: "border-[#E5E5EA]",
  },
  lembrete: {
    label: "Lembrete",
    icon: <Bell className="w-3 h-3" />,
    text: "text-[#FF3B30]",
    dot: "bg-[#FF3B30]",
    badgeText: "text-[#FF3B30]",
    badgeBorder: "border-[#E5E5EA]",
  },
};

export function CalendarEventBlock({
  event,
  variant = "default",
  onClick,
  showCta = false,
}: CalendarEventBlockProps) {
  const cfg = tipoConfig[event.tipo];

  /* ── Compact: dot + text only, no grey pill ── */
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => onClick?.(event.id)}
        className={`flex items-center gap-1 px-1 py-0.5 rounded-md truncate text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
          onClick
            ? "cursor-pointer hover:bg-[#FAFAFA] transition-all"
            : ""
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        <span
          className={`text-[10px] ${cfg.text} truncate`}
          style={{ fontWeight: 400 }}
        >
          {event.hora && (
            <span className="numeric" style={{ fontWeight: 500 }}>
              {event.hora}{" "}
            </span>
          )}
          {event.titulo}
        </span>
      </button>
    );
  }

  /* ── Expanded: white card, clean icon, no grey fills ── */
  if (variant === "expanded") {
    return (
      <button
        type="button"
        onClick={() => onClick?.(event.id)}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-[#E5E5EA] group transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
          onClick ? "cursor-pointer hover:border-[#D1D1D6]" : ""
        }`}
      >
        <span className={`shrink-0 ${cfg.text}`}>
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span
            className="text-[13px] text-[#636366] truncate"
            style={{ fontWeight: 500 }}
          >
            {event.titulo}
          </span>
          <div
            className="flex items-center gap-2 flex-wrap"
            style={{ fontWeight: 400 }}
          >
            {event.hora && (
              <span
                className="text-[11px] text-[#AEAEB2] numeric flex items-center gap-1"
              >
                <Clock className="w-2.5 h-2.5" />
                {event.hora}
                {event.horaFim && ` – ${event.horaFim}`}
              </span>
            )}
            {event.local && (
              <>
                <span className="w-px h-2.5 bg-[#E5E5EA]" />
                <span className="text-[11px] text-[#AEAEB2] flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {event.local}
                </span>
              </>
            )}
            {event.cliente && (
              <>
                <span className="w-px h-2.5 bg-[#E5E5EA]" />
                <span className="text-[11px] text-[#AEAEB2]">
                  {event.cliente}
                </span>
              </>
            )}
          </div>
          {/* Type badge — border only, no fill */}
          <span
            className={`inline-flex items-center gap-1 w-fit px-1.5 py-[1px] rounded-md border text-[9px] mt-0.5 ${cfg.badgeText} ${cfg.badgeBorder}`}
            style={{ fontWeight: 600 }}
          >
            <span className={`w-1 h-1 rounded-full ${cfg.dot} shrink-0`} />
            {cfg.label}
          </span>
        </div>
        {showCta && onClick && (
          <span
            className="shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] text-[#AEAEB2] group-hover:text-[#636366] transition-all opacity-0 group-hover:opacity-100"
            style={{ fontWeight: 500 }}
          >
            Ver
            <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </button>
    );
  }

  /* ── Default: medium card — white bg, clean icon ── */
  return (
    <button
      type="button"
      onClick={() => onClick?.(event.id)}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E5EA] shadow-[0_1px_3px_#F2F2F7] group transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
        onClick ? "cursor-pointer hover:border-[#D1D1D6]" : ""
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.text}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span
          className="text-[13px] text-[#636366] truncate"
          style={{ fontWeight: 500 }}
        >
          {event.titulo}
        </span>
        <div
          className="flex items-center gap-2 text-[11px] text-[#C7C7CC]"
          style={{ fontWeight: 400 }}
        >
          {event.hora && (
            <span className="numeric flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {event.hora}
              {event.horaFim && ` – ${event.horaFim}`}
            </span>
          )}
          {event.local && (
            <>
              <span className="text-[#E5E5EA]">&middot;</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {event.local}
              </span>
            </>
          )}
          {event.cliente && (
            <>
              <span className="text-[#E5E5EA]">&middot;</span>
              <span>{event.cliente}</span>
            </>
          )}
        </div>
      </div>
      {/* Type badge — border only, no grey fill */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md border text-[9px] shrink-0 ${cfg.badgeText} ${cfg.badgeBorder}`}
        style={{ fontWeight: 600 }}
      >
        {cfg.icon}
        {cfg.label}
      </span>
      {showCta && onClick && (
        <span
          className="shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] text-[#AEAEB2] group-hover:text-[#636366] transition-all opacity-0 group-hover:opacity-100"
          style={{ fontWeight: 500 }}
        >
          Ver
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

export { tipoConfig as calendarEventTipoConfig };