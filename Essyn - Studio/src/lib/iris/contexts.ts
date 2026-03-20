// ═══════════════════════════════════════════════
// Iris V2 — Context Detection System
// ═══════════════════════════════════════════════

import {
  Sparkles, Briefcase, Users, DollarSign,
  MessageCircle, BarChart3, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IrisContextKey =
  | "visao_geral"
  | "trabalho"
  | "clientes"
  | "financeiro"
  | "comunicacao"
  | "gestao"
  | "configuracao";

export interface IrisContextDef {
  key: IrisContextKey;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
  placeholder: string;
}

export const IRIS_CONTEXTS: Record<IrisContextKey, IrisContextDef> = {
  visao_geral: {
    key: "visao_geral",
    label: "Visão Geral",
    description: "Resumo completo do negócio",
    color: "var(--info)",
    icon: Sparkles,
    placeholder: "Pergunte qualquer coisa a Iris...",
  },
  trabalho: {
    key: "trabalho",
    label: "Trabalho",
    description: "Projetos, produção e agenda",
    color: "#6B5B8D",
    icon: Briefcase,
    placeholder: "Pergunte sobre projetos, produção ou agenda...",
  },
  clientes: {
    key: "clientes",
    label: "Clientes",
    description: "CRM, clientes, galeria e portal",
    color: "#2D7A4F",
    icon: Users,
    placeholder: "Pergunte sobre clientes, leads ou galerias...",
  },
  financeiro: {
    key: "financeiro",
    label: "Financeiro",
    description: "Finanças, contratos e pedidos",
    color: "#A58D66",
    icon: DollarSign,
    placeholder: "Pergunte sobre finanças, contratos ou pedidos...",
  },
  comunicacao: {
    key: "comunicacao",
    label: "Comunicação",
    description: "WhatsApp e email",
    color: "#22C55E",
    icon: MessageCircle,
    placeholder: "Pergunte sobre comunicação e mensagens...",
  },
  gestao: {
    key: "gestao",
    label: "Gestão",
    description: "Equipe, relatórios e armazenamento",
    color: "#2C444D",
    icon: BarChart3,
    placeholder: "Pergunte sobre equipe, relatórios ou armazenamento...",
  },
  configuracao: {
    key: "configuracao",
    label: "Configuração",
    description: "Configurações do sistema",
    color: "#7A8A8F",
    icon: Settings,
    placeholder: "Pergunte sobre configurações do sistema...",
  },
};

// Pathname → Context mapping
const ROUTE_MAP: [RegExp, IrisContextKey][] = [
  [/^\/projetos/, "trabalho"],
  [/^\/producao/, "trabalho"],
  [/^\/agenda/, "trabalho"],
  [/^\/crm/, "clientes"],
  [/^\/clientes/, "clientes"],
  [/^\/portal-cliente/, "clientes"],
  [/^\/galeria/, "clientes"],
  [/^\/financeiro/, "financeiro"],
  [/^\/pedidos/, "financeiro"],
  [/^\/contratos/, "financeiro"],
  [/^\/whatsapp/, "comunicacao"],
  [/^\/email-templates/, "comunicacao"],
  [/^\/time/, "gestao"],
  [/^\/relatorios/, "gestao"],
  [/^\/armazenamento/, "gestao"],
  [/^\/configuracoes/, "configuracao"],
  [/^\/integracoes/, "configuracao"],
  [/^\/automacoes/, "configuracao"],
];

export function detectContext(pathname: string): IrisContextKey {
  for (const [pattern, ctx] of ROUTE_MAP) {
    if (pattern.test(pathname)) return ctx;
  }
  return "visao_geral";
}

// Context-specific suggestions
export function getContextSuggestions(
  contextKey: IrisContextKey,
  pathname: string,
  ctx: {
    activeProjects: number;
    todayEventsCount: number;
    totalOverdue: number;
    totalPending: number;
    totalLeads: number;
    activeLeads: number;
    totalGalleries: number;
    overdueCount: number;
  }
): { label: string; query: string; accent?: boolean }[] {
  const hasData = ctx.activeProjects > 0 || ctx.totalPending > 0 || ctx.totalLeads > 0;

  // Empty studio — onboarding
  if (!hasData && contextKey === "visao_geral") {
    return [
      { label: "Criar meu primeiro projeto", query: "Quero criar um novo projeto", accent: true },
      { label: "O que a Iris pode fazer?", query: "O que você pode fazer por mim?" },
      { label: "Cadastrar um cliente", query: "Quero cadastrar um novo cliente" },
      { label: "Agendar um evento", query: "Quero agendar um evento na minha agenda" },
    ];
  }

  switch (contextKey) {
    case "visao_geral": {
      const s: { label: string; query: string; accent?: boolean }[] = [];
      if (ctx.todayEventsCount > 0) s.push({ label: "Minha agenda hoje", query: "Quais são meus eventos de hoje?" });
      if (ctx.totalOverdue > 0) s.push({ label: "Cobranças vencidas", query: "Quais cobranças estão vencidas?" });
      if (ctx.activeProjects > 0) s.push({ label: "Status dos projetos", query: "Qual o status dos meus projetos?" });
      s.push({ label: "Resumo do estúdio", query: "Me dê um resumo geral do estúdio" });
      s.push({ label: "Criar projeto", query: "Quero criar um novo projeto", accent: true });
      if (ctx.todayEventsCount === 0) s.push({ label: "Próximo evento", query: "Qual meu próximo evento?" });
      return s.slice(0, 4);
    }

    case "trabalho":
      return [
        { label: "Status dos projetos ativos", query: "Qual o status dos meus projetos ativos?" },
        { label: "Workflows atrasados", query: "Tem algum workflow atrasado?" },
        { label: "Agenda da semana", query: "Quais meus eventos dessa semana?" },
        { label: "Criar novo projeto", query: "Quero criar um novo projeto", accent: true },
      ];

    case "clientes":
      if (pathname.startsWith("/crm")) {
        return [
          { label: "Pipeline de leads", query: "Qual o status do meu pipeline de leads?" },
          { label: "Leads sem ação", query: "Quais leads estão sem ação definida?" },
          { label: "Leads de alto valor", query: "Quais são meus leads de maior valor?" },
          { label: "Cadastrar lead", query: "Quero cadastrar um novo lead", accent: true },
        ];
      }
      if (pathname.startsWith("/galeria")) {
        return [
          { label: "Galerias pendentes", query: "Quais galerias estão pendentes de entrega?" },
          { label: "Galerias sem fotos", query: "Tem galerias sem fotos?" },
          { label: "Status das selecoes", query: "Qual o status das selecoes de fotos?" },
          { label: "Criar galeria", query: "Quero criar uma nova galeria", accent: true },
        ];
      }
      if (pathname.startsWith("/portal-cliente")) {
        return [
          { label: "Como funciona o portal?", query: "Como funciona o portal do cliente?" },
          { label: "Configurar portal", query: "Como configurar meu portal do cliente?" },
          { label: "Personalizar aparencia", query: "Como personalizar a aparencia do portal?" },
          { label: "Estatisticas do portal", query: "Quais as estatisticas do meu portal?" },
        ];
      }
      return [
        { label: "Clientes mais rentaveis", query: "Quais sao meus clientes mais rentaveis?" },
        { label: "Clientes inativos", query: "Tenho clientes inativos?" },
        { label: "Historico por cliente", query: "Mostre o historico de projetos dos meus clientes" },
        { label: "Cadastrar cliente", query: "Quero cadastrar um novo cliente", accent: true },
      ];

    case "financeiro":
      if (pathname.startsWith("/contratos")) {
        return [
          { label: "Contratos pendentes", query: "Quais contratos estão pendentes de assinatura?" },
          { label: "Contratos expirando", query: "Tem contratos prestes a expirar?" },
          { label: "Contratos assinados", query: "Qual o histórico de contratos assinados?" },
          { label: "Criar contrato", query: "Quero criar um novo contrato", accent: true },
        ];
      }
      if (pathname.startsWith("/pedidos")) {
        return [
          { label: "Pedidos em andamento", query: "Quais pedidos estão em andamento?" },
          { label: "Pedidos pendentes", query: "Tem pedidos pendentes de pagamento?" },
          { label: "Produtos mais vendidos", query: "Quais sao meus produtos mais vendidos?" },
          { label: "Criar pedido", query: "Quero criar um novo pedido", accent: true },
        ];
      }
      return [
        { label: "Resumo financeiro", query: "Qual meu resumo financeiro do mes?" },
        { label: "Cobranças vencidas", query: "Quais cobranças estão vencidas?" },
        { label: "Receitas vs despesas", query: "Qual o comparativo de receitas vs despesas?" },
        { label: "Registrar pagamento", query: "Quero registrar um pagamento recebido", accent: true },
      ];

    case "comunicacao":
      return [
        { label: "Configurar WhatsApp", query: "Como configurar a integração com WhatsApp?" },
        { label: "Criar template email", query: "Como criar um template de email?" },
        { label: "Boas praticas", query: "Quais as melhores práticas de comunicação com clientes?" },
        { label: "Clientes sem contato", query: "Quais clientes estão sem contato recente?" },
      ];

    case "gestao":
      if (pathname.startsWith("/time")) {
        return [
          { label: "Quem está alocado?", query: "Quais membros da equipe estão mais alocados?" },
          { label: "Sem projeto ativo", query: "Tem membros sem projeto ativo?" },
          { label: "Produtividade", query: "Como esta a produtividade da equipe?" },
          { label: "Convidar membro", query: "Quero convidar um novo membro para a equipe", accent: true },
        ];
      }
      if (pathname.startsWith("/armazenamento")) {
        return [
          { label: "Uso de espaço", query: "Quanto espaço estou usando?" },
          { label: "Maior consumo", query: "Quais galerias consomem mais espaço?" },
          { label: "Liberar espaço", query: "Como posso liberar espaço?" },
          { label: "Fazer upgrade", query: "Quais os planos disponiveis para upgrade?", accent: true },
        ];
      }
      return [
        { label: "Resumo do mes", query: "Me de um resumo do mes" },
        { label: "Comparativo mensal", query: "Compare o mes atual com o anterior" },
        { label: "Projetos rentaveis", query: "Quais foram os projetos mais rentaveis?" },
        { label: "Exportar dados", query: "Como exportar meus dados?" },
      ];

    case "configuracao":
      return [
        { label: "Configurar perfil", query: "Como configurar o perfil do meu estúdio?" },
        { label: "Plano ideal", query: "Qual plano e ideal para mim?" },
        { label: "Permissoes equipe", query: "Como funcionam as permissoes da equipe?" },
        { label: "Configurar workflows", query: "Como configurar meus workflows de produção?" },
      ];
  }
}
