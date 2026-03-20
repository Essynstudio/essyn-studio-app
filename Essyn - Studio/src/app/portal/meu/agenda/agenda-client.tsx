"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Calendar, RefreshCw, Unlink, ExternalLink, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { springDefault } from "@/lib/motion-tokens";

/* ── Tokens ── */
const fg = "#2D2A26";
const muted = "#8E8880";
const accent = "#A58D66";
const accentBg = "rgba(165,141,102,0.12)";

function gc(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    ...extra,
  };
}

const EV_LABELS: Record<string, string> = {
  casamento: "Casamento", ensaio: "Ensaio", corporativo: "Corporativo",
  aniversario: "Aniversário", formatura: "Formatura", batizado: "Batizado", outro: "Evento",
};

interface EssynEvent {
  id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  event_location: string | null;
  status: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

interface Props {
  isConnected: boolean;
  connectedAt: string | null;
  essynEvents: EssynEvent[];
  clientId: string;
  studioId: string;
  oauthResult?: "connected" | "denied" | "error" | null;
}

export function PortalAgendaClient({ isConnected: initialConnected, connectedAt, essynEvents, oauthResult }: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current || !oauthResult) return;
    toastShown.current = true;
    if (oauthResult === "connected") {
      toast.success("Google Calendar conectado com sucesso!");
    } else if (oauthResult === "denied") {
      toast.error("Conexão com Google Calendar cancelada.");
    } else {
      toast.error("Erro ao conectar Google Calendar. Tente novamente.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!connected) return;
    setLoadingEvents(true);
    fetch("/api/portal/google-calendar/events")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.events) setGoogleEvents(d.events);
      })
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, [connected]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/portal/google-calendar/disconnect", { method: "POST" });
      if (res.ok) {
        setConnected(false);
        setGoogleEvents([]);
        toast.success("Google Calendar desconectado");
      }
    } finally {
      setDisconnecting(false);
    }
  }

  function getEventDate(e: GoogleEvent) {
    const raw = e.start.dateTime || e.start.date;
    if (!raw) return null;
    try { return parseISO(raw); } catch { return null; }
  }

  function formatEventTime(e: GoogleEvent) {
    const start = e.start.dateTime || e.start.date;
    const end = e.end.dateTime || e.end.date;
    if (!start) return "";
    if (e.start.date && !e.start.dateTime) {
      return format(parseISO(e.start.date + "T00:00:00"), "d 'de' MMM", { locale: ptBR });
    }
    const s = format(parseISO(start), "d 'de' MMM, HH:mm", { locale: ptBR });
    const endTime = end && e.end.dateTime ? ` – ${format(parseISO(end), "HH:mm")}` : "";
    return s + endTime;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springDefault}>
        <h1 className="text-[20px] font-semibold" style={{ color: fg }}>Agenda</h1>
        <p className="text-[13px] mt-0.5" style={{ color: muted }}>
          Seus eventos e sessões em um só lugar
        </p>
      </motion.div>

      {/* Google Calendar connection card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.05 }}
        style={gc({ borderRadius: 16, padding: "20px" })}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
            <Calendar size={20} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold" style={{ color: fg }}>Google Calendar</p>
              {connected && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
                  Conectado
                </span>
              )}
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: muted }}>
              {connected
                ? `Suas sessões aparecem automaticamente na sua agenda do Google`
                : "Conecte para ver tudo sincronizado automaticamente"}
            </p>
            {connected && connectedAt && (
              <p className="text-[11px] mt-1" style={{ color: muted }}>
                Conectado em {format(parseISO(connectedAt), "d 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {!connected ? (
            <a
              href="/api/portal/google-calendar/connect"
              className="flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-xl transition-all"
              style={{ background: accent, color: "#fff" }}
            >
              <Calendar size={14} />
              Conectar Google Calendar
            </a>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(0,0,0,0.05)", color: muted }}
            >
              {disconnecting ? <RefreshCw size={12} className="animate-spin" /> : <Unlink size={12} />}
              Desconectar
            </button>
          )}
        </div>
      </motion.div>

      {/* Essyn sessions */}
      {essynEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.1 }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: muted }}>
            Próximas sessões
          </p>
          <div className="space-y-2">
            {essynEvents.map((ev, i) => {
              const d = ev.event_date ? new Date(ev.event_date + "T00:00:00") : null;
              const days = d ? differenceInDays(d, new Date()) : null;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springDefault, delay: 0.12 + i * 0.04 }}
                  style={gc({ borderRadius: 12, padding: "14px 16px" })}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
                      <CheckCircle2 size={16} style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: fg }}>{ev.name}</p>
                      <p className="text-[12px]" style={{ color: muted }}>{EV_LABELS[ev.event_type] || ev.event_type}</p>
                      {d && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: muted }}>
                            <Clock size={10} />
                            {format(d, "d 'de' MMMM, yyyy", { locale: ptBR })}
                          </span>
                          {ev.event_location && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: muted }}>
                              <MapPin size={10} />
                              {ev.event_location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {days !== null && days >= 0 && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[18px] font-bold" style={{ color: accent }}>{days}</p>
                        <p className="text-[10px]" style={{ color: muted }}>dias</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Google Calendar events */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.15 }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: muted }}>
            Sua agenda do Google (próximos 30 dias)
          </p>

          {loadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={18} className="animate-spin" style={{ color: muted }} />
            </div>
          ) : googleEvents.length === 0 ? (
            <div style={gc({ borderRadius: 12, padding: "24px", textAlign: "center" })}>
              <p className="text-[13px]" style={{ color: muted }}>Nenhum evento nos próximos 30 dias</p>
            </div>
          ) : (
            <div className="space-y-2">
              {googleEvents.map((ev, i) => {
                const d = getEventDate(ev);
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springDefault, delay: 0.16 + i * 0.03 }}
                    style={gc({ borderRadius: 12, padding: "14px 16px" })}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/40">
                        <Calendar size={15} style={{ color: muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: fg }}>
                          {ev.summary || "Sem título"}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: muted }}>{formatEventTime(ev)}</p>
                        {ev.location && (
                          <p className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: muted }}>
                            <MapPin size={10} /> {ev.location}
                          </p>
                        )}
                      </div>
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity"
                        >
                          <ExternalLink size={13} style={{ color: fg }} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {essynEvents.length === 0 && !connected && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={gc({ borderRadius: 16, padding: "32px", textAlign: "center" })}
        >
          <Calendar size={28} style={{ color: muted, margin: "0 auto 12px" }} />
          <p className="text-[14px] font-medium" style={{ color: fg }}>Nenhum evento próximo</p>
          <p className="text-[12px] mt-1" style={{ color: muted }}>
            Conecte seu Google Calendar para ver tudo aqui
          </p>
        </motion.div>
      )}
    </div>
  );
}
