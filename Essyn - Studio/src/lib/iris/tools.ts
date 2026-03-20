import type Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════
// Tool Definitions — what Iris can do
// ═══════════════════════════════════════════════

export const IRIS_TOOLS: Anthropic.Tool[] = [
  // ── Read tools ──
  {
    name: "get_resumo_dia",
    description:
      "Retorna resumo do dia do estúdio: eventos de hoje, cobranças vencidas, projetos ativos, leads. Use quando o usuário perguntar 'como tá meu dia', 'resumo', 'overview'.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_agenda",
    description:
      "Lista eventos da agenda. Pode filtrar por hoje, semana ou próximos. Use quando o usuário perguntar sobre agenda, eventos, compromissos.",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo: {
          type: "string",
          enum: ["hoje", "semana", "proximos"],
          description: "Período dos eventos. Default: hoje",
        },
      },
      required: [],
    },
  },
  {
    name: "get_financeiro",
    description:
      "Retorna resumo financeiro: total recebido, pendente, vencido, parcelas. Use quando o usuário perguntar sobre dinheiro, faturamento, cobranças, parcelas.",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo: {
          type: "string",
          enum: ["mes", "semana", "ano"],
          description: "Período do financeiro. Default: mes",
        },
      },
      required: [],
    },
  },
  {
    name: "get_projetos",
    description:
      "Lista projetos do estúdio com status e detalhes. Use quando o usuário perguntar sobre projetos, ensaios, casamentos, status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["todos", "ativos", "producao", "entregues"],
          description: "Filtro de status. Default: ativos",
        },
      },
      required: [],
    },
  },
  {
    name: "get_clientes",
    description:
      "Lista clientes do estúdio. Use quando o usuário perguntar sobre clientes, buscar cliente por nome.",
    input_schema: {
      type: "object" as const,
      properties: {
        busca: {
          type: "string",
          description: "Nome do cliente para buscar (opcional)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_leads",
    description:
      "Lista leads do CRM com estágios do funil. Use quando perguntar sobre leads, funil, CRM, pipeline.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_galerias",
    description:
      "Lista galerias de fotos com status e contagem. Use quando perguntar sobre galerias, fotos, entregas.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  // ── New V2 tools ──
  {
    name: "get_contratos",
    description:
      "Lista contratos do estúdio com status e detalhes. Use quando perguntar sobre contratos, assinaturas, documentos.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["todos", "rascunho", "enviado", "assinado", "expirado"],
          description: "Filtro de status. Default: todos",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pedidos",
    description:
      "Lista pedidos de produtos fisicos. Use quando perguntar sobre pedidos, entregas de produtos, albums.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["todos", "pendente", "producao", "enviado", "entregue"],
          description: "Filtro de status. Default: todos",
        },
      },
      required: [],
    },
  },
  {
    name: "get_equipe",
    description:
      "Lista membros da equipe do estúdio com roles. Use quando perguntar sobre equipe, time, fotógrafos.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_producao",
    description:
      "Lista workflows de produção ativos com deadlines e progresso. Use quando perguntar sobre produção, edição, entregas, workflows.",
    input_schema: {
      type: "object" as const,
      properties: {
        filtro: {
          type: "string",
          enum: ["todos", "atrasados", "em_andamento", "pendentes"],
          description: "Filtro de workflows. Default: todos",
        },
      },
      required: [],
    },
  },
  {
    name: "criar_lead",
    description:
      "Cria um novo lead no CRM. Use quando o usuario pedir para cadastrar lead, novo contato comercial.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: {
          type: "string",
          description: "Nome do lead",
        },
        email: {
          type: "string",
          description: "Email do lead (opcional)",
        },
        telefone: {
          type: "string",
          description: "Telefone do lead (opcional)",
        },
        tipo_evento: {
          type: "string",
          enum: ["casamento", "ensaio", "corporativo", "aniversario", "formatura", "batizado", "outro"],
          description: "Tipo de evento (opcional)",
        },
        valor_estimado: {
          type: "number",
          description: "Valor estimado do servico (opcional)",
        },
      },
      required: ["nome"],
      additionalProperties: false,
    },
  },
  {
    name: "registrar_pagamento",
    description:
      "Marca uma parcela/cobrança como paga. Use quando o usuário disser que recebeu pagamento, confirmar recebimento.",
    input_schema: {
      type: "object" as const,
      properties: {
        descricao_parcela: {
          type: "string",
          description: "Descricao ou nome da parcela para identificar (busca por ilike)",
        },
      },
      required: ["descricao_parcela"],
      additionalProperties: false,
    },
  },
  // ── Write tools ──
  {
    name: "criar_projeto",
    description:
      "Cria um projeto completo com galeria, parcelas financeiras, evento no calendário e workflow de produção. Aceita nome, tipo, data, valor, local, parcelas e prazo de entrega.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: {
          type: "string",
          description: "Nome do projeto (ex: 'Casamento Ana e Pedro')",
        },
        tipo: {
          type: "string",
          enum: ["casamento", "ensaio", "aniversario", "corporativo", "batizado", "outro"],
          description: "Tipo do evento",
        },
        data_evento: {
          type: "string",
          description: "Data do evento em formato YYYY-MM-DD (opcional)",
        },
        cliente_nome: {
          type: "string",
          description: "Nome do cliente associado (opcional, busca existente ou cria)",
        },
        valor: {
          type: "number",
          description: "Valor total do projeto em reais (opcional)",
        },
        hora_evento: {
          type: "string",
          description: "Horário do evento no formato HH:MM (opcional, ex: '15:00')",
        },
        local: {
          type: "string",
          description: "Local/endereço do evento (opcional)",
        },
        metodo_pagamento: {
          type: "string",
          description: "Método de pagamento (ex: 'pix', 'cartao', 'boleto') (opcional)",
        },
        parcelas: {
          type: "number",
          description: "Número de parcelas para dividir o valor (opcional, default: 1 se valor informado)",
        },
        prazo_entrega_dias: {
          type: "number",
          description: "Prazo de entrega em dias úteis após o evento (opcional)",
        },
      },
      required: ["nome", "tipo"],
      additionalProperties: false,
    },
  },
  {
    name: "criar_evento_agenda",
    description:
      "Cria um novo evento na agenda. Use quando o usuário pedir para agendar, marcar reunião, adicionar compromisso.",
    input_schema: {
      type: "object" as const,
      properties: {
        titulo: {
          type: "string",
          description: "Título do evento",
        },
        data: {
          type: "string",
          description: "Data do evento em formato YYYY-MM-DD",
        },
        horario: {
          type: "string",
          description: "Horário no formato HH:MM (ex: '14:00')",
        },
        local: {
          type: "string",
          description: "Local do evento (opcional)",
        },
        duracao_horas: {
          type: "number",
          description: "Duração do evento em horas (opcional, default: 1)",
        },
      },
      required: ["titulo", "data", "horario"],
      additionalProperties: false,
    },
  },
  {
    name: "criar_cliente",
    description:
      "Cria um novo cliente. Use quando o usuário pedir para cadastrar, adicionar cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: {
          type: "string",
          description: "Nome completo do cliente",
        },
        email: {
          type: "string",
          description: "Email do cliente (opcional)",
        },
        telefone: {
          type: "string",
          description: "Telefone do cliente (opcional)",
        },
      },
      required: ["nome"],
      additionalProperties: false,
    },
  },
  // ── Extended write tools (V3) ──
  {
    name: "atualizar_cliente",
    description:
      "Atualiza dados de um cliente existente (email, telefone, cidade, estado, notas, status). Use quando o fotógrafo pedir para alterar dados de um cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_cliente: { type: "string", description: "Nome do cliente para localizar" },
        email: { type: "string", description: "Novo email (opcional)" },
        telefone: { type: "string", description: "Novo telefone (opcional)" },
        cidade: { type: "string", description: "Nova cidade (opcional)" },
        estado: { type: "string", description: "Novo estado UF (opcional)" },
        notas: { type: "string", description: "Novas observações (opcional)" },
        status: { type: "string", enum: ["ativo", "inativo", "vip"], description: "Novo status (opcional)" },
      },
      required: ["nome_cliente"],
      additionalProperties: false,
    },
  },
  {
    name: "atualizar_projeto",
    description:
      "Atualiza status ou dados de um projeto. Use quando o fotógrafo pedir para mudar status, marcar como entregue, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_projeto: { type: "string", description: "Nome do projeto para localizar" },
        status: { type: "string", enum: ["rascunho", "confirmado", "producao", "edicao", "entregue", "cancelado"], description: "Novo status (opcional)" },
        production_phase: { type: "string", enum: ["agendado", "captacao", "selecao", "edicao", "revisao", "entrega", "concluido"], description: "Nova fase de produção (opcional)" },
        notas: { type: "string", description: "Novas notas do projeto (opcional)" },
      },
      required: ["nome_projeto"],
      additionalProperties: false,
    },
  },
  {
    name: "enviar_acesso_portal",
    description:
      "Envia link de acesso ao portal para um cliente por email. Use quando o fotógrafo pedir para enviar portal, dar acesso ao cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_cliente: { type: "string", description: "Nome do cliente para enviar acesso" },
      },
      required: ["nome_cliente"],
      additionalProperties: false,
    },
  },
  {
    name: "criar_parcela",
    description:
      "Cria uma nova parcela/cobrança (receita ou despesa). Use quando o fotógrafo pedir para registrar valor a receber ou despesa.",
    input_schema: {
      type: "object" as const,
      properties: {
        descricao: { type: "string", description: "Descrição da parcela" },
        valor: { type: "number", description: "Valor em reais" },
        tipo: { type: "string", enum: ["receita", "despesa"], description: "Tipo: receita ou despesa" },
        vencimento: { type: "string", description: "Data de vencimento YYYY-MM-DD" },
        nome_projeto: { type: "string", description: "Nome do projeto vinculado (opcional)" },
        nome_cliente: { type: "string", description: "Nome do cliente vinculado (opcional)" },
      },
      required: ["descricao", "valor", "tipo", "vencimento"],
      additionalProperties: false,
    },
  },
  {
    name: "avancar_workflow",
    description:
      "Avança o status de um workflow/etapa de produção. Use quando pedir para avançar etapa, marcar como concluído, iniciar edição, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_projeto: { type: "string", description: "Nome do projeto do workflow" },
        nome_etapa: { type: "string", description: "Nome da etapa a avançar (opcional, avança a primeira pendente)" },
        novo_status: { type: "string", enum: ["pendente", "em_andamento", "concluido"], description: "Novo status. Default: próximo status lógico" },
      },
      required: ["nome_projeto"],
      additionalProperties: false,
    },
  },
  {
    name: "criar_contrato",
    description:
      "Cria um novo contrato. Use quando o fotógrafo pedir para criar contrato, gerar documento.",
    input_schema: {
      type: "object" as const,
      properties: {
        titulo: { type: "string", description: "Título do contrato" },
        valor: { type: "number", description: "Valor do contrato" },
        nome_cliente: { type: "string", description: "Nome do cliente vinculado (opcional)" },
        nome_projeto: { type: "string", description: "Nome do projeto vinculado (opcional)" },
      },
      required: ["titulo", "valor"],
      additionalProperties: false,
    },
  },
  {
    name: "alterar_senha",
    description:
      "Altera a senha do fotógrafo na plataforma. Use quando pedir para trocar senha, mudar senha, resetar senha. SEMPRE confirme antes de executar.",
    input_schema: {
      type: "object" as const,
      properties: {
        nova_senha: { type: "string", description: "Nova senha (mínimo 8 caracteres, 1 maiúscula, 1 número)" },
      },
      required: ["nova_senha"],
      additionalProperties: false,
    },
  },
  {
    name: "enviar_portal_em_massa",
    description:
      "Envia acesso ao portal para todos os clientes que têm email mas ainda não receberam acesso. Use quando o fotógrafo pedir para enviar portal para todos, enviar em massa, etc.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "exportar_csv",
    description:
      "Gera link para download de dados em CSV. Tipos disponiveis: clientes, financeiro, projetos, leads. Use quando pedir para exportar, baixar planilha, gerar CSV.",
    input_schema: {
      type: "object" as const,
      properties: {
        tipo: { type: "string", enum: ["clientes", "financeiro", "projetos", "leads"], description: "Tipo de dados para exportar" },
      },
      required: ["tipo"],
      additionalProperties: false,
    },
  },
  // ── Soft-delete tools ──
  {
    name: "deletar_item",
    description: "Move um item para a lixeira (soft delete). Pode deletar projetos, clientes, leads, galerias, contratos, eventos ou parcelas. SEMPRE confirme com o usuario antes de executar.",
    input_schema: {
      type: "object" as const,
      properties: {
        tipo: { type: "string", enum: ["projeto", "cliente", "lead", "galeria", "contrato", "evento", "parcela"], description: "Tipo do item" },
        nome: { type: "string", description: "Nome do item para localizar" },
      },
      required: ["tipo", "nome"],
      additionalProperties: false,
    },
  },
  {
    name: "restaurar_item",
    description: "Restaura um item da lixeira. Use quando o usuario pedir para desfazer exclusao ou restaurar item.",
    input_schema: {
      type: "object" as const,
      properties: {
        tipo: { type: "string", enum: ["projeto", "cliente", "lead", "galeria", "contrato", "evento", "parcela"], description: "Tipo do item" },
        nome: { type: "string", description: "Nome do item para localizar" },
      },
      required: ["tipo", "nome"],
      additionalProperties: false,
    },
  },
  {
    name: "duplicar_projeto",
    description: "Duplica um projeto existente como template para um novo. Copia tipo de evento, pacote, workflows e configurações. Use quando o fotógrafo pedir para duplicar, copiar, usar como template.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_projeto_original: { type: "string", description: "Nome do projeto a ser duplicado" },
        novo_nome: { type: "string", description: "Nome do novo projeto" },
        nome_cliente: { type: "string", description: "Nome do cliente para o novo projeto (opcional)" },
        data_evento: { type: "string", description: "Data do novo evento YYYY-MM-DD (opcional)" },
      },
      required: ["nome_projeto_original", "novo_nome"],
      additionalProperties: false,
    },
  },
  {
    name: "atualizar_lead",
    description:
      "Atualiza o estágio ou dados de um lead no CRM. Use quando pedir para avançar lead, mover no funil, atualizar status de lead, adicionar nota ao lead.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_lead: { type: "string", description: "Nome do lead para localizar" },
        estagio: {
          type: "string",
          enum: ["novo", "contato", "reuniao", "proposta", "negociacao", "ganho", "perdido"],
          description: "Novo estágio no funil (opcional)",
        },
        notas: { type: "string", description: "Notas ou observações sobre o lead (opcional)" },
        valor_estimado: { type: "number", description: "Valor estimado do contrato (opcional)" },
      },
      required: ["nome_lead"],
      additionalProperties: false,
    },
  },
  {
    name: "criar_nota",
    description:
      "Adiciona uma nota ou observação a um cliente ou projeto. Use quando pedir para anotar, registrar observação, guardar informação sobre cliente ou projeto.",
    input_schema: {
      type: "object" as const,
      properties: {
        tipo: { type: "string", enum: ["cliente", "projeto"], description: "Onde salvar a nota" },
        nome: { type: "string", description: "Nome do cliente ou projeto" },
        nota: { type: "string", description: "Conteúdo da nota/observação" },
      },
      required: ["tipo", "nome", "nota"],
      additionalProperties: false,
    },
  },
  {
    name: "buscar",
    description:
      "Busca entidades pelo nome em projetos, clientes, leads, galerias ou contratos. Use quando o fotógrafo mencionar um nome específico e quiser encontrar informações sobre ele.",
    input_schema: {
      type: "object" as const,
      properties: {
        termo: { type: "string", description: "Nome ou termo a buscar" },
        tipo: {
          type: "string",
          enum: ["todos", "projetos", "clientes", "leads", "galerias", "contratos"],
          description: "Tipo de entidade a buscar. Default: todos",
        },
      },
      required: ["termo"],
      additionalProperties: false,
    },
  },
  {
    name: "get_metricas",
    description:
      "Retorna métricas de desempenho do negócio: faturamento dos últimos meses, taxa de conversão de leads, projetos por mês, crescimento. Use quando pedir análise de desempenho, tendências, crescimento, métricas.",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo: {
          type: "string",
          enum: ["3meses", "6meses", "12meses"],
          description: "Período da análise. Default: 6meses",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "atualizar_galeria",
    description:
      "Atualiza status ou configurações de uma galeria. Use quando pedir para publicar galeria, tornar privada, definir senha, alterar status.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_galeria: { type: "string", description: "Nome da galeria para localizar" },
        status: {
          type: "string",
          enum: ["rascunho", "publicada", "privada", "expirada"],
          description: "Novo status da galeria (opcional)",
        },
        senha: { type: "string", description: "Nova senha de acesso (opcional)" },
      },
      required: ["nome_galeria"],
      additionalProperties: false,
    },
  },
  {
    name: "get_mensagens_portal",
    description:
      "Retorna mensagens não lidas enviadas por clientes via portal. Use quando perguntar sobre mensagens, comunicações, o que os clientes disseram.",
    input_schema: {
      type: "object" as const,
      properties: {
        apenas_nao_lidas: {
          type: "boolean",
          description: "Se true, retorna apenas mensagens não lidas. Default: true",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_briefing",
    description:
      "Retorna o briefing de um cliente ou projeto preenchido pelo portal. Use quando perguntar sobre briefing, detalhes do evento, preferências do cliente, informações para o ensaio.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: {
          type: "string",
          description: "Nome do cliente ou projeto para buscar o briefing",
        },
      },
      required: ["nome"],
      additionalProperties: false,
    },
  },
  {
    name: "get_integracoes",
    description:
      "Verifica o status das integrações ativas: Asaas, Google Calendar, WhatsApp, Google Drive, Autentique. Use quando perguntar sobre integracoes, conexoes, sincronizacao.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  // ── Memory tools ──
  {
    name: "salvar_memoria",
    description:
      "Salva uma informação importante aprendida sobre o estúdio para uso em conversas futuras. Use quando o fotógrafo revelar preferências, padrões de preço, hábitos de trabalho ou qualquer informação que seria útil lembrar na próxima sessão.",
    input_schema: {
      type: "object" as const,
      properties: {
        categoria: {
          type: "string",
          enum: ["preferencia", "preco", "estilo", "cliente", "operacao", "observacao"],
          description: "Categoria da memória",
        },
        chave: {
          type: "string",
          description: "Identificador curto (ex: 'estilo_favorito', 'sinal_padrao', 'prazo_entrega')",
        },
        valor: {
          type: "string",
          description: "O que foi aprendido (texto livre)",
        },
      },
      required: ["categoria", "chave", "valor"],
      additionalProperties: false,
    },
  },
  {
    name: "listar_memorias",
    description:
      "Lista todas as memórias salvas sobre o estúdio. Use quando o fotógrafo perguntar o que a Iris lembra dele.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  // ── Communication tools ──
  {
    name: "enviar_email_cliente",
    description:
      "Envia um email diretamente para um cliente. Use quando o fotógrafo pedir para enviar mensagem, orçamento, confirmação ou qualquer comunicação por email. SEMPRE confirme o conteúdo antes de enviar.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_cliente: { type: "string", description: "Nome do cliente ou lead para buscar o email" },
        assunto: { type: "string", description: "Assunto do email" },
        mensagem: { type: "string", description: "Corpo do email em texto (será formatado automaticamente)" },
      },
      required: ["nome_cliente", "assunto", "mensagem"],
      additionalProperties: false,
    },
  },
  {
    name: "enviar_whatsapp_cliente",
    description:
      "Envia uma mensagem WhatsApp para um cliente via integração configurada. Só funciona se a integração WhatsApp estiver ativa. Use quando pedir para enviar mensagem no WhatsApp.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_cliente: { type: "string", description: "Nome do cliente para buscar o telefone" },
        mensagem: { type: "string", description: "Texto da mensagem a enviar" },
      },
      required: ["nome_cliente", "mensagem"],
      additionalProperties: false,
    },
  },
  // ── Quote tool ──
  {
    name: "gerar_orcamento",
    description:
      "Gera um texto de proposta/orçamento formatado para enviar a um lead ou cliente. Use quando pedir para criar orçamento, proposta, cotação.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome_lead: { type: "string", description: "Nome do lead para personalizar (opcional)" },
        tipo_evento: {
          type: "string",
          enum: ["casamento", "ensaio", "corporativo", "aniversario", "formatura", "batizado", "outro"],
          description: "Tipo de evento",
        },
        valor: { type: "number", description: "Valor total proposto em reais" },
        descricao_servico: { type: "string", description: "O que está incluído no serviço" },
        validade_dias: { type: "number", description: "Validade da proposta em dias (default: 7)" },
      },
      required: ["tipo_evento", "valor", "descricao_servico"],
      additionalProperties: false,
    },
  },
];

// ═══════════════════════════════════════════════
// Tool Executor — runs tools against Supabase
// ═══════════════════════════════════════════════

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: SupabaseClient,
  studioId: string
): Promise<string> {
  switch (toolName) {
    case "get_resumo_dia":
      return await getResumoDia(supabase, studioId);
    case "get_agenda":
      return await getAgenda(supabase, studioId, toolInput.periodo as string);
    case "get_financeiro":
      return await getFinanceiro(supabase, studioId, toolInput.periodo as string);
    case "get_projetos":
      return await getProjetos(supabase, studioId, toolInput.status as string);
    case "get_clientes":
      return await getClientes(supabase, studioId, toolInput.busca as string);
    case "get_leads":
      return await getLeads(supabase, studioId);
    case "get_galerias":
      return await getGalerias(supabase, studioId);
    case "get_contratos":
      return await getContratos(supabase, studioId, toolInput.status as string);
    case "get_pedidos":
      return await getPedidos(supabase, studioId, toolInput.status as string);
    case "get_equipe":
      return await getEquipe(supabase, studioId);
    case "get_producao":
      return await getProducao(supabase, studioId, toolInput.filtro as string);
    case "criar_lead":
      return await criarLead(supabase, studioId, toolInput);
    case "registrar_pagamento":
      return await registrarPagamento(supabase, studioId, toolInput);
    case "criar_projeto":
      return await criarProjeto(supabase, studioId, toolInput);
    case "criar_evento_agenda":
      return await criarEvento(supabase, studioId, toolInput);
    case "criar_cliente":
      return await criarCliente(supabase, studioId, toolInput);
    case "atualizar_cliente":
      return await atualizarCliente(supabase, studioId, toolInput);
    case "atualizar_projeto":
      return await atualizarProjeto(supabase, studioId, toolInput);
    case "enviar_acesso_portal":
      return await enviarAcessoPortal(supabase, studioId, toolInput);
    case "criar_parcela":
      return await criarParcela(supabase, studioId, toolInput);
    case "avancar_workflow":
      return await avancarWorkflow(supabase, studioId, toolInput);
    case "criar_contrato":
      return await criarContrato(supabase, studioId, toolInput);
    case "alterar_senha":
      return await alterarSenha(supabase, toolInput);
    case "enviar_portal_em_massa":
      return await enviarPortalEmMassa(supabase, studioId);
    case "exportar_csv":
      return await exportarCSV(toolInput);
    case "deletar_item":
      return await deletarItem(supabase, studioId, toolInput);
    case "restaurar_item":
      return await restaurarItem(supabase, studioId, toolInput);
    case "duplicar_projeto":
      return await duplicarProjeto(supabase, studioId, toolInput);

    case "get_mensagens_portal": {
      const apenasNaoLidas = toolInput.apenas_nao_lidas !== false;
      let query = supabase
        .from("portal_messages")
        .select("content, sender_type, created_at, read_at, projects(name), clients(name)")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (apenasNaoLidas) query = query.is("read_at", null).eq("sender_type", "client");
      const { data, error } = await query;
      if (error) return JSON.stringify({ erro: error.message });
      const msgs = data || [];
      return JSON.stringify({
        total: msgs.length,
        nao_lidas: msgs.filter((m: { read_at: string | null }) => !m.read_at).length,
        mensagens: msgs,
      });
    }

    case "get_briefing": {
      const nome = toolInput.nome as string;
      // Search by client name first, then project
      const { data: clientBriefings } = await supabase
        .from("portal_briefings")
        .select("markdown_output, sections, created_at, clients(name), projects(name)")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!clientBriefings || clientBriefings.length === 0) {
        return JSON.stringify({ mensagem: `Nenhum briefing encontrado para "${nome}". O cliente pode ainda não ter preenchido.` });
      }
      // Filter by name match
      type BriefingRow = { clients?: { name?: string } | null; projects?: { name?: string } | null; [key: string]: unknown };
      const allBriefings = clientBriefings as BriefingRow[];
      const matched = allBriefings.filter((b) => {
        const clientName = b.clients?.name || "";
        const projectName = b.projects?.name || "";
        return clientName.toLowerCase().includes(nome.toLowerCase()) || projectName.toLowerCase().includes(nome.toLowerCase());
      });
      const results = matched.length > 0 ? matched : allBriefings;
      return JSON.stringify({ briefings: results.slice(0, 2) });
    }

    case "get_integracoes": {
      const { data, error } = await supabase
        .from("integrations")
        .select("provider, status, error_message, last_sync_at, updated_at")
        .eq("studio_id", studioId);
      if (error) return JSON.stringify({ erro: error.message });
      const integracoes = data || [];
      return JSON.stringify({
        total: integracoes.length,
        integracoes: integracoes,
        ativas: integracoes.filter((i: { status: string }) => i.status === "active").length,
        com_erro: integracoes.filter((i: { status: string }) => i.status === "error").length,
      });
    }

    case "atualizar_lead": {
      const input = toolInput as { nome_lead: string; estagio?: string; notas?: string; valor_estimado?: number };
      // Search for lead by name
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, stage, notes, estimated_value")
        .eq("studio_id", studioId)
        .ilike("name", `%${input.nome_lead}%`)
        .limit(1);
      if (!leads || leads.length === 0) return JSON.stringify({ erro: `Lead "${input.nome_lead}" não encontrado.` });
      const lead = leads[0];
      const updates: Record<string, unknown> = {};
      const stageMap: Record<string, string> = {
        novo: "new", contato: "contacted", reuniao: "meeting",
        proposta: "proposal", negociacao: "negotiation", ganho: "won", perdido: "lost",
      };
      if (input.estagio) updates.stage = stageMap[input.estagio] || input.estagio;
      if (input.notas) updates.notes = input.notas;
      if (input.valor_estimado) updates.estimated_value = input.valor_estimado;
      if (Object.keys(updates).length === 0) return JSON.stringify({ erro: "Nenhum campo para atualizar fornecido." });
      const { error } = await supabase.from("leads").update(updates).eq("id", lead.id);
      if (error) return JSON.stringify({ erro: error.message });
      const parts = [];
      if (input.estagio) parts.push(`estágio: ${input.estagio}`);
      if (input.notas) parts.push(`nota adicionada`);
      if (input.valor_estimado) parts.push(`valor: R$ ${input.valor_estimado.toFixed(2).replace(".", ",")}`);
      return JSON.stringify({ sucesso: true, mensagem: `Lead "${lead.name}" atualizado — ${parts.join(", ")}.` });
    }

    case "criar_nota": {
      const input = toolInput as { tipo: "cliente" | "projeto"; nome: string; nota: string };
      if (input.tipo === "cliente") {
        const { data: clientes } = await supabase
          .from("clients")
          .select("id, name, notes")
          .eq("studio_id", studioId)
          .ilike("name", `%${input.nome}%`)
          .limit(1);
        if (!clientes || clientes.length === 0) return JSON.stringify({ erro: `Cliente "${input.nome}" não encontrado.` });
        const cliente = clientes[0];
        const notasAtuais = cliente.notes || "";
        const novaNotas = notasAtuais ? `${notasAtuais}\n\n[${new Date().toLocaleDateString("pt-BR")}] ${input.nota}` : `[${new Date().toLocaleDateString("pt-BR")}] ${input.nota}`;
        const { error } = await supabase.from("clients").update({ notes: novaNotas }).eq("id", cliente.id);
        if (error) return JSON.stringify({ erro: error.message });
        return JSON.stringify({ sucesso: true, mensagem: `Nota adicionada ao cliente "${cliente.name}".` });
      } else {
        const { data: projetos } = await supabase
          .from("projects")
          .select("id, name, notes")
          .eq("studio_id", studioId)
          .ilike("name", `%${input.nome}%`)
          .limit(1);
        if (!projetos || projetos.length === 0) return JSON.stringify({ erro: `Projeto "${input.nome}" não encontrado.` });
        const projeto = projetos[0];
        const notasAtuais = projeto.notes || "";
        const novaNotas = notasAtuais ? `${notasAtuais}\n\n[${new Date().toLocaleDateString("pt-BR")}] ${input.nota}` : `[${new Date().toLocaleDateString("pt-BR")}] ${input.nota}`;
        const { error } = await supabase.from("projects").update({ notes: novaNotas }).eq("id", projeto.id);
        if (error) return JSON.stringify({ erro: error.message });
        return JSON.stringify({ sucesso: true, mensagem: `Nota adicionada ao projeto "${projeto.name}".` });
      }
    }

    case "buscar": {
      const input = toolInput as { termo: string; tipo?: string };
      const tipo = input.tipo || "todos";
      const resultados: Record<string, unknown[]> = {};
      if (tipo === "todos" || tipo === "projetos") {
        const { data } = await supabase.from("projects").select("id, name, status, event_date").eq("studio_id", studioId).ilike("name", `%${input.termo}%`).limit(5);
        if (data && data.length > 0) resultados.projetos = data;
      }
      if (tipo === "todos" || tipo === "clientes") {
        const { data } = await supabase.from("clients").select("id, name, email, phone").eq("studio_id", studioId).ilike("name", `%${input.termo}%`).limit(5);
        if (data && data.length > 0) resultados.clientes = data;
      }
      if (tipo === "todos" || tipo === "leads") {
        const { data } = await supabase.from("leads").select("id, name, stage, estimated_value").eq("studio_id", studioId).ilike("name", `%${input.termo}%`).limit(5);
        if (data && data.length > 0) resultados.leads = data;
      }
      if (tipo === "todos" || tipo === "galerias") {
        const { data } = await supabase.from("galleries").select("id, name, status, slug").eq("studio_id", studioId).ilike("name", `%${input.termo}%`).limit(5);
        if (data && data.length > 0) resultados.galerias = data;
      }
      if (tipo === "todos" || tipo === "contratos") {
        const { data } = await supabase.from("contracts").select("id, title, status").eq("studio_id", studioId).ilike("title", `%${input.termo}%`).limit(5);
        if (data && data.length > 0) resultados.contratos = data;
      }
      const totalEncontrado = Object.values(resultados).reduce((sum, arr) => sum + arr.length, 0);
      if (totalEncontrado === 0) return JSON.stringify({ mensagem: `Nenhum resultado encontrado para "${input.termo}".` });
      return JSON.stringify(resultados);
    }

    case "get_metricas": {
      const input = toolInput as { periodo?: string };
      const meses = input.periodo === "3meses" ? 3 : input.periodo === "12meses" ? 12 : 6;
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - meses);
      const [parcelas, projetos, leads] = await Promise.all([
        supabase.from("installments").select("amount, status, due_date, paid_date").eq("studio_id", studioId).gte("due_date", dataInicio.toISOString().split("T")[0]),
        supabase.from("projects").select("id, status, created_at").eq("studio_id", studioId).gte("created_at", dataInicio.toISOString()),
        supabase.from("leads").select("id, stage, created_at").eq("studio_id", studioId).gte("created_at", dataInicio.toISOString()),
      ]);
      const faturamento = (parcelas.data || []).filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
      const pendente = (parcelas.data || []).filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
      const projetosAtivos = (projetos.data || []).filter(p => !["entregue", "cancelado"].includes(p.status)).length;
      const projetosCriados = (projetos.data || []).length;
      const leadsTotal = (leads.data || []).length;
      const leadsGanhos = (leads.data || []).filter(l => l.stage === "won").length;
      const taxaConversao = leadsTotal > 0 ? Math.round((leadsGanhos / leadsTotal) * 100) : 0;
      return JSON.stringify({
        periodo: `${meses} meses`,
        faturamento_recebido: faturamento,
        faturamento_pendente: pendente,
        projetos_criados: projetosCriados,
        projetos_ativos: projetosAtivos,
        leads_total: leadsTotal,
        leads_convertidos: leadsGanhos,
        taxa_conversao_pct: taxaConversao,
      });
    }

    case "atualizar_galeria": {
      const input = toolInput as { nome_galeria: string; status?: string; senha?: string };
      const { data: galerias } = await supabase
        .from("galleries")
        .select("id, name, status")
        .eq("studio_id", studioId)
        .ilike("name", `%${input.nome_galeria}%`)
        .limit(1);
      if (!galerias || galerias.length === 0) return JSON.stringify({ erro: `Galeria "${input.nome_galeria}" não encontrada.` });
      const galeria = galerias[0];
      const updates: Record<string, unknown> = {};
      if (input.status) updates.status = input.status;
      if (input.senha !== undefined) updates.password = input.senha || null;
      if (Object.keys(updates).length === 0) return JSON.stringify({ erro: "Nenhum campo para atualizar fornecido." });
      const { error } = await supabase.from("galleries").update(updates).eq("id", galeria.id);
      if (error) return JSON.stringify({ erro: error.message });
      const parts = [];
      if (input.status) parts.push(`status: ${input.status}`);
      if (input.senha !== undefined) parts.push(input.senha ? "senha definida" : "senha removida");
      return JSON.stringify({ sucesso: true, mensagem: `Galeria "${galeria.name}" atualizada — ${parts.join(", ")}.` });
    }

    case "salvar_memoria": {
      const input = toolInput as { categoria: string; chave: string; valor: string };
      const { error } = await supabase
        .from("iris_memories")
        .upsert({
          studio_id: studioId,
          category: input.categoria,
          key: input.chave,
          value: input.valor,
          updated_at: new Date().toISOString(),
        }, { onConflict: "studio_id,category,key" });
      if (error) return JSON.stringify({ erro: error.message });
      return JSON.stringify({ sucesso: true, mensagem: `Memória salva: ${input.chave} = ${input.valor}` });
    }

    case "listar_memorias": {
      const { data, error } = await supabase
        .from("iris_memories")
        .select("category, key, value, updated_at")
        .eq("studio_id", studioId)
        .order("category")
        .order("updated_at", { ascending: false });
      if (error) return JSON.stringify({ erro: error.message });
      const memorias = data || [];
      if (memorias.length === 0) return JSON.stringify({ mensagem: "Nenhuma memória salva ainda." });
      return JSON.stringify({ total: memorias.length, memorias });
    }

    case "enviar_email_cliente": {
      const input = toolInput as { nome_cliente: string; assunto: string; mensagem: string };
      // Find client or lead by name
      const [clientRes, leadRes] = await Promise.all([
        supabase.from("clients").select("name, email").eq("studio_id", studioId).ilike("name", `%${input.nome_cliente}%`).limit(1),
        supabase.from("leads").select("name, email").eq("studio_id", studioId).ilike("name", `%${input.nome_cliente}%`).limit(1),
      ]);
      const found = clientRes.data?.[0] || leadRes.data?.[0];
      if (!found) return JSON.stringify({ erro: `Cliente "${input.nome_cliente}" não encontrado.` });
      if (!found.email) return JSON.stringify({ erro: `"${found.name}" não tem email cadastrado.` });

      const { data: studioRow } = await supabase.from("studios").select("name").eq("id", studioId).single();
      const { sendEmail, clientDirectEmail } = await import("@/lib/email");
      const { subject: emailSubject, html } = clientDirectEmail({ clientName: found.name, studioName: studioRow?.name || "Estúdio", subject: input.assunto, body: input.mensagem });
      const sent = await sendEmail({ to: found.email, subject: emailSubject, html });
      if (!sent) return JSON.stringify({ erro: "Falha ao enviar email. Verifique as configurações de email." });
      return JSON.stringify({ sucesso: true, mensagem: `Email enviado para ${found.name} (${found.email}).` });
    }

    case "enviar_whatsapp_cliente": {
      const input = toolInput as { nome_cliente: string; mensagem: string };
      // Check WhatsApp integration
      const { data: integration } = await supabase
        .from("integrations")
        .select("status, credentials")
        .eq("studio_id", studioId)
        .eq("provider", "whatsapp")
        .single();
      if (!integration || integration.status !== "active") {
        return JSON.stringify({ erro: "Integração WhatsApp não configurada. Acesse /configuracoes/integracoes para conectar." });
      }
      // Find client phone
      const [clientRes, leadRes] = await Promise.all([
        supabase.from("clients").select("name, phone").eq("studio_id", studioId).ilike("name", `%${input.nome_cliente}%`).limit(1),
        supabase.from("leads").select("name, phone").eq("studio_id", studioId).ilike("name", `%${input.nome_cliente}%`).limit(1),
      ]);
      const found = clientRes.data?.[0] || leadRes.data?.[0];
      if (!found) return JSON.stringify({ erro: `Cliente "${input.nome_cliente}" não encontrado.` });
      if (!found.phone) return JSON.stringify({ erro: `"${found.name}" não tem telefone cadastrado.` });

      const creds = integration.credentials as Record<string, string>;
      const apiUrl = creds.api_url || creds.apiUrl;
      const token = creds.access_token || creds.token;
      if (!apiUrl || !token) return JSON.stringify({ erro: "Credenciais WhatsApp incompletas. Reconecte a integração." });

      try {
        const phone = found.phone.replace(/\D/g, "");
        const res = await fetch(`${apiUrl}/message/sendText`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": token },
          body: JSON.stringify({ number: `55${phone}`, text: input.mensagem }),
        });
        if (!res.ok) return JSON.stringify({ erro: `Erro ao enviar WhatsApp: ${res.status}` });
        return JSON.stringify({ sucesso: true, mensagem: `WhatsApp enviado para ${found.name} (${found.phone}).` });
      } catch (e) {
        return JSON.stringify({ erro: `Falha na conexão WhatsApp: ${e instanceof Error ? e.message : "erro desconhecido"}` });
      }
    }

    case "gerar_orcamento": {
      const input = toolInput as { nome_lead?: string; tipo_evento: string; valor: number; descricao_servico: string; validade_dias?: number };
      const validade = input.validade_dias || 7;
      const hoje = new Date();
      const validadeDate = new Date(hoje);
      validadeDate.setDate(validadeDate.getDate() + validade);
      const formatDate = (d: Date) => d.toLocaleDateString("pt-BR");
      const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
      const sinal = Math.round(input.valor * 0.5);
      const saldo = input.valor - sinal;

      const tipoMap: Record<string, string> = {
        casamento: "Casamento", ensaio: "Ensaio", corporativo: "Corporativo",
        aniversario: "Aniversário", formatura: "Formatura", batizado: "Batizado", outro: "Evento",
      };
      const leadName = input.nome_lead || "";
      const textoOrcamento = `PROPOSTA — ${tipoMap[input.tipo_evento] || input.tipo_evento}${leadName ? ` | ${leadName}` : ""}
Data: ${formatDate(hoje)}
Válida até: ${formatDate(validadeDate)}

O QUE ESTÁ INCLUÍDO:
${input.descricao_servico}

INVESTIMENTO:
Total: ${formatCurrency(input.valor)}
Sinal para confirmação: ${formatCurrency(sinal)}
Saldo na entrega: ${formatCurrency(saldo)}

Para confirmar sua data, basta assinar o contrato e realizar o pagamento do sinal de ${formatCurrency(sinal)}.

Qualquer dúvida, estou à disposição!`;

      return JSON.stringify({ texto: textoOrcamento, valor: input.valor, lead: leadName });
    }

    default:
      return JSON.stringify({ error: "Ferramenta não encontrada" });
  }
}

// ═══════════════════════════════════════════════
// Tool Implementations
// ═══════════════════════════════════════════════

async function getResumoDia(supabase: SupabaseClient, studioId: string): Promise<string> {
  const todayISO = new Date().toISOString().split("T")[0];

  const [eventsRes, overdueRes, projectsRes, leadsRes] = await Promise.all([
    supabase
      .from("events")
      .select("title, start_at, location")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .gte("start_at", `${todayISO}T00:00:00`)
      .lte("start_at", `${todayISO}T23:59:59`)
      .order("start_at"),
    supabase
      .from("installments")
      .select("amount, description, due_date")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .in("status", ["pendente", "vencido"])
      .lt("due_date", todayISO),
    supabase
      .from("projects")
      .select("name, status, event_type")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .in("status", ["confirmado", "producao", "edicao"]),
    supabase
      .from("leads")
      .select("name, stage")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .not("stage", "in", '("ganho","perdido")'),
  ]);

  return JSON.stringify({
    data_hoje: todayISO,
    eventos_hoje: eventsRes.data || [],
    cobrancas_vencidas: overdueRes.data || [],
    total_vencido: (overdueRes.data || []).reduce((s, i) => s + Number(i.amount), 0),
    projetos_ativos: projectsRes.data || [],
    leads_ativos: (leadsRes.data || []).length,
  });
}

async function getAgenda(supabase: SupabaseClient, studioId: string, periodo?: string): Promise<string> {
  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];

  let start = `${todayISO}T00:00:00`;
  let end = `${todayISO}T23:59:59`;
  let limit = 10;

  if (periodo === "semana") {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    end = weekEnd.toISOString();
    limit = 20;
  } else if (periodo === "proximos") {
    const futureEnd = new Date(now);
    futureEnd.setDate(futureEnd.getDate() + 30);
    end = futureEnd.toISOString();
    limit = 15;
  }

  const { data } = await supabase
    .from("events")
    .select("title, start_at, end_at, location, description")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at")
    .limit(limit);

  return JSON.stringify({ periodo: periodo || "hoje", eventos: data || [] });
}

async function getFinanceiro(supabase: SupabaseClient, studioId: string, periodo?: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let startDate: string;
  if (periodo === "ano") {
    startDate = `${year}-01-01`;
  } else if (periodo === "semana") {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    startDate = weekStart.toISOString().split("T")[0];
  } else {
    startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  }

  const [pendingRes, paidRes, overdueRes] = await Promise.all([
    supabase
      .from("installments")
      .select("amount, due_date, description, payment_method, category, recurring")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .eq("status", "pendente")
      .gte("due_date", startDate)
      .order("due_date")
      .limit(20),
    supabase
      .from("installments")
      .select("amount, paid_amount, paid_at, description, payment_method, category, recurring")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .eq("status", "pago")
      .gte("paid_at", startDate)
      .limit(50),
    supabase
      .from("installments")
      .select("amount, due_date, description, payment_method, category")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .in("status", ["pendente", "vencido"])
      .lt("due_date", new Date().toISOString().split("T")[0])
      .limit(20),
  ]);

  const pending = pendingRes.data || [];
  const paid = paidRes.data || [];
  const overdue = overdueRes.data || [];

  return JSON.stringify({
    periodo: periodo || "mes",
    total_recebido: paid.reduce((s, i) => s + Number(i.amount), 0),
    total_pendente: pending.reduce((s, i) => s + Number(i.amount), 0),
    total_vencido: overdue.reduce((s, i) => s + Number(i.amount), 0),
    parcelas_pendentes: pending.length,
    parcelas_vencidas: overdue.length,
    ultimos_recebimentos: paid.slice(0, 5),
    proximas_cobrancas: pending.slice(0, 5),
    cobrancas_vencidas: overdue.slice(0, 5),
  });
}

async function getProjetos(supabase: SupabaseClient, studioId: string, status?: string): Promise<string> {
  let query = supabase
    .from("projects")
    .select("name, status, event_type, event_date, event_location, production_phase, value, paid, delivery_deadline_date, team_ids, tags, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(15);

  if (status === "ativos" || !status) {
    query = query.in("status", ["confirmado", "producao", "edicao"]);
  } else if (status === "producao") {
    query = query.in("status", ["producao", "edicao"]);
  } else if (status === "entregues") {
    query = query.eq("status", "entregue");
  }
  // "todos" = sem filtro adicional

  const { data } = await query;
  return JSON.stringify({ filtro: status || "ativos", projetos: data || [] });
}

async function getClientes(supabase: SupabaseClient, studioId: string, busca?: string): Promise<string> {
  let query = supabase
    .from("clients")
    .select("id, name, email, phone, total_spent, tags, city, state, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .order("name")
    .limit(20);

  if (busca) {
    const safeBusca = busca.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("name", `%${safeBusca}%`);
  }

  const { data } = await query;
  return JSON.stringify({ clientes: data || [], total: (data || []).length });
}

async function getLeads(supabase: SupabaseClient, studioId: string): Promise<string> {
  const { data } = await supabase
    .from("leads")
    .select("name, stage, event_type, estimated_value, source, next_action, next_action_date, lost_reason, event_location, created_at, updated_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const leads = data || [];
  const stages: Record<string, number> = {};
  leads.forEach((l) => {
    stages[l.stage] = (stages[l.stage] || 0) + 1;
  });

  return JSON.stringify({
    total: leads.length,
    por_estagio: stages,
    leads: leads.slice(0, 10),
    valor_pipeline: leads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0),
  });
}

async function getGalerias(supabase: SupabaseClient, studioId: string): Promise<string> {
  const { data } = await supabase
    .from("galleries")
    .select("name, status, photo_count, views, downloads, privacy, expires_at, delivery_deadline_date, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(15);

  const galleries = data || [];
  return JSON.stringify({
    total: galleries.length,
    total_fotos: galleries.reduce((s, g) => s + (Number(g.photo_count) || 0), 0),
    galerias: galleries,
  });
}

// ── V2 Read operations ──

async function getContratos(supabase: SupabaseClient, studioId: string, status?: string): Promise<string> {
  let query = supabase
    .from("contracts")
    .select("title, status, value, sent_at, signed_at, expires_at, created_at")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(15);

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const contracts = data || [];
  const signed = contracts.filter(c => c.status === "assinado").length;
  const totalValue = contracts.filter(c => c.status === "assinado").reduce((s, c) => s + Number(c.value || 0), 0);

  return JSON.stringify({
    filtro: status || "todos",
    total: contracts.length,
    assinados: signed,
    valor_total_assinados: totalValue,
    contratos: contracts,
  });
}

async function getPedidos(supabase: SupabaseClient, studioId: string, status?: string): Promise<string> {
  let query = supabase
    .from("orders")
    .select("status, total, tracking_code, notes, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const orders = data || [];
  return JSON.stringify({
    filtro: status || "todos",
    total: orders.length,
    pedidos: orders,
  });
}

async function getEquipe(supabase: SupabaseClient, studioId: string): Promise<string> {
  const { data } = await supabase
    .from("team_members")
    .select("name, email, role, phone, active")
    .eq("studio_id", studioId)
    .order("name");

  const members = data || [];
  const active = members.filter(m => m.active).length;
  const roles: Record<string, number> = {};
  members.forEach(m => { roles[m.role] = (roles[m.role] || 0) + 1; });

  return JSON.stringify({
    total: members.length,
    ativos: active,
    por_cargo: roles,
    membros: members,
  });
}

async function getProducao(supabase: SupabaseClient, studioId: string, filtro?: string): Promise<string> {
  const todayISO = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("project_workflows")
    .select("name, status, deadline, assigned_to, sort_order, projects(name, event_type)")
    .eq("studio_id", studioId)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(30);

  if (filtro === "atrasados") {
    query = query.neq("status", "concluido").lt("deadline", todayISO);
  } else if (filtro === "em_andamento") {
    query = query.eq("status", "em_andamento");
  } else if (filtro === "pendentes") {
    query = query.eq("status", "pendente");
  }

  const { data } = await query;
  const workflows = data || [];
  const late = workflows.filter(w => w.deadline && w.deadline < todayISO && w.status !== "concluido").length;

  return JSON.stringify({
    filtro: filtro || "todos",
    total: workflows.length,
    atrasados: late,
    workflows: workflows.slice(0, 15),
  });
}

// ── V2 Write operations ──

async function criarLead(
  supabase: SupabaseClient,
  studioId: string,
  input: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      studio_id: studioId,
      name: input.nome,
      email: input.email || null,
      phone: input.telefone || null,
      event_type: input.tipo_evento || "outro",
      estimated_value: input.valor_estimado || 0,
      stage: "novo",
    })
    .select("id, name, stage, event_type")
    .single();

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, lead: data });
}

async function registrarPagamento(
  supabase: SupabaseClient,
  studioId: string,
  input: Record<string, unknown>
): Promise<string> {
  const desc = input.descricao_parcela as string;

  // Find matching installment
  const { data: installments } = await supabase
    .from("installments")
    .select("id, description, amount, due_date, status")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .in("status", ["pendente", "vencido"])
    .ilike("description", `%${desc.replace(/[%_\\]/g, "\\$&")}%`)
    .limit(5);

  if (!installments || installments.length === 0) {
    return JSON.stringify({ erro: `Nenhuma parcela pendente encontrada com "${desc}"` });
  }

  if (installments.length > 1) {
    return JSON.stringify({
      aviso: "Encontrei mais de uma parcela. Qual delas?",
      opcoes: installments.map(i => ({
        descricao: i.description,
        valor: i.amount,
        vencimento: i.due_date,
      })),
    });
  }

  const installment = installments[0];
  const { error } = await supabase
    .from("installments")
    .update({
      status: "pago",
      paid_at: new Date().toISOString(),
      paid_amount: installment.amount,
    })
    .eq("id", installment.id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({
    sucesso: true,
    parcela: {
      descricao: installment.description,
      valor: installment.amount,
      status: "pago",
    },
  });
}

// ── Write operations ──

async function criarProjeto(
  supabase: SupabaseClient,
  studioId: string,
  input: Record<string, unknown>
): Promise<string> {
  const warnings: string[] = [];

  // ─── Link client if name provided ───────────────
  let clientId: string | null = null;
  if (input.cliente_nome) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .ilike("name", `%${input.cliente_nome}%`)
      .limit(1);
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    }
  }

  const projectName = (input.nome as string).trim();
  const valor = Number(input.valor) || 0;
  const parcelas = Number(input.parcelas) || (valor > 0 ? 1 : 0);
  const paymentMethod = (input.metodo_pagamento as string) || null;

  // ─── 1. Create project ──────────────────────────
  const { data, error } = await supabase
    .from("projects")
    .insert({
      studio_id: studioId,
      client_id: clientId,
      name: projectName,
      event_type: input.tipo,
      event_date: input.data_evento || null,
      event_time: input.hora_evento || null,
      event_location: input.local || null,
      status: "rascunho",
      production_phase: "agendado",
      value: valor,
      paid: 0,
      payment_method: paymentMethod,
      delivery_deadline_days: input.prazo_entrega_dias || null,
      team_ids: [],
      tags: [],
      notes: null,
    })
    .select("id, name, event_type, status, client_id")
    .single();

  if (error) return JSON.stringify({ erro: error.message });

  const projectId = data.id;

  // ─── 2. Create installments ─────────────────────
  let installmentCount = 0;
  if (valor > 0 && parcelas > 0) {
    const now = new Date();
    const installmentAmount = Math.round((valor / parcelas) * 100) / 100;
    const installmentRows = [];

    for (let i = 0; i < parcelas; i++) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30 * (i + 1));
      const dueDateStr = dueDate.toISOString().split("T")[0];

      installmentRows.push({
        studio_id: studioId,
        project_id: projectId,
        client_id: clientId || null,
        type: "receita" as const,
        description: `Parcela ${i + 1}/${parcelas} - ${projectName}`,
        amount: installmentAmount,
        due_date: dueDateStr,
        status: "pendente" as const,
        payment_method: paymentMethod,
      });
    }

    const { error: installError } = await supabase
      .from("installments")
      .insert(installmentRows);

    if (installError) {
      warnings.push("Parcelas não foram salvas: " + installError.message);
    } else {
      installmentCount = parcelas;
    }
  }

  // ─── 3. Create calendar event ───────────────────
  let eventCreated = false;
  if (input.data_evento) {
    const eventTime = (input.hora_evento as string) || "09:00";
    const startAt = `${input.data_evento}T${eventTime}:00`;
    const [hours, minutes] = eventTime.split(":").map(Number);
    const endHours = hours + 4;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
    const endAt = `${input.data_evento}T${endTime}:00`;

    const { error: eventError } = await supabase
      .from("events")
      .insert({
        studio_id: studioId,
        title: projectName,
        start_at: startAt,
        end_at: endAt,
        location: input.local || null,
        status: "confirmado",
        project_id: projectId,
      });

    if (eventError) {
      warnings.push("Evento não foi criado: " + eventError.message);
    } else {
      eventCreated = true;
    }
  }

  // ─── 4. Create default production workflow ──────
  let workflowCreated = false;
  const workflowSteps = ["Agendamento", "Captação", "Seleção", "Edição", "Revisão", "Entrega", "Concluído"];
  const workflowRows = workflowSteps.map((step, index) => ({
    studio_id: studioId,
    project_id: projectId,
    name: `${projectName} — ${step}`,
    status: "pendente" as const,
    sort_order: index,
    notes: null,
    assigned_to: null,
  }));

  const { error: wfError } = await supabase
    .from("project_workflows")
    .insert(workflowRows);

  if (wfError) {
    warnings.push("Workflow não foi criado: " + wfError.message);
  } else {
    workflowCreated = true;
  }

  // ─── 5. Create gallery ──────────────────────────
  let galleryCreated = false;
  const gallerySlug = projectName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error: galleryError } = await supabase
    .from("galleries")
    .insert({
      studio_id: studioId,
      project_id: projectId,
      client_id: clientId || null,
      name: projectName,
      slug: gallerySlug + "-" + Date.now().toString(36),
      status: "rascunho",
      privacy: "private",
      photo_count: 0,
      views: 0,
      downloads: 0,
      download_enabled: false,
      watermark_enabled: true,
    });

  if (galleryError) {
    warnings.push("Galeria não foi criada: " + galleryError.message);
  } else {
    galleryCreated = true;
  }

  // ─── Build response ─────────────────────────────
  const parts: string[] = ["Projeto criado!"];
  if (galleryCreated) parts.push("Galeria configurada");
  if (installmentCount > 0) parts.push(`${installmentCount} parcela${installmentCount > 1 ? "s" : ""} gerada${installmentCount > 1 ? "s" : ""}`);
  if (eventCreated) parts.push("evento no calendário");
  if (workflowCreated) parts.push("workflow de produção com 7 etapas");

  return JSON.stringify({
    sucesso: true,
    projeto: data,
    resumo: parts.join(", ") + ".",
    avisos: warnings.length > 0 ? warnings : undefined,
  });
}

async function criarEvento(
  supabase: SupabaseClient,
  studioId: string,
  input: Record<string, unknown>
): Promise<string> {
  const startAt = `${input.data}T${input.horario}:00`;
  // Default duration 1h unless duracao_horas provided
  const duracaoHoras = Number(input.duracao_horas) || 1;
  const [hours, minutes] = (input.horario as string).split(":").map(Number);
  const endHours = hours + duracaoHoras;
  const endAt = `${input.data}T${String(endHours % 24).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`;

  const { data, error } = await supabase
    .from("events")
    .insert({
      studio_id: studioId,
      title: input.titulo,
      start_at: startAt,
      end_at: endAt,
      location: input.local || null,
      status: "agendado",
    })
    .select("id, title, start_at, location")
    .single();

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, evento: data });
}

async function criarCliente(
  supabase: SupabaseClient,
  studioId: string,
  input: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      studio_id: studioId,
      name: input.nome,
      email: input.email || null,
      phone: input.telefone || null,
    })
    .select("id, name, email, phone")
    .single();

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, cliente: data });
}

// ═══════════════════════════════════════════════
// V3 Extended Tools
// ═══════════════════════════════════════════════

async function atualizarCliente(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const nome = input.nome_cliente as string;
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .ilike("name", `%${nome}%`)
    .limit(3);

  if (!clients?.length) return JSON.stringify({ erro: `Cliente "${nome}" não encontrado` });
  if (clients.length > 1) return JSON.stringify({ erro: `Multiplos clientes encontrados: ${clients.map(c => c.name).join(", ")}. Seja mais especifico.` });

  const updates: Record<string, unknown> = {};
  if (input.email) updates.email = input.email;
  if (input.telefone) updates.phone = input.telefone;
  if (input.cidade) updates.city = input.cidade;
  if (input.estado) updates.state = input.estado;
  if (input.notas) updates.notes = input.notas;
  if (input.status) updates.status = input.status;

  if (Object.keys(updates).length === 0) return JSON.stringify({ erro: "Nenhum campo para atualizar" });

  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clients[0].id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, mensagem: `Cliente "${clients[0].name}" atualizado`, campos: Object.keys(updates) });
}

async function atualizarProjeto(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const nome = input.nome_projeto as string;
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .ilike("name", `%${nome}%`)
    .limit(3);

  if (!projects?.length) return JSON.stringify({ erro: `Projeto "${nome}" não encontrado` });
  if (projects.length > 1) return JSON.stringify({ erro: `Multiplos projetos: ${projects.map(p => p.name).join(", ")}. Seja mais especifico.` });

  const updates: Record<string, unknown> = {};
  if (input.status) updates.status = input.status;
  if (input.production_phase) updates.production_phase = input.production_phase;
  if (input.notas) updates.notes = input.notas;

  if (Object.keys(updates).length === 0) return JSON.stringify({ erro: "Nenhum campo para atualizar" });

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projects[0].id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, mensagem: `Projeto "${projects[0].name}" atualizado`, campos: Object.keys(updates) });
}

async function enviarAcessoPortal(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const nome = input.nome_cliente as string;
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, studio_id, studios(name)")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .ilike("name", `%${nome}%`)
    .limit(3);

  if (!clients?.length) return JSON.stringify({ erro: `Cliente "${nome}" não encontrado` });
  if (clients.length > 1) return JSON.stringify({ erro: `Multiplos clientes: ${clients.map(c => c.name).join(", ")}. Seja mais especifico.` });

  const client = clients[0];
  if (!client.email) return JSON.stringify({ erro: `Cliente "${client.name}" não tem email cadastrado. Adicione o email primeiro.` });

  // Create token
  const { data: tokenData, error: tokenError } = await supabase
    .from("client_portal_tokens")
    .insert({ client_id: client.id, studio_id: studioId })
    .select("token")
    .single();

  if (tokenError) return JSON.stringify({ erro: "Erro ao gerar token de acesso" });

  // Update portal_sent_at
  await supabase.from("clients").update({ portal_sent_at: new Date().toISOString() }).eq("id", client.id);

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio"}/portal/auth?token=${tokenData.token}`;

  return JSON.stringify({
    sucesso: true,
    mensagem: `Token de acesso criado para "${client.name}" (${client.email}). Link: ${portalUrl}`,
    nota: "O email sera enviado automaticamente se SMTP estiver configurado. Caso contrario, compartilhe o link acima diretamente com o cliente."
  });
}

async function criarParcela(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const insertData: Record<string, unknown> = {
    studio_id: studioId,
    description: input.descricao,
    amount: input.valor,
    type: input.tipo,
    due_date: input.vencimento,
    status: "pendente",
  };

  // Link project if provided
  if (input.nome_projeto) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, name")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .ilike("name", `%${input.nome_projeto}%`)
      .single();
    if (proj) insertData.project_id = proj.id;
  }

  // Link client if provided
  if (input.nome_cliente) {
    const { data: cli } = await supabase
      .from("clients")
      .select("id, name")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .ilike("name", `%${input.nome_cliente}%`)
      .single();
    if (cli) insertData.client_id = cli.id;
  }

  const { data, error } = await supabase
    .from("installments")
    .insert(insertData)
    .select("id, description, amount, due_date, type, status")
    .single();

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, parcela: data });
}

async function avancarWorkflow(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const nomeProjeto = input.nome_projeto as string;

  // Find project
  const { data: proj } = await supabase
    .from("projects")
    .select("id, name")
    .eq("studio_id", studioId)
    .is("deleted_at", null)
    .ilike("name", `%${nomeProjeto}%`)
    .single();

  if (!proj) return JSON.stringify({ erro: `Projeto "${nomeProjeto}" não encontrado` });

  // Find workflows
  let query = supabase
    .from("project_workflows")
    .select("id, name, status, deadline")
    .eq("project_id", proj.id)
    .order("sort_order", { ascending: true });

  if (input.nome_etapa) {
    query = query.ilike("name", `%${input.nome_etapa}%`);
  } else {
    query = query.in("status", ["pendente", "em_andamento"]);
  }

  const { data: workflows } = await query.limit(1);

  if (!workflows?.length) return JSON.stringify({ erro: "Nenhuma etapa pendente encontrada" });

  const wf = workflows[0];
  const nextStatus = input.novo_status || (wf.status === "pendente" ? "em_andamento" : "concluido");

  const { error } = await supabase
    .from("project_workflows")
    .update({ status: nextStatus })
    .eq("id", wf.id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, mensagem: `Etapa "${wf.name}" do projeto "${proj.name}" atualizada para: ${nextStatus}` });
}

async function criarContrato(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const insertData: Record<string, unknown> = {
    studio_id: studioId,
    title: input.titulo,
    value: input.valor || 0,
    status: "rascunho",
    content: "",
  };

  if (input.nome_cliente) {
    const { data: cli } = await supabase
      .from("clients")
      .select("id")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .ilike("name", `%${input.nome_cliente}%`)
      .single();
    if (cli) insertData.client_id = cli.id;
  }

  if (input.nome_projeto) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .ilike("name", `%${input.nome_projeto}%`)
      .single();
    if (proj) insertData.project_id = proj.id;
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert(insertData)
    .select("id, title, value, status")
    .single();

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, contrato: data });
}

async function alterarSenha(supabase: SupabaseClient, input: Record<string, unknown>): Promise<string> {
  const novaSenha = input.nova_senha as string;

  if (!novaSenha || novaSenha.length < 8) {
    return JSON.stringify({ erro: "Senha deve ter no minimo 8 caracteres" });
  }
  if (!/[A-Z]/.test(novaSenha)) {
    return JSON.stringify({ erro: "Senha deve ter pelo menos 1 letra maiúscula" });
  }
  if (!/[0-9]/.test(novaSenha)) {
    return JSON.stringify({ erro: "Senha deve ter pelo menos 1 número" });
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) return JSON.stringify({ erro: `Erro ao alterar senha: ${error.message}` });
  return JSON.stringify({ sucesso: true, mensagem: "Senha alterada com sucesso!" });
}

async function enviarPortalEmMassa(supabase: SupabaseClient, studioId: string): Promise<string> {
  // Find all clients with email but without portal_sent_at
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("studio_id", studioId)
    .is("portal_sent_at", null)
    .is("deleted_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .order("name");

  if (!clients?.length) {
    return JSON.stringify({ sucesso: true, mensagem: "Todos os clientes com email ja possuem acesso ao portal." });
  }

  let successCount = 0;
  const errors: string[] = [];

  for (const client of clients) {
    try {
      // Create token
      const { error: tokenError } = await supabase
        .from("client_portal_tokens")
        .insert({ client_id: client.id, studio_id: studioId });

      if (tokenError) {
        errors.push(`${client.name}: erro ao gerar token`);
        continue;
      }

      // Update portal_sent_at
      await supabase
        .from("clients")
        .update({ portal_sent_at: new Date().toISOString() })
        .eq("id", client.id);

      successCount++;
    } catch {
      errors.push(`${client.name}: erro inesperado`);
    }
  }

  const result: Record<string, unknown> = {
    sucesso: true,
    mensagem: `Acesso ao portal enviado para ${successCount} de ${clients.length} clientes.`,
    total_enviado: successCount,
    total_clientes: clients.length,
  };

  if (errors.length > 0) {
    result.erros = errors;
  }

  return JSON.stringify(result);
}

async function exportarCSV(input: Record<string, unknown>): Promise<string> {
  const tipo = input.tipo as string;
  const url = `/api/export?tipo=${tipo}`;
  return JSON.stringify({ sucesso: true, mensagem: `Clique no link para baixar: [Baixar ${tipo}.csv](${url})`, url });
}

// ═══════════════════════════════════════════════
// Soft-delete Tools
// ═══════════════════════════════════════════════

async function deletarItem(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const tipo = input.tipo as string;
  const nome = input.nome as string;
  const tableMap: Record<string, string> = {
    projeto: "projects", cliente: "clients", lead: "leads",
    galeria: "galleries", contrato: "contracts", evento: "events", parcela: "installments",
  };
  const table = tableMap[tipo];
  if (!table) return JSON.stringify({ erro: "Tipo invalido" });

  const nameCol = table === "installments" ? "description" : table === "events" ? "title" : "name";
  const { data } = await supabase
    .from(table)
    .select("id, " + nameCol)
    .eq("studio_id", studioId)
    .ilike(nameCol, `%${nome}%`)
    .is("deleted_at", null)
    .limit(3);

  if (!data?.length) return JSON.stringify({ erro: `${tipo} "${nome}" não encontrado` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = data as any[];
  if (items.length > 1) return JSON.stringify({ erro: `Multiplos resultados: ${items.map(d => d[nameCol]).join(", ")}` });

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", items[0].id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, mensagem: `${tipo} "${items[0][nameCol]}" movido para lixeira. Pode ser restaurado.` });
}

async function restaurarItem(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const tipo = input.tipo as string;
  const nome = input.nome as string;
  const tableMap: Record<string, string> = {
    projeto: "projects", cliente: "clients", lead: "leads",
    galeria: "galleries", contrato: "contracts", evento: "events", parcela: "installments",
  };
  const table = tableMap[tipo];
  if (!table) return JSON.stringify({ erro: "Tipo invalido" });

  const nameCol = table === "installments" ? "description" : table === "events" ? "title" : "name";
  const { data } = await supabase
    .from(table)
    .select("id, " + nameCol)
    .eq("studio_id", studioId)
    .ilike(nameCol, `%${nome}%`)
    .not("deleted_at", "is", null)
    .limit(3);

  if (!data?.length) return JSON.stringify({ erro: `${tipo} "${nome}" não encontrado na lixeira` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = data as any[];
  if (items.length > 1) return JSON.stringify({ erro: `Multiplos: ${items.map(d => d[nameCol]).join(", ")}` });

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", items[0].id);

  if (error) return JSON.stringify({ erro: error.message });
  return JSON.stringify({ sucesso: true, mensagem: `${tipo} "${items[0][nameCol]}" restaurado com sucesso!` });
}

async function duplicarProjeto(supabase: SupabaseClient, studioId: string, input: Record<string, unknown>): Promise<string> {
  const nomeOriginal = input.nome_projeto_original as string;
  const novoNome = input.novo_nome as string;

  // Find original project
  const { data: original } = await supabase
    .from("projects")
    .select("*")
    .eq("studio_id", studioId)
    .ilike("name", `%${nomeOriginal}%`)
    .is("deleted_at", null)
    .single();

  if (!original) return JSON.stringify({ erro: `Projeto "${nomeOriginal}" não encontrado` });

  // Find client if specified
  let clientId = null;
  if (input.nome_cliente) {
    const { data: cli } = await supabase
      .from("clients")
      .select("id")
      .eq("studio_id", studioId)
      .ilike("name", `%${input.nome_cliente}%`)
      .is("deleted_at", null)
      .single();
    if (cli) clientId = cli.id;
  }

  // Create new project (copy relevant fields, reset status)
  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({
      studio_id: studioId,
      name: novoNome,
      event_type: original.event_type,
      event_date: input.data_evento || null,
      status: "rascunho",
      production_phase: "agendado",
      value: original.value,
      paid: 0,
      client_id: clientId || original.client_id,
      pack_id: original.pack_id,
      delivery_deadline_days: original.delivery_deadline_days,
      notes: `Duplicado de: ${original.name}`,
    })
    .select("id, name")
    .single();

  if (error) return JSON.stringify({ erro: error.message });

  // Copy workflows from original
  const { data: workflows } = await supabase
    .from("project_workflows")
    .select("name, status, sort_order, deadline")
    .eq("project_id", original.id);

  if (workflows?.length) {
    const newWorkflows = workflows.map(wf => ({
      project_id: newProject.id,
      studio_id: studioId,
      name: wf.name,
      status: "pendente",
      sort_order: wf.sort_order,
      deadline: wf.deadline,
    }));
    await supabase.from("project_workflows").insert(newWorkflows);
  }

  // Copy locations from original
  const { data: locations } = await supabase
    .from("project_locations")
    .select("name, address, event_time, sort_order")
    .eq("project_id", original.id);

  if (locations?.length) {
    const newLocations = locations.map(loc => ({
      project_id: newProject.id,
      studio_id: studioId,
      name: loc.name,
      address: loc.address,
      event_time: loc.event_time,
      sort_order: loc.sort_order,
    }));
    await supabase.from("project_locations").insert(newLocations);
  }

  return JSON.stringify({
    sucesso: true,
    mensagem: `Projeto "${novoNome}" criado como duplicata de "${original.name}" com ${workflows?.length || 0} etapas de workflow copiadas.`,
    projeto_id: newProject.id,
  });
}
