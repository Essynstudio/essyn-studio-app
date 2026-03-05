import { useState, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  CircleCheck,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  Wallet,
  X,
  Download,
  Filter,
  Plus,
  CalendarClock,
  Eye,
  Bell,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KpiCard } from "../ui/kpi-card";
import { FilterChip } from "../ui/filter-chip";
import { StatusBadge, type StatusParcela } from "../ui/status-badge";
import { TagPill, type TagVariant } from "../ui/tag-pill";
import { TypeBadge } from "../ui/type-badge";
import { fmtCurrency } from "../ui/action-row-item";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import {
  RowSelectCheckbox,
  type CheckboxState,
} from "../ui/row-select-checkbox";
import { AlertBanner } from "../ui/alert-banner";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import { payoutsToDespesas, markPayoutPaid, type DespesaRepasse } from "./payoutStore";
import { toast } from "sonner";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Contas a Pagar — Payables list                    */
/*  Pattern P02: Lista Operacional com multi-select    */
/*  Ref: Omie/ContaAzul + QuickBooks Bills             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type PagarFilter =
  | "all"
  | "vencida"
  | "vence_hoje"
  | "prox_7d"
  | "paga"
  | "fixa"
  | "evento"
  | "repasse";

const TODAY_ISO = "2026-02-23";
const NEXT_7D_ISO = "2026-03-02";

type TipoDespesa = "fixa" | "evento" | "avulsa" | "repasse";

interface Despesa {
  id: string;
  descricao: string;
  fornecedor: string;
  categoria: "fornecedor" | "equipe" | "operacional";
  tipo: TipoDespesa;
  projeto?: string;
  projetoId?: string;
  valor: number;
  vencimento: string;
  vencimentoISO: string;
  status: StatusParcela;
  metodo: string;
  nf: "emitida" | "pendente" | "na";
  comprovante: "sim" | "nao";
  diasAtraso?: number;
}

/* ── Helpers ── */

function isProx7d(d: Despesa): boolean {
  return (
    d.vencimentoISO > TODAY_ISO &&
    d.vencimentoISO <= NEXT_7D_ISO &&
    d.status !== "paga" &&
    d.status !== "conciliada" &&
    d.status !== "cancelada"
  );
}

function ctaLabel(status: StatusParcela): string {
  switch (status) {
    case "vencida":
    case "vence_hoje":
      return "Pagar";
    case "prevista":
      return "Lembrete";
    default:
      return "Ver";
  }
}

function ctaIcon(status: StatusParcela) {
  switch (status) {
    case "vencida":
    case "vence_hoje":
      return <CreditCard className="w-3 h-3" />;
    case "prevista":
      return <Bell className="w-3 h-3" />;
    default:
      return <Eye className="w-3 h-3" />;
  }
}

function metodoVariant(metodo: string): TagVariant {
  switch (metodo.toLowerCase()) {
    case "pix":
      return "success";
    case "boleto":
      return "info";
    case "cartao":
    case "cartão":
      return "purple";
    default:
      return "neutral";
  }
}

function catTagVariant(
  cat: "fornecedor" | "equipe" | "operacional",
): TagVariant {
  switch (cat) {
    case "fornecedor":
      return "purple";
    case "equipe":
      return "info";
    default:
      return "neutral";
  }
}

function catLabel(cat: "fornecedor" | "equipe" | "operacional"): string {
  switch (cat) {
    case "fornecedor":
      return "Forn.";
    case "equipe":
      return "Equipe";
    default:
      return "Oper.";
  }
}

/* ── Mock data ── */

const mockDespesas: Despesa[] = [
  {
    id: "p1",
    descricao: "Aluguel de lente 70-200mm",
    fornecedor: "LocaFoto SP",
    categoria: "fornecedor",
    tipo: "evento",
    projeto: "Casamento Oliveira",
    projetoId: "proj-001",
    valor: 350,
    vencimento: "23 Fev 2026",
    vencimentoISO: "2026-02-23",
    status: "vence_hoje",
    metodo: "PIX",
    nf: "pendente",
    comprovante: "nao",
  },
  {
    id: "p2",
    descricao: "Impressão fine art 20x30",
    fornecedor: "FineArt Brasil",
    categoria: "fornecedor",
    tipo: "evento",
    projeto: "Making Of Estúdio K",
    projetoId: "proj-010",
    valor: 480,
    vencimento: "28 Fev 2026",
    vencimentoISO: "2026-02-28",
    status: "prevista",
    metodo: "BOLETO",
    nf: "na",
    comprovante: "nao",
  },
  {
    id: "p3",
    descricao: "2º Fotógrafo — Roberto",
    fornecedor: "Roberto Silva",
    categoria: "equipe",
    tipo: "evento",
    projeto: "Formatura UFMG",
    projetoId: "proj-006",
    valor: 1200,
    vencimento: "25 Fev 2026",
    vencimentoISO: "2026-02-25",
    status: "prevista",
    metodo: "PIX",
    nf: "na",
    comprovante: "nao",
  },
  {
    id: "p4",
    descricao: "Editora de fotos — Camila",
    fornecedor: "Camila Santos",
    categoria: "equipe",
    tipo: "evento",
    projeto: "Casamento Ferreira",
    projetoId: "proj-009",
    valor: 900,
    vencimento: "01 Mar 2026",
    vencimentoISO: "2026-03-01",
    status: "prevista",
    metodo: "TRANSFERENCIA",
    nf: "pendente",
    comprovante: "nao",
  },
  {
    id: "p5",
    descricao: "Assinatura Adobe CC",
    fornecedor: "Adobe Inc.",
    categoria: "operacional",
    tipo: "fixa",
    valor: 290,
    vencimento: "15 Fev 2026",
    vencimentoISO: "2026-02-15",
    status: "vencida",
    metodo: "CARTAO",
    nf: "na",
    comprovante: "nao",
    diasAtraso: 8,
  },
  {
    id: "p6",
    descricao: "Hospedagem galeria online",
    fornecedor: "CloudHost",
    categoria: "operacional",
    tipo: "fixa",
    valor: 120,
    vencimento: "10 Fev 2026",
    vencimentoISO: "2026-02-10",
    status: "paga",
    metodo: "CARTAO",
    nf: "emitida",
    comprovante: "sim",
  },
  {
    id: "p7",
    descricao: "Seguro equipamento",
    fornecedor: "Porto Seguro",
    categoria: "operacional",
    tipo: "fixa",
    valor: 450,
    vencimento: "05 Fev 2026",
    vencimentoISO: "2026-02-05",
    status: "paga",
    metodo: "BOLETO",
    nf: "emitida",
    comprovante: "sim",
  },
  {
    id: "p8",
    descricao: "Assistente evento",
    fornecedor: "Lucas Mendes",
    categoria: "equipe",
    tipo: "evento",
    projeto: "15 Anos Isabela",
    projetoId: "proj-003",
    valor: 500,
    vencimento: "20 Fev 2026",
    vencimentoISO: "2026-02-20",
    status: "paga",
    metodo: "PIX",
    nf: "na",
    comprovante: "sim",
  },
];

/* ── Merge payouts into despesas ── */
const payoutDespesas: Despesa[] = payoutsToDespesas().map((pd) => ({
  id: pd.id,
  descricao: pd.descricao,
  fornecedor: pd.fornecedor,
  categoria: pd.categoria,
  tipo: pd.tipo as TipoDespesa,
  projeto: pd.projeto,
  projetoId: pd.projetoId,
  valor: pd.valor,
  vencimento: pd.vencimento,
  vencimentoISO: pd.vencimentoISO,
  status: pd.status,
  metodo: pd.metodo,
  nf: pd.nf,
  comprovante: pd.comprovante,
  diasAtraso: pd.diasAtraso,
}));
const allDespesas: Despesa[] = [...mockDespesas, ...payoutDespesas.filter(
  (pd) => !mockDespesas.some((md) => md.id === pd.id)
)];

/* ── Filter chip definitions ── */
const pagarFilters: {
  key: PagarFilter;
  label: string;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}[] = [
  {
    key: "vencida",
    label: "Atrasadas",
    dot: "bg-[#FF3B30]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#E35151]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "vence_hoje",
    label: "Vence hoje",
    dot: "bg-[#FF9500]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "prox_7d",
    label: "Próx 7d",
    dot: "bg-[#007AFF]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#007AFF]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "paga",
    label: "Pagas",
    dot: "bg-[#34C759]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#45B56E]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "fixa",
    label: "Fixas",
    dot: "bg-[#AEAEB2]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#636366]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "repasse",
    label: "Repasse",
    dot: "bg-[#AEAEB2]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#636366]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "evento",
    label: "Evento",
    dot: "bg-[#7C3AED]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#9661F1]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "cancelada",
    label: "Canceladas",
    dot: "bg-[#AEAEB2]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#AEAEB2]",
    chipBorder: "border-[#E5E5EA]",
  },
];

/* ── StateSwitcher ── */
function StateSwitcher({
  active,
  onChange,
}: {
  active: ViewState;
  onChange: (v: ViewState) => void;
}) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ backgroundColor: dk.bgMuted }}>
      {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
          style={{ fontWeight: active === s ? 500 : 400, backgroundColor: active === s ? dk.bg : "transparent", color: active === s ? dk.textSecondary : dk.textMuted, boxShadow: active === s ? dk.shadowCard : "none" }}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function PagarContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projectId: string) => void;
}) {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeFilter, setActiveFilter] = useState<PagarFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(
    new Set(),
  );

  /* ── Filter logic ── */
  const filtered = allDespesas.filter((d) => {
    if (activeFilter !== "all") {
      if (activeFilter === "vencida" && d.status !== "vencida") return false;
      if (activeFilter === "vence_hoje" && d.status !== "vence_hoje")
        return false;
      if (activeFilter === "prox_7d" && !isProx7d(d)) return false;
      if (
        activeFilter === "paga" &&
        d.status !== "paga" &&
        d.status !== "conciliada"
      )
        return false;
      if (activeFilter === "fixa" && d.tipo !== "fixa") return false;
      if (activeFilter === "evento" && d.tipo !== "evento") return false;
      if (activeFilter === "repasse" && d.tipo !== "repasse") return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        d.descricao.toLowerCase().includes(q) ||
        d.fornecedor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ── KPI data ── */
  const totalPagar = allDespesas
    .filter((d) => d.status !== "paga" && d.status !== "conciliada")
    .reduce((s, d) => s + d.valor, 0);
  const totalVencido = allDespesas
    .filter((d) => d.status === "vencida")
    .reduce((s, d) => s + d.valor, 0);
  const totalPago = allDespesas
    .filter((d) => d.status === "paga")
    .reduce((s, d) => s + d.valor, 0);

  /* ── Filter counts ── */
  const counts: Record<PagarFilter, number> = {
    all: allDespesas.length,
    vencida: allDespesas.filter((d) => d.status === "vencida").length,
    vence_hoje: allDespesas.filter((d) => d.status === "vence_hoje").length,
    prox_7d: allDespesas.filter((d) => isProx7d(d)).length,
    paga: allDespesas.filter((d) => d.status === "paga").length,
    fixa: allDespesas.filter((d) => d.tipo === "fixa").length,
    evento: allDespesas.filter((d) => d.tipo === "evento").length,
    repasse: allDespesas.filter((d) => d.tipo === "repasse").length,
  };

  /* ── P02: Multi-select logic ── */
  const filteredIds = filtered.map((d) => d.id);
  const allSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  const headerCheckboxState: CheckboxState = allSelected
    ? "checked"
    : someSelected
      ? "indeterminate"
      : "unchecked";

  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredIds));
  }, [allSelected, filteredIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const totalSelecionado = filtered
    .filter((d) => selectedIds.has(d.id))
    .reduce((s, d) => s + d.valor, 0);

  /* ── P04: AlertBanner data ── */
  const vencidasCount = counts.vencida;
  const venceHojeCount = counts.vence_hoje;

  const dismissAlert = useCallback((key: string) => {
    setAlertsDismissed((prev) => new Set(prev).add(key));
  }, []);

  /* ── QuickActionsBar config (≤7) ── */
  const quickActions: QuickAction[] = [
    { label: "Nova despesa", icon: <Plus className="w-3 h-3" /> },
    {
      label: "Registrar pagamento",
      icon: <CreditCard className="w-3 h-3" />,
    },
    { label: "Conciliar", icon: <ArrowRightLeft className="w-3 h-3" /> },
    { label: "Exportar", icon: <Download className="w-3 h-3" /> },
  ];

  /* ── P02: BulkActionsBar config ── */
  const bulkActions: BulkAction[] = [
    {
      label: "Pagar em lote",
      icon: <Send className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Marcar pago",
      icon: <Check className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Exportar",
      icon: <Download className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Remarcar",
      icon: <CalendarClock className="w-3 h-3" />,
      onClick: clearSelection,
    },
  ];

  /* ── Row Tags builder (max 4) ── */
  function buildTags(d: Despesa) {
    const tags: { label: string; variant: TagVariant }[] = [];
    // 1. Categoria
    tags.push({ label: catLabel(d.categoria), variant: catTagVariant(d.categoria) });
    // 2. Método
    tags.push({ label: d.metodo, variant: metodoVariant(d.metodo) });
    // 3. NF
    if (d.nf === "emitida") tags.push({ label: "NF", variant: "success" });
    else if (d.nf === "pendente")
      tags.push({ label: "NF pend.", variant: "warning" });
    // 4. Comprovante
    if (d.comprovante === "sim")
      tags.push({ label: "Compr.", variant: "success" });
    return tags.slice(0, 4);
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1
            className="text-[22px] tracking-tight"
            style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}
          >
            Financeiro
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px]"
              style={{ fontWeight: 500, color: dk.textTertiary }}
            >
              Contas a pagar
            </span>
            <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
            <span
              className="text-[12px]"
              style={{ fontWeight: 400, color: dk.textSubtle }}
            >
              {allDespesas.length} despesas · Fevereiro 2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dk.textSubtle }} />
            <input
              type="text"
              placeholder="Buscar despesa ou fornecedor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px] pr-8 py-1.5 rounded-xl text-[12px] focus:outline-none focus:border-[#007AFF] transition-all"
              style={{ fontWeight: 400, paddingLeft: "2rem", border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: dk.textSubtle }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* CTA primário */}
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova despesa
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.border }} />
          <StateSwitcher active={viewState} onChange={setViewState} />
        </div>
      </div>

      {/* ═══ P05: QuickActionsBar ═══ */}
      <QuickActionsBar actions={quickActions} onAction={() => {}} />

      {/* ── Loading ── */}
      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 flex flex-col gap-2.5"
                style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }}
              >
                <div className="flex justify-between">
                  <div className="w-14 h-2.5 rounded animate-pulse" style={{ backgroundColor: dk.border }} />
                  <div className="w-7 h-7 rounded-lg animate-pulse" style={{ backgroundColor: dk.bgMuted }} />
                </div>
                <div className="w-20 h-5 rounded animate-pulse" style={{ backgroundColor: dk.border }} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center py-8 gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} />
            <span
              className="text-[12px]"
              style={{ fontWeight: 400, color: dk.textMuted }}
            >
              Carregando despesas…
            </span>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {viewState === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
            <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <span
            className="text-[14px]"
            style={{ fontWeight: 500, color: dk.textSecondary }}
          >
            Erro ao carregar despesas
          </span>
          <button
            onClick={() => setViewState("ready")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {viewState === "empty" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
            <CircleCheck className="w-7 h-7 text-[#34C759]" />
          </div>
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span
              className="text-[14px]"
              style={{ fontWeight: 500, color: dk.textSecondary }}
            >
              Sem contas a pagar
            </span>
            <span
              className="text-[12px] text-center"
              style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}
            >
              Todas as contas a pagar estão quitadas.
            </span>
          </div>
          <button
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova despesa
          </button>
        </div>
      )}

      {/* ═══ Ready ═══ */}
      {viewState === "ready" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Total a pagar"
              value={fmtCurrency(totalPagar)}
              icon={
                <ArrowUpRight className="w-3.5 h-3.5 text-[#FF3B30]" />
              }
              sub="em aberto"
            />
            <KpiCard
              label="Vencido"
              value={fmtCurrency(totalVencido)}
              icon={
                <AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
              }
              sub={`${counts.vencida} despesa${counts.vencida !== 1 ? "s" : ""}`}
            />
            <KpiCard
              label="Pago no mês"
              value={fmtCurrency(totalPago)}
              icon={<Check className="w-3.5 h-3.5 text-[#34C759]" />}
              sub="Fevereiro 2026"
            />
            <KpiCard
              label="Próx. vencimento"
              value="Hoje"
              icon={
                <Wallet className="w-3.5 h-3.5 text-[#FF9500]" />
              }
              sub="Aluguel de lente"
            />
          </div>

          {/* P04: AlertBanners */}
          <AnimatePresence>
            {vencidasCount > 0 && !alertsDismissed.has("vencidas") && (
              <AlertBanner
                key="alert-vencidas-pagar"
                variant="danger"
                title={`${vencidasCount} despesa${vencidasCount > 1 ? "s" : ""} vencida${vencidasCount > 1 ? "s" : ""} — ${fmtCurrency(totalVencido)} em atraso`}
                desc="Pagamentos em atraso podem gerar multas e juros."
                ctaLabel="Pagar vencidas"
                cta={() => {
                  setActiveFilter("vencida");
                  dismissAlert("vencidas");
                }}
                dismissible
                onDismiss={() => dismissAlert("vencidas")}
              />
            )}
            {venceHojeCount > 0 && !alertsDismissed.has("vence_hoje") && (
              <AlertBanner
                key="alert-vencehoje-pagar"
                variant="warning"
                title={`${venceHojeCount} despesa${venceHojeCount > 1 ? "s" : ""} vence${venceHojeCount > 1 ? "m" : ""} hoje`}
                desc="Realize os pagamentos para evitar atrasos."
                ctaLabel="Ver despesas de hoje"
                cta={() => {
                  setActiveFilter("vence_hoje");
                  dismissAlert("vence_hoje");
                }}
                dismissible
                onDismiss={() => dismissAlert("vence_hoje")}
              />
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setActiveFilter("all");
                clearSelection();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
              style={{
                fontWeight: 500,
                backgroundColor: activeFilter === "all" ? dk.bgMuted : dk.bg,
                borderColor: activeFilter === "all" ? (dk.isDark ? "#636366" : "#D1D1D6") : dk.border,
                color: activeFilter === "all" ? dk.textSecondary : dk.textTertiary,
              }}
            >
              <Filter className="w-3 h-3" />
              Todas
              <span
                className="text-[11px] tabular-nums"
                style={{ fontWeight: 600, color: activeFilter === "all" ? dk.textMuted : dk.textSubtle }}
              >
                {allDespesas.length}
              </span>
            </button>
            <span className="w-px h-5" style={{ backgroundColor: dk.border }} />
            {pagarFilters.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                count={counts[f.key] || 0}
                active={activeFilter === f.key}
                dot={f.dot}
                chipBg={f.chipBg}
                chipText={f.chipText}
                chipBorder={f.chipBorder}
                onClick={() => {
                  setActiveFilter(
                    activeFilter === f.key ? "all" : f.key,
                  );
                  clearSelection();
                }}
              />
            ))}
          </div>

          {/* P02: BulkActionsBar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <BulkActionsBar
                key="bulk-bar-pagar"
                count={selectedIds.size}
                actions={bulkActions}
                onClear={clearSelection}
              />
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            {/* Header row */}
            <div className="grid grid-cols-[28px_0.5fr_1.6fr_1fr_0.65fr_1fr_0.65fr_0.5fr_88px] gap-3 px-5 py-2.5 items-center" style={{ borderBottom: `1px solid ${dk.border}`, backgroundColor: dk.bgSub }}>
              <RowSelectCheckbox
                state={headerCheckboxState}
                onChange={toggleAll}
                alwaysVisible
                size="sm"
              />
              {["Tipo","Descrição","Fornecedor","Vencimento","Tags","Valor","Status"].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>{h}</span>
              ))}
              <span className="text-[10px] uppercase tracking-[0.06em] text-right" style={{ fontWeight: 600, color: dk.textSubtle }}>Ação</span>
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((d, idx) => (
                  <motion.div
                    key={d.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[28px_0.5fr_1.6fr_1fr_0.65fr_1fr_0.65fr_0.5fr_88px] gap-3 px-5 py-3 transition-colors group items-center"
                    style={{
                      borderTop: idx > 0 ? `1px solid ${dk.hairline}` : "none",
                      backgroundColor: selectedIds.has(d.id) ? (dk.isDark ? "#2C2410" : "#FAFAFA") : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!selectedIds.has(d.id)) e.currentTarget.style.backgroundColor = dk.bgHover; }}
                    onMouseLeave={(e) => { if (!selectedIds.has(d.id)) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {/* Checkbox */}
                    <RowSelectCheckbox
                      state={
                        selectedIds.has(d.id) ? "checked" : "unchecked"
                      }
                      onChange={() => toggleSelect(d.id)}
                      size="sm"
                    />

                    {/* TypeBadge */}
                    <TypeBadge variant={d.tipo === "repasse" ? "repasse" : "pagar"} />

                    {/* Descrição + Projeto clicável */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-[13px] truncate"
                        style={{ fontWeight: 500, color: dk.isDark ? "#AEAEB2" : "#48484A" }}
                      >
                        {d.descricao}
                      </span>
                      {d.projeto && (
                        <span
                          className="text-[11px] truncate cursor-pointer hover:underline underline-offset-2"
                          style={{ fontWeight: 400, color: dk.textSubtle }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (d.projetoId) onNavigateToProject?.(d.projetoId);
                          }}
                        >
                          {d.projeto}
                        </span>
                      )}
                    </div>

                    {/* Fornecedor */}
                    <span
                      className="text-[12px] truncate"
                      style={{ fontWeight: 400, color: dk.textTertiary }}
                    >
                      {d.fornecedor}
                    </span>

                    {/* Vencimento */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[12px] tabular-nums"
                        style={{ fontWeight: 400, color: dk.textMuted }}
                      >
                        {d.vencimento}
                      </span>
                      {d.diasAtraso && (
                        <span
                          className="text-[9px] text-[#FF3B30] px-1 py-[1px] rounded"
                          style={{ fontWeight: 600, backgroundColor: dk.bgMuted }}
                        >
                          {d.diasAtraso}d
                        </span>
                      )}
                    </div>

                    {/* Tags (max 4) */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {buildTags(d).map((tag) => (
                        <TagPill
                          key={tag.label}
                          variant={tag.variant}
                          size="xs"
                        >
                          {tag.label}
                        </TagPill>
                      ))}
                    </div>

                    {/* Valor */}
                    <span
                      className="text-[13px] tabular-nums"
                      style={{ fontWeight: 600, color: dk.textSecondary }}
                    >
                      {fmtCurrency(d.valor)}
                    </span>

                    {/* StatusBadge */}
                    <StatusBadge status={d.status} />

                    {/* CTA preto */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer active:scale-[0.97] opacity-0 group-hover:opacity-100 whitespace-nowrap"
                      style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}
                    >
                      {ctaIcon(d.status)}
                      {ctaLabel(d.status)}
                    </button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12 gap-2"
                >
                  <Search className="w-5 h-5" style={{ color: dk.textDisabled }} />
                  <span
                    className="text-[12px]"
                    style={{ fontWeight: 500, color: dk.textMuted }}
                  >
                    {search
                      ? `Nenhum resultado para "${search}"`
                      : "Nenhuma despesa neste filtro"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            <div className="flex items-center gap-4">
              <span
                className="text-[11px]"
                style={{ fontWeight: 400, color: dk.textSubtle }}
              >
                {filtered.length} de {allDespesas.length} despesas
              </span>
              <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
              <span
                className="text-[12px] text-[#FF3B30] tabular-nums"
                style={{ fontWeight: 500 }}
              >
                {fmtCurrency(
                  filtered
                    .filter((d) => d.status !== "paga")
                    .reduce((s, d) => s + d.valor, 0),
                )}{" "}
                a pagar
              </span>
              {selectedIds.size > 0 && (
                <>
                  <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ fontWeight: 500, color: dk.textTertiary }}
                  >
                    {fmtCurrency(totalSelecionado)} selecionado
                  </span>
                </>
              )}
            </div>
            <span
              className="text-[11px] tabular-nums"
              style={{ fontWeight: 400, color: dk.textDisabled }}
            >
              Atualizado agora
            </span>
          </div>
        </>
      )}
    </div>
  );
}