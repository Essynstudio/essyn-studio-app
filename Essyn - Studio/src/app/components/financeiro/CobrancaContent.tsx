import { useState, useCallback, useMemo, forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  MessageCircle,
  Mail,
  AlertCircle,
  CircleCheck,
  LoaderCircle,
  RefreshCw,
  Check,
  Plus,
  Download,
  Search,
  X,
  Eye,
  QrCode,
  Receipt,
  Copy,
  Sparkles,
  MoreHorizontal,
  Clock,
  Link2,
  Filter,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn, springDefault } from "../../lib/motion-tokens";
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
import { getAllSyncedParcelas, type GeneratedParcela } from "../projetos/paymentPlanSync";
import { toast } from "sonner";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Cobranca — Billing & Collections (BR-real v1)      */
/*  PIX (QR / chave) + link de pagamento + boleto      */
/*  Templates + logs + sync com recebiveis             */
/*  Usa SOMENTE primitivos 02_Components               */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type ChargeStatus = "nao_emitida" | "emitida" | "enviada" | "reenvio_sugerido";
type ChargeMethod = "pix" | "link" | "boleto";
type ChargeFilter = "all" | "vencida" | "vence_hoje" | "nao_emitida" | "emitida" | "enviada";

const TODAY_ISO = "2026-02-23";

/* ═══════════════════════════════════════════════════ */
/*  Charge Store — localStorage persistence            */
/* ═══════════════════════════════════════════════════ */

interface ChargeState {
  chargeStatus: ChargeStatus;
  chargeMethod?: ChargeMethod;
  pixKey?: string;
  pixQrPayload?: string;
  paymentLinkUrl?: string;
  boletoUrl?: string;
  lastSentAtISO?: string;
  sentCount: number;
  notes?: string;
}

const CHARGE_STORAGE_KEY = "essyn:chargeState";

function loadChargeStore(): Record<string, ChargeState> {
  try {
    const raw = localStorage.getItem(CHARGE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveChargeStore(store: Record<string, ChargeState>) {
  try {
    localStorage.setItem(CHARGE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded */
  }
}

function getChargeState(id: string): ChargeState {
  const store = loadChargeStore();
  return (
    store[id] || { chargeStatus: "nao_emitida", sentCount: 0 }
  );
}

function setChargeState(id: string, state: Partial<ChargeState>) {
  const store = loadChargeStore();
  const existing = store[id] || { chargeStatus: "nao_emitida" as ChargeStatus, sentCount: 0 };
  store[id] = { ...existing, ...state };
  saveChargeStore(store);
}

/* ═══════════════════════════════════════════════════ */
/*  Cobranca Item — Extended receivable                */
/* ═══════════════════════════════════════════════════ */

interface CobrancaItem {
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
  nf: "emitida" | "pendente" | "na";
  diasAtraso?: number;
  /* charge fields */
  chargeStatus: ChargeStatus;
  chargeMethod?: ChargeMethod;
  lastSentAtISO?: string;
  sentCount: number;
}

/* ── Studio config (mock) ── */
const STUDIO_PIX_KEY = "studio@essyn.com.br";
const STUDIO_NAME = "Estudio ESSYN Fotografia";

/* ── Helpers ── */

function deriveChargeStatus(
  parcela: GeneratedParcela,
  stored: ChargeState,
): ChargeStatus {
  // If already emitida/enviada, check if reenvio is suggested
  if (stored.chargeStatus === "enviada" && parcela.status === "vencida") {
    return "reenvio_sugerido";
  }
  return stored.chargeStatus;
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
    case "link":
      return "info";
    default:
      return "neutral";
  }
}

function chargeTagVariant(cs: ChargeStatus): TagVariant {
  switch (cs) {
    case "emitida":
      return "info";
    case "enviada":
      return "success";
    case "reenvio_sugerido":
      return "warning";
    default:
      return "neutral";
  }
}

function chargeTagLabel(cs: ChargeStatus): string {
  switch (cs) {
    case "nao_emitida":
      return "Nao emitida";
    case "emitida":
      return "Cob. emitida";
    case "enviada":
      return "Cob. enviada";
    case "reenvio_sugerido":
      return "Reenviar";
    default:
      return "";
  }
}

function buildCobrancaItems(): CobrancaItem[] {
  const parcelas = getAllSyncedParcelas();
  const items: CobrancaItem[] = [];

  for (const p of parcelas) {
    // Only show pending receivables
    if (p.status === "paga" || p.status === "conciliada" || p.status === "cancelada") continue;

    const stored = getChargeState(p.id);
    const cs = deriveChargeStatus(p, stored);

    const atraso =
      p.status === "vencida"
        ? Math.round(
            (new Date("2026-02-23T12:00:00").getTime() -
              new Date(p.vencimento + "T12:00:00").getTime()) /
              86400000,
          )
        : undefined;

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
      status: p.status,
      metodo: p.formaPagamento.toUpperCase(),
      nf: p.nfStatus === "na" ? "na" : p.nfStatus === "emitida" ? "emitida" : "pendente",
      diasAtraso: atraso && atraso > 0 ? atraso : undefined,
      chargeStatus: cs,
      chargeMethod: stored.chargeMethod,
      lastSentAtISO: stored.lastSentAtISO,
      sentCount: stored.sentCount || 0,
    });
  }

  return items;
}

/* ── Message Templates ── */
function buildMessage(
  item: CobrancaItem,
  tone: "profissional" | "premium",
  linkOrPix: string,
): string {
  if (tone === "profissional") {
    return `Ola ${item.cliente},

Referente ao projeto "${item.projeto}" — ${item.parcela}, no valor de ${fmtCurrency(item.valor)}, com vencimento em ${item.vencimento}.

Segue o link para pagamento:
${linkOrPix}

Qualquer duvida, estamos a disposicao.

Att,
${STUDIO_NAME}`;
  }

  return `Oi ${item.cliente}!

Tudo bem? Passando para lembrar sobre o projeto "${item.projeto}" — parcela ${item.parcela}, no valor de ${fmtCurrency(item.valor)} (vencimento: ${item.vencimento}).

Voce pode pagar facilmente por aqui:
${linkOrPix}

Qualquer coisa e so chamar!
${STUDIO_NAME}`;
}

/* ── Filter chip definitions (dark-aware) ── */
function getFilterDefs(isDark: boolean): {
  key: ChargeFilter;
  label: string;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}[] {
  return [
    {
      key: "vencida",
      label: "Atrasadas",
      dot: "bg-[#FF3B30]",
      chipBg: isDark ? "bg-[#2C1A1A]" : "bg-[#FBF5F4]",
      chipText: "text-[#FF3B30]",
      chipBorder: isDark ? "border-[#4A2020]" : "border-[#F2DDD9]",
    },
    {
      key: "vence_hoje",
      label: "Vence hoje",
      dot: "bg-[#FF9500]",
      chipBg: isDark ? "bg-[#2C2410]" : "bg-[#FFFBEB]",
      chipText: "text-[#FF9500]",
      chipBorder: isDark ? "border-[#4A3D18]" : "border-[#E5E5EA]",
    },
    {
      key: "nao_emitida",
      label: "Nao emitidas",
      dot: isDark ? "bg-[#636366]" : "bg-[#C7C7CC]",
      chipBg: isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]",
      chipText: isDark ? "text-[#AEAEB2]" : "text-[#636366]",
      chipBorder: isDark ? "border-[#3C3C43]" : "border-[#E5E5EA]",
    },
    {
      key: "emitida",
      label: "Emitidas",
      dot: "bg-[#007AFF]",
      chipBg: isDark ? "bg-[#1A2030]" : "bg-[#F2F2F7]",
      chipText: "text-[#007AFF]",
      chipBorder: isDark ? "border-[#203450]" : "border-[#E5E5EA]",
    },
    {
      key: "enviada",
      label: "Enviadas",
      dot: "bg-[#34C759]",
      chipBg: isDark ? "bg-[#1A2C1E]" : "bg-[#F0FDF4]",
      chipText: "text-[#34C759]",
      chipBorder: isDark ? "border-[#204A28]" : "border-[#E5E5EA]",
    },
  ];
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
          style={{
            fontWeight: active === s ? 500 : 400,
            backgroundColor: active === s ? dk.bg : "transparent",
            color: active === s ? dk.textSecondary : dk.textMuted,
            boxShadow: active === s ? dk.shadowCard : "none",
          }}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Modal "Emitir cobranca"                            */
/* ═══════════════════════════════════════════════════ */

function EmitirCobrancaModal({
  item,
  onClose,
  onEmit,
}: {
  item: CobrancaItem;
  onClose: () => void;
  onEmit: (method: ChargeMethod) => void;
}) {
  const dk = useDk();
  const [selectedMethod, setSelectedMethod] = useState<ChargeMethod>("pix");

  const methods: { key: ChargeMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "pix", label: "PIX", icon: <QrCode className="w-4 h-4" />, desc: "QR Code + chave PIX" },
    { key: "link", label: "Link de pagamento", icon: <Link2 className="w-4 h-4" />, desc: "Cartao de credito/debito" },
    { key: "boleto", label: "Boleto", icon: <Receipt className="w-4 h-4" />, desc: "Boleto bancario (mock)" },
  ];

  const pixPayload = `00020126580014br.gov.bcb.pix0136${STUDIO_PIX_KEY}5204000053039865404${item.valor.toFixed(2)}5802BR5925${STUDIO_NAME.slice(0, 25)}6009SAO PAULO`;
  const paymentLink = `https://pay.essyn.com.br/c/${item.id.slice(0, 8)}`;
  const boletoLink = `https://boleto.essyn.com.br/b/${item.id.slice(0, 8)}`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    });
  }

  /* primary btn colors */
  const btnPrimBg = dk.isDark ? "#F5F5F7" : "#1D1D1F";
  const btnPrimText = dk.isDark ? "#1D1D1F" : "#FFFFFF";
  const btnPrimHover = dk.isDark ? "#E5E5EA" : "#3C3C43";

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "#1D1D1F", opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[520px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowModal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#F5F5F7" : "#48484A" }}>
              Emitir cobranca
            </span>
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              {item.projeto} · {item.cliente} · {item.parcela}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: dk.textSubtle }}
            onMouseEnter={(e) => { e.currentTarget.style.color = dk.textTertiary; e.currentTarget.style.backgroundColor = dk.bgMuted; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = dk.textSubtle; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Valor */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: dk.bgMuted }}>
            <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textMuted }}>Valor da cobranca</span>
            <span className="text-[18px] tabular-nums" style={{ fontWeight: 600, color: dk.isDark ? "#F5F5F7" : "#48484A" }}>
              {fmtCurrency(item.valor)}
            </span>
          </div>

          {/* Method selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
              Metodo de cobranca
            </span>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer"
                  style={{
                    borderColor: selectedMethod === m.key ? (dk.isDark ? "#48484A" : "#D1D1D6") : dk.border,
                    backgroundColor: selectedMethod === m.key ? dk.bgActive : "transparent",
                    boxShadow: selectedMethod === m.key ? `inset 0 0 0 1px ${dk.border}` : "none",
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{
                    backgroundColor: selectedMethod === m.key ? btnPrimBg : dk.bgMuted,
                    color: selectedMethod === m.key ? btnPrimText : dk.textSubtle,
                  }}>
                    {m.icon}
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[12px]" style={{ fontWeight: 500, color: selectedMethod === m.key ? dk.textSecondary : dk.textMuted }}>
                      {m.label}
                    </span>
                    <span className="text-[9px] text-center" style={{ fontWeight: 400, color: dk.textDisabled }}>
                      {m.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Method details */}
          {selectedMethod === "pix" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ backgroundColor: dk.successBg, border: `1px solid ${dk.successBorder}` }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>Chave PIX</span>
                  <span className="text-[13px] text-[#34C759] tabular-nums" style={{ fontWeight: 500 }}>
                    {STUDIO_PIX_KEY}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(STUDIO_PIX_KEY, "Chave PIX")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer active:scale-[0.97]"
                  style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
                >
                  <Copy className="w-3 h-3" />
                  Copiar chave
                </button>
              </div>
              {/* QR Code mock */}
              <div className="flex items-center justify-center py-4">
                <div className="w-[140px] h-[140px] rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted, border: `1px solid ${dk.border}` }}>
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="w-12 h-12" style={{ color: dk.textDisabled }} />
                    <span className="text-[9px]" style={{ fontWeight: 400, color: dk.textDisabled }}>QR Code PIX</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(pixPayload, "Codigo PIX")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition-colors cursor-pointer"
                style={{ fontWeight: 500, border: `1px solid ${dk.border}`, color: dk.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = dk.isDark ? "#48484A" : "#D1D1D6"; e.currentTarget.style.color = dk.textSecondary; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = dk.border; e.currentTarget.style.color = dk.textMuted; }}
              >
                <Copy className="w-3 h-3" />
                Copiar codigo PIX copia e cola
              </button>
            </div>
          )}

          {selectedMethod === "link" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ backgroundColor: dk.bgMuted, border: `1px solid ${dk.border}` }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#007AFF]" style={{ fontWeight: 500 }}>Link de pagamento</span>
                  <span className="text-[12px] text-[#007AFF] break-all" style={{ fontWeight: 500 }}>
                    {paymentLink}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentLink, "Link")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer active:scale-[0.97] shrink-0 ml-3"
                  style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
                >
                  <Copy className="w-3 h-3" />
                  Copiar link
                </button>
              </div>
              <span className="text-[10px] text-center" style={{ fontWeight: 400, color: dk.textDisabled }}>
                O cliente podera pagar com cartao de credito ou debito
              </span>
            </div>
          )}

          {selectedMethod === "boleto" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ backgroundColor: dk.bgMuted, border: `1px solid ${dk.border}` }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textSubtle }}>Boleto bancario</span>
                  <span className="text-[12px] break-all" style={{ fontWeight: 500, color: dk.textTertiary }}>
                    {boletoLink}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(boletoLink, "Boleto")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer active:scale-[0.97] shrink-0 ml-3"
                  style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
                >
                  <Copy className="w-3 h-3" />
                  Copiar boleto
                </button>
              </div>
              <span className="text-[10px] text-center" style={{ fontWeight: 400, color: dk.textDisabled }}>
                Boleto com vencimento em {item.vencimento} (v1 mock)
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${dk.hairline}` }}>
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>
            v1 · dados mock
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 500, color: dk.textTertiary }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgMuted; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Cancelar
            </button>
            <button
              onClick={() => onEmit(selectedMethod)}
              className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
              style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Gerar cobranca
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Modal "Enviar cobranca"                            */
/* ═══════════════════════════════════════════════════ */

function EnviarCobrancaModal({
  item,
  onClose,
  onSend,
}: {
  item: CobrancaItem;
  onClose: () => void;
  onSend: () => void;
}) {
  const dk = useDk();
  const [tone, setTone] = useState<"profissional" | "premium">("profissional");
  const link =
    item.chargeMethod === "pix"
      ? `PIX: ${STUDIO_PIX_KEY}`
      : item.chargeMethod === "boleto"
        ? `https://boleto.essyn.com.br/b/${item.id.slice(0, 8)}`
        : `https://pay.essyn.com.br/c/${item.id.slice(0, 8)}`;

  const message = buildMessage(item, tone, link);

  const btnPrimBg = dk.isDark ? "#F5F5F7" : "#1D1D1F";
  const btnPrimText = dk.isDark ? "#1D1D1F" : "#FFFFFF";
  const btnPrimHover = dk.isDark ? "#E5E5EA" : "#3C3C43";

  function copyMessage() {
    navigator.clipboard.writeText(message).then(() => {
      toast.success("Mensagem copiada!");
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "#1D1D1F", opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springDefault}
        className="relative w-full max-w-[560px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowModal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#F5F5F7" : "#48484A" }}>
              Enviar cobranca
            </span>
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              {item.projeto} · {item.parcela} · {fmtCurrency(item.valor)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: dk.textSubtle }}
            onMouseEnter={(e) => { e.currentTarget.style.color = dk.textTertiary; e.currentTarget.style.backgroundColor = dk.bgMuted; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = dk.textSubtle; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Receivable summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: dk.bgMuted }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bg }}>
              <Send className="w-3.5 h-3.5" style={{ color: dk.textSubtle }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>
                  {item.cliente}
                </span>
                <StatusBadge status={item.status} size="sm" showDot />
              </div>
              <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                Vencimento: {item.vencimento}
                {item.chargeMethod && ` · ${item.chargeMethod.toUpperCase()}`}
                {item.sentCount > 0 && ` · ${item.sentCount}x enviado`}
              </span>
            </div>
            <span className="text-[14px] tabular-nums shrink-0" style={{ fontWeight: 600, color: dk.textSecondary }}>
              {fmtCurrency(item.valor)}
            </span>
          </div>

          {/* Tone selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                Tom da mensagem
              </span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }} />
                <span className="text-[10px]" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>
                  Sugestao IA
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {(["profissional", "premium"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="flex-1 py-2 rounded-xl text-[12px] border transition-all cursor-pointer"
                  style={{
                    fontWeight: 500,
                    backgroundColor: tone === t ? dk.bgMuted : "transparent",
                    borderColor: dk.border,
                    color: tone === t ? dk.textSecondary : dk.textMuted,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Message preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
              Mensagem
            </span>
            <div className="relative">
              <textarea
                value={message}
                readOnly
                className="w-full h-[180px] px-4 py-3 rounded-xl text-[12px] resize-none focus:outline-none transition-colors"
                style={{ fontWeight: 400, lineHeight: 1.7, color: dk.textSecondary, backgroundColor: dk.bgSub, border: `1px solid ${dk.border}` }}
              />
            </div>
          </div>

          {/* Channel indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: dk.successBg, border: `1px solid ${dk.successBorder}` }}>
              <MessageCircle className="w-3 h-3 text-[#34C759]" />
              <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: dk.bgMuted, border: `1px solid ${dk.border}` }}>
              <Mail className="w-3 h-3 text-[#007AFF]" />
              <span className="text-[10px] text-[#007AFF]" style={{ fontWeight: 500 }}>E-mail</span>
            </div>
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>
              Copie e envie pelo canal de sua preferencia
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${dk.hairline}` }}>
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>
            {item.sentCount > 0 ? `Ultimo envio: ${item.lastSentAtISO || "\u2014"}` : "Primeiro envio"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={copyMessage}
              className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
              style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
            >
              <span className="flex items-center gap-1.5">
                <Copy className="w-3 h-3" />
                Copiar mensagem
              </span>
            </button>
            <button
              onClick={onSend}
              className="px-4 py-2 rounded-xl text-[12px] border transition-colors cursor-pointer"
              style={{ fontWeight: 500, borderColor: dk.border, color: dk.textTertiary }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgMuted; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Marcar como enviado
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function CobrancaContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projectId: string) => void;
}) {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [chargeFilter, setChargeFilter] = useState<ChargeFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());
  const [emitModalItem, setEmitModalItem] = useState<CobrancaItem | null>(null);
  const [enviarModalItem, setEnviarModalItem] = useState<CobrancaItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Data ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => buildCobrancaItems(), [refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Filter by charge status / parcela status
      if (chargeFilter !== "all") {
        if (chargeFilter === "vencida" && item.status !== "vencida") return false;
        if (chargeFilter === "vence_hoje" && item.status !== "vence_hoje") return false;
        if (chargeFilter === "nao_emitida" && item.chargeStatus !== "nao_emitida") return false;
        if (chargeFilter === "emitida" && item.chargeStatus !== "emitida") return false;
        if (
          chargeFilter === "enviada" &&
          item.chargeStatus !== "enviada" &&
          item.chargeStatus !== "reenvio_sugerido"
        )
          return false;
      }
      // Search
      if (search) {
        const q = search.toLowerCase();
        return (
          item.projeto.toLowerCase().includes(q) ||
          item.cliente.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, chargeFilter, search]);

  /* ── Filter counts ── */
  const counts: Record<ChargeFilter, number> = useMemo(() => ({
    all: items.length,
    vencida: items.filter((i) => i.status === "vencida").length,
    vence_hoje: items.filter((i) => i.status === "vence_hoje").length,
    nao_emitida: items.filter((i) => i.chargeStatus === "nao_emitida").length,
    emitida: items.filter((i) => i.chargeStatus === "emitida").length,
    enviada: items.filter(
      (i) => i.chargeStatus === "enviada" || i.chargeStatus === "reenvio_sugerido",
    ).length,
  }), [items]);

  /* ── KPIs ── */
  const totalACobrar = items.reduce((s, i) => s + i.valor, 0);
  const totalVencido = items
    .filter((i) => i.status === "vencida")
    .reduce((s, i) => s + i.valor, 0);
  const cobrancasEnviadas = items.filter(
    (i) => i.chargeStatus === "enviada" || i.chargeStatus === "reenvio_sugerido",
  ).length;
  const taxaEmissao =
    items.length > 0
      ? Math.round(
          ((items.filter(
            (i) =>
              i.chargeStatus === "emitida" ||
              i.chargeStatus === "enviada" ||
              i.chargeStatus === "reenvio_sugerido",
          ).length) /
            items.length) *
            100,
        )
      : 0;

  /* ── Selection ── */
  const filteredIds = filtered.map((p) => p.id);
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
  const handleEmitCobranca = useCallback(
    (item: CobrancaItem, method: ChargeMethod) => {
      setChargeState(item.id, {
        chargeStatus: "emitida",
        chargeMethod: method,
        pixKey: method === "pix" ? STUDIO_PIX_KEY : undefined,
        pixQrPayload: method === "pix" ? `pix-mock-${item.id}` : undefined,
        paymentLinkUrl: method === "link" ? `https://pay.essyn.com.br/c/${item.id.slice(0, 8)}` : undefined,
        boletoUrl: method === "boleto" ? `https://boleto.essyn.com.br/b/${item.id.slice(0, 8)}` : undefined,
      });
      setEmitModalItem(null);
      toast.success("Cobranca emitida com sucesso!");
      refresh();
    },
    [refresh],
  );

  const handleEnviarCobranca = useCallback(
    (item: CobrancaItem) => {
      const existing = getChargeState(item.id);
      setChargeState(item.id, {
        chargeStatus: "enviada",
        lastSentAtISO: TODAY_ISO,
        sentCount: (existing.sentCount || 0) + 1,
      });
      setEnviarModalItem(null);
      toast.success("Cobranca marcada como enviada!");
      refresh();
    },
    [refresh],
  );

  const handleMarcarPago = useCallback(
    (ids: string[]) => {
      // Mark in paymentPlanSync paid IDs
      try {
        const raw = localStorage.getItem("essyn:paidParcelaIds");
        const paidSet: Set<string> = raw ? new Set(JSON.parse(raw)) : new Set();
        for (const id of ids) paidSet.add(id);
        localStorage.setItem("essyn:paidParcelaIds", JSON.stringify([...paidSet]));
      } catch { /* ignore */ }
      clearSelection();
      toast.success(`${ids.length} parcela${ids.length > 1 ? "s" : ""} marcada${ids.length > 1 ? "s" : ""} como paga${ids.length > 1 ? "s" : ""}!`);
      refresh();
    },
    [clearSelection, refresh],
  );

  const handleBulkEmit = useCallback(() => {
    for (const id of selectedIds) {
      setChargeState(id, { chargeStatus: "emitida", chargeMethod: "pix" });
    }
    toast.success(`${selectedIds.size} cobranca${selectedIds.size > 1 ? "s" : ""} emitida${selectedIds.size > 1 ? "s" : ""}!`);
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  const handleBulkSend = useCallback(() => {
    for (const id of selectedIds) {
      const existing = getChargeState(id);
      setChargeState(id, {
        chargeStatus: "enviada",
        lastSentAtISO: TODAY_ISO,
        sentCount: (existing.sentCount || 0) + 1,
      });
    }
    toast.success(`${selectedIds.size} cobranca${selectedIds.size > 1 ? "s" : ""} enviada${selectedIds.size > 1 ? "s" : ""}!`);
    clearSelection();
    refresh();
  }, [selectedIds, clearSelection, refresh]);

  /* ── QuickActionsBar config ── */
  const quickActions: QuickAction[] = [
    { label: "Emitir cobranca", icon: <Send className="w-3 h-3" /> },
    { label: "Enviar cobranca", icon: <MessageCircle className="w-3 h-3" /> },
    { label: "Reenviar", icon: <RotateCcw className="w-3 h-3" /> },
    { label: "Exportar", icon: <Download className="w-3 h-3" /> },
    { label: "Marcar como pago", icon: <Check className="w-3 h-3" /> },
    { label: "Configurar PIX", icon: <Settings2 className="w-3 h-3" /> },
  ];

  /* ── BulkActionsBar config ── */
  const bulkActions: BulkAction[] = [
    { label: "Emitir em lote", icon: <Send className="w-3 h-3" />, onClick: handleBulkEmit },
    { label: "Enviar em lote", icon: <MessageCircle className="w-3 h-3" />, onClick: handleBulkSend },
    { label: "Exportar", icon: <Download className="w-3 h-3" />, onClick: clearSelection },
    {
      label: "Marcar pago",
      icon: <Check className="w-3 h-3" />,
      onClick: () => handleMarcarPago([...selectedIds]),
    },
  ];

  /* ── Row Tags builder (max 4) ── */
  function buildTags(item: CobrancaItem) {
    const tags: { label: string; variant: TagVariant }[] = [];
    // 1. Metodo
    if (item.chargeMethod) {
      tags.push({
        label: item.chargeMethod === "pix" ? "PIX" : item.chargeMethod === "link" ? "Link" : "Boleto",
        variant: item.chargeMethod === "pix" ? "success" : item.chargeMethod === "link" ? "info" : "neutral",
      });
    } else {
      tags.push({ label: item.metodo, variant: metodoVariant(item.metodo) });
    }
    // 2. Charge status
    if (item.chargeStatus !== "nao_emitida") {
      tags.push({ label: chargeTagLabel(item.chargeStatus), variant: chargeTagVariant(item.chargeStatus) });
    }
    // 3. NF
    if (item.nf === "emitida") tags.push({ label: "NF", variant: "success" });
    else if (item.nf === "pendente") tags.push({ label: "NF pend.", variant: "warning" });
    // 4. Sent count
    if (item.sentCount > 1) {
      tags.push({ label: `${item.sentCount}x`, variant: "neutral" });
    }
    return tags.slice(0, 4);
  }

  /* ── CTA per item ── */
  function ctaForItem(item: CobrancaItem): { label: string; icon: React.ReactNode; action: () => void } {
    switch (item.chargeStatus) {
      case "nao_emitida":
        return { label: "Emitir", icon: <Send className="w-3 h-3" />, action: () => setEmitModalItem(item) };
      case "emitida":
        return { label: "Enviar", icon: <MessageCircle className="w-3 h-3" />, action: () => setEnviarModalItem(item) };
      case "enviada":
        return { label: "Ver", icon: <Eye className="w-3 h-3" />, action: () => setEnviarModalItem(item) };
      case "reenvio_sugerido":
        return { label: "Reenviar", icon: <RotateCcw className="w-3 h-3" />, action: () => setEnviarModalItem(item) };
      default:
        return { label: "Ver", icon: <Eye className="w-3 h-3" />, action: () => {} };
    }
  }

  /* ── Menu items per row ── */
  function menuForItem(item: CobrancaItem): string[] {
    const m = ["Copiar mensagem", "Marcar pago", "Anexar comprovante", "Ver historico"];
    if (item.chargeStatus === "emitida") m.unshift("Enviar cobranca");
    if (item.chargeStatus === "enviada" || item.chargeStatus === "reenvio_sugerido") m.unshift("Reenviar cobranca");
    if (item.chargeStatus === "nao_emitida") m.unshift("Emitir cobranca");
    return m;
  }

  /* ── Alert counts ── */
  const vencidasCount = counts.vencida;
  const naoEmitidasVencidas = items.filter(
    (i) => i.status === "vencida" && i.chargeStatus === "nao_emitida",
  ).length;

  /* ── Primary button tokens ── */
  const btnPrimBg = dk.isDark ? "#F5F5F7" : "#1D1D1F";
  const btnPrimText = dk.isDark ? "#1D1D1F" : "#FFFFFF";
  const btnPrimHover = dk.isDark ? "#E5E5EA" : "#3C3C43";

  /* ── Dynamic filter defs ── */
  const filterDefs = getFilterDefs(dk.isDark);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header Financeiro ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1
            className="text-[22px] tracking-tight"
            style={{ fontWeight: 600, color: dk.textPrimary }}
          >
            Financeiro
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px]"
              style={{ fontWeight: 500, color: dk.textMuted }}
            >
              Cobranca
            </span>
            <span className="w-px h-3" style={{ backgroundColor: dk.hairline }} />
            <span
              className="text-[12px]"
              style={{ fontWeight: 400, color: dk.textDisabled }}
            >
              {items.length} pendente{items.length !== 1 ? "s" : ""} · PIX / Link / Boleto
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dk.textDisabled }} />
            <input
              type="text"
              placeholder="Buscar cliente ou projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px] pr-8 py-1.5 rounded-xl text-[12px] focus:outline-none focus:ring-2 transition-all"
              style={{
                fontWeight: 400,
                paddingLeft: "2rem",
                color: dk.textSecondary,
                backgroundColor: dk.bg,
                border: `1px solid ${dk.border}`,
                boxShadow: `0 0 0 0px ${dk.bgMuted}`,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = dk.isDark ? "#48484A" : "#D1D1D6"; e.currentTarget.style.boxShadow = `0 0 0 2px ${dk.bgMuted}`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = dk.border; e.currentTarget.style.boxShadow = "none"; }}
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
          {/* CTA primario */}
          <button
            onClick={() => {
              const first = filtered.find((i) => i.chargeStatus === "nao_emitida");
              if (first) setEmitModalItem(first);
              else toast("Nenhum recebivel pendente de emissao");
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText, boxShadow: dk.shadowCard }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
          >
            <Send className="w-3.5 h-3.5" />
            Emitir cobranca
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.hairline }} />
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
              <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ backgroundColor: dk.isDark ? "#2C2C2E" : "#E5E5EA" }} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ backgroundColor: dk.isDark ? "#2C2C2E" : "#E5E5EA" }} />
            ))}
          </div>
          <div className="flex items-center justify-center py-4 gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
              Carregando cobrancas...
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
          <div className="flex flex-col items-center gap-1 max-w-[300px]">
            <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
              Erro ao carregar cobrancas
            </span>
            <span
              className="text-[12px] text-center"
              style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}
            >
              Nao foi possivel buscar os recebiveis pendentes. Tente novamente.
            </span>
          </div>
          <button
            onClick={() => setViewState("ready")}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
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
            <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
              Nenhuma cobranca pendente
            </span>
            <span
              className="text-[12px] text-center"
              style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}
            >
              Todos os clientes estao em dia. As cobrancas aparecerão aqui quando houver recebiveis vencidos ou proximos do vencimento.
            </span>
          </div>
          <button
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
          >
            <Send className="w-3.5 h-3.5" />
            Emitir cobranca
          </button>
        </div>
      )}

      {/* ═══ Ready ═══ */}
      {viewState === "ready" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Total a cobrar"
              value={fmtCurrency(totalACobrar)}
              icon={<Send className="w-3.5 h-3.5" style={{ color: dk.textSubtle }} />}
              sub={`${items.length} parcela${items.length !== 1 ? "s" : ""} pendente${items.length !== 1 ? "s" : ""}`}
            />
            <KpiCard
              label="Vencido"
              value={fmtCurrency(totalVencido)}
              icon={<AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" />}
              sub={`${vencidasCount} parcela${vencidasCount !== 1 ? "s" : ""} em atraso`}
            />
            <KpiCard
              label="Cobrancas enviadas"
              value={String(cobrancasEnviadas)}
              icon={<MessageCircle className="w-3.5 h-3.5 text-[#34C759]" />}
              sub="neste periodo"
            />
            <KpiCard
              label="Taxa de emissao"
              value={`${taxaEmissao}%`}
              icon={<Send className="w-3.5 h-3.5 text-[#007AFF]" />}
              tooltip="Percentual de recebiveis com cobranca emitida ou enviada."
              sub="cobrancas emitidas vs. total"
            />
          </div>

          {/* P04: AlertBanners — max 2 */}
          <AnimatePresence>
            {naoEmitidasVencidas > 0 && !alertsDismissed.has("nao_emitidas") && (
              <AlertBanner
                key="alert-nao-emitidas"
                variant="danger"
                title={`${naoEmitidasVencidas} parcela${naoEmitidasVencidas > 1 ? "s" : ""} vencida${naoEmitidasVencidas > 1 ? "s" : ""} sem cobranca emitida`}
                desc="Recebiveis atrasados sem cobranca geram atraso no fluxo de caixa. Emita as cobrancas agora."
                ctaLabel="Emitir cobrancas"
                cta={() => {
                  setChargeFilter("nao_emitida");
                  dismissAlert("nao_emitidas");
                }}
                dismissible
                onDismiss={() => dismissAlert("nao_emitidas")}
              />
            )}
            {counts.enviada > 0 &&
              items.some((i) => i.chargeStatus === "reenvio_sugerido") &&
              !alertsDismissed.has("reenviar") && (
                <AlertBanner
                  key="alert-reenviar"
                  variant="warning"
                  title="Cobrancas enviadas com parcelas ainda vencidas"
                  desc="Considere reenviar a cobranca ou entrar em contato direto com o cliente."
                  ctaLabel="Ver cobrancas"
                  cta={() => {
                    setChargeFilter("enviada");
                    dismissAlert("reenviar");
                  }}
                  dismissible
                  onDismiss={() => dismissAlert("reenviar")}
                />
              )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setChargeFilter("all");
                clearSelection();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer"
              style={{
                fontWeight: 500,
                backgroundColor: chargeFilter === "all" ? dk.bgMuted : dk.bg,
                borderColor: dk.border,
                color: chargeFilter === "all" ? dk.textSecondary : dk.textMuted,
              }}
            >
              <Filter className="w-3 h-3" />
              Todas
              <span
                className="text-[11px] tabular-nums"
                style={{
                  fontWeight: 600,
                  color: chargeFilter === "all" ? dk.textMuted : dk.textDisabled,
                }}
              >
                {items.length}
              </span>
            </button>
            <span className="w-px h-5" style={{ backgroundColor: dk.hairline }} />
            {filterDefs.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                count={counts[f.key] || 0}
                active={chargeFilter === f.key}
                dot={f.dot}
                chipBg={f.chipBg}
                chipText={f.chipText}
                chipBorder={f.chipBorder}
                onClick={() => {
                  setChargeFilter(chargeFilter === f.key ? "all" : f.key);
                  clearSelection();
                }}
              />
            ))}
          </div>

          {/* P02: BulkActionsBar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <BulkActionsBar
                key="bulk-bar"
                count={selectedIds.size}
                actions={bulkActions}
                onClear={clearSelection}
              />
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            {/* Header row */}
            <div className="grid grid-cols-[28px_0.5fr_1.6fr_0.5fr_0.65fr_1.1fr_0.65fr_0.5fr_88px] gap-3 px-5 py-2.5 items-center" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
              <RowSelectCheckbox
                state={headerCheckboxState}
                onChange={toggleAll}
                alwaysVisible
                size="sm"
              />
              {["Tipo", "Projeto / Cliente", "Parcela", "Vencimento", "Tags", "Valor", "Status"].map((h) => (
                <span key={h} className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>
                  {h}
                </span>
              ))}
              <span className="text-[10px] uppercase tracking-[0.06em] text-right" style={{ fontWeight: 600, color: dk.textSubtle }}>
                Acao
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const cta = ctaForItem(item);
                  const tags = buildTags(item);
                  return (
                    <CobrancaRow
                      key={item.id}
                      item={item}
                      cta={cta}
                      tags={tags}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={toggleSelect}
                      onNavigateToProject={onNavigateToProject}
                      menuItems={menuForItem(item)}
                      onMenuAction={(action) => {
                        if (action === "Emitir cobranca") setEmitModalItem(item);
                        else if (action === "Enviar cobranca" || action === "Reenviar cobranca")
                          setEnviarModalItem(item);
                        else if (action === "Marcar pago") handleMarcarPago([item.id]);
                        else if (action === "Copiar mensagem") {
                          const link =
                            item.chargeMethod === "pix"
                              ? `PIX: ${STUDIO_PIX_KEY}`
                              : `https://pay.essyn.com.br/c/${item.id.slice(0, 8)}`;
                          navigator.clipboard.writeText(buildMessage(item, "profissional", link));
                          toast.success("Mensagem copiada!");
                        }
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
                  <CircleCheck className="w-8 h-8 text-[#34C759]" />
                  <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textSubtle }}>
                    Nenhuma cobranca encontrada
                  </span>
                  <span className="text-[11px]" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>
                    Ajuste os filtros ou busca para ver resultados
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer summary */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                {filtered.length} cobranca{filtered.length !== 1 ? "s" : ""}
                {selectedIds.size > 0 && (
                  <> · <span style={{ fontWeight: 500, color: dk.textMuted }}>
                    {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
                    {" "}({fmtCurrency(filtered.filter((i) => selectedIds.has(i.id)).reduce((s, i) => s + i.valor, 0))})
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
        {emitModalItem && (
          <EmitirCobrancaModal
            key="emitir-modal"
            item={emitModalItem}
            onClose={() => setEmitModalItem(null)}
            onEmit={(method) => handleEmitCobranca(emitModalItem, method)}
          />
        )}
        {enviarModalItem && (
          <EnviarCobrancaModal
            key="enviar-modal"
            item={enviarModalItem}
            onClose={() => setEnviarModalItem(null)}
            onSend={() => handleEnviarCobranca(enviarModalItem)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CobrancaRow — Inline table row                     */
/* ═══════════════════════════════════════════════════ */

const CobrancaRow = forwardRef<HTMLDivElement, {
  item: CobrancaItem;
  cta: { label: string; icon: React.ReactNode; action: () => void };
  tags: { label: string; variant: TagVariant }[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onNavigateToProject?: (projectId: string) => void;
  menuItems: string[];
  onMenuAction: (action: string) => void;
}>(function CobrancaRow({
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

  const btnPrimBg = dk.isDark ? "#F5F5F7" : "#1D1D1F";
  const btnPrimText = dk.isDark ? "#1D1D1F" : "#FFFFFF";
  const btnPrimHover = dk.isDark ? "#E5E5EA" : "#3C3C43";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-[28px_0.5fr_1.6fr_0.5fr_0.65fr_1.1fr_0.65fr_0.5fr_88px] gap-3 px-5 py-3 transition-colors group items-center"
      style={{
        borderBottom: `1px solid ${dk.hairline}`,
        backgroundColor: selected ? dk.bgActive : "transparent",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = dk.bgHover; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {/* Checkbox */}
      <RowSelectCheckbox
        state={selected ? "checked" : "unchecked"}
        onChange={() => onToggleSelect(item.id)}
        size="sm"
      />

      {/* TypeBadge */}
      <TypeBadge variant="receber" />

      {/* Projeto / Cliente */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigateToProject?.(item.projectId)}
            className="text-[13px] truncate hover:underline underline-offset-2 cursor-pointer text-left"
            style={{ fontWeight: 500, color: dk.isDark ? "#F5F5F7" : "#48484A", textDecorationColor: dk.border }}
          >
            {item.projeto}
          </button>
          {item.diasAtraso && item.diasAtraso > 0 && (
            <span
              className="shrink-0 text-[9px] text-[#FF3B30] px-1.5 py-[1px] rounded-md"
              style={{ fontWeight: 600, backgroundColor: dk.bgMuted }}
            >
              {item.diasAtraso}d atraso
            </span>
          )}
        </div>
        <span
          className="text-[11px] truncate"
          style={{ fontWeight: 400, color: dk.textSubtle }}
        >
          {item.cliente}
          {item.sentCount > 0 && (
            <>
              {" · "}
              <Clock className="w-2.5 h-2.5 inline -mt-px" style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }} />
              {" "}{item.sentCount}x enviado
            </>
          )}
        </span>
      </div>

      {/* Parcela */}
      <span
        className="text-[12px] truncate"
        style={{ fontWeight: 400, color: dk.textMuted }}
      >
        {item.parcela}
      </span>

      {/* Vencimento */}
      <span
        className="text-[12px] tabular-nums truncate"
        style={{
          fontWeight: 400,
          color:
            item.status === "vencida"
              ? "#FF3B30"
              : item.status === "vence_hoje"
                ? "#FF9500"
                : dk.textMuted,
        }}
      >
        {item.vencimento}
      </span>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((t, i) => (
          <TagPill key={`${t.label}-${i}`} variant={t.variant}>
            {t.label}
          </TagPill>
        ))}
      </div>

      {/* Valor */}
      <span
        className="text-[13px] tabular-nums"
        style={{ fontWeight: 600, color: dk.textSecondary }}
      >
        {fmtCurrency(item.valor)}
      </span>

      {/* Status */}
      <StatusBadge status={item.status} size="sm" showDot />

      {/* CTA + Menu */}
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={cta.action}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer active:scale-[0.97]"
          style={{ fontWeight: 500, backgroundColor: btnPrimBg, color: btnPrimText, boxShadow: dk.shadowCard }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnPrimHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnPrimBg; }}
        >
          {cta.icon}
          {cta.label}
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = dk.textMuted; e.currentTarget.style.backgroundColor = dk.bgMuted; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = dk.isDark ? "#3C3C43" : "#E5E5EA"; e.currentTarget.style.backgroundColor = "transparent"; }}
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
                className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl py-1 overflow-hidden"
                style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadow }}
              >
                {menuItems.map((mi) => (
                  <button
                    key={mi}
                    onClick={() => {
                      onMenuAction(mi);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer"
                    style={{ fontWeight: 400, color: dk.textTertiary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgActive; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
  );
});
