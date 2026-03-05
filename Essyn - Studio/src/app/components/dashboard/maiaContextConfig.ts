/**
 * maiaContextConfig.ts — Per-module context configuration for Maia AI assistant
 *
 * Each module has its own:
 *   - greeting (editorial welcome message)
 *   - subtitle (contextual role description)
 *   - suggested prompts (6 per module, grid layout)
 *   - slash commands (module-specific + global)
 *   - placeholder text for input
 */

import {
  LayoutDashboard,
  Clapperboard,
  CalendarDays,
  Images,
  FolderKanban,
  DollarSign,
  Users,
  Settings,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
  Package,
  Star,
  Target,
  Receipt,
  ArrowDownUp,
  Layers,
  Filter,
  Send,
  UserPlus,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Camera,
  Share2,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

export type MaiaModule =
  | "dashboard"
  | "projetos"
  | "financeiro"
  | "agenda"
  | "producao"
  | "galeria"
  | "crm"
  | "configuracoes";

export interface MaiaSuggestedPrompt {
  icon: LucideIcon;
  label: string;
  category: "financeiro" | "producao" | "agenda" | "geral" | "comando" | "crm" | "galeria" | "config" | "projetos";
}

export interface MaiaSlashCommand {
  cmd: string;
  desc: string;
  usage: string;
}

export interface MaiaModuleConfig {
  /** Editorial greeting shown in empty state */
  greeting: string;
  /** Role subtitle below greeting */
  subtitle: string;
  /** Input placeholder */
  placeholder: string;
  /** 6 suggested prompts for the module */
  suggestedPrompts: MaiaSuggestedPrompt[];
  /** Module-specific slash commands (added to globals) */
  slashCommands: MaiaSlashCommand[];
  /** Contextual label for the Maia header */
  contextLabel: string;
}

/* ═══════════════════════════════════════════════════ */
/*  GLOBAL SLASH COMMANDS (available everywhere)       */
/* ═══════════════════════════════════════════════════ */

export const globalSlashCommands: MaiaSlashCommand[] = [
  { cmd: "/briefing", desc: "Gera briefing pre-evento completo", usage: "/briefing [nome do projeto]" },
  { cmd: "/forecast", desc: "Previsao de faturamento 3 meses", usage: "/forecast" },
  { cmd: "/relatorio", desc: "Relatorio completo do estudio", usage: "/relatorio" },
];

/* ═══════════════════════════════════════════════════ */
/*  MODULE CONFIGS                                     */
/* ═══════════════════════════════════════════════════ */

const moduleConfigs: Record<MaiaModule, MaiaModuleConfig> = {
  /* ── Dashboard ── */
  dashboard: {
    greeting: "Como posso ajudar?",
    subtitle: "Visao geral do estudio — financeiro, producao, agenda e projetos reunidos.",
    placeholder: "Pergunte algo ou digite / para comandos...",
    contextLabel: "Assistente geral",
    suggestedPrompts: [
      { icon: DollarSign, label: "Quanto tenho a receber este mes?", category: "financeiro" },
      { icon: Layers, label: "Relatorio completo de producao", category: "producao" },
      { icon: CalendarDays, label: "Quais meus compromissos de hoje?", category: "agenda" },
      { icon: BarChart3, label: "Resumo geral do estudio", category: "geral" },
      { icon: FileText, label: "/briefing Casamento Oliveira", category: "comando" },
      { icon: TrendingUp, label: "/forecast", category: "comando" },
    ],
    slashCommands: [
      { cmd: "/cobrar", desc: "Lista todas as cobrancas pendentes", usage: "/cobrar" },
      { cmd: "/equipe", desc: "Distribuicao de carga da equipe", usage: "/equipe" },
      { cmd: "/entregas", desc: "Proximas entregas e prazos", usage: "/entregas" },
    ],
  },

  /* ── Projetos ── */
  projetos: {
    greeting: "Seus projetos",
    subtitle: "Analiso contratos, status, prazos e entregas de cada projeto em detalhe.",
    placeholder: "Pergunte sobre um projeto ou cliente...",
    contextLabel: "Especialista em projetos",
    suggestedPrompts: [
      { icon: FolderKanban, label: "Quais projetos estao atrasados?", category: "projetos" },
      { icon: AlertTriangle, label: "Projetos com parcelas vencidas", category: "financeiro" },
      { icon: Clock, label: "Proximas entregas pendentes", category: "projetos" },
      { icon: Target, label: "Projetos confirmados sem producao iniciada", category: "projetos" },
      { icon: FileText, label: "/briefing Casamento Oliveira", category: "comando" },
      { icon: Users, label: "Distribuicao de projetos por equipe", category: "geral" },
    ],
    slashCommands: [
      { cmd: "/status", desc: "Resume status de todos os projetos", usage: "/status" },
      { cmd: "/entregas", desc: "Proximas entregas e prazos", usage: "/entregas" },
      { cmd: "/equipe", desc: "Distribuicao por profissional", usage: "/equipe" },
    ],
  },

  /* ── Financeiro ── */
  financeiro: {
    greeting: "Financeiro do estudio",
    subtitle: "Analiso receitas, cobrancas, parcelas vencidas e projecao de faturamento.",
    placeholder: "Pergunte sobre valores, cobrancas ou previsoes...",
    contextLabel: "Especialista financeiro",
    suggestedPrompts: [
      { icon: DollarSign, label: "Quanto tenho a receber este mes?", category: "financeiro" },
      { icon: AlertTriangle, label: "Listar todas as parcelas vencidas", category: "financeiro" },
      { icon: TrendingUp, label: "/forecast", category: "comando" },
      { icon: Receipt, label: "Quais projetos ja estao 100% pagos?", category: "financeiro" },
      { icon: Send, label: "/cobrar", category: "comando" },
      { icon: ArrowDownUp, label: "Comparar faturamento mes a mes", category: "financeiro" },
    ],
    slashCommands: [
      { cmd: "/cobrar", desc: "Lista cobrancas pendentes com acao rapida", usage: "/cobrar" },
      { cmd: "/inadimplentes", desc: "Clientes com mais parcelas vencidas", usage: "/inadimplentes" },
      { cmd: "/fluxo", desc: "Fluxo de caixa previsto", usage: "/fluxo" },
    ],
  },

  /* ── Agenda ── */
  agenda: {
    greeting: "Sua agenda",
    subtitle: "Compromissos, eventos, reunioes e lembretes do dia e da semana.",
    placeholder: "Pergunte sobre compromissos, horarios ou eventos...",
    contextLabel: "Especialista em agenda",
    suggestedPrompts: [
      { icon: CalendarDays, label: "O que tenho pra hoje?", category: "agenda" },
      { icon: Clock, label: "Quais eventos desta semana?", category: "agenda" },
      { icon: Camera, label: "Proximos eventos para fotografar", category: "agenda" },
      { icon: CheckCircle2, label: "Eventos ja confirmados no mes", category: "agenda" },
      { icon: FileText, label: "/briefing proximo evento", category: "comando" },
      { icon: AlertTriangle, label: "Conflitos de horario na agenda", category: "agenda" },
    ],
    slashCommands: [
      { cmd: "/hoje", desc: "Compromissos detalhados de hoje", usage: "/hoje" },
      { cmd: "/semana", desc: "Visao da semana completa", usage: "/semana" },
      { cmd: "/preparar", desc: "Checklist para proximo evento", usage: "/preparar [evento]" },
    ],
  },

  /* ── Produção ── */
  producao: {
    greeting: "Producao do estudio",
    subtitle: "Fila de trabalho, etapas atrasadas, carga da equipe e entregas pendentes.",
    placeholder: "Pergunte sobre etapas, prazos ou equipe...",
    contextLabel: "Especialista em producao",
    suggestedPrompts: [
      { icon: Clapperboard, label: "Quais trabalhos estao atrasados?", category: "producao" },
      { icon: Clock, label: "Proximas entregas da semana", category: "producao" },
      { icon: Users, label: "/equipe", category: "comando" },
      { icon: Filter, label: "Trabalhos aguardando aprovacao do cliente", category: "producao" },
      { icon: Package, label: "Etapas com gargalo na fila", category: "producao" },
      { icon: BarChart3, label: "Relatorio de produtividade por editor", category: "producao" },
    ],
    slashCommands: [
      { cmd: "/equipe", desc: "Carga de trabalho por profissional", usage: "/equipe" },
      { cmd: "/entregas", desc: "Proximas entregas e prazos", usage: "/entregas" },
      { cmd: "/gargalo", desc: "Identifica etapas travadas", usage: "/gargalo" },
    ],
  },

  /* ── Galeria ── */
  galeria: {
    greeting: "Galeria & entregas",
    subtitle: "Colecoes, seleções de clientes, downloads e entregas digitais.",
    placeholder: "Pergunte sobre galerias, selecoes ou entregas...",
    contextLabel: "Especialista em galeria",
    suggestedPrompts: [
      { icon: Images, label: "Quais galerias aguardam selecao do cliente?", category: "galeria" },
      { icon: Share2, label: "Galerias enviadas mas sem acesso", category: "galeria" },
      { icon: Clock, label: "Entregas pendentes de download", category: "galeria" },
      { icon: Star, label: "Galerias com mais fotos favoritadas", category: "galeria" },
      { icon: Package, label: "Colecoes prontas para entrega final", category: "galeria" },
      { icon: Camera, label: "Quantidade de fotos por projeto", category: "galeria" },
    ],
    slashCommands: [
      { cmd: "/pendentes", desc: "Galerias pendentes de acao", usage: "/pendentes" },
      { cmd: "/selecao", desc: "Status das selecoes de clientes", usage: "/selecao" },
      { cmd: "/entregas", desc: "Proximas entregas digitais", usage: "/entregas" },
    ],
  },

  /* ── CRM ── */
  crm: {
    greeting: "CRM & relacionamentos",
    subtitle: "Leads, pipeline de vendas, follow-ups e relacionamento com clientes.",
    placeholder: "Pergunte sobre leads, clientes ou pipeline...",
    contextLabel: "Especialista em CRM",
    suggestedPrompts: [
      { icon: Users, label: "Quantos leads abertos tenho?", category: "crm" },
      { icon: Target, label: "Leads quentes sem follow-up", category: "crm" },
      { icon: DollarSign, label: "Valor total do pipeline ativo", category: "crm" },
      { icon: Heart, label: "Clientes que indicaram novos leads", category: "crm" },
      { icon: Clock, label: "Propostas enviadas sem resposta", category: "crm" },
      { icon: UserPlus, label: "Novos leads da semana", category: "crm" },
    ],
    slashCommands: [
      { cmd: "/pipeline", desc: "Status do funil de vendas", usage: "/pipeline" },
      { cmd: "/followup", desc: "Lista follow-ups pendentes", usage: "/followup" },
      { cmd: "/conversao", desc: "Taxa de conversao por origem", usage: "/conversao" },
    ],
  },

  /* ── Configurações ── */
  configuracoes: {
    greeting: "Configuracoes",
    subtitle: "Ajustes do estudio, integrações, equipe e preferencias do sistema.",
    placeholder: "Pergunte sobre configuracoes ou integrações...",
    contextLabel: "Assistente de configuracao",
    suggestedPrompts: [
      { icon: Settings, label: "Como configurar integracao com Google Calendar?", category: "config" },
      { icon: Users, label: "Adicionar novo membro a equipe", category: "config" },
      { icon: Palette, label: "Personalizar cores da galeria do cliente", category: "config" },
      { icon: DollarSign, label: "Configurar formas de pagamento", category: "config" },
      { icon: Package, label: "Criar novo pacote de servico", category: "config" },
      { icon: Star, label: "Ativar marca d'agua nas galerias", category: "config" },
    ],
    slashCommands: [
      { cmd: "/integracoes", desc: "Status das integracoes ativas", usage: "/integracoes" },
      { cmd: "/plano", desc: "Detalhes do plano atual", usage: "/plano" },
    ],
  },
};

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                            */
/* ═══════════════════════════════════════════════════ */

/**
 * Derive MaiaModule from current pathname.
 */
export function getModuleFromPath(pathname: string): MaiaModule {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase() || "";
  const map: Record<string, MaiaModule> = {
    dashboard: "dashboard",
    projetos: "projetos",
    financeiro: "financeiro",
    agenda: "agenda",
    producao: "producao",
    galeria: "galeria",
    crm: "crm",
    configuracoes: "configuracoes",
  };
  return map[segment] || "dashboard";
}

/**
 * Get full config for a module, including global slash commands.
 */
export function getMaiaModuleConfig(module: MaiaModule): MaiaModuleConfig {
  return moduleConfigs[module];
}

/**
 * Get all slash commands: global + module-specific, deduplicated.
 */
export function getMaiaSlashCommands(module: MaiaModule): MaiaSlashCommand[] {
  const moduleConfig = moduleConfigs[module];
  const all = [...globalSlashCommands, ...moduleConfig.slashCommands];
  // Deduplicate by cmd
  const seen = new Set<string>();
  return all.filter((c) => {
    if (seen.has(c.cmd)) return false;
    seen.add(c.cmd);
    return true;
  });
}
