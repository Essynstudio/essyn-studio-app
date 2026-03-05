import { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Plus,
  Download,
  ShieldAlert,
  CalendarDays,
  ChevronDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn, springContentIn, springDefault } from "../../lib/motion-tokens";
import { KpiCard } from "../ui/kpi-card";
import { fmtCurrency } from "../ui/action-row-item";
import { AlertBanner } from "../ui/alert-banner";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import { TagPill } from "../ui/tag-pill";
import { getAllSyncedParcelas } from "../projetos/paymentPlanSync";
import { useAppStore, type AppParcela, type AppProject } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Fluxo de Caixa — Projeção 30 dias (V1 simples)    */
/*  Ref: Xero Cash Flow clean · Sem gráficos          */
/*  Usa SOMENTE primitivos 02_Components               */
/*  Dados: synced parcelas (receber) + mock (pagar)    */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";

const TODAY_ISO = "2026-02-23";
const SALDO_INICIAL = 18750;

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

/* ── Mock payables (same source as PagarContent) ── */
interface CaixaEntry {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  vencimentoISO: string;
  projeto?: string;
}

function buildCaixaEntries(storeParcelas?: AppParcela[], storeProjects?: AppProject[]): CaixaEntry[] {
  const entries: CaixaEntry[] = [];
  const addedIds = new Set<string>();

  /* 1) Entradas: synced parcelas (receivables) not yet paid */
  const parcelas = getAllSyncedParcelas();
  for (const p of parcelas) {
    if (p.status === "paga" || p.status === "conciliada" || p.status === "cancelada") continue;
    addedIds.add(p.id);
    entries.push({
      id: `e-${p.id}`,
      tipo: "entrada",
      descricao: p.tipo === "entrada"
        ? `Entrada — ${p.projetoNome}`
        : `Parcela ${p.numero}/${p.totalParcelas} — ${p.projetoNome}`,
      valor: p.valor,
      vencimentoISO: p.vencimento,
      projeto: p.projetoNome,
    });
  }

  /* 1b) Entradas from AppStore parcelas (not yet paid, avoid dupes) */
  if (storeParcelas && storeProjects) {
    for (const sp of storeParcelas) {
      if (sp.status === "pago" || sp.status === "cancelado") continue;
      if (addedIds.has(sp.id)) continue;
      const proj = storeProjects.find((pr) => pr.id === sp.projetoId);
      entries.push({
        id: `e-${sp.id}`,
        tipo: "entrada",
        descricao: `${sp.descricao}`,
        valor: sp.valor,
        vencimentoISO: sp.vencimento,
        projeto: proj?.nome || "Projeto",
      });
    }
  }

  /* 2) Saídas: mock payables (same mock as PagarContent, unpaid only) */
  const payables: { id: string; desc: string; valor: number; venc: string; proj?: string }[] = [
    { id: "s-p1", desc: "Aluguel de lente 70-200mm", valor: 350, venc: "2026-02-23", proj: "Casamento Oliveira" },
    { id: "s-p2", desc: "Impressão fine art 20x30", valor: 480, venc: "2026-02-28", proj: "Making Of Estúdio K" },
    { id: "s-p3", desc: "2º Fotógrafo — Roberto", valor: 1200, venc: "2026-02-25", proj: "Formatura UFMG" },
    { id: "s-p4", desc: "Editora de fotos — Camila", valor: 900, venc: "2026-03-01", proj: "Casamento Ferreira" },
    { id: "s-p5", desc: "Assinatura Adobe CC", valor: 290, venc: "2026-02-15" },
    { id: "s-p9", desc: "Aluguel estúdio março", valor: 1800, venc: "2026-03-05" },
    { id: "s-p10", desc: "Manutenção câmera", valor: 650, venc: "2026-03-12" },
    { id: "s-p11", desc: "Seguro equipamento (mar)", valor: 450, venc: "2026-03-15" },
    { id: "s-p12", desc: "Assinatura Adobe CC (mar)", valor: 290, venc: "2026-03-15" },
  ];

  for (const p of payables) {
    entries.push({
      id: p.id,
      tipo: "saida",
      descricao: p.desc,
      valor: p.valor,
      vencimentoISO: p.venc,
      projeto: p.proj,
    });
  }

  return entries;
}

/* ── Daily aggregation ── */
interface DailyRow {
  date: string;       // ISO YYYY-MM-DD
  dateDisplay: string; // "23 Fev"
  weekday: string;     // "Seg"
  entradas: number;
  saidas: number;
  saldo: number;       // running balance
  items: CaixaEntry[];
}

interface WeekGroup {
  label: string;   // "Sem 1 · 23 Fev – 01 Mar"
  totalEntradas: number;
  totalSaidas: number;
  saldoFim: number;
  days: DailyRow[];
}

const WEEKDAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function fmtShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate().toString().padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]}`;
}

function weekdayPt(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return WEEKDAYS_PT[d.getDay()];
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildProjection(entries: CaixaEntry[]): { weeks: WeekGroup[]; totalEntradas30d: number; totalSaidas30d: number; saldoProjetado: number; diasNegativos: number } {
  const endISO = addDays(TODAY_ISO, 30);

  // Map by date
  const byDate: Record<string, CaixaEntry[]> = {};
  for (const e of entries) {
    if (e.vencimentoISO < TODAY_ISO || e.vencimentoISO > endISO) continue;
    if (!byDate[e.vencimentoISO]) byDate[e.vencimentoISO] = [];
    byDate[e.vencimentoISO].push(e);
  }

  // Build daily rows
  const days: DailyRow[] = [];
  let saldo = SALDO_INICIAL;
  let totalEntradas30d = 0;
  let totalSaidas30d = 0;
  let diasNegativos = 0;

  for (let i = 0; i <= 30; i++) {
    const dateISO = addDays(TODAY_ISO, i);
    const items = byDate[dateISO] || [];
    const entradas = items.filter(e => e.tipo === "entrada").reduce((s, e) => s + e.valor, 0);
    const saidas = items.filter(e => e.tipo === "saida").reduce((s, e) => s + e.valor, 0);
    saldo = saldo + entradas - saidas;
    totalEntradas30d += entradas;
    totalSaidas30d += saidas;
    if (saldo < 0) diasNegativos++;

    // Only include days with activity OR first/last day
    if (items.length > 0 || i === 0 || i === 30) {
      days.push({
        date: dateISO,
        dateDisplay: fmtShort(dateISO),
        weekday: weekdayPt(dateISO),
        entradas,
        saidas,
        saldo,
        items,
      });
    }
  }

  // Group into weeks (7-day blocks)
  const weeks: WeekGroup[] = [];
  let weekStart = 0;
  let weekIdx = 1;

  while (weekStart <= 30) {
    const wStartISO = addDays(TODAY_ISO, weekStart);
    const wEndISO = addDays(TODAY_ISO, Math.min(weekStart + 6, 30));
    const weekDays = days.filter(d => d.date >= wStartISO && d.date <= wEndISO);

    if (weekDays.length > 0) {
      const wEntradas = weekDays.reduce((s, d) => s + d.entradas, 0);
      const wSaidas = weekDays.reduce((s, d) => s + d.saidas, 0);
      weeks.push({
        label: `Sem ${weekIdx} · ${fmtShort(wStartISO)} – ${fmtShort(wEndISO)}`,
        totalEntradas: wEntradas,
        totalSaidas: wSaidas,
        saldoFim: weekDays[weekDays.length - 1].saldo,
        days: weekDays,
      });
    }

    weekStart += 7;
    weekIdx++;
  }

  return {
    weeks,
    totalEntradas30d,
    totalSaidas30d,
    saldoProjetado: saldo,
    diasNegativos,
  };
}

/* ── Period Selector ── */
function PeriodSelector({ month, year, onChangeMonth, onChangeYear }: { month: number; year: number; onChangeMonth: (m: number) => void; onChangeYear: (y: number) => void }) {
  const dk = useDk();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer"
        style={{ fontWeight: 500, border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
      >
        <CalendarDays className="w-3.5 h-3.5" style={{ color: dk.textSubtle }} />
        {MONTHS[month]} {year}
        <ChevronDown className={"w-3 h-3 transition-transform " + (open ? "rotate-180" : "")} style={{ color: dk.textSubtle }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="period-dd"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={springPopoverIn}
            className="absolute right-0 top-full mt-1.5 z-50 w-[280px] rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${dk.border}`, backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
          >
            <div className="flex items-center gap-1 p-2" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
              {[2024, 2025, 2026].map((y) => (
                <button
                  key={y}
                  onClick={() => onChangeYear(y)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
                  style={{ fontWeight: year === y ? 600 : 400, backgroundColor: year === y ? (dk.isDark ? "#F5F5F7" : "#1D1D1F") : "transparent", color: year === y ? (dk.isDark ? "#1D1D1F" : "#FFFFFF") : dk.textTertiary }}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 p-2">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => { onChangeMonth(i); setOpen(false); }}
                  className="py-2 rounded-lg text-[11px] transition-all cursor-pointer"
                  style={{ fontWeight: month === i ? 600 : 400, backgroundColor: month === i ? dk.bgMuted : "transparent", color: month === i ? (dk.isDark ? "#AEAEB2" : "#48484A") : dk.textTertiary }}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── StateSwitcher ── */
function StateSwitcher({ active, onChange }: { active: ViewState; onChange: (v: ViewState) => void }) {
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

/* ── Projection Modal (V1 simple) ── */
function ProjecaoModal({
  onClose,
  totalEntradas,
  totalSaidas,
  saldoProjetado,
  diasNegativos,
}: {
  onClose: () => void;
  totalEntradas: number;
  totalSaidas: number;
  saldoProjetado: number;
  diasNegativos: number;
}) {
  const dk = useDk();

  /* ESC close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowModal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
              Projeção de caixa — 30 dias
            </span>
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              23 Fev – 25 Mar 2026 · v1 mock
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: dk.textSubtle }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ backgroundColor: dk.successBg }}>
              <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>Entradas previstas</span>
              <span className="text-[18px] text-[#34C759] tabular-nums" style={{ fontWeight: 600 }}>{fmtCurrency(totalEntradas)}</span>
            </div>
            <div className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ backgroundColor: dk.dangerBg }}>
              <span className="text-[10px] text-[#FF3B30]" style={{ fontWeight: 500 }}>Saídas previstas</span>
              <span className="text-[18px] text-[#FF3B30] tabular-nums" style={{ fontWeight: 600 }}>{fmtCurrency(totalSaidas)}</span>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: dk.bgMuted }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>Saldo projetado (30d)</span>
              <span className={`text-[20px] tabular-nums ${saldoProjetado >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`} style={{ fontWeight: 600 }}>
                {fmtCurrency(saldoProjetado)}
              </span>
            </div>
            <TrendingUp className={`w-6 h-6 ${saldoProjetado >= SALDO_INICIAL ? "text-[#34C759]" : "text-[#FF3B30]"}`} style={{ opacity: 0.4 }} />
          </div>

          {diasNegativos > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: dk.dangerBg, border: `1px solid ${dk.dangerBorder}` }}>
              <ShieldAlert className="w-4 h-4 text-[#FF3B30] shrink-0" style={{ opacity: 0.5 }} />
              <span className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
                {diasNegativos} dia{diasNegativos !== 1 ? "s" : ""} com saldo negativo nos próximos 30 dias
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              Saldo inicial: {fmtCurrency(SALDO_INICIAL)} · Resultado: {fmtCurrency(totalEntradas - totalSaidas)} · Projeção baseada em lançamentos previstos
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${dk.hairline}` }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, color: dk.textTertiary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Fechar
          </button>
          <button
            className="px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500 }}
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-3 h-3" />
              Exportar projeção
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function CaixaContent() {
  const dk = useDk();
  const appStore = useAppStore();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(1); // Feb
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showProjecao, setShowProjecao] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0])); // first week expanded by default

  const toggleWeek = useCallback((idx: number) => {
    setExpandedWeeks(prev => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  }, []);

  const dismissAlert = useCallback((key: string) => {
    setAlertsDismissed(prev => new Set(prev).add(key));
  }, []);

  /* ── Data ── */
  const entries = useMemo(() => buildCaixaEntries(appStore.parcelas, appStore.projects), [appStore.parcelas, appStore.projects]);
  const projection = useMemo(() => buildProjection(entries), [entries]);

  const { weeks, totalEntradas30d, totalSaidas30d, saldoProjetado, diasNegativos } = projection;
  const realizadoMes = entries
    .filter(e => e.vencimentoISO <= TODAY_ISO && e.tipo === "entrada")
    .reduce((s, e) => s + e.valor, 0);

  /* ── QuickActions (P05 Header pattern) ── */
  const quickActions: QuickAction[] = [
    { label: "Nova receita", icon: <ArrowDownRight className="w-3 h-3" /> },
    { label: "Nova despesa", icon: <ArrowUpRight className="w-3.5 h-3.5 text-[#FF3B30]" /> },
    { label: "Conciliar", icon: <ArrowRightLeft className="w-3 h-3" /> },
    { label: "Exportar CSV", icon: <Download className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header Financeiro ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] tracking-tight" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
            Financeiro
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
              Fluxo de caixa
            </span>
            <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              Projeção 30 dias · {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            month={selectedMonth}
            year={selectedYear}
            onChangeMonth={setSelectedMonth}
            onChangeYear={setSelectedYear}
          />
          {/* CTA primário preto */}
          <button
            onClick={() => setShowProjecao(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Ver projeção
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
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ backgroundColor: dk.bgMuted }} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: dk.bgMuted }} />
            ))}
          </div>
          <div className="flex items-center justify-center py-6 gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textMuted }}>
              Carregando fluxo de caixa…
            </span>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {viewState === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.dangerBg }}>
            <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
              Erro ao carregar fluxo de caixa
            </span>
            <span className="text-[12px] text-center" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>
              Não foi possível gerar a projeção. Verifique seus lançamentos.
            </span>
          </div>
          <button
            onClick={() => setViewState("ready")}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
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
            <BarChart3 className="w-7 h-7" style={{ color: dk.textDisabled }} />
          </div>
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
              Sem dados para projeção
            </span>
            <span className="text-[12px] text-center" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>
              Nenhuma entrada ou saída registrada para gerar o fluxo de caixa. Adicione lançamentos nos projetos.
            </span>
          </div>
          <button
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar lançamentos
          </button>
        </div>
      )}

      {/* ═══ Ready ═══ */}
      {viewState === "ready" && (
        <>
          {/* KPIs (5 cards) */}
          <div className="grid grid-cols-5 gap-3">
            <KpiCard
              label="Saldo atual"
              value={fmtCurrency(SALDO_INICIAL)}
              icon={<CircleDollarSign className="w-3.5 h-3.5 text-[#C7C7CC]" />}
              sub="Conta principal"
            />
            <KpiCard
              label="Entradas previstas"
              value={fmtCurrency(totalEntradas30d)}
              icon={<ArrowDownRight className="w-3.5 h-3.5 text-[#34C759]" />}
              sub="próximos 30 dias"
            />
            <KpiCard
              label="Saídas previstas"
              value={fmtCurrency(totalSaidas30d)}
              icon={<ArrowUpRight className="w-3.5 h-3.5 text-[#FF3B30]" />}
              sub="próximos 30 dias"
            />
            <KpiCard
              label="Saldo projetado"
              value={fmtCurrency(saldoProjetado)}
              icon={<TrendingUp className={`w-3.5 h-3.5 ${saldoProjetado >= SALDO_INICIAL ? "text-[#34C759]" : "text-[#FF3B30]"}`} />}
              tooltip="Saldo atual + entradas previstas − saídas previstas nos próximos 30 dias."
              sub="fim do período"
            />
            <KpiCard
              label={diasNegativos > 0 ? "Buraco de caixa" : "Saúde do caixa"}
              value={diasNegativos > 0 ? `${diasNegativos}d` : "Saudável"}
              icon={<ShieldAlert className={`w-3.5 h-3.5 ${diasNegativos > 0 ? "text-[#FF3B30]" : "text-[#34C759]"}`} />}
              tooltip="Dias com saldo projetado negativo nos próximos 30 dias."
              sub={diasNegativos > 0 ? "dias com saldo negativo" : "nenhum dia negativo"}
            />
          </div>

          {/* P04: AlertBanners */}
          <AnimatePresence>
            {totalSaidas30d > totalEntradas30d && !alertsDismissed.has("deficit") && (
              <AlertBanner
                key="alert-deficit"
                variant="danger"
                title={`Déficit projetado de ${fmtCurrency(totalSaidas30d - totalEntradas30d)} nos próximos 30 dias`}
                desc="As saídas previstas superam as entradas. Revise cobranças pendentes ou adie despesas não essenciais."
                ctaLabel="Ver recebíveis"
                cta={() => dismissAlert("deficit")}
                dismissible
                onDismiss={() => dismissAlert("deficit")}
              />
            )}
            {diasNegativos > 0 && !alertsDismissed.has("negativo") && (
              <AlertBanner
                key="alert-negativo"
                variant="warning"
                title={`${diasNegativos} dia${diasNegativos !== 1 ? "s" : ""} com saldo negativo previsto`}
                desc="Antecipe recebimentos ou renegocie prazos de pagamento para evitar problemas de caixa."
                ctaLabel="Ver projeção"
                cta={() => { setShowProjecao(true); dismissAlert("negativo"); }}
                dismissible
                onDismiss={() => dismissAlert("negativo")}
              />
            )}
          </AnimatePresence>

          {/* ── Projeção semanal ── */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            {/* Table header */}
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: dk.bgSub }}>
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                Período
              </span>
              <span className="text-[10px] uppercase tracking-[0.06em] text-[#34C759] text-right" style={{ fontWeight: 600 }}>
                Entradas
              </span>
              <span className="text-[10px] uppercase tracking-[0.06em] text-[#FF3B30] text-right" style={{ fontWeight: 600 }}>
                Saídas
              </span>
              <span className="text-[10px] uppercase tracking-[0.06em] text-right" style={{ fontWeight: 600, color: dk.textSubtle }}>
                Saldo
              </span>
            </div>

            {/* Initial balance row */}
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: dk.bgSub }}>
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-3 h-3" style={{ color: dk.textDisabled }} />
                <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                  Saldo inicial — {fmtShort(TODAY_ISO)}
                </span>
              </div>
              <span className="text-[12px] text-right tabular-nums" style={{ fontWeight: 400, color: dk.textDisabled }}>—</span>
              <span className="text-[12px] text-right tabular-nums" style={{ fontWeight: 400, color: dk.textDisabled }}>—</span>
              <span className="text-[13px] text-right tabular-nums" style={{ fontWeight: 600, color: dk.textSecondary }}>
                {fmtCurrency(SALDO_INICIAL)}
              </span>
            </div>

            {/* Weekly groups */}
            {weeks.map((week, wIdx) => (
              <div key={week.label}>
                {/* Week summary row — clickable to expand */}
                <button
                  onClick={() => toggleWeek(wIdx)}
                  className="w-full grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-3 transition-colors cursor-pointer items-center"
                  style={{ borderBottom: `1px solid ${dk.hairline}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedWeeks.has(wIdx) ? "rotate-0" : "-rotate-90"}`} style={{ color: dk.textSubtle }} />
                    <span className="text-[12px]" style={{ fontWeight: 600, color: dk.textSecondary }}>
                      {week.label}
                    </span>
                    {week.totalEntradas > 0 && week.totalSaidas > 0 && (
                      <TagPill
                        variant={week.totalEntradas >= week.totalSaidas ? "success" : "danger"}
                        size="xs"
                      >
                        {week.totalEntradas >= week.totalSaidas ? "+" : ""}
                        {fmtCurrency(week.totalEntradas - week.totalSaidas)}
                      </TagPill>
                    )}
                  </div>
                  <span className="text-[12px] text-right text-[#34C759] tabular-nums" style={{ fontWeight: 500 }}>
                    {week.totalEntradas > 0 ? `+${fmtCurrency(week.totalEntradas)}` : "—"}
                  </span>
                  <span className="text-[12px] text-right text-[#FF3B30] tabular-nums" style={{ fontWeight: 500 }}>
                    {week.totalSaidas > 0 ? `-${fmtCurrency(week.totalSaidas)}` : "—"}
                  </span>
                  <span className={`text-[13px] text-right tabular-nums ${week.saldoFim >= 0 ? "" : "text-[#FF3B30]"}`} style={{ fontWeight: 600, color: week.saldoFim >= 0 ? dk.textSecondary : undefined }}>
                    {fmtCurrency(week.saldoFim)}
                  </span>
                </button>

                {/* Daily detail rows (expanded) */}
                <AnimatePresence>
                  {expandedWeeks.has(wIdx) && week.days.map((day) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={springContentIn}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-2 items-center" style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: dk.bg }}>
                        <div className="flex items-center gap-3 pl-5">
                          <span className="text-[11px] w-[28px]" style={{ fontWeight: 500, color: dk.textSubtle }}>
                            {day.weekday}
                          </span>
                          <span className="text-[12px] tabular-nums" style={{ fontWeight: 400, color: dk.textTertiary }}>
                            {day.dateDisplay}
                          </span>
                          {day.date === TODAY_ISO && (
                            <TagPill variant="info" size="xs">Hoje</TagPill>
                          )}
                          {day.items.length > 0 && (
                            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
                              {day.items.length} lançamento{day.items.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <span className={`text-[12px] text-right tabular-nums ${day.entradas > 0 ? "text-[#34C759]" : ""}`} style={{ fontWeight: day.entradas > 0 ? 500 : 400, color: day.entradas > 0 ? undefined : dk.border }}>
                          {day.entradas > 0 ? `+${fmtCurrency(day.entradas)}` : "—"}
                        </span>
                        <span className={`text-[12px] text-right tabular-nums ${day.saidas > 0 ? "text-[#FF3B30]" : ""}`} style={{ fontWeight: day.saidas > 0 ? 500 : 400, color: day.saidas > 0 ? undefined : dk.border }}>
                          {day.saidas > 0 ? `-${fmtCurrency(day.saidas)}` : "—"}
                        </span>
                        <span className={`text-[12px] text-right tabular-nums ${day.saldo >= 0 ? "" : "text-[#FF3B30]"}`} style={{ fontWeight: 500, color: day.saldo >= 0 ? dk.textTertiary : undefined }}>
                          {fmtCurrency(day.saldo)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}

            {/* Final projected balance */}
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-5 py-3" style={{ backgroundColor: dk.bgSub, borderTop: `1px solid ${dk.border}` }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3" style={{ color: dk.textSubtle }} />
                <span className="text-[12px]" style={{ fontWeight: 600, color: dk.textSecondary }}>
                  Saldo projetado — {fmtShort(addDays(TODAY_ISO, 30))}
                </span>
              </div>
              <span className="text-[12px] text-right text-[#34C759] tabular-nums" style={{ fontWeight: 600 }}>
                +{fmtCurrency(totalEntradas30d)}
              </span>
              <span className="text-[12px] text-right text-[#FF3B30] tabular-nums" style={{ fontWeight: 600 }}>
                -{fmtCurrency(totalSaidas30d)}
              </span>
              <span className={`text-[14px] text-right tabular-nums ${saldoProjetado >= 0 ? "" : "text-[#FF3B30]"}`} style={{ fontWeight: 700, color: saldoProjetado >= 0 ? (dk.isDark ? "#AEAEB2" : "#48484A") : undefined }}>
                {fmtCurrency(saldoProjetado)}
              </span>
            </div>
          </div>

          {/* Footer summary */}
          <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            <div className="flex items-center gap-4">
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                {weeks.length} semana{weeks.length !== 1 ? "s" : ""} · {weeks.reduce((s, w) => s + w.days.length, 0)} dias com movimentação
              </span>
              <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
              <span className="text-[12px] tabular-nums" style={{ fontWeight: 500, color: dk.textMuted }}>
                Resultado: <span className={totalEntradas30d - totalSaidas30d >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}>
                  {totalEntradas30d - totalSaidas30d >= 0 ? "+" : ""}{fmtCurrency(totalEntradas30d - totalSaidas30d)}
                </span>
              </span>
            </div>
            <span className="text-[11px] tabular-nums" style={{ fontWeight: 400, color: dk.textDisabled }}>
              Atualizado agora
            </span>
          </div>
        </>
      )}

      {/* ── Projeção Modal ── */}
      <AnimatePresence>
        {showProjecao && (
          <ProjecaoModal
            key="projecao-modal"
            onClose={() => setShowProjecao(false)}
            totalEntradas={totalEntradas30d}
            totalSaidas={totalSaidas30d}
            saldoProjetado={saldoProjetado}
            diasNegativos={diasNegativos}
          />
        )}
      </AnimatePresence>
    </div>
  );
}