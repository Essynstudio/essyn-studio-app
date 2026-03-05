/**
 * MaiaFocusChat v7 — "Less is Presence"
 *
 * The interface doesn't open. The WORLD DISSOLVES and Maia EMERGES.
 *
 * Transition choreography (orchestrated with AppLayout + Wrapper):
 *   t=0.0s  User clicks Maia → isFocusMode = true
 *   t=0.0s  AppContent starts dissolving (opacity, scale)
 *   t=0.0s  Dark INK veil starts rising (z-999)
 *   t=0.0s  MaiaFocusChat mounts at opacity 0 (z-1000)
 *   t=0.3s  MaiaFocusChat starts fading in → Maia emerges from darkness
 *   t=0.5s  AwakenPulse fires — single golden rift
 *   t=0.6s  Orb materializes, growing from nothing
 *   t=0.8s  Typewriter greeting begins
 *   t=1.0s  MaiaFocusChat fully opaque — you're in Maia's world
 *
 * Signature effects (curated, minimal):
 *   1.  Cursor Constellation — 3 golden dots trailing with spring physics
 *   2.  Gravitational Pupil — Maia's "eye" follows cursor gently
 *   3.  Orb Breath — slow, living scale pulse
 *   4.  Typewriter Text — greeting letters appear one by one, then rest
 *   5.  Word-by-Word Sub-text — poetic word reveal
 *   6.  Gentle Depth Parallax — greeting/tiles shift subtly with cursor
 *   7.  Time-based ambient gradient
 *   8.  AwakenPulse — single golden rift when emerging
 *
 * Philosophy: Every effect must have PURPOSE, not decoration.
 * If you can't explain why it's there in one sentence, remove it.
 *
 * All solid colors — zero transparency (no rgba, no alpha, no /[0.x]).
 */
import { useState, useRef, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import {
  ArrowLeft, Send, Sparkles, BarChart3, Calendar, Clapperboard,
  DollarSign, FolderKanban, Images, Layers, Users, Command,
  FileText, TrendingUp, ClipboardList, UserCheck,
  Moon, Sun,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import gsap from "gsap";
import { SERIF, SERIF_SWASH, GOLD, GOLD_LIGHT, INK } from "../ui/editorial";
import { springDefault, withDelay } from "../../lib/motion-tokens";
import { useMaia } from "./MaiaProvider";
import { getModuleFromPath, getMaiaModuleConfig, type MaiaModule } from "./maiaContextConfig";
import { navigateToProject, type ProjetoTab } from "../../lib/navigation";
import { projetos } from "../projetos/projetosData";
import { MaiaAssistantView } from "./MaiaAssistantView";
import { useAppStore, type AppStats, type AppLead, type AppProject, type AppParcela } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TYPES & DATA                                       */
/* ═══════════════════════════════════════════════════ */

interface MousePos { x: number; y: number }

interface ModuleTile {
  id: string; label: string; desc: string; icon: LucideIcon; route: string; preview: string;
}

interface InlineKpi { label: string; value: string; accent?: boolean }
interface InlineListItem { label: string; status?: "ok" | "warning" | "danger" }

interface InlineMsg {
  id: string;
  role: "user" | "maia";
  content: string;
  kpis?: InlineKpi[];
  listItems?: InlineListItem[];
}

const moduleTiles: ModuleTile[] = [
  { id: "dashboard", label: "Visao Geral", desc: "Resumo do estudio", icon: BarChart3, route: "/dashboard", preview: "4 alertas" },
  { id: "producao", label: "Producao", desc: "Fila de trabalho", icon: Clapperboard, route: "/producao", preview: "3 pendentes" },
  { id: "financeiro", label: "Financeiro", desc: "Receitas e cobrancas", icon: DollarSign, route: "/financeiro", preview: "R$ 5.2k" },
  { id: "agenda", label: "Agenda", desc: "Eventos e reunioes", icon: Calendar, route: "/agenda", preview: "2 eventos" },
  { id: "galeria", label: "Galeria", desc: "Entregas e selecoes", icon: Images, route: "/galeria", preview: "148 fotos" },
  { id: "projetos", label: "Projetos", desc: "Contratos e prazos", icon: FolderKanban, route: "/projetos", preview: "7 ativos" },
  { id: "crm", label: "CRM", desc: "Leads e pipeline", icon: Users, route: "/crm", preview: "12 leads" },
  { id: "entregas", label: "Entregas", desc: "Prazos e pendencias", icon: Layers, route: "/producao", preview: "5 prazos" },
];

const quickPrompts = [
  { text: "Quanto tenho a receber este mes?", icon: DollarSign },
  { text: "Quais trabalhos estao atrasados?", icon: Clapperboard },
  { text: "Resumo geral do estudio", icon: BarChart3 },
  { text: "O que tenho pra hoje?", icon: Calendar },
];

/* ═══════════════════════════════════════════════════ */
/*  CINEMA THEME — light & dark token sets             */
/* ═══════════════════════════════════════════════════ */

interface CinemaColors {
  bg: string; surface: string; surfaceAlt: string;
  border: string; borderHover: string; borderFocus: string;
  text: string; textMuted: string; textSub: string; textFaint: string; textGhost: string;
  userBubble: string; userText: string;
  inputShadow: string; inputFocusShadow: string; paletteShadow: string;
  sendBg: string; sendText: string; sendInactive: string;
  dotColor: string; orbShadow: string; orbGrad: string;
  morphShadow: string; tileHoverShadow: string;
  kbdBg: string; kbdBorder: string; awakenEdge: string;
  kpiAccent: string; statusOk: string; statusWarn: string; statusDanger: string;
  sendShadow: string; slashSelectedBg: string; constellationFade: string;
}

const LIGHT: CinemaColors = {
  bg: "#F5F5F7", surface: "#FFFFFF", surfaceAlt: "#F5F5F7",
  border: "#E5E5EA", borderHover: "#E5D9C4", borderFocus: GOLD_LIGHT,
  text: "#48484A", textMuted: "#636366", textSub: "#AEAEB2", textFaint: "#D1D1D6", textGhost: "#E5E5EA",
  userBubble: INK, userText: "#FFFFFF",
  inputShadow: "0 2px 12px #E5E5EA", inputFocusShadow: "0 0 0 4px #EDE5D4, 0 8px 32px #E5D9C4",
  paletteShadow: "0 8px 32px #E5D9C4",
  sendBg: INK, sendText: "#FFFFFF", sendInactive: "#F5F5F7",
  dotColor: "#D1D1D6",
  orbShadow: "0 16px 48px #E5D9C4, 0 6px 16px #E5E5EA, inset 0 1px 0 #FFFFFF",
  orbGrad: "radial-gradient(circle at 40% 35%, #EDE5D4 0%, #F5F5F7 60%)",
  morphShadow: "0 4px 16px #EDE5D4", tileHoverShadow: "0 8px 24px #EDE5D4",
  kbdBg: "#F5F5F7", kbdBorder: "#E5E5EA", awakenEdge: "#F5F5F7",
  kpiAccent: GOLD, statusOk: "#34C759", statusWarn: "#FF9500", statusDanger: "#FF3B30",
  sendShadow: "0 4px 12px #C7C7CC", slashSelectedBg: "#EDE5D4", constellationFade: "#DDD2BC",
};

const DARK: CinemaColors = {
  bg: INK, surface: "#2C2C2E", surfaceAlt: "#3A3A3C",
  border: "#3A3A3C", borderHover: GOLD, borderFocus: GOLD,
  text: "#F2F2F7", textMuted: "#D1D1D6", textSub: "#AEAEB2", textFaint: "#636366", textGhost: "#48484A",
  userBubble: GOLD, userText: INK,
  inputShadow: "0 2px 12px #1C1C1E", inputFocusShadow: "0 0 0 4px #3A3A3C, 0 8px 32px #1C1C1E",
  paletteShadow: "0 8px 32px #1C1C1E",
  sendBg: GOLD, sendText: INK, sendInactive: "#3A3A3C",
  dotColor: "#636366",
  orbShadow: "0 16px 48px #1C1C1E, 0 6px 16px #1D1D1F, inset 0 1px 0 #3A3A3C",
  orbGrad: "radial-gradient(circle at 40% 35%, #3A3A3C 0%, #2C2C2E 60%)",
  morphShadow: "0 4px 16px #1C1C1E", tileHoverShadow: "0 8px 24px #1C1C1E",
  kbdBg: "#3A3A3C", kbdBorder: "#48484A", awakenEdge: INK,
  kpiAccent: GOLD, statusOk: "#34C759", statusWarn: "#FF9500", statusDanger: "#FF3B30",
  sendShadow: "0 4px 12px #1C1C1E", slashSelectedBg: "#3A3A3C", constellationFade: "#48484A",
};

const CinemaCtx = createContext<CinemaColors>(LIGHT);
const useCinema = () => useContext(CinemaCtx);

/* ═══════════════════════════════════════════════════ */
/*  SLASH COMMANDS REGISTRY                            */
/* ═══════════════════════════════════════════════════ */

interface SlashCmd {
  cmd: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const slashCommands: SlashCmd[] = [
  { cmd: "/briefing", label: "Briefing", desc: "Gera briefing pre-evento completo", icon: FileText },
  { cmd: "/forecast", label: "Forecast", desc: "Previsao de faturamento 3 meses", icon: TrendingUp },
  { cmd: "/relatorio", label: "Relatorio", desc: "Relatorio completo do estudio", icon: BarChart3 },
  { cmd: "/cobrar", label: "Cobrancas", desc: "Lista todas as cobrancas pendentes", icon: DollarSign },
  { cmd: "/equipe", label: "Equipe", desc: "Distribuicao de carga da equipe", icon: UserCheck },
  { cmd: "/entregas", label: "Entregas", desc: "Proximas entregas e prazos", icon: ClipboardList },
  { cmd: "/pipeline", label: "Pipeline", desc: "Resumo do pipeline de leads", icon: Users },
  { cmd: "/kpi", label: "KPIs", desc: "KPIs do mes atual com comparativo", icon: TrendingUp },
  { cmd: "/atrasados", label: "Atrasados", desc: "Tudo que esta atrasado", icon: Calendar },
  { cmd: "/galeria", label: "Galeria", desc: "Status das galerias e entregas", icon: Images },
  { cmd: "/agenda", label: "Agenda", desc: "Compromissos da semana", icon: Calendar },
  { cmd: "/cliente", label: "Cliente", desc: "Historico de um cliente", icon: UserCheck },
];

interface StoreSnapshot { leads: AppLead[]; projects: AppProject[]; parcelas: AppParcela[] }

function lookupCliente(nome: string, store?: StoreSnapshot): string {
  if (!store || !nome.trim()) return "Use /cliente [nome] para ver o historico. Exemplo: /cliente Ana Clara.";
  const q = nome.trim().toLowerCase();
  const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  /* Search projects first */
  const proj = store.projects.find((p) => p.cliente.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q));
  if (proj) {
    const parcelas = store.parcelas.filter((p) => p.projetoId === proj.id);
    const pago = parcelas.filter((p) => p.status === "pago").reduce((s, p) => s + p.valor, 0);
    const pendente = parcelas.filter((p) => p.status === "pendente" || p.status === "atrasado").reduce((s, p) => s + p.valor, 0);
    const atrasado = parcelas.filter((p) => p.status === "atrasado").reduce((s, p) => s + p.valor, 0);
    return `Cliente: ${proj.cliente}. Projeto: ${proj.nome} (${proj.tipo}). Valor: ${fmtBRL(proj.valor)}. Status: ${proj.status}. Producao: ${proj.producaoFase}. Evento: ${proj.dataEvento || "sem data"}.${parcelas.length > 0 ? ` Financeiro: ${parcelas.length} parcela${parcelas.length > 1 ? "s" : ""}, ${fmtBRL(pago)} pago, ${fmtBRL(pendente)} pendente${atrasado > 0 ? `, ${fmtBRL(atrasado)} atrasado` : ""}.` : ""}`;
  }
  /* Search leads */
  const lead = store.leads.find((l) => l.nome.toLowerCase().includes(q));
  if (lead) {
    return `Lead: ${lead.nome} (${lead.tipo}). Valor: ${fmtBRL(lead.valor)}. Estagio: ${lead.stage}. Origem: ${lead.origem}. Evento: ${lead.dataEvento || "sem data"}. Contato: ${lead.email}${lead.projetoId ? ". Ja convertido em projeto." : ". Ainda nao convertido."}`;
  }
  return `Nenhum cliente ou lead encontrado com "${nome}". Clientes ativos: ${store.projects.map((p) => p.cliente).join(", ")}. Leads: ${store.leads.map((l) => l.nome).join(", ")}.`;
}

function generateSlashResponse(cmd: string, stats?: AppStats, store?: StoreSnapshot): string {
  const c = cmd.split(" ")[0].toLowerCase();
  const arg = cmd.slice(cmd.indexOf(" ") + 1).trim();
  const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  switch (c) {
    case "/briefing":
      return "Briefing — Casamento Oliveira: 15/03 as 16h, Fazenda Santa Clara (cerimonia) + Espaco Jardim (recepcao). Equipe: voce + 2nd shooter Carlos + drone Marcos. Noiva: Ana (11 9xxxx). Pacote Premium (R$ 8.500, 60% pago). Producao: 2/6 etapas concluidas. Kit: 2 corpos, 70-200mm, 35mm, flash. Nota: noiva pediu fotos com avo materno como prioridade.";
    case "/forecast":
      return "Forecast 3 meses — Marco: R$ 12.400 confirmado + R$ 3.200 projetado. Abril: R$ 8.600 confirmado + R$ 5.800 projetado. Maio: R$ 4.200 confirmado + R$ 9.100 projetado. Tendencia: estavel. Receita confirmada total: R$ 25.200. Projecao otimista: R$ 43.300.";
    case "/relatorio":
      return "Relatorio do Estudio — 7 projetos ativos, 12 leads no pipeline. Faturamento mensal: R$ 12.4k (meta: R$ 15k, 83%). Producao: 68% no prazo, 3 atrasados. Financeiro: R$ 5.240 a receber, R$ 1.800 vencido. Agenda: 2 eventos proxima semana. NPS medio: 9.2/10.";
    case "/cobrar":
      return "Cobrancas Pendentes — 1) Casamento Oliveira: R$ 1.800 (vencida ha 5 dias) — contato: joao@email.com. 2) Ensaio Marina: R$ 650 (vence em 3 dias). 3) Corporativo TechSummit: R$ 2.790 (vence em 10 dias). Total pendente: R$ 5.240. Sugestao: priorizar Oliveira, ja vencido.";
    case "/equipe":
      return "Distribuicao da Equipe — Voce: 4 projetos ativos (carga alta). Carlos (2nd shooter): 2 projetos, disponivel sex/sab. Marcos (drone): 1 projeto, disponivel. Julia (edicao): 3 projetos em paralelo (carga maxima). Recomendacao: redistribuir edicao do TechSummit para freelancer externo.";
    case "/entregas":
      return "Proximas Entregas — 1) Ensaio Marina: album digital ate 28/02 (amanha!). 2) Corporativo TechSummit: galeria selecao ate 03/03. 3) Casamento Oliveira: pre-selecao ate 05/03. 4) Familia Santos: album impresso ate 10/03. 5) Debutante Lara: fotos editadas ate 12/03. Total: 5 entregas nos proximos 15 dias.";
    case "/pipeline":
      return `Pipeline CRM — ${stats?.totalLeads ?? 12} leads ativos, valor total: ${fmtBRL(stats?.pipelineValor ?? 6240000)}. Taxa conversao: ${stats?.taxaConversao ?? 14}%. Distribuicao: 3 novos, 2 contato, 1 reuniao, 2 proposta, 2 negociacao, 1 ganho, 1 perdido. Acao sugerida: focar nos leads em negociacao.`;
    case "/kpi":
      return `KPIs Marco 2026 — Leads: ${stats?.totalLeads ?? 7} (meta: 10). Conversao: ${stats?.taxaConversao ?? 14}% (meta: 20%). A receber: ${fmtBRL(stats?.receberPendente ?? 620000)}. Projetos ativos: ${stats?.projetosAtivos ?? 3}. Producao em andamento: ${stats?.producaoEmAndamento ?? 2}. Entregas pendentes: ${stats?.entregasPendentes ?? 0}. Tendencia: ${(stats?.taxaConversao ?? 14) >= 20 ? "saudavel" : "precisa aumentar captacao"}.`;
    case "/atrasados":
      return `Atrasados — Financeiro: ${(stats?.receberAtrasado ?? 425000) > 0 ? fmtBRL(stats?.receberAtrasado ?? 425000) + " em parcelas atrasadas" : "nenhuma parcela atrasada"}. CRM: ${stats?.leadsHoje ?? 2} leads requerem acao. Producao: ${(stats?.entregasPendentes ?? 0) > 0 ? stats!.entregasPendentes + " entregas pendentes" : "nenhum atrasado"}. Sugestao: priorizar cobranças vencidas e retomar leads sem resposta.`;
    case "/galeria":
      return "Galerias — Casamento Ana & Diego: em edicao (240 fotos selecionadas, 120 editadas). Ensaio Gestante Luisa: selecao em andamento (180 fotos importadas). Corp TechBrasil: aguardando captacao. Nenhuma galeria de cliente publicada esta semana.";
    case "/agenda":
      return "Agenda da Semana — Seg: Edicao Casamento Ana (estudio). Ter: Reuniao Carla & Bruno 14h. Qua: Follow-up Amanda Torres + cobrar TechBrasil. Qui: Ensaio Gestante Luisa 10h (Parque Municipal). Sex: Livre. Sab: Sem eventos. Dom: Sem eventos.";
    case "/cliente":
      return arg && arg !== "/cliente" ? lookupCliente(arg, store) : "Use /cliente [nome] para ver o historico. Exemplo: /cliente Ana Clara. Clientes ativos: Ana Clara & Diego, Luisa Carvalho, TechBrasil SA. Leads: Mariana & Rafael, Fernanda Alves, Carla & Bruno, Ricardo Souza.";
    default:
      return "Comando executado. Processando dados do estudio...";
  }
}

/* ═══════════════════════════════════════════════════ */
/*  INLINE RESPONSE GENERATOR (mock)                   */
/* ═══════════════════════════════════════════════════ */

function generateInlineResponse(prompt: string, stats?: AppStats): Omit<InlineMsg, "id" | "role"> {
  const p = prompt.toLowerCase();
  const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  if (p.includes("receber") || p.includes("financeiro") || p.includes("mes")) {
    const pendente = stats?.receberPendente ?? 5240;
    const atrasado = stats?.receberAtrasado ?? 1800;
    return {
      content: `Voce tem ${fmtBRL(pendente)} a receber este mes${atrasado > 0 ? ` e ${fmtBRL(atrasado)} em atraso` : ""}.`,
      kpis: [
        { label: "A receber", value: fmtBRL(pendente), accent: true },
        { label: "Projetos", value: String(stats?.projetosAtivos ?? 3) },
        { label: "Atrasado", value: atrasado > 0 ? fmtBRL(atrasado) : "R$ 0", accent: atrasado > 0 },
        { label: "Conversao", value: `${stats?.taxaConversao ?? 0}%` },
      ],
    };
  }
  if (p.includes("atrasado") || p.includes("trabalho") || p.includes("producao")) {
    const emAndamento = stats?.producaoEmAndamento ?? 3;
    const entregas = stats?.entregasPendentes ?? 1;
    return {
      content: `${emAndamento} trabalho${emAndamento !== 1 ? "s" : ""} em producao e ${entregas} entrega${entregas !== 1 ? "s" : ""} pendente${entregas !== 1 ? "s" : ""}:`,
      kpis: [
        { label: "Em producao", value: String(emAndamento), accent: true },
        { label: "Entregas", value: String(entregas) },
        { label: "Projetos", value: String(stats?.projetosAtivos ?? 3) },
      ],
    };
  }
  if (p.includes("resumo") || p.includes("geral") || p.includes("estudio")) {
    const pipeline = stats?.pipelineValor ?? 0;
    return {
      content: "Resumo geral do seu estudio:",
      kpis: [
        { label: "Projetos", value: `${stats?.projetosAtivos ?? 0} ativos` },
        { label: "Pipeline", value: fmtBRL(pipeline), accent: true },
        { label: "Entregas", value: `${stats?.entregasPendentes ?? 0} pendentes` },
        { label: "Leads", value: String(stats?.totalLeads ?? 0) },
      ],
    };
  }
  if (p.includes("hoje") || p.includes("agenda") || p.includes("compromisso"))
    return {
      content: "Sua agenda para hoje:",
      listItems: [
        { label: "10h — Reuniao com Familia Santos", status: "ok" },
        { label: "18h — Entrega album Ensaio Marina", status: "warning" },
      ],
    };
  return { content: "Entendi sua pergunta. Deixe-me analisar os dados do estudio para te dar a melhor resposta. Pode detalhar um pouco mais o que precisa?" };
}

function generateSlashResponseData(cmd: string, stats?: AppStats, store?: StoreSnapshot): Omit<InlineMsg, "id" | "role"> {
  const s = cmd.split(" ")[0].toLowerCase();
  const arg = cmd.slice(cmd.indexOf(" ") + 1).trim();
  const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  switch (s) {
    case "/forecast":
      return {
        content: "Forecast de faturamento — proximos 3 meses:",
        kpis: [
          { label: "Marco", value: "R$ 15.6k", accent: true },
          { label: "Abril", value: "R$ 14.4k" },
          { label: "Maio", value: "R$ 13.3k" },
          { label: "Total", value: "R$ 43.3k", accent: true },
        ],
      };
    case "/relatorio":
      return {
        content: "Relatorio completo do estudio:",
        kpis: [
          { label: "Projetos", value: "7 ativos" },
          { label: "Leads", value: "12" },
          { label: "Faturamento", value: "R$ 12.4k", accent: true },
          { label: "Meta", value: "83%" },
          { label: "No prazo", value: "68%" },
          { label: "NPS", value: "9.2", accent: true },
        ],
      };
    case "/cobrar":
      return {
        content: "Cobrancas pendentes:",
        kpis: [
          { label: "Total", value: "R$ 5.240", accent: true },
          { label: "Vencido", value: "R$ 1.800", accent: true },
        ],
        listItems: [
          { label: "Casamento Oliveira — R$ 1.800 (vencida)", status: "danger" },
          { label: "Ensaio Marina — R$ 650 (3 dias)", status: "warning" },
          { label: "TechSummit — R$ 2.790 (10 dias)", status: "ok" },
        ],
      };
    case "/entregas":
      return {
        content: "Proximas entregas — 15 dias:",
        kpis: [{ label: "Total", value: "5" }, { label: "Urgente", value: "1", accent: true }],
        listItems: [
          { label: "Ensaio Marina — album digital ate 28/02", status: "danger" },
          { label: "TechSummit — galeria ate 03/03", status: "warning" },
          { label: "Casamento Oliveira — selecao ate 05/03", status: "ok" },
          { label: "Familia Santos — album ate 10/03", status: "ok" },
          { label: "Debutante Lara — teaser ate 12/03", status: "ok" },
        ],
      };
    case "/equipe":
      return {
        content: "Distribuicao da equipe:",
        listItems: [
          { label: "Voce — 4 projetos (carga alta)", status: "danger" },
          { label: "Carlos — 2 projetos, disponivel", status: "ok" },
          { label: "Marcos — 1 projeto, disponivel", status: "ok" },
          { label: "Julia — 3 projetos (carga maxima)", status: "danger" },
        ],
      };
    case "/briefing":
      return {
        content: "Briefing pre-evento — Casamento Oliveira, 15/03 as 16h:",
        kpis: [
          { label: "Pacote", value: "Premium", accent: true },
          { label: "Valor", value: "R$ 8.500" },
          { label: "Pago", value: "60%" },
          { label: "Producao", value: "2/6" },
        ],
        listItems: [
          { label: "Local: Fazenda Santa Clara + Espaco Jardim", status: "ok" },
          { label: "Equipe: voce + Carlos (2nd) + Marcos (drone)", status: "ok" },
          { label: "Kit: 2 corpos, 70-200mm, 35mm, flash", status: "ok" },
          { label: "Nota: noiva pediu fotos com avo materno", status: "warning" },
        ],
      };
    case "/pipeline":
      return {
        content: `Pipeline CRM — ${stats?.totalLeads ?? 12} leads, valor total: ${fmtBRL(stats?.pipelineValor ?? 6240000)}`,
        kpis: [
          { label: "Leads", value: String(stats?.totalLeads ?? 12) },
          { label: "Pipeline", value: fmtBRL(stats?.pipelineValor ?? 6240000), accent: true },
          { label: "Conversao", value: `${stats?.taxaConversao ?? 14}%` },
        ],
      };
    case "/kpi":
      return {
        content: `KPIs do mes atual:`,
        kpis: [
          { label: "Leads", value: String(stats?.totalLeads ?? 7) },
          { label: "Conversao", value: `${stats?.taxaConversao ?? 14}%` },
          { label: "A receber", value: fmtBRL(stats?.receberPendente ?? 620000), accent: true },
          { label: "Projetos", value: String(stats?.projetosAtivos ?? 3) },
          { label: "Producao", value: String(stats?.producaoEmAndamento ?? 2) },
          { label: "Entregas", value: String(stats?.entregasPendentes ?? 0) },
        ],
      };
    case "/atrasados":
      return {
        content: `Itens atrasados:`,
        kpis: [
          { label: "Financeiro", value: fmtBRL(stats?.receberAtrasado ?? 425000), accent: true },
          { label: "Entregas", value: String(stats?.entregasPendentes ?? 0) },
          { label: "Leads urgentes", value: String(stats?.leadsHoje ?? 2), accent: true },
        ],
      };
    case "/cliente": {
      if (!arg || arg === "/cliente" || !store) {
        return { content: generateSlashResponse(cmd, stats, store) };
      }
      const q = arg.toLowerCase();
      const proj = store.projects.find((p) => p.cliente.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q));
      if (proj) {
        const parcelas = store.parcelas.filter((p) => p.projetoId === proj.id);
        const pago = parcelas.filter((p) => p.status === "pago").reduce((sm, p) => sm + p.valor, 0);
        const pendente = parcelas.filter((p) => p.status === "pendente" || p.status === "atrasado").reduce((sm, p) => sm + p.valor, 0);
        const atrasado = parcelas.filter((p) => p.status === "atrasado").reduce((sm, p) => sm + p.valor, 0);
        return {
          content: `Cliente encontrado: ${proj.cliente} — ${proj.nome}`,
          kpis: [
            { label: "Valor", value: fmtBRL(proj.valor), accent: true },
            { label: "Pago", value: fmtBRL(pago) },
            { label: "Pendente", value: fmtBRL(pendente), accent: pendente > 0 },
            { label: "Producao", value: proj.producaoFase },
          ],
          listItems: [
            { label: `Tipo: ${proj.tipo} · Status: ${proj.status}`, status: proj.status === "ativo" ? "ok" : "warning" },
            { label: `Evento: ${proj.dataEvento || "sem data"}`, status: "ok" },
            ...(atrasado > 0 ? [{ label: `${fmtBRL(atrasado)} em parcelas atrasadas`, status: "danger" as const }] : []),
            ...parcelas.map((p) => ({ label: `${p.descricao} — ${fmtBRL(p.valor)} (${p.status})`, status: (p.status === "pago" ? "ok" : p.status === "atrasado" ? "danger" : "warning") as "ok" | "warning" | "danger" })),
          ],
        };
      }
      const lead = store.leads.find((l) => l.nome.toLowerCase().includes(q));
      if (lead) {
        return {
          content: `Lead encontrado: ${lead.nome}`,
          kpis: [
            { label: "Valor", value: fmtBRL(lead.valor), accent: true },
            { label: "Estagio", value: lead.stage },
            { label: "Origem", value: lead.origem },
          ],
          listItems: [
            { label: `Tipo: ${lead.tipo}`, status: "ok" },
            { label: `Evento: ${lead.dataEvento || "sem data"}`, status: "ok" },
            { label: `Contato: ${lead.email}`, status: "ok" },
            { label: lead.projetoId ? "Convertido em projeto" : "Ainda nao convertido", status: lead.projetoId ? "ok" : "warning" },
          ],
        };
      }
      return { content: `Nenhum cliente ou lead encontrado com "${arg}".` };
    }
    default:
      return { content: generateSlashResponse(cmd, stats, store) };
  }
}

/* ═══════════════════════════════════════════════════ */
/*  TIME UTILITIES                                     */
/* ═══════════════════════════════════════════════════ */

function getTimeGreeting(): { greeting: string; sub: string } {
  const h = new Date().getHours();
  if (h < 6) return { greeting: "Boa madrugada", sub: "O silencio e o melhor momento para criar." };
  if (h < 12) return { greeting: "Bom dia", sub: "Um novo dia, novas possibilidades no seu estudio." };
  if (h < 18) return { greeting: "Boa tarde", sub: "Como posso otimizar o resto do seu dia?" };
  return { greeting: "Boa noite", sub: "Hora de revisar o dia e planejar o amanha." };
}

function getAmbientGradient(): string {
  const h = new Date().getHours();
  if (h < 6) return "radial-gradient(ellipse at 50% 60%, #F0EAD6 0%, #F5F5F7 55%)";
  if (h < 12) return "radial-gradient(ellipse at 65% 40%, #F5EFE3 0%, #F5F5F7 50%)";
  if (h < 18) return "radial-gradient(ellipse at 50% 45%, #F5F5F7 0%, #F5F5F7 50%)";
  return "radial-gradient(ellipse at 35% 50%, #F0EAD6 0%, #F5F5F7 55%)";
}

/* ═══════════════════════════════════════════════════ */
/*  AWAKEN PULSE — single golden rift                  */
/* ═══════════════════════════════════════════════════ */

function AwakenPulse() {
  const lineRef = useRef<HTMLDivElement>(null);
  const c = useCinema();

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const tl = gsap.timeline();
    tl.fromTo(line, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 0, duration: 1.2, delay: 0.4, ease: "power2.out" });
    return () => tl.kill();
  }, []);

  return (
    <div className="fixed inset-0 z-[1005] pointer-events-none" aria-hidden="true">
      <div ref={lineRef} className="absolute top-1/2 left-0 right-0 h-px origin-center"
        style={{ background: `linear-gradient(90deg, ${c.awakenEdge} 0%, ${GOLD_LIGHT} 20%, ${GOLD} 50%, ${GOLD_LIGHT} 80%, ${c.awakenEdge} 100%)`, opacity: 0 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CURSOR CONSTELLATION — 3 golden dots               */
/* ═══════════════════════════════════════════════════ */

function CursorConstellation({ mouseRef }: { mouseRef: React.RefObject<MousePos> }) {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const posRef = useRef(Array.from({ length: 3 }, () => ({ x: -100, y: -100 })));
  const c = useCinema();

  useEffect(() => {
    const springs = [0.14, 0.08, 0.04];
    const handler = () => {
      const mx = mouseRef.current?.x ?? 0;
      const my = mouseRef.current?.y ?? 0;
      posRef.current.forEach((pos, i) => {
        const target = i === 0 ? { x: mx, y: my } : posRef.current[i - 1];
        pos.x += (target.x - pos.x) * springs[i];
        pos.y += (target.y - pos.y) * springs[i];
        const dot = dotsRef.current[i];
        if (dot) dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      });
    };
    gsap.ticker.add(handler);
    return () => gsap.ticker.remove(handler);
  }, [mouseRef]);

  const sizes = [4, 2.5, 1.5];
  const colors = [GOLD, GOLD_LIGHT, c.constellationFade];

  return (
    <div className="fixed inset-0 z-[1001] pointer-events-none" aria-hidden="true">
      {sizes.map((size, i) => (
        <div key={i} ref={(el) => { if (el) dotsRef.current[i] = el; }}
          className="absolute top-0 left-0 rounded-full"
          style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: colors[i], willChange: "transform" }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIA ORB — gravitational pupil, breathing         */
/* ═══════════════════════════════════════════════════ */

function MaiaOrb({ mouseRef }: { mouseRef: React.RefObject<MousePos> }) {
  const orbRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  const c = useCinema();

  /* Gravitational pupil — follows cursor gently (rect cached, updated on resize) */
  useEffect(() => {
    let cachedRect = { cx: 0, cy: 0 };
    const updateRect = () => {
      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      cachedRect = { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
    };
    updateRect();
    window.addEventListener("resize", updateRect, { passive: true });
    const handler = () => {
      if (!pupilRef.current || !mouseRef.current) return;
      const dx = (mouseRef.current.x - cachedRect.cx) / window.innerWidth;
      const dy = (mouseRef.current.y - cachedRect.cy) / window.innerHeight;
      gsap.to(pupilRef.current, { x: dx * 6, y: dy * 4, duration: 1.2, ease: "power3.out", overwrite: "auto" });
    };
    gsap.ticker.add(handler);
    /* Refresh rect periodically to handle scroll/layout changes */
    const interval = setInterval(updateRect, 2000);
    return () => { gsap.ticker.remove(handler); window.removeEventListener("resize", updateRect); clearInterval(interval); };
  }, [mouseRef]);

  /* Orb breath — slow living scale pulse */
  useEffect(() => {
    if (!orbRef.current) return;
    const tween = gsap.to(orbRef.current, { scale: 1.03, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    return () => tween.kill();
  }, []);

  /* Subtle golden glow ring */
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!glowRef.current) return;
    const tween = gsap.to(glowRef.current, {
      opacity: 0.5, scale: 1.15, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut",
    });
    return () => tween.kill();
  }, []);

  return (
    <div ref={orbRef} data-maia-orb
      className="w-20 h-20 rounded-full flex items-center justify-center relative"
      style={{ background: c.surfaceAlt, border: `1.5px solid ${c.border}`, boxShadow: c.orbShadow }}>
      {/* Golden glow ring */}
      <div ref={glowRef} className="absolute inset-[-4px] rounded-full pointer-events-none"
        style={{ border: `1px solid ${GOLD}`, opacity: 0.2 }} />
      <div className="absolute inset-2 rounded-full" style={{ background: c.orbGrad }} />
      <div ref={pupilRef} className="relative flex items-center justify-center">
        <span className="text-[28px] select-none" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: GOLD }}>M</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIA VOICE AVATAR — small avatar with voice waves  */
/* ═══════════════════════════════════════════════════ */

function MaiaVoiceAvatar({ isActive }: { isActive?: boolean }) {
  const ringsRef = useRef<HTMLDivElement[]>([]);
  const c = useCinema();

  useEffect(() => {
    if (!isActive) return;
    const rings = ringsRef.current.filter(Boolean);
    const tweens = rings.map((ring, i) => {
      return gsap.fromTo(ring,
        { scale: 1, opacity: 0.5 },
        { scale: 1.8 + i * 0.3, opacity: 0, duration: 1.6 + i * 0.2, repeat: -1, delay: i * 0.4, ease: "power1.out" }
      );
    });
    return () => tweens.forEach((t) => t.kill());
  }, [isActive]);

  return (
    <div className="relative w-6 h-6 shrink-0 mt-0.5">
      {/* Voice wave rings — only visible when active */}
      {isActive && [0, 1, 2].map((i) => (
        <div key={i} ref={(el) => { if (el) ringsRef.current[i] = el; }}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${GOLD_LIGHT}`, opacity: 0 }} />
      ))}
      {/* Core avatar */}
      <div className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}>
        <span className="text-[10px]" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: GOLD }}>M</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TYPEWRITER TEXT — types then rests                 */
/* ═══════════════════════════════════════════════════ */

function TypewriterText({ text, delay = 0, className = "", style }: {
  text: string; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    const cursor = cursorRef.current;
    if (!el) return;
    const chars = el.querySelectorAll(".tw-c");
    gsap.set(chars, { opacity: 0, y: 6 });
    gsap.to(chars, { opacity: 1, y: 0, duration: 0.04, stagger: 0.045, delay, ease: "power2.out" });
    if (cursor) {
      const typeDur = delay + chars.length * 0.045 + 0.3;
      gsap.to(cursor, { opacity: 0, duration: 0.4, repeat: 6, yoyo: true, ease: "steps(1)", delay });
      gsap.to(cursor, { opacity: 0, duration: 0.6, delay: typeDur + 0.8, ease: "power2.out" });
    }
    return () => { gsap.killTweensOf(chars); if (cursor) gsap.killTweensOf(cursor); };
  }, [text, delay]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {text.split("").map((char, i) => (
        <span key={`${char}-${i}`} className="tw-c inline-block" style={{ opacity: 0 }}>{char === " " ? "\u00A0" : char}</span>
      ))}
      <span ref={cursorRef} className="inline-block w-[2px] h-[0.8em] ml-1 align-middle rounded-full" style={{ background: GOLD, opacity: 0 }} />
    </div>
  );
}

/* ═════════════════════���═════════════════════════════ */
/*  WORD-BY-WORD TEXT                                  */
/* ═══════════════════════════════════════════════════ */

function WordRevealText({ text, delay = 0, className = "", style }: {
  text: string; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const words = ref.current.querySelectorAll(".wr-w");
    gsap.set(words, { opacity: 0, y: 6 });
    gsap.to(words, { opacity: 1, y: 0, duration: 0.35, stagger: 0.09, delay, ease: "power2.out" });
    return () => gsap.killTweensOf(words);
  }, [text, delay]);
  return (
    <p ref={ref} className={className} style={style}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="wr-w inline-block" style={{ opacity: 0 }}>{word}{"\u00A0"}</span>
      ))}
    </p>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MODULE TILE — clean, no magnetic tilt              */
/* ═══════════════════════════════════════════════════ */

function ModuleTileCard({ tile, index, onClick }: {
  tile: ModuleTile; index: number; onClick: () => void;
}) {
  const Icon = tile.icon;
  const c = useCinema();

  const [hovered, setHovered] = useState(false);

  return (
    <motion.button data-maia-tile onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl cursor-pointer group relative w-full"
      style={{ background: c.surface, border: `1px solid ${hovered ? c.borderHover : c.border}`, boxShadow: hovered ? c.tileHoverShadow : "none", transition: "border-color 0.3s, box-shadow 0.3s" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springDefault, 0.7 + index * 0.05)}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-400" style={{ background: c.surfaceAlt }}>
        <Icon className="w-[18px] h-[18px] transition-colors duration-400" style={{ color: hovered ? GOLD : c.textSub }} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[12px] transition-colors duration-300" style={{ fontWeight: 500, color: c.textMuted }}>{tile.label}</span>
        <span className="text-[10px] transition-colors duration-300" style={{ fontWeight: 400, color: c.textFaint }}>{tile.desc}</span>
        <span className="text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full transition-colors duration-300"
          style={{ fontWeight: 500, color: hovered ? GOLD : c.textFaint, background: c.surfaceAlt }}>{tile.preview}</span>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  QUICK PROMPT PILL — clean hover                    */
/* ═══════════════════════════════════════════════════ */

function QuickPromptPill({ text, icon: Icon, index, onClick }: {
  text: string; icon: LucideIcon; index: number; onClick: () => void;
}) {
  const c = useCinema();
  return (
    <motion.button data-maia-prompt onClick={onClick}
      className="group flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] cursor-pointer transition-colors duration-300"
      style={{ fontWeight: 400, color: c.textFaint }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springDefault, 1.1 + index * 0.05)}
      whileTap={{ scale: 0.97 }}>
      <Icon className="w-3 h-3 transition-colors duration-300 shrink-0" style={{ color: c.textGhost }} />
      <span>{text}</span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INPUT BAR — focus halo + slash command palette     */
/* ═══════════════════════════════════════════════════ */

function FocusInputBar({ inputRef, value, onChange, onSend, onSlashCommand }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string; onChange: (v: string) => void; onSend: () => void;
  onSlashCommand?: (cmd: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [slashActive, setSlashActive] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);
  const c = useCinema();

  /* Filter slash commands based on input */
  const filteredCommands = useMemo(() => {
    if (!value.startsWith("/")) return [];
    const q = value.slice(1).toLowerCase();
    return slashCommands.filter((c) => c.cmd.slice(1).includes(q) || c.label.toLowerCase().includes(q));
  }, [value]);

  useEffect(() => {
    setSlashActive(value.startsWith("/") && filteredCommands.length > 0);
    setSlashIndex(0);
  }, [value, filteredCommands.length]);

  const selectCommand = useCallback((cmd: SlashCmd) => {
    if (onSlashCommand) {
      onSlashCommand(cmd.cmd);
    } else {
      onChange(cmd.cmd + " ");
    }
    setSlashActive(false);
  }, [onChange, onSlashCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (slashActive) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => Math.min(i + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectCommand(filteredCommands[slashIndex]); return; }
      if (e.key === "Escape") { e.preventDefault(); setSlashActive(false); return; }
    }
    if (e.key === "Enter" && value.trim() && !slashActive) onSend();
  }, [slashActive, filteredCommands, slashIndex, selectCommand, value, onSend]);

  return (
    <motion.div data-maia-input className="w-full max-w-[580px] mb-6 relative"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={withDelay(springDefault, 1.3)}>

      {/* Slash Command Palette */}
      <AnimatePresence>
        {slashActive && (
          <motion.div ref={paletteRef}
            className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden z-20"
            style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: c.paletteShadow }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}>
            <div className="px-3 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
              <span className="text-[10px] tracking-[0.08em] uppercase" style={{ fontWeight: 500, color: c.textFaint }}>Comandos</span>
            </div>
            {filteredCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button key={cmd.cmd}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors duration-150"
                  style={{ background: i === slashIndex ? c.surfaceAlt : "transparent" }}
                  onMouseEnter={() => setSlashIndex(i)}
                  onMouseDown={(e) => { e.preventDefault(); selectCommand(cmd); }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: i === slashIndex ? c.slashSelectedBg : c.surfaceAlt }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: i === slashIndex ? GOLD : c.textSub }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px]" style={{ fontWeight: 500, color: c.text }}>{cmd.cmd}</span>
                    <span className="text-[10px]" style={{ fontWeight: 400, color: c.textSub }}>{cmd.desc}</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl" style={{
        background: c.surface,
        border: `1.5px solid ${focused ? c.borderFocus : c.border}`,
        boxShadow: focused ? c.inputFocusShadow : c.inputShadow,
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}>
        <Sparkles className="w-[18px] h-[18px] shrink-0 transition-colors duration-500" style={{ color: focused ? GOLD : c.textFaint }} />
        <input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setTimeout(() => setSlashActive(false), 150); }}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte qualquer coisa..."
          className="flex-1 text-[14px] bg-transparent outline-none" style={{ fontWeight: 400, color: c.text }} />
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]" style={{ fontWeight: 500, color: c.textFaint, background: c.kbdBg, border: `1px solid ${c.kbdBorder}` }}>
            <Command className="w-2.5 h-2.5" />K
          </kbd>
          <span className="text-[9px]" style={{ color: c.textGhost }}>painel</span>
        </div>
        <button onClick={onSend} disabled={!value.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0"
          style={{ background: value.trim() ? c.sendBg : c.sendInactive, color: value.trim() ? c.sendText : c.textFaint, boxShadow: value.trim() ? c.sendShadow : "none" }}>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex justify-center mt-3">
        <span className="text-[10px]" style={{ fontWeight: 400, color: c.textFaint }}>Digite <span style={{ fontWeight: 600, color: c.textSub }}>/</span> para comandos rapidos</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  FILETE + SECTION DIVIDER                           */
/* ═══════════════════════════════════════════════════ */

function FileteDourado() {
  const ref = useRef<HTMLDivElement>(null);
  const c = useCinema();
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { scaleX: 0 }, { scaleX: 1, duration: 1.2, delay: 1.0, ease: "power3.inOut" });
    return () => { if (ref.current) gsap.killTweensOf(ref.current); };
  }, []);
  return (
    <div className="shrink-0 px-12 pb-4">
      <div ref={ref} className="h-px origin-center" style={{ background: `linear-gradient(90deg, ${c.bg} 0%, ${GOLD_LIGHT} 25%, ${GOLD} 50%, ${GOLD_LIGHT} 75%, ${c.bg} 100%)` }} />
    </div>
  );
}

function SectionDivider({ label, delay = 0 }: { label: string; delay?: number }) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const c = useCinema();
  useEffect(() => {
    [leftRef.current, rightRef.current].forEach((el) => { if (!el) return; gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.6, delay, ease: "power2.out" }); });
    return () => { [leftRef.current, rightRef.current].forEach((el) => { if (el) gsap.killTweensOf(el); }); };
  }, [delay]);
  return (
    <motion.div data-maia-divider className="flex items-center gap-3 max-w-[580px] w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={withDelay(springDefault, delay)}>
      <div ref={leftRef} className="h-px flex-1 origin-right" style={{ background: c.border }} />
      <span className="text-[10px] tracking-[0.1em] uppercase whitespace-nowrap" style={{ fontWeight: 500, color: c.textFaint }}>{label}</span>
      <div ref={rightRef} className="h-px flex-1 origin-left" style={{ background: c.border }} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INLINE MESSAGE BUBBLE                              */
/* ═══════════════════════════════════════════════════ */

function InlineKpiRow({ kpis }: { kpis: InlineKpi[] }) {
  const c = useCinema();
  return (
    <div className="grid gap-1.5 mt-2.5" style={{ gridTemplateColumns: kpis.length <= 4 ? `repeat(${kpis.length}, 1fr)` : `repeat(${Math.ceil(kpis.length / 2)}, 1fr)` }}>
      {kpis.map((kpi, i) => (
        <div key={i} className="flex flex-col gap-0.5 px-2.5 py-2 rounded-lg"
          style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}>
          <span className="text-[9px] uppercase tracking-[0.06em]" style={{ fontWeight: 500, color: c.textFaint }}>{kpi.label}</span>
          <span className="text-[13px] numeric" style={{ fontWeight: 600, color: kpi.accent ? c.kpiAccent : c.text }}>{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}

function InlineListBlock({ items }: { items: InlineListItem[] }) {
  const c = useCinema();
  const statusColors = { ok: c.statusOk, warning: c.statusWarn, danger: c.statusDanger };
  return (
    <div className="flex flex-col gap-1 mt-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded-md"
          style={{ background: c.surfaceAlt }}>
          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
            style={{ background: statusColors[item.status || "ok"] }} />
          <span className="text-[12px]" style={{ fontWeight: 400, color: c.text, lineHeight: 1.5 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function InlineMessageBubble({ msg, index }: { msg: InlineMsg; index: number }) {
  const isUser = msg.role === "user";
  const c = useCinema();
  const hasDataBlocks = !isUser && (msg.kpis || msg.listItems);
  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className={`flex items-start gap-2.5 ${hasDataBlocks ? "max-w-[520px]" : "max-w-[480px]"} ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser && <MaiaVoiceAvatar />}
        <div className={`rounded-2xl ${isUser ? "rounded-tr-md px-4 py-3" : "rounded-tl-md px-4 py-3"}`}
          style={{
            background: isUser ? c.userBubble : c.surface,
            color: isUser ? c.userText : c.text,
            border: isUser ? "none" : `1px solid ${c.border}`,
          }}>
          <p className="text-[13px]" style={{ fontWeight: 400, lineHeight: 1.65 }}>{msg.content}</p>
          {msg.kpis && msg.kpis.length > 0 && <InlineKpiRow kpis={msg.kpis} />}
          {msg.listItems && msg.listItems.length > 0 && <InlineListBlock items={msg.listItems} />}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════���══════════ */
/*  TYPING INDICATOR — with voice waves                */
/* ═══════════════════════════════════════════════════ */

function TypingIndicator() {
  const c = useCinema();
  return (
    <motion.div
      className="flex justify-start w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start gap-2.5">
        <MaiaVoiceAvatar isActive />
        <div className="px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1.5"
          style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: c.dotColor }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN: MaiaFocusChat                                */
/* ═══════════════════════════════════════════════════ */

export function MaiaFocusChat() {
  const { closeFocusMode } = useMaia();
  const navigate = useNavigate();
  const location = useLocation();
  const { getStats, leads: storeLeads, projects: storeProjects, parcelas: storeParcelas } = useAppStore();
  const currentModule = getModuleFromPath(location.pathname);

  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [inlineMessages, setInlineMessages] = useState<InlineMsg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isDark: darkMode, toggle: toggleDarkMode } = useDk();
  const inputRef = useRef<HTMLInputElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasInlineMessages = inlineMessages.length > 0;

  const mouseRef = useRef<MousePos>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  useEffect(() => {
    const h = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const timeGreeting = useMemo(() => getTimeGreeting(), []);
  const ambientGradient = useMemo(() => getAmbientGradient(), []);

  /* Esc key closes focus mode */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFocusMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeFocusMode]);

  /* Auto-focus input after emergence */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 1000);
    return () => clearTimeout(t);
  }, []);

  /* Auto-scroll + re-focus input after new message */
  useEffect(() => {
    if (inlineMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      /* Re-focus input after Maia responds */
      if (!isTyping) {
        setTimeout(() => chatInputRef.current?.focus(), 100);
      }
    }
  }, [inlineMessages.length, isTyping]);

  /* Gentle depth parallax on greeting + tiles (only when no inline messages) */
  useEffect(() => {
    if (hasInlineMessages) return;
    const handler = () => {
      if (!mouseRef.current || !homeRef.current) return;
      const nx = mouseRef.current.x / window.innerWidth - 0.5;
      const ny = mouseRef.current.y / window.innerHeight - 0.5;
      const g = homeRef.current.querySelector("[data-maia-greeting]") as HTMLElement | null;
      const t = homeRef.current.querySelector("[data-maia-tilegrid]") as HTMLElement | null;
      if (g) gsap.to(g, { x: -nx * 4, y: -ny * 3, duration: 1.8, ease: "power3.out", overwrite: "auto" });
      if (t) gsap.to(t, { x: nx * 2, y: ny * 1.5, duration: 1.8, ease: "power3.out", overwrite: "auto" });
    };
    gsap.ticker.add(handler);
    return () => gsap.ticker.remove(handler);
  }, [hasInlineMessages]);

  /* ── Navigation ── */
  const handleNavigateToProject = useCallback((projectId: string, tab: ProjetoTab) => {
    const proj = projetos.find((p) => p.id === projectId);
    closeFocusMode();
    setTimeout(() => { navigateToProject(navigate, { projectId, tab, from: "maia-focus", projetoNome: proj?.nome }); }, 300);
  }, [navigate, closeFocusMode]);

  const handleNavigateToModule = useCallback((module: "producao" | "financeiro" | "agenda" | "galeria") => {
    closeFocusMode();
    setTimeout(() => navigate(`/${module}`), 300);
  }, [navigate, closeFocusMode]);

  const handleBackToStudio = useCallback(() => closeFocusMode(), [closeFocusMode]);

  /* ── Send inline message — response appears in-place ── */
  const sendInlineMessage = useCallback((text: string) => {
    const userMsg: InlineMsg = { id: `u-${Date.now()}`, role: "user", content: text };
    setInlineMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    /* Route to slash response or general response */
    const isSlash = text.trim().startsWith("/");
    const delay = isSlash ? 800 + Math.random() * 400 : 600 + Math.random() * 600;

    const currentStats = getStats();
    const storeSnap: StoreSnapshot = { leads: storeLeads, projects: storeProjects, parcelas: storeParcelas };
    setTimeout(() => {
      const data = isSlash ? generateSlashResponseData(text.trim(), currentStats, storeSnap) : generateInlineResponse(text, currentStats);
      const maiaMsg: InlineMsg = { id: `m-${Date.now()}`, role: "maia", ...data };
      setInlineMessages((prev) => [...prev, maiaMsg]);
      setIsTyping(false);
    }, delay);
  }, [getStats, storeLeads, storeProjects, storeParcelas]);

  /* ── Clean transition to module chat — uniform fade, 2-pulse heartbeat ── */
  const transitionToChat = useCallback((moduleId?: string) => {
    if (moduleId) setSelectedModule(moduleId);
    const home = homeRef.current;
    if (!home) { setShowChat(true); return; }

    const tl = gsap.timeline();

    /* 2-pulse orb heartbeat */
    const orbEl = home.querySelector("[data-maia-orb]");
    if (orbEl) tl.to(orbEl, { scale: 1.1, duration: 0.12, yoyo: true, repeat: 3, ease: "power2.inOut" }, 0);

    /* Uniform fade up */
    const tiles = home.querySelectorAll("[data-maia-tile]");
    tiles.forEach((tile, i) => {
      tl.to(tile, { opacity: 0, y: -20, duration: 0.35, ease: "power2.in" }, 0.15 + i * 0.02);
    });

    const others = home.querySelectorAll("[data-maia-divider], [data-maia-prompt], [data-maia-input], [data-maia-thread]");
    others.forEach((el) => { tl.to(el, { opacity: 0, y: -12, duration: 0.3, ease: "power2.in" }, 0.1); });

    const greeting = home.querySelector("[data-maia-greeting]");
    if (greeting) tl.to(greeting, { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, 0.1);

    tl.call(() => setShowChat(true), [], 0.55);
  }, []);

  const handleModuleTileClick = useCallback((tile: ModuleTile) => { transitionToChat(tile.id); }, [transitionToChat]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    sendInlineMessage(prompt);
  }, [sendInlineMessage]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    sendInlineMessage(inputValue.trim());
  }, [inputValue, sendInlineMessage]);

  /* ── Handle slash command from palette ── */
  const handleSlashCommand = useCallback((cmd: string) => {
    sendInlineMessage(cmd);
  }, [sendInlineMessage]);

  /* ── Reset inline to go back to home ── */
  const handleClearInline = useCallback(() => {
    setInlineMessages([]);
    setIsTyping(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const maiaModule: MaiaModule = (selectedModule as MaiaModule) || currentModule;

  /* Cinema theme */
  const c = darkMode ? DARK : LIGHT;
  const darkAmbient = `radial-gradient(ellipse at 50% 50%, ${DARK.surface} 0%, ${DARK.bg} 60%)`;

  return (
    <CinemaCtx.Provider value={c}>
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col"
      style={{ background: c.bg, transition: "background 0.6s" }}
      initial={{ opacity: 0, scale: 1.01 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* Awaken pulse — single golden rift */}
      <AwakenPulse />

      {/* Cursor constellation — 3 dots */}
      <CursorConstellation mouseRef={mouseRef} />

      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: darkMode ? darkAmbient : ambientGradient, transition: "background 0.6s" }} aria-hidden="true" />

      {/* ═══ HEADER ═══ */}
      <motion.header className="flex items-center justify-between px-8 py-4 shrink-0 relative z-10"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ borderBottom: `1px solid ${c.border}`, transition: "border-color 0.6s" }}>
        <div className="flex items-center gap-4">
          <button onClick={handleBackToStudio} className="flex items-center gap-2 text-[12px] transition-colors cursor-pointer group" style={{ fontWeight: 500, color: c.textSub }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Voltar ao Studio</span>
          </button>
          <span className="w-px h-4" style={{ background: c.border }} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}>
              <span className="text-[11px]" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: GOLD }}>M</span>
            </div>
            <span className="text-[13px]" style={{ fontWeight: 500, color: c.textMuted }}>Maia</span>
            <span className="text-[10px]" style={{ fontWeight: 400, color: c.textFaint }}>Focus Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark Cinema toggle */}
          <button onClick={toggleDarkMode}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300"
            style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}
            title={darkMode ? "Modo claro" : "Cinema Mode"}>
            {darkMode
              ? <Sun className="w-3.5 h-3.5" style={{ color: GOLD }} />
              : <Moon className="w-3.5 h-3.5" style={{ color: c.textFaint }} />}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative w-1.5 h-1.5">
              <div className="absolute inset-0 rounded-full" style={{ background: c.statusOk }} />
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: c.statusOk }} />
            </div>
            <span className="text-[10px]" style={{ fontWeight: 400, color: c.textFaint }}>Online</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]" style={{ fontWeight: 500, color: c.textFaint, background: c.kbdBg, border: `1px solid ${c.kbdBorder}` }}>Esc</kbd>
        </div>
      </motion.header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div ref={homeRef} key="focus-home"
              className="flex-1 flex flex-col items-center px-6 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}>

              {/* ── Greeting + Orb (collapses when inline messages exist) ── */}
              <AnimatePresence>
                {!hasInlineMessages && (
                  <motion.div data-maia-greeting className="flex flex-col items-center gap-5 max-w-[560px] pt-8 pb-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }}
                    transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.45 }}>
                      <MaiaOrb mouseRef={mouseRef} />
                    </motion.div>
                    <div className="flex flex-col items-center gap-2.5">
                      <TypewriterText text={timeGreeting.greeting} delay={0.7}
                        className="text-[40px] tracking-[-0.03em] text-center"
                        style={{ fontWeight: 400, fontFamily: SERIF, color: c.text }} />
                      <WordRevealText text={timeGreeting.sub} delay={1.3}
                        className="text-[14px] text-center max-w-[420px]"
                        style={{ fontWeight: 400, lineHeight: 1.7, color: c.textSub }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Tiles (collapses when inline messages exist) ── */}
              <AnimatePresence>
                {!hasInlineMessages && (
                  <motion.div className="flex flex-col items-center gap-7 w-full pb-4"
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}>
                    <SectionDivider label="Explorar por area" delay={0.65} />
                    <div data-maia-tilegrid className="grid grid-cols-4 gap-2.5 max-w-[580px] w-full">
                      {moduleTiles.map((tile, i) => (
                        <ModuleTileCard key={tile.id} tile={tile} index={i} onClick={() => handleModuleTileClick(tile)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Quick prompts (only when no messages yet) ── */}
              <AnimatePresence>
                {!hasInlineMessages && (
                  <motion.div className="flex flex-col items-center gap-4 w-full pb-2"
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}>
                    <SectionDivider label="Sugestoes rapidas" delay={0.9} />
                    <div className="flex flex-wrap justify-center gap-2 max-w-[580px]">
                      {quickPrompts.map((prompt, i) => (
                        <QuickPromptPill key={i} text={prompt.text} icon={prompt.icon} index={i} onClick={() => handleQuickPrompt(prompt.text)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Inline conversation thread ── */}
              {hasInlineMessages && (
                <motion.div data-maia-thread className="flex flex-col w-full max-w-[580px] flex-1 pt-6 pb-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}>

                  {/* Morph avatar — orb transforms into thread header */}
                  <motion.div className="flex flex-col items-center gap-2 mb-5"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                      style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, boxShadow: c.morphShadow }}>
                      <div className="absolute inset-1 rounded-lg" style={{ background: c.orbGrad }} />
                      <span className="relative text-[18px] select-none" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: GOLD }}>M</span>
                    </div>
                    <span className="text-[10px]" style={{ fontWeight: 400, color: c.textFaint }}>Maia esta ouvindo</span>
                  </motion.div>

                  {/* Compact header with back button */}
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={handleClearInline}
                      className="flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer group" style={{ fontWeight: 500, color: c.textFaint }}>
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform duration-200" />
                      Nova conversa
                    </button>
                    <div className="h-px flex-1" style={{ background: c.border }} />
                  </div>

                  {/* Messages */}
                  <div className="flex flex-col gap-3 flex-1">
                    {inlineMessages.map((msg, i) => (
                      <InlineMessageBubble key={msg.id} msg={msg} index={i} />
                    ))}
                    <AnimatePresence>
                      {isTyping && <TypingIndicator />}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </motion.div>
              )}

              {/* ── Input bar (always visible, adapts position) ── */}
              <div className={`w-full flex justify-center shrink-0 ${hasInlineMessages ? "mt-auto sticky bottom-0 pb-4 pt-2" : ""}`}
                style={hasInlineMessages ? { background: c.bg } : undefined}>
                <FocusInputBar inputRef={hasInlineMessages ? chatInputRef : inputRef} value={inputValue} onChange={setInputValue} onSend={handleSendMessage} onSlashCommand={handleSlashCommand} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="focus-chat" className="flex-1 flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ ...springDefault, delay: 0.1 }}>
              <div className="flex items-center gap-3 px-8 py-3 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
                <button onClick={() => { setShowChat(false); setSelectedModule(null); setInlineMessages([]); }}
                  className="flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer group" style={{ fontWeight: 500, color: c.textSub }}>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  Inicio
                </button>
                <span className="w-px h-3.5" style={{ background: c.border }} />
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                  <span className="text-[12px]" style={{ fontWeight: 500, color: c.textMuted }}>{getMaiaModuleConfig(maiaModule).contextLabel}</span>
                </div>
              </div>
              <div className="flex-1 flex justify-center overflow-hidden">
                <div className="w-full max-w-[700px] flex flex-col overflow-hidden">
                  <MaiaAssistantView onNavigateToProject={handleNavigateToProject} onNavigateToModule={handleNavigateToModule} moduleContext={maiaModule} panelMode={false} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FileteDourado />
    </motion.div>
    </CinemaCtx.Provider>
  );
}