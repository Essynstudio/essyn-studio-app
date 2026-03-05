import { useState, useCallback, useMemo, forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  FileCheck2,
  AlertCircle,
  CircleCheck,
  LoaderCircle,
  RefreshCw,
  Download,
  Search,
  X,
  MoreHorizontal,
  Send,
  UserCheck,
  Check,
  Eye,
  Filter,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springDefault, springPopoverIn } from "../../lib/motion-tokens";
import { KpiCard } from "../ui/kpi-card";
import { FilterChip } from "../ui/filter-chip";
import { StatusBadge, type StatusParcela } from "../ui/status-badge";
import { TagPill, type TagVariant } from "../ui/tag-pill";
import { TypeBadge } from "../ui/type-badge";
import { fmtCurrency } from "../ui/action-row-item";
import { AlertBanner } from "../ui/alert-banner";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import { RowSelectCheckbox, type CheckboxState } from "../ui/row-select-checkbox";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import {
  getAllSyncedParcelas,
  getNfState,
  setNfState,
  setNfStateBulk,
  loadNfExportBatches,
  saveNfExportBatch,
  type NfExportBatch,
} from "../projetos/paymentPlanSync";
import type { NfStatus } from "../ui/action-row-item";
import { toast } from "sonner";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Fiscal — NF status + accountant export (BR v1)     */
/*  NF lifecycle: Pendente → Emitida → Enviado         */
/*  Data from getAllSyncedParcelas() + NF store         */
/*  Uses ONLY 02_Components primitives                  */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type NfFilter = "all" | "pendente" | "emitida" | "enviado_contador" | "na";

const TODAY_ISO = "2026-02-23";

/* ═══════════════════════════════════════════════════ */
/*  Fiscal Item — enriched receivable for NF tracking  */
/* ═══════════════════════════════════════════════════ */

interface FiscalItem {
  id: string;
  projectId: string;
  projeto: string;
  cliente: string;
  parcela: string;
  valor: number;
  vencimento: string;
  vencimentoISO: string;
  statusParcela: StatusParcela;
  metodo: string;
  comprovante: "sim" | "nao";
  nfStatus: NfStatus;
  nfNumber?: string;
  nfIssuedAtISO?: string;
  nfIssuedAtDisplay?: string;
  nfRequired: boolean;
}

/* ── Helpers ── */

function buildFiscalItems(): FiscalItem[] {
  const parcelas = getAllSyncedParcelas();
  const items: FiscalItem[] = [];

  for (const p of parcelas) {
    // Skip cancelled
    if (p.status === "cancelada") continue;

    const stored = getNfState(p.id);
    const nfRequired = true; // All BR service receivables require NF by default

    items.push({
      id: p.id,
      projectId: p.projectId,
      projeto: p.projetoNome,
      cliente: p.clienteNome,
      parcela:
        p.tipo === "entrada" ? "Entrada" : `${p.numero}/${p.totalParcelas}`,
      valor: p.valor,
      vencimento: p.vencimentoDisplay,
      vencimentoISO: p.vencimento,
      statusParcela: p.status,
      metodo: p.formaPagamento.toUpperCase(),
      comprovante: p.comprovante,
      nfStatus: p.nfStatus, // already overridden by NF store in getAllSyncedParcelas
      nfNumber: stored?.nfNumber,
      nfIssuedAtISO: stored?.nfIssuedAtISO,
      nfIssuedAtDisplay: stored?.nfIssuedAtISO
        ? new Date(stored.nfIssuedAtISO + "T12:00:00").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : undefined,
      nfRequired,
    });
  }

  return items;
}

function nfTagVariant(nf: NfStatus): TagVariant {
  switch (nf) {
    case "pendente":
      return "warning";
    case "emitida":
      return "success";
    case "enviado_contador":
      return "info";
    default:
      return "neutral";
  }
}

function nfTagLabel(nf: NfStatus): string {
  switch (nf) {
    case "pendente":
      return "NF Pendente";
    case "emitida":
      return "NF Emitida";
    case "enviado_contador":
      return "Env. Contador";
    case "na":
      return "N/A";
    default:
      return "";
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

/* ── Period selector months ── */
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ── Filter chip definitions ── */
const nfFilters: {
  key: NfFilter;
  label: string;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}[] = [
  {
    key: "pendente",
    label: "NF Pendente",
    dot: "bg-[#FF9500]",
    chipBg: "bg-[#FFFBEB]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#FDE68A]",
  },
  {
    key: "emitida",
    label: "NF Emitida",
    dot: "bg-[#34C759]",
    chipBg: "bg-[#F0FDF4]",
    chipText: "text-[#34C759]",
    chipBorder: "border-[#BBF7D0]",
  },
  {
    key: "enviado_contador",
    label: "Env. Contador",
    dot: "bg-[#007AFF]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#007AFF]",
    chipBorder: "border-[#007AFF]",
  },
  {
    key: "na",
    label: "Não requer NF",
    dot: "bg-[#D1D1D6]",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#636366]",
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
/*  Modal "Marcar NF emitida"                          */
/* ═══════════════════════════════════════════════════ */

function MarcarNfEmitidaModal({
  item,
  onClose,
  onSave,
}: {
  item: FiscalItem;
  onClose: () => void;
  onSave: (nfNumber: string, issuedDate: string) => void;
}) {
  const [nfNumber, setNfNumber] = useState(item.nfNumber || "");
  const [issuedDate, setIssuedDate] = useState(item.nfIssuedAtISO || TODAY_ISO);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[520px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
          <span className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
            Emitir NFS-e
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
              Número da NF
            </label>
            <input
              type="text"
              placeholder="Ex: NF-2026-043"
              value={nfNumber}
              onChange={(e) => setNfNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#D1D1D6] focus:outline-none focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all font-mono"
              style={{ fontWeight: 400 }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
              Data de emissão
            </label>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] focus:outline-none focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all"
              style={{ fontWeight: 400 }}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#F2F2F7] rounded-xl">
            <StatusBadge status={item.statusParcela} size="md" showDot />
            <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
              {item.cliente} · {item.vencimento}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button
            onClick={() => onSave(nfNumber, issuedDate)}
            className="px-4 py-2 rounded-xl text-[12px] bg-[#1D1D1F] text-white hover:bg-[#3C3C43] transition-colors cursor-pointer active:scale-[0.97]"
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
/*  Modal "Marcar enviado ao contador"                 */
/* ═══════════════════════════════════════════════════ */

function MarcarEnviadoModal({
  item,
  onClose,
  onConfirm,
}: {
  item: FiscalItem;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[480px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
          <span className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
            Cancelar NFS-e
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-[#F2F2F7] rounded-xl border border-[#007AFF]">
            <UserCheck className="w-4 h-4 text-[#007AFF] shrink-0" />
            <span className="text-[12px] text-[#007AFF]" style={{ fontWeight: 400 }}>
              A NF será marcada como enviada ao contador. Esta ação é apenas de registro — o envio real é feito por você.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
              Observação (opcional)
            </label>
            <textarea
              placeholder="Ex: Enviado via e-mail ao escritório XYZ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-[80px] px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#636366] placeholder:text-[#D1D1D6] resize-none focus:outline-none focus:border-[#E5E5EA] transition-colors"
              style={{ fontWeight: 400, lineHeight: 1.6 }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(notes)}
            className="px-4 py-2 rounded-xl text-[12px] bg-[#1D1D1F] text-white hover:bg-[#3C3C43] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500 }}
          >
            <span className="flex items-center gap-1.5">
              <Send className="w-3 h-3" />
              Confirmar envio
            </span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Modal "Exportar para contador"                     */
/* ═══════════════════════════════════════════════════ */

function ExportarModal({
  onClose,
  onExport,
  itemCount,
  totalValor,
}: {
  onClose: () => void;
  onExport: (period: string, format: string) => void;
  itemCount: number;
  totalValor: number;
}) {
  const [month, setMonth] = useState(1); // February (0-indexed)
  const [year] = useState(2026);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  const period = `${MONTHS[month]} ${year}`;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[480px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]">
          <span className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
            Configurar integração
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
              Período
            </label>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] appearance-none focus:outline-none focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all cursor-pointer"
                style={{ fontWeight: 400 }}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m} {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#D1D1D6] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#C7C7CC] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
              Formato
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("csv")}
                className={`py-2.5 rounded-xl text-[12px] border transition-all cursor-pointer ${
                  format === "csv"
                    ? "bg-[#F2F2F7] border-[#E5E5EA] text-[#636366]"
                    : "border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6]"
                }`}
                style={{ fontWeight: 500 }}
              >
                CSV
              </button>
              <button
                onClick={() => setFormat("pdf")}
                className={`py-2.5 rounded-xl text-[12px] border transition-all cursor-pointer ${
                  format === "pdf"
                    ? "bg-[#F2F2F7] border-[#E5E5EA] text-[#636366]"
                    : "border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6]"
                }`}
                style={{ fontWeight: 500 }}
              >
                PDF (mock)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[#F2F2F7] rounded-xl">
            <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Itens na exportação</span>
            <span className="text-[13px] text-[#636366] tabular-nums" style={{ fontWeight: 600 }}>
              {itemCount} NFs · {fmtCurrency(totalValor)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button
            onClick={() => onExport(period, format.toUpperCase())}
            className="px-4 py-2 rounded-xl text-[12px] bg-[#1D1D1F] text-white hover:bg-[#3C3C43] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500 }}
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-3 h-3" />
              Gerar exportação
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

export function FiscalContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projectId: string) => void;
}) {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [filter, setFilter] = useState<NfFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());
  const [emitidaModalItem, setEmitidaModalItem] = useState<FiscalItem | null>(null);
  const [enviadoModalItem, setEnviadoModalItem] = useState<FiscalItem | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /* ── Data ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => buildFiscalItems(), [refreshKey]);

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.nfStatus !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.projeto.toLowerCase().includes(q) ||
          item.cliente.toLowerCase().includes(q) ||
          (item.nfNumber || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filter, search]);

  /* ── Filter counts ── */
  const counts: Record<NfFilter, number> = useMemo(
    () => ({
      all: items.length,
      pendente: items.filter((i) => i.nfStatus === "pendente").length,
      emitida: items.filter((i) => i.nfStatus === "emitida").length,
      enviado_contador: items.filter((i) => i.nfStatus === "enviado_contador").length,
      na: items.filter((i) => i.nfStatus === "na").length,
    }),
    [items],
  );

  /* ── KPIs ── */
  const totalPendente = items
    .filter((i) => i.nfStatus === "pendente")
    .reduce((s, i) => s + i.valor, 0);
  const totalEmitida = items
    .filter((i) => i.nfStatus === "emitida")
    .reduce((s, i) => s + i.valor, 0);
  const totalEnviado = items
    .filter((i) => i.nfStatus === "enviado_contador")
    .reduce((s, i) => s + i.valor, 0);
  const taxaEmissao =
    items.length > 0
      ? Math.round(
          ((counts.emitida + counts.enviado_contador) / items.length) * 100,
        )
      : 0;

  /* ── Last export batch ── */
  const exportBatches = loadNfExportBatches();
  const lastExport = exportBatches.length > 0 ? exportBatches[0] : null;

  /* ── Selection ── */
  const filteredIds = filtered.map((i) => i.id);
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
  const handleMarcarEmitida = useCallback(
    (item: FiscalItem, nfNumber: string, issuedDate: string) => {
      setNfState(item.id, {
        nfStatus: "emitida",
        nfNumber: nfNumber || undefined,
        nfIssuedAtISO: issuedDate || TODAY_ISO,
      });
      setEmitidaModalItem(null);
      toast.success(`NF marcada como emitida${nfNumber ? ` (${nfNumber})` : ""}`);
      refresh();
    },
    [refresh],
  );

  const handleMarcarEnviado = useCallback(
    (item: FiscalItem, _notes: string) => {
      setNfState(item.id, { nfStatus: "enviado_contador" });
      setEnviadoModalItem(null);
      toast.success("NF marcada como enviada ao contador");
      refresh();
    },
    [refresh],
  );

  const handleBulkMarcarEmitida = useCallback(() => {
    setNfStateBulk([...selectedIds], {
      nfStatus: "emitida",
      nfIssuedAtISO: TODAY_ISO,
    });
    toast.success(`${selectedIds.size} NF${selectedIds.size > 1 ? "s" : ""} marcada${selectedIds.size > 1 ? "s" : ""} como emitida${selectedIds.size > 1 ? "s" : ""}`);
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  const handleBulkMarcarEnviado = useCallback(() => {
    setNfStateBulk([...selectedIds], { nfStatus: "enviado_contador" });
    toast.success(`${selectedIds.size} NF${selectedIds.size > 1 ? "s" : ""} marcada${selectedIds.size > 1 ? "s" : ""} como enviada${selectedIds.size > 1 ? "s" : ""}`);
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  const handleExport = useCallback(
    (period: string, format: string) => {
      const exportableItems = items.filter(
        (i) => i.nfStatus === "emitida" || i.nfStatus === "enviado_contador",
      );
      const batch: NfExportBatch = {
        id: `exp-${Date.now()}`,
        createdAtISO: TODAY_ISO,
        createdAtDisplay: "23 Fev 2026, 14:30",
        period,
        format,
        itemCount: exportableItems.length,
        totalValor: exportableItems.reduce((s, i) => s + i.valor, 0),
      };
      saveNfExportBatch(batch);
      // Mark exported items as enviado_contador
      setNfStateBulk(
        exportableItems.map((i) => i.id),
        { nfStatus: "enviado_contador", accountantExportBatchId: batch.id },
      );
      setShowExportModal(false);
      toast.success(`Exportação ${format} gerada — ${exportableItems.length} NFs`);
      refresh();
    },
    [items, refresh],
  );

  /* ── QuickActionsBar config (≤7) ── */
  const quickActions: QuickAction[] = [
    { label: "Exportar para contador", icon: <Download className="w-3 h-3" /> },
    { label: "Ver NF pendentes", icon: <FileText className="w-3 h-3" /> },
    { label: "Marcar como emitida", icon: <FileCheck2 className="w-3 h-3" /> },
    { label: "Marcar como enviado", icon: <Send className="w-3 h-3" /> },
    { label: "Exportar CSV", icon: <Download className="w-3 h-3" /> },
  ];

  /* ── BulkActionsBar config ── */
  const bulkActions: BulkAction[] = [
    { label: "Marcar emitida", icon: <FileCheck2 className="w-3 h-3" />, onClick: handleBulkMarcarEmitida },
    { label: "Marcar enviado", icon: <Send className="w-3 h-3" />, onClick: handleBulkMarcarEnviado },
    { label: "Exportar CSV", icon: <Download className="w-3 h-3" />, onClick: clearSelection },
  ];

  /* ── Row Tags builder (max 4) ── */
  function buildTags(item: FiscalItem) {
    const tags: { label: string; variant: TagVariant }[] = [];
    // 1. NF status (highest priority for fiscal tab)
    tags.push({ label: nfTagLabel(item.nfStatus), variant: nfTagVariant(item.nfStatus) });
    // 2. Método
    tags.push({ label: item.metodo, variant: metodoVariant(item.metodo) });
    // 3. Comprovante
    if (item.comprovante === "sim") tags.push({ label: "Compr.", variant: "success" });
    // 4. NF Number if available
    if (item.nfNumber) tags.push({ label: item.nfNumber, variant: "neutral" });
    return tags.slice(0, 4);
  }

  /* ── CTA per item ── */
  function ctaForItem(item: FiscalItem): { label: string; icon: React.ReactNode; action: () => void } {
    switch (item.nfStatus) {
      case "pendente":
        return { label: "Emitir NF", icon: <FileCheck2 className="w-3 h-3" />, action: () => setEmitidaModalItem(item) };
      case "emitida":
        return { label: "Enviar", icon: <Send className="w-3 h-3" />, action: () => setEnviadoModalItem(item) };
      case "enviado_contador":
        return { label: "Ver", icon: <Eye className="w-3 h-3" />, action: () => {} };
      default:
        return { label: "Ver", icon: <Eye className="w-3 h-3" />, action: () => {} };
    }
  }

  /* ── Menu items ── */
  function menuForItem(item: FiscalItem): string[] {
    const m: string[] = [];
    if (item.nfStatus === "pendente") m.push("Marcar NF emitida");
    if (item.nfStatus === "emitida") m.push("Enviar ao contador");
    m.push("Editar NF", "Ver detalhes", "Exportar item", "Abrir projeto");
    return m;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] tracking-tight" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
            Financeiro
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textMuted }}>
              Fiscal
            </span>
            <span className="w-px h-3" style={{ backgroundColor: dk.hairline }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
              Notas fiscais · Fevereiro 2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px]" style={{ border: `1px solid ${dk.border}`, color: dk.textMuted }}>
            <Calendar className="w-3 h-3" style={{ color: dk.textDisabled }} />
            <span style={{ fontWeight: 400 }}>Fev 2026</span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dk.textDisabled }} />
            <input
              type="text"
              placeholder="Buscar cliente ou NF…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] pr-8 py-1.5 rounded-xl text-[12px] focus:outline-none transition-all"
              style={{ fontWeight: 400, paddingLeft: "2rem", border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: dk.textDisabled }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* CTA */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar para contador
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.hairline }} />
          <StateSwitcher active={viewState} onChange={setViewState} />
        </div>
      </div>

      {/* QuickActionsBar */}
      <QuickActionsBar
        actions={quickActions}
        onAction={(label) => {
          if (label === "Exportar para contador" || label === "Exportar CSV") setShowExportModal(true);
          if (label === "Ver NF pendentes") setFilter("pendente");
        }}
      />

      {/* ── Loading ── */}
      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ backgroundColor: dk.bgMuted }} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[56px] rounded-xl animate-pulse" style={{ backgroundColor: dk.bgMuted }} />
            ))}
          </div>
          <div className="flex items-center justify-center py-4 gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Carregando…</span>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {viewState === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
            <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Erro ao carregar notas fiscais</span>
          <button onClick={() => setViewState("ready")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}>
            <RefreshCw className="w-3.5 h-3.5" />Tentar novamente
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {viewState === "empty" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.successBg }}>
            <CircleCheck className="w-7 h-7 text-[#34C759]" />
          </div>
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Nenhuma NF pendente</span>
            <span className="text-[12px] text-center" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>
              Todas as notas fiscais foram emitidas e enviadas ao contador.
            </span>
          </div>
        </div>
      )}

      {/* ═══ Ready ═══ */}
      {viewState === "ready" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="NFs pendentes"
              value={String(counts.pendente)}
              icon={<FileText className="w-3.5 h-3.5 text-[#FF9500]" />}
              sub={fmtCurrency(totalPendente) + " em valor"}
            />
            <KpiCard
              label="NFs emitidas"
              value={String(counts.emitida)}
              icon={<FileCheck2 className="w-3.5 h-3.5 text-[#34C759]" />}
              sub={fmtCurrency(totalEmitida) + " emitido"}
            />
            <KpiCard
              label="Enviadas ao contador"
              value={String(counts.enviado_contador)}
              icon={<UserCheck className="w-3.5 h-3.5 text-[#007AFF]" />}
              sub={fmtCurrency(totalEnviado) + " contabilizado"}
            />
            <KpiCard
              label="Taxa de emissão"
              value={`${taxaEmissao}%`}
              icon={<FileCheck2 className="w-3.5 h-3.5 text-[#C7C7CC]" />}
              tooltip="NFs emitidas + enviadas / total"
              sub="emitidas vs. total"
            />
          </div>

          {/* AlertBanners — max 2 */}
          <AnimatePresence>
            {counts.pendente > 0 && !alertsDismissed.has("nf_pendentes") && (
              <AlertBanner
                key="alert-nf-pendentes"
                variant="warning"
                title={`${counts.pendente} NF${counts.pendente > 1 ? "s" : ""} pendente${counts.pendente > 1 ? "s" : ""} de emissão — ${fmtCurrency(totalPendente)}`}
                desc="Parcelas pagas ou vencidas sem NF emitida. Regularize para evitar pendências fiscais."
                ctaLabel="Ver pendentes"
                cta={() => {
                  setFilter("pendente");
                  dismissAlert("nf_pendentes");
                }}
                dismissible
                onDismiss={() => dismissAlert("nf_pendentes")}
              />
            )}
            {lastExport && !alertsDismissed.has("last_export") && (
              <AlertBanner
                key="alert-last-export"
                variant="info"
                title={`Última exportação: ${lastExport.createdAtDisplay}`}
                desc={`${lastExport.itemCount} NFs exportadas (${lastExport.format}) — período ${lastExport.period}`}
                ctaLabel="Exportar novamente"
                cta={() => {
                  setShowExportModal(true);
                  dismissAlert("last_export");
                }}
                dismissible
                onDismiss={() => dismissAlert("last_export")}
              />
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setFilter("all"); clearSelection(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: filter === "all" ? dk.bgMuted : dk.bg, borderColor: filter === "all" ? (dk.isDark ? "#636366" : "#D1D1D6") : dk.border, color: filter === "all" ? dk.textSecondary : dk.textMuted }}
            >
              <Filter className="w-3 h-3" />
              Todas
              <span className="text-[11px] tabular-nums" style={{ fontWeight: 600, color: filter === "all" ? dk.textMuted : dk.textDisabled }}>
                {items.length}
              </span>
            </button>
            <span className="w-px h-5" style={{ backgroundColor: dk.hairline }} />
            {nfFilters.map((f) => (
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
                key="bulk-bar-fiscal"
                count={selectedIds.size}
                actions={bulkActions}
                onClear={clearSelection}
              />
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            <div className="grid grid-cols-[28px_0.5fr_1.6fr_0.5fr_1fr_0.65fr_0.6fr_0.55fr_88px] gap-3 px-5 py-2.5 items-center" style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: dk.bgSub }}>
              <RowSelectCheckbox state={headerCheckboxState} onChange={toggleAll} alwaysVisible size="sm" />
              {["Tipo","Projeto / Cliente","Parcela","Tags","Valor","Emissão","Status"].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>{h}</span>
              ))}
              <span className="text-[10px] uppercase tracking-[0.06em] text-right" style={{ fontWeight: 600, color: dk.textSubtle }}>Ação</span>
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const cta = ctaForItem(item);
                  const tags = buildTags(item);
                  return (
                    <FiscalRow
                      key={item.id}
                      item={item}
                      cta={cta}
                      tags={tags}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={toggleSelect}
                      onNavigateToProject={onNavigateToProject}
                      menuItems={menuForItem(item)}
                      onMenuAction={(action) => {
                        if (action === "Marcar NF emitida") setEmitidaModalItem(item);
                        else if (action === "Enviar ao contador") setEnviadoModalItem(item);
                        else if (action === "Abrir projeto") onNavigateToProject?.(item.projectId);
                      }}
                    />
                  );
                })
              ) : (
                <motion.div
                  key="empty-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <Search className="w-5 h-5" style={{ color: dk.textDisabled }} />
                  <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textSubtle }}>Nenhuma NF encontrada</span>
                  <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Ajuste os filtros ou busca</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                {filtered.length} NF{filtered.length !== 1 ? "s" : ""}
                {selectedIds.size > 0 && (
                  <> · <span style={{ fontWeight: 500, color: dk.textMuted }}>
                    {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
                  </span></>
                )}
              </span>
              <span className="text-[12px] tabular-nums" style={{ fontWeight: 500, color: dk.textMuted }}>
                Total: {fmtCurrency(filtered.reduce((s, i) => s + i.valor, 0))}
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {emitidaModalItem && (
          <MarcarNfEmitidaModal
            key="emitida-modal"
            item={emitidaModalItem}
            onClose={() => setEmitidaModalItem(null)}
            onSave={(nfNumber, issuedDate) => handleMarcarEmitida(emitidaModalItem, nfNumber, issuedDate)}
          />
        )}
        {enviadoModalItem && (
          <MarcarEnviadoModal
            key="enviado-modal"
            item={enviadoModalItem}
            onClose={() => setEnviadoModalItem(null)}
            onConfirm={(notes) => handleMarcarEnviado(enviadoModalItem, notes)}
          />
        )}
        {showExportModal && (
          <ExportarModal
            key="exportar-modal"
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            itemCount={items.filter((i) => i.nfStatus === "emitida" || i.nfStatus === "enviado_contador").length}
            totalValor={items.filter((i) => i.nfStatus === "emitida" || i.nfStatus === "enviado_contador").reduce((s, i) => s + i.valor, 0)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  FiscalRow — Inline table row                       */
/* ═══════════════════════════════════════════════════ */

const FiscalRow = forwardRef<HTMLDivElement, {
  item: FiscalItem;
  cta: { label: string; icon: React.ReactNode; action: () => void };
  tags: { label: string; variant: TagVariant }[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onNavigateToProject?: (projectId: string) => void;
  menuItems: string[];
  onMenuAction: (action: string) => void;
}>(function FiscalRow({
  item,
  cta,
  tags,
  selected,
  onToggleSelect,
  onNavigateToProject,
  menuItems,
  onMenuAction,
}, ref) {
  const dk = useDk();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-[28px_0.5fr_1.6fr_0.5fr_1fr_0.65fr_0.6fr_0.55fr_88px] gap-3 px-5 py-3 transition-colors group items-center"
      style={{ borderBottom: `1px solid ${dk.hairline}`, backgroundColor: selected ? (dk.isDark ? "#2C2410" : "#F5F5F7") : "transparent" }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = dk.bgHover; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <RowSelectCheckbox state={selected ? "checked" : "unchecked"} onChange={() => onToggleSelect(item.id)} size="sm" />

      <TypeBadge variant="fiscal" />

      <div className="flex flex-col gap-0.5 min-w-0">
        <button
          onClick={() => onNavigateToProject?.(item.projectId)}
          className="text-[13px] truncate hover:underline underline-offset-2 cursor-pointer text-left"
          style={{ fontWeight: 500, color: dk.isDark ? "#AEAEB2" : "#48484A" }}
        >
          {item.projeto}
        </button>
        <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textSubtle }}>
          {item.cliente}
        </span>
      </div>

      <span className="text-[12px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
        {item.parcela}
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((t, i) => (
          <TagPill key={`${t.label}-${i}`} variant={t.variant}>
            {t.label}
          </TagPill>
        ))}
      </div>

      <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textSecondary }}>
        {fmtCurrency(item.valor)}
      </span>

      <span className="text-[12px] tabular-nums truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
        {item.nfIssuedAtDisplay || "—"}
      </span>

      <StatusBadge status={item.statusParcela} size="sm" showDot />

      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={cta.action}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer active:scale-[0.97]"
          style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}
        >
          {cta.icon}
          {cta.label}
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            style={{ color: dk.textDisabled }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="row-menu"
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={springPopoverIn}
                className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl py-1 overflow-hidden"
                style={{ border: `1px solid ${dk.border}`, backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
              >
                {menuItems.map((mi) => (
                  <button
                    key={mi}
                    onClick={() => { onMenuAction(mi); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer"
                    style={{ color: dk.textTertiary, fontWeight: 400 }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {mi}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {menuOpen && (
            createPortal(
              <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />,
              document.body
            )
          )}
        </div>
      </div>
    </motion.div>
  );
});