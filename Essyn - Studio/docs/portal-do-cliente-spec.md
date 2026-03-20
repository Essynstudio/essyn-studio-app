# Portal do Cliente — Especificacao Completa de Implementacao

**Data:** 2026-03-12
**Status:** Aprovado pelo Julio — pronto para build
**Objetivo:** Rota publica onde o CLIENTE FINAL (noivo, aniversariante, etc) acessa suas galerias, seleciona fotos, comenta, ve contratos e acompanha pagamentos — tudo com a identidade visual do fotografo.

---

## Resumo Executivo

O portal e a **vitrine profissional do fotografo para o cliente final**. Nao exige login — o acesso e por **token unico** gerado pelo fotografo ao compartilhar uma galeria. O cliente recebe um link (ex: `app.essyn.studio/g/a1b2c3d4e5f6`) e acessa diretamente.

**Principio:** Experiencia Apple Photos meets Pixieset. Limpo, respirado, focado nas fotos. Zero fricao.

---

## Arquitetura de Rotas

### Prefixo: `/g` (gallery — curto, limpo, profissional)

| Rota | Tipo | Descricao |
|------|------|-----------|
| `/g/[token]` | Server + Client | Hub do cliente — galeria principal |
| `/g/[token]/selecao` | Client | Modo selecao de fotos (aprovar/rejeitar/duvida) |
| `/g/[token]/foto/[photoId]` | Client | Lightbox full-screen de uma foto |
| `/g/[token]/contrato` | Server + Client | Visualizar e assinar contrato |
| `/g/[token]/pagamentos` | Server + Client | Ver parcelas e status de pagamento |

**Nota:** Todas as rotas ficam FORA do `(app)` layout — nao usam sidebar, topbar, nem AppShell. Sao paginas independentes com layout proprio.

### Estrutura de Arquivos

```
src/app/g/
  [token]/
    layout.tsx              — PortalLayout (server: valida token, carrega branding)
    page.tsx                — Server component (fetch galeria + fotos + branding)
    portal-client.tsx       — Client: galeria de fotos, grid, download, favoritos
    selecao/
      page.tsx              — Server (fetch fotos + selecoes existentes)
      selecao-client.tsx    — Client: modo selecao (aprovar/rejeitar/duvida)
    foto/
      [photoId]/
        page.tsx            — Server (fetch foto individual + comentarios)
        foto-client.tsx     — Client: lightbox + comentarios
    contrato/
      page.tsx              — Server (fetch contrato do projeto)
      contrato-client.tsx   — Client: visualizar PDF + assinar
    pagamentos/
      page.tsx              — Server (fetch parcelas do projeto)
      pagamentos-client.tsx — Client: lista parcelas + status
```

---

## Middleware — Mudanca Necessaria

**Arquivo:** `src/lib/supabase/middleware.ts` (linha 34)

Adicionar `/g` como rota publica:

```typescript
const isPublicRoute = publicPaths.includes(request.nextUrl.pathname) ||
  request.nextUrl.pathname.startsWith("/_next") ||
  request.nextUrl.pathname.startsWith("/api") ||
  request.nextUrl.pathname.startsWith("/auth/callback") ||
  request.nextUrl.pathname.startsWith("/g");  // ← ADICIONAR
```

---

## Fluxo de Dados — Token Resolution

```
URL: /g/a1b2c3d4e5f6
        ↓
layout.tsx (Server)
  1. Busca gallery_invites WHERE token = 'a1b2c3d4e5f6'
  2. Se nao existe → pagina 404 estilizada
  3. Se expirado (expires_at < now) → pagina "Link expirado"
  4. Marca opened_at = now (se primeira abertura)
  5. Busca gallery → project → studio (com settings.portal)
  6. Busca client vinculado ao projeto
  7. Extrai branding: { primaryColor, bgColor, welcomeMessage, logoUrl }
  8. Passa tudo via React Context para children
        ↓
page.tsx (Server)
  1. Busca gallery_photos (com folder_id, ordenadas)
  2. Busca gallery_folders
  3. Busca gallery_selections do cliente (se existirem)
  4. Passa para portal-client.tsx
        ↓
portal-client.tsx (Client)
  UI renderiza com branding do studio
```

### Query Exemplo — layout.tsx

```typescript
const { data: invite } = await supabase
  .from("gallery_invites")
  .select(`
    id, token, role, expires_at, opened_at,
    gallery:galleries!inner(
      id, name, status, branding, photo_count, download_enabled,
      project:projects!inner(
        id, name, event_type, event_date,
        client:clients(id, name, email),
        studio:studios!inner(id, name, settings)
      )
    )
  `)
  .eq("token", token)
  .single();
```

---

## Context Provider — PortalContext

**Arquivo:** `src/app/g/[token]/portal-context.tsx`

```typescript
interface PortalContextData {
  // Identidade
  token: string;
  role: "viewer" | "selector" | "commenter";

  // Galeria
  gallery: {
    id: string;
    name: string;
    status: GalleryStatus;
    photoCount: number;
    downloadEnabled: boolean;
  };

  // Projeto
  project: {
    id: string;
    name: string;
    eventType: EventType;
    eventDate: string | null;
  };

  // Studio (fotografo)
  studio: {
    id: string;
    name: string;
  };

  // Cliente
  client: {
    id: string;
    name: string;
    email: string | null;
  } | null;

  // Branding customizado pelo fotografo
  branding: {
    primaryColor: string;    // default: #B8860B (gold Essyn)
    bgColor: string;         // default: #F2F2F7
    welcomeMessage: string;  // default: "Bem-vindo ao seu portal"
    logoUrl: string | null;  // logo do studio no Storage
  };
}
```

---

## Fase 1 — Galeria Publica (MVP)

### `/g/[token]` — Hub Principal

**Layout da pagina:**

```
┌─────────────────────────────────────────────┐
│  [Logo Studio]     NOME DO STUDIO           │  ← Header com branding
│                                              │
│  Mensagem de boas-vindas                     │
├─────────────────────────────────────────────┤
│                                              │
│  Casamento Maria & João                      │  ← Nome do projeto
│  15 de março de 2026 · 247 fotos             │  ← Data + contagem
│                                              │
│  [Todas] [Cerimônia] [Festa] [Making Of]    │  ← Folders como filtro
│                                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │    │ │    │ │    │ │    │ │    │       │  ← Grid masonry 2-5 cols
│  │    │ │ foto│ │    │ │    │ │ foto│       │
│  │foto│ │    │ │foto│ │foto│ │    │       │
│  │    │ ├────┤ │    │ │    │ ├────┤       │
│  ├────┤ │    │ ├────┤ ├────┤ │    │       │
│  │    │ │foto│ │    │ │    │ │foto│       │
│  │foto│ │    │ │foto│ │foto│ │    │       │
│  └────┘ └────┘ └────┘ └────┘ └────┘       │
│                                              │
│  [Carregar mais]                             │  ← Pagination infinita
│                                              │
├─────────────────────────────────────────────┤
│  [🔒 Selecionar fotos]  [⬇ Baixar todas]    │  ← Toolbar fixa no bottom
│                                              │
│  Galeria  Seleção  Contrato  Pagamentos     │  ← Nav tabs (se role permite)
└─────────────────────────────────────────────┘
```

### Componentes — Hub

#### 1. PortalHeader
```
Altura: 56px
Background: branding.primaryColor
Texto: branco (#FFFFFF)
Logo: branding.logoUrl (se existir) — 28px height, border-radius: 6px
Nome studio: text-[13px] font-semibold tracking-[0.02em] uppercase
Bordas: nenhuma
Shadow: var(--shadow-sm)
```

#### 2. ProjectInfo
```
Padding: 24px horizontal, 20px vertical
Titulo (nome projeto): text-[24px] font-bold tracking-[-0.022em] color: var(--fg)
Subtitulo: text-[13px] color: var(--fg-muted)
  Formato: "15 de março de 2026 · 247 fotos"
  Usar date-fns format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
Espacamento entre titulo e subtitulo: 4px (mt-1)
```

#### 3. FolderFilter (baseado no ActionPill existente)
```
Container: flex gap-1.5, overflow-x-auto, px-24px
Cada pill:
  - Inativo: bg-[var(--bg-subtle)] text-[var(--fg-secondary)] text-[12px] font-medium px-3 py-1.5 rounded-full
  - Ativo: bg-[branding.primaryColor] text-white (mesmas dimensoes)
  - Hover: opacity-80
  - Transition: all 150ms ease
  - Usar branding.primaryColor como cor ativa (NAO --info)
Primeiro item sempre: "Todas" (sem filtro de folder)
Demais: nome de cada gallery_folder ordenado por sort_order
```

#### 4. PhotoGrid
```
Layout: CSS Grid masonry (ou columns fallback)
  - Mobile (< 640px): 2 colunas, gap 2px
  - Tablet (640-1024px): 3 colunas, gap 3px
  - Desktop (1024-1440px): 4 colunas, gap 4px
  - Wide (> 1440px): 5 colunas, gap 4px

Cada foto:
  - Container: relative, overflow-hidden, rounded-none (edge-to-edge feel)
  - Image: object-cover, width 100%, lazy loading (loading="lazy")
  - Hover overlay: bg-black/30, transition opacity 200ms
  - Hover actions (aparecem no overlay):
    - Canto superior direito: botao heart (favoritar) — 32px, rounded-full, bg-white/90
    - Canto inferior direito: botao download — 32px, rounded-full, bg-white/90
  - Click: abre lightbox (/g/[token]/foto/[photoId])

Lazy loading:
  - Carregar 20 fotos iniciais
  - Intersection Observer para carregar mais 20 ao scroll
  - Skeleton shimmer durante loading (usar .skeleton-shimmer do globals.css)

URL da foto no Storage:
  `${SUPABASE_URL}/storage/v1/object/public/gallery-photos/${studio_id}/${gallery_id}/${storage_path}`
```

#### 5. BottomToolbar (fixo no bottom)
```
Position: fixed bottom-0, width 100%, z-50
Background: glass (var(--card) com backdrop-filter blur(20px))
Border-top: 1px solid var(--border-subtle)
Padding: 12px 24px
Safe area: pb-[env(safe-area-inset-bottom)]

Layout: flex justify-between items-center

Esquerda:
  - Botao "Selecionar fotos" (se role != viewer)
    Style: COMPACT_PRIMARY_CTA mas com branding.primaryColor como bg
  - Botao "Baixar todas" (se gallery.downloadEnabled)
    Style: COMPACT_SECONDARY_CTA

Direita / Centro:
  - Nav tabs: Galeria | Selecao | Contrato | Pagamentos
  - Cada tab: text-[11px] font-medium, padding 8px 12px
  - Tab ativa: color branding.primaryColor, border-bottom 2px solid branding.primaryColor
  - Tab inativa: color var(--fg-muted)
  - Tabs visiveis conforme role e disponibilidade:
    - Galeria: sempre
    - Selecao: role = "selector" ou "commenter"
    - Contrato: se projeto tem contrato
    - Pagamentos: se projeto tem parcelas
```

#### 6. PortalFooter
```
Padding: 16px 24px
Text-align: center
Conteudo: "Galeria por [Nome Studio]" — text-[11px] color var(--fg-muted)
Link: "Feito com essyn." — text-[11px] color var(--accent) font-style italic
  Font: font-fraunces para "essyn."
  Link para: https://essyn.studio (target _blank)
Margin-bottom: 80px (para nao ficar atras do BottomToolbar)
```

---

### `/g/[token]/foto/[photoId]` — Lightbox

```
Layout: full-screen, bg-black
Overlay: z-50

Foto central:
  - object-contain, max-width 100vw, max-height calc(100vh - 120px)
  - Centralizada vertical e horizontal

Header lightbox:
  - Position absolute top-0
  - Glass bg (rgba(0,0,0,0.4) + backdrop-filter blur)
  - Esquerda: botao voltar (ChevronLeft, 44px touch target)
  - Centro: "23 / 247" (contagem)
  - Direita: botao download + botao favoritar + botao fechar (X)

Navegacao:
  - Setas laterais: ChevronLeft / ChevronRight, 44px, bg-white/20 rounded-full
  - Keyboard: ArrowLeft, ArrowRight, Escape
  - Swipe: touch gesture esquerda/direita (mobile)
  - Preload: foto anterior e proxima (prefetch)

Comentarios (se role permite):
  - Panel deslizante de baixo (mobile) ou lateral direita (desktop)
  - Lista de comentarios existentes
  - Input para novo comentario
  - Avatar com inicial do nome
  - Timestamp relativo (date-fns formatDistanceToNow)

Selecao rapida (se role = selector):
  - 3 botoes no bottom do lightbox:
    - Aprovada (Check, verde var(--success))
    - Rejeitar (X, vermelho var(--error))
    - Duvida (HelpCircle, amarelo var(--warning))
  - Visual: icone 24px + label 11px, dentro de pilula 44px height
  - Feedback: toast.success ao marcar
```

---

## Fase 2 — Selecao e Comentarios

### `/g/[token]/selecao` — Modo Selecao

```
Layout similar a galeria, mas com overlay de status em cada foto

Cada foto no grid:
  - Mesmo layout do PhotoGrid
  - Overlay permanente (nao so hover):
    - Canto superior esquerdo: badge de status
      - Aprovada: circulo 24px bg-[var(--success)] com Check branco
      - Rejeitada: circulo 24px bg-[var(--error)] com X branco
      - Duvida: circulo 24px bg-[var(--warning)] com ? branco
      - Sem selecao: circulo 24px bg-white/60 com borda dashed var(--border)
    - Borda da foto muda conforme status:
      - Aprovada: ring-2 ring-[var(--success)]
      - Rejeitada: ring-2 ring-[var(--error)] + opacity-50
      - Duvida: ring-2 ring-[var(--warning)]

Click na foto: cicla status (nenhum → aprovada → rejeitada → duvida → nenhum)
Long press / right click: abre lightbox com comentario

Header da pagina de selecao:
  Titulo: "Selecao de fotos"
  Subtitulo: "Toque nas fotos para aprovar, rejeitar ou marcar duvida"

  Contadores em tempo real:
  ┌──────────────────────────────────────────────┐
  │  ✓ 142 aprovadas   ✗ 23 rejeitadas   ? 8    │
  │  Total: 173 / 247 selecionadas               │
  └──────────────────────────────────────────────┘

  Style contadores:
    - Container: flex gap-4, bg-[var(--card)] p-4 rounded-xl border border-[var(--border-subtle)]
    - Cada contador: flex items-center gap-1.5
    - Numero: text-[15px] font-semibold tabular-nums
    - Label: text-[11px] color var(--fg-muted)
    - Icone cor: var(--success), var(--error), var(--warning)

Barra de progresso:
  - Full width, height 4px, rounded-full
  - Background: var(--bg-subtle)
  - Segmentos coloridos proporcionais:
    - Verde (aprovadas): var(--success)
    - Vermelho (rejeitadas): var(--error)
    - Amarelo (duvida): var(--warning)
    - Cinza (nao selecionadas): var(--border)

Botao finalizar selecao:
  - Fixo no bottom toolbar
  - Style: h-11 px-5 rounded-[10px] bg-[branding.primaryColor] text-white text-[13px] font-semibold
  - Label: "Finalizar selecao (142 fotos)"
  - Ao clicar: modal de confirmacao
    - "Voce selecionou 142 fotos. Deseja finalizar?"
    - "Aprovadas: 142 · Rejeitadas: 23 · Duvida: 8"
    - Botoes: "Revisar" (secondary) + "Confirmar" (primary com branding.primaryColor)
  - Ao confirmar: salva no Supabase + notifica fotografo + toast.success
```

### Comentarios em Foto

```
Persistencia: tabela gallery_comments

Cada comentario:
  ┌──────────────────────────────────────────┐
  │  [JM]  João Mendes           há 2 horas  │
  │        Essa foto ficou incrível!          │
  │        Pode fazer um crop mais fechado?   │
  └──────────────────────────────────────────┘

  Avatar: circulo 32px, bg-[branding.primaryColor]/10, texto inicial branding.primaryColor
  Nome: text-[13px] font-medium var(--fg)
  Timestamp: text-[11px] var(--fg-muted), usando formatDistanceToNow
  Conteudo: text-[13px] var(--fg), line-height 1.5

  Comentarios do studio: badge "Fotografo" ao lado do nome
    Badge: text-[9px] font-medium bg-[var(--accent-subtle)] text-[var(--accent)] px-1.5 py-0.5 rounded-full

Input de comentario:
  - Fixo no bottom do panel de comentarios
  - Input: INPUT_CLS (sem border-radius-right)
  - Botao enviar: bg-[branding.primaryColor] text-white, rounded-r-[10px]
  - Placeholder: "Escreva um comentário..."
  - Submit: Enter (ou botao)
  - Feedback: comentario aparece instantaneamente (optimistic update) + toast
```

---

## Fase 3 — Contrato e Pagamentos

### `/g/[token]/contrato` — Visualizar Contrato

```
Condicao: so aparece na nav se projeto tem contrato vinculado
Busca: contracts WHERE project_id = invite.gallery.project.id

Layout:
  ┌─────────────────────────────────────────────┐
  │  [PortalHeader com branding]                 │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  Contrato                                    │
  │  Casamento Maria & João                      │
  │                                              │
  │  Status: [Enviado] / [Assinado]              │
  │                                              │
  │  ┌─────────────────────────────────────┐    │
  │  │                                     │    │  ← PDF viewer inline
  │  │          Contrato PDF               │    │     ou link para download
  │  │                                     │    │
  │  │                                     │    │
  │  └─────────────────────────────────────┘    │
  │                                              │
  │  [Baixar PDF]        [Assinar digitalmente]  │
  │                                              │
  └─────────────────────────────────────────────┘

Status badge:
  - Rascunho: bg-[var(--bg-subtle)] text-[var(--fg-muted)]
  - Enviado: bg-[var(--info-subtle)] text-[var(--info)]
  - Assinado: bg-[var(--success-subtle)] text-[var(--success)]
  - Expirado: bg-[var(--error-subtle)] text-[var(--error)]

PDF Viewer:
  - Se file_url existe: embed <iframe> ou <object> com URL do Storage
  - Fallback: card com icone FileText + "Baixar contrato" link
  - Borda: rounded-xl, border var(--border-subtle), overflow-hidden

Assinatura digital (Fase 3+):
  - Campo nome completo: INPUT_CLS
  - Campo CPF: INPUT_CLS com mascara
  - Checkbox: "Li e concordo com os termos deste contrato"
  - Botao: bg-[branding.primaryColor] text-white, "Assinar contrato"
  - Ao assinar: atualiza contract.status = "assinado", signed_at = now()
  - Notifica fotografo via notifications
  - Feedback: tela de confirmacao com Check animado (springBounce)
```

### `/g/[token]/pagamentos` — Parcelas

```
Condicao: so aparece se projeto tem parcelas (installments)
Busca: installments WHERE project_id = invite.gallery.project.id

Layout:
  ┌─────────────────────────────────────────────┐
  │  [PortalHeader com branding]                 │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  Pagamentos                                  │
  │  3 de 5 parcelas pagas · R$ 4.500 / R$ 7.500│
  │                                              │
  │  ██████████████████░░░░░░░░  60%             │  ← Progress bar
  │                                              │
  │  ┌─────────────────────────────────────────┐│
  │  │  Parcela 1          R$ 1.500    ✓ Pago  ││  ← Verde
  │  │  Vencimento: 15/01/2026                 ││
  │  │  Pago em: 14/01/2026 via PIX            ││
  │  ├─────────────────────────────────────────┤│
  │  │  Parcela 2          R$ 1.500    ✓ Pago  ││
  │  │  Vencimento: 15/02/2026                 ││
  │  │  Pago em: 15/02/2026 via Cartão         ││
  │  ├─────────────────────────────────────────┤│
  │  │  Parcela 3          R$ 1.500    ✓ Pago  ││
  │  │  Vencimento: 15/03/2026                 ││
  │  │  Pago em: 12/03/2026 via PIX            ││
  │  ├─────────────────────────────────────────┤│
  │  │  Parcela 4          R$ 1.500    ⏳ Pendente ││ ← Amarelo
  │  │  Vencimento: 15/04/2026                 ││
  │  │  [Gerar PIX] [Copiar código]            ││  ← Fase 3+
  │  ├─────────────────────────────────────────┤│
  │  │  Parcela 5          R$ 1.500    🔴 Vencido ││ ← Vermelho
  │  │  Vencimento: 15/03/2026 (3 dias atras)  ││
  │  │  [Gerar PIX] [Copiar código]            ││
  │  └─────────────────────────────────────────┘│
  │                                              │
  └─────────────────────────────────────────────┘

Progress bar:
  - Height: 6px, rounded-full
  - Background: var(--bg-subtle)
  - Fill: var(--success), width proporcional ao pago
  - Transition: width 500ms ease

Cada parcela (card):
  - Container: bg-[var(--card)] border-b border-[var(--border-subtle)] px-5 py-4
  - Layout: flex justify-between items-start
  - Esquerda:
    - "Parcela 1": text-[13px] font-medium var(--fg)
    - "Vencimento: 15/01/2026": text-[12px] var(--fg-muted)
    - "Pago em: 14/01/2026 via PIX": text-[11px] var(--fg-muted) (so se pago)
  - Direita:
    - Valor: text-[15px] font-semibold tabular-nums var(--fg)
    - Status badge:
      - Pago: bg-[var(--success-subtle)] text-[var(--success)] text-[11px] px-2 py-0.5 rounded-full
      - Pendente: bg-[var(--warning-subtle)] text-[var(--warning)]
      - Vencido: bg-[var(--error-subtle)] text-[var(--error)]
      - Cancelado: bg-[var(--bg-subtle)] text-[var(--fg-muted)]

Botoes de pagamento (Fase 3+ com Stripe/Asaas):
  - "Gerar PIX": COMPACT_PRIMARY_CTA com branding.primaryColor
  - "Copiar codigo": COMPACT_SECONDARY_CTA
  - Placeholder atual: texto "Em breve voce podera pagar diretamente aqui"
    com icone CreditCard e style info-subtle
```

---

## Design System — Regras do Portal

### Principio de Branding

O portal usa as **cores do fotografo** (branding) para elementos interativos, e o **design system Essyn** para estrutura, tipografia e semantica.

| Elemento | Cor |
|----------|-----|
| Header background | `branding.primaryColor` |
| Botoes primarios | `branding.primaryColor` |
| Tab ativa | `branding.primaryColor` |
| Pill de folder ativa | `branding.primaryColor` |
| Links | `branding.primaryColor` |
| Bordas de selecao | Semanticas (success/error/warning) — NAO muda |
| Backgrounds | `branding.bgColor` ou `var(--bg)` |
| Texto | Sempre `var(--fg)`, `var(--fg-secondary)`, `var(--fg-muted)` |
| Bordas | Sempre `var(--border-subtle)`, `var(--border)` |
| Shadows | Sempre `var(--shadow-sm)`, `var(--shadow-md)` |
| Tipografia | Sempre Inter (body) + Fraunces (so "essyn." no footer) |

### Fallback de Branding

Se o fotografo NAO configurou branding:

```typescript
const defaultBranding = {
  primaryColor: "#B8860B",     // Gold Essyn
  bgColor: "#F2F2F7",          // iOS system background
  welcomeMessage: "Bem-vindo ao seu portal",
  logoUrl: null,
};
```

### Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| < 640px (mobile) | Grid 2 cols, nav tabs horizontal scroll, bottom toolbar full-width, lightbox full-screen |
| 640-1024px (tablet) | Grid 3 cols, nav tabs visivel, toolbar com spacing |
| 1024-1440px (desktop) | Grid 4 cols, comentarios em panel lateral no lightbox |
| > 1440px (wide) | Grid 5 cols, max-width 1440px centered |

### Animacoes

Todas usando motion tokens existentes:
- Entrada de pagina: `pageTransition` (opacity 0→1, y 6→0)
- Cards/fotos: `springContentIn` com delay stagger (i * 0.03)
- Lightbox: `springModalIn` (scale 0.96→1)
- Bottom toolbar: `springDrawerIn` adaptado (y "100%"→0)
- Overlay: `springOverlay`
- Selecao de foto: `springToggle` no icone de status

### Skeleton Loading

Enquanto fotos carregam:
```
Cada foto placeholder:
  - aspect-ratio: random entre 3/4, 4/5, 1/1 (gerar na montagem)
  - background: .skeleton-shimmer (do globals.css)
  - border-radius: 0 (edge-to-edge)
```

---

## Banco de Dados — Tabelas Existentes (ja criadas)

### gallery_invites (migration v3)
```sql
-- JA EXISTE — nao precisa criar
id uuid PK
gallery_id uuid FK → galleries
role text ('viewer' | 'selector' | 'commenter')
token text UNIQUE (encode(gen_random_bytes(16), 'hex'))
invited_email text
invited_name text
sent_at timestamptz
opened_at timestamptz  -- marcamos na primeira abertura
expires_at timestamptz
created_at timestamptz
```

### gallery_selections (migration v3)
```sql
-- JA EXISTE — nao precisa criar
id uuid PK
gallery_id uuid FK
photo_id uuid FK → gallery_photos
client_email text
status text ('aprovada' | 'rejeitada' | 'duvida')
notes text
created_at timestamptz
updated_at timestamptz
UNIQUE (gallery_id, photo_id, client_email)
```

### gallery_comments (migration v3)
```sql
-- JA EXISTE — nao precisa criar
id uuid PK
gallery_id uuid FK
photo_id uuid FK → gallery_photos (nullable — pode ser na galeria toda)
author_name text
author_email text
author_type text ('client' | 'studio')
content text
resolved boolean DEFAULT false
created_at timestamptz
```

### galleries.branding (JSONB, migration v3)
```sql
-- JA EXISTE — coluna branding na tabela galleries
{
  "logo_url": "string | null",
  "primary_color": "#B8860B",
  "bg_color": "#F2F2F7",
  "layout": "grid",
  "welcome_message": "Bem-vindo ao seu portal",
  "custom_domain": "null"
}
```

### RLS Policies Existentes

```sql
-- gallery_invites: leitura publica por token (ja existe)
-- gallery_selections: insert pelo cliente (ja existe)
-- gallery_comments: insert pelo cliente (ja existe)
-- gallery_photos: leitura publica se galeria publica (ja existe)
-- Storage gallery-photos: leitura publica (ja existe)
```

---

## API Routes Necessarias (novas)

### 1. `/api/portal/[token]/selections` — POST
```typescript
// Salvar selecao de foto
// Body: { photoId, status, notes? }
// Validacao: token valido, role = selector, galeria ativa
// Upsert: gallery_selections (unique gallery_id + photo_id + client_email)
```

### 2. `/api/portal/[token]/comments` — POST
```typescript
// Adicionar comentario
// Body: { photoId?, content, authorName }
// Validacao: token valido, role = selector ou commenter
// Insert: gallery_comments
```

### 3. `/api/portal/[token]/sign-contract` — POST
```typescript
// Assinar contrato digitalmente
// Body: { fullName, document (CPF) }
// Validacao: token valido, contrato existe e status = "enviado"
// Update: contracts.status = "assinado", signed_at, signed_by_name, signed_by_document
// Notifica fotografo
```

### 4. `/api/portal/[token]/download` — GET
```typescript
// Download de foto individual ou ZIP de todas
// Query: ?photoId=xxx (individual) ou sem param (todas)
// Validacao: token valido, gallery.download_enabled = true
// Individual: redirect para URL publica do Storage
// Todas: gerar ZIP server-side (ou usar Supabase Edge Function)
```

---

## Tipos TypeScript Novos

**Arquivo:** `src/lib/types.ts` (adicionar)

```typescript
// Portal types
export type InviteRole = "viewer" | "selector" | "commenter";
export type SelectionStatus = "aprovada" | "rejeitada" | "duvida";

export interface GalleryInvite {
  id: string;
  gallery_id: string;
  role: InviteRole;
  token: string;
  invited_email: string | null;
  invited_name: string | null;
  sent_at: string | null;
  opened_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface GallerySelection {
  id: string;
  gallery_id: string;
  photo_id: string;
  client_email: string;
  status: SelectionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryComment {
  id: string;
  gallery_id: string;
  photo_id: string | null;
  author_name: string;
  author_email: string;
  author_type: "client" | "studio";
  content: string;
  resolved: boolean;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  gallery_id: string;
  storage_path: string;
  filename: string;
  folder_id: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

export interface GalleryFolder {
  id: string;
  gallery_id: string;
  name: string;
  cover_photo_id: string | null;
  sort_order: number;
}

export interface PortalBranding {
  primaryColor: string;
  bgColor: string;
  welcomeMessage: string;
  logoUrl: string | null;
}
```

---

## Notificacoes ao Fotografo

Quando o cliente interage no portal, o fotografo recebe notificacoes na tabela `notifications`:

| Acao do Cliente | notification_type | Mensagem |
|-----------------|-------------------|----------|
| Abriu galeria pela primeira vez | `portal_view` | "[Cliente] visualizou a galeria [Nome]" |
| Finalizou selecao | `portal_selection` | "[Cliente] finalizou a selecao: 142 aprovadas, 23 rejeitadas" |
| Comentou em foto | `portal_comment` | "[Cliente] comentou na foto #23 da galeria [Nome]" |
| Assinou contrato | `portal_contract_signed` | "[Cliente] assinou o contrato do projeto [Nome]" |
| Baixou fotos | `portal_download` | "[Cliente] baixou 247 fotos da galeria [Nome]" |

**Nota:** Adicionar estes 5 tipos ao enum `notification_type` no Supabase (migration v8).

---

## Migration v8 — Portal Enhancements

```sql
-- Novos tipos de notificacao
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'portal_view';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'portal_selection';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'portal_comment';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'portal_contract_signed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'portal_download';

-- Campos de assinatura no contrato
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_by_name text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_by_document text;

-- Indice para busca por token (performance)
CREATE INDEX IF NOT EXISTS idx_gallery_invites_token ON gallery_invites(token);

-- Indice para busca de selecoes por galeria
CREATE INDEX IF NOT EXISTS idx_gallery_selections_gallery ON gallery_selections(gallery_id);

-- Indice para busca de comentarios por galeria
CREATE INDEX IF NOT EXISTS idx_gallery_comments_gallery ON gallery_comments(gallery_id);
```

---

## Fluxo do Fotografo — Compartilhar Galeria

No modulo de galeria existente (`gallery-detail-client.tsx`), na tab "Compartilhar":

1. Fotografo clica "Compartilhar galeria"
2. Modal abre:
   - Nome do cliente (auto-preenche se projeto tem client)
   - Email do cliente (auto-preenche)
   - Role: Visualizar / Selecionar / Comentar (radio)
   - Validade: 7 dias / 30 dias / Sem limite (select)
3. Ao confirmar:
   - Insere em `gallery_invites` com token aleatorio
   - Gera URL: `app.essyn.studio/g/{token}`
   - Opcoes: Copiar link / Enviar por email (futuro) / Enviar por WhatsApp (futuro)
4. Lista de convites ativos na tab "Compartilhar":
   - Token, role, email, status (aberto/pendente), data

---

## Ordem de Implementacao

### Sprint 1 — Fase 1 MVP (estimativa: 1 sessao)
1. Criar estrutura de pastas `/g/[token]/`
2. Atualizar middleware (adicionar `/g` como publica)
3. `layout.tsx` — token resolution + PortalContext
4. `page.tsx` + `portal-client.tsx` — grid de fotos com branding
5. PortalHeader, PhotoGrid, FolderFilter, BottomToolbar, PortalFooter
6. Lightbox basico (foto full-screen + navegacao)
7. Download individual de foto
8. Testar com token real (criar invite manual no Supabase)

### Sprint 2 — Fase 2 Selecao (estimativa: 1 sessao)
1. `selecao/` — modo selecao com contadores
2. API route `/api/portal/[token]/selections`
3. Persistencia de selecoes no Supabase
4. Comentarios no lightbox
5. API route `/api/portal/[token]/comments`
6. Notificacoes ao fotografo
7. Migration v8

### Sprint 3 — Fase 3 Contrato + Pagamentos (estimativa: 1 sessao)
1. `contrato/` — visualizar PDF + assinatura
2. API route `/api/portal/[token]/sign-contract`
3. `pagamentos/` — lista de parcelas
4. Compartilhar galeria (modal no gallery-detail)
5. Testes end-to-end

---

## Checklist Pre-Build

- [x] Rotas definidas (`/g/[token]`, `/g/[token]/selecao`, etc)
- [x] Middleware mapeado (adicionar `/g`)
- [x] Estrutura de arquivos completa
- [x] Fluxo de dados token → galeria → studio → branding
- [x] Todos componentes especificados com design tokens exatos
- [x] Tabelas DB existentes mapeadas
- [x] Migration v8 definida
- [x] API routes definidas com validacao
- [x] Tipos TypeScript definidos
- [x] Responsividade por breakpoint
- [x] Animacoes mapeadas para motion tokens existentes
- [x] Branding fallback definido
- [x] Notificacoes ao fotografo definidas
- [x] Ordem de implementacao clara

---

*Documento criado por Claude — parceiro de jornada do Julio Mendes - Essyn Studio*
