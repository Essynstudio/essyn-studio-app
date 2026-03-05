import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  Download,
  AlertCircle,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn } from "../../lib/motion-tokens";
import { WIDGET_SHADOW } from "../../lib/apple-style";

/* ── Dashboard pattern KIT ── */
import { HeaderWidget } from "../ui/header-widget";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import { InlineBanner } from "../ui/inline-banner";
import { WidgetCard } from "../ui/widget-card";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════ */
/*  02_Components — Primitivos reutilizáveis de /ui/  */
/* ═══════════════════════════════════════════════════ */
import { type KpiRange } from "../ui/kpi-card";
import { FilterChip } from "../ui/filter-chip";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import {
  RowSelectCheckbox,
  type CheckboxState,
} from "../ui/row-select-checkbox";
import {
  ActionRowItem,
  urgenciaConfig,
  fmtCurrency,
  type AcaoFinanceira,
  type AcaoTipo,
  type AcaoUrgencia,
} from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Modals & Drawer                                    */
/* ═══════════════════════════════════════════════════ */
import { CriarParcelasModal } from "./CriarParcelasModal";
import { CobrarParcelaModal } from "./CobrarParcelaModal";
import { AnexarComprovanteModal } from "./AnexarComprovanteModal";
import { ParcelaDetailDrawer } from "./ParcelaDetailDrawer";
import { getAllSyncedAcoes } from "../projetos/paymentPlanSync";
import { payoutsToAcoes } from "./payoutStore";
import { useAppStore } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Financeiro > Hoje (Execução)                       */
/*                                                     */
/*  Tela 100% controlada por 02_Components/03_Patterns */
/*                                                     */
/*  Composição:                                        */
/*  ┌─ Pattern P05: Header Financeiro ────────────┐  */
/*  │  Title + Period + Search + CTA preto          │  */
/*  │  QuickActionsBar (7 atalhos)                  │  */
/*  └──────────────────────────────────────────────┘  */
/*  ┌─ Pattern P01: Central de Execução ───────────┐  */
/*  │  KpiCard x5                                   │  */
/*  │  AlertBanner (danger + warning)               │  */
/*  │  FilterChip (7 chips com contadores)          │  */
/*  │  ┌─ Pattern P02: Lista Operacional ─────────┐ │  */
/*  │  │  BulkActionsBar (quando selecionados)     │ │  */
/*  │  │  RowSelectCheckbox header                  │ │  */
/*  │  │  ActionRowItem x12 (lista mista)          │ │  */
/*  │  └──────────────────────────────────────────┘ │  */
/*  │  Footer summary (totais do filtro ativo)     │  */
/*  └──────────────────────────────────────────────┘  */
/*                                                     */
/*  4 estados: ready / loading / empty / error         */
/*  CTA primário: SEMPRE preto (#1D1D1F)              */
/*  Cores: SOMENTE em StatusBadge/TagPill/AlertBanner */
/* ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type ChipFilter = "all" | AcaoUrgencia;

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                          */
/* ═══════════════════════════════════════════════════ */

const TODAY = "22 Fev 2026";

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const mockAcoes: AcaoFinanceira[] = [
  {
    id: "a1", tipoLinha: "receber", projeto: "Casamento Oliveira & Santos", cliente: "Ana Oliveira",
    descricao: "Parcela 3/4 vencida — aguardando pagamento", valor: 2800,
    urgencia: "atrasada", tipo: "cobrar", vencimento: "15 Fev 2026",
    parcela: "3/4", diasAtraso: 7, projetoId: "proj-001",
    metodo: "pix", nfStatus: "pendente", comprovante: "nao", statusParcela: "vencida",
  },
  {
    id: "a2", tipoLinha: "receber", projeto: "Formatura Direito UFMG", cliente: "Carla Dias",
    descricao: "Parcela 3/5 vencida — cliente não respondeu", valor: 1900,
    urgencia: "atrasada", tipo: "cobrar", vencimento: "12 Fev 2026",
    parcela: "3/5", diasAtraso: 10, projetoId: "proj-006",
    metodo: "boleto", nfStatus: "emitida", comprovante: "nao", statusParcela: "vencida",
  },
  {
    id: "a3", tipoLinha: "receber", projeto: "Batizado Gabriel Costa", cliente: "Pedro Costa",
    descricao: "Parcela 2/2 vence hoje", valor: 1200,
    urgencia: "hoje", tipo: "cobrar", vencimento: TODAY, parcela: "2/2",
    projetoId: "proj-004",
    metodo: "pix", nfStatus: "pendente", comprovante: "nao", statusParcela: "vence_hoje",
  },
  {
    id: "a4", tipoLinha: "receber", projeto: "Ensaio Família Rocha", cliente: "Marina Rocha",
    descricao: "Sinal recebido via PIX — confirmar", valor: 800,
    urgencia: "hoje", tipo: "marcar_pago", vencimento: TODAY, parcela: "1/2",
    projetoId: "proj-008",
    metodo: "pix", nfStatus: "na", comprovante: "sim", statusParcela: "vence_hoje",
  },
  {
    id: "a5", tipoLinha: "receber", projeto: "15 Anos Isabela Mendes", cliente: "Renata Mendes",
    descricao: "Parcela 2/3 vence em 3 dias — enviar lembrete", valor: 2200,
    urgencia: "pendencia", tipo: "lembrete", vencimento: "25 Fev 2026",
    parcela: "2/3", projetoId: "proj-003",
    metodo: "cartao", nfStatus: "emitida", comprovante: "nao", statusParcela: "prevista",
  },
  {
    id: "a6", tipoLinha: "pagar", projeto: "Pré-Wedding Oliveira", cliente: "Ana Oliveira",
    descricao: "Aluguel de lente 70-200mm — vence hoje", valor: 350,
    urgencia: "hoje", tipo: "pagar", vencimento: TODAY,
    projetoId: "proj-001",
    metodo: "pix", nfStatus: "na", comprovante: "nao", statusParcela: "vence_hoje",
  },
  {
    id: "a7", tipoLinha: "alerta", projeto: "Formatura Direito UFMG", cliente: "Carla Dias",
    descricao: "Custo do segundo fotógrafo acima do estimado", valor: 600,
    urgencia: "alerta", tipo: "revisar_custos", vencimento: "—",
    projetoId: "proj-006",
    metodo: "transferencia", nfStatus: "pendente", comprovante: "nao", statusParcela: "prevista",
  },
  {
    id: "a8", tipoLinha: "receber", projeto: "Casamento Ferreira & Lima", cliente: "Julia Ferreira",
    descricao: "Parcela 1/3 vence em 5 dias — enviar lembrete", valor: 3500,
    urgencia: "pendencia", tipo: "lembrete", vencimento: "27 Fev 2026",
    parcela: "1/3", projetoId: "proj-009",
    metodo: "boleto", nfStatus: "pendente", comprovante: "nao", statusParcela: "prevista",
  },
  {
    id: "a9", tipoLinha: "receber", projeto: "Corporativo TechBR", cliente: "TechBR Soluções",
    descricao: "NF emitida, pagamento pendente — cobrar", valor: 4200,
    urgencia: "atrasada", tipo: "cobrar", vencimento: "08 Fev 2026",
    parcela: "Única", diasAtraso: 14, projetoId: "proj-002",
    metodo: "boleto", nfStatus: "emitida", comprovante: "nao", statusParcela: "vencida",
  },
  {
    id: "a10", tipoLinha: "pagar", projeto: "Making Of Estúdio K", cliente: "Estúdio K Produções",
    descricao: "Impressão fine art — pagamento ao fornecedor", valor: 480,
    urgencia: "alerta", tipo: "pagar", vencimento: "28 Fev 2026",
    projetoId: "proj-010",
    metodo: "transferencia", nfStatus: "na", comprovante: "nao", statusParcela: "prevista",
  },
  {
    id: "a11", tipoLinha: "fiscal", projeto: "Casamento Oliveira & Santos", cliente: "Ana Oliveira",
    descricao: "NF da parcela 2/4 pendente de emissão", valor: 2800,
    urgencia: "nf_pendente", tipo: "revisar_custos", vencimento: "—",
    projetoId: "proj-001",
    metodo: "pix", nfStatus: "pendente", comprovante: "sim", statusParcela: "paga",
  },
  {
    id: "a12", tipoLinha: "repasse", projeto: "Formatura Direito UFMG", cliente: "Carla Dias",
    descricao: "Repasse ao 2º fotógrafo — Roberto", valor: 1200,
    urgencia: "repasse", tipo: "pagar", vencimento: "25 Fev 2026",
    projetoId: "proj-006",
    metodo: "pix", nfStatus: "na", comprovante: "nao", statusParcela: "prevista",
  },
];

/* ── Merge synced parcelas as ações for today's view ── */
const syncedAcoesHoje = getAllSyncedAcoes().filter(
  (a) => a.urgencia === "atrasada" || a.urgencia === "hoje"
);
const syncedIds = new Set(syncedAcoesHoje.map((a) => a.id));
const mergedAcoes: AcaoFinanceira[] = [
  // Synced parcelas first (from PaymentPlan)
  ...syncedAcoesHoje,
  // Then original mock items that don't overlap with synced data
  ...mockAcoes.filter((a) => !syncedIds.has(a.id)),
];

/* ── Add payouts as ações for today's view ─ */
const payoutAcoes = payoutsToAcoes();
const payoutIds = new Set(payoutAcoes.map((a) => a.id));
const finalAcoes: AcaoFinanceira[] = [
  // Synced parcelas first (from PaymentPlan)
  ...syncedAcoesHoje,
  // Then payouts (pending only, already filtered by payoutsToAcoes)
  ...payoutAcoes.filter((a) => !syncedIds.has(a.id)),
  // Then original mock items that don't overlap
  ...mockAcoes.filter((a) => !syncedIds.has(a.id) && !payoutIds.has(a.id)),
];

/* ═══════════════════════════════════════════════════ */
/*  CHIP FILTER DEFINITIONS                            */
/* ═══════════════════════════════════════════════════ */

const chipUrgencies: AcaoUrgencia[] = ["atrasada","hoje","pendencia","alerta","nf_pendente","repasse"];

/* ═══════════════════════════════════════════════════ */
/*  SUB-COMPONENTS — Estado / Layout                   */
/* ═══════════════════════════════════════════════════ */

/* ── PeriodSelector (Header Financeiro pattern) ── */

function PeriodSelector({ month, year, onChangeMonth, onChangeYear }: { month: number; year: number; onChangeMonth: (m: number) => void; onChangeYear: (y: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useDk();
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const years = [2024, 2025, 2026];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer ${isDark ? "border-[#3C3C43] bg-[#1C1C1E] text-[#8E8E93] hover:border-[#636366]" : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#D1D1D6]"}`} style={{ fontWeight: 500 }}>
        <CalendarDays className={`w-3.5 h-3.5 ${isDark ? "text-[#636366]" : "text-[#D1D1D6]"}`} />{MONTHS[month]} {year}
        <ChevronDown className={`w-3 h-3 transition-transform ${isDark ? "text-[#636366]" : "text-[#D1D1D6]"} ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div key="period-dropdown" initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={springPopoverIn} className={`absolute left-0 top-full mt-1.5 z-50 w-[280px] rounded-2xl border overflow-hidden ${isDark ? "border-[#3C3C43] bg-[#1C1C1E]" : "border-[#E5E5EA] bg-white"}`} style={{ boxShadow: isDark ? "0 4px 16px #000000" : "0 4px 16px #E5E5EA" }}>
            <div className={`flex items-center gap-1 p-2 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#E5E5EA]"}`}>
              {years.map((y) => (<button key={y} onClick={() => onChangeYear(y)} className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${year === y ? (isDark ? "bg-[#F5F5F7] text-[#1D1D1F]" : "bg-[#1D1D1F] text-white") : (isDark ? "text-[#636366] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:bg-[#F2F2F7]")}`} style={{ fontWeight: year === y ? 600 : 400 }}>{y}</button>))}
            </div>
            <div className="grid grid-cols-3 gap-1 p-2">
              {MONTHS.map((m, i) => (<button key={m} onClick={() => { onChangeMonth(i); setOpen(false); }} className={`py-2 rounded-lg text-[11px] transition-all cursor-pointer ${month === i ? (isDark ? "bg-[#2C2C2E] text-[#F5F5F7]" : "bg-[#F2F2F7] text-[#48484A]") : (isDark ? "text-[#636366] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:bg-[#F2F2F7]")}`} style={{ fontWeight: month === i ? 600 : 400 }}>{m.slice(0, 3)}</button>))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── StateSwitcher (mini-frame controller) ── */

function StateSwitcher({ active, onChange }: { active: ViewState; onChange: (v: ViewState) => void }) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
      {(["ready","loading","empty","error"] as ViewState[]).map((s) => (
        null
      ))}
    </div>
  );
}

/* ── LoadingSkeleton (P01 pattern — loading state) ── */

function LoadingSkeleton() {
  const { isDark } = useDk();
  const skelBg = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className={`h-[88px] rounded-2xl ${skelBg}`} />
        ))}
      </div>
      {/* Alert skeleton */}
      <div className={`h-16 rounded-2xl ${skelBg}`} />
      {/* FilterChips skeleton */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`fc-skel-${i}`} className={`h-8 w-24 rounded-xl ${skelBg}`} />
        ))}
      </div>
      {/* Header row skeleton */}
      <div className={`h-10 rounded-xl ${skelBg}`} />
      {/* Rows skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`row-skel-${i}`} className={`h-20 rounded-2xl ${skelBg}`} />
      ))}
      {/* Footer skeleton */}
      <div className={`h-12 rounded-2xl ${isDark ? "bg-[#1C1C1E]" : "bg-[#FAFAFA]"}`} />
    </div>
  );
}

/* ── EmptyState (P01 pattern — empty state) ── */

function EmptyState({ onNewLancamento }: { onNewLancamento: () => void }) {
  const { isDark } = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
        <CircleCheck className="w-7 h-7 text-[#34C759]" />
      </div>
      <div className="flex flex-col items-center gap-1 max-w-[300px]">
        <span className={`text-[15px] ${isDark ? "text-[#AEAEB2]" : "text-[#636366]"}`} style={{ fontWeight: 500 }}>
          Nada pendente hoje
        </span>
        <span className={`text-[13px] text-center ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400, lineHeight: 1.6 }}>
          Todas as cobranças estão em dia e não há ações financeiras para executar. Bom trabalho!
        </span>
      </div>
      {/* CTA primário preto — regra ESSYN */}
      <button
        onClick={onNewLancamento}
        className={`mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97] ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`}
        style={{ fontWeight: 500 }}
      >
        <Plus className="w-3.5 h-3.5" />Novo lançamento
      </button>
    </div>
  );
}

/* ── ErrorState (P01 pattern — error state) ── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { isDark } = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
        <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
      </div>
      <div className="flex flex-col items-center gap-1 max-w-[300px]">
        <span className={`text-[15px] ${isDark ? "text-[#AEAEB2]" : "text-[#636366]"}`} style={{ fontWeight: 500 }}>
          Erro ao carregar dados
        </span>
        <span className={`text-[13px] text-center ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400, lineHeight: 1.6 }}>
          Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
        </span>
      </div>
      {/* CTA primário preto — regra ESSYN */}
      <button
        onClick={onRetry}
        className={`mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97] ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`}
        style={{ fontWeight: 500 }}
      >
        <RefreshCw className="w-3.5 h-3.5" />Tentar novamente
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/*                                                     */
/*  Hierarchy (follows 03_Patterns):                   */
/*  P05: Header → QuickActions                        */
/*  P01: KPIs → Alerts → Chips →                      */
/*  P02: Bulk → SelectAll → ActionRows →              */
/*       Footer → Modals/Drawer                       */
/* ═══════════════════════════════════════════════════ */

export function FinanceiroHojeContent({ onNavigateToProject }: { onNavigateToProject?: (projectId: string) => void }) {
  const { addNotification, markParcelaPaid } = useAppStore();
  const { isDark } = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeChip, setActiveChip] = useState<ChipFilter>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [kpiRange, setKpiRange] = useState<KpiRange>("30d");
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());

  // Modals / Drawer
  const [showCriarParcelas, setShowCriarParcelas] = useState(false);
  const [showCobrar, setShowCobrar] = useState(false);
  const [showAnexar, setShowAnexar] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  /* ── Derived data ── */
  const visibleAcoes = finalAcoes.filter((a) => !dismissed.has(a.id));
  const filteredAcoes = visibleAcoes.filter((a) => {
    if (activeChip !== "all" && a.urgencia !== activeChip) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.projeto.toLowerCase().includes(q) || a.cliente.toLowerCase().includes(q) || a.descricao.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = Object.fromEntries(chipUrgencies.map(u => [u, visibleAcoes.filter(a => a.urgencia === u).length])) as Record<AcaoUrgencia, number>;

  const totalReceber = visibleAcoes.filter(a => a.tipoLinha === "receber").reduce((s, a) => s + a.valor, 0);
  const totalPagar = visibleAcoes.filter(a => a.tipoLinha === "pagar" || a.tipoLinha === "repasse").reduce((s, a) => s + a.valor, 0);
  const saldoAtual = 18750;
  const previsaoCaixa = saldoAtual + totalReceber - totalPagar;
  const inadimplencia = visibleAcoes.filter(a => a.urgencia === "atrasada").reduce((s, a) => s + a.valor, 0);
  const inadimplenciaClientes = new Set(visibleAcoes.filter(a => a.urgencia === "atrasada").map(a => a.cliente)).size;
  const nfPendentes = visibleAcoes.filter(a => a.nfStatus === "pendente").length;

  const totalReceber7d = Math.round(totalReceber * 0.4);
  const totalPagar7d = Math.round(totalPagar * 0.35);

  /* ── P02: Lista Operacional — Select-all logic ── */
  const filteredIds = filteredAcoes.map(a => a.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  const headerCheckboxState: CheckboxState = allSelected ? "checked" : someSelected ? "indeterminate" : "unchecked";

  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredIds));
  }, [allSelected, filteredIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const totalSelecionado = filteredAcoes.filter(a => selectedIds.has(a.id)).reduce((s, a) => s + a.valor, 0);

  /* ── Handlers ── */
  const handleAction = useCallback((id: string, tipo: AcaoTipo) => {
    if (tipo === "cobrar") { setShowCobrar(true); return; }
    const acao = finalAcoes.find(a => a.id === id);
    if (tipo === "marcar_pago" && acao) {
      addNotification({
        type: "payment_received",
        title: "Pagamento confirmado",
        description: `${acao.projeto} — ${fmtCurrency(acao.valor)} (${acao.metodo?.toUpperCase() || "PIX"})`,
        timestamp: "agora",
        read: false,
        route: "/financeiro",
      });
      toast.success("Pagamento confirmado!", { description: `${acao.cliente} — ${fmtCurrency(acao.valor)}` });
    } else if (tipo === "lembrete" && acao) {
      toast.success("Lembrete enviado", { description: `${acao.cliente} — ${acao.descricao}` });
    } else if (tipo === "pagar" && acao) {
      toast.success("Pagamento registrado", { description: `${acao.projeto} — ${fmtCurrency(acao.valor)}` });
    }
    setDismissed(prev => new Set(prev).add(id));
  }, [addNotification]);

  const handleBulkAction = useCallback(() => {
    const selected = finalAcoes.filter(a => selectedIds.has(a.id));
    const totalBulk = selected.reduce((s, a) => s + a.valor, 0);
    if (selected.length > 0) {
      addNotification({
        type: "payment_received",
        title: `${selected.length} ações processadas`,
        description: `Total: ${fmtCurrency(totalBulk)} — lote financeiro`,
        timestamp: "agora",
        read: false,
        route: "/financeiro",
      });
    }
    setDismissed(prev => { const n = new Set(prev); selectedIds.forEach(id => n.add(id)); return n; });
    setSelectedIds(new Set());
  }, [selectedIds, addNotification]);

  const handleQuickAction = useCallback((action: string) => {
    if (action === "Nova receita" || action === "Nova despesa") setShowCriarParcelas(true);
    if (action === "Emitir cobrança") setShowCobrar(true);
    if (action === "Receber parcela") setShowAnexar(true);
  }, []);

  const dismissAlert = useCallback((key: string) => {
    setAlertsDismissed(prev => new Set(prev).add(key));
  }, []);

  /* ── P02: BulkActionsBar config ── */
  const bulkActions: BulkAction[] = [
    { label: "Cobrar em lote", icon: <Send className="w-3 h-3" />, onClick: handleBulkAction },
    { label: "Marcar recebido", icon: <Check className="w-3 h-3" />, onClick: handleBulkAction },
    { label: "Exportar", icon: <Download className="w-3 h-3" />, onClick: clearSelection },
    { label: "Remarcar", icon: <CalendarClock className="w-3 h-3" />, onClick: clearSelection },
  ];

  /* ── Filtered footer totals ── */
  const filteredReceber = filteredAcoes.filter(a => a.tipoLinha === "receber").reduce((s, a) => s + a.valor, 0);
  const filteredPagar = filteredAcoes.filter(a => a.tipoLinha === "pagar" || a.tipoLinha === "repasse").reduce((s, a) => s + a.valor, 0);

  const hairline = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  const sep = isDark ? "bg-[#3C3C43]" : "bg-[#E5E5EA]";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">

      {/* ═══════════════════════════════════════════════ */}
      {/* WIDGET 1 — HEADER (Dashboard pattern)          */}
      {/* ═══════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Financeiro"
        userName=""
        contextLine={`${visibleAcoes.length} ações pendentes · Saldo ${fmtCurrency(saldoAtual)} · ${TODAY}`}
        quickActions={[
          { label: "Nova receita", icon: <ArrowDownRight className="w-4 h-4" />, onClick: () => { setShowCriarParcelas(true); } },
          { label: "Nova despesa", icon: <ArrowUpRight className="w-4 h-4" />, onClick: () => { setShowCriarParcelas(true); } },
          { label: "Conciliar", icon: <ArrowRightLeft className="w-4 h-4" />, onClick: () => toast("Conciliar") },
          { label: "Cobrar", icon: <Send className="w-4 h-4" />, onClick: () => { setShowCobrar(true); } },
        ]}
        showSearch
        searchPlaceholder="Buscar cliente ou projeto…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── Alerts (Dashboard pattern — InlineBanner inside HeaderWidget) ─── */}
        {counts.atrasada > 0 && !alertsDismissed.has("atrasadas") && (
          <>
            <div className={`mx-5 h-px ${hairline}`} />
            <div className="flex flex-col px-2 py-1">
              <InlineBanner
                variant="danger"
                title={`${counts.atrasada} cobrança${counts.atrasada > 1 ? "s" : ""} atrasada${counts.atrasada > 1 ? "s" : ""} — ${fmtCurrency(inadimplencia)}`}
                desc="Envie cobranças para evitar impacto no fluxo de caixa."
                ctaLabel="Ver atrasadas"
                cta={() => { setActiveChip("atrasada"); setAlertsDismissed(prev => new Set(prev).add("atrasadas")); }}
                dismissible
                onDismiss={() => dismissAlert("atrasadas")}
              />
            </div>
          </>
        )}
        {nfPendentes > 0 && !alertsDismissed.has("nf_pendentes") && (
          <>
            <div className={`mx-5 h-px ${hairline}`} />
            <div className="flex flex-col px-2 py-1">
              <InlineBanner
                variant="warning"
                title={`${nfPendentes} NF${nfPendentes > 1 ? "s" : ""} pendente${nfPendentes > 1 ? "s" : ""} de emissão`}
                desc="Regularize as notas fiscais para conformidade."
                ctaLabel="Ver NF pendentes"
                cta={() => { setActiveChip("nf_pendente"); setAlertsDismissed(prev => new Set(prev).add("nf_pendentes")); }}
                dismissible
                onDismiss={() => dismissAlert("nf_pendentes")}
              />
            </div>
          </>
        )}

        {/* ─── KPIs (Dashboard pattern — DashboardKpiGrid flat) ─── */}
        <div className={`mx-5 h-px ${hairline}`} />
        <DashboardKpiGrid
          flat
          projetos={{
            label: "Saldo atual",
            value: fmtCurrency(saldoAtual),
            sub: "conta principal",
            icon: <CircleDollarSign className="w-3.5 h-3.5 text-[#AEAEB2]" />,
          }}
          aReceber={{
            label: "A receber",
            value: fmtCurrency(totalReceber),
            sub: "vs. mês anterior",
            trend: { direction: "up", label: "+12%", positive: true },
            icon: <ArrowDownRight className="w-3.5 h-3.5 text-[#34C759]" />,
          }}
          producao={{
            label: "A pagar",
            value: fmtCurrency(totalPagar),
            sub: "vs. mês anterior",
            trend: { direction: "down", label: "−5%", positive: true },
            icon: <ArrowUpRight className="w-3.5 h-3.5 text-[#FF3B30]" />,
          }}
          compromissos={{
            label: "Inadimplência",
            value: fmtCurrency(inadimplencia),
            sub: `${inadimplenciaClientes} cliente${inadimplenciaClientes !== 1 ? "s" : ""}`,
            icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FF3B30]" />,
          }}
        />
      </HeaderWidget>

      {/* ═══════════════════════════════════════════════ */}
      {/* Estados: loading / empty / error               */}
      {/* ═══════════════════════════════════════════════ */}
      {viewState === "loading" && <LoadingSkeleton />}
      {viewState === "error" && <ErrorState onRetry={() => setViewState("ready")} />}
      {viewState === "empty" && <EmptyState onNewLancamento={() => setShowCriarParcelas(true)} />}

      {/* ═══════════════════════════════════════════════ */}
      {/* Central de Execução (ready state)              */}
      {/* Toolbar + Chips → Lista → Footer               */}
      {/* ═══════════════════════════════════════════════ */}
      {viewState === "ready" && (
        <>
          {/* ═════════════════════════════════════════════ */}
          {/* WidgetCard — Central de Execução              */}
          {/* Toolbar + Bulk + SelectAll + Flat ActionRows  */}
          {/* ═════════════════════════════════════════════ */}
          <WidgetCard
            title="Ações Financeiras"
            count={filteredAcoes.length}
            delay={0.12}
          >
            {/* ─── Toolbar: Period + Chips ─── */}
            <div className={`flex items-center justify-between gap-4 px-5 py-2.5 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <PeriodSelector month={selectedMonth} year={selectedYear} onChangeMonth={setSelectedMonth} onChangeYear={setSelectedYear} />
                <span className={`w-px h-5 ${sep} mx-1`} />
                <FilterChip
                  label="Todas"
                  count={visibleAcoes.length}
                  active={activeChip === "all"}
                  dot="bg-[#D1D1D6]"
                  chipBg="bg-[#F2F2F7]"
                  chipText="text-[#48484A]"
                  chipBorder="border-[#D1D1D6]"
                  onClick={() => { setActiveChip("all"); clearSelection(); }}
                />
                <span className={`w-px h-5 ${sep}`} />
                {chipUrgencies.map(u => {
                  const cfg = urgenciaConfig[u];
                  return (
                    <FilterChip
                      key={u}
                      label={cfg.label}
                      count={counts[u]}
                      active={activeChip === u}
                      dot={cfg.dot}
                      chipBg={cfg.chipBg}
                      chipText={cfg.chipText}
                      chipBorder={cfg.chipBorder}
                      onClick={() => { setActiveChip(activeChip === u ? "all" : u); clearSelection(); }}
                    />
                  );
                })}
              </div>
              {dismissed.size > 0 && (
                <button onClick={() => setDismissed(new Set())} className="flex items-center gap-1 text-[11px] text-[#D1D1D6] hover:text-[#AEAEB2] transition-colors cursor-pointer shrink-0" style={{ fontWeight: 400 }}>
                  <RefreshCw className="w-3 h-3" />Restaurar ({dismissed.size})
                </button>
              )}
            </div>

            {/* ─── BulkActionsBar ─── */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <div className="px-5 pt-2.5">
                  <BulkActionsBar
                    key="bulk-bar"
                    count={selectedIds.size}
                    actions={bulkActions}
                    onClear={clearSelection}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* ─── Select-all header ─── */}
            <div className={`flex items-center gap-3 px-5 py-2.5 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
              <RowSelectCheckbox
                state={headerCheckboxState}
                onChange={toggleAll}
                alwaysVisible
                size="sm"
              />
              <span
                className="flex-1 text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]"
                style={{ fontWeight: 600, letterSpacing: "0.08em" }}
              >
                {selectedIds.size > 0
                  ? `${selectedIds.size} selecionado${selectedIds.size > 1 ? "s" : ""}`
                  : `${filteredAcoes.length} ação${filteredAcoes.length !== 1 ? "es" : ""}`}
              </span>
              {selectedIds.size > 0 && (
                <span className="text-[11px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>
                  Total: {fmtCurrency(totalSelecionado)}
                </span>
              )}
              <div
                className="flex items-center gap-6 text-[10px] uppercase tracking-[0.08em] text-[#D1D1D6]"
                style={{ fontWeight: 500 }}
              >
                <span>Valor</span>
                <span>Ação</span>
              </div>
            </div>

            {/* ─── Flat ActionRowItem list with hairlines ─── */}
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {filteredAcoes.length > 0 ? (
                  filteredAcoes.map((acao, idx) => (
                    <div key={acao.id}>
                      {idx > 0 && <div className={`mx-5 h-px ${hairline}`} />}
                      <ActionRowItem
                        acao={acao}
                        onAction={handleAction}
                        onViewProject={onNavigateToProject}
                        onOpenDetail={() => setShowDrawer(true)}
                        onAnexar={() => setShowAnexar(true)}
                        selected={selectedIds.has(acao.id)}
                        onToggleSelect={toggleSelect}
                        embedded
                      />
                    </div>
                  ))
                ) : (
                  <motion.div key="no-results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
                      {searchQuery ? <Search className="w-5 h-5 text-[#D1D1D6]" /> : <Inbox className="w-5 h-5 text-[#D1D1D6]" />}
                    </div>
                    <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{searchQuery ? `Nenhum resultado para "${searchQuery}"` : "Nenhuma ação neste filtro"}</span>
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="text-[11px] text-[#AEAEB2] hover:text-[#636366] cursor-pointer" style={{ fontWeight: 500 }}>Limpar busca</button>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </WidgetCard>

          {/* ─── Footer summary (WidgetCard KIT) ─── */}
          <WidgetCard delay={0.16}>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-5">
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  {filteredAcoes.length} {filteredAcoes.length === 1 ? "item" : "itens"} — Filtro: {activeChip === "all" ? "Todas" : urgenciaConfig[activeChip].label}
                </span>
                <span className={`w-px h-3 ${sep}`} />
                <span className="text-[12px] text-[#34C759] tabular-nums flex items-center gap-0.5" style={{ fontWeight: 500 }}>
                  <ArrowDownRight className="w-3 h-3" />{fmtCurrency(filteredReceber)} a receber
                </span>
                {filteredPagar > 0 && (
                  <span className="text-[12px] text-[#FF3B30] tabular-nums flex items-center gap-0.5" style={{ fontWeight: 500 }}>
                    <ArrowUpRight className="w-3 h-3" />{fmtCurrency(filteredPagar)} a pagar
                  </span>
                )}
              </div>
              <span className={`text-[11px] tabular-nums ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} style={{ fontWeight: 400 }}>Atualizado agora · {MONTHS[selectedMonth]} {selectedYear}</span>
            </div>
          </WidgetCard>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* Modals & Drawer                                */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCriarParcelas && <CriarParcelasModal key="modal-criar" open={showCriarParcelas} onClose={() => setShowCriarParcelas(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCobrar && <CobrarParcelaModal key="modal-cobrar" open={showCobrar} onClose={() => setShowCobrar(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAnexar && <AnexarComprovanteModal key="modal-anexar" open={showAnexar} onClose={() => setShowAnexar(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showDrawer && <ParcelaDetailDrawer key="drawer-detail" open={showDrawer} onClose={() => setShowDrawer(false)} />}
      </AnimatePresence>
    </div>
  );
}