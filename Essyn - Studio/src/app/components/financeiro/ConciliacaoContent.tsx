import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRightLeft,
  Check,
  CircleCheck,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Link2Off,
  X,
  Download,
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Eye,
  EyeOff,
  Filter,
  ChevronDown,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn, springContentIn, springDefault } from "../../lib/motion-tokens";
import { toast } from "sonner";
import { KpiCard } from "../ui/kpi-card";
import { FilterChip } from "../ui/filter-chip";
import { TagPill, type TagVariant } from "../ui/tag-pill";
import { AlertBanner } from "../ui/alert-banner";
import { useDk } from "../../lib/useDarkColors";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import { RowSelectCheckbox, type CheckboxState } from "../ui/row-select-checkbox";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import {
  loadConciliacaoState,
  generateMockImport,
  applyMatch,
  ignoreTxn,
  unignoreTxn,
  unmatchTxn,
  bulkApproveMatches,
  bulkIgnore,
  getTxnStatus,
  fmtCentsToBRL,
  type BankTxn,
  type TxnStatus,
  type ConciliacaoState,
} from "./conciliacaoStore";
import { getAllSyncedParcelas } from "../projetos/paymentPlanSync";

/* ═══════════════════════════════════════════════════ */
/*  Conciliação Bancária — Bank reconciliation (v1)    */
/*  Feed de transações + suggestMatch + approve/ignore */
/*  Ref: Xero Reconciliation + Zoho Books              */
/*  Uses ONLY 02_Components primitives                  */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type StatusFilter = "all" | "sugerida" | "pendente" | "conciliada" | "ignorada";

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
    key: "sugerida",
    label: "Sugestões",
    dot: "bg-[#007AFF]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#007AFF]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "pendente",
    label: "Sem match",
    dot: "bg-[#FF9500]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "conciliada",
    label: "Conciliadas",
    dot: "bg-[#34C759]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#34C759]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "ignorada",
    label: "Ignoradas",
    dot: "bg-[#C7C7CC]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#8E8E93]",
    chipBorder: "border-[#E5E5EA]",
  },
];

/* ── Helper: method pill variant ── */
function methodVariant(method?: string): TagVariant {
  switch (method) {
    case "PIX":
      return "success";
    case "Boleto":
      return "info";
    case "Cartão":
      return "purple";
    case "TED":
    case "DOC":
      return "info";
    default:
      return "neutral";
  }
}

/* ── Helper: confidence label ── */
function confidenceLabel(c?: string): string {
  switch (c) {
    case "alta":
      return "Alta";
    case "media":
      return "Média";
    case "baixa":
      return "Baixa";
    default:
      return "";
  }
}

function confidenceVariant(c?: string): TagVariant {
  switch (c) {
    case "alta":
      return "success";
    case "media":
      return "info";
    case "baixa":
      return "warning";
    default:
      return "neutral";
  }
}

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
/*  Modal "Importar extrato"                           */
/* ═══════════════════════════════════════════════════ */

function ImportarExtratoModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (account: string) => void;
}) {
  const [account, setAccount] = useState("Banco do Brasil — CC 12345-6");
  const [fileLabel, setFileLabel] = useState("");
  const [dragging, setDragging] = useState(false);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1D1D1F]"
        style={{ opacity: 0.4 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[480px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
          <span
            className="text-[15px] text-[#3C3C43]"
            style={{ fontWeight: 600 }}
          >
            Importar extrato
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Account selector */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              Conta bancária
            </label>
            <div className="relative">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#48484A] appearance-none focus:outline-none focus:border-[#D1D1D6] focus:ring-1 focus:ring-[#E5E5EA] transition-all cursor-pointer"
                style={{ fontWeight: 400 }}
              >
                <option>Banco do Brasil — CC 12345-6</option>
                <option>Nubank — CC 98765-4</option>
                <option>Inter — CC 55555-0</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#D1D1D6] pointer-events-none" />
            </div>
          </div>

          {/* File upload area (mock) */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              Arquivo OFX / CSV
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                setFileLabel("extrato_fev_2026.ofx");
              }}
              className={`relative flex flex-col items-center justify-center h-[120px] rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragging
                  ? "border-[#E5E5EA] bg-[#FAFAFA]"
                  : fileLabel
                    ? "border-[#E5E5EA] bg-[#FAFAFA]"
                    : "border-[#E5E5EA] hover:border-[#D1D1D6] bg-[#FAFAFA]"
              }`}
              onClick={() => setFileLabel("extrato_fev_2026.ofx")}
            >
              {fileLabel ? (
                <>
                  <Check className="w-5 h-5 text-[#34C759] mb-1" />
                  <span
                    className="text-[12px] text-[#636366]"
                    style={{ fontWeight: 500 }}
                  >
                    {fileLabel}
                  </span>
                  <span
                    className="text-[10px] text-[#D1D1D6] mt-0.5"
                    style={{ fontWeight: 400 }}
                  >
                    12 KB · Pronto para importar
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#D1D1D6] mb-1" />
                  <span
                    className="text-[12px] text-[#AEAEB2]"
                    style={{ fontWeight: 500 }}
                  >
                    Clique ou arraste o arquivo aqui
                  </span>
                  <span
                    className="text-[10px] text-[#D1D1D6] mt-0.5"
                    style={{ fontWeight: 400 }}
                  >
                    Formatos: OFX, CSV · Máx. 5 MB
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-3 p-3 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA]">
            <Sparkles className="w-4 h-4 text-[#007AFF] shrink-0" />
            <span
              className="text-[11px] text-[#007AFF]"
              style={{ fontWeight: 400, lineHeight: 1.5 }}
            >
              O ESSYN irá detectar métodos de pagamento (PIX, TED, Boleto) e
              sugerir matches automaticamente com suas parcelas.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onImport(account)}
            disabled={!fileLabel}
            className={`px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97] ${
              fileLabel
                ? "bg-[#1D1D1F] text-white hover:bg-[#3C3C43]"
                : "bg-[#E5E5EA] text-[#C7C7CC] cursor-not-allowed"
            }`}
            style={{ fontWeight: 500 }}
          >
            <span className="flex items-center gap-1.5">
              <Upload className="w-3 h-3" />
              Importar
            </span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Modal "Editar match"                               */
/* ═══════════════════════════════════════════════════ */

function EditarMatchModal({
  txn,
  onClose,
  onSave,
}: {
  txn: BankTxn;
  onClose: () => void;
  onSave: (entryId: string) => void;
}) {
  const parcelas = useMemo(() => getAllSyncedParcelas(), []);
  const receivables = parcelas.filter(
    (p) =>
      p.status !== "cancelada" &&
      (txn.direction === "in"
        ? true
        : false), // only show receivables for incoming txns
  );
  const [selectedId, setSelectedId] = useState(
    txn.suggestedEntryId || txn.matchedEntryId || "",
  );

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1D1D1F]"
        style={{ opacity: 0.4 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[520px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[15px] text-[#48484A]"
              style={{ fontWeight: 600 }}
            >
              Editar match
            </span>
            <span
              className="text-[11px] text-[#C7C7CC]"
              style={{ fontWeight: 400 }}
            >
              {txn.description} · {fmtCentsToBRL(txn.amountCents)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              Selecionar lançamento
            </label>
            <div className="max-h-[240px] overflow-y-auto rounded-xl border border-[#E5E5EA] divide-y divide-[#F2F2F7]">
              {receivables.length > 0 ? (
                receivables.map((p) => {
                  const label =
                    p.tipo === "entrada"
                      ? `Entrada — ${p.projetoNome}`
                      : `Parcela ${p.numero}/${p.totalParcelas} — ${p.projetoNome}`;
                  const isSelected = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#F5F5F7]"
                          : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-[#1D1D1F] bg-[#1D1D1F]"
                            : "border-[#D1D1D6]"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[12px] text-[#636366] truncate block"
                          style={{ fontWeight: 500 }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-[10px] text-[#C7C7CC]"
                          style={{ fontWeight: 400 }}
                        >
                          {p.clienteNome} · {p.vencimentoDisplay}
                        </span>
                      </div>
                      <span
                        className="text-[12px] text-[#8E8E93] tabular-nums shrink-0"
                        style={{ fontWeight: 600 }}
                      >
                        R${" "}
                        {p.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <span
                    className="text-[12px] text-[#C7C7CC]"
                    style={{ fontWeight: 400 }}
                  >
                    Nenhum lançamento disponível
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (selectedId) onSave(selectedId);
            }}
            disabled={!selectedId}
            className={`px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97] ${
              selectedId
                ? "bg-[#1D1D1F] text-white hover:bg-[#3C3C43]"
                : "bg-[#E5E5EA] text-[#C7C7CC] cursor-not-allowed"
            }`}
            style={{ fontWeight: 500 }}
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              Salvar
            </span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function ConciliacaoContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projectId: string) => void;
}) {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(
    new Set(),
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [editMatchTxn, setEditMatchTxn] = useState<BankTxn | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /* ── Data ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const state: ConciliacaoState = useMemo(() => loadConciliacaoState(), [refreshKey]);
  const txns = state.transactions;
  const hasData = txns.length > 0;

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return txns.filter((txn) => {
      const status = getTxnStatus(txn);
      if (filter !== "all" && status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          txn.description.toLowerCase().includes(q) ||
          (txn.account || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [txns, filter, search]);

  /* ── Counts ── */
  const counts: Record<StatusFilter, number> = useMemo(
    () => ({
      all: txns.length,
      sugerida: txns.filter((t) => getTxnStatus(t) === "sugerida").length,
      pendente: txns.filter((t) => getTxnStatus(t) === "pendente").length,
      conciliada: txns.filter((t) => getTxnStatus(t) === "conciliada").length,
      ignorada: txns.filter((t) => getTxnStatus(t) === "ignorada").length,
    }),
    [txns],
  );

  /* ── KPIs ── */
  const totalConciliado = txns
    .filter((t) => t.matched)
    .reduce((s, t) => s + Math.abs(t.amountCents), 0);
  const pendentesValor = txns
    .filter((t) => !t.matched && !t.ignored)
    .reduce((s, t) => s + Math.abs(t.amountCents), 0);
  const taxaConciliacao =
    txns.length > 0
      ? Math.round(
          (txns.filter((t) => t.matched).length / txns.length) * 100,
        )
      : 0;

  /* ── Selection ── */
  const filteredIds = filtered.map((t) => t.id);
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

  const dismissAlert = useCallback((key: string) => {
    setAlertsDismissed((prev) => new Set(prev).add(key));
  }, []);

  /* ── Actions ── */
  const handleImport = useCallback(
    (account: string) => {
      generateMockImport(account);
      setShowImportModal(false);
      toast.success("Extrato importado com sucesso");
      refresh();
    },
    [refresh],
  );

  const handleApproveMatch = useCallback(
    (txnId: string, entryId: string) => {
      applyMatch(txnId, entryId);
      toast.success("Match aprovado");
      refresh();
    },
    [refresh],
  );

  const handleIgnore = useCallback(
    (txnId: string) => {
      ignoreTxn(txnId);
      toast("Transação ignorada", { description: "Você pode restaurá-la a qualquer momento." });
      refresh();
    },
    [refresh],
  );

  const handleUnignore = useCallback(
    (txnId: string) => {
      unignoreTxn(txnId);
      toast("Transação restaurada");
      refresh();
    },
    [refresh],
  );

  const handleUnmatch = useCallback(
    (txnId: string) => {
      unmatchTxn(txnId);
      toast("Match removido");
      refresh();
    },
    [refresh],
  );

  const handleEditMatch = useCallback(
    (txnId: string, entryId: string) => {
      applyMatch(txnId, entryId);
      setEditMatchTxn(null);
      toast.success("Match atualizado");
      refresh();
    },
    [refresh],
  );

  const handleBulkApprove = useCallback(() => {
    bulkApproveMatches([...selectedIds]);
    toast.success(
      `${selectedIds.size} match${selectedIds.size > 1 ? "es" : ""} aprovado${selectedIds.size > 1 ? "s" : ""}`,
    );
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  const handleBulkIgnore = useCallback(() => {
    bulkIgnore([...selectedIds]);
    toast(
      `${selectedIds.size} transaç${selectedIds.size > 1 ? "ões" : "ão"} ignorada${selectedIds.size > 1 ? "s" : ""}`,
    );
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  /* ── QuickActionsBar ── */
  const quickActions: QuickAction[] = [
    { label: "Importar extrato", icon: <Upload className="w-3 h-3" /> },
    { label: "Criar lançamento", icon: <Plus className="w-3 h-3" /> },
    {
      label: "Conciliar automático",
      icon: <ArrowRightLeft className="w-3 h-3" />,
    },
    {
      label: "Regras de conciliação",
      icon: <Sparkles className="w-3 h-3" />,
    },
    { label: "Exportar", icon: <Download className="w-3 h-3" /> },
  ];

  /* ── BulkActionsBar ── */
  const bulkActions: BulkAction[] = [
    {
      label: "Aprovar matches",
      icon: <Check className="w-3 h-3" />,
      onClick: handleBulkApprove,
    },
    {
      label: "Ignorar",
      icon: <EyeOff className="w-3 h-3" />,
      onClick: handleBulkIgnore,
    },
    {
      label: "Exportar",
      icon: <Download className="w-3 h-3" />,
      onClick: clearSelection,
    },
  ];

  /* ── Empty state check (no data at all → show import prompt) ── */
  const showEmptyImport = !hasData && viewState === "ready";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1
            className="text-[28px] tracking-[-0.025em]"
            style={{ fontWeight: 700, color: dk.isDark ? "#F5F5F7" : "#1D1D1F" }}
          >
            Financeiro
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px]"
              style={{ fontWeight: 500, color: dk.textTertiary }}
            >
              Conciliação
            </span>
            <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
            <span
              className="text-[12px]"
              style={{ fontWeight: 400, color: dk.textMuted }}
            >
              {hasData
                ? `${txns.length} transações · Fevereiro 2026`
                : "Compare extrato × lançamentos ESSYN"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dk.textDisabled }} />
            <input
              type="text"
              placeholder="Buscar transação…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] pr-8 py-1.5 rounded-xl text-[12px] focus:outline-none transition-all"
              style={{ fontWeight: 400, paddingLeft: "2rem", border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: dk.textDisabled }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
          >
            <Upload className="w-3.5 h-3.5" />
            Importar extrato
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.border }} />
          <StateSwitcher active={viewState} onChange={setViewState} />
        </div>
      </div>

      {/* QuickActionsBar */}
      <QuickActionsBar
        actions={quickActions}
        onAction={(label) => {
          if (label === "Importar extrato") setShowImportModal(true);
          if (label === "Conciliar automático" && counts.sugerida > 0) {
            const suggested = txns
              .filter(
                (t) => t.suggestedEntryId && !t.matched && !t.ignored,
              )
              .map((t) => t.id);
            bulkApproveMatches(suggested);
            toast.success(
              `${suggested.length} match${suggested.length > 1 ? "es" : ""} aprovado${suggested.length > 1 ? "s" : ""} automaticamente`,
            );
            refresh();
          }
        }}
      />

      {/* ── Loading ── */}
      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl animate-pulse"
                style={{ backgroundColor: dk.bgMuted }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-xl animate-pulse"
                style={{ backgroundColor: dk.bgMuted }}
              />
            ))}
          </div>
          <div className="flex items-center justify-center py-4 gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} />
            <span
              className="text-[12px]"
              style={{ fontWeight: 400, color: dk.textSubtle }}
            >
              Carregando extrato…
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
            Erro ao carregar conciliação
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

      {/* ── Empty (state switcher) ── */}
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
              Tudo conciliado!
            </span>
            <span
              className="text-[12px] text-center"
              style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}
            >
              Todos os lançamentos foram conciliados com o extrato bancário.
            </span>
          </div>
        </div>
      )}

      {/* ═══ Ready ═══ */}
      {viewState === "ready" && (
        <>
          {/* Empty import prompt */}
          {showEmptyImport && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                <ArrowRightLeft className="w-8 h-8 text-[#007AFF]" />
              </div>
              <div className="flex flex-col items-center gap-1.5 max-w-[360px]">
                <span
                  className="text-[16px]"
                  style={{ fontWeight: 600, color: dk.textSecondary }}
                >
                  Nenhuma transação importada
                </span>
                <span
                  className="text-[13px] text-center"
                  style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}
                >
                  Importe seu extrato bancário (OFX ou CSV) para comparar
                  automaticamente com as parcelas do ESSYN.
                </span>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer active:scale-[0.97]"
                style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
              >
                <Upload className="w-4 h-4" />
                Importar extrato
              </button>
            </div>
          )}

          {/* Data view */}
          {hasData && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <KpiCard
                  label="Total transações"
                  value={String(txns.length)}
                  icon={
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#007AFF]" />
                  }
                  sub={`${counts.sugerida} com sugestão`}
                />
                <KpiCard
                  label="Conciliadas"
                  value={String(counts.conciliada)}
                  icon={<Check className="w-3.5 h-3.5 text-[#34C759]" />}
                  sub={fmtCentsToBRL(totalConciliado)}
                />
                <KpiCard
                  label="Pendentes"
                  value={String(counts.pendente + counts.sugerida)}
                  icon={
                    <Link2Off className="w-3.5 h-3.5 text-[#FF9500]" />
                  }
                  sub={fmtCentsToBRL(pendentesValor)}
                />
                <KpiCard
                  label="Taxa conciliação"
                  value={`${taxaConciliacao}%`}
                  icon={
                    <Check className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  }
                  tooltip="Transações conciliadas / total"
                  sub="deste extrato"
                />
              </div>

              {/* AlertBanners — max 2 */}
              <AnimatePresence>
                {counts.sugerida > 0 &&
                  !alertsDismissed.has("sugestoes") && (
                    <AlertBanner
                      key="alert-sugestoes"
                      variant="info"
                      title={`${counts.sugerida} sugest${counts.sugerida > 1 ? "ões" : "ão"} de match encontrada${counts.sugerida > 1 ? "s" : ""}`}
                      desc="O ESSYN detectou matches automáticos por valor, data e nome do cliente."
                      ctaLabel="Aprovar todas"
                      cta={() => {
                        const suggested = txns
                          .filter(
                            (t) =>
                              t.suggestedEntryId &&
                              !t.matched &&
                              !t.ignored,
                          )
                          .map((t) => t.id);
                        bulkApproveMatches(suggested);
                        toast.success(
                          `${suggested.length} matches aprovados`,
                        );
                        dismissAlert("sugestoes");
                        refresh();
                      }}
                      dismissible
                      onDismiss={() => dismissAlert("sugestoes")}
                    />
                  )}
                {counts.pendente > 0 &&
                  !alertsDismissed.has("sem_match") && (
                    <AlertBanner
                      key="alert-sem-match"
                      variant="warning"
                      title={`${counts.pendente} transaç${counts.pendente > 1 ? "ões" : "ão"} sem match`}
                      desc="Verifique se há lançamentos ausentes ou crie novos no ESSYN."
                      ctaLabel="Ver pendentes"
                      cta={() => {
                        setFilter("pendente");
                        dismissAlert("sem_match");
                      }}
                      dismissible
                      onDismiss={() => dismissAlert("sem_match")}
                    />
                  )}
              </AnimatePresence>

              {/* FilterChips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setFilter("all");
                    clearSelection();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
                  style={{ fontWeight: 500, backgroundColor: filter === "all" ? dk.bgMuted : dk.bg, borderColor: filter === "all" ? (dk.isDark ? "#636366" : "#D1D1D6") : dk.border, color: filter === "all" ? dk.textSecondary : dk.textMuted }}
                >
                  <Filter className="w-3 h-3" />
                  Todas
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ fontWeight: 600, color: filter === "all" ? dk.textMuted : dk.textDisabled }}
                  >
                    {txns.length}
                  </span>
                </button>
                <span className="w-px h-5" style={{ backgroundColor: dk.border }} />
                {statusFilters.map((f) => (
                  <FilterChip
                    key={f.key}
                    label={f.label}
                    count={counts[f.key] || 0}
                    active={filter === f.key}
                    dot={f.dot}
                    chipBg={f.chipBg}
                    chipText={f.chipText}
                    chipBorder={f.chipBorder}
                    onClick={() => {
                      setFilter(filter === f.key ? "all" : f.key);
                      clearSelection();
                    }}
                  />
                ))}
              </div>

              {/* BulkActionsBar */}
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <BulkActionsBar
                    key="bulk-bar-conciliacao"
                    count={selectedIds.size}
                    actions={bulkActions}
                    onClear={clearSelection}
                  />
                )}
              </AnimatePresence>

              {/* Transaction feed */}
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
                {/* Table header */}
                <div className="grid grid-cols-[28px_0.5fr_1.8fr_1fr_0.7fr_0.65fr_100px] gap-3 px-5 py-2.5 items-center" style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: dk.bgSub }}>
                  <RowSelectCheckbox
                    state={headerCheckboxState}
                    onChange={toggleAll}
                    alwaysVisible
                    size="sm"
                  />
                  {["Data","Descrição","Tags","Valor","Status"].map(h => (
                    <span key={h} className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>{h}</span>
                  ))}
                  <span className="text-[10px] uppercase tracking-[0.06em] text-right" style={{ fontWeight: 600, color: dk.textSubtle }}>Ação</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {filtered.length > 0 ? (
                    filtered.map((txn) => (
                      <TxnRow
                        key={txn.id}
                        txn={txn}
                        selected={selectedIds.has(txn.id)}
                        onToggleSelect={toggleSelect}
                        onApproveMatch={handleApproveMatch}
                        onIgnore={handleIgnore}
                        onUnignore={handleUnignore}
                        onUnmatch={handleUnmatch}
                        onEditMatch={setEditMatchTxn}
                        onNavigateToProject={onNavigateToProject}
                      />
                    ))
                  ) : (
                    <motion.div
                      key="empty-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 gap-3"
                    >
                      <Search className="w-5 h-5" style={{ color: dk.textDisabled }} />
                      <span
                        className="text-[13px]"
                        style={{ fontWeight: 500, color: dk.textSubtle }}
                      >
                        {filter === "sugerida"
                          ? "Nenhuma sugestão no período"
                          : "Nenhuma transação encontrada"}
                      </span>
                      <button
                        onClick={() => setFilter("all")}
                        className="text-[11px] cursor-pointer"
                        style={{ color: dk.textSubtle, fontWeight: 400 }}
                      >
                        Ver todas →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-[11px]"
                      style={{ fontWeight: 400, color: dk.textSubtle }}
                    >
                      {filtered.length} de {txns.length} transações
                    </span>
                    {selectedIds.size > 0 && (
                      <>
                        <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
                        <span
                          className="text-[12px] tabular-nums"
                          style={{ fontWeight: 500, color: dk.textTertiary }}
                        >
                          {selectedIds.size} selecionada
                          {selectedIds.size > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                  {state.lastImportDisplay && (
                    <span
                      className="text-[11px] text-[#D1D1D6] tabular-nums"
                      style={{ fontWeight: 400 }}
                    >
                      Último import: {state.lastImportDisplay}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showImportModal && (
          <ImportarExtratoModal
            key="import-modal"
            onClose={() => setShowImportModal(false)}
            onImport={handleImport}
          />
        )}
        {editMatchTxn && (
          <EditarMatchModal
            key="edit-match-modal"
            txn={editMatchTxn}
            onClose={() => setEditMatchTxn(null)}
            onSave={(entryId) => handleEditMatch(editMatchTxn.id, entryId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TxnRow — Transaction feed row                      */
/* ═══════════════════════════════════════════════════ */

function TxnRow({
  txn,
  selected,
  onToggleSelect,
  onApproveMatch,
  onIgnore,
  onUnignore,
  onUnmatch,
  onEditMatch,
  onNavigateToProject,
}: {
  txn: BankTxn;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onApproveMatch: (txnId: string, entryId: string) => void;
  onIgnore: (txnId: string) => void;
  onUnignore: (txnId: string) => void;
  onUnmatch: (txnId: string) => void;
  onEditMatch: (txn: BankTxn) => void;
  onNavigateToProject?: (projectId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const status = getTxnStatus(txn);

  /* ── Tags (max 4) ── */
  const tags: { label: string; variant: TagVariant }[] = [];
  // 1. Direction
  tags.push({
    label: txn.direction === "in" ? "Entrada" : "Saída",
    variant: txn.direction === "in" ? "success" : "danger",
  });
  // 2. Method
  if (txn.detectedMethod) {
    tags.push({ label: txn.detectedMethod, variant: methodVariant(txn.detectedMethod) });
  }
  // 3. Category (if recurring)
  if (txn.detectedCategory) {
    tags.push({ label: txn.detectedCategory, variant: "neutral" });
  }
  // 4. Confidence badge (if suggested)
  if (status === "sugerida" && txn.suggestedConfidence) {
    tags.push({
      label: confidenceLabel(txn.suggestedConfidence),
      variant: confidenceVariant(txn.suggestedConfidence),
    });
  }
  const displayTags = tags.slice(0, 4);

  /* ── CTA ── */
  let cta: {
    label: string;
    icon: React.ReactNode;
    action: () => void;
  };
  switch (status) {
    case "sugerida":
      cta = {
        label: "Aprovar",
        icon: <Check className="w-3 h-3" />,
        action: () => onApproveMatch(txn.id, txn.suggestedEntryId!),
      };
      break;
    case "pendente":
      cta = {
        label: "Editar",
        icon: <ArrowRightLeft className="w-3 h-3" />,
        action: () => onEditMatch(txn),
      };
      break;
    case "conciliada":
      cta = {
        label: "Ver",
        icon: <Eye className="w-3 h-3" />,
        action: () => setExpanded(!expanded),
      };
      break;
    case "ignorada":
      cta = {
        label: "Restaurar",
        icon: <RefreshCw className="w-3 h-3" />,
        action: () => onUnignore(txn.id),
      };
      break;
    default:
      cta = {
        label: "Ver",
        icon: <Eye className="w-3 h-3" />,
        action: () => {},
      };
  }

  /* ── Status display ── */
  const statusLabel: Record<TxnStatus, string> = {
    sugerida: "Sugestão",
    pendente: "Sem match",
    conciliada: "Conciliada",
    ignorada: "Ignorada",
  };
  const statusBadgeCls: Record<TxnStatus, string> = {
    sugerida:
      "bg-[#F2F2F7] text-[#007AFF] border-[#E5E5EA]",
    pendente:
      "bg-[#F2F2F7] text-[#FF9500] border-[#E5E5EA]",
    conciliada:
      "bg-[#F2F2F7] text-[#34C759] border-[#E5E5EA]",
    ignorada: "bg-[#F2F2F7] text-[#C7C7CC] border-[#E5E5EA]",
  };

  /* ── Menu items ── */
  const menuItems: string[] = [];
  if (status === "sugerida") menuItems.push("Editar match", "Ignorar", "Criar lançamento");
  if (status === "pendente") menuItems.push("Criar lançamento", "Ignorar");
  if (status === "conciliada") menuItems.push("Remover match", "Ver detalhes");
  if (status === "ignorada") menuItems.push("Restaurar");

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`grid grid-cols-[28px_0.5fr_1.8fr_1fr_0.7fr_0.65fr_100px] gap-3 px-5 py-3 border-b border-[#F2F2F7] last:border-0 hover:bg-[#FAFAFA] transition-colors group items-center ${
          selected ? "bg-[#F5F5F7]" : ""
        } ${status === "ignorada" ? "opacity-50" : ""}`}
      >
        {/* Checkbox */}
        <RowSelectCheckbox
          state={selected ? "checked" : "unchecked"}
          onChange={() => onToggleSelect(txn.id)}
          size="sm"
        />

        {/* Date */}
        <span
          className="text-[12px] text-[#AEAEB2] tabular-nums"
          style={{ fontWeight: 400 }}
        >
          {txn.dateDisplay}
        </span>

        {/* Description + suggestion */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="text-[13px] text-[#636366] truncate"
            style={{ fontWeight: 500 }}
          >
            {txn.description}
          </span>
          {status === "sugerida" && txn.suggestedLabel && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-left cursor-pointer group/suggest"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#007AFF] shrink-0" />
              <span
                className="text-[10px] text-[#007AFF] truncate group-hover/suggest:text-[#007AFF]"
                style={{ fontWeight: 400 }}
              >
                Sugestão: {txn.suggestedLabel}
              </span>
              <ChevronRight
                className={`w-2.5 h-2.5 text-[#007AFF] shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
          {status === "conciliada" && txn.matchedEntryId && (
            <span
              className="text-[10px] text-[#34C759] truncate"
              style={{ fontWeight: 400 }}
            >
              ✓ Match: {txn.matchedEntryId}
            </span>
          )}
          {txn.account && status !== "sugerida" && status !== "conciliada" && (
            <span
              className="text-[10px] text-[#D1D1D6] truncate"
              style={{ fontWeight: 400 }}
            >
              {txn.account}
            </span>
          )}
        </div>

        {/* Tags (max 4) */}
        <div className="flex items-center gap-1 flex-wrap">
          {displayTags.map((t, i) => (
            <TagPill key={`${t.label}-${i}`} variant={t.variant}>
              {t.label}
            </TagPill>
          ))}
        </div>

        {/* Value */}
        <span
          className={`text-[13px] tabular-nums ${
            txn.direction === "in"
              ? "text-[#34C759]"
              : "text-[#FF3B30]"
          }`}
          style={{ fontWeight: 600 }}
        >
          {txn.direction === "in" ? "+" : "−"}
          {fmtCentsToBRL(txn.amountCents)}
        </span>

        {/* Status badge */}
        <span
          className={`inline-flex items-center px-1.5 py-[1px] rounded-md border text-[9px] ${statusBadgeCls[status]}`}
          style={{ fontWeight: 500 }}
        >
          {statusLabel[status]}
        </span>

        {/* CTA + menu */}
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={cta.action}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] bg-[#1D1D1F] text-white hover:bg-[#3C3C43] transition-all cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, boxShadow: "0 1px 2px #F2F2F7" }}
          >
            {cta.icon}
            {cta.label}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D1D1D6] hover:text-[#AEAEB2] hover:bg-[#F2F2F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="txn-menu"
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={springPopoverIn}
                  className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-[#E5E5EA] bg-white py-1 overflow-hidden"
                  style={{ boxShadow: "0 8px 24px #E5E5EA, 0 2px 6px #F5F5F7" }}
                >
                  {menuItems.map((mi) => (
                    <button
                      key={mi}
                      onClick={() => {
                        setMenuOpen(false);
                        if (mi === "Ignorar") onIgnore(txn.id);
                        if (mi === "Restaurar") onUnignore(txn.id);
                        if (mi === "Remover match") onUnmatch(txn.id);
                        if (mi === "Editar match") onEditMatch(txn);
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                      style={{ fontWeight: 400 }}
                    >
                      {mi}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {menuOpen && (
              createPortal(
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setMenuOpen(false)}
                />,
                document.body
              )
            )}
          </div>
        </div>
      </motion.div>

      {/* Expanded suggestion detail */}
      <AnimatePresence>
        {expanded && status === "sugerida" && txn.suggestedLabel && (
          <motion.div
            key={`detail-${txn.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springContentIn}
            className="border-b border-[#F2F2F7] overflow-hidden"
          >
            <div className="px-5 py-3 bg-[#F2F2F7] flex items-center gap-4 pl-[72px]">
              <div className="flex items-center gap-2 flex-1">
                <Sparkles className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[12px] text-[#007AFF]"
                    style={{ fontWeight: 500 }}
                  >
                    {txn.suggestedLabel}
                  </span>
                  <span
                    className="text-[10px] text-[#8E8E93]"
                    style={{ fontWeight: 400 }}
                  >
                    Confiança {confidenceLabel(txn.suggestedConfidence)}{" "}
                    — Match por valor
                    {txn.suggestedConfidence === "alta" ? ", data e nome" : " e data"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onApproveMatch(txn.id, txn.suggestedEntryId!)
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] bg-[#1D1D1F] text-white hover:bg-[#3C3C43] transition-all cursor-pointer active:scale-[0.97]"
                  style={{ fontWeight: 500 }}
                >
                  <Check className="w-3 h-3" />
                  Aprovar
                </button>
                <button
                  onClick={() => onEditMatch(txn)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] text-[#AEAEB2] border border-[#E5E5EA] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Editar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}