import { useState, useMemo, useEffect, type ReactNode } from "react";
import {
  Flame,
  CreditCard,
  CalendarPlus,
  Image,
  ChevronDown,
  FolderPlus,
  CalendarOff,
  Inbox,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springContentIn } from "../../lib/motion-tokens";
import { EXPAND_CLS } from "../../lib/apple-style";
import { toast } from "sonner";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import {
  TodayTimelineItem,
  type TodayTimelineItemData,
} from "../ui/today-timeline-item";
import {
  ActivityLogItem,
  type ActivityLogItemData,
} from "../ui/activity-log-item";
import { DashboardSuggestionCard } from "../ui/dashboard-suggestion-card";
import { ActionRowItem, type AcaoFinanceira } from "../ui/action-row-item";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { ProjetoTab } from "../../lib/navigation";
import { QuickCobrarModal } from "./QuickCobrarModal";
import { QuickAgendarEventoModal } from "./QuickAgendarEventoModal";
import { QuickEnviarFotosModal } from "./QuickEnviarFotosModal";
import { useAppStore } from "../../lib/appStore";
import { NotificationsWidget } from "./NotificationsWidget";
import { RecentOrdersWidget } from "./RecentOrdersWidget";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  DashboardContent — Apple Widget Dashboard                     */
/*  Now powered by the Apple Premium KIT components.              */
/* ═══════════════════════════════════════════════════════════════ */

/* ── Mock Data ── */

const agendaMock: TodayTimelineItemData[] = [
  { id: "ag-1", hora: "08:00", titulo: "Alinhamento pre-evento Oliveira", tipo: "reuniao", status: "concluido", cliente: "Ana Oliveira", local: "Google Meet" },
  { id: "ag-2", hora: "09:30", titulo: "Entrega album — Batizado Gabriel", tipo: "entrega", status: "concluido", cliente: "Pedro Costa" },
  { id: "ag-3", hora: "11:00", titulo: "Lembrete: enviar previa Formatura UFMG", tipo: "lembrete", status: "em_andamento", cliente: "Coord. Direito UFMG" },
  { id: "ag-4", hora: "14:00", titulo: "Sessao pre-wedding Oliveira", tipo: "evento", status: "pendente", cliente: "Ana Oliveira", local: "Parque das Mangabeiras" },
  { id: "ag-5", hora: "17:00", titulo: "Reuniao financeiro — TechCo", tipo: "reuniao", status: "pendente", cliente: "TechCo Brasil", local: "Escritorio" },
  { id: "ag-6", hora: "19:30", titulo: "Evento corporativo TechCo Annual", tipo: "evento", status: "pendente", cliente: "TechCo Brasil", local: "Centro de Conv. BH" },
];

const tarefasUrgMock: AcaoFinanceira[] = [
  { id: "tu-1", tipoLinha: "receber", projeto: "Casamento Oliveira & Santos", cliente: "Ana Oliveira", descricao: "Parcela 2/4 vencida ha 5 dias", valor: 3200, urgencia: "atrasada", tipo: "cobrar", vencimento: "18 Fev 2026", parcela: "2/4", diasAtraso: 5, projetoId: "proj-oliveira", metodo: "pix", nfStatus: "pendente", comprovante: "nao", statusParcela: "vencida" },
  { id: "tu-2", tipoLinha: "alerta", projeto: "Formatura Direito UFMG", cliente: "Coord. UFMG", descricao: "Entrega de previa do album vence hoje", valor: 0, urgencia: "hoje", tipo: "lembrete", vencimento: "23 Fev 2026", projetoId: "proj-ufmg", metodo: "boleto", nfStatus: "na", comprovante: "nao", statusParcela: "vence_hoje" },
  { id: "tu-3", tipoLinha: "receber", projeto: "Corporativo TechCo Annual", cliente: "TechCo Brasil", descricao: "Parcela 1/3 — vence amanha", valor: 8500, urgencia: "pendencia", tipo: "cobrar", vencimento: "24 Fev 2026", parcela: "1/3", projetoId: "proj-techco", metodo: "transferencia", nfStatus: "emitida", comprovante: "nao", statusParcela: "prevista" },
];

const atividadesMock: ActivityLogItemData[] = [
  { id: "at-1", usuario: "Marina R.", iniciais: "MR", acao: "fez upload de", alvo: "342 fotos — Casamento Oliveira", tempo: "ha 12 min", tipo: "upload" },
  { id: "at-2", usuario: "Carlos S.", iniciais: "CS", acao: "marcou como pago", alvo: "Parcela 3/5 — Formatura UFMG", tempo: "ha 45 min", tipo: "financeiro" },
  { id: "at-3", usuario: "Marina R.", iniciais: "MR", acao: "concluiu edicao de", alvo: "Ensaio Newborn — Baby Theo", tempo: "ha 1h", tipo: "edicao" },
  { id: "at-4", usuario: "Ana L.", iniciais: "AL", acao: "comentou em", alvo: "Galeria — Batizado Gabriel", tempo: "ha 2h", tipo: "comentario" },
  { id: "at-5", usuario: "Marina R.", iniciais: "MR", acao: "alterou status para", alvo: "Producao — Corporativo TechCo", tempo: "ha 3h", tipo: "status" },
  { id: "at-6", usuario: "Ana L.", iniciais: "AL", acao: "emitiu NF para", alvo: "Parcela 1/3 — TechCo Annual", tempo: "ha 4h", tipo: "documento" },
  { id: "at-7", usuario: "Carlos S.", iniciais: "CS", acao: "cadastrou cliente", alvo: "Familia Ribeiro", tempo: "ha 5h", tipo: "novo_cliente" },
  { id: "at-8", usuario: "Marina R.", iniciais: "MR", acao: "concluiu entrega de", alvo: "Album Digital — Batizado Gabriel", tempo: "ha 6h", tipo: "concluido" },
];

/* ═══════════════════════════════════════════════════ */
/*  MAIN                                               */
/* ═══════════════════════════════════════════════════ */

export interface DashboardContentProps {
  onNavigateToProject?: (projectId: string, tab?: ProjetoTab) => void;
  onNavigateToModule?: (
    module: "producao" | "financeiro" | "agenda" | "galeria" | "projetos",
    params?: Record<string, string>
  ) => void;
}

export function DashboardContent({
  onNavigateToProject,
  onNavigateToModule,
}: DashboardContentProps) {
  /* ── Loading state — 1.2s simulated fetch ── */
  const [isLoading, setIsLoading] = useState(true);
  const { getStats, notifications } = useAppStore();
  const stats = useMemo(() => getStats(), [getStats]);

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /* ── State ── */
  const [agenda, setAgenda] = useState<TodayTimelineItemData[]>(() => {
    if (typeof window === "undefined") return agendaMock;
    try {
      const saved = localStorage.getItem("essyn_dashboard_agenda");
      return saved ? JSON.parse(saved) : agendaMock;
    } catch { return agendaMock; }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = setTimeout(() => {
        localStorage.setItem("essyn_dashboard_agenda", JSON.stringify(agenda));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [agenda]);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; eventId: string; eventTitle: string;
  }>({ open: false, eventId: "", eventTitle: "" });

  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [showAgendarEventoModal, setShowAgendarEventoModal] = useState(false);
  const [showEnviarFotosModal, setShowEnviarFotosModal] = useState(false);

  const ACTIVITY_INITIAL_COUNT = 5;
  const visibleActivities = activityExpanded
    ? atividadesMock
    : atividadesMock.slice(0, ACTIVITY_INITIAL_COUNT);
  const hiddenCount = atividadesMock.length - ACTIVITY_INITIAL_COUNT;

  const tarefasSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tarefasUrgMock) {
      if (t.urgencia === "atrasada") counts["atrasada"] = (counts["atrasada"] || 0) + 1;
      else if (t.urgencia === "hoje") counts["vence hoje"] = (counts["vence hoje"] || 0) + 1;
      else counts["pendente"] = (counts["pendente"] || 0) + 1;
    }
    return Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(" · ");
  }, []);

  const hasAtrasadas = tarefasUrgMock.some((t) => t.urgencia === "atrasada");

  function toggleSelect(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function dismissAlert(id: string) {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }

  const contextLine = useMemo(() => {
    const atrasadas = tarefasUrgMock.filter((t) => t.urgencia === "atrasada").length;
    const pendentes = agendaMock.filter((a) => a.status === "pendente").length;
    const parts: string[] = [];
    if (atrasadas > 0) parts.push(`${atrasadas} parcela${atrasadas > 1 ? "s" : ""} vencida${atrasadas > 1 ? "s" : ""}`);
    parts.push(`${agendaMock.length} compromissos hoje`);
    if (pendentes > 0) parts.push(`${pendentes} pendentes`);
    return parts.join(" · ");
  }, []);

  const quickActions = useMemo(() => [
    { label: "Agendar evento", icon: <CalendarPlus className="w-4 h-4" />, onClick: () => setShowAgendarEventoModal(true) },
    { label: "Enviar fotos", icon: <Image className="w-4 h-4" />, onClick: () => setShowEnviarFotosModal(true) },
    { label: "Cobrar", icon: <CreditCard className="w-4 h-4" />, onClick: () => setShowCobrarModal(true) },
    { label: "Novo projeto", icon: <FolderPlus className="w-4 h-4" />, onClick: () => onNavigateToModule?.("projetos", { action: "create" }) },
  ], [onNavigateToModule]);

  const hasAlerts = !dismissedAlerts.has("alert-vencidas") || !dismissedAlerts.has("alert-nfs");
  const { isDark } = useDk();
  const hairline = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";

  /* ── Handlers ── */
  function handleMarkDone(id: string) {
    setAgenda((prev) => prev.map((item) => item.id === id ? { ...item, status: "concluido" as const } : item));
    const event = agenda.find((e) => e.id === id);
    toast.success("Evento concluido", { description: event?.titulo || "" });
  }

  function handleEdit(id: string) {
    const event = agenda.find((e) => e.id === id);
    toast("Editar evento", { description: event?.titulo || `Evento ${id}` });
  }

  function handleCancelRequest(id: string) {
    const event = agenda.find((e) => e.id === id);
    setConfirmDialog({ open: true, eventId: id, eventTitle: event?.titulo || "este evento" });
  }

  function handleCancelConfirm() {
    const { eventId, eventTitle } = confirmDialog;
    setAgenda((prev) => prev.filter((item) => item.id !== eventId));
    toast.success("Evento cancelado", { description: eventTitle });
  }

  /* ═══════════════════════════════════════════════════ */
  /*  RENDER                                             */
  /* ═══════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col w-full max-w-[1440px] gap-4">
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title="Cancelar evento?"
        description={`O evento "${confirmDialog.eventTitle}" sera cancelado e removido da agenda. Esta acao nao pode ser desfeita.`}
        confirmLabel="Sim, cancelar"
        cancelLabel="Manter evento"
        variant="destructive"
        onConfirm={handleCancelConfirm}
      />

      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          ════════════════════════════════════════════════════ */}

      <HeaderWidget
        userName="Marina"
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── Alerts ─── */}
        {hasAlerts && (
          <>
            <div className={`mx-5 h-px ${hairline}`} />
            <div className="flex flex-col px-2 py-1">
              {!dismissedAlerts.has("alert-vencidas") && (
                <InlineBanner
                  variant="danger"
                  title="2 parcelas vencidas totalizam R$ 6.400"
                  desc="Casamento Oliveira (R$ 3.200) e Ensaio Baby Theo (R$ 3.200) estao em atraso."
                  ctaLabel="Ver parcelas"
                  cta={() => onNavigateToModule?.("financeiro")}
                />
              )}
              {!dismissedAlerts.has("alert-nfs") && (
                <InlineBanner
                  variant="warning"
                  title="3 NFs pendentes de emissao"
                  desc="Projetos com valores recebidos ainda sem nota fiscal emitida."
                  ctaLabel="Emitir NFs"
                  cta={() => onNavigateToModule?.("financeiro")}
                  dismissible
                  onDismiss={() => dismissAlert("alert-nfs")}
                />
              )}
            </div>
          </>
        )}

        {/* ─── Metrics ─── */}
        <div className={`mx-5 h-px ${hairline}`} />
        {isLoading ? (
          <MetricsSkeleton />
        ) : (
          <DashboardKpiGrid
            flat
            projetos={{
              value: String(stats.projetosAtivos),
              sub: `${stats.producaoEmAndamento} em producao, ${stats.entregasPendentes} entrega${stats.entregasPendentes !== 1 ? "s" : ""}`,
              trend: { direction: "up", label: `${stats.totalLeads} leads no pipeline`, positive: true },
              tooltip: "Projetos com status ativo no mes corrente.",
            }}
            aReceber={{
              value: fmtBRL(stats.receberPendente),
              sub: stats.receberAtrasado > 0 ? `${fmtBRL(stats.receberAtrasado)} vencidos` : "nenhum vencido",
              trend: stats.receberAtrasado > 0
                ? { direction: "down", label: "parcelas atrasadas", positive: false }
                : { direction: "up", label: "em dia", positive: true },
              tooltip: "Soma de parcelas pendentes e vencidas de todos os projetos ativos.",
            }}
            producao={{
              value: `${stats.producaoEmAndamento} tarefas`,
              sub: `${stats.entregasPendentes} entrega${stats.entregasPendentes !== 1 ? "s" : ""} pendente${stats.entregasPendentes !== 1 ? "s" : ""}`,
              tooltip: "Trabalhos na fila de producao: captura, edicao, tratamento e entrega.",
            }}
            compromissos={{
              value: "6",
              sub: "2 eventos, 2 reunioes, 1 entrega, 1 lembrete",
              trend: { direction: "up", label: "+2 vs. ontem", positive: true },
              tooltip: "Eventos, reunioes e entregas agendadas para hoje.",
            }}
          />
        )}
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          CONTENT GRID
          ════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Left Column ── */}
        <div className="lg:col-span-7 col-span-1 flex flex-col gap-4">

          {/* AGENDA */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <WidgetSkeleton key="agenda-sk" rows={5} delay={0.06} />
            ) : (
              <WidgetCard
                key="agenda"
                title="Agenda de Hoje"
                count={agenda.length}
                action="Ver agenda"
                onAction={() => onNavigateToModule?.("agenda")}
                delay={0.06}
              >
                {agenda.length === 0 ? (
                  <WidgetEmptyState
                    icon={<CalendarOff className="w-6 h-6" />}
                    message="Nenhum compromisso agendado para hoje."
                    cta="Agendar evento"
                    onCta={() => setShowAgendarEventoModal(true)}
                  />
                ) : (
                  <AnimatePresence initial={false}>
                    {agenda.map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springContentIn}
                        className="overflow-hidden"
                      >
                        {i > 0 && <WidgetHairline indent={56} />}
                        <TodayTimelineItem
                          item={item}
                          onView={(id) => {
                            const today = new Date().toISOString().split("T")[0];
                            onNavigateToModule?.("agenda", { eventId: id, date: today });
                          }}
                          onMarkDone={handleMarkDone}
                          onEdit={handleEdit}
                          onCancel={handleCancelRequest}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </WidgetCard>
            )}
          </AnimatePresence>

          {/* TAREFAS URGENTES */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <WidgetSkeleton key="tarefas-sk" rows={3} delay={0.1} />
            ) : (
              <WidgetCard
                key="tarefas"
                title="Tarefas Urgentes"
                count={tarefasUrgMock.length}
                action="Ver producao"
                onAction={() => onNavigateToModule?.("producao")}
                delay={0.1}
                footer={
                  tarefasUrgMock.length > 0 ? (
                    <div className={`flex items-center justify-between px-5 py-2.5 border-t ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
                      <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                        {tarefasSummary}
                      </span>
                      {hasAtrasadas && (
                        <span
                          className="flex items-center gap-1 text-[10px] text-[#FF3B30]"
                          style={{ fontWeight: 500 }}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          SLA em risco
                        </span>
                      )}
                    </div>
                  ) : undefined
                }
              >
                {tarefasUrgMock.length === 0 ? (
                  <WidgetEmptyState
                    icon={<ListChecks className="w-6 h-6" />}
                    message="Nenhuma tarefa urgente no momento."
                  />
                ) : (
                  tarefasUrgMock.map((acao, idx) => (
                    <div key={acao.id}>
                      {idx > 0 && <div className={`mx-5 h-px ${hairline}`} />}
                      <ActionRowItem
                        acao={acao}
                        onAction={(id, tipo) => toast(`${tipo} — ${id}`, { description: acao.projeto })}
                        selected={selectedRows.has(acao.id)}
                        onToggleSelect={toggleSelect}
                        embedded
                      />
                    </div>
                  ))
                )}
              </WidgetCard>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-5 col-span-1 flex flex-col gap-4">

          {/* ATIVIDADES RECENTES */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <WidgetSkeleton key="ativ-sk" rows={5} withAvatar delay={0.09} />
            ) : (
              <WidgetCard
                key="atividades"
                title="Atividades Recentes"
                count={atividadesMock.length}
                action="Ver tudo"
                onAction={() => toast("Log de Atividades", { description: "Historico completo" })}
                delay={0.09}
              >
                {atividadesMock.length === 0 ? (
                  <WidgetEmptyState
                    icon={<Inbox className="w-6 h-6" />}
                    message="Nenhuma atividade recente registrada."
                  />
                ) : (
                  <>
                    <AnimatePresence initial={false}>
                      {visibleActivities.map((a, i) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={springContentIn}
                          className="overflow-hidden"
                        >
                          {i > 0 && <WidgetHairline indent={46} />}
                          <ActivityLogItem
                            activity={a}
                            onClick={(id) => toast(`Atividade ${id}`, { description: `${a.usuario} ${a.acao} ${a.alvo}` })}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {hiddenCount > 0 && (
                      <>
                        <div className={`mx-5 h-px ${hairline}`} />
                        <button
                          className={`flex items-center justify-center gap-1 py-3 text-[12px] transition-colors duration-150 cursor-pointer focus-visible:outline-none ${
                            isDark
                              ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#1C1C1E] active:bg-[#2C2C2E]"
                              : "text-[#8E8E93] hover:text-[#48484A] hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"
                          }`}
                          style={{ fontWeight: 500, borderRadius: "0 0 20px 20px" }}
                          onClick={() => setActivityExpanded(!activityExpanded)}
                        >
                          {activityExpanded ? "Ver menos" : `Ver mais ${hiddenCount}`}
                          <motion.div
                            animate={{ rotate: activityExpanded ? 180 : 0 }}
                            transition={springContentIn}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </motion.div>
                        </button>
                      </>
                    )}
                  </>
                )}
              </WidgetCard>
            )}
          </AnimatePresence>

          {/* SUGESTAO IA */}
          {!isLoading && (
            <DashboardSuggestionCard
              title="Cobrar parcela vencida"
              description='A parcela 2/4 do projeto "Casamento Oliveira & Santos" esta vencida ha 5 dias (R$ 3.200). O cliente foi notificado ha 3 dias sem resposta.'
              ctaLabel="Enviar lembrete"
              onCtaClick={() => toast.success("Lembrete enviado", { description: "WhatsApp enviado para Ana Oliveira" })}
              onDismiss={() => toast("Sugestao descartada")}
              variant="info"
              confidence={94}
            />
          )}

          {/* PEDIDOS RECENTES */}
          {!isLoading && <RecentOrdersWidget />}

          {/* NOTIFICACOES GLOBAIS */}
          {!isLoading && <NotificationsWidget />}
        </div>
      </div>

      {/* ── Modals ── */}
      <QuickCobrarModal open={showCobrarModal} onClose={() => setShowCobrarModal(false)} />
      <QuickAgendarEventoModal open={showAgendarEventoModal} onClose={() => setShowAgendarEventoModal(false)} />
      <QuickEnviarFotosModal open={showEnviarFotosModal} onClose={() => setShowEnviarFotosModal(false)} />
    </div>
  );
}