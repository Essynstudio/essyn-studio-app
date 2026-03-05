import type { ReactNode } from "react";
import {
  Calendar,
  ChevronRight,
  FileText,
  DollarSign,
  Users,
  MessageSquare,
  CircleCheck,
  Circle,
  MapPin,
  Clock,
} from "lucide-react";
import {
  AvailabilityPill,
  type AvailabilityPillData,
} from "./availability-pill";

/* ═══════════════════════════════════════════════════ */
/*  AgendaSidebarPanel — Sidebar panel for Agenda      */
/*  Cards: Próximo Projeto, Checklist, Sábados do mês */
/*  Variants: expanded / compact                       */
/*  CTA always black (system primary)                  */
/*  Ref: Apple Calendar sidebar + Notion side peek     */
/* ═══════════════════════════════════════════════════ */

/* ── Types ── */

export interface ProximoProjetoData {
  nome: string;
  cliente: string;
  data: string;
  diasRestantes: number;
  local?: string;
}

export interface ChecklistItemData {
  id: string;
  label: string;
  done: boolean;
  /** Custom icon — otherwise uses default */
  icon?: ReactNode;
}

/* ── Default checklist icons ── */

const defaultChecklistIcons: Record<string, ReactNode> = {
  contrato: <FileText className="w-3.5 h-3.5" />,
  pagamento: <DollarSign className="w-3.5 h-3.5" />,
  equipe: <Users className="w-3.5 h-3.5" />,
  briefing: <MessageSquare className="w-3.5 h-3.5" />,
};

/* ── Sub-components ── */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.06em] text-[#D1D1D6]"
      style={{ fontWeight: 600 }}
    >
      {children}
    </span>
  );
}

function ProximoProjetoCard({
  data,
  onAbrir,
  compact,
}: {
  data: ProximoProjetoData;
  onAbrir?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl bg-white border border-[#E5E5EA] shadow-[0_1px_3px_#E5E5EA] overflow-hidden ${
        compact ? "gap-2.5" : "gap-3"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b border-[#F2F2F7] ${
          compact ? "px-3.5 py-2.5" : "px-5 py-3"
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-[#AEAEB2]" />
          <SectionTitle>Próximo Projeto</SectionTitle>
        </div>
        {/* Days counter */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] numeric ${
            data.diasRestantes <= 3
              ? "text-[#FF3B30] border border-[#E5E5EA]"
              : data.diasRestantes <= 7
              ? "text-[#FF9500] border border-[#E5E5EA]"
              : "text-[#AEAEB2] border border-[#E5E5EA]"
          }`}
          style={{ fontWeight: 600 }}
        >
          {data.diasRestantes}d
        </span>
      </div>

      <div className={`flex flex-col gap-2 ${compact ? "px-3.5" : "px-5"}`}>
        <span
          className={`text-[#636366] truncate ${
            compact ? "text-[12px]" : "text-[13px]"
          }`}
          style={{ fontWeight: 500 }}
        >
          {data.nome}
        </span>
        <div
          className="flex flex-col gap-1 text-[11px] text-[#C7C7CC]"
          style={{ fontWeight: 400 }}
        >
          <span>{data.cliente}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 numeric">
              <Clock className="w-2.5 h-2.5" />
              {data.data}
            </span>
            {data.local && (
              <>
                <span className="text-[#E5E5EA]">&middot;</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {data.local}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${compact ? "px-3.5 pb-3" : "px-5 pb-4"}`}>
        {onAbrir && (
          <button
            onClick={onAbrir}
            className={`flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#1D1D1F] text-white hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E8E93] focus-visible:ring-offset-1 ${
              compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-[12px]"
            }`}
            style={{ fontWeight: 500 }}
          >
            Abrir Projeto
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function ChecklistCard({
  items,
  compact,
}: {
  items: ChecklistItemData[];
  compact?: boolean;
}) {
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-[#E5E5EA] shadow-[0_1px_3px_#F2F2F7] overflow-hidden">
      <div
        className={`flex items-center justify-between border-b border-[#F2F2F7] ${
          compact ? "px-3.5 py-2.5" : "px-5 py-3"
        }`}
      >
        <div className="flex items-center gap-2">
          <CircleCheck className="w-3 h-3 text-[#AEAEB2]" />
          <SectionTitle>Checklist Projeto</SectionTitle>
        </div>
        <span
          className="text-[10px] text-[#C7C7CC] numeric"
          style={{ fontWeight: 500 }}
        >
          {doneCount}/{total}
        </span>
      </div>

      <div
        className={`flex flex-col ${compact ? "px-3.5 py-2.5" : "px-5 py-3"}`}
      >
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-[#F2F2F7] mb-3">
          <div
            className={`h-full rounded-full transition-all ${
              progressPct === 100
                ? "bg-[#34C759]"
                : progressPct >= 50
                ? "bg-[#AEAEB2]"
                : "bg-[#D1D1D6]"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <span
                className={`shrink-0 ${
                  item.done ? "text-[#34C759]" : "text-[#D1D1D6]"
                }`}
              >
                {item.done ? (
                  <CircleCheck className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </span>
              <span
                className={`text-[12px] flex-1 ${
                  item.done
                    ? "text-[#C7C7CC] line-through"
                    : "text-[#8E8E93]"
                }`}
                style={{ fontWeight: 400 }}
              >
                {item.label}
              </span>
              {item.icon && (
                <span
                  className={`shrink-0 ${
                    item.done ? "text-[#E5E5EA]" : "text-[#D1D1D6]"
                  }`}
                >
                  {item.icon}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SabadosCard({
  sabados,
  compact,
}: {
  sabados: AvailabilityPillData[];
  compact?: boolean;
}) {
  const livreCount = sabados.filter((s) => s.status === "livre").length;
  const ocupadoCount = sabados.filter((s) => s.status === "ocupado").length;

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-[#E5E5EA] shadow-[0_1px_3px_#F2F2F7] overflow-hidden">
      <div
        className={`flex items-center justify-between border-b border-[#F2F2F7] ${
          compact ? "px-3.5 py-2.5" : "px-5 py-3"
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-[#AEAEB2]" />
          <SectionTitle>Sábados do Mês</SectionTitle>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] text-[#34C759] numeric"
            style={{ fontWeight: 600 }}
          >
            {livreCount} livre{livreCount !== 1 && "s"}
          </span>
          <span className="text-[#E5E5EA] text-[9px]">/</span>
          <span
            className="text-[10px] text-[#FF3B30] numeric"
            style={{ fontWeight: 600 }}
          >
            {ocupadoCount} ocupado{ocupadoCount !== 1 && "s"}
          </span>
        </div>
      </div>

      <div
        className={`flex flex-wrap gap-2 ${
          compact ? "px-3.5 py-2.5" : "px-5 py-3.5"
        }`}
      >
        {sabados.map((s) => (
          <AvailabilityPill
            key={s.date}
            data={s}
            size={compact ? "sm" : "md"}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

interface AgendaSidebarPanelProps {
  /** Próximo projeto data */
  proximoProjeto?: ProximoProjetoData;
  /** Checklist items */
  checklist?: ChecklistItemData[];
  /** Saturday availability data */
  sabados?: AvailabilityPillData[];
  /** CTA "Abrir" click handler */
  onAbrirProjeto?: () => void;
  /** Variant: expanded (default) or compact (sidebar) */
  variant?: "expanded" | "compact";
}

export function AgendaSidebarPanel({
  proximoProjeto,
  checklist,
  sabados,
  onAbrirProjeto,
  variant = "expanded",
}: AgendaSidebarPanelProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`flex flex-col ${isCompact ? "gap-3" : "gap-4"}`}>
      {proximoProjeto && (
        <ProximoProjetoCard
          data={proximoProjeto}
          onAbrir={onAbrirProjeto}
          compact={isCompact}
        />
      )}
      {checklist && checklist.length > 0 && (
        <ChecklistCard items={checklist} compact={isCompact} />
      )}
      {sabados && sabados.length > 0 && (
        <SabadosCard sabados={sabados} compact={isCompact} />
      )}
    </div>
  );
}

export { defaultChecklistIcons };