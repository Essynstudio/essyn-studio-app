/* ProducaoRadarContent — v2 safe tipo lookup */
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  CircleCheck,
  Clapperboard,
  Download,
  FolderKanban,
  Layers,
  ListChecks,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  springGentle,
  springGentleIn,
  springDefault,
  springOverlay,
  springBounce,
  springContentIn,
  withDelay,
} from "../../lib/motion-tokens";

/* ═══════════════════════════════════════════════════ */
/*  Apple Premium KIT                                  */
/* ═══════════════════════════════════════════════════ */
import {
  WidgetCard,
  WidgetHairline,
  WidgetEmptyState,
  SectionHeader,
  ActionPillGroup,
  InlineBanner,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import { FilterChip } from "../ui/filter-chip";
import { BulkActionsBar, type BulkAction } from "../ui/bulk-actions-bar";
import {
  RowSelectCheckbox,
  type CheckboxState,
} from "../ui/row-select-checkbox";
import {
  ProductionActionRowItem,
  type ProductionRowData,
  type ProductionItemType,
  type ProductionRowVariant,
} from "../ui/production-action-row-item";
import type {
  ProductionStage,
  ProductionStageState,
} from "../ui/production-stage-badge";
import type { TagVariant } from "../ui/tag-pill";
import { toast } from "sonner";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Production Store                                   */
/* ═══════════════════════════════════════════════════ */
import {
  getAllTrabalhos,
  advanceEtapa,
  addTrabalho,
  markTrabalhoFinalizado,
  computeStats,
  modelosServico,
  equipe,
  type TrabalhoProducao,
  type TrabalhoTipo,
  type TrabalhoStatus,
  type EtapaStatus,
  type ModeloServico,
} from "./productionStore";
import { projetos } from "../projetos/projetosData";
import { useAppStore } from "../../lib/appStore";

/* ═══════════════════════════════���═══════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type TabFilter = "novo" | "em_producao" | "finalizado";
type ChipFilter =
  | "all"
  | "atrasados"
  | "vence_7d"
  | "aguardando"
  | "sem_resp"
  | "alto_vol";

/* ═══════════════════════════════════════════════════ */
/*  MAPPING — Store → ProductionActionRowItem data    */
/* ═══════════════════════════════════════════════════ */

/** Map etapa name to closest ProductionStage */
function mapEtapaNomeToStage(nome: string): ProductionStage {
  const lower = nome.toLowerCase();
  if (lower.includes("backup") || lower.includes("upload")) return "backup";
  if (
    lower.includes("prévia") ||
    lower.includes("previa") ||
    lower.includes("projeção") ||
    lower.includes("projecao")
  )
    return "previa";
  if (lower.includes("seleção") || lower.includes("selecao")) return "selecao";
  if (
    lower.includes("edição") ||
    lower.includes("edicao") ||
    lower.includes("diagramação") ||
    lower.includes("tratamento") ||
    lower.includes("acabamento") ||
    lower.includes("color")
  )
    return "edicao";
  if (
    lower.includes("entregue") ||
    lower.includes("impressão") ||
    lower.includes("galeria") ||
    lower.includes("concluído") ||
    lower.includes("revisão") ||
    lower.includes("link ativo") ||
    lower.includes("finalização") ||
    lower.includes("finalizacao")
  )
    return "entregue";
  return "edicao";
}

/** Map store EtapaStatus to ProductionStageState */
function mapEtapaStatusToState(status: EtapaStatus): ProductionStageState {
  switch (status) {
    case "concluida":
      return "concluido";
    case "atual":
      return "em_andamento";
    case "aguardando":
      return "aguardando_cliente";
    case "atrasada":
      return "atrasado";
    case "pendente":
      return "nao_iniciado";
    default:
      return "nao_iniciado";
  }
}

/** Determine row variant from store data */
function determineRowVariant(t: TrabalhoProducao): ProductionRowVariant {
  if (t.aguardandoCliente) return "aguardando_cliente";
  if (
    t.diasRestantes < 0 ||
    (t.prioridade === "urgente" && t.diasRestantes <= 2)
  )
    return "atrasado";
  return "servico";
}

/** Build tags (max 4) for a TrabalhoProducao */
function buildRowTags(
  t: TrabalhoProducao
): { label: string; variant: TagVariant }[] {
  const tags: { label: string; variant: TagVariant }[] = [];
  if (t.itens) tags.push({ label: t.itens, variant: "neutral" });
  if (t.responsavel)
    tags.push({ label: t.responsavel.iniciais, variant: "neutral" });
  if (t.aguardandoCliente) tags.push({ label: "Aguard.", variant: "purple" });
  else if (t.prioridade === "urgente")
    tags.push({ label: "Urgente", variant: "danger" });
  if (
    t.diasRestantes <= 7 &&
    t.diasRestantes >= 0 &&
    t.status !== "finalizado"
  )
    tags.push({ label: `${t.diasRestantes}d`, variant: "warning" });
  return tags.slice(0, 4);
}

/** Convert TrabalhoProducao → ProductionRowData */
function toProductionRowData(t: TrabalhoProducao): ProductionRowData {
  const currentEtapaIdx = t.etapas.findIndex(
    (e) =>
      e.status === "atual" ||
      e.status === "aguardando" ||
      e.status === "atrasada"
  );
  const currentEtapa =
    currentEtapaIdx >= 0 ? t.etapas[currentEtapaIdx] : null;
  const doneCount = t.etapas.filter((e) => e.status === "concluida").length;

  return {
    id: t.id,
    projeto: t.projeto,
    projetoId: t.projetoId,
    cliente: t.cliente,
    titulo: t.titulo,
    tipo: t.tipo as ProductionItemType,
    rowVariant: determineRowVariant(t),
    stage: currentEtapa
      ? mapEtapaNomeToStage(currentEtapa.nome)
      : t.status === "finalizado"
      ? "entregue"
      : "backup",
    stageState: currentEtapa
      ? mapEtapaStatusToState(currentEtapa.status)
      : t.status === "finalizado"
      ? "concluido"
      : "nao_iniciado",
    currentStep: doneCount,
    totalSteps: t.etapas.length,
    slaDays: t.diasRestantes,
    progress: t.progresso,
    responsavel: t.responsavel.iniciais,
    priority:
      t.prioridade === "urgente"
        ? "urgente"
        : t.prioridade === "baixa"
        ? "baixa"
        : "normal",
    tags: buildRowTags(t),
  };
}

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                           */
/* ═══════════════════════════════════════════════════ */

const tipoConfig: Record<
  TrabalhoTipo,
  { label: string; bg: string; text: string }
> = {
  edicao: { label: "Edição", bg: "bg-[#FAF7F0]", text: "text-[#FF9500]" },
  album: { label: "Álbum", bg: "bg-[#F2F8F4]", text: "text-[#34C759]" },
  tratamento: {
    label: "Tratamento",
    bg: "bg-[#FBF5F4]",
    text: "text-[#FF3B30]",
  },
  impressao: {
    label: "Impressão",
    bg: "bg-[#F2F2F7]",
    text: "text-[#8E8E93]",
  },
};

const safeGetTipo = (tipo: string) =>
  tipoConfig[tipo as TrabalhoTipo] ?? tipoConfig.edicao;

const statusTabConfig: Record<
  TrabalhoStatus,
  { label: string; dot: string; count: string }
> = {
  novo: { label: "Novos", dot: "bg-[#C7C7CC]", count: "text-[#AEAEB2]" },
  em_producao: {
    label: "Em produção",
    dot: "bg-[#8E8E93]",
    count: "text-[#8E8E93]",
  },
  finalizado: {
    label: "Finalizados",
    dot: "bg-[#34C759]",
    count: "text-[#34C759]",
  },
};

/* ── Chip filter configs ── */

const chipFilters: {
  key: ChipFilter;
  label: string;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}[] = [
  {
    key: "atrasados",
    label: "Atrasados",
    dot: "bg-[#FF3B30]",
    chipBg: "bg-[#FBF5F4]",
    chipText: "text-[#FF3B30]",
    chipBorder: "border-[#F2DDD9]",
  },
  {
    key: "vence_7d",
    label: "Vence em 7d",
    dot: "bg-[#FF9500]",
    chipBg: "bg-[#FAF7F0]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#EFEAD8]",
  },
  {
    key: "aguardando",
    label: "Aguardando cliente",
    dot: "bg-[#AF52DE]",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-[#AF52DE]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "sem_resp",
    label: "Sem responsável",
    dot: "bg-[#D1D1D6]",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-[#8E8E93]",
    chipBorder: "border-[#E5E5EA]",
  },
  {
    key: "alto_vol",
    label: "Alto volume",
    dot: "bg-[#8E8E93]",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-[#636366]",
    chipBorder: "border-[#E5E5EA]",
  },
];

function matchChipFilter(
  t: TrabalhoProducao,
  chip: ChipFilter,
  allTrabalhos: TrabalhoProducao[]
): boolean {
  if (chip === "all") return true;
  const active = allTrabalhos.filter((x) => x.status !== "finalizado");
  switch (chip) {
    case "atrasados":
      return (
        t.diasRestantes < 0 ||
        (t.prioridade === "urgente" && t.diasRestantes <= 2)
      );
    case "vence_7d":
      return t.diasRestantes >= 0 && t.diasRestantes <= 7;
    case "aguardando":
      return !!t.aguardandoCliente;
    case "sem_resp":
      return false;
    case "alto_vol": {
      const count = active.filter(
        (x) => x.responsavel.iniciais === t.responsavel.iniciais
      ).length;
      return count >= 3;
    }
    default:
      return true;
  }
}

/* ═══════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                    */
/* ═══════════════════════════════════════════════════ */

/* ── Radar De Entregas ── */

function RadarDeEntregas({
  trabalhos,
}: {
  trabalhos: TrabalhoProducao[];
}) {
  const em_andamento = trabalhos.filter((t) => t.status !== "finalizado");
  const bucket7 = em_andamento.filter(
    (t) => t.diasRestantes >= 0 && t.diasRestantes <= 7
  );
  const bucket14 = em_andamento.filter(
    (t) => t.diasRestantes > 7 && t.diasRestantes <= 14
  );
  const bucket30 = em_andamento.filter(
    (t) => t.diasRestantes > 14 && t.diasRestantes <= 30
  );
  const atrasados = em_andamento.filter((t) => t.diasRestantes < 0);
  const urgentes = bucket7.filter((t) => t.prioridade === "urgente");

  const hasUrgente7d = bucket7.some((t) => t.prioridade === "urgente");
  const segments = [
    {
      key: "7d",
      label: "Próximos 7 dias",
      count: bucket7.length,
      items: bucket7,
      solidCount: hasUrgente7d ? "#FF3B30" : "#FF9500",
      solidBar: hasUrgente7d ? "#F2DDD9" : "#EFEAD8",
    },
    {
      key: "14d",
      label: "7 – 14 dias",
      count: bucket14.length,
      items: bucket14,
      solidCount: "#636366",
      solidBar: "#C7C7CC",
    },
    {
      key: "30d",
      label: "14 – 30 dias",
      count: bucket30.length,
      items: bucket30,
      solidCount: "#636366",
      solidBar: "#C7C7CC",
    },
  ];

  return (
    <WidgetCard
      title="Radar de Entregas"
      count={`${em_andamento.length} ativo${em_andamento.length !== 1 ? "s" : ""}`}
      action={
        atrasados.length > 0
          ? `${atrasados.length} atrasado${atrasados.length !== 1 ? "s" : ""}`
          : undefined
      }
      delay={0.05}
    >
      <div className="flex items-center gap-6 px-5 py-3 border-b border-[#F2F2F7]">
        {[
          {
            dot: "#FF3B30",
            label: `${urgentes.length} urgente${urgentes.length !== 1 ? "s" : ""}`,
          },
          { dot: "#FF9500", label: `${bucket7.length} em 7d` },
          { dot: "#636366", label: `${bucket14.length} em 14d` },
          { dot: "#636366", label: `${bucket30.length} em 30d` },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: l.dot }}
            />
            <span
              className="text-[11px] text-[#636366]"
              style={{ fontWeight: 400 }}
            >
              {l.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0 divide-x divide-[#F2F2F7]">
        {segments.map((seg, si) => (
          <motion.div
            key={seg.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={withDelay(springGentle, 0.1 + si * 0.06)}
            className="p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[12px] text-[#636366]"
                style={{ fontWeight: 500 }}
              >
                {seg.label}
              </span>
              <span
                className="text-[18px] numeric"
                style={{ fontWeight: 600, color: seg.solidCount }}
              >
                {seg.count}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (seg.count / Math.max(em_andamento.length, 1)) * 100)}%`,
                }}
                transition={withDelay(springGentle, 0.2 + si * 0.08)}
                style={{ backgroundColor: seg.solidBar }}
              />
            </div>
            <div className="flex flex-col gap-1.5 min-h-[40px]">
              {seg.items.length > 0 ? (
                seg.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-1 py-1.5 border-b border-[#F5F5F7] last:border-b-0"
                  >
                    <span
                      className={`text-[9px] ${safeGetTipo(item.tipo).text} shrink-0`}
                      style={{ fontWeight: 500 }}
                    >
                      {safeGetTipo(item.tipo).label}
                    </span>
                    <span
                      className="text-[11px] text-[#8E8E93] truncate flex-1"
                      style={{ fontWeight: 400 }}
                    >
                      {item.titulo}
                    </span>
                    <span
                      className="text-[10px] numeric text-[#C7C7CC] shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      {item.diasRestantes}d
                    </span>
                  </div>
                ))
              ) : (
                <span
                  className="text-[11px] text-[#D1D1D6] py-2"
                  style={{ fontWeight: 400 }}
                >
                  Nenhuma entrega
                </span>
              )}
              {seg.items.length > 3 && (
                <span
                  className="text-[10px] text-[#D1D1D6] pl-2"
                  style={{ fontWeight: 400 }}
                >
                  +{seg.items.length - 3} mais
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </WidgetCard>
  );
}

/* ── Queue Tabs ── */

function QueueTabs({
  active,
  counts,
  onChange,
}: {
  active: TabFilter;
  counts: Record<TrabalhoStatus, number>;
  onChange: (tab: TabFilter) => void;
}) {
  const { isDark } = useDk();
  const tabs: { id: TabFilter; label: string }[] = [
    { id: "novo", label: "Novos" },
    { id: "em_producao", label: "Em produção" },
    { id: "finalizado", label: "Finalizados" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Fila de produção"
      className={`flex items-center gap-0 border-b px-5 ${isDark ? "border-[#2C2C2E]" : "border-[#E5E5EA]"}`}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const cfg = statusTabConfig[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
              isActive
                ? isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"
                : isDark ? "text-[#636366] hover:text-[#8E8E93]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
            }`}
            style={{ fontWeight: isActive ? 600 : 400 }}
          >
            <span
              className={`w-[5px] h-[5px] rounded-full transition-colors ${isActive ? cfg.dot : isDark ? "bg-[#3C3C43]" : "bg-[#E5E5EA]"}`}
              aria-hidden="true"
            />
            {tab.label}
            <span
              className={`text-[11px] numeric tabular-nums ${isActive ? cfg.count : isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`}
              style={{ fontWeight: 500 }}
              aria-label={`${counts[tab.id]} itens`}
            >
              {counts[tab.id]}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full ${isDark ? "bg-[#F5F5F7]" : "bg-[#1D1D1F]"}`}
                transition={springDefault}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STATE SCREENS                                     */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  const { isDark } = useDk();
  const skelBg = isDark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]";
  const skelBg2 = isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]";
  const skelBorder = isDark ? "border-[#2C2C2E]" : "border-[#E5E5EA]";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-lg ${skelBg}`} />
          <div
            className={`h-3 rounded ${skelBg}`}
            style={{ width: 130 }}
          />
        </div>
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#141414] border-[#2C2C2E]" : "bg-white border-[#E5E5EA]"}`}>
          <div className={`flex items-center gap-6 px-5 py-3 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
            {[60, 50, 50, 50].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${skelBg}`} />
                <div
                  className={`h-2 rounded ${skelBg}`}
                  style={{ width: w }}
                />
              </div>
            ))}
          </div>
          <div className={`grid grid-cols-3 gap-0 divide-x ${isDark ? "divide-[#2C2C2E]" : "divide-[#F2F2F7]"}`}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-2.5 rounded ${skelBg}`}
                    style={{ width: 80 + i * 10 }}
                  />
                  <div
                    className={`h-5 rounded ${skelBg2}`}
                    style={{ width: 20 }}
                  />
                </div>
                <div className={`w-full h-1.5 rounded-full ${skelBg}`} />
                {[0, 1].map((j) => (
                  <div key={j} className={`h-7 rounded-lg ${skelBg}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-[88px] rounded-2xl animate-pulse ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-7 w-24 rounded-xl animate-pulse ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`}
          />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`h-[88px] rounded-2xl animate-pulse ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`}
        />
      ))}
      <div className="flex items-center justify-center gap-2 py-4">
        <LoaderCircle className={`w-4 h-4 animate-spin ${isDark ? "text-[#3C3C43]" : "text-[#E5E5EA]"}`} />
        <span
          className="text-[12px] text-[#D1D1D6]"
          style={{ fontWeight: 400 }}
        >
          Carregando produção...
        </span>
      </div>
    </div>
  );
}

function EmptyStateView() {
  const { isDark } = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 gap-5">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
        <Clapperboard className="w-7 h-7 text-[#D1D1D6]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="text-[16px] text-[#8E8E93]"
          style={{ fontWeight: 500 }}
        >
          Fila vazia
        </span>
        <span
          className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]"
          style={{ fontWeight: 400 }}
        >
          Nenhum trabalho na fila de produção. Adicione um serviço para começar
          a acompanhar.
        </span>
      </div>
      <button
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-2 ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`}
        style={{ fontWeight: 500 }}
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar serviço
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { isDark } = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 gap-5">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]"}`}>
        <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="text-[16px] text-[#8E8E93]"
          style={{ fontWeight: 500 }}
        >
          Erro ao carregar produção
        </span>
        <span
          className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]"
          style={{ fontWeight: 400 }}
        >
          Não foi possível carregar a fila. Verifique sua conexão e tente
          novamente.
        </span>
      </div>
      <button
        onClick={onRetry}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-2 ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`}
        style={{ fontWeight: 500 }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Tentar novamente
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN — ProducaoRadarContent                       */
/*                                                     */
/*  Follows Dashboard pattern:                         */
/*  HeaderWidget (greeting + context + pills + alerts  */
/*    + KPIs inside) → Radar → Queue → Footer          */
/* ═══════════════════════════════════════════════════ */

export function ProducaoRadarContent({
  onNavigateToProject,
}: {
  onNavigateToProject?: (projetoId: string) => void;
}) {
  const { addNotification, createGalleryFromProject, projects } = useAppStore();
  const { isDark } = useDk();
  const viewState: ViewState = "ready";
  const [activeTab, setActiveTab] = useState<TabFilter>("em_producao");
  const [activeChip, setActiveChip] = useState<ChipFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(
    new Set()
  );
  const [version, setVersion] = useState(0);

  /* ── Novo Serviço modal state ── */
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [modalStep, setModalStep] = useState<
    "template" | "form" | "creating" | "success"
  >("template");
  const [selectedModelo, setSelectedModelo] = useState<ModeloServico | null>(
    null
  );
  const [formProjetoId, setFormProjetoId] = useState("");
  const [formTitulo, setFormTitulo] = useState("");
  const [formResponsavelIdx, setFormResponsavelIdx] = useState(0);
  const [formPrazoISO, setFormPrazoISO] = useState("2026-03-15");
  const [formPrioridade, setFormPrioridade] = useState<
    "urgente" | "normal" | "baixa"
  >("normal");

  function openNovoModal() {
    setShowNovoModal(true);
    setModalStep("template");
    setSelectedModelo(null);
    setFormProjetoId("");
    setFormTitulo("");
    setFormResponsavelIdx(0);
    setFormPrazoISO("2026-03-15");
    setFormPrioridade("normal");
  }

  function closeNovoModal() {
    setShowNovoModal(false);
  }

  /* ── Escape key handler for modal ── */
  useEffect(() => {
    if (!showNovoModal || modalStep === "creating") return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeNovoModal();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNovoModal, modalStep]);

  function selectTemplate(modelo: ModeloServico) {
    setSelectedModelo(modelo);
    setFormTitulo(modelo.nome);
    const defaultDate = new Date("2026-02-23");
    defaultDate.setDate(defaultDate.getDate() + modelo.slaDias);
    setFormPrazoISO(defaultDate.toISOString().split("T")[0]);
    setModalStep("form");
  }

  function handleCreateTrabalho() {
    if (!selectedModelo || !formProjetoId || !formTitulo) return;
    const proj = projetos.find((p) => p.id === formProjetoId);
    if (!proj) return;
    setModalStep("creating");
    setTimeout(() => {
      const etapas = selectedModelo.etapas.map((nome, i) => ({
        nome,
        status: (i === 0 ? "atual" : "pendente") as EtapaStatus,
        data: i === 0 ? "Hoje" : undefined,
      }));
      addTrabalho({
        projeto: proj.nome,
        projetoId: proj.id,
        cliente: proj.cliente,
        titulo: formTitulo,
        tipo: selectedModelo.tipo,
        status: "novo",
        responsavel: equipe[formResponsavelIdx],
        prioridade: formPrioridade,
        prazo: new Date(formPrazoISO + "T12:00:00").toLocaleDateString(
          "pt-BR",
          { day: "2-digit", month: "short", year: "numeric" }
        ),
        prazoISO: formPrazoISO,
        itens: undefined,
        aguardandoCliente: false,
        slaDias: selectedModelo.slaDias,
        etapas,
      });
      setVersion((v) => v + 1);
      setModalStep("success");
      toast.success(`"${formTitulo}" criado na fila de produção`);
    }, 800);
  }

  /* ── Data from store ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTrabalhos = getAllTrabalhos();
  const stats = computeStats(allTrabalhos);

  /* ── Filter ── */
  const filteredTrabalhos = allTrabalhos.filter((t) => {
    if (t.status !== activeTab) return false;
    if (
      activeChip !== "all" &&
      !matchChipFilter(t, activeChip, allTrabalhos)
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.titulo.toLowerCase().includes(q) ||
        t.projeto.toLowerCase().includes(q) ||
        t.cliente.toLowerCase().includes(q) ||
        t.responsavel.nome.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts: Record<TrabalhoStatus, number> = {
    novo: allTrabalhos.filter((t) => t.status === "novo").length,
    em_producao: allTrabalhos.filter((t) => t.status === "em_producao").length,
    finalizado: allTrabalhos.filter((t) => t.status === "finalizado").length,
  };

  /* ── Chip counts (scoped to active tab) ── */
  const tabScoped = allTrabalhos.filter((t) => t.status === activeTab);
  const chipCounts: Record<ChipFilter, number> = {
    all: tabScoped.length,
    atrasados: tabScoped.filter((t) =>
      matchChipFilter(t, "atrasados", allTrabalhos)
    ).length,
    vence_7d: tabScoped.filter((t) =>
      matchChipFilter(t, "vence_7d", allTrabalhos)
    ).length,
    aguardando: tabScoped.filter((t) =>
      matchChipFilter(t, "aguardando", allTrabalhos)
    ).length,
    sem_resp: 0,
    alto_vol: tabScoped.filter((t) =>
      matchChipFilter(t, "alto_vol", allTrabalhos)
    ).length,
  };

  /* ── P02: Multi-select ── */
  const filteredIds = filteredTrabalhos.map((t) => t.id);
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

  /* ── Handlers ── */
  const handleAdvance = useCallback((id: string) => {
    const trabalho = allTrabalhos.find((t) => t.id === id);
    advanceEtapa(id);
    setVersion((v) => v + 1);
    toast.success("Etapa avançada");
    if (trabalho) {
      const etapaAtual = trabalho.etapas.find((e) => e.status === "atual" || e.status === "aguardando" || e.status === "atrasada");
      const nextIdx = etapaAtual ? trabalho.etapas.indexOf(etapaAtual) + 1 : -1;
      const nextEtapa = nextIdx >= 0 && nextIdx < trabalho.etapas.length ? trabalho.etapas[nextIdx].nome : "Concluído";
      addNotification({
        type: nextEtapa === "Concluído" || nextEtapa === "Entregue" ? "delivery_ready" : "production_advanced",
        title: nextEtapa === "Concluído" || nextEtapa === "Entregue" ? "Trabalho pronto!" : "Etapa avançada",
        description: `${trabalho.projeto} — ${trabalho.titulo} → ${nextEtapa}`,
        timestamp: "agora",
        read: false,
        route: "/producao",
      });
    }
  }, [allTrabalhos, addNotification]);

  const handleBulkFinalize = useCallback(() => {
    selectedIds.forEach((id) => {
      const trabalho = allTrabalhos.find((t) => t.id === id);
      markTrabalhoFinalizado(id);
      if (trabalho) {
        addNotification({
          type: "delivery_ready",
          title: "Trabalho finalizado",
          description: `${trabalho.projeto} — ${trabalho.titulo}`,
          timestamp: "agora",
          read: false,
          route: "/producao",
        });
      }
    });
    clearSelection();
    setVersion((v) => v + 1);
    toast.success(
      `${selectedIds.size} trabalho${selectedIds.size > 1 ? "s" : ""} finalizado${selectedIds.size > 1 ? "s" : ""}`
    );
  }, [selectedIds, clearSelection, allTrabalhos, addNotification]);

  const handleRowAction = useCallback(
    (id: string, action: string) => {
      const trabalho = allTrabalhos.find((t) => t.id === id);
      if (action === "Marcar finalizado" && trabalho) {
        markTrabalhoFinalizado(id);
        setVersion((v) => v + 1);
        toast.success(`"${trabalho.titulo}" finalizado`);
        addNotification({
          type: "delivery_ready",
          title: "Trabalho finalizado",
          description: `${trabalho.projeto} — ${trabalho.titulo}`,
          timestamp: "agora",
          read: false,
          route: "/producao",
        });
      } else if (action === "Criar galeria") {
        /* Find the project linked to this work item */
        const proj = projects.find((p) => p.id === trabalho?.projetoId);
        if (proj) {
          const gallery = createGalleryFromProject(proj.id);
          if (gallery) {
            toast.success("Rascunho de galeria criado!", {
              description: `Galeria "${gallery.nome}" criada a partir da produção.`,
              action: {
                label: "Ir para Galeria",
                onClick: () => { window.location.href = "/galeria"; },
              },
            });
          }
        } else {
          toast.success("Rascunho de galeria criado!", {
            description: `Galeria "${trabalho?.projeto}" criada. Acesse a aba Galeria para completar.`,
            action: {
              label: "Ir para Galeria",
              onClick: () => { window.location.href = "/galeria"; },
            },
          });
        }
      } else if (action === "Reatribuir") {
        toast("Reatribuir", { description: trabalho?.titulo });
      } else if (action === "Alterar prazo") {
        toast("Alterar prazo", { description: trabalho?.titulo });
      }
    },
    [allTrabalhos, addNotification, projects, createGalleryFromProject]
  );

  const dismissAlert = useCallback((key: string) => {
    setAlertsDismissed((prev) => new Set(prev).add(key));
  }, []);

  /* ── Convert store data → ProductionActionRowItem data ── */
  const rowDataItems: ProductionRowData[] =
    filteredTrabalhos.map(toProductionRowData);

  /* ── BulkActionsBar ── */
  const bulkActions: BulkAction[] = [
    {
      label: "Atribuir responsável",
      icon: <Users className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Mover etapa",
      icon: <ListChecks className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Marcar concluído",
      icon: <CircleCheck className="w-3 h-3" />,
      onClick: handleBulkFinalize,
    },
    {
      label: "Exportar",
      icon: <Download className="w-3 h-3" />,
      onClick: clearSelection,
    },
    {
      label: "Criar galerias",
      icon: <Clapperboard className="w-3 h-3" />,
      onClick: () => {
        let created = 0;
        selectedIds.forEach((id) => {
          const trabalho = allTrabalhos.find((t) => t.id === id);
          if (trabalho) {
            const proj = projects.find((p) => p.id === trabalho.projetoId);
            if (proj) {
              createGalleryFromProject(proj.id);
              created++;
            }
          }
        });
        if (created > 0) {
          toast.success(`${created} galeria${created !== 1 ? "s" : ""} criada${created !== 1 ? "s" : ""}!`, {
            description: "Rascunhos disponíveis na aba Galeria",
          });
        }
        clearSelection();
      },
    },
  ];

  /* ── Context line ── */
  const contextLine = `${stats.emProducao} em produção · ${stats.atrasados > 0 ? `${stats.atrasados} atrasado${stats.atrasados !== 1 ? "s" : ""} · ` : ""}${allTrabalhos.length} trabalhos`;

  const hasAlerts =
    (stats.atrasados > 0 && !alertsDismissed.has("atrasados")) ||
    (stats.aguardandoCliente > 0 && !alertsDismissed.has("aguardando"));

  const hairline = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  const sep = isDark ? "bg-[#3C3C43]" : "bg-[#E5E5EA]";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══════════════════════════════════════════════ */}
      {/* WIDGET 1 — HEADER (via HeaderWidget KIT)       */}
      {/* Same pattern as Dashboard                       */}
      {/* ═══════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Produção"
        userName=""
        contextLine={contextLine}
        quickActions={[
          {
            label: "Novo serviço",
            icon: <Plus className="w-4 h-4" />,
            onClick: openNovoModal,
          },
          {
            label: "Avançar etapa",
            icon: <Check className="w-4 h-4" />,
            onClick: () => toast("Avançar etapa"),
          },
          {
            label: "Reatribuir",
            icon: <UserPlus className="w-4 h-4" />,
            onClick: () => toast("Reatribuir"),
          },
          {
            label: "Alterar prazo",
            icon: <CalendarClock className="w-4 h-4" />,
            onClick: () => toast("Alterar prazo"),
          },
          {
            label: "Exportar",
            icon: <Download className="w-4 h-4" />,
            onClick: () => toast("Exportar"),
          },
        ]}
      >
        {/* ─── Alerts (same pattern as Dashboard) ─── */}
        {hasAlerts && (
          <>
            <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
            <div className="flex flex-col px-2 py-1">
              {stats.atrasados > 0 &&
                !alertsDismissed.has("atrasados") && (
                  <InlineBanner
                    variant="danger"
                    title={`${stats.atrasados} trabalho${stats.atrasados > 1 ? "s" : ""} com prazo crítico`}
                    desc="Redistribua tarefas ou ajuste prazos para evitar atrasos."
                    ctaLabel="Ver atrasados"
                    cta={() => {
                      setActiveChip("atrasados");
                      dismissAlert("atrasados");
                    }}
                    dismissible
                    onDismiss={() => dismissAlert("atrasados")}
                  />
                )}
              {stats.aguardandoCliente > 0 &&
                !alertsDismissed.has("aguardando") && (
                  <InlineBanner
                    variant="warning"
                    title={`${stats.aguardandoCliente} trabalho${stats.aguardandoCliente > 1 ? "s" : ""} aguardando retorno do cliente`}
                    desc="Entre em contato com o cliente para manter o fluxo."
                    ctaLabel="Ver aguardando"
                    cta={() => {
                      setActiveChip("aguardando");
                      dismissAlert("aguardando");
                    }}
                    dismissible
                    onDismiss={() => dismissAlert("aguardando")}
                  />
                )}
            </div>
          </>
        )}

        {/* ─── Metrics (same pattern as Dashboard KPIs) ─── */}
        <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
        <DashboardKpiGrid
          flat
          projetos={{
            label: "Em produção",
            value: String(stats.emProducao),
            sub: `${stats.urgentes} urgente${stats.urgentes !== 1 ? "s" : ""}`,
          }}
          aReceber={{
            label: "Novos",
            value: String(stats.novos),
            sub: "aguardando início",
          }}
          producao={{
            label: "Atrasados",
            value: String(stats.atrasados),
            sub:
              stats.atrasados > 0 ? "ação necessária" : "nenhum atraso",
          }}
          compromissos={{
            label: "Finalizados",
            value: String(stats.finalizados),
            sub: "este mês",
          }}
        />
      </HeaderWidget>

      {/* ═══════════════════════════════════════════════ */}
      {/* States — AnimatePresence                        */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewState === "loading" && (
          <motion.div
            key="state-loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springGentleIn}
          >
            <LoadingState />
          </motion.div>
        )}
        {viewState === "error" && (
          <motion.div
            key="state-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springGentleIn}
          >
            <ErrorState
              onRetry={() => {
                /* retry logic */
              }}
            />
          </motion.div>
        )}
        {viewState === "empty" && (
          <motion.div
            key="state-empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springGentleIn}
          >
            <EmptyStateView />
          </motion.div>
        )}
        {viewState === "ready" && (
          <motion.div
            key="state-ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springGentleIn}
            className="flex flex-col gap-4"
          >
            {/* ── Radar ── */}
            <RadarDeEntregas trabalhos={allTrabalhos} />

            {/* ── Queue section (WidgetCard KIT) ── */}
            <WidgetCard
              title="Fila de Produção"
              count={filteredTrabalhos.length}
              delay={0.12}
            >
              {/* Tabs */}
              <QueueTabs
                active={activeTab}
                counts={counts}
                onChange={(tab) => {
                  setActiveTab(tab);
                  setActiveChip("all");
                  clearSelection();
                }}
              />

              {/* Search + FilterChips */}
              <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="flex flex-col"
              >
                {/* Search bar */}
                <div className={`flex items-center gap-3 px-5 py-2.5 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
                  <div className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl transition-all focus-within:ring-1 focus-within:ring-[#D1D1D6] ${isDark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]"}`}>
                    <Search className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Procurar trabalho, projeto ou cliente..."
                      className={`flex-1 bg-transparent text-[12px] outline-none min-w-0 ${isDark ? "text-[#F5F5F7] placeholder:text-[#636366]" : "text-[#48484A] placeholder:text-[#D1D1D6]"}`}
                      style={{ fontWeight: 400 }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="w-4 h-4 rounded-full bg-[#D1D1D6] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#C7C7CC] transition-colors focus-visible:outline-none"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter chips */}
                <div className={`flex items-center gap-1.5 flex-wrap px-5 py-2.5 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
                  <FilterChip
                    label="Todas"
                    count={chipCounts.all}
                    active={activeChip === "all"}
                    dot="bg-[#D1D1D6]"
                    chipBg="bg-[#F5F5F7]"
                    chipText="text-[#1D1D1F]"
                    chipBorder="border-[#D1D1D6]"
                    onClick={() => {
                      setActiveChip("all");
                      clearSelection();
                    }}
                  />
                  <span className={`w-px h-4 ${isDark ? "bg-[#3C3C43]" : "bg-[#E5E5EA]"}`} />
                  {chipFilters.map((f) => (
                    <FilterChip
                      key={f.key}
                      label={f.label}
                      count={chipCounts[f.key]}
                      active={activeChip === f.key}
                      dot={f.dot}
                      chipBg={f.chipBg}
                      chipText={f.chipText}
                      chipBorder={f.chipBorder}
                      onClick={() => {
                        setActiveChip(
                          activeChip === f.key ? "all" : f.key
                        );
                        clearSelection();
                      }}
                    />
                  ))}
                </div>

                {/* BulkActionsBar */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <div className="px-5 pt-2.5">
                      <BulkActionsBar
                        key="bulk-bar-prod"
                        count={selectedIds.size}
                        actions={bulkActions}
                        onClear={clearSelection}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {/* Select-all header */}
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
                      : `${filteredTrabalhos.length} trabalho${filteredTrabalhos.length !== 1 ? "s" : ""}`}
                  </span>
                  <div
                    className="flex items-center gap-6 text-[10px] uppercase tracking-[0.08em] text-[#D1D1D6]"
                    style={{ fontWeight: 500 }}
                  >
                    <span>Etapa</span>
                    <span>Progresso</span>
                    <span>Ação</span>
                  </div>
                </div>

                {/* Row list — ProductionActionRowItem (flat flush rows + hairlines) */}
                <div className="flex flex-col">
                  <AnimatePresence mode="popLayout">
                    {rowDataItems.length > 0 ? (
                      rowDataItems.map((item, idx) => (
                        <div key={item.id}>
                          {idx > 0 && <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />}
                          <ProductionActionRowItem
                            item={item}
                            onViewProject={onNavigateToProject}
                            onAdvanceStage={handleAdvance}
                            onAction={handleRowAction}
                            selected={selectedIds.has(item.id)}
                            onToggleSelect={toggleSelect}
                            flat
                            menuItems={
                              item.stage === "entregue" || item.progress === 100
                                ? ["Ver projeto", "Criar galeria", "Reatribuir", "Alterar prazo"]
                                : undefined
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <motion.div
                        key="no-results"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={springGentleIn}
                        className="flex flex-col items-center justify-center py-20 gap-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                          {searchQuery ? (
                            <Search className="w-5 h-5 text-[#D1D1D6]" />
                          ) : (
                            <Layers className="w-5 h-5 text-[#D1D1D6]" />
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className="text-[13px] text-[#8E8E93]"
                            style={{ fontWeight: 500 }}
                          >
                            {searchQuery
                              ? "Sem resultados"
                              : "Nenhum trabalho"}
                          </span>
                          <span
                            className="text-[11px] text-[#C7C7CC] text-center max-w-[260px]"
                            style={{ fontWeight: 400 }}
                          >
                            {searchQuery
                              ? `Nenhum resultado para "${searchQuery}"`
                              : "Nenhum trabalho encontrado com este filtro."}
                          </span>
                        </div>
                        {(activeChip !== "all" || searchQuery) && (
                          <button
                            onClick={() => {
                              setActiveChip("all");
                              setSearchQuery("");
                            }}
                            className="mt-1 text-[12px] text-[#8E8E93] hover:text-[#48484A] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 rounded-lg px-3 py-1.5 hover:bg-[#F5F5F7]"
                            style={{ fontWeight: 500 }}
                          >
                            Limpar filtros
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </WidgetCard>

            {/* ── Footer summary (WidgetCard KIT) ── */}
            <WidgetCard delay={0.16}>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-6">
                  <span
                    className="text-[11px] text-[#AEAEB2]"
                    style={{ fontWeight: 400 }}
                  >
                    Resumo da fila
                  </span>
                  <span className="w-px h-3.5 bg-[#E5E5EA]" />
                  <span
                    className="text-[12px] text-[#8E8E93] numeric"
                    style={{ fontWeight: 500 }}
                  >
                    {counts.em_producao} em produção
                  </span>
                  <span className="w-px h-3 bg-[#F2F2F7]" />
                  <span
                    className="text-[12px] text-[#C7C7CC] numeric"
                    style={{ fontWeight: 500 }}
                  >
                    {counts.novo} novo{counts.novo !== 1 && "s"}
                  </span>
                  <span className="w-px h-3 bg-[#F2F2F7]" />
                  <span
                    className="text-[12px] text-[#34C759] numeric"
                    style={{ fontWeight: 500 }}
                  >
                    {counts.finalizado} finalizado
                    {counts.finalizado !== 1 && "s"}
                  </span>
                </div>
                <span
                  className="text-[11px] text-[#D1D1D6]"
                  style={{ fontWeight: 400 }}
                >
                  Atualizado agora
                </span>
              </div>
            </WidgetCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* Novo Serviço Modal — createPortal to body       */}
      {/* ═══════════════════════════════════════════════ */}
      {createPortal(
        <AnimatePresence>
          {showNovoModal && (
            <div className="fixed inset-0 z-[9998]">
              <motion.div
                key="novo-servico-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={springOverlay}
                className="absolute inset-0 bg-[#1D1D1F]"
                onClick={() => { if (modalStep !== "creating") closeNovoModal(); }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                key="novo-servico-panel"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={springDefault}
                role="dialog"
                aria-modal="true"
                aria-label="Novo serviço"
                className="pointer-events-auto relative w-[580px] max-h-[85vh] overflow-y-auto bg-white border border-[#E5E5EA]"
                style={{
                  borderRadius: 20,
                  boxShadow: "0 16px 40px #D1D1D6",
                }}
              >
              {/* Header */}
              <div
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#FAFAFA] border-b border-[#F2F2F7]"
                style={{ borderRadius: "20px 20px 0 0" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[15px] text-[#1D1D1F]"
                    style={{ fontWeight: 600 }}
                  >
                    {modalStep === "template"
                      ? "Novo serviço"
                      : modalStep === "form"
                      ? selectedModelo?.nome
                      : modalStep === "creating"
                      ? "Criando..."
                      : "Serviço criado"}
                  </span>
                  <span
                    className="text-[11px] text-[#C7C7CC]"
                    style={{ fontWeight: 400 }}
                  >
                    {modalStep === "template"
                      ? "Escolha um modelo de workflow"
                      : modalStep === "form"
                      ? `${selectedModelo?.etapas.length} etapas · SLA ${selectedModelo?.slaDias}d`
                      : modalStep === "creating"
                      ? "Salvando na fila de produção..."
                      : "Adicionado com sucesso"}
                  </span>
                </div>
                {modalStep !== "creating" && (
                  <button
                    onClick={closeNovoModal}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D1D1D6] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Template step */}
              {modalStep === "template" && (
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.1em] text-[#D1D1D6]"
                      style={{ fontWeight: 600 }}
                    >
                      Modelos disponíveis
                    </span>
                    <span
                      className="text-[9px] text-[#D1D1D6] bg-[#F2F2F7] px-1.5 py-0.5 rounded-full numeric"
                      style={{ fontWeight: 600 }}
                    >
                      {modelosServico.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {modelosServico.map((modelo) => {
                      const tc = safeGetTipo(modelo.tipo);
                      return (
                        <button
                          key={modelo.id}
                          onClick={() => selectTemplate(modelo)}
                          className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:shadow-[0_4px_16px_#E5E5EA] transition-all cursor-pointer text-left group active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <span
                              className={`text-[10px] ${tc.text}`}
                              style={{ fontWeight: 600 }}
                            >
                              {tc.label.charAt(0)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span
                              className="text-[12px] text-[#636366] group-hover:text-[#3C3C43] transition-colors truncate"
                              style={{ fontWeight: 500 }}
                            >
                              {modelo.nome}
                            </span>
                            <span
                              className="text-[10px] text-[#C7C7CC] truncate"
                              style={{ fontWeight: 400 }}
                            >
                              {modelo.descricao}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[9px] text-[#D1D1D6] bg-[#F2F2F7] px-1.5 py-px rounded numeric"
                                style={{ fontWeight: 500 }}
                              >
                                {modelo.etapas.length} etapas
                              </span>
                              <span
                                className="text-[9px] text-[#D1D1D6] bg-[#F2F2F7] px-1.5 py-px rounded numeric"
                                style={{ fontWeight: 500 }}
                              >
                                SLA {modelo.slaDias}d
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form step */}
              {modalStep === "form" && selectedModelo && (
                <div className="p-6 flex flex-col gap-5">
                  {/* Workflow preview */}
                  <div className="flex flex-col gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.1em] text-[#D1D1D6]"
                      style={{ fontWeight: 600 }}
                    >
                      Workflow
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedModelo.etapas.map((etapa, i) => (
                        <div
                          key={etapa}
                          className="flex items-center gap-1"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] border ${
                              i === 0
                                ? "text-[#FF9500] border-[#EFEAD8]"
                                : "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]"
                            }`}
                            style={{
                              fontWeight: 500,
                              ...(i === 0
                                ? { background: "#F5F5F7" }
                                : {}),
                            }}
                          >
                            {etapa}
                          </span>
                          {i < selectedModelo.etapas.length - 1 && (
                            <span className="text-[#E5E5EA] text-[10px]">
                              →
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projeto */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[11px] text-[#AEAEB2]"
                      style={{ fontWeight: 500 }}
                    >
                      Projeto <span className="text-[#FF3B30]">*</span>
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] focus-within:ring-1 focus-within:ring-[#D1D1D6] transition-all">
                      <FolderKanban className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
                      <select
                        value={formProjetoId}
                        onChange={(e) => setFormProjetoId(e.target.value)}
                        className={`flex-1 bg-transparent text-[13px] outline-none min-w-0 cursor-pointer appearance-none ${formProjetoId ? "text-[#48484A]" : "text-[#D1D1D6]"}`}
                        style={{ fontWeight: 400 }}
                      >
                        <option value="" disabled>
                          Selecionar projeto...
                        </option>
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.cliente}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#D1D1D6] shrink-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Título */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[11px] text-[#AEAEB2]"
                      style={{ fontWeight: 500 }}
                    >
                      Título do serviço{" "}
                      <span className="text-[#FF3B30]">*</span>
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] focus-within:ring-1 focus-within:ring-[#D1D1D6] transition-all">
                      <Clapperboard className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
                      <input
                        type="text"
                        value={formTitulo}
                        onChange={(e) => setFormTitulo(e.target.value)}
                        placeholder="Ex: Edição de fotos — Cerimônia"
                        className="flex-1 bg-transparent text-[13px] text-[#48484A] placeholder:text-[#D1D1D6] outline-none min-w-0"
                        style={{ fontWeight: 400 }}
                      />
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[11px] text-[#AEAEB2]"
                      style={{ fontWeight: 500 }}
                    >
                      Responsável
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {equipe.map((m, i) => (
                        <button
                          key={m.iniciais}
                          onClick={() => setFormResponsavelIdx(i)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
                            formResponsavelIdx === i
                              ? "bg-[#F2F2F7] border-[#D1D1D6] text-[#636366]"
                              : "bg-white border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6] hover:text-[#8E8E93]"
                          }`}
                          style={{
                            fontWeight:
                              formResponsavelIdx === i ? 500 : 400,
                          }}
                        >
                          <span
                            className="text-[9px] text-[#C7C7CC]"
                            style={{ fontWeight: 600 }}
                          >
                            {m.iniciais}
                          </span>
                          {m.nome}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prazo + Prioridade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] text-[#AEAEB2]"
                        style={{ fontWeight: 500 }}
                      >
                        Prazo de entrega
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all">
                        <Calendar className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
                        <input
                          type="date"
                          value={formPrazoISO}
                          onChange={(e) => setFormPrazoISO(e.target.value)}
                          className="flex-1 bg-transparent text-[13px] text-[#48484A] outline-none min-w-0 cursor-pointer"
                          style={{ fontWeight: 400 }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] text-[#AEAEB2]"
                        style={{ fontWeight: 500 }}
                      >
                        Prioridade
                      </label>
                      <div className="flex gap-1.5">
                        {(
                          [
                            ["normal", "Normal"],
                            ["urgente", "Urgente"],
                            ["baixa", "Baixa"],
                          ] as const
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setFormPrioridade(val)}
                            className={`flex-1 px-2.5 py-2 rounded-xl text-[12px] border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 ${
                              formPrioridade === val
                                ? val === "urgente"
                                  ? "border-[#F2DDD9] text-[#FF3B30]"
                                  : "bg-[#F2F2F7] border-[#D1D1D6] text-[#636366]"
                                : "bg-white border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6]"
                            }`}
                            style={{
                              fontWeight:
                                formPrioridade === val ? 500 : 400,
                              ...(formPrioridade === val &&
                              val === "urgente"
                                ? { background: "#FBF5F4" }
                                : {}),
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
                    <button
                      onClick={() => setModalStep("template")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1"
                      style={{ fontWeight: 400 }}
                    >
                      ← Trocar modelo
                    </button>
                    <button
                      onClick={handleCreateTrabalho}
                      disabled={!formProjetoId || !formTitulo}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] transition-all cursor-pointer active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-2"
                      style={{ fontWeight: 500 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Criar serviço
                    </button>
                  </div>
                </div>
              )}

              {/* Creating step */}
              {modalStep === "creating" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <LoaderCircle className="w-8 h-8 text-[#D1D1D6] animate-spin" />
                  <span
                    className="text-[13px] text-[#AEAEB2]"
                    style={{ fontWeight: 400 }}
                  >
                    Salvando na fila de produção...
                  </span>
                </div>
              )}

              {/* Success step */}
              {modalStep === "success" && (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={withDelay(springBounce, 0.1)}
                    className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center"
                  >
                    <CircleCheck className="w-7 h-7 text-[#34C759]" />
                  </motion.div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="text-[15px] text-[#636366]"
                      style={{ fontWeight: 500 }}
                    >
                      Serviço criado
                    </span>
                    <span
                      className="text-[12px] text-[#C7C7CC] text-center max-w-[280px]"
                      style={{ fontWeight: 400 }}
                    >
                      &ldquo;{formTitulo}&rdquo; foi adicionado à fila de
                      produção como &ldquo;Novo&rdquo;.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        closeNovoModal();
                        setActiveTab("novo");
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] transition-all cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-2"
                      style={{ fontWeight: 500 }}
                    >
                      Ver na fila
                    </button>
                    <button
                      onClick={openNovoModal}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5EA] text-[12px] text-[#AEAEB2] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1"
                      style={{ fontWeight: 400 }}
                    >
                      <Plus className="w-3 h-3" />
                      Criar outro
                    </button>
                  </div>
                </div>
              )}
              </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
