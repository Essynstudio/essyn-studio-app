"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format, isToday, isThisWeek, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  FolderOpen,
  SearchX,
  AlertCircle,
  AlertTriangle,
  X,
  ChevronDown,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";
import {
  PageTransition,
  StatusBadge,
  WidgetEmptyState,
  ActionPill,
} from "@/components/ui/apple-kit";
import { PRIMARY_CTA, INPUT_CLS } from "@/lib/design-tokens";
import { springDefault } from "@/lib/motion-tokens";
import { useDrawer } from "@/components/drawers/drawer-provider";
import type { DrawerData } from "@/components/drawers/project-drawer";
import { NewProjectWizard } from "@/components/wizard/new-project-wizard";
import type { Pack, WorkflowTemplate, CatalogProduct, WorkflowItemStatus, FinancialStatus, WizardFormData, Client } from "@/lib/types";

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

type ProjectStatus = "rascunho" | "confirmado" | "producao" | "edicao" | "entregue" | "cancelado";
type EventType = "casamento" | "ensaio" | "corporativo" | "aniversario" | "formatura" | "batizado" | "outro";

interface ProjectWorkflowSummary {
  id: string;
  status: WorkflowItemStatus;
}

interface InstallmentSummary {
  id: string;
  status: FinancialStatus;
  due_date: string;
}

interface Project {
  id: string;
  name: string;
  event_type: EventType;
  status: ProjectStatus;
  production_phase: string | null;
  event_date: string | null;
  event_location: string | null;
  project_locations: { name: string; sort_order: number }[] | null;
  value: number;
  paid: number;
  notes: string | null;
  tags: string[];
  team_ids: string[] | null;
  delivery_deadline_date: string | null;
  delivery_deadline_days: number | null;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
  project_workflows: ProjectWorkflowSummary[] | null;
  installments: InstallmentSummary[] | null;
}

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

type QuickFilter = "todos" | "hoje" | "semana" | "30dias" | "producao" | "pendencias" | "atrasados";

/* ═══════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════ */

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  confirmado: { label: "Confirmado", color: "var(--info)", bg: "var(--info-subtle)" },
  producao: { label: "Produção", color: "var(--warning)", bg: "var(--warning-subtle)" },
  edicao: { label: "Edição", color: "var(--accent)", bg: "var(--accent-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error-subtle)" },
};

const eventTypeLabels: Record<EventType, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

const roleColors: Record<string, string> = {
  fotografo: "var(--info)",
  editor: "var(--accent)",
  assistente: "var(--warning)",
  videomaker: "var(--success)",
  default: "var(--fg-muted)",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

const DISMISSED_ALERTS_KEY = "essyn_projetos_dismissed_alerts";

function getDismissedAlerts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismissAlert(alertId: string) {
  const dismissed = getDismissedAlerts();
  if (!dismissed.includes(alertId)) {
    dismissed.push(alertId);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
  }
}

function isOverdueProject(p: Project): boolean {
  if (!p.delivery_deadline_date) return false;
  if (!["producao", "edicao"].includes(p.status)) return false;
  return isBefore(new Date(p.delivery_deadline_date), startOfDay(new Date()));
}

function hasOverdueInstallments(p: Project): boolean {
  if (!p.installments || p.installments.length === 0) return false;
  const today = startOfDay(new Date());
  return p.installments.some(
    (inst) => inst.status === "pendente" && isBefore(new Date(inst.due_date), today)
  );
}

function hasPendencias(p: Project): boolean {
  const noTeam = !p.team_ids || p.team_ids.length === 0;
  const noLocation = !p.event_location;
  return noTeam || noLocation;
}

/* ═══════════════════════════════════════════════
   FilterDropdown — portal-based dropdown
   ═══════════════════════════════════════════════ */

function FilterDropdown({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const isActive = value !== "todos";
  const selectedLabel = options.find((o) => o.key === value)?.label;

  const handleToggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(!open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 tracking-[-0.006em] ${
          isActive
            ? "text-[var(--fg)] bg-[var(--card)]"
            : "text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-subtle)]"
        }`}
        style={isActive ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0.5px 1px rgba(0,0,0,0.06)" } : undefined}
      >
        {Icon && <Icon size={12} className="text-[var(--fg-muted)]" />}
        {isActive ? selectedLabel : label}
        <ChevronDown size={10} className={`text-[var(--fg-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
          {/* Menu */}
          <div
            className="fixed z-[100] min-w-[160px] py-1.5 rounded-xl bg-[var(--card)] overflow-hidden"
            style={{
              top: pos.top,
              left: pos.left,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
          >
            {isActive && (
              <button
                onClick={() => { onChange("todos"); setOpen(false); }}
                className="w-full px-3.5 py-2 text-[11px] text-[var(--info)] text-left hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Limpar filtro
              </button>
            )}
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => { onChange(option.key); setOpen(false); }}
                className={`w-full px-3.5 py-2 text-[12px] text-left transition-colors ${
                  value === option.key
                    ? "text-[var(--fg)] font-medium bg-[var(--bg-subtle)]"
                    : "text-[var(--fg-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export function ProjetosClient({
  projects: initialProjects,
  clients,
  packs,
  workflowTemplates,
  catalogProducts,
  teamMembers,
  studioId,
}: {
  projects: Project[];
  clients: ClientOption[];
  packs: Pack[];
  workflowTemplates: WorkflowTemplate[];
  catalogProducts: CatalogProduct[];
  teamMembers: TeamMember[];
  studioId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openDrawer, registerEditHandler } = useDrawer();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "todos">("todos");
  const [filterEventType, setFilterEventType] = useState<EventType | "todos">("todos");
  const [filterYear, setFilterYear] = useState<string>("todos");
  const [filterMonth, setFilterMonth] = useState<string>("todos");
  const [showWizard, setShowWizard] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | undefined>(undefined);
  const [editInitialData, setEditInitialData] = useState<Partial<WizardFormData> | undefined>(undefined);
  const [editInitialStep, setEditInitialStep] = useState<number | undefined>(undefined);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    setDismissedAlerts(getDismissedAlerts());
  }, []);

  // Register edit handler so drawer can open wizard
  useEffect(() => {
    registerEditHandler((drawerData: DrawerData, targetStep?: number) => {
      const proj = drawerData.project;
      if (!proj) return;
      const client = proj.clients as Client | null;

      const initialData: Partial<WizardFormData> = {
        client_mode: "existing",
        client_id: client?.id || "",
        client_name: client?.name || "",
        client_email: client?.email || "",
        client_phone: client?.phone || "",
        client_document: client?.document || "",
        project_name: proj.name,
        event_type: proj.event_type,
        event_date: proj.event_date || "",
        event_time: proj.event_time || "",
        locations: drawerData.locations.length > 0
          ? drawerData.locations.map((l) => ({
              name: l.name,
              address: l.address || "",
              event_time: l.event_time || "",
              sort_order: l.sort_order ?? 0,
            }))
          : [{ name: "", address: "", event_time: "", sort_order: 0 }],
        pack_id: proj.pack_id || "",
        delivery_deadline_days: proj.delivery_deadline_days || 60,
        total_value: proj.value || 0,
        payment_method: proj.payment_method || "",
        payment_splits: proj.payment_split || [],
        selected_team_ids: proj.team_ids || [],
        notes: proj.notes || "",
        selected_products: drawerData.products.map((p) => ({
          catalog_product_id: p.catalog_product_id || null,
          name: p.name,
          description: p.description,
          quantity: p.quantity,
          unit_price: p.unit_price,
          notes: p.notes,
        })),
      };

      setEditProjectId(proj.id);
      setEditInitialData(initialData);
      setEditInitialStep(targetStep);
      setShowWizard(true);
    });
  }, [registerEditHandler]);

  // Auto-open wizard if ?new=1 param is present (e.g. from dashboard CTA)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowWizard(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  // Build team lookup
  const teamMap = useMemo(() => {
    const map = new Map<string, TeamMember>();
    teamMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, [teamMembers]);

  /* ─── KPI calculations ─── */
  const kpis = useMemo(() => {
    const confirmados = projects.filter((p) => p.status === "confirmado").length;
    const emProducao = projects.filter((p) => ["producao", "edicao"].includes(p.status)).length;
    const atrasados = projects.filter((p) => isOverdueProject(p) || hasOverdueInstallments(p)).length;
    const entregues = projects.filter((p) => p.status === "entregue").length;
    return { confirmados, emProducao, atrasados, entregues };
  }, [projects]);

  /* ─── Dynamic year/month options from data ─── */
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    projects.forEach((p) => {
      if (p.event_date) years.add(p.event_date.slice(0, 4));
      else years.add(p.created_at.slice(0, 4));
    });
    return Array.from(years).sort().reverse().map((y) => ({ key: y, label: y }));
  }, [projects]);

  const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    projects.forEach((p) => {
      if (p.event_date) months.add(p.event_date.slice(5, 7));
      else months.add(p.created_at.slice(5, 7));
    });
    return Array.from(months).sort().map((m) => ({ key: m, label: MONTH_NAMES[parseInt(m, 10) - 1] }));
  }, [projects]);

  /* ─── Alert calculations ─── */
  const overdueProjects = useMemo(
    () => projects.filter(isOverdueProject),
    [projects]
  );

  const overdueInstallmentCount = useMemo(() => {
    const today = startOfDay(new Date());
    let count = 0;
    projects.forEach((p) => {
      if (!["producao", "edicao", "confirmado"].includes(p.status)) return;
      p.installments?.forEach((inst) => {
        if (inst.status === "pendente" && isBefore(new Date(inst.due_date), today)) {
          count++;
        }
      });
    });
    return count;
  }, [projects]);

  /* ─── Filtering ─── */
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      // Search
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.clients?.name.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Status select
      if (filterStatus !== "todos" && p.status !== filterStatus) return false;

      // Event type select
      if (filterEventType !== "todos" && p.event_type !== filterEventType) return false;

      // Year filter
      if (filterYear !== "todos") {
        const dateStr = p.event_date || p.created_at;
        if (!dateStr.startsWith(filterYear)) return false;
      }

      // Month filter
      if (filterMonth !== "todos") {
        const dateStr = p.event_date || p.created_at;
        if (dateStr.slice(5, 7) !== filterMonth) return false;
      }

      // Quick filters
      if (quickFilter === "hoje") {
        return p.event_date ? isToday(new Date(p.event_date)) : false;
      }
      if (quickFilter === "semana") {
        return p.event_date ? isThisWeek(new Date(p.event_date), { locale: ptBR }) : false;
      }
      if (quickFilter === "30dias") {
        if (!p.event_date) return false;
        const d = new Date(p.event_date);
        const now = startOfDay(new Date());
        return !isBefore(d, now) && isBefore(d, addDays(now, 31));
      }
      if (quickFilter === "producao") {
        return ["producao", "edicao"].includes(p.status);
      }
      if (quickFilter === "pendencias") {
        return hasPendencias(p);
      }
      if (quickFilter === "atrasados") {
        return isOverdueProject(p) || hasOverdueInstallments(p);
      }

      return true;
    });
  }, [projects, search, quickFilter, filterStatus, filterEventType, filterYear, filterMonth]);

  const stats = {
    total: projects.length,
    ativos: projects.filter((p) => ["confirmado", "producao", "edicao"].includes(p.status)).length,
    valor: projects.reduce((sum, p) => sum + Number(p.value), 0),
  };

  function handleDismiss(alertId: string) {
    dismissAlert(alertId);
    setDismissedAlerts((prev) => [...prev, alertId]);
  }

  function handleKpiClick(type: "confirmados" | "producao" | "atrasados" | "entregues") {
    // Reset other filters
    setFilterEventType("todos");
    setFilterYear("todos");
    setFilterMonth("todos");
    setSearch("");

    if (type === "confirmados") {
      setQuickFilter("todos");
      setFilterStatus("confirmado");
    } else if (type === "producao") {
      setFilterStatus("todos");
      setQuickFilter("producao");
    } else if (type === "atrasados") {
      setFilterStatus("todos");
      setQuickFilter("atrasados");
    } else if (type === "entregues") {
      setQuickFilter("todos");
      setFilterStatus("entregue");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ═══ Unified Panel — header, search, alerts, stats all in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Projetos</h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {stats.total} {stats.total === 1 ? "projeto" : "projetos"} no total · {kpis.emProducao} em produção{kpis.atrasados > 0 ? ` · ${kpis.atrasados} atrasado${kpis.atrasados > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <button
                onClick={() => setShowWizard(true)}
                className={`${PRIMARY_CTA} shrink-0 self-start`}
              >
                <Plus size={16} />
                Novo projeto
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar projetos, clientes, local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Alert Banners */}
          <AnimatePresence>
            {overdueProjects.length > 0 && !dismissedAlerts.includes("overdue_delivery") && (
              <motion.div
                key="overdue_delivery"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springDefault}
              >
                <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--error-subtle)]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--error)" }}>
                      {overdueProjects.length} projeto{overdueProjects.length > 1 ? "s" : ""} com status atrasado
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                      Verifique prazos e entregas pendentes para retomar o cronograma.
                    </p>
                    <button
                      onClick={() => { setQuickFilter("atrasados"); setFilterStatus("todos"); }}
                      className="text-[11px] font-medium mt-1 hover:underline"
                      style={{ color: "var(--error)" }}
                    >
                      Ver atrasados
                    </button>
                  </div>
                  <button
                    onClick={() => handleDismiss("overdue_delivery")}
                    className="p-1 shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {overdueInstallmentCount > 0 && !dismissedAlerts.includes("overdue_installments") && (
              <motion.div
                key="overdue_installments"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springDefault}
              >
                <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--warning-subtle)]">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--warning)" }}>
                      {overdueInstallmentCount} parcela{overdueInstallmentCount > 1 ? "s" : ""} vencida{overdueInstallmentCount > 1 ? "s" : ""} em projetos ativos
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                      Projetos com parcelas em atraso podem impactar o fluxo de caixa.
                    </p>
                    <button
                      onClick={() => { setQuickFilter("atrasados"); setFilterStatus("todos"); }}
                      className="text-[11px] font-medium mt-1 hover:underline"
                      style={{ color: "var(--warning)" }}
                    >
                      Ver pendências
                    </button>
                  </div>
                  <button
                    onClick={() => handleDismiss("overdue_installments")}
                    className="p-1 shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats — bottom of unified card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <button
              onClick={() => handleKpiClick("confirmados")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "confirmado" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Confirmados</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{kpis.confirmados}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">aguardando evento</p>
            </button>
            <button
              onClick={() => handleKpiClick("producao")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${quickFilter === "producao" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Em Produção</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{kpis.emProducao}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">edição + pós-produção</p>
            </button>
            <button
              onClick={() => handleKpiClick("atrasados")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${quickFilter === "atrasados" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Atrasados</p>
              <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${kpis.atrasados > 0 ? "text-[var(--error)]" : "text-[var(--fg)]"}`}>{kpis.atrasados}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">ação necessária</p>
            </button>
            <button
              onClick={() => handleKpiClick("entregues")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "entregue" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Entregues</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{kpis.entregues}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">concluídos</p>
            </button>
          </div>

          {/* ═══ Filters — only when projects exist ═══ */}
          {projects.length > 0 && (
            <div className="px-6 py-4 space-y-2.5 border-t border-[var(--border-subtle)]">
              {/* Row 1: Quick time pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <ActionPill
                  label="Todos"
                  active={quickFilter === "todos" && filterStatus === "todos" && filterEventType === "todos" && filterYear === "todos" && filterMonth === "todos"}
                  onClick={() => { setQuickFilter("todos"); setFilterStatus("todos"); setFilterEventType("todos"); setFilterYear("todos"); setFilterMonth("todos"); }}
                  count={projects.length}
                />
                <ActionPill label="Hoje" active={quickFilter === "hoje"} onClick={() => { setQuickFilter("hoje"); setFilterStatus("todos"); }} />
                <ActionPill label="Esta semana" active={quickFilter === "semana"} onClick={() => { setQuickFilter("semana"); setFilterStatus("todos"); }} />
                <ActionPill label="Em produção" active={quickFilter === "producao"} onClick={() => { setQuickFilter("producao"); setFilterStatus("todos"); }} count={kpis.emProducao} />
                <ActionPill label="Pendências" active={quickFilter === "pendencias"} onClick={() => { setQuickFilter("pendencias"); setFilterStatus("todos"); }} />
                <ActionPill label="Atrasados" active={quickFilter === "atrasados"} onClick={() => { setQuickFilter("atrasados"); setFilterStatus("todos"); }} count={kpis.atrasados} />
              </div>

              {/* Row 2: Filter dropdowns */}
              <div className="flex items-center gap-1.5">
                <FilterDropdown
                  icon={Calendar}
                  label="Ano"
                  value={filterYear}
                  options={yearOptions}
                  onChange={(key) => setFilterYear(key)}
                />
                <FilterDropdown
                  label="Mês"
                  value={filterMonth}
                  options={monthOptions}
                  onChange={(key) => setFilterMonth(key)}
                />
                <FilterDropdown
                  icon={SlidersHorizontal}
                  label="Status"
                  value={filterStatus}
                  options={(Object.entries(statusConfig) as [ProjectStatus, { label: string }][]).map(([key, { label }]) => ({ key, label }))}
                  onChange={(key) => { setFilterStatus(key as ProjectStatus | "todos"); setQuickFilter("todos"); }}
                />
                <FilterDropdown
                  label="Tipo"
                  value={filterEventType}
                  options={(Object.entries(eventTypeLabels) as [EventType, string][]).map(([key, label]) => ({ key, label }))}
                  onChange={(key) => setFilterEventType(key as EventType | "todos")}
                />
              </div>

              {/* Row 3: Active filter chips */}
              {(filterStatus !== "todos" || filterEventType !== "todos" || filterYear !== "todos" || filterMonth !== "todos" || quickFilter !== "todos") && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickFilter !== "todos" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-subtle)] pl-2.5 pr-1.5 py-1 rounded-full">
                      {quickFilter === "hoje" ? "Hoje" : quickFilter === "semana" ? "Esta semana" : quickFilter === "producao" ? "Em produção" : quickFilter === "pendencias" ? "Pendências" : "Atrasados"}
                      <button onClick={() => setQuickFilter("todos")} className="p-0.5 hover:text-[var(--fg)] transition-colors"><X size={10} /></button>
                    </span>
                  )}
                  {filterYear !== "todos" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-subtle)] pl-2.5 pr-1.5 py-1 rounded-full">
                      Ano: {filterYear}
                      <button onClick={() => setFilterYear("todos")} className="p-0.5 hover:text-[var(--fg)] transition-colors"><X size={10} /></button>
                    </span>
                  )}
                  {filterMonth !== "todos" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-subtle)] pl-2.5 pr-1.5 py-1 rounded-full">
                      {MONTH_NAMES[parseInt(filterMonth, 10) - 1]}
                      <button onClick={() => setFilterMonth("todos")} className="p-0.5 hover:text-[var(--fg)] transition-colors"><X size={10} /></button>
                    </span>
                  )}
                  {filterStatus !== "todos" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-subtle)] pl-2.5 pr-1.5 py-1 rounded-full">
                      {statusConfig[filterStatus as ProjectStatus]?.label}
                      <button onClick={() => setFilterStatus("todos")} className="p-0.5 hover:text-[var(--fg)] transition-colors"><X size={10} /></button>
                    </span>
                  )}
                  {filterEventType !== "todos" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-subtle)] pl-2.5 pr-1.5 py-1 rounded-full">
                      {eventTypeLabels[filterEventType as EventType]}
                      <button onClick={() => setFilterEventType("todos")} className="p-0.5 hover:text-[var(--fg)] transition-colors"><X size={10} /></button>
                    </span>
                  )}
                  <button
                    onClick={() => { setQuickFilter("todos"); setFilterStatus("todos"); setFilterEventType("todos"); setFilterYear("todos"); setFilterMonth("todos"); }}
                    className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors ml-1"
                  >
                    Limpar tudo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty state — inside unified card */}
          {projects.length === 0 && (
            <div className="border-t border-[var(--border-subtle)]">
              <WidgetEmptyState
                icon={FolderOpen}
                title="Nenhum projeto ainda"
                description="Crie seu primeiro projeto para começar a organizar seus trabalhos."
                action={
                  <button
                    onClick={() => setShowWizard(true)}
                    className={PRIMARY_CTA}
                  >
                    <Plus size={16} />
                    Criar primeiro projeto
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* ═══ Table — separate card ═══ */}
        {projects.length > 0 && filtered.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <WidgetEmptyState
              icon={SearchX}
              title="Nenhum projeto encontrado"
              description="Tente ajustar a busca ou os filtros."
            />
          </div>
        )}
        {filtered.length > 0 && (
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-5 py-3">
                      Projeto / Cliente
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-3 py-3">
                      Data
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-3 py-3 hidden sm:table-cell">
                      Local
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-3 py-3 hidden sm:table-cell">
                      Equipe
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-3 py-3">
                      Produção
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-3 py-3">
                      Financeiro
                    </th>
                    <th className="text-right text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-muted)] px-5 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project, index) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      index={index}
                      teamMap={teamMap}
                      onClick={() => openDrawer(project.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewProjectWizard
        key={editProjectId || "new"}
        open={showWizard}
        onClose={() => {
          const wasEditing = editProjectId;
          setShowWizard(false);
          setEditProjectId(undefined);
          setEditInitialData(undefined);
          setEditInitialStep(undefined);
          if (wasEditing) openDrawer(wasEditing);
        }}
        onCreated={(id) => {
          const wasEditing = editProjectId;
          setShowWizard(false);
          setEditProjectId(undefined);
          setEditInitialData(undefined);
          setEditInitialStep(undefined);
          router.refresh();
          if (wasEditing) openDrawer(id);
        }}
        clients={clients}
        packs={packs}
        workflowTemplates={workflowTemplates}
        catalogProducts={catalogProducts}
        teamMembers={teamMembers}
        studioId={studioId}
        editProjectId={editProjectId}
        initialData={editInitialData}
        initialStep={editInitialStep}
      />
    </PageTransition>
  );
}


/* ═══════════════════════════════════════════════
   Project Table Row
   ═══════════════════════════════════════════════ */

function ProjectRow({
  project,
  index,
  teamMap,
  onClick,
}: {
  project: Project;
  index: number;
  teamMap: Map<string, TeamMember>;
  onClick: () => void;
}) {
  const status = statusConfig[project.status];

  // Clean project name — remove event type prefix since badge already shows it
  const eventTypeLabel = eventTypeLabels[project.event_type]?.toLowerCase() || "";
  const rawName = project.name;
  const cleanName = rawName.toLowerCase().startsWith(eventTypeLabel + " ")
    ? rawName.slice(eventTypeLabel.length + 1).trim()
    : rawName;

  // Date formatting
  let dateMain = "—";
  let dateSub = "";
  if (project.event_date) {
    const d = new Date(project.event_date);
    dateMain = format(d, "d MMM", { locale: ptBR });
    dateSub = format(d, "EEEE", { locale: ptBR });
    // Capitalize first letter
    dateSub = dateSub.charAt(0).toUpperCase() + dateSub.slice(1);
  }

  // Location — prefer first project_location name over event_location address
  const firstLocation = project.project_locations
    ?.sort((a, b) => a.sort_order - b.sort_order)?.[0]?.name;
  const locationName = firstLocation || project.event_location;
  const location = locationName
    ? locationName.length > 20
      ? locationName.slice(0, 20) + "..."
      : locationName
    : "—";

  // Team avatars
  const teamIds = project.team_ids || [];
  const teamVisible = teamIds.slice(0, 3);
  const teamOverflow = teamIds.length - 3;

  // Production: completed / total workflows
  const workflows = project.project_workflows || [];
  const wfCompleted = workflows.filter((w) => w.status === "concluido").length;
  const wfTotal = workflows.length;

  // Financial: installments count
  const installments = project.installments || [];
  const pendingInstallments = installments.filter((i) => i.status === "pendente").length;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 26,
        delay: index * 0.03,
      }}
      onClick={onClick}
      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
    >
      {/* Projeto / Cliente */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[var(--fg)] truncate max-w-[200px]">
                {cleanName}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase"
                style={{
                  color: "var(--fg-muted)",
                  backgroundColor: "var(--border-subtle)",
                }}
              >
                {eventTypeLabels[project.event_type]}
              </span>
            </div>
            {project.clients && (
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate max-w-[200px]">
                {project.clients.name}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Data */}
      <td className="px-3 py-3">
        <p className="text-[13px] text-[var(--fg)]">{dateMain}</p>
        {dateSub && <p className="text-[11px] text-[var(--fg-muted)]">{dateSub}</p>}
      </td>

      {/* Local */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <p className="text-[12px] text-[var(--fg-secondary)] max-w-[140px] truncate">
          {location}
        </p>
      </td>

      {/* Equipe */}
      <td className="px-3 py-3 hidden sm:table-cell">
        {teamIds.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {teamVisible.map((id) => {
              const member = teamMap.get(id);
              if (!member) return null;
              const initial = member.name.charAt(0).toUpperCase();
              const color = roleColors[member.role] || roleColors.default;
              return (
                <div
                  key={id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-[var(--card)]"
                  style={{ backgroundColor: color, color: "#fff" }}
                  title={member.name}
                >
                  {initial}
                </div>
              );
            })}
            {teamOverflow > 0 && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium bg-[var(--border-subtle)] text-[var(--fg-muted)] border-2 border-[var(--card)]"
              >
                +{teamOverflow}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-[var(--fg-muted)]">—</span>
        )}
      </td>

      {/* Produção */}
      <td className="px-3 py-3">
        {wfTotal > 0 ? (
          <div>
            <p className="text-[12px] text-[var(--fg-secondary)]">
              {wfCompleted}/{wfTotal} etapas
            </p>
            <div className="w-14 h-1 rounded-full bg-[var(--border)] mt-1">
              <div
                className="h-full rounded-full bg-[var(--info)] transition-all"
                style={{ width: `${wfTotal > 0 ? (wfCompleted / wfTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--fg-muted)]">—</span>
        )}
      </td>

      {/* Financeiro */}
      <td className="px-3 py-3">
        {installments.length > 0 ? (
          <p className="text-[12px] text-[var(--fg-secondary)]">
            {pendingInstallments > 0 ? (
              <span>
                {pendingInstallments} parcela{pendingInstallments > 1 ? "s" : ""}
                <span className="text-[10px] text-[var(--fg-muted)] ml-0.5">pendente{pendingInstallments > 1 ? "s" : ""}</span>
              </span>
            ) : (
              <span className="text-[var(--success)]">Quitado</span>
            )}
          </p>
        ) : (
          <span className="text-[11px] text-[var(--fg-muted)]">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-5 py-3 text-right">
        <StatusBadge
          label={status.label}
          color={status.color}
          bg={status.bg}
        />
      </td>
    </motion.tr>
  );
}
