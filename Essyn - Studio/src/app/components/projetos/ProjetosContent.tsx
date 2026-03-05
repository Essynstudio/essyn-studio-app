import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { projetos as allProjetos, statusConfig } from "./projetosData";
import type { Projeto, ProjetoStatus, ProjetoTipo } from "./projetosData";
import { ProjetoDrawer } from "./ProjetoDrawer";
import { NovoProjetoModal } from "./NovoProjetoModal";
import { springContentIn } from "../../lib/motion-tokens";
import type { TabId } from "./drawer-primitives";
import { useDk } from "../../lib/useDarkColors";

import {
  Zap,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FileText,
  Eye,
  CalendarRange,
  SlidersHorizontal,
  SearchX,
  X,
} from "lucide-react";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";

/* ─── Constants ─── */

const anos = [2026, 2025, 2024];
const statusOptions: ProjetoStatus[] = [
  "confirmado",
  "producao",
  "edicao",
  "entregue",
  "rascunho",
  "atrasado",
];
const tipoOptions: ProjetoTipo[] = [
  "Casamento",
  "Corporativo",
  "Aniversário",
  "Ensaio",
  "Batizado",
  "Formatura",
];

const sortOptions = [
  { id: "data-desc", label: "Data do evento ↓" },
  { id: "data-asc", label: "Data do evento ↑" },
  { id: "nome-asc", label: "Nome A → Z" },
  { id: "nome-desc", label: "Nome Z → A" },
  { id: "status", label: "Status" },
];

type QuickChip = {
  id: string;
  label: string;
  icon?: ReactNode;
  filter: (p: Projeto) => boolean;
};

const TODAY_ISO = "2026-02-21";

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const quickChips: QuickChip[] = [
  {
    id: "hoje",
    label: "Hoje",
    icon: <Zap className="w-3 h-3" />,
    filter: (p) => p.dataISO === TODAY_ISO,
  },
  {
    id: "semana",
    label: "Esta semana",
    filter: (p) => p.dataISO >= TODAY_ISO && p.dataISO <= addDays(TODAY_ISO, 7),
  },
  {
    id: "30dias",
    label: "Próximos 30 dias",
    filter: (p) => p.dataISO >= TODAY_ISO && p.dataISO <= addDays(TODAY_ISO, 30),
  },
  {
    id: "producao",
    label: "Em produção",
    filter: (p) => p.status === "producao" || p.status === "edicao",
  },
  {
    id: "pendencias",
    label: "Pendências",
    filter: (p) => p.financeiro.vencidas > 0 || p.status === "atrasado",
  },
  {
    id: "atrasados",
    label: "Atrasados",
    filter: (p) => p.status === "atrasado",
  },
];

/* ─── Reusable Dropdown ─── */

function Dropdown({
  label,
  options,
  value,
  onChange,
  renderOption,
  icon,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  renderOption?: (opt: string) => ReactNode;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dk = useDk();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
        style={{
          fontWeight: 500,
          background: value ? dk.bgActive : dk.bg,
          borderColor: value ? dk.textDisabled : dk.border,
          color: value ? dk.textSecondary : dk.textMuted,
        }}
      >
        {icon}
        {label}
        {value && (
          <>
            <span className="w-px h-3" style={{ background: dk.border }} />
            <span style={{ color: dk.textSecondary }}>{renderOption ? renderOption(value) : value}</span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: dk.textDisabled }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-30 w-48 rounded-xl border py-1 overflow-hidden" style={{ borderColor: dk.border, background: dk.bg, boxShadow: dk.shadowModal }}>
          {value && (
            <>
              <button
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer"
                style={{ fontWeight: 400, color: dk.textMuted }}
                onMouseEnter={(e) => e.currentTarget.style.background = dk.bgMuted}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Limpar filtro
              </button>
              <div className="h-px" style={{ background: dk.border }} />
            </>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer"
              style={{
                fontWeight: value === opt ? 500 : 400,
                color: value === opt ? dk.textPrimary : dk.textTertiary,
                background: value === opt ? dk.bgMuted : "transparent",
              }}
              onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = dk.bgMuted; }}
              onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
            >
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sort dropdown ─── */

function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dk = useDk();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = sortOptions.find((o) => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
        style={{ fontWeight: 500, borderColor: dk.border, background: dk.bg, color: dk.textMuted }}
      >
        <ArrowUpDown className="w-3 h-3" />
        {current?.label || "Ordenar"}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-30 w-52 rounded-xl border py-1 overflow-hidden" style={{ borderColor: dk.border, background: dk.bg, boxShadow: dk.shadowModal }}>
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer"
              style={{
                fontWeight: value === opt.id ? 500 : 400,
                color: value === opt.id ? dk.textPrimary : dk.textTertiary,
                background: value === opt.id ? dk.bgMuted : "transparent",
              }}
              onMouseEnter={(e) => { if (value !== opt.id) e.currentTarget.style.background = dk.bgMuted; }}
              onMouseLeave={(e) => { if (value !== opt.id) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Avatar stack ─── */

function AvatarStack({ equipe }: { equipe: Projeto["equipe"] }) {
  const dk = useDk();
  return (
    <div className="flex items-center -space-x-1.5">
      {equipe.slice(0, 3).map((m) => (
        <div
          key={m.iniciais}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          style={{ background: dk.bgMuted, borderColor: dk.bg }}
          title={`${m.nome} — ${m.funcao}`}
        >
          <span className="text-[8px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
            {m.iniciais}
          </span>
        </div>
      ))}
      {equipe.length > 3 && (
        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ background: dk.bgMuted, borderColor: dk.bg }}>
          <span className="text-[8px]" style={{ fontWeight: 600, color: dk.textMuted }}>
            +{equipe.length - 3}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Produção mini-badge ─── */

function ProducaoBadge({ producao }: { producao: Projeto["producao"] }) {
  const dk = useDk();
  if (producao.etapasTotal === 0) {
    return (
      <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
        Sem serviços
      </span>
    );
  }

  const done = producao.etapasConcluidas === producao.etapasTotal;
  const pct = (producao.etapasConcluidas / producao.etapasTotal) * 100;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px]" style={{ fontWeight: 500, color: done ? "#34C759" : dk.textMuted }}>
        <span className="numeric">{producao.etapasConcluidas}/{producao.etapasTotal}</span> etapas
      </span>
      <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: dk.bgMuted }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: done ? "#34C759" : dk.textDisabled }}
        />
      </div>
    </div>
  );
}

/* ─── Financeiro mini-badge ─── */

function FinanceiroBadge({ financeiro }: { financeiro: Projeto["financeiro"] }) {
  const dk = useDk();
  if (financeiro.parcelas === 0) {
    return (
      <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
        —
      </span>
    );
  }

  const allPaid = financeiro.pagas === financeiro.parcelas;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ fontWeight: 500, color: allPaid ? "#34C759" : dk.textMuted }}>
        <span className="numeric">{financeiro.parcelas}</span> parcela{financeiro.parcelas > 1 ? "s" : ""}
      </span>
      {financeiro.vencidas > 0 && (
        <span className="text-[10px]" style={{ fontWeight: 500, color: "#FF3B30" }}>
          <span className="numeric">{financeiro.vencidas}</span> vencida{financeiro.vencidas > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

/* ─── Project Row ─── */

function ProjetoRow({
  projeto,
  onOpen,
}: {
  projeto: Projeto;
  onOpen: () => void;
}) {
  const dk = useDk();
  const sc = statusConfig[projeto.status];

  return (
    <div
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="grid grid-cols-[1.2fr_100px_140px_80px_100px_100px_88px_56px] items-center px-5 py-3.5 gap-3 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
      style={{ "--tw-ring-color": dk.textDisabled } as any}
      onClick={onOpen}
      onMouseEnter={(e) => e.currentTarget.style.background = dk.bgHover}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {/* Projeto / Cliente */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.isDark ? "#E5E5EA" : "#48484A" }}>
          {projeto.nome}
        </span>
        <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textSubtle }}>
          {projeto.cliente} · {projeto.tipo}
        </span>
      </div>

      {/* Data do evento */}
      <div className="flex flex-col gap-0">
        <span className="text-[12px] tabular-nums" style={{ fontWeight: 400, color: dk.textTertiary }}>
          {projeto.dataEvento}
        </span>
        <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
          {projeto.diaSemana}
        </span>
      </div>

      {/* Local */}
      <span className="text-[12px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
        {projeto.local}
      </span>

      {/* Equipe */}
      <AvatarStack equipe={projeto.equipe} />

      {/* Produção */}
      <ProducaoBadge producao={projeto.producao} />

      {/* Financeiro */}
      <FinanceiroBadge financeiro={projeto.financeiro} />

      {/* Status */}
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${sc.bg} ${sc.border} ${sc.text} text-[10px] border w-fit`}
        style={{ fontWeight: 500 }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
        {sc.label}
      </span>

      {/* Ação */}
      <button
        className="flex items-center gap-1 text-[12px] opacity-0 group-hover:opacity-100 transition-all cursor-pointer justify-end"
        style={{ fontWeight: 500, color: dk.textDisabled }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        Abrir
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* ─── Main Content ─── */
/* ═══════════════════════════════════════════════════ */

export function ProjetosContent({
  deepLinkProjectId,
  deepLinkTab,
  onDeepLinkConsumed,
}: {
  deepLinkProjectId?: string | null;
  deepLinkTab?: "cadastro" | "producao" | "financeiro" | "galeria" | "docs";
  onDeepLinkConsumed?: () => void;
}) {
  const dk = useDk();
  /* ── Loading simulation ── */
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("data-desc");
  const [activeQuickChip, setActiveQuickChip] = useState<string | null>(null);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<TabId | undefined>(undefined);
  const [novoProjetoOpen, setNovoProjetoOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Deep-link: auto-open drawer
  useEffect(() => {
    if (deepLinkProjectId) {
      const proj = allProjetos.find((p) => p.id === deepLinkProjectId);
      if (proj) {
        setSelectedProjeto(proj);
        setDrawerInitialTab(deepLinkTab || "cadastro");
        setDrawerOpen(true);
      }
      onDeepLinkConsumed?.();
    }
  }, [deepLinkProjectId]);

  // Listen for custom event
  useEffect(() => {
    const handleOpenNewProject = () => setNovoProjetoOpen(true);
    window.addEventListener("essyn:openNewProject", handleOpenNewProject);
    return () => window.removeEventListener("essyn:openNewProject", handleOpenNewProject);
  }, []);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const confirmados = allProjetos.filter((p) => p.status === "confirmado").length;
    const emProducao = allProjetos.filter((p) => p.status === "producao" || p.status === "edicao").length;
    const atrasados = allProjetos.filter((p) => p.status === "atrasado").length;
    const entregues = allProjetos.filter((p) => p.status === "entregue").length;
    const totalVencidas = allProjetos.reduce((acc, p) => acc + p.financeiro.vencidas, 0);
    const rascunhos = allProjetos.filter((p) => p.status === "rascunho").length;
    return { confirmados, emProducao, atrasados, entregues, totalVencidas, rascunhos };
  }, []);

  const contextLine = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${allProjetos.length} projetos no total`);
    if (stats.emProducao > 0) parts.push(`${stats.emProducao} em produção`);
    if (stats.atrasados > 0) parts.push(`${stats.atrasados} atrasado${stats.atrasados > 1 ? "s" : ""}`);
    return parts.join(" · ");
  }, [stats]);

  const quickActions = useMemo(() => [
    { label: "Novo projeto", icon: <FolderPlus className="w-4 h-4" />, onClick: () => setNovoProjetoOpen(true) },
    { label: "Importar", icon: <FileText className="w-4 h-4" />, onClick: () => {} },
  ], []);

  const hasAlerts = stats.atrasados > 0 && !dismissedAlerts.has("alert-atrasados");
  const hasVencidasAlert = stats.totalVencidas > 0 && !dismissedAlerts.has("alert-vencidas");

  function dismissAlert(id: string) {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }

  /* ── Filters ── */
  const hasFilters =
    !!search || !!filterAno || !!filterStatus || !!filterTipo || !!filterDateFrom || !!filterDateTo || !!activeQuickChip;

  function clearFilters() {
    setSearch("");
    setFilterAno(null);
    setFilterStatus(null);
    setFilterTipo(null);
    setFilterDateFrom("");
    setFilterDateTo("");
    setActiveQuickChip(null);
  }

  let filtered = allProjetos.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.nome.toLowerCase().includes(q) &&
        !p.cliente.toLowerCase().includes(q) &&
        !p.tipo.toLowerCase().includes(q) &&
        !p.local.toLowerCase().includes(q) &&
        !p.equipe.some((m) => m.nome.toLowerCase().includes(q))
      )
        return false;
    }
    if (filterAno && p.ano !== Number(filterAno)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterTipo && p.tipo !== filterTipo) return false;
    if (filterDateFrom && p.dataISO < filterDateFrom) return false;
    if (filterDateTo && p.dataISO > filterDateTo) return false;
    if (activeQuickChip) {
      const chip = quickChips.find((c) => c.id === activeQuickChip);
      if (chip && !chip.filter(p)) return false;
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "data-asc":
        return a.dataISO.localeCompare(b.dataISO);
      case "nome-asc":
        return a.nome.localeCompare(b.nome);
      case "nome-desc":
        return b.nome.localeCompare(a.nome);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return b.dataISO.localeCompare(a.dataISO);
    }
  });

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filterAno) activeChips.push({ label: `Ano: ${filterAno}`, onRemove: () => setFilterAno(null) });
  if (filterStatus)
    activeChips.push({
      label: `Status: ${statusConfig[filterStatus as ProjetoStatus].label}`,
      onRemove: () => setFilterStatus(null),
    });
  if (filterTipo) activeChips.push({ label: `Tipo: ${filterTipo}`, onRemove: () => setFilterTipo(null) });
  if (filterDateFrom || filterDateTo)
    activeChips.push({
      label: `Data: ${filterDateFrom || "…"} → ${filterDateTo || "…"}`,
      onRemove: () => {
        setFilterDateFrom("");
        setFilterDateTo("");
      },
    });
  if (activeQuickChip) {
    const chip = quickChips.find((c) => c.id === activeQuickChip);
    if (chip) activeChips.push({ label: chip.label, onRemove: () => setActiveQuickChip(null) });
  }

  function openProjeto(p: Projeto) {
    setSelectedProjeto(p);
    setDrawerInitialTab(undefined);
    setDrawerOpen(true);
  }

  /* ═══════════════════════════════════════════════════ */
  /*  RENDER                                             */
  /* ═══════════════════════════════════════════════════ */

  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-[1440px]">
        {/* ════════════════════════════════════════════════════
            WIDGET 1 — HEADER (via HeaderWidget KIT)
            Same pattern as Dashboard / Produção / Agenda
            ════════════════════════════════════════════════════ */}
        <HeaderWidget
          greeting="Projetos"
          userName=""
          contextLine={contextLine}
          quickActions={quickActions}
          showSearch
          searchPlaceholder="Buscar projetos, clientes, local..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          {/* ─── Alerts ─── */}
          {(hasAlerts || hasVencidasAlert) && (
            <>
              <div className="mx-5 h-px" style={{ background: dk.hairline }} />
              <div className="flex flex-col px-2 py-1">
                {hasAlerts && (
                  <InlineBanner
                    variant="danger"
                    title={`${stats.atrasados} projeto${stats.atrasados > 1 ? "s" : ""} com status atrasado`}
                    desc="Verifique prazos e entregas pendentes para retomar o cronograma."
                    ctaLabel="Ver atrasados"
                    cta={() => {
                      setActiveQuickChip("atrasados");
                      dismissAlert("alert-atrasados");
                    }}
                    dismissible
                    onDismiss={() => dismissAlert("alert-atrasados")}
                  />
                )}
                {hasVencidasAlert && (
                  <InlineBanner
                    variant="warning"
                    title={`${stats.totalVencidas} parcela${stats.totalVencidas > 1 ? "s" : ""} vencida${stats.totalVencidas > 1 ? "s" : ""} em projetos ativos`}
                    desc="Projetos com parcelas em atraso podem impactar o fluxo de caixa."
                    ctaLabel="Ver pendências"
                    cta={() => {
                      setActiveQuickChip("pendencias");
                      dismissAlert("alert-vencidas");
                    }}
                    dismissible
                    onDismiss={() => dismissAlert("alert-vencidas")}
                  />
                )}
              </div>
            </>
          )}

          {/* ─── KPI Metrics ─── */}
          <div className="mx-5 h-px" style={{ background: dk.hairline }} />
          {isLoading ? (
            <MetricsSkeleton />
          ) : (
            <DashboardKpiGrid
              flat
              projetos={{
                label: "Confirmados",
                value: String(stats.confirmados),
                sub: "aguardando evento",
              }}
              aReceber={{
                label: "Em Produção",
                value: String(stats.emProducao),
                sub: "edição + pós-produção",
              }}
              producao={{
                label: "Atrasados",
                value: String(stats.atrasados),
                sub: stats.atrasados > 0 ? "ação necessária" : "nenhum atraso",
              }}
              compromissos={{
                label: "Entregues",
                value: String(stats.entregues),
                sub: `${stats.rascunhos} rascunho${stats.rascunhos > 1 ? "s" : ""}`,
              }}
            />
          )}
        </HeaderWidget>

        {/* ════════════════════════════════════════════════════
            WIDGET 2 — PROJECTS TABLE (via WidgetCard KIT)
            ════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <WidgetSkeleton key="proj-sk" rows={6} delay={0.06} />
          ) : (
            <WidgetCard
              key="projetos-table"
              title="Todos os Projetos"
              count={filtered.length}
              action="Novo projeto"
              onAction={() => setNovoProjetoOpen(true)}
              delay={0.06}
              footer={
                filtered.length > 0 ? (
                  <div className="flex items-center justify-between px-5 py-2.5 border-t" style={{ borderColor: dk.hairline }}>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      {filtered.length} de {allProjetos.length} projetos
                    </span>
                    <span className="text-[11px] flex items-center gap-1" style={{ fontWeight: 400, color: dk.textDisabled }}>
                      <Eye className="w-3 h-3" />
                      Clique em uma linha para abrir
                    </span>
                  </div>
                ) : undefined
              }
            >
              {/* ─── Filter toolbar ─── */}
              <div className="px-5 py-3 flex flex-col gap-3 border-b" style={{ borderColor: dk.hairline }}>
                {/* Quick chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {quickChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() =>
                        setActiveQuickChip(activeQuickChip === chip.id ? null : chip.id)
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer"
                      style={{
                        fontWeight: 500,
                        background: activeQuickChip === chip.id
                          ? dk.textPrimary
                          : dk.bg,
                        borderColor: activeQuickChip === chip.id
                          ? dk.textPrimary
                          : dk.border,
                        color: activeQuickChip === chip.id
                          ? (dk.isDark ? "#1D1D1F" : "#FFFFFF")
                          : dk.textTertiary,
                      }}
                    >
                      {chip.icon}
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Dropdown filters + sort */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Dropdown
                    label="Ano"
                    options={anos.map(String)}
                    value={filterAno}
                    onChange={setFilterAno}
                    icon={<CalendarRange className="w-3 h-3" />}
                  />
                  <Dropdown
                    label="Status"
                    options={statusOptions}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    renderOption={(opt) => statusConfig[opt as ProjetoStatus].label}
                    icon={<SlidersHorizontal className="w-3 h-3" />}
                  />
                  <Dropdown
                    label="Tipo"
                    options={tipoOptions}
                    value={filterTipo}
                    onChange={setFilterTipo}
                  />

                  {/* Date range */}
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="px-2 py-1 rounded-lg text-[11px] border focus:outline-none focus:border-[#007AFF] transition-colors"
                      style={{ fontWeight: 400, borderColor: dk.border, color: dk.textTertiary, background: dk.bg }}
                    />
                    <span className="text-[10px]" style={{ color: dk.textDisabled }}>→</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="px-2 py-1 rounded-lg text-[11px] border focus:outline-none focus:border-[#007AFF] transition-colors"
                      style={{ fontWeight: 400, borderColor: dk.border, color: dk.textTertiary, background: dk.bg }}
                    />
                  </div>

                  <div className="flex-1" />
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                </div>

                {/* Active filter chips */}
                {activeChips.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeChips.map((chip) => (
                      <span
                        key={chip.label}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border"
                        style={{ fontWeight: 500, background: dk.bgActive, color: dk.textSecondary, borderColor: dk.border }}
                      >
                        {chip.label}
                        <button
                          onClick={chip.onRemove}
                          className="transition-colors cursor-pointer"
                          style={{ color: dk.textMuted }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={clearFilters}
                      className="text-[11px] transition-colors cursor-pointer"
                      style={{ fontWeight: 500, color: dk.textMuted }}
                    >
                      Limpar tudo
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Content ─── */}
              {filtered.length === 0 ? (
                <WidgetEmptyState
                  icon={<SearchX className="w-6 h-6" />}
                  message="Nenhum projeto encontrado com esses filtros."
                  cta="Limpar filtros"
                  onCta={clearFilters}
                />
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-[1.2fr_100px_140px_80px_100px_100px_88px_56px] items-center px-5 py-2.5 border-b gap-3" style={{ background: dk.bgSub, borderColor: dk.hairline }}>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Projeto / Cliente
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Data
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Local
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Equipe
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Produção
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Financeiro
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                      Status
                    </span>
                    <span />
                  </div>

                  {/* Rows with WidgetHairline */}
                  <AnimatePresence initial={false}>
                    {filtered.map((p, i) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springContentIn}
                        className="overflow-hidden"
                      >
                        {i > 0 && <WidgetHairline />}
                        <ProjetoRow
                          projeto={p}
                          onOpen={() => openProjeto(p)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </>
              )}
            </WidgetCard>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ Drawer ═══════ */}
      <ProjetoDrawer
        projeto={selectedProjeto}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialTab={drawerInitialTab}
      />

      {/* ═══════ Novo Projeto Modal ═══════ */}
      <NovoProjetoModal
        open={novoProjetoOpen}
        onClose={() => setNovoProjetoOpen(false)}
      />
    </>
  );
}