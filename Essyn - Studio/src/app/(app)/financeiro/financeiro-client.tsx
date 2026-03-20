"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, isPast, isToday, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
  TrendingUp,
  BarChart3,
  Bell,
  Eye,
  X,
  Pencil,
  Trash2,
  CircleDollarSign,
  Target,
  Percent,
  Users,
  Banknote,
  ExternalLink,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  StatusBadge,
  WidgetEmptyState,
  HelpTip,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springDefault, springContentIn } from "@/lib/motion-tokens";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FinancialStatus = "pendente" | "pago" | "vencido" | "cancelado";
type FinancialType = "receita" | "despesa";
type PaymentMethod = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "transferencia" | "dinheiro";

interface Installment {
  id: string;
  type: FinancialType;
  description: string;
  amount: number;
  due_date: string;
  status: FinancialStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  paid_amount: number | null;
  category: string | null;
  notes: string | null;
  recurring: boolean;
  asaas_payment_id: string | null;
  asaas_billing_url: string | null;
  asaas_pix_qr: string | null;
  asaas_pix_code: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string } | null;
  clients: { id: string; name: string } | null;
}

interface SimpleRef {
  id: string;
  name: string;
}

type Tab = "hoje" | "receber" | "pagar" | "fluxo" | "relatorios" | "cobranca";

interface TabItem {
  id: Tab;
  label: string;
  icon: typeof Eye;
  badge?: number;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const statusConfig: Record<FinancialStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "var(--warning)", bg: "var(--warning-subtle)" },
  pago: { label: "Pago", color: "var(--success)", bg: "var(--success-subtle)" },
  vencido: { label: "Vencido", color: "var(--error)", bg: "var(--error-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
};

const paymentMethods: Record<PaymentMethod, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao_credito: "Cartão crédito",
  cartao_debito: "Cartão débito",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

const EXPENSE_CATEGORIES = [
  "Aluguel",
  "Equipamento",
  "Software",
  "Transporte",
  "Alimentação",
  "Marketing",
  "Seguro",
  "Impostos",
  "Assistente",
  "Manutenção",
  "Outros",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatShortCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".0", "")}k`;
  }
  return formatCurrency(value);
}

/* ------------------------------------------------------------------ */
/*  Stagger animation                                                  */
/* ------------------------------------------------------------------ */

const rowStagger = {
  initial: { opacity: 0, y: 6 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26, delay: i * 0.015 },
  }),
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function FinanceiroClient({
  installments: initial,
  projects,
  clients,
  studioId,
  asaasConnected = false,
}: {
  installments: Installment[];
  projects: SimpleRef[];
  clients: SimpleRef[];
  studioId: string;
  asaasConnected?: boolean;
}) {
  const router = useRouter();
  const [installments, setInstallments] = useState(initial);
  const [activeTab, setActiveTab] = useState<Tab>("hoje");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newModalType, setNewModalType] = useState<FinancialType>("receita");
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<{ qr: string; code: string; url: string } | null>(null);

  // Auto-update overdue
  const processed = useMemo(() =>
    installments.map((i) => {
      if (i.status === "pendente" && isPast(new Date(i.due_date + "T23:59:59")) && !isToday(new Date(i.due_date))) {
        return { ...i, status: "vencido" as FinancialStatus };
      }
      return i;
    }),
    [installments]
  );

  const receitas = useMemo(() => processed.filter((i) => i.type === "receita"), [processed]);
  const despesas = useMemo(() => processed.filter((i) => i.type === "despesa"), [processed]);

  // Global KPIs
  const kpis = useMemo(() => {
    const recebido = receitas.filter((i) => i.status === "pago").reduce((s, i) => s + Number(i.paid_amount || i.amount), 0);
    const pendente = receitas.filter((i) => i.status === "pendente").reduce((s, i) => s + Number(i.amount), 0);
    const vencido = receitas.filter((i) => i.status === "vencido").reduce((s, i) => s + Number(i.amount), 0);
    const despesasPagas = despesas.filter((i) => i.status === "pago").reduce((s, i) => s + Number(i.paid_amount || i.amount), 0);
    return { recebido, pendente, vencido, despesasPagas };
  }, [receitas, despesas]);

  // Mark as paid
  const markAsPaid = useCallback(async (id: string) => {
    const supabase = createClient();
    const installment = installments.find((i) => i.id === id);
    if (!installment) return;

    const { error } = await supabase
      .from("installments")
      .update({ status: "pago", paid_at: new Date().toISOString(), paid_amount: installment.amount })
      .eq("id", id)
      .eq("studio_id", studioId);

    if (error) { toast.error("Erro ao marcar como pago"); return; }

    setInstallments((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "pago" as FinancialStatus, paid_at: new Date().toISOString(), paid_amount: i.amount } : i
      )
    );
    toast.success("Marcado como pago!");
    router.refresh();
  }, [installments, router]);

  // Cancel
  const cancelInstallment = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("installments").update({ status: "cancelado" }).eq("id", id).eq("studio_id", studioId);
    if (error) { toast.error("Erro ao cancelar"); return; }
    setInstallments((prev) => prev.map((i) => i.id === id ? { ...i, status: "cancelado" as FinancialStatus } : i));
    toast.success("Cancelado!");
    router.refresh();
  }, [router]);

  // Delete
  const deleteInstallment = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("installments").delete().eq("id", id).eq("studio_id", studioId);
    if (error) { toast.error("Erro ao excluir"); return; }
    setInstallments((prev) => prev.filter((i) => i.id !== id));
    toast.success("Excluído!");
    router.refresh();
  }, [router]);

  // Edit
  const updateInstallment = useCallback(async (id: string, updates: Partial<Pick<Installment, "description" | "amount" | "due_date" | "category" | "payment_method" | "notes">>) => {
    const supabase = createClient();
    const { error } = await supabase.from("installments").update(updates).eq("id", id).eq("studio_id", studioId);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setInstallments((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
    toast.success("Atualizado!");
    setShowEditModal(false);
    setEditingInstallment(null);
    router.refresh();
  }, [router]);

  function openEditModal(inst: Installment) {
    setEditingInstallment(inst);
    setShowEditModal(true);
  }

  // Asaas charge
  const chargeViaAsaas = useCallback(async (id: string) => {
    setChargingId(id);
    try {
      const res = await fetch("/api/integrations/asaas/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar cobrança");
        return;
      }

      // Update local state
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                asaas_payment_id: data.payment.id,
                asaas_billing_url: data.payment.invoiceUrl,
                asaas_pix_qr: data.pix?.encodedImage || null,
                asaas_pix_code: data.pix?.payload || null,
              }
            : i
        )
      );

      if (data.pix) {
        setPixModal({ qr: data.pix.encodedImage, code: data.pix.payload, url: data.payment.invoiceUrl });
      } else {
        toast.success("Cobrança criada! Link enviado ao cliente.");
        if (data.payment.invoiceUrl) {
          window.open(data.payment.invoiceUrl, "_blank");
        }
      }
    } catch {
      toast.error("Erro de rede ao criar cobrança");
    } finally {
      setChargingId(null);
    }
  }, []);

  // Tab badges
  const vencidoCount = processed.filter((i) => i.status === "vencido").length;
  const todayItems = processed.filter((i) =>
    (i.status === "pendente" || i.status === "vencido") && isToday(new Date(i.due_date))
  );

  const tabs: TabItem[] = [
    { id: "hoje", label: "Hoje", icon: CalendarClock, badge: todayItems.length || undefined },
    { id: "receber", label: "Receber", icon: ArrowUpRight },
    { id: "pagar", label: "Pagar", icon: ArrowDownRight },
    { id: "fluxo", label: "Fluxo", icon: TrendingUp },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "cobranca", label: "Cobrança", icon: Bell, badge: vencidoCount || undefined },
  ];

  function openNewModal(type: FinancialType) {
    setNewModalType(type);
    setShowNewModal(true);
  }

  return (
    <PageTransition>
      {/* Unified Panel: Header + Stats + Tabs */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">
                <span className="flex items-center gap-2">Financeiro <HelpTip text="Parcelas sao criadas automaticamente ao definir valor em um projeto. Use as tabs para filtrar por categoria." /></span>
              </h1>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">Controle de receitas, despesas e fluxo de caixa</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openNewModal("despesa")} className={SECONDARY_CTA}>
                <ArrowDownRight size={16} />
                Nova despesa
              </button>
              <button onClick={() => openNewModal("receita")} className={PRIMARY_CTA}>
                <Plus size={16} />
                Nova receita
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Recebido</p>
            <p className="text-[18px] font-bold text-[var(--success)] tracking-[-0.02em] leading-none tabular-nums">{formatShortCurrency(kpis.recebido)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">A receber</p>
            <p className="text-[18px] font-bold text-[var(--warning)] tracking-[-0.02em] leading-none tabular-nums">{formatShortCurrency(kpis.pendente)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Vencido</p>
            <p className={`text-[18px] font-bold tracking-[-0.02em] leading-none tabular-nums ${kpis.vencido > 0 ? "text-[var(--error)]" : "text-[var(--fg-muted)]"}`}>{formatShortCurrency(kpis.vencido)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Despesas pagas</p>
            <p className="text-[18px] font-bold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">{formatShortCurrency(kpis.despesasPagas)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <ActionPill
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                count={tab.badge}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} {...springContentIn}>
          {activeTab === "hoje" && (
            <TabHoje
              processed={processed}
              receitas={receitas}
              despesas={despesas}
              kpis={kpis}
              markAsPaid={markAsPaid}
              onNewReceita={() => openNewModal("receita")}
              onNewDespesa={() => openNewModal("despesa")}
            />
          )}
          {activeTab === "receber" && (
            <TabReceber
              receitas={receitas}
              markAsPaid={markAsPaid}
              cancelInstallment={cancelInstallment}
              deleteInstallment={deleteInstallment}
              onEdit={openEditModal}
              onNew={() => openNewModal("receita")}
            />
          )}
          {activeTab === "pagar" && (
            <TabPagar
              despesas={despesas}
              markAsPaid={markAsPaid}
              cancelInstallment={cancelInstallment}
              deleteInstallment={deleteInstallment}
              onEdit={openEditModal}
              onNew={() => openNewModal("despesa")}
            />
          )}
          {activeTab === "fluxo" && (
            <TabFluxo processed={processed} />
          )}
          {activeTab === "relatorios" && (
            <TabRelatorios receitas={receitas} despesas={despesas} />
          )}
          {activeTab === "cobranca" && (
            <TabCobranca
              receitas={receitas}
              markAsPaid={markAsPaid}
              asaasConnected={asaasConnected}
              chargeViaAsaas={chargeViaAsaas}
              chargingId={chargingId}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* New Installment Modal */}
      <AppleModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={newModalType === "receita" ? "Nova receita" : "Nova despesa"}
      >
        <NewInstallmentForm
          studioId={studioId}
          projects={projects}
          clients={clients}
          defaultType={newModalType}
          onClose={() => setShowNewModal(false)}
          onCreated={(inst) => {
            setInstallments([inst, ...installments]);
            setShowNewModal(false);
            toast.success("Lançamento criado!");
            router.refresh();
          }}
        />
      </AppleModal>

      {/* Edit Installment Modal */}
      <AppleModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingInstallment(null); }}
        title="Editar lançamento"
      >
        {editingInstallment && (
          <EditInstallmentForm
            installment={editingInstallment}
            onClose={() => { setShowEditModal(false); setEditingInstallment(null); }}
            onSave={(updates) => updateInstallment(editingInstallment.id, updates)}
          />
        )}
      </AppleModal>

      {/* PIX QR Code Modal */}
      <AppleModal
        open={!!pixModal}
        onClose={() => setPixModal(null)}
        title="Cobrança PIX"
        maxWidth="max-w-sm"
      >
        {pixModal && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pixModal.qr}`}
              alt="QR Code PIX"
              className="w-48 h-48 rounded-xl border border-[var(--border-subtle)]"
            />
            <p className="text-[12px] text-[var(--fg-secondary)] text-center">
              Escaneie o QR Code ou copie o código PIX abaixo
            </p>
            <div className="w-full">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={pixModal.code}
                  className={`${INPUT_CLS} !text-[11px] font-mono`}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pixModal.code);
                    toast.success("Código PIX copiado!");
                  }}
                  className={SECONDARY_CTA}
                >
                  Copiar
                </button>
              </div>
            </div>
            {pixModal.url && (
              <a
                href={pixModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[var(--accent)] hover:underline"
              >
                Abrir link de pagamento ↗
              </a>
            )}
          </div>
        )}
      </AppleModal>
    </PageTransition>
  );
}

/* ================================================================== */
/*  TAB HOJE — Dashboard diário                                        */
/* ================================================================== */

function TabHoje({
  processed,
  receitas,
  despesas,
  kpis,
  markAsPaid,
  onNewReceita,
  onNewDespesa,
}: {
  processed: Installment[];
  receitas: Installment[];
  despesas: Installment[];
  kpis: { recebido: number; pendente: number; vencido: number; despesasPagas: number };
  markAsPaid: (id: string) => void;
  onNewReceita: () => void;
  onNewDespesa: () => void;
}) {
  const today = new Date();

  // Items for today
  const todayReceitas = receitas.filter(
    (i) => (i.status === "pendente" || i.status === "vencido") && isToday(new Date(i.due_date))
  );
  const todayDespesas = despesas.filter(
    (i) => (i.status === "pendente" || i.status === "vencido") && isToday(new Date(i.due_date))
  );

  // Overdue items
  const overdueAll = processed.filter((i) => i.status === "vencido");

  // Upcoming 7 days (not today)
  const next7 = processed.filter((i) => {
    if (i.status !== "pendente") return false;
    const d = new Date(i.due_date);
    if (isToday(d)) return false;
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  // Recently paid (last 3 days)
  const recentPaid = processed.filter((i) => {
    if (i.status !== "pago" || !i.paid_at) return false;
    const diff = (today.getTime() - new Date(i.paid_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  }).slice(0, 5);

  // Saldo do dia
  const todayRecebido = todayReceitas.reduce((s, i) => s + Number(i.amount), 0);
  const todayDespesa = todayDespesas.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-5">
      {/* Resumo do dia */}
      <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Receber hoje</p>
            <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">{formatCurrency(todayRecebido)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{todayReceitas.length} {todayReceitas.length === 1 ? "parcela" : "parcelas"}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Pagar hoje</p>
            <p className="text-[24px] font-bold text-[var(--error)] tracking-[-0.026em] leading-none tabular-nums">{formatCurrency(todayDespesa)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{todayDespesas.length} {todayDespesas.length === 1 ? "conta" : "contas"}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Vencidos</p>
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${overdueAll.length > 0 ? "text-[var(--error)]" : "text-[var(--fg)]"}`}>
              {overdueAll.length}
            </p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">
              {formatCurrency(overdueAll.reduce((s, i) => s + Number(i.amount), 0))} em atraso
            </p>
          </div>
        </div>
      </div>

      {/* Vencidos — alerta */}
      {overdueAll.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Vencidos ({overdueAll.length})</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {overdueAll.slice(0, 8).map((item, idx) => (
                <InstallmentRow key={item.id} item={item} idx={idx} markAsPaid={markAsPaid} />
              ))}
            </div>
            {overdueAll.length > 8 && (
              <p className="text-xs text-[var(--fg-muted)] text-center py-3 border-t border-[var(--border-subtle)]">
                + {overdueAll.length - 8} itens vencidos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Vencimentos de hoje */}
      {(todayReceitas.length > 0 || todayDespesas.length > 0) && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Vencendo hoje</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {[...todayReceitas, ...todayDespesas].map((item, idx) => (
                <InstallmentRow key={item.id} item={item} idx={idx} markAsPaid={markAsPaid} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Próximos 7 dias */}
      {next7.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Próximos 7 dias</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {next7.slice(0, 10).map((item, idx) => (
                <InstallmentRow key={item.id} item={item} idx={idx} markAsPaid={markAsPaid} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recebidos recentemente */}
      {recentPaid.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Recebidos recentemente</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentPaid.map((item, idx) => (
                <InstallmentRow key={item.id} item={item} idx={idx} markAsPaid={markAsPaid} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {overdueAll.length === 0 && todayReceitas.length === 0 && todayDespesas.length === 0 && next7.length === 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={CalendarClock}
            title="Tudo em dia!"
            description="Nenhum vencimento pendente para os próximos 7 dias."
            action={
              <div className="flex gap-2">
                <button onClick={onNewReceita} className={PRIMARY_CTA}>
                  <Plus size={16} />
                  Nova receita
                </button>
                <button onClick={onNewDespesa} className={SECONDARY_CTA}>
                  <ArrowDownRight size={16} />
                  Nova despesa
                </button>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB RECEBER — Contas a receber                                     */
/* ================================================================== */

function TabReceber({
  receitas,
  markAsPaid,
  cancelInstallment,
  deleteInstallment,
  onEdit,
  onNew,
}: {
  receitas: Installment[];
  markAsPaid: (id: string) => void;
  cancelInstallment: (id: string) => void;
  deleteInstallment: (id: string) => void;
  onEdit: (inst: Installment) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FinancialStatus | "todos">("todos");

  const filtered = receitas.filter((i) => {
    const matchSearch =
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.projects?.name.toLowerCase().includes(search.toLowerCase()) ||
      i.clients?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    todos: receitas.length,
    pendente: receitas.filter((i) => i.status === "pendente").length,
    pago: receitas.filter((i) => i.status === "pago").length,
    vencido: receitas.filter((i) => i.status === "vencido").length,
    cancelado: receitas.filter((i) => i.status === "cancelado").length,
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Buscar receitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${INPUT_CLS} !pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionPill label="Todos" active={filterStatus === "todos"} onClick={() => setFilterStatus("todos")} count={statusCounts.todos} />
          <ActionPill label="Pendente" active={filterStatus === "pendente"} onClick={() => setFilterStatus("pendente")} count={statusCounts.pendente} />
          <ActionPill label="Pago" active={filterStatus === "pago"} onClick={() => setFilterStatus("pago")} count={statusCounts.pago} />
          <ActionPill label="Vencido" active={filterStatus === "vencido"} onClick={() => setFilterStatus("vencido")} count={statusCounts.vencido} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={ArrowUpRight}
            title={receitas.length === 0 ? "Nenhuma receita ainda" : "Nenhum resultado"}
            description={receitas.length === 0 ? "As parcelas aparecem automaticamente quando você cria um projeto com valor definido." : "Tente ajustar os filtros."}
            action={
              receitas.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <Link href="/projetos" className="text-[11px] text-[var(--info)] hover:underline">Criar projeto</Link>
                  <button onClick={onNew} className={PRIMARY_CTA}><Plus size={16} />Nova receita</button>
                </div>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <InstallmentTable items={filtered} markAsPaid={markAsPaid} cancelInstallment={cancelInstallment} deleteInstallment={deleteInstallment} onEdit={onEdit} showType={false} />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB PAGAR — Contas a pagar                                         */
/* ================================================================== */

function TabPagar({
  despesas,
  markAsPaid,
  cancelInstallment,
  deleteInstallment,
  onEdit,
  onNew,
}: {
  despesas: Installment[];
  markAsPaid: (id: string) => void;
  cancelInstallment: (id: string) => void;
  deleteInstallment: (id: string) => void;
  onEdit: (inst: Installment) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FinancialStatus | "todos">("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todos");

  const categories = useMemo(() => {
    const cats = new Set(despesas.map((d) => d.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [despesas]);

  const filtered = despesas.filter((i) => {
    const matchSearch = i.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || i.status === filterStatus;
    const matchCategory = filterCategory === "todos" || i.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const statusCounts = {
    todos: despesas.length,
    pendente: despesas.filter((i) => i.status === "pendente").length,
    pago: despesas.filter((i) => i.status === "pago").length,
    vencido: despesas.filter((i) => i.status === "vencido").length,
  };

  // Category summary
  const categorySummary = useMemo(() => {
    const paid = despesas.filter((i) => i.status === "pago");
    const map = new Map<string, number>();
    paid.forEach((i) => {
      const cat = i.category || "Sem categoria";
      map.set(cat, (map.get(cat) || 0) + Number(i.paid_amount || i.amount));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [despesas]);

  const totalPaidDespesas = categorySummary.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-4">
      {/* Category summary */}
      {categorySummary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categorySummary.slice(0, 6).map(([cat, val]) => (
            <div key={cat} className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="p-3">
                <p className="text-xs text-[var(--fg-muted)] truncate">{cat}</p>
                <p className="text-sm font-semibold text-[var(--fg)] mt-0.5">{formatShortCurrency(val)}</p>
                {totalPaidDespesas > 0 && (
                  <div className="mt-1.5 h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--error)]"
                      style={{ width: `${Math.min((val / totalPaidDespesas) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Buscar despesas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${INPUT_CLS} !pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionPill label="Todos" active={filterStatus === "todos"} onClick={() => setFilterStatus("todos")} count={statusCounts.todos} />
          <ActionPill label="Pendente" active={filterStatus === "pendente"} onClick={() => setFilterStatus("pendente")} count={statusCounts.pendente} />
          <ActionPill label="Pago" active={filterStatus === "pago"} onClick={() => setFilterStatus("pago")} count={statusCounts.pago} />
          <ActionPill label="Vencido" active={filterStatus === "vencido"} onClick={() => setFilterStatus("vencido")} count={statusCounts.vencido} />
        </div>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="todos">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={ArrowDownRight}
            title={despesas.length === 0 ? "Nenhuma despesa ainda" : "Nenhum resultado"}
            description={despesas.length === 0 ? "Registre despesas do estúdio para acompanhar seus custos." : "Tente ajustar os filtros."}
            action={
              despesas.length === 0 ? (
                <button onClick={onNew} className={PRIMARY_CTA}><Plus size={16} />Nova despesa</button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <InstallmentTable items={filtered} markAsPaid={markAsPaid} cancelInstallment={cancelInstallment} deleteInstallment={deleteInstallment} onEdit={onEdit} showType={false} showCategory />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB FLUXO — Cash Flow Projection                                   */
/* ================================================================== */

function TabFluxo({ processed }: { processed: Installment[] }) {
  const [viewMode, setViewMode] = useState<"semanal" | "mensal">("semanal");

  const data = useMemo(() => {
    const today = new Date();
    const periods: { label: string; receitas: number; despesas: number; saldo: number }[] = [];
    const count = viewMode === "semanal" ? 8 : 6;

    for (let i = -1; i < count; i++) {
      let start: Date, end: Date, label: string;

      if (viewMode === "semanal") {
        const week = addWeeks(today, i);
        start = startOfWeek(week, { weekStartsOn: 1 });
        end = endOfWeek(week, { weekStartsOn: 1 });
        label = i === 0 ? "Esta semana" : i === -1 ? "Semana passada" : `Sem ${format(start, "dd/MM")}`;
      } else {
        const month = addMonths(today, i);
        start = startOfMonth(month);
        end = endOfMonth(month);
        label = i === 0 ? "Este mês" : format(start, "MMM yy", { locale: ptBR });
      }

      const inPeriod = processed.filter((item) => {
        const d = new Date(item.due_date);
        return isWithinInterval(d, { start, end }) && item.status !== "cancelado";
      });

      const rec = inPeriod.filter((x) => x.type === "receita").reduce((s, x) => s + Number(x.status === "pago" ? (x.paid_amount || x.amount) : x.amount), 0);
      const desp = inPeriod.filter((x) => x.type === "despesa").reduce((s, x) => s + Number(x.status === "pago" ? (x.paid_amount || x.amount) : x.amount), 0);

      periods.push({ label, receitas: rec, despesas: desp, saldo: rec - desp });
    }

    return periods;
  }, [processed, viewMode]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.receitas, d.despesas)), 1);

  // Running balance
  let runningBalance = 0;
  const dataWithBalance = data.map((d) => {
    runningBalance += d.saldo;
    return { ...d, balance: runningBalance };
  });

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <ActionPill label="Semanal" active={viewMode === "semanal"} onClick={() => setViewMode("semanal")} />
        <ActionPill label="Mensal" active={viewMode === "mensal"} onClick={() => setViewMode("mensal")} />
      </div>

      {/* Chart - bar chart */}
      <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="p-5">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--success)]" />
              <span className="text-xs text-[var(--fg-muted)]">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--error)]" />
              <span className="text-xs text-[var(--fg-muted)]">Despesas</span>
            </div>
          </div>

          <div className="space-y-3">
            {dataWithBalance.map((period, idx) => (
              <motion.div
                key={period.label}
                variants={rowStagger}
                initial="initial"
                animate="animate"
                custom={idx}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--fg-muted)] w-28 shrink-0 truncate">{period.label}</span>
                  <div className="flex-1 space-y-1">
                    {/* Receita bar */}
                    <div className="h-4 rounded bg-[var(--border-subtle)] overflow-hidden">
                      <motion.div
                        className="h-full rounded bg-[var(--success)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(period.receitas / maxVal) * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.015 }}
                      />
                    </div>
                    {/* Despesa bar */}
                    <div className="h-4 rounded bg-[var(--border-subtle)] overflow-hidden">
                      <motion.div
                        className="h-full rounded bg-[var(--error)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(period.despesas / maxVal) * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.015 + 0.02 }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-24 shrink-0">
                    <p className={`text-xs font-semibold ${period.saldo >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                      {period.saldo >= 0 ? "+" : ""}{formatShortCurrency(period.saldo)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Período</th>
                <th className="text-right text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Receitas</th>
                <th className="text-right text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Despesas</th>
                <th className="text-right text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Saldo</th>
                <th className="text-right text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {dataWithBalance.map((period, idx) => (
                <motion.tr
                  key={period.label}
                  variants={rowStagger}
                  initial="initial"
                  animate="animate"
                  custom={idx}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="px-5 py-3 text-sm font-medium text-[var(--fg)]">{period.label}</td>
                  <td className="px-5 py-3 text-sm text-right text-[var(--success)]">{formatCurrency(period.receitas)}</td>
                  <td className="px-5 py-3 text-sm text-right text-[var(--error)]">{formatCurrency(period.despesas)}</td>
                  <td className={`px-5 py-3 text-sm text-right font-semibold ${period.saldo >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                    {period.saldo >= 0 ? "+" : ""}{formatCurrency(period.saldo)}
                  </td>
                  <td className={`px-5 py-3 text-sm text-right font-semibold ${period.balance >= 0 ? "text-[var(--fg)]" : "text-[var(--error)]"}`}>
                    {formatCurrency(period.balance)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB RELATÓRIOS                                                     */
/* ================================================================== */

function TabRelatorios({
  receitas,
  despesas,
}: {
  receitas: Installment[];
  despesas: Installment[];
}) {
  // Monthly revenue (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const today = new Date();
    const months: { label: string; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = addMonths(today, -i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const total = receitas
        .filter((r) => r.status === "pago" && r.paid_at && isWithinInterval(new Date(r.paid_at), { start, end }))
        .reduce((s, r) => s + Number(r.paid_amount || r.amount), 0);
      months.push({ label: format(start, "MMM", { locale: ptBR }), valor: total });
    }
    return months;
  }, [receitas]);

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.valor), 1);

  // Ticket médio por projeto
  const ticketMedio = useMemo(() => {
    const projetosMap = new Map<string, number>();
    receitas
      .filter((r) => r.status === "pago" && r.projects)
      .forEach((r) => {
        const pid = r.projects!.id;
        projetosMap.set(pid, (projetosMap.get(pid) || 0) + Number(r.paid_amount || r.amount));
      });
    const values = Array.from(projetosMap.values());
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [receitas]);

  // Taxa de inadimplência
  const inadimplencia = useMemo(() => {
    const actionable = receitas.filter((r) => r.status !== "cancelado");
    if (actionable.length === 0) return 0;
    const vencidos = actionable.filter((r) => r.status === "vencido");
    return (vencidos.length / actionable.length) * 100;
  }, [receitas]);

  // Margem (receita - despesa) / receita
  const totalReceitaPaga = receitas.filter((r) => r.status === "pago").reduce((s, r) => s + Number(r.paid_amount || r.amount), 0);
  const totalDespesaPaga = despesas.filter((d) => d.status === "pago").reduce((s, d) => s + Number(d.paid_amount || d.amount), 0);
  const margem = totalReceitaPaga > 0 ? ((totalReceitaPaga - totalDespesaPaga) / totalReceitaPaga) * 100 : 0;

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    receitas
      .filter((r) => r.status === "pago" && r.payment_method)
      .forEach((r) => {
        const method = paymentMethods[r.payment_method!] || r.payment_method;
        map.set(method!, (map.get(method!) || 0) + Number(r.paid_amount || r.amount));
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [receitas]);

  const totalByMethod = methodBreakdown.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-[var(--fg-muted)]" />
              <p className="text-[11px] font-medium text-[var(--fg-muted)]">Ticket médio</p>
            </div>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatCurrency(ticketMedio)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">por projeto</p>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-[var(--fg-muted)]" />
              <p className="text-[11px] font-medium text-[var(--fg-muted)]">Inadimplência</p>
            </div>
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${inadimplencia > 10 ? "text-[var(--error)]" : "text-[var(--fg)]"}`}>
              {inadimplencia.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">das receitas</p>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent size={14} className="text-[var(--fg-muted)]" />
              <p className="text-[11px] font-medium text-[var(--fg-muted)]">Margem</p>
            </div>
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${margem >= 50 ? "text-[var(--success)]" : margem >= 30 ? "text-[var(--warning)]" : "text-[var(--error)]"}`}>
              {margem.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">receita - despesa</p>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <CircleDollarSign size={14} className="text-[var(--fg-muted)]" />
              <p className="text-[11px] font-medium text-[var(--fg-muted)]">Lucro líquido</p>
            </div>
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none tabular-nums ${totalReceitaPaga - totalDespesaPaga >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
              {formatCurrency(totalReceitaPaga - totalDespesaPaga)}
            </p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">recebido - pago</p>
          </div>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Receita mensal</h3>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-5">
          <div className="flex items-end gap-3 h-40">
            {monthlyRevenue.map((month, idx) => (
              <div key={month.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-[var(--fg-muted)] font-medium">
                  {month.valor > 0 ? formatShortCurrency(month.valor) : "—"}
                </span>
                <motion.div
                  className="w-full rounded-t bg-[var(--success)] min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((month.valor / maxRevenue) * 120, 4)}px` }}
                  transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.015 }}
                />
                <span className="text-xs text-[var(--fg-muted)] capitalize">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment method breakdown */}
      {methodBreakdown.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Formas de pagamento</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)] p-5 space-y-3">
            {methodBreakdown.map(([method, val], idx) => (
              <motion.div
                key={method}
                variants={rowStagger}
                initial="initial"
                animate="animate"
                custom={idx}
                className="flex items-center gap-3"
              >
                <span className="text-sm text-[var(--fg)] w-32 shrink-0">{method}</span>
                <div className="flex-1 h-5 rounded bg-[var(--border-subtle)] overflow-hidden">
                  <motion.div
                    className="h-full rounded bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(val / totalByMethod) * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.015 }}
                  />
                </div>
                <span className="text-sm font-semibold text-[var(--fg)] w-24 text-right shrink-0">
                  {formatShortCurrency(val)}
                </span>
                <span className="text-xs text-[var(--fg-muted)] w-12 text-right shrink-0">
                  {totalByMethod > 0 ? `${((val / totalByMethod) * 100).toFixed(0)}%` : "—"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB COBRANÇA                                                       */
/* ================================================================== */

function TabCobranca({
  receitas,
  markAsPaid,
  asaasConnected = false,
  chargeViaAsaas,
  chargingId,
}: {
  receitas: Installment[];
  markAsPaid: (id: string) => void;
  asaasConnected?: boolean;
  chargeViaAsaas?: (id: string) => void;
  chargingId?: string | null;
}) {
  const overdue = receitas.filter((i) => i.status === "vencido");
  const upcoming = receitas.filter((i) => {
    if (i.status !== "pendente") return false;
    const d = new Date(i.due_date);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  // Group by client
  const overdueByClient = useMemo(() => {
    const map = new Map<string, { client: string; items: Installment[]; total: number }>();
    overdue.forEach((i) => {
      const key = i.clients?.id || "sem-cliente";
      const name = i.clients?.name || "Sem cliente";
      if (!map.has(key)) map.set(key, { client: name, items: [], total: 0 });
      const entry = map.get(key)!;
      entry.items.push(i);
      entry.total += Number(i.amount);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [overdue]);

  const totalOverdue = overdue.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--error-subtle)]">
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--error)" }}>
            {overdue.length} {overdue.length === 1 ? "parcela vencida" : "parcelas vencidas"} totalizando {formatCurrency(totalOverdue)}
          </p>
        </div>
      )}

      {/* Overdue by client */}
      {overdueByClient.length > 0 ? (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Vencidos por cliente</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            {overdueByClient.map((group, groupIdx) => (
              <div key={group.client} className={groupIdx > 0 ? "border-t border-[var(--border-subtle)]" : ""}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[var(--fg-muted)]" />
                      <span className="text-sm font-semibold text-[var(--fg)]">{group.client}</span>
                      <span className="text-xs text-[var(--fg-muted)]">({group.items.length} {group.items.length === 1 ? "parcela" : "parcelas"})</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--error)]">{formatCurrency(group.total)}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const daysOverdue = Math.floor((Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--fg)] truncate">{item.description}</p>
                            <p className="text-xs text-[var(--error)]">{daysOverdue} {daysOverdue === 1 ? "dia" : "dias"} em atraso</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-medium text-[var(--fg)]">{formatCurrency(Number(item.amount))}</span>
                            {asaasConnected && !item.asaas_payment_id && chargeViaAsaas && (
                              <button
                                onClick={() => chargeViaAsaas(item.id)}
                                disabled={chargingId === item.id}
                                className="h-7 px-2.5 rounded-lg bg-[var(--accent)] text-white text-[10px] font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center gap-1"
                                title="Cobrar via Asaas"
                              >
                                {chargingId === item.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Banknote size={12} />
                                )}
                                Cobrar
                              </button>
                            )}
                            {item.asaas_billing_url && (
                              <a
                                href={item.asaas_billing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 px-2.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--fg-secondary)] text-[10px] font-medium hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1"
                                title="Ver cobrança"
                              >
                                <ExternalLink size={11} />
                                Link
                              </a>
                            )}
                            <button
                              onClick={() => markAsPaid(item.id)}
                              className="p-1.5 rounded-lg text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors"
                              title="Marcar como pago"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={Bell}
            title="Nenhuma cobrança pendente"
            description="Todas as receitas estão em dia. Excelente!"
          />
        </div>
      )}

      {/* Upcoming (about to expire) */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Vencendo nos próximos 3 dias</h3>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {upcoming.map((item, idx) => (
                <InstallmentRow key={item.id} item={item} idx={idx} markAsPaid={markAsPaid} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Shared Components                                                  */
/* ================================================================== */

function InstallmentRow({
  item,
  idx,
  markAsPaid,
}: {
  item: Installment;
  idx: number;
  markAsPaid: (id: string) => void;
}) {
  const status = statusConfig[item.status];
  const isReceita = item.type === "receita";

  return (
    <motion.div
      variants={rowStagger}
      initial="initial"
      animate="animate"
      custom={idx}
      className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--card-hover)] transition-colors"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${isReceita ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg)] truncate">{item.description}</p>
        <p className="text-xs text-[var(--fg-muted)] truncate">
          {item.projects?.name || item.clients?.name || item.category || (isReceita ? "Receita" : "Despesa")}
          {" · "}
          {format(new Date(item.due_date), "d MMM", { locale: ptBR })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isReceita ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
          {isReceita ? "+" : "-"}{formatCurrency(Number(item.amount))}
        </p>
      </div>
      <StatusBadge label={status.label} color={status.color} bg={status.bg} />
      {(item.status === "pendente" || item.status === "vencido") && (
        <button
          onClick={() => markAsPaid(item.id)}
          className="p-1.5 rounded-lg text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors shrink-0"
          title="Marcar como pago"
        >
          <Check size={16} />
        </button>
      )}
    </motion.div>
  );
}

function InstallmentTable({
  items,
  markAsPaid,
  cancelInstallment,
  deleteInstallment,
  onEdit,
  showType = true,
  showCategory = false,
}: {
  items: Installment[];
  markAsPaid: (id: string) => void;
  cancelInstallment: (id: string) => void;
  deleteInstallment: (id: string) => void;
  onEdit: (inst: Installment) => void;
  showType?: boolean;
  showCategory?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Descrição</th>
            <th className="text-left text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">
              {showCategory ? "Categoria" : "Projeto / Cliente"}
            </th>
            <th className="text-left text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Vencimento</th>
            <th className="text-right text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Valor</th>
            <th className="text-center text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3">Status</th>
            <th className="text-center text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider px-5 py-3 w-28">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const status = statusConfig[item.status];
            const isReceita = item.type === "receita";
            const canAct = item.status === "pendente" || item.status === "vencido";

            return (
              <motion.tr
                key={item.id}
                variants={rowStagger}
                initial="initial"
                animate="animate"
                custom={idx}
                className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--card-hover)] transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {showType && (
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isReceita ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
                    )}
                    <span className="text-sm font-medium text-[var(--fg)]">{item.description}</span>
                  </div>
                  {item.payment_method && (
                    <p className="text-xs text-[var(--fg-muted)] ml-3.5 mt-0.5">
                      {paymentMethods[item.payment_method]}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3">
                  {showCategory ? (
                    <p className="text-sm text-[var(--fg)]">{item.category || "—"}</p>
                  ) : (
                    <>
                      {item.projects ? (
                        <Link
                          href={`/projetos?id=${item.projects.id}`}
                          className="text-sm text-[var(--accent)] hover:underline"
                        >
                          {item.projects.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-[var(--fg)]">—</p>
                      )}
                      {item.clients && (
                        <p className="text-xs text-[var(--fg-muted)]">{item.clients.name}</p>
                      )}
                    </>
                  )}
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-[var(--fg)]">
                    {format(new Date(item.due_date), "d MMM yyyy", { locale: ptBR })}
                  </p>
                </td>
                <td className="px-5 py-3 text-right">
                  <p className={`text-sm font-semibold ${isReceita ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                    {isReceita ? "+" : "-"}{formatCurrency(Number(item.amount))}
                  </p>
                </td>
                <td className="px-5 py-3 text-center">
                  <StatusBadge label={status.label} color={status.color} bg={status.bg} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {canAct && (
                      <button
                        onClick={() => markAsPaid(item.id)}
                        className="p-1.5 rounded-lg text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors"
                        title="Marcar como pago"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {canAct && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:bg-[var(--card-hover)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {item.status !== "pago" && (
                      <button
                        onClick={() => deleteInstallment(item.id)}
                        className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:bg-[var(--error-subtle)] hover:text-[var(--error)] transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/*  New Installment Form                                               */
/* ================================================================== */

function NewInstallmentForm({
  studioId,
  projects,
  clients,
  defaultType,
  onClose,
  onCreated,
}: {
  studioId: string;
  projects: SimpleRef[];
  clients: SimpleRef[];
  defaultType: FinancialType;
  onClose: () => void;
  onCreated: (inst: Installment) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: defaultType,
    description: "",
    amount: "",
    due_date: "",
    project_id: "",
    client_id: "",
    payment_method: "" as PaymentMethod | "",
    category: "",
    notes: "",
    recurring: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.due_date) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("installments")
      .insert({
        studio_id: studioId,
        type: form.type,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        project_id: form.project_id || null,
        client_id: form.client_id || null,
        payment_method: form.payment_method || null,
        category: form.category || null,
        notes: form.notes || null,
      })
      .select(`
        id, type, description, amount, due_date, status,
        payment_method, paid_at, paid_amount, category, notes,
        created_at, updated_at,
        projects (id, name),
        clients (id, name)
      `)
      .single();

    if (error) {
      toast.error("Erro: " + error.message);
      setLoading(false);
      return;
    }

    onCreated({ ...data, recurring: false } as unknown as Installment);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Tipo */}
      <div className="flex gap-2">
        {(["receita", "despesa"] as FinancialType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm({ ...form, type: t })}
            className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-colors ${
              form.type === t
                ? t === "receita"
                  ? "border-[var(--success)] bg-[var(--success-subtle)] text-[var(--success)]"
                  : "border-[var(--error)] bg-[var(--error-subtle)] text-[var(--error)]"
                : "border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--card-hover)]"
            }`}
          >
            {t === "receita" ? "Receita" : "Despesa"}
          </button>
        ))}
      </div>

      {/* Descrição */}
      <div>
        <label className={LABEL_CLS}>Descrição *</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={form.type === "receita" ? "Ex: Sinal do casamento Silva" : "Ex: Aluguel do estúdio"}
          required
          className={INPUT_CLS}
        />
      </div>

      {/* Valor + Vencimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Valor (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0,00"
            required
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Vencimento *</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            required
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Projeto + Cliente (only for receita) */}
      {form.type === "receita" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Projeto</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className={`w-full ${SELECT_CLS}`}
            >
              <option value="">Nenhum</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Cliente</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className={`w-full ${SELECT_CLS}`}
            >
              <option value="">Nenhum</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Método + Categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Forma de pagamento</label>
          <select
            value={form.payment_method}
            onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod | "" })}
            className={`w-full ${SELECT_CLS}`}
          >
            <option value="">Não definido</option>
            {Object.entries(paymentMethods).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Categoria</label>
          {form.type === "despesa" ? (
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`w-full ${SELECT_CLS}`}
            >
              <option value="">Selecionar...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ex: sinal, parcela"
              className={INPUT_CLS}
            />
          )}
        </div>
      </div>

      {/* Notes */}
      {form.type === "despesa" && (
        <div>
          <label className={LABEL_CLS}>Observações</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas opcionais..."
            className={INPUT_CLS}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.description.trim() || !form.amount || !form.due_date}
          className={PRIMARY_CTA}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Criando...
            </>
          ) : (
            form.type === "receita" ? "Criar receita" : "Criar despesa"
          )}
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/*  Edit Installment Form                                              */
/* ================================================================== */

function EditInstallmentForm({
  installment,
  onClose,
  onSave,
}: {
  installment: Installment;
  onClose: () => void;
  onSave: (updates: Partial<Pick<Installment, "description" | "amount" | "due_date" | "category" | "payment_method" | "notes">>) => void;
}) {
  const [form, setForm] = useState({
    description: installment.description,
    amount: String(installment.amount),
    due_date: installment.due_date,
    category: installment.category || "",
    payment_method: installment.payment_method || ("" as PaymentMethod | ""),
    notes: installment.notes || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.due_date) return;

    onSave({
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      category: form.category || null,
      payment_method: (form.payment_method || null) as PaymentMethod | null,
      notes: form.notes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Descrição */}
      <div>
        <label className={LABEL_CLS}>Descrição *</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          className={INPUT_CLS}
        />
      </div>

      {/* Valor + Vencimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Valor (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Vencimento *</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            required
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Método + Categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Forma de pagamento</label>
          <select
            value={form.payment_method}
            onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod | "" })}
            className={`w-full ${SELECT_CLS}`}
          >
            <option value="">Não definido</option>
            {Object.entries(paymentMethods).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Categoria</label>
          {installment.type === "despesa" ? (
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`w-full ${SELECT_CLS}`}
            >
              <option value="">Selecionar...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={INPUT_CLS}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!form.description.trim() || !form.amount || !form.due_date}
          className={PRIMARY_CTA}
        >
          Salvar alterações
        </button>
      </div>
    </form>
  );
}
