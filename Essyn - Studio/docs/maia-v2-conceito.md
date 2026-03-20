# MAIA V2 — Conceito Completo

> Documento de especificacao para aprovacao antes da implementacao.
> Criado em: 2026-03-10
> Status: AGUARDANDO APROVACAO

---

## 1. VISAO GERAL DO CONCEITO

### O que muda

A Maia hoje e uma assistente generica — ela responde perguntas e consulta dados, mas nao sabe *onde* o fotografo esta nem *o que e relevante agora*.

**Maia V2** transforma ela em uma assistente contextual inteligente que:
- **Detecta automaticamente** o modulo onde o fotografo esta (sem cliques extras)
- **Adapta sugestoes, alertas e tom** conforme o contexto
- **Tem uma Visao Geral** que resume todo o negocio em um unico lugar
- **Alerta proativamente** sobre problemas antes que virem crises
- **Responde com dados estruturados** (tabelas, cards, timelines — nao so texto)

### O que NAO muda
- A Maia continua sendo UMA assistente (nao sao 6 bots diferentes)
- O chat continua funcionando igual (input de texto, historico)
- A personalidade e o tom profissional PT-BR continuam
- As ferramentas existentes (get_agenda, get_financeiro, etc.) continuam

---

## 2. ARQUITETURA DE CONTEXTOS

### Como funciona

Quando o fotografo abre a Maia, ela detecta de qual pagina ele veio (via URL/rota) e ativa o contexto correspondente. Se ele abre a Maia direto, ela entra no modo **Visao Geral**.

```
URL atual do fotografo  →  Contexto ativado na Maia
─────────────────────────────────────────────────────
/maia                   →  VISAO GERAL
/projetos               →  TRABALHO
/producao               →  TRABALHO
/agenda                 →  TRABALHO
/crm                    →  CLIENTES
/clientes               →  CLIENTES
/portal-cliente         →  CLIENTES
/galeria                →  CLIENTES
/galeria/[id]           →  CLIENTES
/financeiro             →  FINANCEIRO
/pedidos                →  FINANCEIRO
/contratos              →  FINANCEIRO
/whatsapp               →  COMUNICACAO
/time                   →  GESTAO
/relatorios             →  GESTAO
/configuracoes/*        →  CONFIGURACAO
/notificacoes           →  VISAO GERAL
/armazenamento          →  GESTAO
/integracoes            →  CONFIGURACAO
/automacoes             →  CONFIGURACAO
/email-templates        →  COMUNICACAO
```

### Deteccao de contexto

A Maia recebe o `pathname` atual como prop. Nao precisa de clique nem menu extra. O fotografo simplesmente abre a Maia de qualquer pagina e ela ja sabe o contexto.

**Indicador visual:** Um chip discreto no topo do chat mostra o contexto ativo:
```
[icone-briefcase] Trabalho    ← chip com cor do contexto
```

O fotografo pode trocar o contexto manualmente clicando no chip (abre um mini-menu com os 7 contextos), mas 95% das vezes a deteccao automatica resolve.

---

## 3. OS 7 CONTEXTOS

### 3.1 VISAO GERAL (Home da Maia)

**Quando:** Fotografo abre `/maia` diretamente
**Cor do contexto:** Azul (var(--info))
**Icone:** Sparkles

**O que mostra:**

#### Saudacao inteligente
```
Boa noite, Julio.                    ← baseado na hora
Hora de revisar o dia e planejar o amanha.   ← frase contextual
```

Frases por periodo:
- 05h-12h: "Bom dia" + "Vamos comecar o dia com tudo organizado."
- 12h-18h: "Boa tarde" + "Como esta o andamento do dia?"
- 18h-22h: "Boa noite" + "Hora de revisar o dia e planejar o amanha."
- 22h-05h: "Boa noite" + "Descanse bem, amanha a Maia cuida do resto."

#### Bloco "MAIA NOTOU" (Alertas proativos)
Aparece SOMENTE quando ha algo que precisa de atencao. Maximo 3 alertas.

```
┌─────────────────────────────────────────────────┐
│  ⚠  MAIA NOTOU                                 │
│                                                 │
│  • 3 cobrancas vencem essa semana (R$ 4.200)    │
│  • Galeria "Casamento Ana" sem fotos ha 12 dias │
│  • Lead "Marina" sem acao ha 5 dias             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Regras dos alertas:**
| Alerta | Condicao | Prioridade |
|--------|----------|------------|
| Cobrancas vencidas | installments.status = vencido | ALTA |
| Cobrancas vencendo (7d) | installments.due_date <= hoje+7 AND pendente | MEDIA |
| Galerias sem fotos | galleries.photo_count = 0 AND status != agendada AND criada ha >7d | MEDIA |
| Galerias com prazo proximo | delivery_deadline_date <= hoje+5 | ALTA |
| Leads sem acao | leads.next_action_date < hoje OR next_action IS NULL ha >3d | MEDIA |
| Projetos sem equipe | projects.team_ids = [] AND status = confirmado | BAIXA |
| Contratos expirando | contracts.expires_at <= hoje+7 AND status = enviado | ALTA |
| Workflows atrasados | project_workflows.deadline < hoje AND status != concluido | ALTA |
| Eventos amanha sem confirmar | events.start_at = amanha AND status = agendado | MEDIA |

#### Painel de resumo rapido (Cards compactos)
Grid 2x3 com os numeros mais importantes:

```
┌──────────────────┐  ┌──────────────────┐
│  8 Projetos      │  │  R$ 12.400       │
│  ativos          │  │  a receber       │
├──────────────────┤  ├──────────────────┤
│  3 Eventos       │  │  14 Leads        │
│  essa semana     │  │  ativos          │
├──────────────────┤  ├──────────────────┤
│  5 Galerias      │  │  2 Contratos     │
│  em andamento    │  │  pendentes       │
└──────────────────┘  └──────────────────┘
```

Cada card e clicavel — abre o chat com a pergunta correspondente pre-preenchida.

#### Sugestoes contextuais (4 chips)
Baseadas no estado real do negocio:

**Se tem eventos hoje:**
- "Como esta minha agenda hoje?"
- "Resumo financeiro do mes"
- "Projetos em producao"
- "Criar novo projeto" (accent)

**Se nao tem eventos hoje:**
- "Resumo geral do estudio"
- "Proximos eventos"
- "Cobrancas pendentes"
- "Status das galerias"

**Se estudio vazio (onboarding):**
- "O que a Maia pode fazer?"
- "Criar meu primeiro projeto"
- "Cadastrar um cliente"
- "Agendar um evento"

---

### 3.2 TRABALHO (Projetos + Producao + Agenda)

**Quando:** Fotografo esta em `/projetos`, `/producao` ou `/agenda`
**Cor do contexto:** Roxo (#A855F7)
**Icone:** Briefcase

**Alertas especificos:**
- Projetos sem equipe definida
- Workflows com deadline vencido
- Eventos amanha sem status confirmado
- Projetos em rascunho ha mais de 7 dias

**Sugestoes:**
- "Status dos projetos ativos"
- "Workflows atrasados"
- "Agenda da semana"
- "Criar novo projeto" (accent)

**Placeholder do input:**
"Pergunte sobre projetos, producao ou agenda..."

**Ferramentas priorizadas:**
- `get_projetos` (com filtros: ativos, producao, entregues)
- `get_agenda` (hoje, semana, proximos)
- `get_resumo_dia`
- `criar_projeto`
- `criar_evento_agenda`

**Respostas estruturadas:**
Quando a Maia lista projetos, usa cards compactos:

```
┌────────────────────────────────────────────────┐
│ Casamento Ana & Pedro          ● Em producao   │
│ 15 Mar 2026 · Fazenda Boa Vista               │
│ Equipe: Marina, Carlos                         │
│ Producao: 3/5 etapas · Prazo: 20 Abr          │
│                                                │
│ [Ver projeto]  [Ver producao]                  │
└────────────────────────────────────────────────┘
```

Quando lista agenda, usa timeline:

```
  09:00  ● Making of — Casamento Ana (Fazenda Boa Vista)
  14:00  ● Cerimonia — Casamento Ana
  16:00  ● Reuniao com cliente — Studio
```

---

### 3.3 CLIENTES (CRM + Clientes + Portal + Galeria)

**Quando:** Fotografo esta em `/crm`, `/clientes`, `/portal-cliente`, `/galeria`
**Cor do contexto:** Verde (#10B981)
**Icone:** Users

**Alertas especificos:**
- Leads sem acao definida (next_action = null ha >3 dias)
- Leads com next_action_date vencida
- Clientes VIP sem projeto nos ultimos 6 meses
- Galerias prontas mas nao entregues
- Galerias com prazo de entrega proximo
- Clientes inativos com potencial de reativacao

**Sugestoes:**

Se veio de `/crm`:
- "Pipeline de leads atual"
- "Leads sem acao"
- "Leads de alta valor"
- "Cadastrar novo lead" (accent)

Se veio de `/clientes`:
- "Clientes mais rentaveis"
- "Clientes inativos"
- "Historico de projetos por cliente"
- "Cadastrar cliente" (accent)

Se veio de `/galeria`:
- "Galerias pendentes de entrega"
- "Galerias sem fotos"
- "Status das selecoes"
- "Criar galeria" (accent)

Se veio de `/portal-cliente`:
- "Como funciona o portal?"
- "Configurar portal"
- "Personalizar aparencia"
- "Ver estatisticas do portal"

**Placeholder do input:**
"Pergunte sobre clientes, leads ou galerias..."

**Ferramentas priorizadas:**
- `get_clientes` (com busca por nome)
- `get_leads` (com filtros por stage)
- `get_galerias`
- `criar_cliente`

**Respostas estruturadas:**

Pipeline de leads em formato visual:

```
  PIPELINE DE LEADS (14 ativos · R$ 42.500)
  ──────────────────────────────────────────
  Novo (3)        ██████░░░░  R$ 8.500
  Contato (4)     ████████░░  R$ 12.000
  Reuniao (2)     ████░░░░░░  R$ 7.000
  Proposta (3)    ██████░░░░  R$ 9.500
  Negociacao (2)  ████░░░░░░  R$ 5.500
```

Lista de clientes em tabela:

```
  | Cliente          | Projetos | Total gasto  | Status |
  |------------------|----------|--------------|--------|
  | Ana Oliveira     | 3        | R$ 18.500    | VIP    |
  | Pedro Santos     | 2        | R$ 12.000    | Ativo  |
  | Maria Costa      | 1        | R$ 6.500     | Ativo  |
```

---

### 3.4 FINANCEIRO (Financeiro + Pedidos + Contratos)

**Quando:** Fotografo esta em `/financeiro`, `/pedidos`, `/contratos`
**Cor do contexto:** Amarelo/Dourado (#EAB308)
**Icone:** DollarSign

**Alertas especificos:**
- Cobrancas vencidas (quantas e valor total)
- Cobrancas vencendo nos proximos 7 dias
- Contratos expirando sem assinatura
- Pedidos pagos sem producao iniciada
- Margem do mes (receitas - despesas)

**Sugestoes:**

Se veio de `/financeiro`:
- "Resumo financeiro do mes"
- "Cobrancas vencidas"
- "Receitas vs despesas"
- "Registrar pagamento" (accent)

Se veio de `/contratos`:
- "Contratos pendentes de assinatura"
- "Contratos expirando"
- "Historico de contratos assinados"
- "Criar contrato" (accent)

Se veio de `/pedidos`:
- "Pedidos em andamento"
- "Pedidos pendentes de pagamento"
- "Produtos mais vendidos"
- "Criar pedido" (accent)

**Placeholder do input:**
"Pergunte sobre financas, contratos ou pedidos..."

**Ferramentas priorizadas:**
- `get_financeiro` (mes, semana, ano)
- `get_contratos` (novo tool — busca contratos)
- `get_pedidos` (novo tool — busca pedidos)

**Respostas estruturadas:**

Resumo financeiro em card:

```
  ┌─ FINANCEIRO — MARCO 2026 ────────────────────┐
  │                                               │
  │  Recebido     R$ 28.500    ████████████░░  78%│
  │  Pendente     R$ 8.200     ███░░░░░░░░░░░  22%│
  │  Vencido      R$ 3.400     █░░░░░░░░░░░░░   9%│
  │  ─────────────────────────────────────────    │
  │  Despesas     R$ 6.800                        │
  │  Lucro liq.   R$ 21.700                       │
  │                                               │
  │  [Ver financeiro]  [Cobrar vencidas]          │
  └───────────────────────────────────────────────┘
```

---

### 3.5 COMUNICACAO (WhatsApp + Email Templates)

**Quando:** Fotografo esta em `/whatsapp`, `/email-templates`
**Cor do contexto:** Verde claro (#22C55E)
**Icone:** MessageCircle

**Alertas especificos:**
- Templates de email sem configurar
- WhatsApp nao conectado (lembrete)
- Clientes sem comunicacao ha mais de 30 dias

**Sugestoes:**
- "Como configurar WhatsApp?"
- "Criar template de email"
- "Melhores praticas de comunicacao"
- "Clientes sem contato recente"

**Placeholder do input:**
"Pergunte sobre comunicacao e mensagens..."

**Nota:** Como WhatsApp e email ainda sao features "coming soon", a Maia pode orientar sobre configuracao e boas praticas, mas nao executar acoes de envio ainda.

---

### 3.6 GESTAO (Time + Relatorios + Armazenamento)

**Quando:** Fotografo esta em `/time`, `/relatorios`, `/armazenamento`
**Cor do contexto:** Azul escuro (#3B82F6)
**Icone:** BarChart3

**Alertas especificos:**
- Membros da equipe inativos
- Armazenamento acima de 80% do plano
- Relatorios sugeridos baseados nos dados

**Sugestoes:**

Se veio de `/time`:
- "Quem esta mais alocado?"
- "Membros sem projeto ativo"
- "Produtividade da equipe"
- "Convidar membro" (accent)

Se veio de `/relatorios`:
- "Resumo do mes"
- "Comparativo com mes anterior"
- "Projetos mais rentaveis"
- "Exportar dados"

Se veio de `/armazenamento`:
- "Quanto espaco estou usando?"
- "Galerias que mais consomem"
- "Como liberar espaco?"
- "Fazer upgrade" (accent)

**Placeholder do input:**
"Pergunte sobre equipe, relatorios ou armazenamento..."

---

### 3.7 CONFIGURACAO (Settings + Integracoes + Automacoes)

**Quando:** Fotografo esta em `/configuracoes/*`, `/integracoes`, `/automacoes`
**Cor do contexto:** Cinza (#6B7280)
**Icone:** Settings

**Alertas especificos:**
- Perfil do estudio incompleto (campos vazios)
- Plano proximo do limite
- Integracoes recomendadas baseadas no uso

**Sugestoes:**
- "Como configurar meu perfil?"
- "Qual plano e ideal pra mim?"
- "Explicar permissoes de equipe"
- "Configurar workflows"

**Placeholder do input:**
"Pergunte sobre configuracoes do sistema..."

**Comportamento especial:** Neste contexto, a Maia age mais como um guia/tutorial. Ela explica o que cada configuracao faz, recomenda configuracoes baseadas no perfil do estudio, e orienta sobre melhores praticas.

---

## 4. VISAO GERAL — TELA DE EXPLORAR

Alem do chat, a Maia tera uma aba "Explorar" (ja existe como ExploreGrid) que sera completamente redesenhada.

### Design da tela Explorar

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Explorar por area                                      │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ ☀ Visao     │  │ 📋 Trabalho │  │ 👥 Clientes │    │
│  │   Geral     │  │             │  │             │    │
│  │             │  │  8 projetos │  │  23 clientes│    │
│  │  Resumo do  │  │  3 em prod. │  │  14 leads   │    │
│  │  negocio    │  │  2 eventos  │  │  5 galerias │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ 💰 Financ.  │  │ 💬 Comunic. │  │ 📊 Gestao   │    │
│  │             │  │             │  │             │    │
│  │  R$ 12.4k   │  │  WhatsApp   │  │  4 membros  │    │
│  │  pendente   │  │  3 templates│  │  67 GB usado│    │
│  │  3 vencidas │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────┐                                       │
│  │ ⚙ Config.   │                                       │
│  │             │                                       │
│  │  Perfil     │                                       │
│  │  Plano Pro  │                                       │
│  └─────────────┘                                       │
│                                                         │
│  ── Sugestoes rapidas ──                               │
│                                                         │
│  "Resumo do dia"                                       │
│  "Proximos eventos da semana"                          │
│  "Quanto faturei esse mes?"                            │
│  "Leads que preciso acompanhar"                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Comportamento dos cards

Cada card do grid mostra **dados reais em tempo real** (contadores vivos do Supabase).

Ao clicar num card:
1. O contexto da Maia muda para aquele modulo
2. O chat abre com uma pergunta de resumo pre-preenchida
3. A Maia responde com o resumo completo daquele modulo

Exemplo: clicar em "Financeiro" → contexto muda para FINANCEIRO → chat abre com "Resumo financeiro do mes" → Maia responde com card financeiro estruturado.

---

## 5. SISTEMA DE ALERTAS PROATIVOS

### Como funciona

A cada vez que o fotografo abre a Maia, o servidor calcula os alertas ativos baseado nas regras da tabela abaixo. Alertas sao mostrados no bloco "MAIA NOTOU" no topo.

### Tabela completa de alertas

| # | Alerta | Tabela | Condicao SQL | Prioridade | Contexto |
|---|--------|--------|-------------|------------|----------|
| 1 | Cobrancas vencidas | installments | status IN ('pendente','vencido') AND due_date < hoje AND type='receita' | ALTA | Financeiro |
| 2 | Cobrancas vencendo 7d | installments | status='pendente' AND due_date BETWEEN hoje AND hoje+7 AND type='receita' | MEDIA | Financeiro |
| 3 | Contratos expirando | contracts | status='enviado' AND expires_at <= hoje+7 | ALTA | Financeiro |
| 4 | Galerias sem fotos | galleries | photo_count=0 AND status NOT IN ('agendada') AND created_at < hoje-7 | MEDIA | Clientes |
| 5 | Galerias prazo proximo | galleries | delivery_deadline_date <= hoje+5 AND status NOT IN ('entregue','arquivado') | ALTA | Clientes |
| 6 | Leads sem acao | leads | (next_action IS NULL AND created_at < hoje-3) OR next_action_date < hoje | MEDIA | Clientes |
| 7 | Leads alto valor esquecidos | leads | estimated_value >= 5000 AND stage NOT IN ('ganho','perdido') AND updated_at < hoje-5 | ALTA | Clientes |
| 8 | Projetos sem equipe | projects | team_ids = '{}' AND status IN ('confirmado','producao') | BAIXA | Trabalho |
| 9 | Projetos rascunho antigos | projects | status='rascunho' AND created_at < hoje-7 | BAIXA | Trabalho |
| 10 | Workflows atrasados | project_workflows | deadline < hoje AND status != 'concluido' | ALTA | Trabalho |
| 11 | Eventos amanha | events | start_at::date = amanha AND status='agendado' | MEDIA | Trabalho |
| 12 | Armazenamento >80% | studios | storage_used_bytes > plan_limit * 0.8 | BAIXA | Gestao |
| 13 | Pedidos pagos sem producao | orders | status='pago' AND created_at < hoje-3 | MEDIA | Financeiro |
| 14 | Clientes VIP inativos | clients | status='vip' AND id NOT IN (projetos ultimos 180d) | BAIXA | Clientes |

### Regras de exibicao

- **Visao Geral:** Mostra TOP 3 alertas mais prioritarios de TODOS os contextos
- **Contexto especifico:** Mostra TODOS alertas daquele contexto (max 5)
- **Ordenacao:** ALTA > MEDIA > BAIXA, depois por data (mais urgente primeiro)
- **Descartaveis:** O fotografo pode fechar um alerta (dismiss) — salva no localStorage por 24h
- **Formato:** Frase curta + dado numerico (ex: "3 cobrancas vencem essa semana (R$ 4.200)")

---

## 6. RESPOSTAS ESTRUTURADAS

### Tipos de resposta rica

A Maia V2 nao responde so com texto. Ela usa componentes visuais:

#### 6.1 Card de resumo
Para resumos de modulo (financeiro, projetos, etc.)
```
┌─ TITULO DO CARD ──────────────────────┐
│  Metrica 1     Valor 1                │
│  Metrica 2     Valor 2                │
│  Metrica 3     Valor 3                │
│  [Acao 1]  [Acao 2]                   │
└───────────────────────────────────────┘
```

#### 6.2 Tabela de dados
Para listas de entidades (clientes, projetos, leads)
```
| Coluna 1 | Coluna 2 | Coluna 3 | Status |
|----------|----------|----------|--------|
| Dado     | Dado     | Dado     | Badge  |
```

#### 6.3 Timeline
Para agenda e eventos
```
  09:00  ● Titulo do evento — Local
  14:00  ● Titulo do evento — Local
  18:00  ○ Titulo (cancelado)
```

#### 6.4 Barra de progresso
Para producao e workflows
```
  Casamento Ana    ████████░░  4/5 etapas  ● Em dia
  Ensaio Pedro     ███░░░░░░░  2/5 etapas  ● Atrasado
```

#### 6.5 Card de acao
Para sugestoes de acao imediata
```
┌─────────────────────────────────────────┐
│  💡 Sugestao da Maia                    │
│                                         │
│  Voce tem 3 cobrancas vencidas totali-  │
│  zando R$ 4.200. Quer que eu prepare    │
│  um lembrete para enviar aos clientes?  │
│                                         │
│  [Sim, preparar]  [Ver detalhes]        │
└─────────────────────────────────────────┘
```

### Como a Maia escolhe o formato

A API retorna um campo `response_type` junto com o texto:

```typescript
type MaiaResponseType =
  | "text"           // Resposta simples em texto
  | "summary_card"   // Card de resumo com metricas
  | "table"          // Tabela de dados
  | "timeline"       // Timeline de eventos
  | "progress"       // Barras de progresso
  | "action_card"    // Sugestao de acao

interface MaiaResponse {
  type: MaiaResponseType;
  content: string;          // Texto principal
  data?: Record<string, any>; // Dados estruturados para render
  actions?: { label: string; action: string }[]; // Botoes de acao
}
```

---

## 7. NOVAS FERRAMENTAS (TOOLS) NECESSARIAS

### Tools existentes que continuam:
- `get_resumo_dia`
- `get_agenda`
- `get_financeiro`
- `get_projetos`
- `get_clientes`
- `get_leads`
- `get_galerias`
- `criar_projeto`
- `criar_evento_agenda`
- `criar_cliente`

### Tools novos a criar:

| Tool | Descricao | Contexto |
|------|-----------|----------|
| `get_contratos` | Busca contratos com filtros (status, projeto, cliente) | Financeiro |
| `get_pedidos` | Busca pedidos com filtros (status, cliente) | Financeiro |
| `get_equipe` | Lista membros da equipe com alocacao atual | Gestao |
| `get_producao` | Workflows ativos com deadlines e progresso | Trabalho |
| `get_alertas` | Calcula todos alertas proativos ativos | Todos |
| `get_armazenamento` | Uso de storage por bucket e total | Gestao |
| `get_metricas_periodo` | KPIs comparativos (mes atual vs anterior) | Gestao |
| `criar_lead` | Cria novo lead no CRM | Clientes |
| `atualizar_status_projeto` | Muda status de um projeto | Trabalho |
| `registrar_pagamento` | Marca parcela como paga | Financeiro |
| `get_configuracoes` | Retorna configuracoes do estudio para orientar | Config |

### Cada tool recebe `studio_id` automaticamente (via auth)

---

## 8. SYSTEM PROMPT ATUALIZADO

O system prompt da Maia V2 inclui:

```
Voce e a Maia, assistente executiva do estudio "{studioName}".

CONTEXTO ATUAL: {contextName} ({contextDescription})
O fotografo esta na pagina: {currentPath}

Data e hora: {dateTime}

REGRAS:
1. Responda SEMPRE em PT-BR, tom profissional e caloroso
2. Use as ferramentas para buscar dados REAIS antes de responder
3. Adapte suas sugestoes ao contexto atual ({contextName})
4. Quando listar dados, use formato estruturado (tabela, timeline, card)
5. Seja proativa: se notar um problema, mencione antes que perguntem
6. Nunca invente dados — se nao tiver, diga que precisa consultar
7. Respostas concisas — fotografos sao ocupados
8. Formatacao: use negrito para valores, bullet points para listas
9. Moedas sempre em BRL (R$ X.XXX,XX)
10. Datas sempre em formato brasileiro (dd/mm/aaaa)

ALERTAS ATIVOS (mostre se relevante):
{activeAlerts}
```

---

## 9. MUDANCAS NA UI

### 9.1 Header do chat (novo)

```
┌─────────────────────────────────────────────────────┐
│  ✨ Maia                    [Trabalho ▼]  [Explorar]│
│                                                     │
│  Contexto chip      Trocar contexto    Aba explorar │
└─────────────────────────────────────────────────────┘
```

- **Chip de contexto:** Mostra contexto atual com icone e cor. Clicavel para trocar.
- **Botao Explorar:** Alterna entre chat e tela de explorar (grid de areas).

### 9.2 Bloco de alertas (novo)

Aparece entre o header e o chat, so quando ha alertas.
Background sutil amarelo/laranja com borda.
Dismissivel por alerta individual.

### 9.3 Sugestoes contextuais (melhorado)

Em vez de 4 sugestoes genericas, agora sao 4 sugestoes **especificas do contexto ativo**, com dados reais quando possivel.

Formato: chips com texto + contador opcional
```
[📊 Resumo do mes]  [⚠ 3 vencidas]  [📋 5 projetos ativos]  [+ Novo projeto]
```

### 9.4 Respostas ricas (novo)

Mensagens da Maia podem conter componentes visuais alem de texto:
- Cards com metricas
- Tabelas com dados
- Timelines com eventos
- Barras de progresso
- Botoes de acao

### 9.5 Input contextual (melhorado)

Placeholder do input muda conforme o contexto:
- Visao Geral: "Pergunte qualquer coisa a Maia..."
- Trabalho: "Pergunte sobre projetos, producao ou agenda..."
- Clientes: "Pergunte sobre clientes, leads ou galerias..."
- etc.

---

## 10. FLUXO TECNICO

### Abertura da Maia

```
1. Fotografo abre /maia (ou painel lateral)
         ↓
2. Server Component:
   - Detecta pathname de origem (referer ou query param)
   - Busca dados do estudio
   - Calcula alertas ativos (consultas paralelas)
   - Monta MaiaContext com alertas + metricas
         ↓
3. Client Component:
   - Recebe contexto + alertas
   - Determina contextoAtivo via pathname
   - Renderiza UI:
     a) Header com chip de contexto
     b) Bloco de alertas (se houver)
     c) Saudacao + cards de resumo (se Visao Geral)
     d) Sugestoes contextuais
     e) Chat (se tem mensagens)
     f) Input com placeholder contextual
```

### Envio de mensagem

```
1. Fotografo digita mensagem
         ↓
2. POST /api/maia/chat
   Body: { messages[], context: "trabalho", pathname: "/projetos" }
         ↓
3. Server:
   - Monta system prompt com contexto
   - Injeta alertas ativos no prompt
   - Chama Claude com tools
   - Tool loop (busca dados reais)
   - Retorna resposta + tipo + dados estruturados
         ↓
4. Client:
   - Renderiza resposta conforme tipo
   - Atualiza sugestoes contextuais
   - Scroll para ultima mensagem
```

---

## 11. TELA "VISAO GERAL" DETALHADA

Quando o fotografo clica em "Explorar" na Maia, ele ve um painel completo do negocio.

### Secao 1: Hoje (sempre visivel)

```
┌─ HOJE — Segunda, 10 Mar 2026 ─────────────────────────┐
│                                                         │
│  2 eventos hoje                                         │
│  09:00 Making of — Casamento Ana (Fazenda Boa Vista)   │
│  14:00 Cerimonia — Casamento Ana                        │
│                                                         │
│  Financeiro: R$ 2.100 a receber hoje                    │
│  Producao: 2 workflows com prazo hoje                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Secao 2: Explorar por area (grid clicavel)

7 cards (descrito na secao 4 acima) com dados reais.

### Secao 3: Resumo da semana

```
┌─ SEMANA ───────────────────────────────────────────────┐
│                                                         │
│  Eventos: 5 agendados (2 casamentos, 1 ensaio,         │
│           1 reuniao, 1 entrega)                         │
│  Financeiro: R$ 8.400 a receber                         │
│  Producao: 3 deadlines essa semana                      │
│  Leads: 2 follow-ups agendados                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Secao 4: Sugestoes rapidas (texto clicavel)

4 sugestoes em formato de texto simples (nao chips), clicaveis:
- "Resumo do dia"
- "Proximos eventos da semana"
- "Quanto faturei esse mes?"
- "Leads que preciso acompanhar"

---

## 12. IMPLEMENTACAO — PLANO DE EXECUCAO

### Fase 1: Infraestrutura (Base)
1. Criar sistema de deteccao de contexto (pathname → context mapping)
2. Criar sistema de alertas (queries paralelas no server)
3. Atualizar system prompt com contexto dinamico
4. Criar novos tools (get_contratos, get_pedidos, get_equipe, etc.)

### Fase 2: UI do Chat
5. Redesenhar header do chat (chip de contexto + botao explorar)
6. Implementar bloco de alertas "MAIA NOTOU"
7. Sugestoes contextuais dinamicas
8. Input com placeholder contextual

### Fase 3: Respostas Estruturadas
9. Criar componentes de resposta rica (SummaryCard, DataTable, Timeline, ProgressBar, ActionCard)
10. Atualizar API para retornar tipo de resposta + dados estruturados
11. Renderizar respostas ricas no chat

### Fase 4: Tela Explorar
12. Redesenhar ExploreGrid com dados reais
13. Secao "Hoje"
14. Secao "Semana"
15. Grid de areas com contadores vivos

### Fase 5: Refinamento
16. Testes de todas as combinacoes de contexto
17. Performance (cache de alertas, lazy loading)
18. Animacoes e transicoes suaves
19. Responsividade mobile

---

## 13. MAPEAMENTO COMPLETO DE MODULOS DO ESSYN

Para referencia — tudo que a Maia precisa conhecer:

### TRABALHO
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| Projetos | /projetos | Lista projetos, filtros, wizard de criacao, status tracking |
| Producao | /producao | Board de workflows, assignment, deadlines, KPIs |
| Agenda | /agenda | Calendario mensal, eventos, timeline do dia, checklist |

### CLIENTES
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| CRM | /crm | Pipeline Kanban de leads, conversao, fontes |
| Clientes | /clientes | Lista clientes, status VIP, historico, revenue |
| Portal do Cliente | /portal-cliente | Config do portal publico, branding, preview |
| Galeria | /galeria | Colecoes de fotos, status workflow, entrega |
| Galeria Detalhe | /galeria/[id] | 12 abas: fotos, acesso, downloads, branding, etc |

### FINANCEIRO
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| Financeiro | /financeiro | Receitas/despesas, cobrancas, fluxo de caixa |
| Pedidos | /pedidos | Pedidos de produtos fisicos, tracking |
| Contratos | /contratos | Criar/enviar/assinar contratos digitais |

### COMUNICACAO
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| WhatsApp | /whatsapp | Integracao WhatsApp Business (coming soon) |
| Email Templates | /email-templates | Templates de email customizaveis |

### GESTAO
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| Time | /time | Membros da equipe, roles, convites |
| Relatorios | /relatorios | Dashboards e metricas (coming soon) |
| Armazenamento | /armazenamento | Uso de storage, breakdown por bucket |
| Notificacoes | /notificacoes | Central de notificacoes do sistema |

### CONFIGURACAO
| Pagina | Rota | Funcionalidade principal |
|--------|------|-------------------------|
| Configuracoes | /configuracoes | Hub: conta, equipe, producao, financeiro, sistema |
| Assinatura | /configuracoes/assinatura | Plano, limites, add-ons, faturas |
| Usuarios | /configuracoes/usuarios | Permissoes, convites, matrix de acesso |
| Templates | /configuracoes/templates | Workflows de producao, categorias |
| Equipamentos | /configuracoes/equipamentos | Inventario cameras/lentes, manutencao |
| Financeiro Config | /configuracoes/financeiro-config | Categorias, centros custo, metodos pgto |
| Integracoes | /integracoes | 9 integracoes (Google Cal, Stripe, etc) |
| Automacoes | /automacoes | Regras automaticas (coming soon) |

---

## 14. CONFIGURACOES DETALHADAS (Que a Maia precisa orientar)

### Conta
- Nome do estudio, CNPJ, email, telefone, website, endereco completo
- Alterar senha (validacao: 8+ chars, 1 maiuscula, 1 numero)

### Equipe & Permissoes
- 6 roles: admin, fotografo, editor, atendimento, financeiro, contador
- Matrix de acesso: 9 modulos x 4 roles
- Convite por email com role pre-definido
- Ativar/desativar membros

### Producao
- Workflow templates: nome, categoria, cor, etapas, duracao
- Categorias: casamento, ensaio, corporativo, album, geral
- 8 cores preset + hex customizado

### Packs de Servico
- Nome, valor, descricao, duracao, fotografos, min imagens
- Metodo de entrega: galeria online, pendrive, download, impresso
- Items inclusos (lista dinamica)

### Financeiro
- 14 categorias (6 receita + 8 despesa) com cores
- 4 centros de custo (projeto, equipe, operacao, marketing)
- 5 metodos de pagamento
- Conciliacao bancaria (coming soon)

### Equipamentos
- 5 categorias: camera, lente, iluminacao, acessorio, audio
- 4 condicoes: excelente, bom, regular, ruim
- Registro de manutencao: revisao, calibracao, reparo

### Planos e Assinatura
- Core: R$ 49/mes — 5 projetos, 1 usuario, 10 GB
- Pro: R$ 129/mes — 20 projetos, 3 usuarios, 50 GB
- Studio Pro: R$ 249/mes — ilimitado, 10 usuarios, 100 GB
- Add-ons: Storage extra, assinatura digital, WhatsApp API, dominio custom

---

## 15. RESUMO EXECUTIVO

### O que estamos construindo
Uma Maia que **sabe onde o fotografo esta** e **adapta tudo automaticamente** — alertas, sugestoes, tom, formato de resposta. Zero configuracao manual.

### Diferenciais vs. referencia
| Referencia | Essyn |
|------------|-------|
| 6 modos manuais | 7 contextos automaticos |
| Selecao manual | Deteccao por URL |
| Badges decorativos | Indicador sutil |
| Grid de 8 areas | Tela "Explorar" com dados reais |
| Respostas em texto | Respostas estruturadas (cards, tabelas, timelines) |
| Alertas genericos | 14 tipos de alerta com prioridade calculada |

### Metricas de sucesso
- Fotografo encontra informacao em <2 interacoes
- Alertas proativos evitam cobrancas perdidas
- Tempo medio no app diminui (informacao mais acessivel)
- Maia usada diariamente (nao so quando tem duvida)

---

> **PROXIMO PASSO:** Julio revisa e aprova este documento.
> Apos aprovacao, inicio implementacao fase por fase.
