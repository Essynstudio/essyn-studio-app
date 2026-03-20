"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, ArrowLeft,
  BookOpen, ChevronRight, ExternalLink, MapPin,
  Mic, MicOff,
} from "lucide-react";
import { IrisProjectWizard } from "./iris-wizard";
import {
  IconAreaVisaoGeral,
  IconAreaProducao,
  IconAreaFinanceiro,
  IconAreaAgenda,
  IconAreaGaleria,
  IconAreaProjetos,
  IconAreaCRM,
  IconAreaEntregas,
  IconProjetos,
  IconGaleria,
  IconCRM,
  IconFinanceiro,
} from "@/components/icons/essyn-icons";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { springSnappy, springDefault } from "@/lib/motion-tokens";
import { usePathname, useRouter } from "next/navigation";
import { IrisMarkdown } from "./iris-markdown";
import { detectContext } from "@/lib/iris/contexts";
import { InlineClientForm, InlineProjectForm, InlineTeamForm, InlineLeadForm } from "./iris-inline-forms";
import type { IrisContextKey } from "@/lib/iris/contexts";
import { IrisActionButtons, type IrisAction } from "./iris-actions";
import { checkMilestones } from "@/lib/iris/milestones";
import type { Milestone } from "@/lib/iris/milestones";
import { MilestoneCard } from "./iris-milestone";
import { ShootDayBriefing } from "./iris-briefing";
import { MiniBarChart, MiniStatCards, parseChartData, type ChartBlock } from "./iris-charts";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface IrisContext {
  activeProjects: number;
  inProduction: number;
  todayEventsCount: number;
  todayEvents: { title: string; time: string; location: string | null }[];
  upcomingEvents: { title: string; date: string }[];
  totalPending: number;
  totalReceived: number;
  totalOverdue: number;
  overdueCount: number;
  activeLeads: number;
  totalLeads: number;
  totalGalleries: number;
  totalPhotos: number;
  signedContracts: number;
  pendingContracts: number;
  totalContracts: number;
  projectsByType: Record<string, number>;
  leadsByStage: Record<string, number>;
  leadsByType: Record<string, number>;
  leadsEstimatedTotal: number;
  galleriesByStatus: Record<string, number>;
  totalProjects: number;
  totalTeamMembers: number;
  totalClients: number;
  totalPacks: number;
}

type FormType = "novo_cliente" | "novo_projeto" | "novo_membro" | "novo_lead";

interface Message {
  id: string;
  role: "user" | "iris" | "form";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  formType?: FormType;
  formCompleted?: boolean;
  actions?: IrisAction[];
  chart?: ChartBlock;
}

interface WizardData {
  clients: { id: string; name: string; email: string | null; phone: string | null }[];
  packs: any[];
  workflowTemplates: any[];
  catalogProducts: any[];
  teamMembers: { id: string; name: string; role: string; avatar_url: string | null }[];
}

interface EventBriefing {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  projectName?: string;
  clientName?: string;
  teamMembers?: string[];
  notes?: string;
}

interface RelationshipInsight {
  id: string;
  type: string;
  message: string;
  clientName: string;
  priority: "alta" | "media";
}

interface ProjectItem {
  id: string;
  name: string;
  status: string;
  event_type: string | null;
  event_date: string | null;
  production_phase: string | null;
  value: number | null;
}

interface IrisClientProps {
  studioId: string;
  studioName: string;
  userName: string;
  context: IrisContext;
  alerts: { id: string; message: string; priority: string; context: string; count?: number; value?: number }[];
  wizardData: WizardData;
  briefingEvents?: EventBriefing[];
  workloadInsight?: { level: string; message: string; suggestion: string } | null;
  relationshipInsights?: RelationshipInsight[];
  projectsList?: ProjectItem[];
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function cur(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function truncateAtWord(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const cut = str.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

function getContextualSubtitle(context: IrisContext, alerts: { priority: string }[], briefingEvents?: EventBriefing[]): string {
  if (context.totalOverdue > 0) {
    return `${context.overdueCount} cobrança${context.overdueCount > 1 ? "s" : ""} vencida${context.overdueCount > 1 ? "s" : ""} — revise hoje.`;
  }
  if (briefingEvents && briefingEvents.length > 0) {
    const ev = briefingEvents[0];
    const time = formatEventTime(ev.startAt);
    const name = titleCase(ev.title);
    // Suppress "às X:XX" if the title already contains a time (e.g. "14h00" or "14:00")
    const titleHasTime = /\b\d{1,2}h\d{0,2}\b|\b\d{1,2}:\d{2}\b/i.test(ev.title);
    const truncated = truncateAtWord(name, 38);
    const clientPart = ev.clientName ? ` · ${titleCase(ev.clientName)}` : "";
    const timePart = titleHasTime ? "" : ` às ${time}`;
    return `${truncated}${clientPart}${timePart}`;
  }
  if (context.inProduction > 0) {
    return `${context.inProduction} projeto${context.inProduction > 1 ? "s" : ""} em produção.`;
  }
  if (context.pendingContracts > 0) {
    return `${context.pendingContracts} contrato${context.pendingContracts > 1 ? "s" : ""} aguardando assinatura.`;
  }
  if (context.activeLeads > 0) {
    return `${context.activeLeads} lead${context.activeLeads > 1 ? "s" : ""} no pipeline.`;
  }
  const h = new Date().getHours();
  if (h < 12) return "Vamos começar o dia com foco.";
  if (h < 18) return "Como está o andamento do dia?";
  return "Hora de revisar o dia e planejar o amanhã.";
}

function formatEventTime(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return format(d, "HH:mm");
  } catch { /* noop */ }
  return timeStr;
}

// Normaliza nomes de eventos que o usuário cadastrou em CAIXA ALTA
function titleCase(str: string): string {
  if (!str) return str;
  const letters = str.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length === 0) return str;
  const upperCount = str.replace(/[^A-ZÀÁÂÃÄÉÊËÍÏÓÔÕÖÚÜÇ]/g, "").length;
  if (upperCount / letters.length > 0.6) {
    return str.toLowerCase().replace(/(?:^|\s|[-–—])\S/g, c => c.toUpperCase());
  }
  return str;
}

function formatRelativeDay(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === tomorrow.toDateString()) return "Amanhã";
    return format(date, "EEE", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase());
  } catch { return ""; }
}

function IrisIcon({ variant = "sm" }: { variant?: "lg" | "md" | "sm" }) {
  // Essyn iris diamond SVG icon — from brand kit
  const IrisDiamond = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 22,12 12,22 2,12" />
      <polygon points="12,7 17,12 12,17 7,12" strokeOpacity="0.45" />
    </svg>
  );

  if (variant === "lg") {
    return (
      <div className="w-11 h-11 rounded-full bg-[#2C444D]/[0.08] border border-[#2C444D]/[0.15] flex items-center justify-center shrink-0">
        <IrisDiamond size={18} color="#2C444D" />
      </div>
    );
  }
  if (variant === "md") {
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
        <IrisDiamond size={11} color="var(--fg-muted)" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
      <IrisDiamond size={9} color="var(--fg-muted)" />
    </div>
  );
}

function parseActions(content: string): IrisAction[] {
  const actions: IrisAction[] = [];

  // Financial actions
  if (/cobran[çc]as?\s+vencid/i.test(content)) {
    actions.push({ label: "Ver vencidos", type: "navigate", route: "/financeiro" });
    actions.push({ label: "Cobrar clientes", type: "send_message", message: "Envie lembretes de cobrança para todos os clientes com parcelas vencidas" });
  }

  // Project actions
  if (/projeto.*criado/i.test(content)) {
    actions.push({ label: "Ver projetos", type: "navigate", route: "/projetos" });
    actions.push({ label: "Criar outro", type: "send_message", message: "criar projeto" });
  }

  // Lead actions
  if (/lead.*adicionado|pipeline/i.test(content)) {
    actions.push({ label: "Ver CRM", type: "navigate", route: "/crm" });
    actions.push({ label: "Criar outro lead", type: "send_message", message: "criar lead" });
  }

  // Gallery actions
  if (/galeria|galerias/i.test(content)) {
    actions.push({ label: "Ver galerias", type: "navigate", route: "/galeria" });
  }

  // Agenda actions
  if (/evento|agenda|amanh[ãa]/i.test(content)) {
    actions.push({ label: "Ver agenda", type: "navigate", route: "/agenda" });
    actions.push({ label: "Criar evento", type: "send_message", message: "Agendar um evento" });
  }

  // Production actions
  if (/workflow|produ[çc][ãa]o|atrasad/i.test(content)) {
    actions.push({ label: "Ver produção", type: "navigate", route: "/producao" });
  }

  // Contract actions
  if (/contrato/i.test(content)) {
    actions.push({ label: "Ver contratos", type: "navigate", route: "/contratos" });
  }

  // Client actions
  if (/cliente.*cadastrad/i.test(content)) {
    actions.push({ label: "Ver clientes", type: "navigate", route: "/clientes" });
    actions.push({ label: "Enviar portal", type: "send_message", message: "Envie o acesso ao portal para o cliente que acabei de cadastrar" });
  }

  // Equipe actions
  if (/convite.*enviado|membro/i.test(content)) {
    actions.push({ label: "Ver equipe", type: "navigate", route: "/time" });
  }

  // Generic financial
  if (/receb|pendente|faturamento|receita/i.test(content) && !actions.some(a => a.route === "/financeiro")) {
    actions.push({ label: "Ver financeiro", type: "navigate", route: "/financeiro" });
  }

  // Export
  if (/export|csv/i.test(content)) {
    actions.push({ label: "Exportar dados", type: "send_message", message: "Exportar dados em CSV" });
  }

  // Limit to max 3 actions
  return actions.slice(0, 3);
}

function getFollowUpSuggestions(content: string): string[] {
  const suggestions: string[] = [];

  if (/financeiro|cobran|receb|pendente/i.test(content)) {
    suggestions.push("Quanto tenho a receber?", "Quais estão vencidas?", "Exportar financeiro");
  } else if (/projeto|criado/i.test(content)) {
    suggestions.push("Ver todos os projetos", "Criar outro projeto", "Status da produção");
  } else if (/agenda|evento/i.test(content)) {
    suggestions.push("O que tenho amanhã?", "Eventos da semana", "Criar evento");
  } else if (/lead|crm|pipeline/i.test(content)) {
    suggestions.push("Leads de alto valor", "Leads sem ação", "Criar lead");
  } else if (/galeria|foto/i.test(content)) {
    suggestions.push("Galerias pendentes", "Enviar galeria ao cliente");
  } else if (/produ[çc]|workflow|atrasad/i.test(content)) {
    suggestions.push("O que está atrasado?", "Avançar etapas", "Ver calendário");
  } else {
    suggestions.push("Resumo do dia", "Algo está atrasado?", "Criar projeto");
  }

  return suggestions.slice(0, 3);
}

// ═══════════════════════════════════════════════
// Image helpers
// ═══════════════════════════════════════════════

async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      // Max 1568px on longest side (Anthropic recommendation)
      const maxDim = 1568;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.src = URL.createObjectURL(file);
  });
}

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

async function callIrisAPI(
  chatHistory: { role: "user" | "assistant"; content: string | { type: string; [key: string]: unknown }[] }[],
  contextKey: IrisContextKey,
  pathname: string,
  onChunk: (text: string) => void,
  onToolRunning: () => void,
  onOverride: (text: string) => void,
): Promise<{ error?: string }> {
  try {
    const res = await fetch("/api/iris/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory, context: contextKey, pathname }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: (err as { error?: string }).error || "Erro ao conectar com a Iris" };
    }

    if (!res.body) {
      return { error: "Resposta sem corpo. Tente novamente." };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
          if (typeof data.t === "string") onChunk(data.t);
          if (data.status === "tool_running") onToolRunning();
          if (typeof data.override === "string") onOverride(data.override);
          if (typeof data.error === "string") return { error: data.error };
          if (data.done) return {};
        } catch {
          // Malformed SSE chunk — skip
        }
      }
    }

    return {};
  } catch {
    return { error: "Erro de conexão. Tente novamente." };
  }
}

// ═══════════════════════════════════════════════
// Area Card Config
// ═══════════════════════════════════════════════

interface AreaCard {
  id: string;
  label: string;
  Icon: typeof IconAreaVisaoGeral;
  query: string;
  route: string;
}

function getAreaStatus(id: string, context: IrisContext): "ok" | "attention" | "urgent" {
  switch (id) {
    case "financeiro": return context.totalOverdue > 0 ? "urgent" : context.totalPending > 0 ? "attention" : "ok";
    case "producao": return context.inProduction > 0 ? "attention" : "ok";
    case "entregas": return context.pendingContracts > 0 ? "attention" : "ok";
    case "crm": return context.activeLeads > 0 ? "attention" : "ok";
    case "agenda": return context.todayEventsCount > 0 ? "attention" : "ok";
    default: return "ok";
  }
}

function phaseLabel(phase: string | null): string {
  const labels: Record<string, string> = {
    selecao: "Seleção", edicao: "Edição", revisao: "Revisão",
    entregue: "Entregue", exportacao: "Exportação",
  };
  return phase ? (labels[phase] || phase) : "Em andamento";
}

function getAreaMeta(id: string, context: IrisContext): string | null {
  switch (id) {
    case "visao_geral": return `${context.activeProjects} projetos`;
    case "producao": return context.inProduction > 0 ? `${context.inProduction} em edição` : "Em dia";
    case "financeiro": return context.totalOverdue > 0 ? `${cur(context.totalOverdue)} vencido` : cur(context.totalPending) + " a receber";
    case "agenda": return context.todayEventsCount > 0 ? `${context.todayEventsCount} hoje` : "Livre hoje";
    case "galeria": return `${context.totalGalleries} galerias`;
    case "projetos": return `${context.totalProjects} total`;
    case "crm": return `${context.activeLeads} ativos`;
    case "entregas": return context.pendingContracts > 0 ? `${context.pendingContracts} pendentes` : "Em dia";
    default: return null;
  }
}

const AREA_CARDS: AreaCard[] = [
  { id: "visao_geral", label: "Visão Geral", Icon: IconAreaVisaoGeral, query: "Me dê um resumo geral completo do estúdio", route: "/iris" },
  { id: "producao", label: "Produção", Icon: IconAreaProducao, query: "Qual o status da minha produção?", route: "/producao" },
  { id: "financeiro", label: "Financeiro", Icon: IconAreaFinanceiro, query: "Qual meu resumo financeiro?", route: "/financeiro" },
  { id: "agenda", label: "Agenda", Icon: IconAreaAgenda, query: "Quais sao meus eventos de hoje e da semana?", route: "/agenda" },
  { id: "galeria", label: "Galeria", Icon: IconAreaGaleria, query: "Qual o status das minhas galerias?", route: "/galeria" },
  { id: "projetos", label: "Projetos", Icon: IconAreaProjetos, query: "Qual o status dos meus projetos ativos?", route: "/projetos" },
  { id: "crm", label: "CRM", Icon: IconAreaCRM, query: "Qual o status do meu pipeline de leads?", route: "/crm" },
  { id: "entregas", label: "Entregas", Icon: IconAreaEntregas, query: "Quais entregas estão pendentes?", route: "/producao" },
];

const QUICK_SUGGESTIONS = [
  { label: "Quanto tenho a receber este mês?", query: "Quanto tenho a receber este mês?" },
  { label: "Quais trabalhos estão atrasados?", query: "Quais trabalhos estão atrasados?" },
  { label: "Resumo geral do estúdio", query: "Me dê um resumo geral completo do estúdio" },
  { label: "O que tenho pra hoje?", query: "O que tenho pra hoje?" },
];

// ═══════════════════════════════════════════════
// Metric Strip
// ═══════════════════════════════════════════════

function MetricStrip({ context }: { context: IrisContext }) {
  const allZero = context.totalReceived === 0 && context.totalPending === 0 && context.totalOverdue === 0 && context.activeProjects === 0;
  const metrics = [
    { label: "Recebido", value: cur(context.totalReceived), color: allZero ? "var(--fg-placeholder)" : "#2D7A4F" },
    { label: "Pendente", value: cur(context.totalPending), color: allZero ? "var(--fg-placeholder)" : "#C87A20" },
    { label: "Vencido", value: context.totalOverdue > 0 ? cur(context.totalOverdue) : "R$0", color: context.totalOverdue > 0 ? "#B84233" : allZero ? "var(--fg-placeholder)" : "#7A8A8F" },
    { label: "Projetos", value: String(context.activeProjects), color: allZero ? "var(--fg-placeholder)" : "#2C444D" },
  ];

  const todayLabel = context.todayEventsCount > 0 && context.todayEvents[0]
    ? truncateAtWord(titleCase(context.todayEvents[0].title), 24)
    : "Sem eventos hoje";

  // First upcoming that isn't today
  const todayISO = new Date().toISOString().split("T")[0];
  const nextEvent = context.upcomingEvents.find(e => !e.date.startsWith(todayISO));
  const nextLabel = nextEvent
    ? truncateAtWord(titleCase(nextEvent.title), 22)
    : context.upcomingEvents.length > 0
    ? truncateAtWord(titleCase(context.upcomingEvents[0].title), 22)
    : "Agenda livre";

  return (
    <div className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow-apple)] overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--border-subtle)]">
        {metrics.map((m) => (
          <div key={m.label} className="px-3 py-3 text-center">
            <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.04em]">{m.label}</p>
            <p className="text-[15px] font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
        <div className="px-3 py-2.5 flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C87A20] shrink-0" />
          <span className="text-[11.5px] text-[var(--fg)] truncate">{todayLabel}</span>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2C444D] shrink-0" />
          <span className="text-[11.5px] text-[var(--fg-muted)] truncate">{nextLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Smart Onboarding — dynamic, checks real data
// ═══════════════════════════════════════════════

interface SmartStep {
  id: string;
  title: string;
  message: string;
  chatAction?: string; // Message to send to Iris to do it via chat
  linkFallback?: { href: string; label: string }; // For steps that need UI
  doneCheck: (ctx: IrisContext) => boolean;
  doneLabel: string;
}

function getOnboardingSteps(): SmartStep[] {
  return [
    {
      id: "equipe",
      title: "1. Configure sua equipe",
      message: "Cadastre fotógrafos, editores e assistentes que trabalham com você. Quando criar um projeto, você vai selecionar quem participa. Me diga o nome e email que eu envio o convite.",
      chatAction: "Quero adicionar um membro na minha equipe",
      doneCheck: (ctx) => ctx.totalTeamMembers > 0,
      doneLabel: "Equipe configurada",
    },
    {
      id: "pacotes",
      title: "2. Crie seus pacotes de servico",
      message: "Pacotes são seus serviços (ex: Casamento Completo R$ 8.000, Ensaio R$ 1.500). Quando criar um projeto, você seleciona o pacote e o valor preenche automaticamente. Acesse Configurações > Templates para criar.",
      chatAction: undefined, // needs UI - can't create packs via chat yet
      doneCheck: (ctx) => ctx.totalPacks > 0,
      doneLabel: "Pacotes configurados",
      linkFallback: { href: "/configuracoes/templates", label: "Configurar pacotes" },
    },
    {
      id: "cliente",
      title: "3. Cadastre seu primeiro cliente",
      message: "Me diga o nome do cliente e eu cadastro pra você agora. Exemplo: 'Cadastra a cliente Maria Silva, email maria@email.com, telefone 11999999999'",
      chatAction: "Quero cadastrar meu primeiro cliente",
      doneCheck: (ctx) => ctx.totalClients > 0,
      doneLabel: "Cliente cadastrado",
    },
    {
      id: "projeto",
      title: "4. Crie seu primeiro projeto",
      message: "Agora com equipe, pacotes e cliente prontos, você pode criar um projeto completo! O wizard conecta tudo: cliente, evento, pacote, equipe, financeiro e produção. Me diga o nome e tipo do evento.",
      chatAction: "Quero criar meu primeiro projeto",
      doneCheck: (ctx) => ctx.totalProjects > 0,
      doneLabel: "Primeiro projeto criado",
    },
  ];
}

// ═══════════════════════════════════════════════
// Quick Actions Bar
// ═══════════════════════════════════════════════

function QuickActionsBar({ onAction }: { onAction: (query: string) => void }) {
  const actions = [
    {
      label: "Novo Projeto",
      desc: "Casamento, ensaio, freela",
      query: "criar projeto",
      Icon: IconProjetos,
    },
    {
      label: "Nova Galeria",
      desc: "Entregar ao cliente",
      query: "criar galeria",
      Icon: IconGaleria,
    },
    {
      label: "Novo Lead",
      desc: "Interesse no estúdio",
      query: "criar lead",
      Icon: IconCRM,
    },
    {
      label: "Registrar Pagamento",
      desc: "Marcar parcela como paga",
      query: "Registrar um pagamento recebido",
      Icon: IconFinanceiro,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => onAction(a.query)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--card)] shadow-[var(--shadow-apple)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer group text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--fg-muted)] group-hover:text-[var(--fg)] group-hover:border-[var(--border)] transition-colors">
            <a.Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-[var(--fg)] leading-tight truncate">{a.label}</p>
            <p className="text-[11px] text-[var(--fg-placeholder)] mt-0.5 truncate">{a.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Iris Client
// ═══════════════════════════════════════════════

export function IrisClient({ studioId, studioName, userName, context, alerts, wizardData, briefingEvents, workloadInsight, relationshipInsights, projectsList }: IrisClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const contextKey = detectContext(pathname);

  const [messages, setMessages] = useState<Message[]>([]);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [guideMode, setGuideMode] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guideVisible, setGuideVisible] = useState(0); // how many steps are visible (animated in)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [greeting, setGreeting] = useState("Olá");
  const [greetingSub, setGreetingSub] = useState("");
  const hasMessages = messages.length > 0;
  const isNewUser = context.totalProjects === 0 && context.totalClients === 0;

  const inputPlaceholder = useMemo(() => {
    if (alerts.some(a => a.priority === "alta")) return "Tenho alertas urgentes — o que devo fazer?";
    const h = new Date().getHours();
    if (h < 9) return "Bom dia! O que temos pra hoje?";
    if (h >= 18) return "Revisão do dia — o que precisa fechar hoje?";
    return "Pergunte qualquer coisa a Iris...";
  }, [alerts]);

  const dynamicSuggestions = useMemo(() => {
    const suggestions: { label: string; query: string }[] = [];

    // Priority 1: Today's events → briefing
    if (briefingEvents && briefingEvents.length > 0) {
      const evTitle = titleCase(briefingEvents[0].title);
      suggestions.push({
        label: `Briefing: ${evTitle.slice(0, 28)}${evTitle.length > 28 ? "…" : ""}`,
        query: `Me dê o briefing completo do evento de hoje: ${briefingEvents[0].title}`,
      });
    }

    // Priority 2: Overdue payments
    if (context.totalOverdue > 0) {
      suggestions.push({
        label: "Cobranças vencidas →",
        query: `Tenho ${context.overdueCount} cobranças vencidas totalizando ${cur(context.totalOverdue)}. O que devo fazer?`,
      });
    }

    // Priority 3: Projects in production
    if (context.inProduction > 0) {
      suggestions.push({
        label: `${context.inProduction} em edição — status`,
        query: "Quais projetos estão em produção ou edição agora?",
      });
    }

    // Priority 4: Active leads
    if (context.activeLeads > 0) {
      suggestions.push({
        label: `${context.activeLeads} leads ativos`,
        query: "Qual o status do meu pipeline de leads?",
      });
    }

    // Priority 5: Galleries pending delivery
    if (context.pendingContracts > 0) {
      suggestions.push({
        label: `${context.pendingContracts} contrato${context.pendingContracts > 1 ? "s" : ""} pendente${context.pendingContracts > 1 ? "s" : ""}`,
        query: "Quais contratos ainda não foram assinados?",
      });
    }

    // Fill remaining slots with defaults
    const defaults = [
      { label: "Quanto tenho a receber?", query: "Quanto tenho a receber este mês?" },
      { label: "O que tenho pra hoje?", query: "O que tenho pra hoje?" },
      { label: "Resumo do estúdio", query: "Me dê um resumo geral completo do estúdio" },
      { label: "Trabalhos atrasados?", query: "Quais trabalhos estão atrasados?" },
    ];

    for (const d of defaults) {
      if (suggestions.length >= 4) break;
      if (!suggestions.some(s => s.query === d.query)) {
        suggestions.push(d);
      }
    }

    return suggestions.slice(0, 4);
  }, [briefingEvents, context, alerts]);

  useEffect(() => {
    setGreeting(greetingText());
    setGreetingSub(getContextualSubtitle(context, alerts, briefingEvents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, guideVisible]);

  // Load saved conversation from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`essyn_iris_chat_${studioId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        // Only restore if less than 24 hours old
        const lastMsg = restored[restored.length - 1];
        if (lastMsg && (Date.now() - new Date(lastMsg.timestamp).getTime()) < 24 * 60 * 60 * 1000) {
          setMessages(restored);
          setRestoredFromStorage(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [studioId]);

  // Proactive daily briefing — fires once per day if no restored conversation
  useEffect(() => {
    if (messages.length > 0) return; // already has messages (restored or typed)

    const todayKey = `essyn_iris_briefed_${studioId}_${new Date().toISOString().split("T")[0]}`;
    if (localStorage.getItem(todayKey)) return; // already briefed today

    localStorage.setItem(todayKey, "1");

    const t = setTimeout(() => {
      sendMessage("Resumo rápido: o que tenho hoje, alguma cobrança vencida e alertas urgentes.");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // Persist conversation to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = messages.slice(-20).map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        }));
        localStorage.setItem(`essyn_iris_chat_${studioId}`, JSON.stringify(toSave));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages, studioId]);

  // Guide visible is no longer animated step-by-step (smart steps show all at once)
  useEffect(() => {
    if (guideMode) setGuideVisible(4);
  }, [guideMode]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Check milestones on mount
  useEffect(() => {
    const seen: string[] = JSON.parse(localStorage.getItem(`essyn_milestones_${studioId}`) || "[]");
    const newMilestones = checkMilestones({
      totalProjects: context.totalProjects,
      totalClients: context.totalClients,
      totalGalleries: context.totalGalleries,
      totalReceived: context.totalReceived,
      activeProjects: context.activeProjects,
    }, seen);
    if (newMilestones.length > 0) {
      setMilestones(newMilestones);
      const allSeen = [...seen, ...newMilestones.map(m => m.id)];
      localStorage.setItem(`essyn_milestones_${studioId}`, JSON.stringify(allSeen));
    }
  }, []);

  // Detect if user wants to create something → show inline form
  const detectFormIntent = useCallback((text: string): FormType | null => {
    const t = text.toLowerCase();
    if (t.includes("cadastrar") && (t.includes("cliente") || t.includes("primeiro cliente"))) return "novo_cliente";
    if (t.includes("criar") && (t.includes("projeto") || t.includes("primeiro projeto"))) return "novo_projeto";
    if (t.includes("adicionar") && (t.includes("equipe") || t.includes("membro"))) return "novo_membro";
    if (t.includes("convidar") && t.includes("membro")) return "novo_membro";
    if (t.includes("registrar") && t.includes("lead")) return "novo_lead";
    if (t.includes("criar") && t.includes("lead")) return "novo_lead";
    if (t.includes("novo cliente")) return "novo_cliente";
    if (t.includes("novo projeto")) return "novo_projeto";
    if (t.includes("novo lead")) return "novo_lead";
    if (t.includes("novo membro")) return "novo_membro";
    return null;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: pendingImage ? `[Imagem] ${text.trim()}` : text.trim(),
      timestamp: new Date(),
    };

    // Check for form intent
    const formType = detectFormIntent(text.trim());
    if (formType) {
      const formLabels: Record<FormType, string> = {
        novo_cliente: "Preencha os dados do cliente aqui:",
        novo_projeto: "Preencha os dados do projeto aqui:",
        novo_membro: "Preencha os dados do membro aqui:",
        novo_lead: "Preencha os dados do lead aqui:",
      };

      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: `f-${Date.now()}`,
          role: "form",
          content: formLabels[formType],
          formType,
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }

    const irisId = `m-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: irisId, role: "iris" as const, content: "", timestamp: new Date(), isStreaming: true },
    ]);
    setInput("");
    setPendingImage(null);
    setIsTyping(true);

    // Auto-trim: keep last 20 messages to prevent context overflow (200K limit)
    const trimmedMessages = messages.slice(-20);

    const chatHistory = [
      ...trimmedMessages.map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.role === "form" ? "[Formulario inline completado]" : m.content,
      })),
      pendingImage
        ? {
            role: "user" as const,
            content: [
              { type: "image", source: { type: "base64", media_type: pendingImage.mimeType, data: pendingImage.base64 } },
              { type: "text", text: text.trim() },
            ],
          }
        : { role: "user" as const, content: text.trim() },
    ];

    let accumulated = "";

    const { error } = await callIrisAPI(
      chatHistory,
      contextKey,
      pathname,
      (chunk) => {
        accumulated += chunk;
        setIsTyping(false);
        setMessages(prev =>
          prev.map(m => m.id === irisId ? { ...m, content: accumulated, isStreaming: true } : m)
        );
      },
      () => {
        // Tool running: reset accumulated so final text starts fresh
        accumulated = "";
        setIsTyping(true);
        setMessages(prev =>
          prev.map(m => m.id === irisId ? { ...m, content: "", isStreaming: true } : m)
        );
      },
      (override) => {
        accumulated = override;
        setMessages(prev =>
          prev.map(m => m.id === irisId ? { ...m, content: override, isStreaming: true } : m)
        );
      },
    );

    const finalContent = error || accumulated;
    const actions = error ? [] : parseActions(finalContent);
    const chart = error ? null : parseChartData(finalContent);

    setMessages(prev =>
      prev.map(m =>
        m.id === irisId
          ? {
              ...m,
              content: finalContent,
              isStreaming: false,
              actions: actions.length > 0 ? actions : undefined,
              chart: chart || undefined,
            }
          : m
      )
    );
    setIsTyping(false);
  }, [isTyping, messages, pendingImage, contextKey, pathname]);

  const toggleVoice = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: { results: { [0]: { [0]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const goHome = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setGuideMode(false);
    setGuideStep(0);
    setGuideVisible(0);
    setRestoredFromStorage(false);
    localStorage.removeItem(`essyn_iris_chat_${studioId}`);
  }, [studioId]);

  const startGuide = useCallback(() => {
    setGuideMode(true);
    setGuideStep(0);
    setGuideVisible(0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="-m-4 lg:-m-6 flex flex-col" style={{ height: "calc(100vh - var(--topbar-height))" }}>

      {/* ── Horizontal split ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL — context sidebar (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-[var(--border)] overflow-y-auto px-5 pt-5 pb-5">

          {/* Date header */}
          <div className="mb-4 px-1">
            <p className="text-[11px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.1em]">
              {format(new Date(), "EEEE',' d 'de' MMMM", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          </div>

          {/* Active conversation indicator */}
          {hasMessages && (
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0 animate-pulse" />
              <span className="text-[11.5px] text-[var(--fg-muted)] flex-1">Conversa ativa</span>
              <button
                onClick={goHome}
                className="text-[10.5px] text-[var(--fg-placeholder)] hover:text-[var(--fg-muted)] transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Alert chips */}
          {alerts.length > 0 && (
            <div className="mt-3 space-y-1">
              {alerts.slice(0, 3).map(alert => (
                <button
                  key={alert.id}
                  onClick={() => sendMessage(alert.message)}
                  className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    alert.priority === "alta"
                      ? "bg-[var(--error)]/[0.06] hover:bg-[var(--error)]/[0.1]"
                      : "bg-[var(--warning)]/[0.06] hover:bg-[var(--warning)]/[0.1]"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[5px] ${
                    alert.priority === "alta" ? "bg-[var(--error)]" : "bg-[var(--warning)]"
                  }`} />
                  <span className={`text-[11.5px] leading-snug ${
                    alert.priority === "alta" ? "text-[var(--error)]" : "text-[var(--warning)]"
                  }`}>{alert.message}</span>
                </button>
              ))}
            </div>
          )}

          {/* Workload alert — compact pill */}
          {workloadInsight && (workloadInsight.level === "busy" || workloadInsight.level === "overloaded") && (context.activeProjects > 0 || context.totalOverdue > 0) && (
            <button
              onClick={() => sendMessage(workloadInsight.suggestion)}
              className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                workloadInsight.level === "overloaded"
                  ? "bg-[var(--error)]/[0.06] hover:bg-[var(--error)]/[0.1]"
                  : "bg-[var(--warning)]/[0.06] hover:bg-[var(--warning)]/[0.1]"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                workloadInsight.level === "overloaded" ? "bg-[var(--error)]" : "bg-[var(--warning)]"
              }`} />
              <span className={`text-[11.5px] font-medium leading-snug ${
                workloadInsight.level === "overloaded" ? "text-[var(--error)]" : "text-[var(--warning)]"
              }`}>
                {workloadInsight.level === "overloaded" ? "Carga alta esta semana" : "Semana movimentada"}
              </span>
            </button>
          )}

          {/* ── AGENDA — Today + Upcoming unified ── */}
          {(() => {
            const todayISO = new Date().toISOString().split("T")[0];
            const upcomingNonToday = context.upcomingEvents.filter(ev => !ev.date.startsWith(todayISO));
            const todayEventsFromBriefing = briefingEvents && briefingEvents.length > 0;
            const hasTodayEvents = todayEventsFromBriefing || context.todayEvents.length > 0;
            const hasAnything = hasTodayEvents || upcomingNonToday.length > 0;

            return (
              <>
                <div className="mt-4 mb-1 border-t border-[var(--border)]" />
                <div className="mt-3">
                  <p className="text-[10.5px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.1em] px-1 mb-2">Agenda</p>

                  {!hasAnything && (
                    <p className="text-[12px] text-[var(--fg-muted)] px-1">Sem eventos na agenda.</p>
                  )}

                  {/* Today's events */}
                  {hasTodayEvents && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.08em] px-1 mb-1">Hoje</p>
                      <div className="space-y-0.5">
                        {(todayEventsFromBriefing ? briefingEvents! : context.todayEvents.map(e => ({
                          id: e.title, title: e.title, startAt: e.time,
                          location: e.location, clientName: undefined,
                        }))).map((ev, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(todayEventsFromBriefing
                              ? `Me dê o briefing completo do evento de hoje: ${ev.title}`
                              : `Me dê detalhes do evento: ${ev.title}`
                            )}
                            className="w-full flex items-start gap-2.5 py-2 px-2 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer group"
                          >
                            <span className="text-[11px] font-semibold tabular-nums text-[#2C444D] w-9 shrink-0 pt-[2px]">
                              {formatEventTime(ev.startAt)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-medium text-[var(--fg)] leading-snug line-clamp-2" title={ev.title}>{titleCase(ev.title)}</p>
                              {(ev as { clientName?: string }).clientName && (
                                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">{(ev as { clientName?: string }).clientName}</p>
                              )}
                              {ev.location && (
                                <p className="flex items-center gap-1 text-[10.5px] text-[var(--fg-placeholder)] mt-0.5 truncate" title={ev.location}>
                                  <MapPin size={8} className="shrink-0" />
                                  {ev.location}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming (non-today) events */}
                  {upcomingNonToday.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.08em] px-1 mb-1">Próximos</p>
                      <div className="space-y-0.5">
                        {upcomingNonToday.slice(0, 3).map((ev, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(`Me dê detalhes do evento: ${ev.title}`)}
                            className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                          >
                            <span className="text-[10px] font-bold text-[var(--fg-placeholder)] w-9 shrink-0 tabular-nums">
                              {formatRelativeDay(ev.date)}
                            </span>
                            <p className="text-[12px] text-[var(--fg-muted)] truncate flex-1" title={ev.title}>{titleCase(ev.title)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Relationship insights */}
          {relationshipInsights && relationshipInsights.length > 0 && (
            <div className="mt-4">
              <p className="text-[10.5px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.1em] px-1 mb-1.5">Relacionamentos</p>
              <div className="space-y-1">
                {relationshipInsights.slice(0, 2).map(insight => (
                  <button
                    key={insight.id}
                    onClick={() => sendMessage(`Me ajude com a situação deste cliente: ${insight.clientName}. ${insight.message}`)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors text-left border border-[var(--border-subtle)] cursor-pointer"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[5px] ${
                      insight.priority === "alta" ? "bg-[var(--error)]" : "bg-[var(--info)]"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[var(--fg)] truncate">{insight.clientName}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] leading-snug mt-0.5">{insight.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guide link */}
          <div className="mt-auto pt-5 px-1">
            <button
              onClick={startGuide}
              className="flex items-center gap-1.5 text-[11px] text-[var(--fg-placeholder)] hover:text-[var(--fg-muted)] transition-colors cursor-pointer"
            >
              <BookOpen size={12} />
              <span>Ver instruções</span>
            </button>
          </div>
        </aside>

        {/* ── RIGHT PANEL — chat ── */}
        <div className="flex-1 flex flex-col min-w-0">

      {/* ── Chat header (back button) ── */}
      {(hasMessages || guideMode) && (
        <div className="shrink-0 px-5 pt-3 pb-2 border-b border-[var(--border)]">
          <div className="max-w-[680px] mx-auto flex items-center gap-3">
            <button
              onClick={goHome}
              className="flex items-center gap-2 text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="font-medium">Início</span>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <IrisIcon variant="sm" />
              <span className="text-[12px] font-medium text-[var(--fg-secondary)]">
                {guideMode ? "Iris — Instruções" : "Iris"}
              </span>
              {!guideMode && messages.length > 0 && (
                <span className="text-[10px] text-[var(--fg-placeholder)] tabular-nums">
                  {messages.filter(m => m.role === "user").length} msg
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-5">
          <AnimatePresence mode="wait">

            {/* ════ HOME STATE ════ */}
            {!hasMessages && !guideMode && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={springDefault}
                className="pt-4 pb-6 flex flex-col items-center"
              >
                {/* Milestone celebrations */}
                <div className="w-full mb-2">
                  <AnimatePresence>
                    {milestones.map((m) => (
                      <MilestoneCard
                        key={m.id}
                        milestone={m}
                        onDismiss={() => setMilestones(prev => prev.filter(x => x.id !== m.id))}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Shoot Day Briefing — shown after metrics on all screen sizes */}

                {/* Workload Card — mobile only */}
                {workloadInsight && (workloadInsight.level === "busy" || workloadInsight.level === "overloaded") && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full rounded-xl p-3.5 mb-4 border lg:hidden ${
                      workloadInsight.level === "overloaded"
                        ? "border-[var(--error)]/15 bg-[var(--error)]/[0.03]"
                        : "border-[var(--warning)]/15 bg-[var(--warning)]/[0.03]"
                    }`}
                  >
                    <p className={`text-[12px] font-semibold ${
                      workloadInsight.level === "overloaded" ? "text-[var(--error)]" : "text-[var(--warning)]"
                    }`}>
                      {workloadInsight.level === "overloaded" ? "Carga alta" : "Semana movimentada"}
                    </p>
                    <p className="text-[11.5px] text-[var(--fg-secondary)] mt-0.5">{workloadInsight.message}</p>
                    <button
                      onClick={() => sendMessage(workloadInsight.suggestion)}
                      className="mt-1.5 text-[11px] font-medium text-[var(--info)] hover:underline"
                    >
                      {workloadInsight.suggestion}
                    </button>
                  </motion.div>
                )}

                {/* ── GREETING + METRICS — always visible ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springDefault, delay: 0.04 }}
                  className="w-full mb-4"
                >
                  {/* Iris + Greeting inline */}
                  <div className="flex items-center gap-3 mb-1">
                    <IrisIcon variant="md" />
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "22px", fontWeight: 300, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {greeting}, {userName.split(" ")[0]}
                    </p>
                  </div>
                  {greetingSub && (
                    <p className="text-[12.5px] text-[var(--fg-muted)] mt-0.5 ml-9">{greetingSub}</p>
                  )}
                  <div className="mt-4">
                    <MetricStrip context={context} />
                  </div>
                  {/* Shoot day card — titleCase applied to remove ALL CAPS data */}
                  {briefingEvents && briefingEvents.length > 0 && (
                    <div className="mt-4">
                      <ShootDayBriefing events={briefingEvents.map(ev => ({
                        ...ev,
                        title: titleCase(ev.title),
                        clientName: ev.clientName ? titleCase(ev.clientName) : ev.clientName,
                        notes: ev.notes ? titleCase(ev.notes) : ev.notes,
                      }))} />
                    </div>
                  )}
                </motion.div>

                {/* ── INSTRUCOES (new user — prominent) ── */}
                {isNewUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springDefault, delay: 0.2 }}
                    className="mt-6 w-full max-w-sm"
                  >
                    <button
                      onClick={startGuide}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[var(--card)] shadow-[var(--shadow-apple)] hover:shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.04)] transition-shadow group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#2C444D]/10 flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-[#2C444D]" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[13px] font-semibold text-[var(--fg)]">Primeiros passos</p>
                        <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Configure seu estúdio e crie seu primeiro projeto.</p>
                      </div>
                      <ChevronRight size={15} className="text-[var(--fg-placeholder)] group-hover:text-[var(--fg-muted)] transition-colors shrink-0" />
                    </button>
                  </motion.div>
                )}

                {/* Mobile: alert chips when there are high-priority alerts */}
                {alerts.filter(a => a.priority === "alta").length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springDefault, delay: 0.21 }}
                    className="mt-3 w-full lg:hidden space-y-1"
                  >
                    {alerts.filter(a => a.priority === "alta").slice(0, 2).map(alert => (
                      <button
                        key={alert.id}
                        onClick={() => sendMessage(alert.message)}
                        className="w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer bg-[var(--error)]/[0.06] hover:bg-[var(--error)]/[0.1]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[5px] bg-[var(--error)]" />
                        <span className="text-[11.5px] leading-snug text-[var(--error)]">{alert.message}</span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* ── QUICK ACTIONS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springDefault, delay: 0.2 }}
                  className="mt-4 w-full"
                >
                  <QuickActionsBar onAction={sendMessage} />
                </motion.div>

                {/* ── EXPLORAR POR ÁREA ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springDefault, delay: 0.22 }}
                  className="mt-5 w-full"
                >
                  <p className="text-[10.5px] font-semibold text-[var(--fg-placeholder)] uppercase tracking-[0.12em] mb-3">
                    Explorar por área
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {AREA_CARDS.map((card, i) => {
                      const meta = getAreaMeta(card.id, context);
                      const status = getAreaStatus(card.id, context);
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...springDefault, delay: 0.26 + i * 0.03 }}
                          className="relative group"
                        >
                          <button
                            onClick={() => sendMessage(card.query)}
                            className={`w-full flex flex-col items-center p-3.5 rounded-2xl bg-[var(--card)] shadow-[var(--shadow-apple)] hover:shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.04)] transition-all cursor-pointer overflow-hidden relative border ${
                              status === "urgent"
                                ? "border-[var(--error)]/25 hover:border-[var(--error)]/40"
                                : status === "attention"
                                ? "border-[var(--warning)]/20 hover:border-[var(--warning)]/35"
                                : "border-transparent"
                            }`}
                          >
                            {status !== "ok" && (
                              <div className={`absolute inset-y-0 left-0 w-[3px] rounded-l-2xl ${
                                status === "urgent" ? "bg-[var(--error)]" : "bg-[var(--warning)]"
                              }`} />
                            )}
                            <div className={`w-9 h-9 flex items-center justify-center mb-2 transition-transform group-hover:scale-110 rounded-xl ${
                              status === "urgent" ? "text-[var(--error)] bg-[var(--error)]/[0.08]" :
                              status === "attention" ? "text-[var(--warning)] bg-[var(--warning)]/[0.08]" :
                              "text-[var(--fg)]"
                            }`}>
                              <card.Icon size={20} />
                            </div>
                            <span className="text-[11.5px] font-medium text-[var(--fg)] tracking-[-0.01em]">{card.label}</span>
                            {meta && (
                              <span className={`text-[10px] mt-0.5 tabular-nums font-medium ${
                                status === "urgent" ? "text-[var(--error)]" : status === "attention" ? "text-[var(--warning)]" : "text-[var(--fg-muted)]"
                              }`}>{meta}</span>
                            )}
                          </button>
                          <Link
                            href={card.route}
                            onClick={(e) => e.stopPropagation()}
                            title={`Ir para ${card.label}`}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--card-hover)]"
                          >
                            <ExternalLink size={9} className="text-[var(--fg-muted)]" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* ── PERGUNTE A IRIS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springDefault, delay: 0.5 }}
                  className="mt-6 w-full"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {dynamicSuggestions.map((s, i) => {
                      // Pick icon based on query keywords
                      const q = s.query.toLowerCase();
                      const icon = q.includes("financ") || q.includes("receber") || q.includes("cobran") ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      ) : q.includes("hoje") || q.includes("agenda") || q.includes("evento") ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      ) : q.includes("projeto") || q.includes("atras") || q.includes("produ") ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      ) : q.includes("resumo") || q.includes("geral") ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      );
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ ...springSnappy, delay: 0.52 + i * 0.04 }}
                          onClick={() => sendMessage(s.query)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--card)] shadow-[var(--shadow-apple)] hover:shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
                        >
                          {icon}
                          {s.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* ── Ver instruções — mobile only ── */}
                {!isNewUser && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...springDefault, delay: 0.65 }}
                    className="mt-5 flex justify-center lg:hidden"
                  >
                    <button
                      onClick={startGuide}
                      className="flex items-center gap-1.5 text-[11px] text-[var(--fg-placeholder)] hover:text-[var(--fg-muted)] transition-colors cursor-pointer"
                    >
                      <BookOpen size={12} />
                      <span>Ver instruções</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ════ GUIDE STATE ════ */}
            {guideMode && !hasMessages && (
              <motion.div
                key="guide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-5 pb-4 space-y-4"
              >
                {/* Intro */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSnappy}
                  className="flex items-start gap-2.5"
                >
                  <div className="mt-0.5">
                    <IrisIcon variant="md" />
                  </div>
                  <p className="text-[13.5px] leading-[1.65] text-[var(--fg)]">
                    Vou te ajudar a configurar seu estúdio. Você pode fazer tudo aqui pelo chat — é só me pedir. Veja o que falta:
                  </p>
                </motion.div>

                {/* Smart steps */}
                {getOnboardingSteps().map((step, i) => {
                  const isDone = step.doneCheck(context);
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springSnappy, delay: 0.1 + i * 0.08 }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                        isDone
                          ? "border-[var(--success)]/30 bg-[var(--success-subtle)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)]"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                        isDone ? "bg-[var(--success)] text-white" : "bg-[var(--bg-subtle)]"
                      }`}>
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--fg-muted)]">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold ${isDone ? "text-[var(--success)] line-through" : "text-[var(--fg)]"}`}>
                          {isDone ? step.doneLabel : step.title}
                        </p>
                        {!isDone && (
                          <>
                            <p className="text-[12px] text-[var(--fg-muted)] mt-1 leading-relaxed">
                              {step.message}
                            </p>
                            {step.chatAction ? (
                              <button
                                onClick={() => {
                                  setGuideMode(false);
                                  sendMessage(step.chatAction!);
                                }}
                                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-[var(--info)] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                              >
                                Fazer agora pelo chat
                                <ChevronRight size={13} />
                              </button>
                            ) : step.linkFallback ? (
                              <Link
                                href={step.linkFallback.href}
                                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-[var(--info)] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                              >
                                {step.linkFallback.label}
                                <ChevronRight size={13} />
                              </Link>
                            ) : null}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* All done message */}
                {getOnboardingSteps().every(s => s.doneCheck(context)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springSnappy, delay: 0.5 }}
                    className="flex items-start gap-2.5 mt-2"
                  >
                    <div className="mt-0.5">
                      <IrisIcon variant="md" />
                    </div>
                    <p className="text-[13.5px] leading-[1.65] text-[var(--fg)]">
                      Tudo configurado! Seu estúdio está pronto. Me pergunte qualquer coisa — estou aqui pra ajudar.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}


            {/* ════ CHAT STATE ════ */}
            {hasMessages && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="pt-5 pb-4 space-y-5"
              >
                {restoredFromStorage && messages.length > 0 && (
                  <div className="text-center py-2 mb-2">
                    <span className="text-[10px] text-[var(--fg-muted)] bg-[var(--bg-subtle)] px-3 py-1 rounded-full">
                      Conversa anterior
                    </span>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springSnappy}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {(msg.role === "iris" || msg.role === "form") && (
                      <div className="mr-2.5 mt-0.5">
                        <IrisIcon variant="md" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] ${
                        msg.role === "user"
                          ? "rounded-[18px] rounded-br-[4px] bg-[var(--bg-subtle)] text-[var(--fg)] px-4 py-2.5"
                          : "text-[var(--fg)]"
                      }`}
                    >
                      {msg.role === "form" && msg.formType && !msg.formCompleted ? (
                        <div className="space-y-2">
                          <p className="text-[15px] text-[var(--fg-muted)] mb-2">{msg.content}</p>
                          {msg.formType === "novo_cliente" && (
                            <InlineClientForm studioId={studioId} onComplete={(summary) => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, formCompleted: true } : m));
                              setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: "iris", content: summary, timestamp: new Date() }]);
                              router.refresh();
                            }} />
                          )}
                          {msg.formType === "novo_projeto" && !msg.formCompleted && (
                            <button
                              onClick={() => setShowWizard(true)}
                              className="h-11 px-5 rounded-xl text-[14px] font-semibold bg-[var(--bg-ink,#2C444D)] text-white hover:opacity-90 transition-all flex items-center gap-2"
                            >
                              + Criar projeto
                            </button>
                          )}
                          {msg.formType === "novo_membro" && (
                            <InlineTeamForm studioId={studioId} onComplete={(summary) => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, formCompleted: true } : m));
                              setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: "iris", content: summary, timestamp: new Date() }]);
                              router.refresh();
                            }} />
                          )}
                          {msg.formType === "novo_lead" && (
                            <InlineLeadForm studioId={studioId} onComplete={(summary) => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, formCompleted: true } : m));
                              setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: "iris", content: summary, timestamp: new Date() }]);
                              router.refresh();
                            }} />
                          )}
                        </div>
                      ) : msg.role === "iris" || msg.formCompleted ? (
                        msg.isStreaming && !msg.content ? (
                          <div className="flex gap-[3px] py-1">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                className="w-[5px] h-[5px] rounded-full bg-[var(--fg-muted)]"
                                animate={{ opacity: [0.15, 0.6, 0.15] }}
                                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        ) : (
                          <IrisMarkdown content={msg.content} />
                        )
                      ) : (
                        <p className="text-[15px] leading-[1.7] whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.chart && msg.chart.type === "bar" && (
                        <MiniBarChart data={msg.chart.data} title={msg.chart.title} format={msg.chart.format} />
                      )}
                      {msg.chart && msg.chart.type === "stats" && (
                        <MiniStatCards stats={msg.chart.data} />
                      )}
                      {msg.actions && msg.actions.length > 0 && (
                        <IrisActionButtons
                          actions={msg.actions}
                          studioId={studioId}
                          onSendMessage={(text) => sendMessage(text)}
                        />
                      )}
                      {msg.role === "iris" && !msg.formCompleted && msg.id === messages[messages.length - 1]?.id && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                          {getFollowUpSuggestions(msg.content).map((s, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(s)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-medium text-[var(--fg-muted)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-secondary)] transition-all"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.role !== "form" && (
                        <p className={`text-[9px] mt-1 tabular-nums ${
                          msg.role === "user" ? "text-[var(--fg-muted)] text-right" : "text-[var(--fg-muted)] opacity-40"
                        }`}>
                          {format(msg.timestamp, "HH:mm")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator — hidden when streaming message is visible */}
                <AnimatePresence>
                  {isTyping && !messages.some(m => m.isStreaming) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2.5"
                    >
                      <IrisIcon variant="md" />
                      <div className="flex gap-[3px]">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-[5px] h-[5px] rounded-full bg-[var(--fg-muted)]"
                            animate={{ opacity: [0.15, 0.6, 0.15] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Input area ── */}
      <div className={`shrink-0 px-5 pb-5 pt-2 ${guideMode ? "hidden" : ""}`}>
        <div className="max-w-[680px] mx-auto">
          {/* Quick suggestions during chat — mobile only (desktop shows in left panel) */}
          {hasMessages && !isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-1.5 mb-2.5 justify-center lg:hidden"
            >
              {dynamicSuggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.query)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium text-[var(--fg-muted)] bg-[var(--card)] shadow-[0_0.5px_1px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-[var(--shadow-apple)] hover:text-[var(--fg)] transition-all"
                >
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Input */}
          <div className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow-apple)] focus-within:shadow-[0_0.5px_1px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.04)] transition-all overflow-hidden">
            {pendingImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                <img
                  src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`}
                  alt="Preview"
                  className="h-8 w-8 object-cover rounded"
                />
                <span className="text-[12px] text-[var(--fg-muted)] flex-1">Imagem anexada</span>
                <button
                  onClick={() => setPendingImage(null)}
                  className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-[11px] p-1"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="relative flex items-end gap-2.5 pl-3.5 pr-2.5 py-2.5">
            <div className="shrink-0 mb-[2px]">
              <IrisIcon variant="sm" />
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              rows={1}
              className="flex-1 bg-transparent text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] resize-none outline-none leading-relaxed max-h-32"
              style={{ minHeight: "24px" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const compressed = await compressImage(file);
                setPendingImage(compressed);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg transition-colors ${pendingImage ? "text-[var(--accent)] bg-[var(--accent)]/10" : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"}`}
              title="Anexar imagem"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            {/* Mic button */}
            <motion.button
              type="button"
              onClick={toggleVoice}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-xl transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              title={isListening ? "Parar gravação" : "Falar mensagem"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </motion.button>
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && !pendingImage) || isTyping}
              animate={{
                scale: (input.trim() || pendingImage) ? 1 : 0.85,
                opacity: (input.trim() || pendingImage) ? 1 : 0.15,
              }}
              transition={springSnappy}
              title="Enviar (Enter)"
              className="w-7 h-7 rounded-lg bg-[var(--fg)] text-white flex items-center justify-center shrink-0 disabled:pointer-events-none hover:opacity-80 transition-opacity"
            >
              <Send size={13} />
            </motion.button>
            </div>
          </div>
        </div>
      </div>

        </div>{/* end right panel */}
      </div>{/* end horizontal split */}

      <IrisProjectWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={() => {
          setShowWizard(false);
          setMessages(prev => prev.map(m => m.formType === "novo_projeto" && !m.formCompleted ? { ...m, formCompleted: true } : m));
          setMessages(prev => [...prev, {
            id: `m-${Date.now()}`, role: "iris" as const,
            content: "Projeto criado com sucesso! Abra em **Projetos** para ver os detalhes.",
            timestamp: new Date(),
          }]);
        }}
        studioId={studioId}
        clients={wizardData.clients}
        packs={wizardData.packs}
        workflowTemplates={wizardData.workflowTemplates}
        catalogProducts={wizardData.catalogProducts}
        teamMembers={wizardData.teamMembers}
      />
    </div>
  );
}
