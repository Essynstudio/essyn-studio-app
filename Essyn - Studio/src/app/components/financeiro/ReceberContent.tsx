import { useState, useCallback, useMemo } from "react";
import {
  ArrowDownRight,
  ArrowRightLeft,
  Check,
  CircleCheck,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  X,
  Download,
  Filter,
  CalendarClock,
  Plus,
  Eye,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KpiCard } from "../ui/kpi-card";
import { FilterChip } from "../ui/filter-chip";
import { StatusBadge, type StatusParcela } from "../ui/status-badge";
import { TagPill, type TagVariant } from "../ui/tag-pill";
import { TypeBadge } from "../ui/type-badge";
import { fmtCurrency } from "../ui/action-row-item";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import { RowSelectCheckbox, type CheckboxState } from "../ui/row-select-checkbox";
import { AlertBanner } from "../ui/alert-banner";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import { useDk } from "../../lib/useDarkColors";
import { getAllSyncedParcelas } from "../projetos/paymentPlanSync";
import { useAppStore, type AppParcela, type AppProject } from "../../lib/appStore";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════ */
/*  Contas a Receber — Full receivables list           */
/*  Pattern P02: Lista Operacional com multi-select    */
/*  Ref: Xero Invoices + Omie Contas a Receber         */
/* ═══════════════════════════════════════════════════ */

type StatusFilter = "all" | "vencida" | "vence_hoje" | "prox_7d" | "paga" | "nf_pendente";

const TODAY_ISO = "2026-02-23";
const NEXT_7D_ISO = "2026-03-02";

interface Parcela {
  id: string;
  projectId: string;
  projeto: string;
  cliente: string;
  parcela: string;
  valor: number;
  vencimento: string;
  vencimentoISO: string;
  status: StatusParcela;
  metodo: string;
  nf: "emitida" | "pendente" | "enviado_contador" | "na";
  comprovante: "sim" | "nao";
  diasAtraso?: number;
}

/* ── Helpers ── */

function isProx7d(p: Parcela): boolean {
  return (
    p.vencimentoISO > TODAY_ISO &&
    p.vencimentoISO <= NEXT_7D_ISO &&
    p.status !== "paga" &&
    p.status !== "conciliada" &&
    p.status !== "cancelada"
  );
}

function ctaLabel(status: StatusParcela): string {
  switch (status) {
    case "vencida":
    case "vence_hoje":
      return "Cobrar";
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
      return <Send className="w-3 h-3" />;
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

/* ── Build synced parcelas from project payment plans ── */
function buildSyncedParcelas(): Parcela[] {
  const synced = getAllSyncedParcelas();
  return synced
    .filter((p) => p.status !== "cancelada")
    .map((p) => {
      const atraso =
        p.status === "vencida"
          ? Math.round(
              (new Date("2026-02-23T12:00:00").getTime() -
                new Date(p.vencimento + "T12:00:00").getTime()) /
                86400000,
            )
          : undefined;
      return {
        id: p.id,
        projectId: p.projectId,
        projeto: p.projetoNome,
        cliente: p.clienteNome,
        parcela:
          p.tipo === "entrada" ? "Entrada" : `${p.numero}/${p.totalParcelas}`,
        valor: p.valor,
        vencimento: p.vencimentoDisplay,
        vencimentoISO: p.vencimento,
        status: p.status,
        metodo: p.formaPagamento.toUpperCase(),
        nf: p.nfStatus === "na" ? "na" : p.nfStatus === "enviado_contador" ? "enviado_contador" : p.nfStatus === "emitida" ? "emitida" : "pendente",
        comprovante: p.comprovante === "sim" ? "sim" : "nao",
        diasAtraso: atraso && atraso > 0 ? atraso : undefined,
      };
    });
}

/* ── Convert AppStore parcelas to Parcela display format ── */
const MONTHS_SHORT_FIN = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function fmtVencimento(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate().toString().padStart(2, "0")} ${MONTHS_SHORT_FIN[d.getMonth()]}`;
}

function mapAppStoreParcela(p: AppParcela, projects: AppProject[]): Parcela {
  const proj = projects.find((pr) => pr.id === p.projetoId);
  const statusMap: Record<string, StatusParcela> = {
    pendente: p.vencimento === TODAY_ISO ? "vence_hoje" : p.vencimento < TODAY_ISO ? "vencida" : "prevista",
    pago: "paga",
    atrasado: "vencida",
    cancelado: "cancelada",
  };
  const st = statusMap[p.status] || "prevista";
  const atraso = st === "vencida"
    ? Math.round((new Date(TODAY_ISO + "T12:00:00").getTime() - new Date(p.vencimento + "T12:00:00").getTime()) / 86400000)
    : undefined;
  return {
    id: p.id,
    projectId: p.projetoId,
    projeto: proj?.nome || "Projeto",
    cliente: proj?.cliente || "Cliente",
    parcela: p.descricao.includes("Sinal") ? "Sinal" : p.descricao.includes("Final") ? "Final" : p.descricao.split("—")[0].trim(),
    valor: p.valor,
    vencimento: fmtVencimento(p.vencimento),
    vencimentoISO: p.vencimento,
    status: st,
    metodo: "PIX",
    nf: p.status === "pago" ? "emitida" : "pendente",
    comprovante: p.paidAt ? "sim" : "nao",
    diasAtraso: atraso && atraso > 0 ? atraso : undefined,
  };
}

/* ── Merge synced + AppStore parcelas (avoid duplicates by id) ── */
function buildMergedParcelas(storeParcelas: AppParcela[], storeProjects: AppProject[]): Parcela[] {
  const synced = buildSyncedParcelas();
  const syncedIds = new Set(synced.map((p) => p.id));
  const fromStore = storeParcelas
    .filter((p) => p.status !== "cancelado" && !syncedIds.has(p.id))
    .map((p) => mapAppStoreParcela(p, storeProjects));
  return [...synced, ...fromStore];
}

/* ── Filter chip definitions ── */
const statusFilters: {
  key: StatusFilter;
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
    chipText: "text-[#FF3B30]",
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
    label: "Recebidas",
    dot: "bg-[#34C759]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#34C759]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "nf_pendente",
    label: "NF pendente",
    dot: "bg-[#FF9500]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#E5E5EA]",
  },
];

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function ReceberContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projectId: string) => void;
}) {
  const dk = useDk();
  const appStore = useAppStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());

  /* ── Merged parcelas: synced project plans + AppStore parcelas ── */
  const allParcelas = useMemo(
    () => buildMergedParcelas(appStore.parcelas, appStore.projects),
    [appStore.parcelas, appStore.projects],
  );

  /* ── Derived data ── */
  const filtered = allParcelas.filter((p) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "vencida") return p.status === "vencida";
    if (statusFilter === "vence_hoje") return p.status === "vence_hoje";
    if (statusFilter === "prox_7d") return isProx7d(p);
    if (statusFilter === "paga")
      return p.status === "paga" || p.status === "conciliada";
    if (statusFilter === "nf_pendente")
      return p.nf === "pendente" || p.nf === "enviado_contador";
    return true;
  });

  const searched = search
    ? filtered.filter(
        (p) =>
          p.projeto.toLowerCase().includes(search.toLowerCase()) ||
          p.cliente.toLowerCase().includes(search.toLowerCase()),
      )
    : filtered;

  const vencidas = allParcelas.filter((p) => p.status === "vencida");
  const venceHoje = allParcelas.filter((p) => p.status === "vence_hoje");
  const prox7d = allParcelas.filter(isProx7d);
  const pagas = allParcelas.filter(
    (p) => p.status === "paga" || p.status === "conciliada",
  );
  const nfPendente = allParcelas.filter(
    (p) => p.nf === "pendente" || p.nf === "enviado_contador",
  );

  const totalPendente = allParcelas
    .filter(
      (p) =>
        p.status !== "paga" &&
        p.status !== "conciliada" &&
        p.status !== "cancelada",
    )
    .reduce((s, p) => s + p.valor, 0);

  const totalRecebidoMes = pagas.reduce((s, p) => s + p.valor, 0);
  const totalVencido = vencidas.reduce((s, p) => s + p.valor, 0);
  const totalSelecionado = searched
    .filter((p) => selectedIds.has(p.id))
    .reduce((s, p) => s + p.valor, 0);

  /* ── Alerts ── */
  const alerts: Array<{
    id: string;
    variant: "warning" | "danger" | "info";
    title: string;
    desc: string;
  }> = [];

  if (vencidas.length > 0 && !alertsDismissed.has("vencidas")) {
    alerts.push({
      id: "vencidas",
      variant: "danger",
      title: `${vencidas.length} parcela${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}`,
      desc: `Total de ${fmtCurrency(totalVencido)} em atraso`,
    });
  }

  if (venceHoje.length > 0 && !alertsDismissed.has("vence_hoje")) {
    alerts.push({
      id: "vence_hoje",
      variant: "warning",
      title: `${venceHoje.length} parcela${venceHoje.length > 1 ? "s" : ""} vence${venceHoje.length > 1 ? "m" : ""} hoje`,
      desc: "Enviar lembrete aos clientes",
    });
  }

  if (nfPendente.length > 3 && !alertsDismissed.has("nf_pendente")) {
    alerts.push({
      id: "nf_pendente",
      variant: "info",
      title: `${nfPendente.length} NFs pendentes`,
      desc: "Emitir notas fiscais antes do vencimento",
    });
  }

  /* ── Multi-select ── */
  const allIds = searched.map((p) => p.id);
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const headerCheckboxState: CheckboxState =
    selectedIds.size === 0
      ? "unchecked"
      : selectedIds.size === allIds.length
        ? "checked"
        : "indeterminate";

  /* ── Bulk actions ── */
  const handleBulkRegistrar = useCallback(() => {
    selectedIds.forEach((id) => {
      const par = allParcelas.find((p) => p.id === id);
      if (par && par.status !== "paga" && par.status !== "conciliada") {
        appStore.markParcelaPaid(id);
      }
    });
    toast.success(`${selectedIds.size} parcela(s) registrada(s) como recebidas`);
    deselectAll();
  }, [selectedIds, allParcelas, appStore, deselectAll]);

  const bulkActions: BulkAction[] = [
    { label: "Registrar recebimento", icon: <Check className="w-3.5 h-3.5" />, onClick: handleBulkRegistrar },
    { label: "Enviar cobrança", icon: <Send className="w-3.5 h-3.5" />, onClick: () => { toast.success(`Cobrança enviada para ${selectedIds.size} parcela(s)`); deselectAll(); } },
    { label: "Emitir NF", icon: <Download className="w-3.5 h-3.5" />, onClick: () => { toast("Emitir NF", { description: "Funcionalidade em desenvolvimento" }); } },
    { label: "Conciliar", icon: <CircleCheck className="w-3.5 h-3.5" />, onClick: () => { toast("Conciliar", { description: "Funcionalidade em desenvolvimento" }); } },
  ];

  /* ── Quick actions ── */
  const quickActions: QuickAction[] = [
    {
      id: "nova_receita",
      label: "Nova receita",
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: "primary",
    },
    {
      id: "importar",
      label: "Importar",
      icon: <Download className="w-3.5 h-3.5" />,
      variant: "secondary",
    },
    {
      id: "exportar",
      label: "Exportar",
      icon: <Download className="w-3.5 h-3.5" />,
      variant: "secondary",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
              Contas a Receber
            </h1>
            <p className="text-[13px]" style={{ fontWeight: 400, color: dk.textSecondary }}>
              Gerencie receitas, cobranças e conciliações
            </p>
          </div>
        </div>
      </div>

      {/* QuickActionsBar */}
      <QuickActionsBar actions={quickActions} onAction={() => {}} />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="A receber"
          value={fmtCurrency(totalPendente)}
          trend={null}
          icon={<ArrowDownRight className="w-4 h-4" />}
          iconBg="bg-[#FEF3C7]"
          iconColor="text-[#007AFF]"
        />
        <KpiCard
          label="Recebido (mês)"
          value={fmtCurrency(totalRecebidoMes)}
          trend={{ value: "+12%", up: true }}
          icon={<CircleCheck className="w-4 h-4" />}
          iconBg="bg-[#D1FAE5]"
          iconColor="text-[#34C759]"
        />
        <KpiCard
          label="Vencido"
          value={fmtCurrency(totalVencido)}
          trend={null}
          icon={<AlertCircle className="w-4 h-4" />}
          iconBg="bg-[#FBF5F4]"
          iconColor="text-[#FF3B30]"
        />
        <KpiCard
          label="Próx 7 dias"
          value={fmtCurrency(prox7d.reduce((s, p) => s + p.valor, 0))}
          trend={null}
          icon={<CalendarClock className="w-4 h-4" />}
          iconBg="bg-[#F4F7FB]"
          iconColor="text-[#007AFF]"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              variant={alert.variant}
              title={alert.title}
              desc={alert.desc}
              dismissible
              onDismiss={() =>
                setAlertsDismissed((prev) => new Set(prev).add(alert.id))
              }
            />
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <FilterChip
            label="Todos"
            count={allParcelas.length}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            variant="neutral"
          />
          {statusFilters.map((f) => {
            const count =
              f.key === "vencida"
                ? vencidas.length
                : f.key === "vence_hoje"
                  ? venceHoje.length
                  : f.key === "prox_7d"
                    ? prox7d.length
                    : f.key === "paga"
                      ? pagas.length
                      : nfPendente.length;
            return (
              <FilterChip
                key={f.key}
                label={f.label}
                count={count}
                active={statusFilter === f.key}
                onClick={() => setStatusFilter(f.key)}
                variant={f.key as any}
              />
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: dk.textMuted }} />
          <input
            type="text"
            placeholder="Buscar por projeto ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-[12px] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF] w-[280px]"
            style={{ fontWeight: 400, color: dk.textPrimary, backgroundColor: dk.bg, border: `1px solid ${dk.border}` }}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionsBar
            count={selectedIds.size}
            actions={bulkActions}
            onClear={deselectAll}
          />
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }}>
        {/* Header */}
        <div className="grid grid-cols-[40px_1.5fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr_0.6fr_0.6fr_100px] gap-3 px-4 py-2.5" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center justify-center">
            <RowSelectCheckbox
              state={headerCheckboxState}
              onChange={() => {
                if (headerCheckboxState === "checked") deselectAll();
                else selectAll();
              }}
            />
          </div>
          {["Projeto","Cliente","Parcela"].map(h => (
            <div key={h} className="text-[11px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{h}</div>
          ))}
          <div className="text-[11px] text-right" style={{ fontWeight: 500, color: dk.textSecondary }}>Valor</div>
          {["Vencimento","Status","Método","NF"].map(h => (
            <div key={h} className="text-[11px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{h}</div>
          ))}
          <div className="text-[11px] text-center" style={{ fontWeight: 500, color: dk.textSecondary }}>Ação</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {searched.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Search className="w-8 h-8" style={{ color: dk.textMuted }} />
              <p className="text-[13px]" style={{ fontWeight: 400, color: dk.textSecondary }}>
                Nenhuma parcela encontrada
              </p>
            </div>
          )}
          {searched.map((p, idx) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-[40px_1.5fr_1fr_0.7fr_0.8fr_0.8fr_0.6fr_0.6fr_0.6fr_100px] gap-3 px-4 py-3 transition-colors"
                style={{
                  borderTop: idx > 0 ? `1px solid ${dk.border}` : "none",
                  backgroundColor: isSelected ? (dk.isDark ? "#2C2410" : "#FEF3C7") : "transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = dk.bgHover; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <div className="flex items-center justify-center">
                  <RowSelectCheckbox
                    state={isSelected ? "checked" : "unchecked"}
                    onChange={() => toggleRow(p.id)}
                  />
                </div>
                <div
                  className="text-[12px] truncate cursor-pointer hover:text-[#007AFF]"
                  style={{ fontWeight: 500, color: dk.textPrimary }}
                  onClick={() => onNavigateToProject?.(p.projectId)}
                >
                  {p.projeto}
                </div>
                <div className="text-[12px] truncate" style={{ fontWeight: 400, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
                  {p.cliente}
                </div>
                <div className="text-[12px]" style={{ fontWeight: 400, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
                  {p.parcela}
                </div>
                <div
                  className="text-[12px] text-right tabular-nums"
                  style={{ fontWeight: 500, color: dk.textPrimary }}
                >
                  {fmtCurrency(p.valor)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px]" style={{ fontWeight: 400, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
                    {p.vencimento}
                  </span>
                  {p.diasAtraso && (
                    <span className="text-[10px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
                      {p.diasAtraso}d de atraso
                    </span>
                  )}
                </div>
                <div>
                  <StatusBadge status={p.status} />
                </div>
                <div>
                  <TagPill label={p.metodo} variant={metodoVariant(p.metodo)} />
                </div>
                <div className="flex items-center gap-1">
                  {p.nf === "emitida" && (
                    <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>
                      ✓
                    </span>
                  )}
                  {p.nf === "pendente" && (
                    <span className="text-[10px] text-[#FF9500]" style={{ fontWeight: 500 }}>
                      Pendente
                    </span>
                  )}
                  {p.nf === "enviado_contador" && (
                    <span className="text-[10px] text-[#007AFF]" style={{ fontWeight: 500 }}>
                      Enviado
                    </span>
                  )}
                  {p.nf === "na" && (
                    <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      N/A
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <button
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer active:scale-[0.97]"
                    style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}
                    onClick={() => {
                      if (p.status === "vencida" || p.status === "vence_hoje") {
                        toast("Cobrança enviada", { description: `${p.cliente} — ${fmtCurrency(p.valor)}` });
                      } else if (p.status === "prevista") {
                        toast("Lembrete enviado", { description: `${p.cliente} — vence ${p.vencimento}` });
                      } else if (p.status === "paga" || p.status === "conciliada") {
                        onNavigateToProject?.(p.projectId);
                      }
                    }}
                  >
                    {ctaIcon(p.status)}
                    {ctaLabel(p.status)}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: dk.bgSub, border: `1px solid ${dk.border}` }}>
        <div className="flex items-center gap-2 text-[12px]" style={{ fontWeight: 400, color: dk.textSecondary }}>
          <span>{searched.length} parcelas</span>
          {selectedIds.size > 0 && (
            <>
              <span className="w-px h-3" style={{ backgroundColor: dk.isDark ? "#636366" : "#D1D1D6" }} />
              <span className="text-[12px] tabular-nums" style={{ fontWeight: 500, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
                {fmtCurrency(totalSelecionado)} selecionado
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] tabular-nums" style={{ fontWeight: 400, color: dk.textMuted }}>
          Atualizado agora
        </span>
      </div>
    </div>
  );
}