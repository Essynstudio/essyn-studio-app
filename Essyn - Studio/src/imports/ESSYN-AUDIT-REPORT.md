# ESSYN Studio - Auditoria Master do Protótipo Funcional (React)

**Data:** 4 de Março de 2026
**Escopo:** Codebase React completo (`/src/app/`) - 17 abas/módulos + Marketing V4 + Onboarding
**Auditor:** AI AUDITOR MASTER

---

## 0) Assunções

1. O protótipo é avaliado como **implementação React funcional** (não Figma estático) — cada componente renderizado é a fonte de verdade.
2. "Pronto para dev" neste contexto = pronto para testes com utilizadores e investidores, sem backend real (dados mock + localStorage).
3. O público-alvo primário é o fotógrafo solo/pequeno estúdio brasileiro que precisa de fluxo rápido no dia-a-dia.
4. Componentes shadcn/ui presentes em `/src/app/components/ui/` mas não importados por nenhum módulo funcional são considerados dead code.
5. O padrão `useDk()` é a única forma aprovada de consumir dark mode nos ficheiros de conteúdo — `useDarkMode` directo é tolerado apenas nos componentes primitivos de `/ui/`.
6. As regras de zero-transparência e cores Apple HIG são requisitos inegociáveis.
7. A landing page V4 (marketing) opera com regras visuais próprias, mas deve manter consistência com o design system.

---

## 1) Diagnóstico Executivo

O ESSYN Studio é um protótipo de **qualidade excepcional para a sua fase** — 17 módulos funcionais, design system com 13+ componentes reutilizáveis, pipeline de compliance de cores, motion tokens centralizados, e um fluxo inteligente de criação de projetos (Smart Defaults) que é diferenciador. A linguagem visual Apple Premium está bem implementada com tokens partilhados (`C`, `SPACE`, `RADIUS`, `TYPE`) e padrão modal consistente.

**O que está excelente:** Arquitectura de rotas limpa (React Router data mode), barrel export apple-kit, fluxo Projeto→Financeiro→Produção com syncs automáticos, KPI cards com loading states, empty states nos módulos core, menu lateral com paywall gates.

**O que está fraco:** **Dark mode tem cobertura de ~60%** — 6 páginas inteiras (Automações, Integrações, Contratos, WhatsApp, Pedidos, Agenda) não têm qualquer suporte. **50+ componentes UI usam `useDarkMode` directamente** em vez do hook centralizado `useDk()`, violando a regra de indireção. **~20 ficheiros de dead code** (shadcn base + componentes galeria v1 + utilitários obsoletos) aumentam o bundle e confundem o audit trail.

**Riscos:** (1) Dark mode activado por utilizador numa dessas 6 páginas = experiência visual quebrada; (2) Dead code causa confusão na manutenção e pode introduzir bugs por referência acidental; (3) NovoProjetoModal (~1940 linhas) sem dark mode é o 2.º componente mais usado — impacto alto.

---

## 2) Score Geral por Rubrica

| Rubrica | Score | Justificativa |
|---------|-------|---------------|
| **A) Produto** | **8.5/10** | Escopo claro para fotógrafos, hierarquia lógica (Operação/Gestão/Sistema), Smart Defaults é inovador. Falta: onboarding in-app mais granular por módulo. |
| **B) UX** | **7.5/10** | Tarefas-chave em ≤3 passos no core (Projeto, Financeiro). Empty states presentes. Falta: estados de erro consistentes, loading states em 4+ módulos, bulk actions nas páginas standalone. |
| **C) UI/Visual** | **8.0/10** | Apple HIG seguido com rigor — tipografia, spacing, border-radius corretos. Zero-transparency respeitado no app (exceção justificada: Canvas no HeroBirds). Falta: dark mode em 6 páginas. |
| **D) Design System** | **7.5/10** | 13+ componentes no apple-kit, tokens C/SPACE/RADIUS/TYPE, compliance gate com 220+ cores proibidas. Falta: hook `useDk()` não adotado em 50+ primitivos UI, ~20 componentes shadcn dead code. |
| **E) Copy/Conteúdo** | **8.0/10** | Labels claros, tom profissional, terminologia pt-BR consistente. Microcopy nos empty states é bom. Falta: mensagens de erro genéricas em alguns modais, confirmação de ações destrutivas inconsistente. |
| **F) Handoff Dev** | **7.0/10** | Componentes bem nomeados, rotas lógicas, barrel exports. Falta: dead code confunde devs, NovoProjetoModal monolítico (1940 linhas), 6 páginas standalone (Automações, Contratos, etc.) inline no ficheiro page sem componente de conteúdo separado. |

**Score Global: 7.75/10**

---

## 3) Mapa do Produto

| # | Aba | Objetivo | Tarefas-Chave | Dark Mode | Componente Content |
|---|-----|----------|---------------|-----------|-------------------|
| 1 | Menu Lateral | Navegação principal + Maia AI | Navegar, colapsar, paywall gate, Maia toggle | SIM | `Sidebar.tsx` + `sidebar-config.tsx` |
| 2 | Dashboard | Visão geral diária | Ver KPIs, ações financeiras, timeline hoje, sugestões | PARCIAL* | `DashboardContent.tsx` |
| 3 | Produção | Radar de trabalhos | Filtrar por estágio, mover trabalhos, bulk actions | PARCIAL* | `ProducaoRadarContent.tsx` |
| 4 | Agenda | Calendário de eventos | Ver mês/semana/dia, criar evento, deep link | NAO | `AgendaContent.tsx` |
| 5 | Galeria | Gestão de coleções | Listar, filtrar, criar, detail view | PARCIAL* | `GaleriaContentApple.tsx` |
| 6 | Pedidos | Loja de prints | Ver pedidos, filtrar status, detalhe, actions | NAO | Inline `PedidosPage.tsx` |
| 7 | WhatsApp | Chat integrado | Conectar QR, enviar/receber, templates | NAO | Inline `WhatsAppPage.tsx` |
| 8 | Projetos | CRUD de projetos | Listar, criar (Smart Defaults), drawer tabs | SIM | `ProjetosContent.tsx` |
| 9 | Financeiro | Fluxo de caixa | Subnav 7 tabs, parcelas, cobranças, relatórios | SIM | `FinanceiroHojeContent.tsx` + 7 sub |
| 10 | CRM | Pipeline de leads | Kanban, drag-move, detail modal, filtros | SIM | `CrmPipelineContent.tsx` |
| 11 | Clientes | Base de clientes | Listar, buscar, perfil, tags | SIM | `ClientesContent.tsx` |
| 12 | Time | Equipa/colaboradores | Listar membros, roles, disponibilidade | SIM | `EquipaContent.tsx` |
| 13 | Relatórios | Analytics | KPIs, gráficos Recharts, tabelas | SIM | Inline `RelatoriosPage.tsx` |
| 14 | Contratos | Documentos legais | Templates, criar, assinar, preview | NAO | Inline `ContratosPage.tsx` |
| 15 | Automações | Workflow rules | Templates, toggle on/off, log, editor | NAO | Inline `AutomacoesPage.tsx` |
| 16 | Integrações | Third-party | Conectar/desconectar, config, API keys | NAO | Inline `IntegracoesPage.tsx` |
| 17 | Configurações | Settings gerais | Sub-secções, perfil, billing, permissões | PARCIAL* | `ConfiguracoesContent.tsx` |

*PARCIAL = usa `useDarkMode` directo em vez de `useDk()`

---

## 4) Auditoria por Aba

### 4.1) Menu Lateral (Sidebar)

**Objetivo:** Navegação principal com agrupamentos lógicos, paywall gates, e acesso à IA Maia.

**Tarefas-chave:** Navegar entre módulos, colapsar/expandir, ver badges de contagem, aceder Maia, ver itens bloqueados.

**Fluxos entre abas:** Sidebar → qualquer módulo; Sidebar → Maia Panel (overlay).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P1 | `Sidebar.tsx` | Usa `useDarkMode` directo (L7) em vez de `useDk()` | Viola padrão de indireção centralizada | Migrar para `useDk()` |
| P1 | `NavItem.tsx` | Usa `useDarkMode` directo (L5) | Idem | Migrar para `useDk()` |
| P2 | `sidebar-config.tsx` | Ícone `Clapperboard` para Produção pode confundir (associado a vídeo) | Vídeo foi removido do produto | Trocar para ícone mais fotografia (ex: `Layers`, `ListChecks`) |
| P2 | `sidebar.tsx` (lowercase) | Ficheiro shadcn com 700+ linhas, **zero importações** no código funcional | Dead code, aumenta bundle | Eliminar ficheiro |

**Recomendações:** Unificar dark mode via `useDk()` nos 5 componentes de shell (Sidebar, NavItem, Topbar, AppShell, ContentSlot).

---

### 4.2) Dashboard

**Objetivo:** Visão 360 do dia — KPIs, ações pendentes, timeline, sugestões da IA.

**Tarefas-chave:** Ver métricas, executar ações financeiras rápidas, navegar para projetos, receber push notifications.

**Fluxos:** Dashboard → Projetos (deep link), Dashboard → Financeiro (cobrar), Dashboard → Agenda (agendar), Dashboard → Galeria (enviar fotos).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P1 | `DashboardContent.tsx` L47 | `import { useDarkMode } from "../ui/DarkModeProvider"` | Viola padrão `useDk()` — dark mode manual com mapeamento incompleto | Migrar para `useDk()` |
| P2 | `DashboardPage.tsx` | Mock push order hardcoded com timer 8s — pode confundir em demo | UX de demo inconsistente | Tornar configurável ou mover para flag de demo |
| P2 | `NotificationsWidget.tsx` | Usa `WidgetEmptyState` — bom padrão | (positivo) | — |

---

### 4.3) Produção

**Objetivo:** Radar de trabalhos de edição por estágio (importar, selecionar, editar, entregar, etc.).

**Tarefas-chave:** Ver trabalhos por estágio, mover entre estágios, bulk actions, filtrar, detalhe.

**Fluxos:** Produção ← Projetos (via addTrabalho sync), Produção → Galeria (upload final).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 (RESOLVIDO) | `ProducaoRadarContent.tsx` | Crash por dados stale `tipo: "video"` no localStorage — fix aplicado com `safeGetTipo()` | Crash resolvido | Manter fix + adicionar teste |
| P1 | `ProducaoRadarContent.tsx` L67 | `import { useDarkMode } from "../ui/DarkModeProvider"` | Viola padrão `useDk()` | Migrar |
| P2 | `productionStore.ts` | Sanitização de tipos inválidos funciona — bom padrão defensivo | (positivo) | — |

---

### 4.4) Agenda

**Objetivo:** Calendário visual de sessões fotográficas, deadlines, entregas.

**Tarefas-chave:** Ver mês/semana/dia, criar evento, deep link de outras abas, ver conflitos.

**Fluxos:** Agenda ← Dashboard (deep link), Agenda ← Projetos (data de sessão).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `AgendaContent.tsx` | **Zero suporte a dark mode** — nenhuma referência a `isDark`, `useDk`, ou `useDarkMode` | Ecrã completamente branco em dark mode | Implementar dark mode via `useDk()` |
| P2 | `AgendaContent.tsx` | Deep link via searchParams funcional — bom padrão | (positivo) | — |

---

### 4.5) Galeria

**Objetivo:** Gestão de coleções fotográficas, proofing, entrega ao cliente.

**Tarefas-chave:** Listar coleções, criar coleção, ver detalhe, analytics, partilhar.

**Fluxos:** Galeria ← Projetos (TabGaleria), Galeria → Client Gallery (portal público).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P1 | `galeria/` (v1) | 3 ficheiros dead code: `CollectionActionsMenu.tsx`, `ExcluirColecaoModal.tsx`, `GaleriaConfigDrawer.tsx` — zero importações | Confusão, bundle bloat | Eliminar |
| P2 | `galeria-v2/` | Boa implementação com ViewModeSwitcher, MasonryView, SmartFilters — usa `useDk()` no ViewModeSwitcher | (positivo) | — |
| P2 | `GaleriaPage.tsx` | Mock data inline com URLs Unsplash hardcoded | Manutenção difícil | Extrair para ficheiro de dados mock |

---

### 4.6) Pedidos

**Objetivo:** Gestão de pedidos da loja de prints do fotógrafo.

**Tarefas-chave:** Ver pedidos, filtrar por status, detalhe, alterar status, exportar.

**Fluxos:** Pedidos ← Dashboard (push notification), Pedidos ← Galeria (pedido de cliente).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `PedidosPage.tsx` | **Zero dark mode** — todo o conteúdo inline sem `useDk()` | Ecrã quebrado em dark mode | Extrair `PedidosContent.tsx`, implementar `useDk()` |
| P1 | `PedidosPage.tsx` | Conteúdo 100% inline no ficheiro page (~800 linhas estimadas) | Não segue padrão de separação Page/Content | Extrair componente `PedidosContent.tsx` |
| P2 | `PedidosPage.tsx` L29 | `statusConfig` usa cores hardcoded `#FFF0DC` fora da paleta Apple HIG | Inconsistência de design system | Usar tokens de `C` (ex: `C.warningBg`) |

---

### 4.7) WhatsApp

**Objetivo:** Chat business integrado com templates e QR login.

**Tarefas-chave:** Conectar via QR, enviar mensagens, usar templates, ver histórico.

**Fluxos:** WhatsApp ← CRM (contactar lead), WhatsApp ← Projetos (comunicar cliente).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `WhatsAppPage.tsx` | **Zero dark mode** — conteúdo inline completo | Ecrã quebrado em dark mode | Implementar `useDk()` |
| P1 | `WhatsAppPage.tsx` | Importa `Video` do lucide-react (L18) | Referência a vídeo ainda presente após remoção | Remover import não utilizado |
| P1 | `WhatsAppPage.tsx` | Conteúdo inline monolítico | Não segue padrão Page/Content | Extrair `WhatsAppContent.tsx` |

---

### 4.8) Projetos

**Objetivo:** CRUD central — criação inteligente (3 campos → sistema completo), drawer com 5 tabs.

**Tarefas-chave:** Criar projeto (Smart Defaults), editar, ver timeline, gerir financeiro, produção, galeria.

**Fluxos:** Projetos → Financeiro (upsertPaymentPlan), Projetos → Produção (addTrabalho), Projetos → Galeria.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P1 | `NovoProjetoModal.tsx` | **Zero dark mode** (~1940 linhas, 2.º componente mais usado) | Modal inteiro branco em dark mode | Implementar `useDk()` — prioridade alta pela frequência de uso |
| P1 | `NovoProjetoModal.tsx` | Ficheiro monolítico de 1940 linhas | Manutenção e review muito difíceis | Extrair sub-componentes (StepIndicator, EventTypeChips, CollapsibleSection, etc.) |
| P1 | `financeiro-modals.tsx` L251 | Modais usam `bg-white` hardcoded, sem dark mode | Modais portal brancos em dark mode | Implementar `useDk()` |
| P2 | `ProjetosContent.tsx` | Usa `useDk()` correctamente — bom padrão | (positivo) | — |
| P2 | `smartDefaults.ts` | Motor de Smart Defaults limpo e extensível | (positivo — diferenciador de produto) | — |

---

### 4.9) Financeiro

**Objetivo:** Fluxo de caixa completo com 7 sub-abas (Hoje, Receber, Pagar, Caixa, Cobrança, Fiscal, Relatórios, Config).

**Tarefas-chave:** Ver resumo financeiro, criar parcelas, cobrar, conciliar, gerar NF, relatórios.

**Fluxos:** Financeiro ← Projetos (payment plan sync), Financeiro → Agenda (deadlines).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P2 | Todos os sub-módulos | Todos usam `useDk()` — **melhor exemplo de dark mode no projeto** | (positivo — referência para outros módulos) | — |
| P2 | `FinanceiroSubnav.tsx` | Subnav segmented funcional com 7 tabs | (positivo) | — |
| P2 | `CriarParcelasModal.tsx` | Usa `useDk()`, `role="dialog"`, ESC close — compliant | (positivo) | — |

---

### 4.10) CRM

**Objetivo:** Pipeline de leads estilo Kanban.

**Tarefas-chave:** Ver pipeline, mover leads entre estágios, criar lead, detalhe, filtros.

**Fluxos:** CRM → Projetos (converter lead), CRM → WhatsApp (contactar).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P2 | `CrmPipelineContent.tsx` | Usa `useDk()` correctamente, modais com `role="dialog"` | (positivo) | — |
| P2 | `CrmPipelineContent.tsx` | Ficheiro grande (~1400 linhas estimadas) | Considerar split em sub-componentes | Avaliar split |

---

### 4.11) Clientes

**Objetivo:** Base de dados de clientes do fotógrafo.

**Tarefas-chave:** Listar, buscar, ver perfil, tags, histórico.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P2 | `ClientesContent.tsx` | Usa `useDk()` correctamente | (positivo) | — |

---

### 4.12) Time

**Objetivo:** Gestão de membros da equipa, roles, disponibilidade.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P2 | `EquipaContent.tsx` | Usa `useDk()` correctamente | (positivo) | — |
| P2 | Rota `/equipa` | Redirect legacy para `/time` funcional | (positivo) | — |

---

### 4.13) Relatórios

**Objetivo:** Analytics completo com gráficos Recharts.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P2 | `RelatoriosPage.tsx` | Usa `useDk()` correctamente, **sem linearGradient/defs** em Recharts | (positivo — compliant) | — |
| P2 | `RelatoriosPage.tsx` | Conteúdo inline no page (~800 linhas) | Padrão menos ideal mas funcional | Considerar extrair `RelatoriosContent.tsx` |

---

### 4.14) Contratos

**Objetivo:** Templates de contratos, criação, assinatura digital mock.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `ContratosPage.tsx` | **Zero dark mode** | Ecrã quebrado em dark mode | Implementar `useDk()` |
| P1 | `ContratosPage.tsx` | Conteúdo inline monolítico (estimado 900+ linhas) | Extrair `ContratosContent.tsx` | Separar |
| P2 | `ContratosPage.tsx` | `role="dialog"` presente em modais — bom | (positivo) | — |

---

### 4.15) Automações

**Objetivo:** Builder visual de regras de automação (trigger → condition → action).

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `AutomacoesPage.tsx` | **Zero dark mode** | Ecrã quebrado em dark mode | Implementar `useDk()` |
| P1 | `AutomacoesPage.tsx` | Conteúdo inline monolítico | Extrair `AutomacoesContent.tsx` | Separar |

---

### 4.16) Integrações

**Objetivo:** Gestão de integrações third-party.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P0 | `IntegracoesPage.tsx` | **Zero dark mode** | Ecrã quebrado em dark mode | Implementar `useDk()` |
| P1 | `IntegracoesPage.tsx` | Conteúdo inline monolítico | Extrair `IntegracoesContent.tsx` | Separar |

---

### 4.17) Configurações

**Objetivo:** Settings centrais — perfil, billing, permissões, templates, equipamentos.

**Achados:**

| Prioridade | Componente | Evidência | Impacto | Correção |
|------------|-----------|-----------|---------|----------|
| P1 | `ConfiguracoesContent.tsx` L54 | Usa `useDarkMode` directo em vez de `useDk()` | Viola padrão de indireção | Migrar para `useDk()` |
| P1 | `UsuariosPermissoesContent.tsx` | Importa de `../ui/dialog` e `../ui/select` (shadcn) em vez de usar apple-kit | Inconsistência de design system | Migrar para AppleModal + componentes custom |
| P1 | `AssinaturaFaturasContent.tsx` | Importa de `../ui/alert-dialog` e `../ui/sheet` (shadcn) | Idem | Migrar para apple-kit |

---

## 5) Inconsistências do Design System (Priorizado)

### P0 — Bloqueante

| # | Issue | Ficheiros Afetados | Fix |
|---|-------|--------------------|-----|
| 1 | **6 páginas sem qualquer dark mode** | `AgendaContent`, `PedidosPage`, `WhatsAppPage`, `ContratosPage`, `AutomacoesPage`, `IntegracoesPage` | Implementar `useDk()` em cada |
| 2 | **NovoProjetoModal sem dark mode** (~1940 linhas, muito usado) | `NovoProjetoModal.tsx` | Implementar `useDk()` |

### P1 — Alto Impacto

| # | Issue | Ficheiros Afetados | Fix |
|---|-------|--------------------|-----|
| 3 | **50+ componentes UI usam `useDarkMode` directo** em vez de `useDk()` | Todos os primitivos em `/ui/` (lista completa abaixo) | Migrar import para `useDk()` |
| 4 | **Dead code — ficheiros sem importações** | `sidebar.tsx` (lowercase/shadcn), `MaiaInlineToggle.tsx`, `site-prefix.tsx`, `proofing-toolbar.tsx`, `CollectionActionsMenu.tsx`, `ExcluirColecaoModal.tsx`, `GaleriaConfigDrawer.tsx` | Eliminar |
| 5 | **Shadcn base components usados apenas internamente** | `dialog.tsx`, `sheet.tsx`, `select.tsx`, `alert-dialog.tsx`, `separator.tsx`, `input.tsx`, `tooltip.tsx`, `skeleton.tsx`, `label.tsx`, `form.tsx`, `toggle.tsx` + mais | Auditar e eliminar os não utilizados |
| 6 | **financeiro-modals.tsx** usa `bg-white` hardcoded | `financeiro-modals.tsx` L251, L264, L274 | Implementar `useDk()` |
| 7 | **PedidosPage** usa cores fora da paleta Apple HIG | `PedidosPage.tsx` L29 (`#FFF0DC`, `#E8EFE5`) | Mapear para `C.warningBg`, `C.successBg` |
| 8 | **WhatsAppPage** importa `Video` de lucide-react | `WhatsAppPage.tsx` L18 | Remover import |

### P2 — Polimento

| # | Issue | Ficheiros Afetados | Fix |
|---|-------|--------------------|-----|
| 9 | `Clapperboard` ícone para Produção associado a vídeo | `sidebar-config.tsx` L70 | Trocar para ícone fotografia |
| 10 | 6 páginas com conteúdo inline monolítico | Pedidos, WhatsApp, Contratos, Automações, Integrações, Relatórios | Extrair `*Content.tsx` |
| 11 | HeroBirds.tsx usa `rgba()` (Canvas) | `HeroBirds.tsx` L152, L200, L207, L352 | Aceitável em Canvas — documentar como exceção |
| 12 | `DashboardPage.tsx` mock push order hardcoded | `DashboardPage.tsx` L24-46 | Tornar configurável com flag |

### Lista completa de ficheiros UI com `useDarkMode` directo (P1-#3):

```
NavItem.tsx, Sidebar.tsx (uppercase), Topbar.tsx, ContentSlot.tsx, AppShell.tsx,
tag-pill.tsx, status-badge.tsx, kpi-card.tsx, filter-chip.tsx, alert-banner.tsx,
quick-actions-bar.tsx, bulk-actions-bar.tsx, action-row-item.tsx, row-select-checkbox.tsx,
type-badge.tsx, production-stage-badge.tsx, workflow-progress-pill.tsx,
production-action-row-item.tsx, dashboard-kpi-grid.tsx, today-timeline-item.tsx,
dashboard-suggestion-card.tsx, activity-log-item.tsx, availability-pill.tsx,
gallery-privacy-badge.tsx, gallery-status-badge.tsx, collection-card.tsx,
gallery-metric-pill.tsx, lead-stage-badge.tsx, next-action-pill.tsx, lead-source-tag.tsx,
activity-timeline-item.tsx, pipeline-stage-header.tsx, lead-card.tsx, settings-card.tsx,
settings-section-header.tsx, permission-role-badge.tsx, NotificationCenter.tsx,
widget-card.tsx, section-header.tsx, list-row.tsx, action-pill.tsx, header-widget.tsx,
apple-table.tsx, apple-modal.tsx, apple-drawer.tsx, gallery-row-item.tsx,
DarkModeToggle.tsx, ProducaoRadarContent.tsx, DashboardContent.tsx, MaiaFocusChat.tsx,
ConfiguracoesContent.tsx
```

**Total: 51 ficheiros**

---

## 6) Plano de Correção por Sprint

### Sprint 1 — P0 Bloqueantes (5-7 dias)

| Task | Ficheiros | Esforço |
|------|-----------|---------|
| 1.1 Implementar `useDk()` no `NovoProjetoModal.tsx` | 1 ficheiro (1940 linhas) | 4h |
| 1.2 Implementar `useDk()` no `AgendaContent.tsx` | 1 ficheiro | 2h |
| 1.3 Implementar `useDk()` no `PedidosPage.tsx` | 1 ficheiro | 2h |
| 1.4 Implementar `useDk()` no `WhatsAppPage.tsx` | 1 ficheiro | 3h |
| 1.5 Implementar `useDk()` no `ContratosPage.tsx` | 1 ficheiro | 2h |
| 1.6 Implementar `useDk()` no `AutomacoesPage.tsx` | 1 ficheiro | 2h |
| 1.7 Implementar `useDk()` no `IntegracoesPage.tsx` | 1 ficheiro | 2h |
| 1.8 Implementar `useDk()` no `financeiro-modals.tsx` | 1 ficheiro | 1h |

**Total Sprint 1: ~18h**

### Sprint 2 — P1 Alto Impacto (5-7 dias)

| Task | Ficheiros | Esforço |
|------|-----------|---------|
| 2.1 Migrar 51 componentes UI de `useDarkMode` → `useDk()` | 51 ficheiros (mecânico) | 6h |
| 2.2 Eliminar dead code confirmado | ~7 ficheiros | 1h |
| 2.3 Auditar e eliminar shadcn não utilizados | ~15 ficheiros | 2h |
| 2.4 Fix cores fora da paleta em `PedidosPage.tsx` | 1 ficheiro | 30min |
| 2.5 Remover import `Video` no `WhatsAppPage.tsx` | 1 ficheiro | 5min |
| 2.6 Migrar `ConfiguracoesContent.tsx` para `useDk()` | 1 ficheiro | 30min |
| 2.7 Migrar `UsuariosPermissoesContent` e `AssinaturaFaturasContent` de shadcn → apple-kit | 2 ficheiros | 3h |

**Total Sprint 2: ~13h**

### Sprint 3 — P2 Polimento (3-5 dias)

| Task | Ficheiros | Esforço |
|------|-----------|---------|
| 3.1 Extrair conteúdo inline de 6 pages para `*Content.tsx` | 6 ficheiros | 6h |
| 3.2 Trocar ícone Clapperboard → alternativa fotografia | 1 ficheiro | 10min |
| 3.3 Extrair mock data inline da `GaleriaPage.tsx` | 1 ficheiro | 30min |
| 3.4 Tornar demo push order configurável | 1 ficheiro | 30min |
| 3.5 Documentar exceção rgba() em HeroBirds.tsx | 1 ficheiro | 10min |
| 3.6 Split `NovoProjetoModal.tsx` em sub-componentes | 1 ficheiro → 4-5 | 4h |
| 3.7 Review final de compliance de cores (run compliance gate) | Global | 2h |

**Total Sprint 3: ~13h**

---

## 7) Definition of Done

Para considerar o protótipo **"pronto para demo/investidor"**:

- [ ] **Dark mode 100%** — Todas as 17 abas + modais renderizam correctamente em dark mode
- [ ] **Zero `useDarkMode` directo** — Todos os ficheiros (excepto `DarkModeProvider.tsx` e `useDarkColors.ts`) usam `useDk()`
- [ ] **Zero dead code** — Nenhum ficheiro em `/src/app/` sem importações
- [ ] **Zero cores fora da paleta** — Compliance gate passa em 100% dos ficheiros
- [ ] **Zero transparências** — Nenhum `rgba()`, `hsla()`, ou `/[0.x]` (exceção documentada: Canvas)
- [ ] **Padrão Page/Content** — Todas as pages delegam a um `*Content.tsx`
- [ ] **role="dialog"** em todos os modais e drawers
- [ ] **ESC close** em todos os modais e drawers
- [ ] **Empty states** em todos os módulos com CTA de acção
- [ ] **Loading states** (skeleton) nos módulos que fazem fetch simulado
- [ ] **apple-kit barrel export** cobre todos os componentes reutilizáveis
- [ ] **Zero referências a "vídeo"** — Nenhum import, label, tipo ou ícone associado a vídeo
- [ ] **Compliance gate** executado sem falhas (220+ cores proibidas = 0 matches)
- [ ] **NovoProjetoModal** split em sub-componentes (< 800 linhas por ficheiro)
- [ ] **Testes manuais** — Dark mode toggle em cada aba sem artefactos visuais

---

*Relatório gerado a partir da análise estática do codebase React do ESSYN Studio.*
*Próximo passo recomendado: Iniciar Sprint 1 (P0 — dark mode nos 7 módulos em falta).*
