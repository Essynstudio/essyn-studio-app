"use client";

import { motion } from "motion/react";
import { MapPin, Clock, User, Users, FileText, ChevronRight } from "lucide-react";

interface EventBriefing {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  projectName?: string;
  clientName?: string;
  teamMembers?: string[];
  notes?: string;
}

export function ShootDayBriefing({ events }: { events: EventBriefing[] }) {
  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[var(--warning,#C87A20)] animate-pulse" />
        <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
          {events.length === 1 ? "Evento hoje" : `${events.length} eventos hoje`}
        </p>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const time = new Date(event.startAt);
          const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return (
            <div
              key={event.id}
              className="rounded-xl border border-[var(--warning,#C87A20)]/15 bg-[var(--warning,#C87A20)]/[0.03] p-4 space-y-2.5"
            >
              {/* Event header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[14px] font-semibold text-[var(--fg)]">{event.title}</h4>
                  {event.projectName && event.projectName !== event.title && (
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Projeto: {event.projectName}</p>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-[var(--warning,#C87A20)] tabular-nums">{timeStr}</span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2">
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--fg-muted)] shrink-0" />
                    <span className="text-[11px] text-[var(--fg-secondary)] truncate">{event.location}</span>
                  </div>
                )}
                {event.clientName && (
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-[var(--fg-muted)] shrink-0" />
                    <span className="text-[11px] text-[var(--fg-secondary)] truncate">{event.clientName}</span>
                  </div>
                )}
                {event.teamMembers && event.teamMembers.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-[var(--fg-muted)] shrink-0" />
                    <span className="text-[11px] text-[var(--fg-secondary)] truncate">{event.teamMembers.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {event.notes && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                  <FileText size={12} className="text-[var(--fg-muted)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed line-clamp-2">{event.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
