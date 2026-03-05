/**
 * TabFinanceiro.tsx — Financial tab for ProjetoDrawer
 * Extracted from ProjetoDrawer.tsx for modularity.
 */
import { useState } from "react";
import {
  DollarSign,
  AlertCircle,
  CreditCard,
  CalendarClock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import type { Projeto } from "./projetosData";
import { DrawerCard, DrawerCardRow, TabEmpty, type TabState } from "./drawer-primitives";
import { KpiCard } from "../ui/kpi-card";
import { AlertBanner } from "../ui/alert-banner";
import { useDk } from "../../lib/useDarkColors";
import {
  getPersistedPlans,
  syncProjectPaymentPlanToFinance,
  loadPaidIds as loadPaidIdsFromStorage,
  savePaidIds as savePaidIdsToStorage,
  fmtBRL as fmtBRLSync,
  FORMA_PAGAMENTO_LABELS,
  markParcelaConciliada,
  loadConciliadaIds as loadConciliadaIdsFromStorage,
  getNfState,
  setNfState,
} from "./paymentPlanSync";
import type { Payout } from "../financeiro/payoutStore";
import {
  type ParcelaMock,
  type ParcelaStatus,
  parseValor,
  formatBRL,
  buildMockParcelas,
  syncedToParcelaMock,
  ParcelaRow,
  CriarParcelasModal,
  CobrarModal,
  MarcarPagoModal,
  RepassesSection,
  CriarRepasseDrawerModal,
  MarcarRepassePagoDrawerModal,
} from "./financeiro-modals";

/* ── Main TabFinanceiro ── */

export function TabFinanceiro({ projeto, tabState }: { projeto: Projeto; tabState: TabState }) {
  const dk = useDk();
  const plans = getPersistedPlans();
  const currentPlan = plans[projeto.id];
  const hasPlan = !!currentPlan || projeto.financeiro.parcelas > 0;
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [cobrarParcela, setCobrarParcela] = useState<ParcelaMock | null>(null);
  const [showCobrar, setShowCobrar] = useState(false);
  const [pagarParcela, setPagarParcela] = useState<ParcelaMock | null>(null);
  const [showPagar, setShowPagar] = useState(false);
  const [paidOverride, setPaidOverride] = useState<Set<string>>(new Set());
  const [planVersion, setPlanVersion] = useState(0);
  const [showCriarRepasse, setShowCriarRepasse] = useState(false);
  const [showMarcarRepassePago, setShowMarcarRepassePago] = useState<Payout | null>(null);
  const [repasseVersion, setRepasseVersion] = useState(0);

  const parcelas: (ParcelaMock & { _conciliada?: boolean; _nfStatus?: string })[] = (() => {
    const storedPaidIds = loadPaidIdsFromStorage();
    const storedConciliadaIds = loadConciliadaIdsFromStorage();
    const mergedPaidIds = new Set([...storedPaidIds, ...paidOverride]);
    if (currentPlan) {
      const synced = syncProjectPaymentPlanToFinance(projeto.id, currentPlan, projeto.nome, projeto.cliente, mergedPaidIds);
      return synced.map((sp) => { const nfOverride = getNfState(sp.id); if (nfOverride) sp.nfStatus = nfOverride.nfStatus; if (storedConciliadaIds.has(sp.id)) sp.status = "conciliada"; return sp; }).map(syncedToParcelaMock).map((p) => {
        if (paidOverride.has(p.id)) return { ...p, status: "paga" as ParcelaStatus, metodoPagamento: "Manual", dataPagamento: "agora" };
        return p;
      });
    }
    return buildMockParcelas(projeto).map((p) => {
      const nfOverride = getNfState(p.id);
      const nfStatus = p.status === "paga" ? (nfOverride?.nfStatus || "pendente") : "na";
      const isConciliada = storedConciliadaIds.has(p.id);
      const base = { ...p, _nfStatus: nfStatus, _conciliada: isConciliada };
      if (paidOverride.has(p.id)) return { ...base, status: "paga" as ParcelaStatus, metodoPagamento: "Manual", dataPagamento: "agora" };
      return base;
    });
  })();

  function handlePaidOverride(id: string) {
    setPaidOverride((prev) => { const next = new Set(prev).add(id); const stored = loadPaidIdsFromStorage(); savePaidIdsToStorage(new Set([...stored, ...next])); return next; });
  }

  const valorTotal = parseValor(projeto.valor);
  const recebido = parcelas.filter((p) => p.status === "paga").reduce((s, p) => s + p.valorNum, 0);
  const aReceber = valorTotal - recebido;
  const despesas = Math.round(valorTotal * 0.18);
  const lucro = valorTotal - despesas;
  const vencidas = parcelas.filter((p) => p.status === "vencida");
  const pagasCount = parcelas.filter((p) => p.status === "paga").length;
  const progressPct = parcelas.length > 0 ? Math.round((pagasCount / parcelas.length) * 100) : 0;

  function handleParcelaAction(action: string, parcela: ParcelaMock) {
    if (action === "cobrar") { setCobrarParcela(parcela); setShowCobrar(true); }
    else if (action === "pagar") { setPagarParcela(parcela); setShowPagar(true); }
    else if (action === "conciliar") { markParcelaConciliada(parcela.id); setPlanVersion((v) => v + 1); toast.success("Parcela conciliada"); }
    else if (action === "emitir_nf") { setNfState(parcela.id, { nfStatus: "emitida", nfIssuedAtISO: "2026-02-23" }); setPlanVersion((v) => v + 1); toast.success("NF emitida"); }
    else if (action === "estornar") { toast.success("Pagamento estornado"); setPaidOverride((prev) => { const next = new Set(prev); next.delete(parcela.id); return next; }); }
    else if (action === "comprovante") { toast.info("Download iniciado"); }
  }

  if (tabState === "loading") return <div className="flex flex-col gap-5 animate-pulse"><div className="h-20 rounded-xl" style={{ backgroundColor: dk.bgMuted }} /><div className="h-40 rounded-xl" style={{ backgroundColor: dk.bgMuted }} /></div>;
  if (tabState === "error") return <div className="flex flex-col items-center py-16 gap-5"><AlertCircle className="w-6 h-6 text-[#FF3B30]" /><button onClick={() => {}} className="px-4 py-2 rounded-xl text-[13px] cursor-pointer" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}>Tentar novamente</button></div>;

  return (
    <div className="flex flex-col gap-5">
      {!hasPlan ? (
        <TabEmpty icon={<DollarSign className="w-6 h-6 text-[#E5E5EA]" />} title="Nenhum plano de pagamento" description="Crie um plano de pagamento para acompanhar recebimentos e identificar parcelas vencidas." ctaLabel="Criar plano de pagamento" ctaIcon={<CreditCard className="w-3.5 h-3.5" />} onCta={() => setShowCriarModal(true)} />
      ) : (<>
        {vencidas.length > 0 && <AlertBanner variant="danger" title={`${vencidas.length} parcela${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}`} desc={`Total em atraso: ${formatBRL(vencidas.reduce((s, p) => s + p.valorNum, 0))}`} ctaLabel="Cobrar agora" cta={() => { setCobrarParcela(vencidas[0]); setShowCobrar(true); }} compact />}

        <div className="grid grid-cols-3 gap-2">
          <KpiCard compact label="Valor total" value={projeto.valor} icon={<DollarSign className="w-3 h-3 text-[#C7C7CC]" />} />
          <KpiCard compact label="Recebido" value={formatBRL(recebido)} icon={<ArrowDownRight className="w-3 h-3 text-[#34C759]" />} sub={`${pagasCount} paga${pagasCount !== 1 ? "s" : ""}`} />
          <KpiCard compact label="A receber" value={formatBRL(aReceber)} icon={<ArrowUpRight className="w-3 h-3 text-[#007AFF]" />} sub={`${parcelas.length - pagasCount} restante${parcelas.length - pagasCount !== 1 ? "s" : ""}`} />
        </div>

        {currentPlan && (
          <DrawerCard title="Plano de pagamento" extra={<span className="text-[9px] text-[#34C759] px-1.5 py-0.5 rounded" style={{ fontWeight: 500, backgroundColor: dk.bgMuted }}>Ativo</span>}>
            <DrawerCardRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Valor total" value={<span className="numeric" style={{ fontWeight: 500 }}>{fmtBRLSync(currentPlan.valorTotal)}</span>} />
            <DrawerCardRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Entrada" value={currentPlan.entradaPercent > 0 ? <span className="numeric" style={{ fontWeight: 500 }}>{currentPlan.entradaPercent}%</span> : <span style={{ fontWeight: 400, color: dk.textDisabled }}>Sem entrada</span>} />
            <DrawerCardRow icon={<CalendarClock className="w-3.5 h-3.5" />} label="Parcelas" value={<span className="numeric" style={{ fontWeight: 500 }}>{currentPlan.numeroParcelas}× mensal</span>} />
            <DrawerCardRow icon={<Banknote className="w-3.5 h-3.5" />} label="Forma de pagamento" value={<span style={{ fontWeight: 500 }}>{FORMA_PAGAMENTO_LABELS[currentPlan.formaPagamento] || currentPlan.formaPagamento}</span>} noBorder />
          </DrawerCard>
        )}

        <DrawerCard title="Resumo financeiro">
          <div className="px-4 py-2.5">
            <div className="flex items-center justify-between mb-1.5"><span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Progresso de pagamento</span><span className="text-[10px] numeric" style={{ fontWeight: 500, color: dk.textMuted }}>{progressPct}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}><div className="h-full rounded-full bg-[#34C759] transition-all duration-500" style={{ width: `${progressPct}%` }} /></div>
          </div>
          <div className="grid grid-cols-2 border-t" style={{ borderColor: dk.hairline }}>
            <div className="flex items-center justify-between px-4 py-3 border-r" style={{ borderColor: dk.hairline }}><div className="flex items-center gap-2"><Receipt className="w-3 h-3" style={{ color: dk.textDisabled }} /><span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Despesas</span></div><span className="text-[13px] numeric" style={{ fontWeight: 500, color: dk.textMuted }}>{formatBRL(despesas)}</span></div>
            <div className="flex items-center justify-between px-4 py-3"><div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-[#34C759]" /><span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Lucro</span></div><span className="text-[13px] numeric" style={{ fontWeight: 500, color: lucro > 0 ? "#34C759" : "#FF3B30" }}>{formatBRL(lucro)}</span></div>
          </div>
        </DrawerCard>

        <DrawerCard title="Parcelas" count={parcelas.length} extra={<div className="flex items-center gap-2">{vencidas.length > 0 && <span className="text-[10px] text-[#FF3B30] px-1.5 py-0.5 rounded numeric" style={{ fontWeight: 500, backgroundColor: dk.bgMuted }}>{vencidas.length} vencida{vencidas.length > 1 ? "s" : ""}</span>}<span className="text-[10px] text-[#34C759] px-1.5 py-0.5 rounded numeric" style={{ fontWeight: 500, backgroundColor: dk.bgMuted }}>{pagasCount} paga{pagasCount !== 1 ? "s" : ""}</span></div>}>
          <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: dk.hairline, backgroundColor: dk.bgSub }}><span className="w-5 shrink-0" /><span className="flex-1 text-[9px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textDisabled }}>Parcela / Vencimento / Status</span><span className="text-[9px] uppercase tracking-[0.08em] shrink-0" style={{ fontWeight: 600, color: dk.textDisabled }}>Valor</span><span className="w-[70px] text-right text-[9px] uppercase tracking-[0.08em] shrink-0" style={{ fontWeight: 600, color: dk.textDisabled }}>Ações</span></div>
          {parcelas.map((p) => <ParcelaRow key={p.id} parcela={p} total={parcelas.length} menuOpenId={menuOpenId} onMenuToggle={setMenuOpenId} onAction={handleParcelaAction} />)}
          <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: dk.hairline, backgroundColor: dk.bgSub }}><span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{pagasCount} de {parcelas.length} pagas</span><span className="text-[13px] numeric" style={{ fontWeight: 600, color: dk.textSecondary }}>{projeto.valor}</span></div>
        </DrawerCard>

        <RepassesSection projeto={projeto} version={repasseVersion} onCriar={() => setShowCriarRepasse(true)} onMarcarPago={(p) => setShowMarcarRepassePago(p)} />
      </>)}

      {showCriarRepasse && <CriarRepasseDrawerModal projeto={projeto} onClose={() => setShowCriarRepasse(false)} onCreated={() => { setRepasseVersion((v) => v + 1); setShowCriarRepasse(false); toast.success("Repasse criado com sucesso"); }} />}
      {showMarcarRepassePago && <MarcarRepassePagoDrawerModal payout={showMarcarRepassePago} onClose={() => setShowMarcarRepassePago(null)} onConfirm={() => { setRepasseVersion((v) => v + 1); setShowMarcarRepassePago(null); toast.success("Repasse marcado como pago"); }} />}
      <CriarParcelasModal open={showCriarModal} onClose={() => setShowCriarModal(false)} projeto={projeto} onPlanSaved={() => setPlanVersion((v) => v + 1)} />
      <CobrarModal open={showCobrar} onClose={() => { setShowCobrar(false); setCobrarParcela(null); }} parcela={cobrarParcela} projeto={projeto} />
      <MarcarPagoModal open={showPagar} onClose={() => { setShowPagar(false); setPagarParcela(null); }} parcela={pagarParcela} onConfirm={(id) => handlePaidOverride(id)} />
    </div>
  );
}
