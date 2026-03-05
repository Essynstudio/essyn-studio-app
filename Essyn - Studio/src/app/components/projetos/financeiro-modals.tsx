/**
 * financeiro-modals.tsx — Financial sub-components & modals
 * Extracted from ProjetoDrawer.tsx for modularity.
 */
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  CircleCheck,
  CreditCard,
  DollarSign,
  Send,
  Paperclip,
  CalendarClock,
  Receipt,
  ArrowDownRight,
  ArrowRightLeft,
  Download,
  MoreVertical,
  Check,
  LoaderCircle,
  Copy,
  ClipboardCheck,
  FolderPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  springDefault,
  springBounce,
  linearSpin,
  withDelay,
} from "../../lib/motion-tokens";
import { toast } from "sonner";
import type { Projeto } from "./projetosData";
import { StatusBadge } from "../ui/status-badge";
import { TagPill } from "../ui/tag-pill";
import { TypeBadge } from "../ui/type-badge";
import {
  getPersistedPlans,
  upsertPaymentPlan,
  syncProjectPaymentPlanToFinance,
  loadPaidIds as loadPaidIdsFromStorage,
  savePaidIds as savePaidIdsToStorage,
  fmtBRL as fmtBRLSync,
  FORMA_PAGAMENTO_LABELS,
  markParcelaConciliada,
  loadConciliadaIds as loadConciliadaIdsFromStorage,
  getNfState,
  setNfState,
  type PaymentPlan,
  type FormaPagamento as SyncFormaPagamento,
  type GeneratedParcela,
} from "./paymentPlanSync";
import {
  getPayoutsByProject,
  createPayout,
  markPayoutPaid,
  centsToBRL,
  type Payout,
  type PayoutMethod,
  ROLE_OPTIONS,
} from "../financeiro/payoutStore";
import { DrawerCard, DrawerCardRow } from "./drawer-primitives";
import { useDk } from "../../lib/useDarkColors";

/* ── Financial types ── */

export type ParcelaStatus = "paga" | "vencida" | "a_vencer" | "hoje";

export interface ParcelaMock {
  id: string;
  numero: number;
  valor: string;
  valorNum: number;
  vencimento: string;
  vencimentoISO: string;
  status: ParcelaStatus;
  metodoPagamento?: string;
  dataPagamento?: string;
}

export function parseValor(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

export function formatBRL(n: number): string {
  if (n >= 1000) {
    const intPart = Math.floor(n);
    return `R$ ${intPart.toLocaleString("pt-BR")}`;
  }
  return `R$ ${n}`;
}

export function buildMockParcelas(projeto: Projeto): ParcelaMock[] {
  const rawTotal = projeto.financeiro.parcelas;
  if (rawTotal === 0) return [];
  const total = Math.max(6, rawTotal);
  const rawPagas = projeto.financeiro.pagas;
  const rawVencidas = projeto.financeiro.vencidas;
  const pagas = Math.min(Math.round((rawPagas / rawTotal) * total), total - 1);
  const vencidas = Math.min(Math.round((rawVencidas / rawTotal) * total), total - pagas - 1);
  const valorTotal = parseValor(projeto.valor);
  const valorParcela = Math.round(valorTotal / total);
  const baseDate = new Date(projeto.dataISO);
  const hojeIndex = pagas + vencidas;

  return Array.from({ length: total }, (_, i) => {
    const isPaid = i < pagas;
    const isOverdue = !isPaid && i < pagas + vencidas;
    const isToday = i === hojeIndex && !isPaid && !isOverdue;
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + (i - 1) * 30 - 15);
    const venc = dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    const val = i === total - 1 ? valorTotal - valorParcela * (total - 1) : valorParcela;
    let status: ParcelaStatus = "a_vencer";
    if (isPaid) status = "paga";
    else if (isOverdue) status = "vencida";
    else if (isToday) status = "hoje";
    return {
      id: `parc-${i + 1}`, numero: i + 1, valor: formatBRL(val), valorNum: val,
      vencimento: isToday ? "Hoje" : venc, vencimentoISO: dueDate.toISOString().slice(0, 10), status,
      metodoPagamento: isPaid ? ["PIX", "Transferência", "Cartão", "Boleto"][i % 4] : undefined,
      dataPagamento: isPaid ? new Date(dueDate.getTime() - Math.random() * 3 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : undefined,
    };
  });
}

/* ── syncedToParcelaMock helper ── */

export function syncedToParcelaMock(p: GeneratedParcela): ParcelaMock & { _conciliada?: boolean; _nfStatus?: string } {
  const statusMap: Record<string, ParcelaStatus> = { paga: "paga", vencida: "vencida", vence_hoje: "hoje", prevista: "a_vencer", conciliada: "paga", cancelada: "a_vencer" };
  return { id: p.id, numero: p.numero, valor: formatBRL(p.valor), valorNum: p.valor, vencimento: p.vencimentoDisplay, vencimentoISO: p.vencimento, status: statusMap[p.status] || "a_vencer", metodoPagamento: p.formaPagamento.toUpperCase(), dataPagamento: p.dataPagamento, _conciliada: p.status === "conciliada", _nfStatus: p.nfStatus };
}

/* ── Parcela actions dropdown ── */

export function ParcelaActionsMenu({ parcela, open, onToggle, onAction }: { parcela: ParcelaMock; open: boolean; onToggle: () => void; onAction: (action: string, parcela: ParcelaMock) => void }) {
  const dk = useDk();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onToggle(); } if (open) document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, [open, onToggle]);
  const isConciliada = (parcela as any)._conciliada === true;
  const actions = parcela.status === "paga"
    ? [
        { id: "comprovante", icon: <Download className="w-3 h-3" />, label: "Baixar comprovante", variant: "default" as const },
        ...(isConciliada ? [] : [{ id: "conciliar", icon: <ArrowRightLeft className="w-3 h-3" />, label: "Marcar como conciliada", variant: "default" as const }]),
        { id: "emitir_nf", icon: <Receipt className="w-3 h-3" />, label: "Emitir NF", variant: "default" as const },
        { id: "estornar", icon: <RefreshCw className="w-3 h-3" />, label: "Estornar pagamento", variant: "danger" as const },
      ]
    : [
        { id: "pagar", icon: <CircleCheck className="w-3 h-3" />, label: "Marcar como pago", variant: "success" as const },
        { id: "remarcar", icon: <CalendarClock className="w-3 h-3" />, label: "Remarcar vencimento", variant: "default" as const },
        { id: "anexar", icon: <Paperclip className="w-3 h-3" />, label: "Anexar comprovante", variant: "default" as const },
      ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle} className="p-1 rounded-lg transition-colors cursor-pointer" style={{ backgroundColor: open ? dk.bgMuted : "transparent", color: open ? dk.textMuted : dk.textDisabled }}><MoreVertical className="w-3.5 h-3.5" /></button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-[200px] rounded-xl border py-1 overflow-hidden" style={{ borderColor: dk.border, backgroundColor: dk.bg, boxShadow: dk.shadowModal }}>
          {actions.map((a) => (
            <button key={a.id} onClick={() => { onAction(a.id, parcela); onToggle(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 400, color: a.variant === "danger" ? "#FF3B30" : a.variant === "success" ? "#34C759" : dk.textTertiary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Parcela row ── */

export function ParcelaRow({ parcela, total, menuOpenId, onMenuToggle, onAction }: { parcela: ParcelaMock; total: number; menuOpenId: string | null; onMenuToggle: (id: string | null) => void; onAction: (action: string, parcela: ParcelaMock) => void }) {
  const dk = useDk();
  const isPaid = parcela.status === "paga";
  const isOverdue = parcela.status === "vencida";
  const isToday = parcela.status === "hoje";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: dk.hairline, backgroundColor: (isOverdue || isToday) ? dk.bgSub : "transparent" }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: (isPaid || isOverdue) ? dk.bgMuted : "transparent", border: (!isPaid && !isOverdue) ? `1px solid ${dk.border}` : undefined }}>
        {isPaid ? <CircleCheck className="w-3.5 h-3.5 text-[#34C759]" /> : isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" /> : isToday ? <Clock className="w-3 h-3 text-[#007AFF]" /> : <span className="text-[9px] numeric" style={{ fontWeight: 600, color: dk.textDisabled }}>{parcela.numero}</span>}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <TypeBadge variant="receber" />
          <span className="text-[13px]" style={{ fontWeight: 450, color: isPaid ? dk.textMuted : isOverdue ? "#FF3B30" : isToday ? "#007AFF" : dk.textSecondary }}>Parcela {parcela.numero}/{total}</span>
          {(parcela as any)._conciliada ? <StatusBadge status="conciliada" /> : isPaid ? <StatusBadge status="paga" /> : null}
          {isOverdue && <StatusBadge status="vencida" />}
          {isToday && <StatusBadge status="vence_hoje" />}
          {parcela.status === "a_vencer" && <StatusBadge status="prevista" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ fontWeight: 400, color: isToday ? "#007AFF" : dk.textDisabled }}>{isPaid ? `Pago em ${parcela.dataPagamento}` : parcela.vencimento}</span>
          {parcela.metodoPagamento && <TagPill variant={isPaid ? "success" : "neutral"}>{parcela.metodoPagamento}</TagPill>}
          {isPaid && (parcela as any)._nfStatus && (parcela as any)._nfStatus !== "na" && (
            <TagPill variant={(parcela as any)._nfStatus === "emitida" ? "success" : (parcela as any)._nfStatus === "enviado_contador" ? "info" : "warning"} size="xs">
              {(parcela as any)._nfStatus === "emitida" ? "NF" : (parcela as any)._nfStatus === "enviado_contador" ? "NF Env." : "NF Pend."}
            </TagPill>
          )}
        </div>
      </div>
      <span className="text-[13px] numeric shrink-0" style={{ fontWeight: 500, color: isOverdue ? "#FF3B30" : isToday ? "#007AFF" : isPaid ? dk.textSubtle : dk.textSecondary }}>{parcela.valor}</span>
      {!isPaid && (
        <button onClick={() => onAction("cobrar", parcela)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-white hover:bg-[#48484A] transition-all cursor-pointer active:scale-[0.97] shrink-0" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}><Send className="w-3 h-3" />Cobrar</button>
      )}
      <ParcelaActionsMenu parcela={parcela} open={menuOpenId === parcela.id} onToggle={() => onMenuToggle(menuOpenId === parcela.id ? null : parcela.id)} onAction={onAction} />
    </div>
  );
}

/* ── CriarParcelasModal ── */

type CriarModalState = "form" | "loading" | "success";

export function CriarParcelasModal({ open, onClose, projeto, onPlanSaved }: { open: boolean; onClose: () => void; projeto: Projeto; onPlanSaved?: () => void }) {
  const valorTotal = parseValor(projeto.valor);
  const [modalState, setModalState] = useState<CriarModalState>("form");
  const [entradaAtiva, setEntradaAtiva] = useState(false);
  const [entradaPercent, setEntradaPercent] = useState("20");
  const [entradaVencimento, setEntradaVencimento] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); });
  const [numParcelas, setNumParcelas] = useState("3");
  const [primeiraParcela, setPrimeiraParcela] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); });
  const [formas, setFormas] = useState<Set<string>>(new Set(["pix"]));

  useEffect(() => { if (open) { setModalState("form"); setEntradaAtiva(false); setEntradaPercent("20"); setNumParcelas("3"); setFormas(new Set(["pix"])); } }, [open]);
  if (!open) return null;

  const n = Math.max(1, Math.min(24, parseInt(numParcelas) || 1));
  const entradaAmount = entradaAtiva ? Math.round(valorTotal * (Math.min(100, Math.max(0, parseInt(entradaPercent) || 0)) / 100)) : 0;
  const restante = valorTotal - entradaAmount;
  const valorParcela = n > 0 ? Math.round(restante / n) : restante;

  function handleGerar() {
    const forma = ([...formas][0] || "pix") as SyncFormaPagamento;
    const plan: PaymentPlan = { valorTotal, entradaPercent: entradaAtiva ? Math.min(100, parseInt(entradaPercent) || 0) : 0, entradaData: entradaAtiva ? entradaVencimento : "", formaPagamento: forma, numeroParcelas: n, primeiraParcelaData: primeiraParcela, intervaloMeses: 1, status: "ativo" };
    upsertPaymentPlan(projeto.id, plan);
    setModalState("loading");
    setTimeout(() => { setModalState("success"); onPlanSaved?.(); }, 1400);
  }

  if (modalState === "success") return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} />
      <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl w-full max-w-[500px] mx-4" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex flex-col items-center justify-center py-16 px-8 gap-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={withDelay(springBounce, 0.1)} className="w-16 h-16 rounded-2xl bg-[#FAFAFA] flex items-center justify-center"><CircleCheck className="w-7 h-7 text-[#34C759]" /></motion.div>
          <div className="flex flex-col items-center gap-1.5"><span className="text-[17px] text-[#636366]" style={{ fontWeight: 600 }}>Parcelas criadas</span></div>
          <button onClick={onClose} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><ArrowDownRight className="w-3.5 h-3.5" />Voltar ao Financeiro</button>
        </div>
      </div>
    </div>,
    document.body
  );
  if (modalState === "loading") return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} />
      <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl w-full max-w-[500px] mx-4" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex flex-col items-center justify-center py-20 gap-4"><motion.div animate={{ rotate: 360 }} transition={linearSpin}><LoaderCircle className="w-8 h-8 text-[#D1D1D6]" /></motion.div><span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Gerando parcelas...</span></div>
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={springDefault} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl w-full max-w-[500px] mx-4 overflow-hidden flex flex-col" style={{ maxHeight: "min(92vh, 780px)", boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7] shrink-0">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-white" /></div><div className="flex flex-col gap-0.5"><h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Criar parcelas</h3><p className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Defina entrada e parcelamento</p></div></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]"><span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Valor do pacote</span><span className="text-[16px] text-[#636366] numeric" style={{ fontWeight: 600 }}>{projeto.valor}</span></div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.1em] text-[#D1D1D6]" style={{ fontWeight: 600 }}>Entrada</span>
              <button onClick={() => setEntradaAtiva(!entradaAtiva)} className={`relative w-8 h-[18px] rounded-full transition-colors cursor-pointer ${entradaAtiva ? "bg-[#1D1D1F]" : "bg-[#F2F2F7]"}`}><div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${entradaAtiva ? "left-[16px]" : "left-[2px]"}`} style={{ boxShadow: "0 1px 2px #C7C7CC" }} /></button>
            </div>
            {entradaAtiva && <div className="text-[11px] text-[#D1D1D6]">{entradaPercent}% = {formatBRL(entradaAmount)}</div>}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#D1D1D6]" style={{ fontWeight: 600 }}>Parcelamento</span>
            <div className="text-[11px] text-[#D1D1D6]">{n}× de <span className="numeric" style={{ fontWeight: 500 }}>{formatBRL(valorParcela)}</span></div>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleGerar} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}><CreditCard className="w-3.5 h-3.5" />Gerar parcelas</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ── CobrarModal ── */

export function CobrarModal({ open, onClose, parcela, projeto }: { open: boolean; onClose: () => void; parcela: ParcelaMock | null; projeto: Projeto }) {
  const [mensagem, setMensagem] = useState(""); const [cobrarState, setCobrarState] = useState<"idle" | "copied" | "marked">("idle");
  useEffect(() => { if (open && parcela) { setCobrarState("idle"); const c = projeto.cliente.split(" ")[0]; setMensagem(`Olá ${c}, lembrete da parcela ${parcela.numero} — ${parcela.valor}, vencimento ${parcela.vencimento} (projeto "${projeto.nome}"). Poderia verificar? Obrigado!`); } }, [open]);
  if (!open || !parcela) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={cobrarState === "marked" ? undefined : onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={springDefault} className="relative bg-white rounded-2xl w-full max-w-[500px] mx-4 overflow-hidden flex flex-col" style={{ maxHeight: "min(92vh, 760px)", boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        {cobrarState === "marked" ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 gap-5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={withDelay(springBounce, 0.1)} className="w-16 h-16 rounded-2xl bg-[#FAFAFA] flex items-center justify-center"><CircleCheck className="w-7 h-7 text-[#34C759]" /></motion.div>
            <span className="text-[17px] text-[#636366]" style={{ fontWeight: 600 }}>Cobrança registrada</span>
          </div>
        ) : (<>
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7] shrink-0">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-[#8E8E93]" /></div><div className="flex flex-col gap-0.5"><h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Cobrar parcela</h3></div></div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div className="rounded-xl border border-[#E5E5EA] overflow-hidden">
              <div className="flex items-center divide-x divide-[#F2F2F7] border-t border-[#F2F2F7]">
                <div className="flex-1 flex flex-col items-center gap-0.5 py-3"><span className="text-[9px] uppercase tracking-[0.08em] text-[#D1D1D6]" style={{ fontWeight: 600 }}>Parcela</span><span className="text-[14px] text-[#636366] numeric" style={{ fontWeight: 600 }}>{parcela.numero}</span></div>
                <div className="flex-1 flex flex-col items-center gap-0.5 py-3"><span className="text-[9px] uppercase tracking-[0.08em] text-[#D1D1D6]" style={{ fontWeight: 600 }}>Valor</span><span className="text-[14px] text-[#636366] numeric" style={{ fontWeight: 600 }}>{parcela.valor}</span></div>
              </div>
            </div>
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={7} className="w-full px-3.5 py-3 rounded-xl border border-[#E5E5EA] text-[12px] text-[#636366] outline-none resize-none focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all" style={{ fontWeight: 400, lineHeight: 1.65 }} />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7] shrink-0">
            <button onClick={() => { setCobrarState("marked"); toast.success("Cobrança registrada"); setTimeout(onClose, 1600); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] text-[#AEAEB2] hover:bg-[#F2F2F7] border border-[#E5E5EA] transition-all cursor-pointer" style={{ fontWeight: 500 }}><CircleCheck className="w-3.5 h-3.5 text-[#D1D1D6]" />Marcar como enviado</button>
            <button onClick={() => { navigator.clipboard.writeText(mensagem); setCobrarState("copied"); setTimeout(() => setCobrarState("idle"), 2200); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${cobrarState === "copied" ? "bg-[#34C759] text-white" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`} style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}>
              {cobrarState === "copied" ? <><ClipboardCheck className="w-3.5 h-3.5" />Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar mensagem</>}
            </button>
          </div>
        </>)}
      </motion.div>
    </div>,
    document.body
  );
}

/* ── MarcarPagoModal ── */

export function MarcarPagoModal({ open, onClose, parcela, onConfirm }: { open: boolean; onClose: () => void; parcela: ParcelaMock | null; onConfirm: (id: string) => void }) {
  const [mpState, setMpState] = useState<"confirm" | "saving" | "success">("confirm");
  useEffect(() => { if (open) setMpState("confirm"); }, [open]);
  if (!open || !parcela) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={mpState === "confirm" ? onClose : undefined} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={springDefault} className="relative bg-white rounded-2xl w-full max-w-[400px] mx-4 overflow-hidden" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        {mpState === "success" ? (
          <div className="flex flex-col items-center justify-center py-14 px-8 gap-4"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springBounce} className="w-14 h-14 rounded-2xl bg-[#FAFAFA] flex items-center justify-center"><CircleCheck className="w-6 h-6 text-[#34C759]" /></motion.div><span className="text-[15px] text-[#636366]" style={{ fontWeight: 600 }}>Pagamento registrado</span></div>
        ) : (<>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7]"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center"><CircleCheck className="w-4 h-4 text-[#34C759]" /></div><h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Marcar como pago</h3></div><button onClick={onClose} className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"><X className="w-4 h-4" /></button></div>
          <div className="px-6 py-5"><div className="rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] p-4 flex items-center gap-3.5"><span className="text-[13px] text-[#636366] flex-1" style={{ fontWeight: 500 }}>Parcela {parcela.numero}</span><span className="text-[15px] text-[#636366] numeric" style={{ fontWeight: 600 }}>{parcela.valor}</span></div></div>
          <div className="px-6 py-4 border-t border-[#F2F2F7] flex items-center justify-end gap-2.5">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
            <button onClick={() => { setMpState("saving"); setTimeout(() => { onConfirm(parcela!.id); toast.success("Parcela marcada como paga"); setMpState("success"); setTimeout(onClose, 800); }, 700); }} disabled={mpState === "saving"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] bg-[#34C759] text-white hover:bg-[#2DB84E] active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50" style={{ fontWeight: 500 }}>
              {mpState === "saving" ? <><LoaderCircle className="w-3.5 h-3.5 animate-spin" />Salvando...</> : <><CircleCheck className="w-3.5 h-3.5" />Confirmar pagamento</>}
            </button>
          </div>
        </>)}
      </motion.div>
    </div>,
    document.body
  );
}

/* ── Repasses Section ── */

export function RepassesSection({ projeto, version, onCriar, onMarcarPago }: { projeto: Projeto; version: number; onCriar: () => void; onMarcarPago: (p: Payout) => void }) {
  const dk = useDk();
  const repasses = getPayoutsByProject(projeto.id);
  const pagos = repasses.filter((r) => r.status === "pago");
  const totalPendente = repasses.filter((r) => r.status === "pendente").reduce((s, r) => s + r.amountCents, 0);
  return (
    <DrawerCard title="Repasses" count={repasses.length} extra={<button onClick={onCriar} className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textMuted }}><Plus className="w-2.5 h-2.5" />Criar</button>}>
      {repasses.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2"><ArrowRightLeft className="w-5 h-5" style={{ color: dk.textDisabled }} /><span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Nenhum repasse cadastrado</span>
          <button onClick={onCriar} className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-xl text-[10px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}><Plus className="w-3 h-3" />Criar repasse</button>
        </div>
      ) : (<>
        {repasses.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 transition-colors group" style={{ borderColor: dk.hairline }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted }}>{r.status === "pago" ? <Check className="w-3 h-3 text-[#34C759]" /> : <ArrowRightLeft className="w-3 h-3" style={{ color: dk.textDisabled }} />}</div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2"><span className="text-[12px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>{r.receiverName}</span><TagPill variant="neutral">{r.role}</TagPill></div>
              <span className="text-[10px] numeric" style={{ fontWeight: 400, color: dk.textDisabled }}>Venc. {r.dueDateDisplay}</span>
            </div>
            <span className="text-[12px] numeric shrink-0" style={{ fontWeight: 600, color: dk.textTertiary }}>{centsToBRL(r.amountCents)}</span>
            <div className="w-[70px] flex justify-end">
              {r.status === "pendente" ? (
                <button onClick={() => onMarcarPago(r)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer active:scale-[0.97] opacity-0 group-hover:opacity-100" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}><CreditCard className="w-2.5 h-2.5" />Pagar</button>
              ) : <StatusBadge status="paga" />}
            </div>
          </div>
        ))}
        <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: dk.hairline, backgroundColor: dk.bgSub }}>
          <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{pagos.length} de {repasses.length} pagos</span>
          {totalPendente > 0 && <span className="text-[11px] text-[#FF3B30] numeric" style={{ fontWeight: 500 }}>{centsToBRL(totalPendente)} pendente</span>}
        </div>
      </>)}
    </DrawerCard>
  );
}

/* ── CriarRepasseDrawerModal ── */

export function CriarRepasseDrawerModal({ projeto, onClose, onCreated }: { projeto: Projeto; onClose: () => void; onCreated: () => void }) {
  const [receiver, setReceiver] = useState(""); const [role, setRole] = useState(ROLE_OPTIONS[0]); const [amount, setAmount] = useState(""); const [dueDate, setDueDate] = useState("2026-03-01"); const [method, setMethod] = useState<PayoutMethod>("PIX");
  const canSave = receiver.trim().length > 0 && amount.trim().length > 0;
  function handleSave() { if (!canSave) return; const amountNum = parseFloat(amount.replace(",", ".")); if (isNaN(amountNum) || amountNum <= 0) return; createPayout({ projectId: projeto.id, receiverName: receiver.trim(), role, amountCents: Math.round(amountNum * 100), dueDateISO: dueDate, method, projetoNome: projeto.nome, clienteNome: projeto.cliente }); onCreated(); }
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]"><span className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Criar repasse</span><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer"><X className="w-4 h-4" /></button></div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 p-3 bg-[#F2F2F7] rounded-xl"><FolderPlus className="w-3.5 h-3.5 text-[#D1D1D6]" /><span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{projeto.nome}</span></div>
          <div className="flex flex-col gap-1.5"><label className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Nome do profissional</label><input type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Ex: Roberto Silva" className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#D1D1D6] focus:outline-none focus:border-[#D1D1D6] transition-all" style={{ fontWeight: 400 }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Valor (R$)</label><input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.200,00" className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#D1D1D6] focus:outline-none focus:border-[#D1D1D6] transition-all numeric" style={{ fontWeight: 400 }} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Vencimento</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] focus:outline-none focus:border-[#D1D1D6] transition-all" style={{ fontWeight: 400 }} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleSave} disabled={!canSave} className={`px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97] ${canSave ? "bg-[#007AFF] text-white hover:bg-[#0066D6]" : "bg-[#E5E5EA] text-[#C7C7CC] cursor-not-allowed"}`} style={{ fontWeight: 500 }}><span className="flex items-center gap-1.5"><Plus className="w-3 h-3" />Criar</span></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── MarcarRepassePagoDrawerModal ── */

export function MarcarRepassePagoDrawerModal({ payout, onClose, onConfirm }: { payout: Payout; onClose: () => void; onConfirm: () => void }) {
  const [dataPagamento, setDataPagamento] = useState("2026-02-23"); const [method, setMethod] = useState<PayoutMethod>(payout.method || "PIX"); const [hasReceipt, setHasReceipt] = useState(false);
  function handleSave() { markPayoutPaid(payout.id, dataPagamento, method, hasReceipt); onConfirm(); }
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F2F7]"><span className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Marcar repasse como pago</span><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer"><X className="w-4 h-4" /></button></div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Data do pagamento</label><input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] focus:outline-none focus:border-[#D1D1D6] transition-all" style={{ fontWeight: 400 }} /></div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setHasReceipt(!hasReceipt)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${hasReceipt ? "border-[#1D1D1F] bg-[#1D1D1F]" : "border-[#D1D1D6]"}`}>{hasReceipt && <Check className="w-3 h-3 text-white" />}</div>
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>Comprovante anexado</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl text-[12px] bg-[#007AFF] text-white hover:bg-[#0066D6] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500 }}><span className="flex items-center gap-1.5"><Check className="w-3 h-3" />Salvar</span></button>
        </div>
      </div>
    </div>,
    document.body
  );
}