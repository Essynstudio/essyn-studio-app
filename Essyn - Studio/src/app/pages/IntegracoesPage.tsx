/**
 * IntegracoesPage — Third-party Integrations Management
 *
 * Full CRUD: connect/disconnect, configuration drawer per integration,
 * search, filter by category & status, KPIs, webhooks, API keys.
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  CreditCard,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  Key,
  Link2,
  Lock,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plug,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { springStiff, springDefault, withDelay } from "../lib/motion-tokens";
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  HeaderWidget,
  AppleDrawer,
} from "../components/ui/apple-kit";
import { TagPill } from "../components/ui/tag-pill";
import { DashboardKpiGrid } from "../components/ui/dashboard-kpi-grid";
import { useShellConfig } from "../components/ui/ShellContext";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";

const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";
type IntegrationCategory = "Produtividade" | "Comunicação" | "Pagamentos" | "Armazenamento" | "Marketing" | "Automação";

interface WebhookConfig {
  url: string;
  events: string[];
  active: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync?: string;
  features: string[];
  color: string;
  bg: string;
  apiKey?: string;
  webhookUrl?: string;
  webhooks?: WebhookConfig[];
  syncInterval?: string;
  permissions?: string[];
  docsUrl?: string;
  version?: string;
  usageCount?: number;
}

/* ═══════════════════════════════════════════════════ */
/*  INITIAL DATA                                      */
/* ═══════════════════════════════════════════════════ */

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sincronize eventos, sessões e prazos de entrega com o seu calendário Google automaticamente",
    icon: <Calendar className="w-5 h-5" />,
    category: "Produtividade",
    status: "connected",
    lastSync: "há 5 min",
    features: ["Sync bidirecional", "Eventos automáticos", "Lembretes", "Múltiplos calendários"],
    color: "#007AFF",
    bg: "#EDF4FF",
    apiKey: "gca-****-****-7f3a",
    syncInterval: "5 min",
    permissions: ["Leitura", "Escrita", "Exclusão"],
    docsUrl: "https://developers.google.com/calendar",
    version: "v3",
    usageCount: 342,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envie mensagens automáticas, confirmações de pedido e lembretes para clientes via WhatsApp",
    icon: <MessageCircle className="w-5 h-5" />,
    category: "Comunicação",
    status: "connected",
    lastSync: "há 12 min",
    features: ["Mensagens automáticas", "Templates", "Confirmações", "Relatórios de entrega"],
    color: "#25D366",
    bg: "#E6F9ED",
    apiKey: "wba-****-****-9c2d",
    webhookUrl: "https://api.essyn.com/webhooks/whatsapp",
    syncInterval: "Tempo real",
    permissions: ["Envio", "Templates", "Contatos"],
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    version: "v18.0",
    usageCount: 1284,
    webhooks: [
      { url: "https://api.essyn.com/webhooks/whatsapp/messages", events: ["message.received", "message.delivered"], active: true },
      { url: "https://api.essyn.com/webhooks/whatsapp/status", events: ["status.changed"], active: true },
    ],
  },
  {
    id: "stripe",
    name: "Stripe / PIX",
    description: "Receba pagamentos online via cartão de crédito, boleto e PIX com reconciliação automática",
    icon: <CreditCard className="w-5 h-5" />,
    category: "Pagamentos",
    status: "connected",
    lastSync: "há 1 hora",
    features: ["Cartão de crédito", "PIX automático", "Boleto", "Reconciliação", "Parcelamento"],
    color: "#5856D6",
    bg: "#F0EFFC",
    apiKey: "sk_live_****-****-b4e1",
    webhookUrl: "https://api.essyn.com/webhooks/stripe",
    syncInterval: "15 min",
    permissions: ["Cobranças", "Clientes", "Eventos", "Reembolsos"],
    docsUrl: "https://stripe.com/docs",
    version: "2024-12-18",
    usageCount: 856,
    webhooks: [
      { url: "https://api.essyn.com/webhooks/stripe/payments", events: ["payment_intent.succeeded", "payment_intent.failed"], active: true },
      { url: "https://api.essyn.com/webhooks/stripe/invoices", events: ["invoice.paid", "invoice.overdue"], active: true },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Backup automático de fotos e projetos no Google Drive com organização por pastas",
    icon: <HardDrive className="w-5 h-5" />,
    category: "Armazenamento",
    status: "disconnected",
    features: ["Backup automático", "Organização por pastas", "Compartilhamento", "Versionamento"],
    color: "#FF9500",
    bg: "#FFF4E6",
    docsUrl: "https://developers.google.com/drive",
    version: "v3",
  },
  {
    id: "dropbox",
    name: "Dropbox Business",
    description: "Sincronize e compartilhe arquivos de projetos com clientes e equipe pelo Dropbox",
    icon: <Cloud className="w-5 h-5" />,
    category: "Armazenamento",
    status: "disconnected",
    features: ["Sync de arquivos", "Pastas compartilhadas", "Links protegidos", "Versionamento"],
    color: "#007AFF",
    bg: "#EDF4FF",
    docsUrl: "https://www.dropbox.com/developers",
    version: "v2",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Publique fotos diretamente na sua conta profissional e capture leads dos formulários",
    icon: <Camera className="w-5 h-5" />,
    category: "Marketing",
    status: "disconnected",
    features: ["Post automático", "Stories", "Captura de leads", "Insights"],
    color: "#FF2D55",
    bg: "#FFEBEF",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    version: "v18.0",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Crie reuniões automaticamente ao agendar sessões de briefing com clientes",
    icon: <Globe className="w-5 h-5" />,
    category: "Comunicação",
    status: "disconnected",
    features: ["Reuniões automáticas", "Links no convite", "Gravação", "Transcrição"],
    color: "#007AFF",
    bg: "#EDF4FF",
    docsUrl: "https://developers.zoom.us",
    version: "v2",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sincronize contatos e envie newsletters e campanhas de marketing para sua base",
    icon: <Mail className="w-5 h-5" />,
    category: "Marketing",
    status: "disconnected",
    features: ["Sync de contatos", "Newsletters", "Automações de email", "Segmentação"],
    color: "#FF9500",
    bg: "#FFF4E6",
    docsUrl: "https://mailchimp.com/developer",
    version: "v3.0",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecte o ESSYN a mais de 5000 apps com automações sem código",
    icon: <Zap className="w-5 h-5" />,
    category: "Automação",
    status: "disconnected",
    features: ["5000+ apps", "Webhooks", "Multi-step", "Filtros condicionais"],
    color: "#FF9500",
    bg: "#FFF4E6",
    docsUrl: "https://platform.zapier.com",
    version: "v2",
  },
  {
    id: "make",
    name: "Make (Integromat)",
    description: "Automações visuais avançadas com cenários multi-step e condicionais complexos",
    icon: <Zap className="w-5 h-5" />,
    category: "Automação",
    status: "disconnected",
    features: ["Cenários visuais", "Webhooks", "Agendamento", "Tratamento de erros"],
    color: "#5856D6",
    bg: "#F0EFFC",
    docsUrl: "https://www.make.com/en/api-documentation",
    version: "v2",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Acompanhe métricas de acesso às galerias de clientes e páginas públicas do estúdio",
    icon: <ArrowUpRight className="w-5 h-5" />,
    category: "Marketing",
    status: "disconnected",
    features: ["Pageviews", "Conversões", "Audiência", "Eventos personalizados"],
    color: "#FF9500",
    bg: "#FFF4E6",
    docsUrl: "https://developers.google.com/analytics",
    version: "GA4",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sincronize projetos, tarefas e notas entre o ESSYN e seu workspace Notion",
    icon: <Globe className="w-5 h-5" />,
    category: "Produtividade",
    status: "disconnected",
    features: ["Sync de projetos", "Databases", "Notas compartilhadas", "Templates"],
    color: "#1D1D1F",
    bg: "#F5F5F7",
    docsUrl: "https://developers.notion.com",
    version: "2022-06-28",
  },
];

/* ═══════════════════════════════════════════════════ */
/*  CATEGORY CONFIG                                   */
/* ═══════════════════════════════════════════════════ */

const categoryConfig: Record<IntegrationCategory, { icon: ReactNode; color: string; bg: string }> = {
  Produtividade: { icon: <Calendar className="w-4 h-4" />, color: "#007AFF", bg: "#EDF4FF" },
  Comunicação: { icon: <MessageCircle className="w-4 h-4" />, color: "#25D366", bg: "#E6F9ED" },
  Pagamentos: { icon: <CreditCard className="w-4 h-4" />, color: "#5856D6", bg: "#F0EFFC" },
  Armazenamento: { icon: <HardDrive className="w-4 h-4" />, color: "#FF9500", bg: "#FFF4E6" },
  Marketing: { icon: <Camera className="w-4 h-4" />, color: "#FF2D55", bg: "#FFEBEF" },
  Automação: { icon: <Zap className="w-4 h-4" />, color: "#FF9500", bg: "#FFF4E6" },
};

const statusTagVariant = (s: IntegrationStatus) => {
  switch (s) {
    case "connected": return "success" as const;
    case "syncing": return "info" as const;
    case "error": return "danger" as const;
    default: return "neutral" as const;
  }
};
const statusLabel = (s: IntegrationStatus) => {
  switch (s) {
    case "connected": return "Conectado";
    case "syncing": return "Sincronizando";
    case "error": return "Erro";
    default: return "Desconectado";
  }
};

/* ═══════════════════════════════════════════════════ */
/*  ACTION MENU                                       */
/* ═══════════════════════════════════════════════════ */

function ActionMenu({ open, onClose, actions }: { open: boolean; onClose: () => void; actions: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }[] }) {
  if (!open) return null;
  return (
    <>
      {createPortal(<div className="fixed inset-0 z-[9998]" onClick={onClose} />, document.body)}
      <div className="absolute right-0 top-8 z-[9999] w-52 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { onClose(); a.onClick(); }}
            className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer text-left " + (
              a.danger ? "text-[#FF3B30] hover:bg-[#FBF5F4]" : "text-[#8E8E93] hover:bg-[#F5F5F7]"
            )}
            style={{ fontWeight: 400 }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TOGGLE ROW                                        */
/* ═══════════════════════════════════════════════════ */

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F5F5F7] last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
        <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{label}</span>
        {description && <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{description}</span>}
      </div>
      <button onClick={() => onChange(!checked)} className={"relative w-[44px] h-[26px] rounded-full transition-all cursor-pointer shrink-0 " + (checked ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all" style={{ left: checked ? 21 : 3, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CONFIG DRAWER                                     */
/* ═══════════════════════════════════════════════════ */

function IntegrationDrawer({
  open,
  onClose,
  integration,
  onDisconnect,
  onSync,
}: {
  open: boolean;
  onClose: () => void;
  integration: Integration | null;
  onDisconnect: (id: string) => void;
  onSync: (id: string) => void;
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookNotif, setWebhookNotif] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(true);

  if (!integration) return null;

  const isConnected = integration.status === "connected";

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(integration.apiKey ?? "").catch(() => {});
    toast.success("Chave copiada", { description: "API key copiada para a área de transferência", duration: 2000 });
  };

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("URL copiada", { description: "Webhook URL copiada para a área de transferência", duration: 2000 });
  };

  return (
    <AppleDrawer
      open={open}
      onClose={onClose}
      title={integration.name}
      subtitle={isConnected ? "Integração ativa — gerencie configurações" : "Integração disponível para conexão"}
      width="md"
      footer={
        isConnected ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => { onDisconnect(integration.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-[#FF3B30] border border-[#E5E5EA] bg-white hover:bg-[#FBF5F4] transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <X className="w-3.5 h-3.5" />
              Desconectar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onSync(integration.id); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar agora
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 w-full">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6 px-5 py-4">
        {/* ── Header info ── */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: integration.bg, color: integration.color }}>
            {integration.icon}
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{integration.name}</h3>
              <TagPill variant={statusTagVariant(integration.status)} size="xs">{statusLabel(integration.status)}</TagPill>
            </div>
            <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: "1.5" }}>{integration.description}</p>
            <div className="flex items-center gap-3 mt-1">
              {integration.version && (
                <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>API {integration.version}</span>
              )}
              {integration.usageCount !== undefined && (
                <>
                  <span className="w-px h-3 bg-[#E5E5EA]" />
                  <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{integration.usageCount.toLocaleString()} chamadas</span>
                </>
              )}
              {integration.lastSync && (
                <>
                  <span className="w-px h-3 bg-[#E5E5EA]" />
                  <span className="flex items-center gap-1 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                    <Clock className="w-2.5 h-2.5" />
                    Sync: {integration.lastSync}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Funcionalidades</span>
          <div className="flex flex-wrap gap-1.5">
            {integration.features.map((f) => (
              <span key={f} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
                <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="h-px bg-[#F2F2F7]" />

        {isConnected ? (
          <>
            {/* ── API Key ── */}
            {integration.apiKey && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Chave de API</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7]">
                    <Key className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
                    <span className="text-[13px] text-[#636366] flex-1 truncate" style={{ fontWeight: 400, fontFamily: "monospace" }}>
                      {showApiKey ? integration.apiKey : "••••-••••-••••-" + (integration.apiKey?.slice(-4) ?? "")}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="w-10 h-10 rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:border-[#D1D1D6] transition-all cursor-pointer shrink-0"
                    title={showApiKey ? "Ocultar" : "Mostrar"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="w-10 h-10 rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:border-[#D1D1D6] transition-all cursor-pointer shrink-0"
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Webhook URL ── */}
            {integration.webhookUrl && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Webhook URL</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7]">
                    <Webhook className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
                    <span className="text-[13px] text-[#636366] flex-1 truncate" style={{ fontWeight: 400, fontFamily: "monospace" }}>
                      {integration.webhookUrl}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyWebhook(integration.webhookUrl!)}
                    className="w-10 h-10 rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:border-[#D1D1D6] transition-all cursor-pointer shrink-0"
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Webhooks list ── */}
            {integration.webhooks && integration.webhooks.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Endpoints ({integration.webhooks.length})</span>
                <div className="rounded-xl border border-[#E5E5EA] overflow-hidden">
                  {integration.webhooks.map((wh, i) => (
                    <div key={i} className={"flex items-center gap-3 px-3.5 py-2.5 " + (i > 0 ? "border-t border-[#F5F5F7]" : "")}>
                      <span className={"w-2 h-2 rounded-full shrink-0 " + (wh.active ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
                      <div className="flex flex-col gap-0 flex-1 min-w-0">
                        <span className="text-[11px] text-[#636366] truncate" style={{ fontWeight: 500, fontFamily: "monospace" }}>{wh.url.replace("https://api.essyn.com/webhooks/", "…/")}</span>
                        <span className="text-[10px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{wh.events.join(", ")}</span>
                      </div>
                      <button
                        onClick={() => handleCopyWebhook(wh.url)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Permissions ── */}
            {integration.permissions && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Permissões concedidas</span>
                <div className="flex flex-wrap gap-1.5">
                  {integration.permissions.map((p) => (
                    <span key={p} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
                      <Shield className="w-3 h-3 text-[#AEAEB2]" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Separator ── */}
            <div className="h-px bg-[#F2F2F7]" />

            {/* ── Settings toggles ── */}
            <div className="flex flex-col gap-0">
              <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] mb-1" style={{ fontWeight: 600 }}>Configurações</span>
              <ToggleRow label="Sincronização automática" description={"Intervalo: " + (integration.syncInterval ?? "15 min")} checked={autoSync} onChange={setAutoSync} />
              <ToggleRow label="Notificações de webhook" description="Receber alertas quando webhooks falharem" checked={webhookNotif} onChange={setWebhookNotif} />
              <ToggleRow label="Alertas de erro" description="Notificar quando a integração apresentar falhas" checked={errorAlerts} onChange={setErrorAlerts} />
            </div>

            {/* ── Docs link ── */}
            {integration.docsUrl && (
              <button
                onClick={() => toast("Documentação", { description: `Abrindo docs de ${integration.name}`, duration: 2000 })}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#FAFAFA] transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-[#007AFF]" />
                <span className="text-[13px] text-[#007AFF]" style={{ fontWeight: 500 }}>Ver documentação da API</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] ml-auto" />
              </button>
            )}
          </>
        ) : (
          <>
            {/* ── Not connected state ── */}
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: integration.bg, color: integration.color }}>
                {integration.icon}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[14px] text-[#636366]" style={{ fontWeight: 500 }}>Integração não conectada</span>
                <span className="text-[12px] text-[#AEAEB2] max-w-[320px]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                  Conecte {integration.name} para acessar todas as funcionalidades listadas acima. A configuração leva menos de 2 minutos.
                </span>
              </div>
              <button
                onClick={() => {
                  toast.success("Conectando...", { description: `Iniciando OAuth para ${integration.name}`, duration: 2000 });
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer mt-2"
                style={{ fontWeight: 500, boxShadow: "0 1px 3px #E5E5EA" }}
              >
                <Link2 className="w-4 h-4" />
                Conectar {integration.name}
              </button>
            </div>

            {/* ── Docs link ── */}
            {integration.docsUrl && (
              <button
                onClick={() => toast("Documentação", { description: `Abrindo docs de ${integration.name}`, duration: 2000 })}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#FAFAFA] transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-[#007AFF]" />
                <span className="text-[13px] text-[#007AFF]" style={{ fontWeight: 500 }}>Ver documentação da API</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] ml-auto" />
              </button>
            )}
          </>
        )}
      </div>
    </AppleDrawer>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INTEGRATION CARD                                  */
/* ═══════════════════════════════════════════════════ */

function IntegrationCard({
  item,
  index,
  onToggle,
  onSync,
  onConfigure,
}: {
  item: Integration;
  index: number;
  onToggle: (id: string) => void;
  onSync: (id: string) => void;
  onConfigure: (item: Integration) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isConnected = item.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springStagger(index)}
      className={"group rounded-2xl border overflow-hidden transition-colors " + (isConnected ? "border-[#D1D1D6] bg-white" : "border-[#E5E5EA] bg-[#FAFAFA]")}
      style={{ boxShadow: isConnected ? "0 1px 3px #E5E5EA" : "0 1px 2px #F2F2F7" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: item.bg, color: item.color }}
        >
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{item.name}</h4>
            <TagPill variant={statusTagVariant(item.status)} size="xs">{statusLabel(item.status)}</TagPill>
          </div>
          <p className="text-[11px] text-[#8E8E93] line-clamp-2" style={{ fontWeight: 400, lineHeight: "1.5" }}>
            {item.description}
          </p>
        </div>
        {/* ── More menu ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <ActionMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            actions={[
              { label: "Configurações", icon: <Settings className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onConfigure(item) },
              ...(isConnected ? [
                { label: "Sincronizar agora", icon: <RefreshCw className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onSync(item.id) },
                { label: "Ver documentação", icon: <ExternalLink className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => toast("Documentação", { description: `Abrindo docs de ${item.name}`, duration: 2000 }) },
                { label: "Desconectar", icon: <X className="w-3.5 h-3.5" />, danger: true, onClick: () => onToggle(item.id) },
              ] : [
                { label: "Ver documentação", icon: <ExternalLink className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => toast("Documentação", { description: `Abrindo docs de ${item.name}`, duration: 2000 }) },
              ]),
            ]}
          />
        </div>
      </div>

      {/* Features */}
      <div className="flex items-center gap-1.5 px-4 pb-2 flex-wrap">
        {item.features.slice(0, 4).map((f) => (
          <span key={f} className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] text-[9px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
            {f}
          </span>
        ))}
        {item.features.length > 4 && (
          <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] text-[9px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>
            +{item.features.length - 4}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#F2F2F7]">
        <div className="flex items-center gap-3">
          {isConnected && item.lastSync ? (
            <span className="flex items-center gap-1 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              <Clock className="w-2.5 h-2.5" />
              Sync: {item.lastSync}
            </span>
          ) : (
            <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
              Não conectado
            </span>
          )}
          {isConnected && item.usageCount !== undefined && (
            <>
              <span className="w-px h-3 bg-[#F2F2F7]" />
              <span className="text-[10px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>
                {item.usageCount.toLocaleString()} chamadas
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={() => onConfigure(item)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <Settings className="w-3 h-3" />
              Configurar
            </button>
          )}
          <button
            onClick={() => onToggle(item.id)}
            className={"flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer " + (
              isConnected
                ? "border border-[#E5E5EA] text-[#FF3B30] hover:bg-[#FBF5F4]"
                : "bg-[#007AFF] text-white hover:bg-[#0066D6]"
            )}
            style={{ fontWeight: 600 }}
          >
            {isConnected ? (
              <>
                <X className="w-3 h-3" />
                Desconectar
              </>
            ) : (
              <>
                <Link2 className="w-3 h-3" />
                Conectar
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

type StatusFilter = "all" | "connected" | "disconnected";

export function IntegracoesPage() {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | "all">("all");
  const [drawerItem, setDrawerItem] = useState<Integration | null>(null);

  useShellConfig({
    breadcrumb: { section: "Sistema", page: "Integrações" },
  });

  /* ── Derived ── */
  const connected = integrations.filter((i) => i.status === "connected").length;
  const disconnected = integrations.filter((i) => i.status === "disconnected").length;
  const categories = [...new Set(integrations.map((i) => i.category))];
  const totalUsage = integrations.reduce((s, i) => s + (i.usageCount ?? 0), 0);

  /* ── Search & filter ── */
  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = integrations;
    if (statusFilter === "connected") list = list.filter((i) => i.status === "connected");
    else if (statusFilter === "disconnected") list = list.filter((i) => i.status !== "connected");
    if (categoryFilter !== "all") list = list.filter((i) => i.category === categoryFilter);
    if (q) list = list.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.features.some((f) => f.toLowerCase().includes(q))
    );
    return list;
  }, [integrations, statusFilter, categoryFilter, q]);

  /* ── Category counts ── */
  const catCounts = useMemo(() => {
    const m: Partial<Record<IntegrationCategory, number>> = {};
    for (const i of integrations) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [integrations]);

  /* ── Grouped by category ── */
  const grouped = useMemo(() => {
    const result: { category: IntegrationCategory; items: Integration[] }[] = [];
    const catOrder: IntegrationCategory[] = ["Produtividade", "Comunicação", "Pagamentos", "Armazenamento", "Marketing", "Automação"];
    for (const cat of catOrder) {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length > 0) result.push({ category: cat, items });
    }
    return result;
  }, [filtered]);

  /* ── Actions ── */
  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = i.status !== "connected";
        toast.success(next ? "Integração conectada!" : "Integração desconectada", { description: i.name, duration: 3000 });
        return {
          ...i,
          status: next ? "connected" as IntegrationStatus : "disconnected" as IntegrationStatus,
          lastSync: next ? "agora" : undefined,
          apiKey: next ? "key-****-****-" + Math.random().toString(36).slice(2, 6) : undefined,
          usageCount: next ? 0 : undefined,
        };
      }),
    );
  };

  const syncIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        toast.success("Sincronização iniciada", { description: `${i.name} — atualizando dados...`, duration: 3000 });
        return { ...i, lastSync: "agora", status: "connected" as IntegrationStatus };
      }),
    );
  };

  const syncAll = () => {
    setIntegrations((prev) =>
      prev.map((i) => i.status === "connected" ? { ...i, lastSync: "agora" } : i)
    );
    toast.success("Sincronização em lote", { description: `${connected} integrações sincronizadas`, duration: 3000 });
  };

  /* ── KPIs ── */
  const kpis = {
    projetos: { label: "Total", value: String(integrations.length), sub: categories.length + " categorias" },
    aReceber: { label: "Conectadas", value: String(connected), sub: "ativas agora" },
    producao: { label: "Disponíveis", value: String(disconnected), sub: "para conectar" },
    compromissos: { label: "Chamadas API", value: totalUsage > 1000 ? (totalUsage / 1000).toFixed(1) + "k" : String(totalUsage), sub: "no período" },
  };

  const hairline = "bg-[#F2F2F7]";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      <OnboardingBanner
        id="integracoes-intro"
        title="Integrações"
        message="Conecte o ESSYN ao Google Calendar, WhatsApp, Stripe e mais para automatizar todo o seu workflow."
      />

      {/* ── Header Widget ── */}
      <HeaderWidget
        greeting="Integrações"
        userName=""
        contextLine={`${connected} de ${integrations.length} conectadas · Sincronize seu workflow`}
        quickActions={[
          { label: "Sincronizar tudo", icon: <RefreshCw className="w-4 h-4" />, onClick: syncAll },
          { label: "Documentação", icon: <ExternalLink className="w-4 h-4" />, onClick: () => toast("Documentação", { description: "Abrindo centro de ajuda para integrações", duration: 2000 }) },
        ]}
        showSearch
        searchPlaceholder="Buscar integrações..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className={`mx-5 h-px ${hairline}`} />
        <DashboardKpiGrid
          flat
          projetos={kpis.projetos}
          aReceber={kpis.aReceber}
          producao={kpis.producao}
          compromissos={kpis.compromissos}
        />
      </HeaderWidget>

      {/* ── Content states ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetSkeleton rows={5} delay={0.06} />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}>
              <WidgetEmptyState icon={<Plug className="w-5 h-5" />} message="Nenhuma integração disponível — novas conexões serão adicionadas em breve" />
            </WidgetCard>
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}>
              <WidgetErrorState message="Erro ao carregar integrações" onRetry={() => setViewState("ready")} />
            </WidgetCard>
          </motion.div>
        ) : (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="flex flex-col gap-4">

            {/* ── Filter bar ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status filter */}
                <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
                  {([
                    { key: "all" as StatusFilter, label: "Todas", count: integrations.length },
                    { key: "connected" as StatusFilter, label: "Conectadas", count: connected },
                    { key: "disconnected" as StatusFilter, label: "Disponíveis", count: disconnected },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (statusFilter === f.key ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]")}
                      style={{ fontWeight: 500 }}
                    >
                      {f.label}
                      <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (categoryFilter === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")}
                  style={{ fontWeight: 500 }}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as IntegrationCategory)}
                    className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (categoryFilter === cat ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")}
                    style={{ fontWeight: 500 }}
                  >
                    {cat} ({catCounts[cat as IntegrationCategory] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            {/* ── Grouped integration cards ── */}
            {grouped.length === 0 ? (
              <WidgetCard delay={0.06}>
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Search className="w-5 h-5 text-[#D1D1D6]" />
                  <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                    {q ? <>Nenhuma integração encontrada para "<span className="text-[#8E8E93]" style={{ fontWeight: 500 }}>{searchQuery}</span>"</> : "Nenhuma integração nesta categoria"}
                  </span>
                </div>
              </WidgetCard>
            ) : (
              grouped.map((group, gi) => {
                const cc = categoryConfig[group.category];
                return (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springStagger(gi)}
                    className="flex flex-col gap-3"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cc.bg, color: cc.color }}>
                        {cc.icon}
                      </div>
                      <span className="text-[14px] text-[#636366]" style={{ fontWeight: 600 }}>{group.category}</span>
                      <span className="text-[11px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>{group.items.length} {group.items.length === 1 ? "integração" : "integrações"}</span>
                      <span className="w-px h-3 bg-[#E5E5EA]" />
                      <span className="text-[10px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
                        {group.items.filter((i) => i.status === "connected").length} conectadas
                      </span>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map((integ, idx) => (
                        <IntegrationCard
                          key={integ.id}
                          item={integ}
                          index={gi * 4 + idx}
                          onToggle={toggleConnection}
                          onSync={syncIntegration}
                          onConfigure={(item) => setDrawerItem(item)}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shrink-0" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>{filtered.length}</span>{" "}integrações
                {statusFilter !== "all" && <span className="text-[#C7C7CC]"> · filtro: {statusFilter === "connected" ? "conectadas" : "disponíveis"}</span>}
                {categoryFilter !== "all" && <span className="text-[#C7C7CC]"> · {categoryFilter}</span>}
              </span>
              <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                {connected} conectadas · {disconnected} disponíveis · {totalUsage.toLocaleString()} chamadas API
              </span>
            </div>

            {/* ── View state debug (dev) ── */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
                {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
                  <button key={s} onClick={() => setViewState(s)} className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (viewState === s ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>{s}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Configuration Drawer ── */}
      <IntegrationDrawer
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        integration={drawerItem}
        onDisconnect={toggleConnection}
        onSync={syncIntegration}
      />
    </div>
  );
}
