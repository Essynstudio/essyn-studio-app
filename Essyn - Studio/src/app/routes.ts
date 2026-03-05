import { createBrowserRouter, redirect } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { ProjetosPage } from "./pages/ProjetosPage";
import { FinanceiroHojePage } from "./pages/FinanceiroHojePage";
import { ProducaoRadarPage } from "./pages/ProducaoRadarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AgendaPage } from "./pages/AgendaPage";
import { GaleriaPage } from "./pages/GaleriaPage";
import { ClientGalleryPage } from "./pages/ClientGalleryPage";
import { CrmPage } from "./pages/CrmPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { ClientesPage } from "./pages/ClientesPage";
import { EquipaPage } from "./pages/EquipaPage";
import { PedidosPage } from "./pages/PedidosPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ContratosPage } from "./pages/ContratosPage";
import { AutomacoesPage } from "./pages/AutomacoesPage";
import { ClientePortalPage } from "./pages/ClientePortalPage";
import { NotificacoesPage } from "./pages/NotificacoesPage";
import { IntegracoesPage } from "./pages/IntegracoesPage";
import { EmailTemplatesPage } from "./pages/EmailTemplatesPage";
import { ArmazenamentoPage } from "./pages/ArmazenamentoPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";

/* ── V4 imports ── */
import { MarketingLayoutV4 } from "./components/marketing/MarketingLayoutV4";
import { LandingV4Page } from "./pages/marketing/v4/LandingV4Page";
import { EntrarV4Page } from "./pages/marketing/v4/EntrarV4Page";
import { CheckoutV4Page } from "./pages/marketing/v4/CheckoutV4Page";
import { BoasVindasV4Page } from "./pages/marketing/v4/BoasVindasV4Page";
import { QAV4Page } from "./pages/marketing/v4/QAV4Page";
import {
  RecursosV4Page, CasosV4Page, SegurancaV4Page, FaqV4Page,
  PlanosV4Page, CriarContaV4Page, SucessoV4Page,
  VerificarEmailV4Page, EsqueciSenhaV4Page,
  CriarStudioV4Page, PreferenciasV4Page, ConcluirV4Page,
} from "./pages/marketing/v4/shared-reexports";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/v4"),
  },

  /* ═══ App (with PaywallProvider) ═══ */
  {
    Component: AppLayout,
    children: [
      { path: "/projetos", Component: ProjetosPage },
      { path: "/financeiro", Component: FinanceiroHojePage },
      { path: "/producao", Component: ProducaoRadarPage },
      { path: "/dashboard", Component: DashboardPage },
      { path: "/agenda", Component: AgendaPage },
      { path: "/galeria", Component: GaleriaPage },
      { path: "/crm", Component: CrmPage },
      { path: "/clientes", Component: ClientesPage },
      { path: "/time", Component: EquipaPage },
      { path: "/pedidos", Component: PedidosPage },
      { path: "/whatsapp", Component: WhatsAppPage },
      { path: "/relatorios", Component: RelatoriosPage },
      { path: "/contratos", Component: ContratosPage },
      { path: "/automacoes", Component: AutomacoesPage },
      { path: "/configuracoes", Component: ConfiguracoesPage },
      { path: "/notificacoes", Component: NotificacoesPage },
      { path: "/integracoes", Component: IntegracoesPage },
      { path: "/email-templates", Component: EmailTemplatesPage },
      { path: "/armazenamento", Component: ArmazenamentoPage },
    ],
  },

  /* ═══ Client Gallery (public, own layout) ═══ */
  { path: "/galeria/cliente/:id", Component: ClientGalleryPage },

  /* ═══ Client Portal (public, standalone) ═══ */
  { path: "/portal/:projectId", Component: ClientePortalPage },

  /* ═══ V4 Standalone Auth (portal, no layout) ═══ */
  { path: "/v4/criar-conta", Component: CriarContaV4Page },

  /* ═══ Marketing V4 (editorial film studio) ═══ */
  {
    path: "/v4",
    Component: MarketingLayoutV4,
    children: [
      { index: true, Component: LandingV4Page },
      { path: "recursos", Component: RecursosV4Page },
      { path: "planos", Component: PlanosV4Page },
      { path: "casos", Component: CasosV4Page },
      { path: "seguranca", Component: SegurancaV4Page },
      { path: "faq", Component: FaqV4Page },
      { path: "entrar", Component: EntrarV4Page },
      { path: "checkout", Component: CheckoutV4Page },
      { path: "sucesso", Component: SucessoV4Page },
      { path: "verificar-email", Component: VerificarEmailV4Page },
      { path: "esqueci-senha", Component: EsqueciSenhaV4Page },
      { path: "qa", Component: QAV4Page },
      { path: "*", Component: LandingV4Page },
    ],
  },

  /* ═══ V4 Onboarding (standalone, no layout) ═══ */
  { path: "/v4/boas-vindas", Component: BoasVindasV4Page },
  { path: "/v4/criar-studio", Component: CriarStudioV4Page },
  { path: "/v4/preferencias", Component: PreferenciasV4Page },
  { path: "/v4/concluir", Component: ConcluirV4Page },

  /* ═══ Legacy redirects ═══ */
  { path: "/equipa", loader: () => redirect("/time") },
  { path: "/site", loader: () => redirect("/v4") },
  { path: "/site/*", loader: () => redirect("/v4") },
  { path: "/site-v2", loader: () => redirect("/v4") },
  { path: "/site-v2/*", loader: () => redirect("/v4") },
  { path: "/v3", loader: () => redirect("/v4") },
  { path: "/v3/*", loader: () => redirect("/v4") },

  /* ═══ Catch-all fallback ═══ */
  { path: "*", loader: () => redirect("/v4") },
]);