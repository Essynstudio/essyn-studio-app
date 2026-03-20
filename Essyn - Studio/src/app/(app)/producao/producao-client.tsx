"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Play,
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Clock,
  Layers,
  UserCircle,
} from "lucide-react";
import {
  PageTransition,
  WidgetEmptyState,
  StatusBadge,
  ActionPill,
  HelpTip,
} from "@/components/ui/apple-kit";
import { springDefault } from "@/lib/motion-tokens";
import { INPUT_CLS } from "@/lib/design-tokens";
import { useDrawer } from "@/components/drawers/drawer-provider";
import type { WorkflowItemStatus } from "@/lib/types";

// ── Types ──────────────────────────────────────

interface WorkflowProject {
  id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  team_ids: string[];
  clients: { id: string; name: string } | null;
}

interface Workflow {
  id: string;
  name: string;
  status: WorkflowItemStatus;
  deadline: string | null;
  assigned_to: string | null;
  notes: string | null;
  sort_order: number;
  workflow_template_id: string | null;
  created_at: string;
  updated_at: string;
  projects: WorkflowProject | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  active: boolean;
}

type TabFilter = "pendente" | "em_andamento" | "concluido";
type DeadlineFilter = "all" | "atrasados" | "7d" | "sem_responsavel";
type KPIFilter = "em_andamento" | "pendente" | "atrasados" | "concluido" | null;

// ── Helpers ──────────────────────────────────────

function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(w: Workflow): boolean {
  if (w.status === "concluido") return false;
  const d = daysUntilDeadline(w.deadline);
  return d !== null && d < 0;
}

function isUrgent(w: Workflow): boolean {
  if (w.status === "concluido") return false;
  const d = daysUntilDeadline(w.deadline);
  return d !== null && d >= 0 && d < 3;
}

function deadlineColor(days: number | null): string {
  if (days === null) return "var(--fg-muted)";
  if (days < 0) return "var(--error)";
  if (days < 7) return "var(--warning)";
  return "var(--fg-muted)";
}

function deadlineLabel(days: number | null): string {
  if (days === null) return "Sem prazo";
  if (days < 0) return `${Math.abs(days)}d atraso`;
  if (days === 0) return "Hoje";
  return `${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isPendingOverThreeDays(w: Workflow): boolean {
  if (w.status !== "pendente") return false;
  const created = new Date(w.created_at);
  const now = new Date();
  const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 3;
}

const DISMISSED_ALERTS_KEY = "essyn_producao_dismissed_alerts";

function getDismissedAlerts(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setDismissedAlert(key: string) {
  const current = getDismissedAlerts();
  current[key] = true;
  localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(current));
}

// ── Main Component ──────────────────────────────

export function ProducaoClient({
  workflows: initialWorkflows,
  teamMembers,
  studioId,
}: {
  workflows: Workflow[];
  teamMembers: TeamMember[];
  studioId: string;
}) {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("em_andamento");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [kpiFilter, setKPIFilter] = useState<KPIFilter>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDismissedAlerts(getDismissedAlerts());
  }, []);

  // ── Team map ──

  const teamMap = useMemo(() => {
    const map: Record<string, TeamMember> = {};
    teamMembers.forEach((m) => (map[m.id] = m));
    return map;
  }, [teamMembers]);

  // ── Counts ──

  const counts = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const emAndamento = workflows.filter((w) => w.status === "em_andamento");
    const pendente = workflows.filter((w) => w.status === "pendente");
    const atrasados = workflows.filter((w) => isOverdue(w));
    const concluido = workflows.filter(
      (w) => w.status === "concluido" && new Date(w.updated_at) >= startOfMonth
    );
    const urgentesEmAndamento = emAndamento.filter(
      (w) => {
        const d = daysUntilDeadline(w.deadline);
        return d !== null && d < 7;
      }
    );

    return {
      emAndamento: emAndamento.length,
      pendente: pendente.length,
      atrasados: atrasados.length,
      concluido: concluido.length,
      urgentes: urgentesEmAndamento.length,
      total: workflows.length,
    };
  }, [workflows]);

  // ── Alert counts ──

  const criticalCount = useMemo(
    () => workflows.filter((w) => isOverdue(w)).length,
    [workflows]
  );
  const waitingCount = useMemo(
    () => workflows.filter((w) => isPendingOverThreeDays(w)).length,
    [workflows]
  );


  // ── Filtered workflows ──

  const filteredWorkflows = useMemo(() => {
    let filtered = workflows;

    // KPI filter overrides tab
    if (kpiFilter) {
      if (kpiFilter === "atrasados") {
        filtered = filtered.filter((w) => isOverdue(w));
      } else if (kpiFilter === "concluido") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(
          (w) => w.status === "concluido" && new Date(w.updated_at) >= startOfMonth
        );
      } else {
        filtered = filtered.filter((w) => w.status === kpiFilter);
      }
    } else {
      // Tab filter
      filtered = filtered.filter((w) => w.status === activeTab);
    }

    // Deadline filter
    if (deadlineFilter === "atrasados") {
      filtered = filtered.filter((w) => isOverdue(w));
    } else if (deadlineFilter === "7d") {
      filtered = filtered.filter((w) => {
        const d = daysUntilDeadline(w.deadline);
        return d !== null && d >= 0 && d < 7;
      });
    } else if (deadlineFilter === "sem_responsavel") {
      filtered = filtered.filter((w) => !w.assigned_to);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((w) => {
        const projectName = w.projects?.name?.toLowerCase() || "";
        const clientName = w.projects?.clients?.name?.toLowerCase() || "";
        const workflowName = w.name.toLowerCase();
        return (
          projectName.includes(q) ||
          clientName.includes(q) ||
          workflowName.includes(q)
        );
      });
    }

    return filtered;
  }, [workflows, activeTab, deadlineFilter, kpiFilter, searchQuery]);

  // ── Project workflow counts (for progress bars) ──

  const projectWorkflowCounts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    workflows.forEach((w) => {
      const pid = w.projects?.id;
      if (!pid) return;
      if (!map[pid]) map[pid] = { total: 0, done: 0 };
      map[pid].total++;
      if (w.status === "concluido") map[pid].done++;
    });
    return map;
  }, [workflows]);

  // ── Status update ──

  const handleStatusUpdate = useCallback(
    async (workflow: Workflow, newStatus: WorkflowItemStatus) => {
      setUpdatingId(workflow.id);

      // Optimistic update
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflow.id
            ? { ...w, status: newStatus, updated_at: new Date().toISOString() }
            : w
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("project_workflows")
        .update({ status: newStatus })
        .eq("id", workflow.id)
        .eq("studio_id", studioId);

      if (error) {
        // Revert optimistic update
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflow.id ? { ...w, status: workflow.status } : w
          )
        );
        toast.error("Erro ao atualizar status: " + error.message);
      } else {
        const labels: Record<WorkflowItemStatus, string> = {
          pendente: "pendente",
          em_andamento: "em andamento",
          concluido: "concluido",
        };
        toast.success(`${workflow.name} marcado como ${labels[newStatus]}`);

        // Trigger automation: se marcou concluído, verifica se todos os itens do projeto estão prontos
        const projectId = workflow.projects?.id;
        if (newStatus === "concluido" && projectId) {
          const updatedWorkflows = workflows.map((w) =>
            w.id === workflow.id ? { ...w, status: newStatus } : w
          );
          const projectWorkflows = updatedWorkflows.filter((w) => w.projects?.id === projectId);
          const allDone = projectWorkflows.length > 0 && projectWorkflows.every((w) => w.status === "concluido");

          if (allDone) {
            fetch("/api/automations/trigger", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "workflow_all_done",
                projectId,
              }),
            }).then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                if (data.success) {
                  toast.success(`Produção avançada automaticamente → ${data.message.split("→")[1]?.trim() || "próxima fase"}`);
                }
              }
            }).catch(() => {});
          }
        }

        router.refresh();
      }

      setUpdatingId(null);
    },
    [studioId, router, workflows]
  );

  // ── Dismiss alert ──

  const dismissAlert = (key: string) => {
    setDismissedAlert(key);
    setDismissedAlerts((prev) => ({ ...prev, [key]: true }));
  };

  // ── KPI click ──

  const handleKPIClick = (filter: KPIFilter) => {
    setKPIFilter((prev) => (prev === filter ? null : filter));
    setDeadlineFilter("all");
  };

  // ── Deadline filter counts ──

  const filterCounts = useMemo(() => {
    const base = kpiFilter
      ? kpiFilter === "atrasados"
        ? workflows.filter((w) => isOverdue(w))
        : kpiFilter === "concluido"
        ? workflows.filter((w) => w.status === "concluido")
        : workflows.filter((w) => w.status === kpiFilter)
      : workflows.filter((w) => w.status === activeTab);

    return {
      all: base.length,
      atrasados: base.filter((w) => isOverdue(w)).length,
      "7d": base.filter((w) => {
        const d = daysUntilDeadline(w.deadline);
        return d !== null && d >= 0 && d < 7;
      }).length,
      sem_responsavel: base.filter((w) => !w.assigned_to).length,
    };
  }, [workflows, activeTab, kpiFilter]);

  // ── Render ──

  const hasWorkflows = workflows.length > 0;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ═══ Unified Panel ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em] flex items-center gap-2">
                  Produção
                  <HelpTip text="Projetos aparecem aqui automaticamente. Avance as fases conforme o trabalho progride: triagem, importação, seleção, edição, revisão, entrega." />
                </h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {counts.emAndamento} em produção · {counts.atrasados} atrasado{counts.atrasados !== 1 ? "s" : ""} · {counts.total} trabalhos
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Procurar trabalho, projeto ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Alert Banners */}
          <AnimatePresence>
            {criticalCount > 0 && !dismissedAlerts["critical"] && (
              <motion.div
                key="critical-alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springDefault}
              >
                <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--error-subtle)]">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--error)" }}>
                      {criticalCount} trabalho{criticalCount > 1 ? "s" : ""} com prazo crítico
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                      Verifique prazos e entregas pendentes para retomar o cronograma.
                    </p>
                    <button
                      onClick={() => { handleKPIClick("atrasados"); }}
                      className="text-[11px] font-medium mt-1 hover:underline"
                      style={{ color: "var(--error)" }}
                    >
                      Ver atrasados
                    </button>
                  </div>
                  <button
                    onClick={() => dismissAlert("critical")}
                    className="p-1 shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {waitingCount > 0 && !dismissedAlerts["waiting"] && (
              <motion.div
                key="waiting-alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springDefault}
              >
                <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--warning-subtle)]">
                  <Clock size={16} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--warning)" }}>
                      {waitingCount} trabalho{waitingCount > 1 ? "s" : ""} aguardando início há mais de 3 dias
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                      Considere iniciar ou reatribuir esses trabalhos.
                    </p>
                    <button
                      onClick={() => { handleKPIClick("pendente"); }}
                      className="text-[11px] font-medium mt-1 hover:underline"
                      style={{ color: "var(--warning)" }}
                    >
                      Ver pendentes
                    </button>
                  </div>
                  <button
                    onClick={() => dismissAlert("waiting")}
                    className="p-1 shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <button
              onClick={() => handleKPIClick("em_andamento")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${kpiFilter === "em_andamento" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Em Produção</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{counts.emAndamento}</p>
              <p className={`text-[10px] mt-1.5 ${counts.urgentes > 0 ? "text-[var(--warning)]" : "text-[var(--fg-muted)]"}`}>{counts.urgentes} urgentes</p>
            </button>
            <button
              onClick={() => handleKPIClick("pendente")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${kpiFilter === "pendente" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Novos</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{counts.pendente}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">aguardando início</p>
            </button>
            <button
              onClick={() => handleKPIClick("atrasados")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${kpiFilter === "atrasados" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Atrasados</p>
              <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${counts.atrasados > 0 ? "text-[var(--error)]" : "text-[var(--fg)]"}`}>{counts.atrasados}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">ação necessária</p>
            </button>
            <button
              onClick={() => handleKPIClick("concluido")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${kpiFilter === "concluido" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Finalizados</p>
              <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">{counts.concluido}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">este mês</p>
            </button>
          </div>

          {/* Filters — only when workflows exist */}
          {hasWorkflows && (
            <div className="px-6 py-4 space-y-3 border-t border-[var(--border-subtle)]">
              {/* Tab pills */}
              <div className="flex flex-wrap items-center gap-2">
                <ActionPill
                  label="Novos"
                  count={workflows.filter((w) => w.status === "pendente").length}
                  active={!kpiFilter && activeTab === "pendente"}
                  onClick={() => { setActiveTab("pendente"); setKPIFilter(null); setDeadlineFilter("all"); }}
                />
                <ActionPill
                  label="Em produção"
                  count={workflows.filter((w) => w.status === "em_andamento").length}
                  active={!kpiFilter && activeTab === "em_andamento"}
                  onClick={() => { setActiveTab("em_andamento"); setKPIFilter(null); setDeadlineFilter("all"); }}
                />
                <ActionPill
                  label="Finalizados"
                  count={workflows.filter((w) => w.status === "concluido").length}
                  active={!kpiFilter && activeTab === "concluido"}
                  onClick={() => { setActiveTab("concluido"); setKPIFilter(null); setDeadlineFilter("all"); }}
                />

                {kpiFilter && (
                  <button
                    onClick={() => setKPIFilter(null)}
                    className="flex items-center gap-1 text-[11px] text-[var(--info)] hover:underline ml-2"
                  >
                    <X size={12} />
                    Limpar filtro
                  </button>
                )}
              </div>

              {/* Deadline filter pills */}
              <div className="flex flex-wrap items-center gap-2">
                <ActionPill
                  label="Todas"
                  count={filterCounts.all}
                  active={deadlineFilter === "all"}
                  onClick={() => setDeadlineFilter("all")}
                />
                <ActionPill
                  label="Atrasados"
                  count={filterCounts.atrasados}
                  active={deadlineFilter === "atrasados"}
                  onClick={() => setDeadlineFilter("atrasados")}
                />
                <ActionPill
                  label="Vence em 7d"
                  count={filterCounts["7d"]}
                  active={deadlineFilter === "7d"}
                  onClick={() => setDeadlineFilter("7d")}
                />
                <ActionPill
                  label="Sem responsável"
                  count={filterCounts.sem_responsavel}
                  active={deadlineFilter === "sem_responsavel"}
                  onClick={() => setDeadlineFilter("sem_responsavel")}
                />
              </div>
            </div>
          )}

          {/* Empty state — inside unified card */}
          {!hasWorkflows && (
            <div className="border-t border-[var(--border-subtle)]">
              <WidgetEmptyState
                icon={Layers}
                title="Nenhum trabalho ainda"
                description="A produção é gerada automaticamente a partir dos seus projetos. Crie um projeto para começar."
                action={
                  <Link
                    href="/projetos?new=1"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[var(--info)] hover:opacity-90 transition-opacity"
                  >
                    <Layers size={16} />
                    Criar projeto
                  </Link>
                }
              />
            </div>
          )}
        </div>

        {/* ═══ Work Item List — separate card ═══ */}
        {hasWorkflows && filteredWorkflows.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <WidgetEmptyState
              icon={Layers}
              title="Nenhum trabalho encontrado"
              description="Tente ajustar a busca ou os filtros."
            />
          </div>
        )}

        {filteredWorkflows.length > 0 && (
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredWorkflows.map((w, index) => {
                const days = daysUntilDeadline(w.deadline);
                const overdue = isOverdue(w);
                const urgent = isUrgent(w);
                const projectId = w.projects?.id;
                const projectName = w.projects?.name || "Sem projeto";
                const clientName = w.projects?.clients?.name;
                const projectCounts = projectId
                  ? projectWorkflowCounts[projectId]
                  : null;
                const assignedMember = w.assigned_to ? teamMap[w.assigned_to] : null;
                const projectTeamIds = w.projects?.team_ids || [];
                const projectTeam = projectTeamIds
                  .map((id) => teamMap[id])
                  .filter(Boolean)
                  .slice(0, 3);

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 26,
                      delay: Math.min(index * 0.015, 0.3),
                    }}
                    className={`flex items-start gap-3 px-5 py-3 hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${
                      overdue ? "border-l-2 border-l-[var(--error)]" : ""
                    }`}
                    onClick={() => projectId && openDrawer(projectId, "producao")}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-0.5">
                      {assignedMember?.avatar_url ? (
                        <img
                          src={assignedMember.avatar_url}
                          alt={assignedMember.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                          {assignedMember ? (
                            <span className="text-[10px] font-medium text-[var(--fg-secondary)]">
                              {getInitials(assignedMember.name)}
                            </span>
                          ) : (
                            <UserCircle size={16} className="text-[var(--fg-muted)]" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-[var(--fg)] truncate">
                          {projectName}
                        </span>
                        <StatusBadge
                          label={w.name}
                          color="var(--fg-secondary)"
                          bg="var(--bg-subtle)"
                        />
                        {(overdue || urgent) && (
                          <StatusBadge
                            label={
                              overdue
                                ? `${Math.abs(days!)}d atraso`
                                : "Urgente"
                            }
                            color="var(--error)"
                            bg="var(--error-subtle)"
                          />
                        )}
                      </div>

                      {/* Subtitle */}
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">
                        {clientName ? `${clientName} · ` : ""}
                        {w.notes || w.name}
                      </p>

                      {/* Progress bar + days */}
                      <div className="flex items-center gap-3 mt-1.5">
                        {projectCounts && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--success)] transition-all"
                                style={{
                                  width: `${
                                    projectCounts.total > 0
                                      ? (projectCounts.done / projectCounts.total) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--fg-muted)]">
                              {projectCounts.done}/{projectCounts.total}
                            </span>
                          </div>
                        )}
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: deadlineColor(days) }}
                        >
                          {deadlineLabel(days)}
                        </span>
                      </div>
                    </div>

                    {/* Right side: team avatars + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Team avatars */}
                      {projectTeam.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {projectTeam.map((m) => (
                            <div
                              key={m.id}
                              title={m.name}
                              className="w-5 h-5 rounded-full bg-[var(--bg-subtle)] border border-[var(--card)] flex items-center justify-center"
                            >
                              {m.avatar_url ? (
                                <img
                                  src={m.avatar_url}
                                  alt={m.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-[8px] font-medium text-[var(--fg-muted)]">
                                  {getInitials(m.name)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action button */}
                      {w.status === "pendente" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(w, "em_andamento");
                          }}
                          disabled={updatingId === w.id}
                          className="p-1.5 rounded-lg text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors disabled:opacity-50"
                          title="Iniciar trabalho"
                        >
                          {updatingId === w.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                        </button>
                      )}

                      {w.status === "em_andamento" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(w, "concluido");
                          }}
                          disabled={updatingId === w.id}
                          className="p-1.5 rounded-lg text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors disabled:opacity-50"
                          title="Finalizar trabalho"
                        >
                          {updatingId === w.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                        </button>
                      )}

                      {/* Chevron */}
                      <ChevronRight
                        size={14}
                        className="text-[var(--fg-muted)]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
