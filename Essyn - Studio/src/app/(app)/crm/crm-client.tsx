"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Phone,
  Mail,
  CalendarDays,
  DollarSign,
  Loader2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Users,
  Target,
  Trophy,
  Search,
  AlertTriangle,
  AlertCircle,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  AppleDrawer,
  StatusBadge,
  WidgetEmptyState,
  ActionPill,
  HelpTip,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";

// --- Types ---

type LeadStage = "novo" | "contato" | "reuniao" | "proposta" | "negociacao" | "ganho" | "perdido";
type EventType = "casamento" | "ensaio" | "corporativo" | "aniversario" | "formatura" | "batizado" | "outro";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  event_type: EventType;
  event_date: string | null;
  event_location: string | null;
  estimated_value: number;
  stage: LeadStage;
  source: string | null;
  notes: string | null;
  tags: string[];
  next_action: string | null;
  next_action_date: string | null;
  lost_reason: string | null;
  converted_project_id: string | null;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
}

// --- Stage Config ---

const stages: { key: LeadStage; label: string; color: string; bg: string }[] = [
  { key: "novo", label: "Novo", color: "var(--info)", bg: "var(--info-subtle)" },
  { key: "contato", label: "Contato", color: "var(--purple)", bg: "var(--purple-subtle)" },
  { key: "reuniao", label: "Reunião", color: "var(--warning)", bg: "var(--warning-subtle)" },
  { key: "proposta", label: "Proposta", color: "var(--accent)", bg: "var(--accent-subtle)" },
  { key: "negociacao", label: "Negociação", color: "var(--pink)", bg: "var(--pink-subtle)" },
  { key: "ganho", label: "Ganho", color: "var(--success)", bg: "var(--success-subtle)" },
  { key: "perdido", label: "Perdido", color: "var(--error)", bg: "var(--error-subtle)" },
];

const eventTypeLabels: Record<EventType, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

const sourceLabels: Record<string, string> = {
  instagram: "Instagram",
  indicacao: "Indicação",
  site: "Site",
  anuncio: "Anúncio",
  google: "Google",
  outros: "Outros",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

type FilterKey = "todos" | "hoje" | "atrasados" | "sem_acao" | "alto_valor" | "indicacao";

// --- Main Component ---

export function CrmClient({
  leads: initialLeads,
  studioId,
}: {
  leads: Lead[];
  studioId: string;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const saved = localStorage.getItem("crm-dismissed-alerts");
    if (saved) {
      try { setDismissedAlerts(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }
    setToday(startOfDay(new Date()));
  }, []);

  // Computed values
  const activeLeads = useMemo(
    () => leads.filter((l) => !["ganho", "perdido"].includes(l.stage)),
    [leads]
  );
  const pipelineValue = useMemo(
    () => activeLeads.reduce((sum, l) => sum + Number(l.estimated_value), 0),
    [activeLeads]
  );
  const wonLeads = useMemo(() => leads.filter((l) => l.stage === "ganho"), [leads]);
  const wonValue = useMemo(
    () => wonLeads.reduce((sum, l) => sum + Number(l.estimated_value), 0),
    [wonLeads]
  );

  // Alert counts
  const overdueLeads = useMemo(
    () =>
      activeLeads.filter(
        (l) => l.next_action_date && isBefore(new Date(l.next_action_date), today)
      ),
    [activeLeads, today]
  );
  const noActionLeads = useMemo(
    () => activeLeads.filter((l) => !l.next_action),
    [activeLeads]
  );
  const requireAction = overdueLeads.length + noActionLeads.length;

  // Filter counts
  const todayLeads = useMemo(
    () =>
      activeLeads.filter(
        (l) => l.next_action_date && isSameDay(new Date(l.next_action_date), today)
      ),
    [activeLeads, today]
  );
  const highValueLeads = useMemo(
    () => activeLeads.filter((l) => Number(l.estimated_value) >= 5000),
    [activeLeads]
  );
  const indicacaoLeads = useMemo(
    () => activeLeads.filter((l) => l.source === "indicacao"),
    [activeLeads]
  );

  // Filter logic
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.event_location?.toLowerCase().includes(q)
      );
    }

    // Filter pills
    switch (activeFilter) {
      case "hoje":
        result = result.filter(
          (l) => l.next_action_date && isSameDay(new Date(l.next_action_date), today)
        );
        break;
      case "atrasados":
        result = result.filter(
          (l) =>
            l.next_action_date &&
            isBefore(new Date(l.next_action_date), today) &&
            !["ganho", "perdido"].includes(l.stage)
        );
        break;
      case "sem_acao":
        result = result.filter(
          (l) => !l.next_action && !["ganho", "perdido"].includes(l.stage)
        );
        break;
      case "alto_valor":
        result = result.filter((l) => Number(l.estimated_value) >= 5000);
        break;
      case "indicacao":
        result = result.filter((l) => l.source === "indicacao");
        break;
    }

    return result;
  }, [leads, search, activeFilter, today]);

  // Pipeline stages (exclude ganho/perdido)
  const pipelineStages = stages.filter((s) => s.key !== "ganho" && s.key !== "perdido");

  // Recent leads (sorted by next_action_date or created_at)
  const recentLeads = useMemo(() => {
    return [...activeLeads]
      .sort((a, b) => {
        const aDate = a.next_action_date || a.created_at;
        const bDate = b.next_action_date || b.created_at;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .slice(0, showAllRecent ? 20 : 5);
  }, [activeLeads, showAllRecent]);

  function dismissAlert(key: string) {
    const next = new Set(dismissedAlerts);
    next.add(key);
    setDismissedAlerts(next);
    localStorage.setItem("crm-dismissed-alerts", JSON.stringify([...next]));
  }

  async function moveLeadToStage(leadId: string, newStage: LeadStage) {
    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({ stage: newStage })
      .eq("id", leadId)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao mover lead");
      return;
    }

    setLeads(leads.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    toast.success(`Lead movido para ${stages.find((s) => s.key === newStage)?.label}`);
    router.refresh();
  }

  return (
    <PageTransition>
      {/* ═══ Unified Panel ═══ */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)] leading-tight flex items-center gap-2">
                CRM — Pipeline
                <HelpTip text="Arraste leads entre as colunas para avancar no funil. Quando marcar como 'Ganho', o lead pode ser convertido em projeto." />
              </h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-1">
                {activeLeads.length} leads ativos · pipeline {formatCurrency(pipelineValue)}
              </p>
            </div>
            <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
              <Plus size={16} />
              Novo lead
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar leads, contatos..."
              className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
            />
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {overdueLeads.length > 0 && !dismissedAlerts.has("overdue") && (
            <motion.div
              {...springContentIn}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--error-subtle)]"
            >
              <AlertCircle size={16} className="text-[var(--error)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[var(--error)]">
                  {overdueLeads.length} lead{overdueLeads.length !== 1 ? "s" : ""} com ação
                  atrasada
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  Entre em contato o mais rápido possível para não perder a oportunidade.
                </p>
                <button
                  onClick={() => setActiveFilter("atrasados")}
                  className="text-[11px] font-medium text-[var(--error)] hover:underline mt-1"
                >
                  Ver atrasados
                </button>
              </div>
              <button onClick={() => dismissAlert("overdue")} className={GHOST_BTN}>
                <X size={14} />
              </button>
            </motion.div>
          )}

          {noActionLeads.length > 0 && !dismissedAlerts.has("no_action") && (
            <motion.div
              {...springContentIn}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--warning-subtle)]"
            >
              <AlertTriangle
                size={16}
                className="text-[var(--warning)] mt-0.5 shrink-0"
              />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[var(--warning)]">
                  {noActionLeads.length} lead{noActionLeads.length !== 1 ? "s" : ""} sem próxima
                  ação definida
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  Agende follow-ups para manter o pipeline ativo.
                </p>
                <button
                  onClick={() => setActiveFilter("sem_acao")}
                  className="text-[11px] font-medium text-[var(--warning)] hover:underline mt-1"
                >
                  Ver sem ação
                </button>
              </div>
              <button onClick={() => dismissAlert("no_action")} className={GHOST_BTN}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <p className="text-[24px] font-bold text-[var(--info)] tracking-[-0.026em] leading-none tabular-nums">{activeLeads.length}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Leads Ativos</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">no pipeline</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[18px] font-bold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">{formatCurrency(pipelineValue)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Valor Pipeline</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">oportunidades abertas</p>
          </div>
          <div className="px-5 py-4">
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${requireAction > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{requireAction}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Requerem Ação</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{requireAction > 0 ? "hoje ou atrasados" : "tudo em dia"}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[18px] font-bold text-[var(--success)] tracking-[-0.02em] leading-none tabular-nums">{formatCurrency(wonValue)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Ganhos</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{wonLeads.length} convertido{wonLeads.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <ActionPill
              label="Todos"
              count={activeLeads.length}
              active={activeFilter === "todos"}
              onClick={() => setActiveFilter("todos")}
            />
            <ActionPill
              label="Hoje"
              count={todayLeads.length}
              active={activeFilter === "hoje"}
              onClick={() => setActiveFilter("hoje")}
            />
            <ActionPill
              label="Atrasados"
              count={overdueLeads.length}
              active={activeFilter === "atrasados"}
              onClick={() => setActiveFilter("atrasados")}
            />
            <ActionPill
              label="Sem próxima ação"
              count={noActionLeads.length}
              active={activeFilter === "sem_acao"}
              onClick={() => setActiveFilter("sem_acao")}
            />
            <ActionPill
              label="Alto valor"
              count={highValueLeads.length}
              active={activeFilter === "alto_valor"}
              onClick={() => setActiveFilter("alto_valor")}
            />
            <ActionPill
              label="Indicação"
              count={indicacaoLeads.length}
              active={activeFilter === "indicacao"}
              onClick={() => setActiveFilter("indicacao")}
            />
          </div>
        </div>

        {/* Empty state (when no leads at all) */}
        {leads.length === 0 && (
          <div className="border-t border-[var(--border-subtle)] px-6 py-12">
            <WidgetEmptyState
              title="Nenhum lead ainda"
              description="Crie seu primeiro lead para começar a gerenciar seu pipeline"
            />
          </div>
        )}
      </div>

      {/* ═══ Kanban (outside unified card) ═══ */}
      {leads.length > 0 && (
        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="flex gap-4 min-w-max pb-4">
            {pipelineStages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);
              const stageValue = stageLeads.reduce(
                (sum, l) => sum + Number(l.estimated_value),
                0
              );

              return (
                <motion.div
                  key={stage.key}
                  {...springContentIn}
                  className="w-72 shrink-0 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)]"
                >
                  {/* Column header */}
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-semibold text-[var(--fg)]">
                          {stage.label}
                        </span>
                        <span className="text-xs text-[var(--fg-muted)] bg-[var(--border-subtle)] px-1.5 py-0.5 rounded-full">
                          {stageLeads.length}
                        </span>
                      </div>
                    </div>
                    {stageValue > 0 && (
                      <p className="text-xs text-[var(--fg-muted)] mt-1">
                        {formatCurrency(stageValue)}
                      </p>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-[100px]">
                    <AnimatePresence mode="popLayout">
                      {stageLeads.map((lead, i) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          stages={stages}
                          currentStage={stage.key}
                          index={i}
                          onMove={moveLeadToStage}
                          onClick={() => setSelectedLead(lead)}
                        />
                      ))}
                    </AnimatePresence>

                    {stageLeads.length === 0 && (
                      <WidgetEmptyState
                        title="Nenhum lead"
                        description="Arraste ou crie um lead para esta etapa"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Won / Lost summary (outside, shadow card) ═══ */}
      {(wonLeads.length > 0 || leads.some((l) => l.stage === "perdido")) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wonLeads.length > 0 && (
            <div className="bg-[var(--card)] rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
              <h3 className="text-sm font-semibold text-[var(--success)] mb-3">
                Ganhos ({wonLeads.length})
              </h3>
              <div className="space-y-2">
                {wonLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--fg)]">{lead.name}</span>
                    <span className="text-[var(--fg-muted)]">
                      {formatCurrency(Number(lead.estimated_value))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {leads.some((l) => l.stage === "perdido") && (
            <div className="bg-[var(--card)] rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
              <h3 className="text-sm font-semibold text-[var(--error)] mb-3">
                Perdidos ({leads.filter((l) => l.stage === "perdido").length})
              </h3>
              <div className="space-y-2">
                {leads
                  .filter((l) => l.stage === "perdido")
                  .slice(0, 5)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[var(--fg)]">{lead.name}</span>
                      <span className="text-[var(--fg-muted)]">
                        {lead.lost_reason || "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Leads Recentes (outside, shadow card) ═══ */}
      {activeLeads.length > 0 && (
        <div className="space-y-3">
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]" style={{ boxShadow: "var(--shadow-sm)" }}>
            {recentLeads.map((lead) => {
              const isOverdue =
                lead.next_action_date && isBefore(new Date(lead.next_action_date), today);
              const isToday =
                lead.next_action_date && isSameDay(new Date(lead.next_action_date), today);

              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="flex items-center gap-4 w-full text-left px-5 py-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-semibold text-[var(--fg-muted)]">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                      {lead.name}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] truncate">
                      {lead.next_action || "Sem próxima ação definida"}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    {lead.next_action_date && (
                      <span
                        className={`text-[11px] font-medium flex items-center gap-1 ${
                          isOverdue
                            ? "text-[var(--error)]"
                            : isToday
                              ? "text-[var(--success)]"
                              : "text-[var(--fg-muted)]"
                        }`}
                      >
                        <Clock size={10} />
                        {format(new Date(lead.next_action_date), "d MMM", { locale: ptBR })}
                      </span>
                    )}
                    {Number(lead.estimated_value) > 0 && (
                      <span className="text-[12px] font-medium text-[var(--fg-secondary)]">
                        {formatCurrency(Number(lead.estimated_value))}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-[var(--fg-muted)]" />
                  </div>
                </button>
              );
            })}
          </div>

          {activeLeads.length > 5 && (
            <button
              onClick={() => setShowAllRecent(!showAllRecent)}
              className="w-full text-center py-2 text-[12px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors flex items-center justify-center gap-1"
            >
              {showAllRecent
                ? "Mostrar menos"
                : `Mais ${activeLeads.length - 5} leads`}
              <ChevronDown
                size={14}
                className={`transition-transform ${showAllRecent ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}

      {/* New Lead Modal */}
      <NewLeadModal
        open={showNewModal}
        studioId={studioId}
        onClose={() => setShowNewModal(false)}
        onCreated={(lead) => {
          setLeads([lead, ...leads]);
          setShowNewModal(false);
          toast.success("Lead criado com sucesso!");
          router.refresh();
        }}
      />

      {/* Lead Detail Drawer */}
      <LeadDetail
        lead={selectedLead}
        stages={stages}
        onClose={() => setSelectedLead(null)}
        onMove={(stage) => {
          if (selectedLead) {
            moveLeadToStage(selectedLead.id, stage);
            setSelectedLead({ ...selectedLead, stage });
          }
        }}
      />
    </PageTransition>
  );
}


/* ═══════════ Lead Card ═══════════ */

function LeadCard({
  lead,
  stages,
  currentStage,
  index,
  onMove,
  onClick,
}: {
  lead: Lead;
  stages: { key: LeadStage; label: string; color: string; bg: string }[];
  currentStage: LeadStage;
  index: number;
  onMove: (leadId: string, stage: LeadStage) => void;
  onClick: () => void;
}) {
  const stageIndex = stages.findIndex((s) => s.key === currentStage);
  const nextStage = stageIndex < stages.length - 1 ? stages[stageIndex + 1] : null;
  const stageConfig = stages.find((s) => s.key === currentStage);

  const isOverdue =
    lead.next_action_date && isBefore(new Date(lead.next_action_date), startOfDay(new Date()));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        delay: index * 0.015,
      }}
      whileHover={{
        scale: 1.01,
        transition: { type: "spring", stiffness: 500, damping: 30 },
      }}
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 cursor-pointer shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-[var(--fg)] leading-tight truncate pr-2">
          {lead.name}
        </h4>
        <StatusBadge
          label={stageConfig?.label || currentStage}
          color={stageConfig?.color || "var(--fg-muted)"}
          bg={stageConfig?.bg || "var(--border-subtle)"}
        />
      </div>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <StatusBadge
          label={eventTypeLabels[lead.event_type]}
          color="var(--fg-secondary)"
          bg="var(--border-subtle)"
        />
        {lead.source && (
          <StatusBadge
            label={sourceLabels[lead.source] || lead.source}
            color="var(--fg-muted)"
            bg="var(--bg)"
          />
        )}
      </div>

      {Number(lead.estimated_value) > 0 && (
        <p className="text-sm font-semibold text-[var(--fg)] mb-2">
          {formatCurrency(Number(lead.estimated_value))}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
        {lead.event_date && (
          <span className="flex items-center gap-1">
            <CalendarDays size={10} />
            {format(new Date(lead.event_date), "d MMM", { locale: ptBR })}
          </span>
        )}
        {lead.source && (
          <span className="flex items-center gap-1">
            {sourceLabels[lead.source] || lead.source}
          </span>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {lead.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--fg-muted)]"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 4 && (
            <span className="text-[9px] text-[var(--fg-muted)]">
              +{lead.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-[var(--error)]">
          <AlertCircle size={10} />
          Ação atrasada
        </div>
      )}

      {/* Quick advance button */}
      {nextStage && nextStage.key !== "ganho" && nextStage.key !== "perdido" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(lead.id, nextStage.key);
          }}
          className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium ${GHOST_BTN}`}
        >
          Mover para {nextStage.label}
          <ChevronRight size={10} />
        </button>
      )}
    </motion.div>
  );
}

/* ═══════════ Lead Detail Drawer ═══════════ */

function LeadDetail({
  lead,
  stages,
  onClose,
  onMove,
}: {
  lead: Lead | null;
  stages: { key: LeadStage; label: string; color: string; bg: string }[];
  onClose: () => void;
  onMove: (stage: LeadStage) => void;
}) {
  return (
    <AppleDrawer open={!!lead} onClose={onClose} title={lead?.name || ""}>
      {lead && (
        <div className="p-6 space-y-6">
          {/* Stage */}
          <div>
            <label className={LABEL_CLS}>Etapa</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {stages.map((s) => {
                const isActive = lead.stage === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => onMove(s.key)}
                    className="transition-colors"
                  >
                    <StatusBadge
                      label={s.label}
                      color={isActive ? s.color : "var(--fg-secondary)"}
                      bg={isActive ? s.bg : "transparent"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <DetailRow
              label="Tipo de evento"
              value={eventTypeLabels[lead.event_type]}
            />
            {lead.estimated_value > 0 && (
              <DetailRow
                label="Valor estimado"
                value={formatCurrency(Number(lead.estimated_value))}
              />
            )}
            {lead.email && (
              <DetailRow label="Email" value={lead.email} icon={<Mail size={14} />} />
            )}
            {lead.phone && (
              <DetailRow label="Telefone" value={lead.phone} icon={<Phone size={14} />} />
            )}
            {lead.event_date && (
              <DetailRow
                label="Data do evento"
                value={format(new Date(lead.event_date), "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
                icon={<CalendarDays size={14} />}
              />
            )}
            {lead.event_location && (
              <DetailRow
                label="Local"
                value={lead.event_location}
                icon={<MapPin size={14} />}
              />
            )}
            {lead.source && (
              <DetailRow
                label="Origem"
                value={sourceLabels[lead.source] || lead.source}
              />
            )}
            {lead.next_action && (
              <DetailRow label="Próxima ação" value={lead.next_action} />
            )}
            {lead.next_action_date && (
              <DetailRow
                label="Data da ação"
                value={format(new Date(lead.next_action_date), "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
                icon={<Clock size={14} />}
              />
            )}

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {lead.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--border-subtle)] text-[var(--fg-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <label className={LABEL_CLS}>Observações</label>
                <p className="text-sm text-[var(--fg)] mt-1 whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--fg-muted)]">
              Criado em{" "}
              {format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      )}
    </AppleDrawer>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
        {label}
      </label>
      <p className="text-sm text-[var(--fg)] mt-0.5 flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

/* ═══════════ New Lead Modal ═══════════ */

function NewLeadModal({
  open,
  studioId,
  onClose,
  onCreated,
}: {
  open: boolean;
  studioId: string;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    event_type: "casamento" as EventType,
    event_date: "",
    event_location: "",
    estimated_value: "",
    source: "instagram",
    notes: "",
    next_action: "",
    next_action_date: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        event_type: form.event_type,
        event_date: form.event_date || null,
        event_location: form.event_location || null,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
        source: form.source || null,
        notes: form.notes || null,
        next_action: form.next_action || null,
        next_action_date: form.next_action_date || null,
      })
      .select(
        `
        id, name, email, phone, event_type, event_date,
        event_location, estimated_value, stage, source,
        notes, tags, next_action, next_action_date,
        lost_reason, converted_project_id,
        created_at, updated_at,
        clients (id, name)
      `
      )
      .single();

    if (error) {
      toast.error("Erro ao criar lead: " + error.message);
      setLoading(false);
      return;
    }

    onCreated(data as unknown as Lead);
  }

  return (
    <AppleModal open={open} onClose={onClose} title="Novo lead">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className={LABEL_CLS}>Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Maria Silva"
            required
            className={INPUT_CLS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@cliente.com"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Tipo de evento</label>
            <select
              value={form.event_type}
              onChange={(e) =>
                setForm({ ...form, event_type: e.target.value as EventType })
              }
              className={`w-full ${SELECT_CLS}`}
            >
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Origem</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className={`w-full ${SELECT_CLS}`}
            >
              {Object.entries(sourceLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Data do evento</label>
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Local</label>
            <input
              type="text"
              value={form.event_location}
              onChange={(e) =>
                setForm({ ...form, event_location: e.target.value })
              }
              placeholder="Ex: Espaço Villa Garden, SP"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Valor estimado (R$)</label>
          <div className="relative">
            <DollarSign
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.estimated_value}
              onChange={(e) =>
                setForm({ ...form, estimated_value: e.target.value })
              }
              placeholder="Ex: 5000"
              className={`${INPUT_CLS} !pl-9`}
            />
          </div>
        </div>

        {/* Next Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Próxima ação</label>
            <input
              type="text"
              value={form.next_action}
              onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              placeholder="Ex: Ligar para confirmar data do ensaio"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Data da ação</label>
            <input
              type="date"
              value={form.next_action_date}
              onChange={(e) =>
                setForm({ ...form, next_action_date: e.target.value })
              }
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Observações</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Observações sobre o lead..."
            className={`${INPUT_CLS} !h-auto py-3 resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={SECONDARY_CTA}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className={PRIMARY_CTA}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Criando...
              </>
            ) : (
              "Criar lead"
            )}
          </button>
        </div>
      </form>
    </AppleModal>
  );
}
