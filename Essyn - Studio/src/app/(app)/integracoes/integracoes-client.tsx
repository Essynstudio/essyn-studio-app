"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, MessageCircle, Banknote, HardDrive, FileSignature,
  Link2, ExternalLink, ChevronRight, Zap, Check, X, Loader2,
  Eye, EyeOff, AlertCircle, Shield, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  PageTransition, HeaderWidget, WidgetCard, AppleModal,
} from "@/components/ui/apple-kit";
import { springDefault, springSnappy } from "@/lib/motion-tokens";
import {
  PRIMARY_CTA, SECONDARY_CTA, INPUT_CLS, LABEL_CLS, GHOST_BTN,
} from "@/lib/design-tokens";
import { toast } from "sonner";

/* ── Types ── */
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: string;
  provider: string;
  status: "disponivel" | "em_breve";
  features: string[];
  learnMoreUrl?: string;
  configurable: boolean;
  authType?: "oauth" | "apikey";
}

interface ActiveIntegration {
  id: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  connected_at: string | null;
}

/* ── Integration registry ── */
const INTEGRATIONS: Integration[] = [
  {
    id: "asaas",
    name: "Asaas",
    description: "Cobranças automáticas via PIX, boleto e cartão de crédito. Reconciliação e parcelamento integrados.",
    icon: Banknote,
    category: "Pagamentos",
    provider: "asaas",
    status: "disponivel",
    configurable: true,
    features: [
      "PIX com QR Code e confirmação instantânea",
      "Boleto registrado com baixa automática",
      "Cartão de crédito com parcelamento",
      "Cobrança recorrente para contratos",
    ],
    learnMoreUrl: "https://www.asaas.com",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincronize sessões, entregas e reuniões automaticamente com seu Google Calendar.",
    icon: Calendar,
    category: "Agenda",
    provider: "google_calendar",
    status: "disponivel",
    configurable: true,
    authType: "oauth",
    features: [
      "Eventos criados na Essyn aparecem no Google Calendar",
      "Alterações e exclusões sincronizadas automaticamente",
      "Suporte a todos os tipos de evento",
      "Lembretes automáticos via Google",
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envie confirmações, lembretes de pagamento e links de galeria direto no WhatsApp do cliente.",
    icon: MessageCircle,
    category: "Comunicação",
    provider: "whatsapp",
    status: "em_breve",
    configurable: false,
    features: [
      "Confirmação de sessão automática",
      "Lembrete de pagamento antes do vencimento",
      "Envio de link da galeria quando pronta",
      "Templates personalizáveis por tipo de evento",
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Backup automático das galerias e entrega de fotos em alta resolução para clientes.",
    icon: HardDrive,
    category: "Armazenamento",
    provider: "google_drive",
    status: "em_breve",
    configurable: false,
    features: [
      "Backup automático após cada sessão",
      "Organização por projeto e data",
      "Entrega de RAWs via link compartilhado",
      "Sincronização com a equipe de edição",
    ],
  },
  {
    id: "autentique",
    name: "Autentique",
    description: "Assinatura digital de contratos com validade jurídica. O cliente assina pelo celular.",
    icon: FileSignature,
    category: "Contratos",
    provider: "autentique",
    status: "em_breve",
    configurable: false,
    features: [
      "Assinatura digital com validade jurídica (ICP-Brasil)",
      "Cliente recebe link e assina pelo celular",
      "Status atualiza automaticamente na Essyn",
      "Certificado de assinatura gerado",
    ],
    learnMoreUrl: "https://www.autentique.com.br",
  },
];

/* ── Component ── */
interface Props {
  studioId: string;
  activeIntegrations: ActiveIntegration[];
}

export function IntegracoesClient({ studioId, activeIntegrations }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configModalProvider, setConfigModalProvider] = useState<string | null>(null);
  const [actives, setActives] = useState<ActiveIntegration[]>(activeIntegrations);
  const router = useRouter();

  // Handle OAuth callback success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "google_calendar") {
      toast.success("Google Calendar conectado com sucesso!");
      router.replace("/integracoes");
    } else if (params.get("error") === "google_calendar_denied") {
      toast.error("Conexão com Google Calendar cancelada.");
      router.replace("/integracoes");
    }
  }, [router]);

  const getActive = (provider: string) =>
    actives.find((a) => a.provider === provider && a.status === "connected");

  const connectedCount = actives.filter((a) => a.status === "connected").length;

  return (
    <PageTransition>
      <HeaderWidget
        title="Integrações"
        subtitle="Conecte as ferramentas que você já usa ao Essyn."
      >
        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]/20">
              <Check size={13} className="text-[var(--success)]" />
              <span className="text-[11px] font-semibold text-[var(--success)]">{connectedCount} conectada{connectedCount > 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <Zap size={13} className="text-[var(--fg-muted)]" />
            <span className="text-[11px] text-[var(--fg-muted)]">{INTEGRATIONS.length} disponíveis</span>
          </div>
        </div>
      </HeaderWidget>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration, index) => {
          const Icon = integration.icon;
          const isExpanded = expandedId === integration.id;
          const active = getActive(integration.provider);
          const isConnected = !!active;

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springDefault, delay: 0.03 + index * 0.05 }}
            >
              <WidgetCard className="overflow-hidden" hover={false}>
                {/* Main row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isConnected
                        ? "var(--success-subtle)"
                        : "color-mix(in srgb, var(--fg-muted) 12%, transparent)",
                    }}
                  >
                    <Icon
                      size={18}
                      className={isConnected ? "text-[var(--success)]" : "text-[var(--fg-muted)]"}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-[var(--fg)]">
                        {integration.name}
                      </h3>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--fg-muted) 10%, transparent)",
                          color: "var(--fg-muted)",
                        }}
                      >
                        {integration.category}
                      </span>
                      {isConnected && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-[var(--success-subtle)] text-[var(--success)]">
                          Conectado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                      {integration.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {integration.status === "em_breve" ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border-subtle)]">
                        Em breve
                      </span>
                    ) : isConnected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((integration as { authType?: string }).authType === "oauth") {
                            setConfigModalProvider(integration.provider);
                          } else {
                            setConfigModalProvider(integration.provider);
                          }
                        }}
                        className={`${GHOST_BTN} !p-1.5`}
                        title="Configurações"
                      >
                        <RefreshCw size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((integration as { authType?: string }).authType === "oauth") {
                            window.location.href = `/api/integrations/${integration.provider.replace(/_/g, "-")}/connect`;
                          } else {
                            setConfigModalProvider(integration.provider);
                          }
                        }}
                        className={`${PRIMARY_CTA} !h-8 !px-4 !text-[12px]`}
                      >
                        <Link2 size={14} />
                        Conectar
                      </button>
                    )}
                    <ChevronRight
                      size={16}
                      className={`text-[var(--fg-muted)] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={springDefault}
                    className="border-t border-[var(--border-subtle)]"
                  >
                    <div className="p-4 bg-[var(--bg-subtle)]/50">
                      <p className="text-[11px] font-semibold text-[var(--fg-secondary)] uppercase tracking-wide mb-3">
                        O que essa integração faz
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {integration.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[var(--fg-muted)]"
                            />
                            <span className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {isConnected && active?.connected_at && (
                        <p className="text-[10px] text-[var(--fg-muted)] mt-3">
                          Conectado em {new Date(active.connected_at).toLocaleDateString("pt-BR")}
                          {(active.config as { sandbox?: boolean })?.sandbox && " · Modo sandbox"}
                        </p>
                      )}

                      {integration.learnMoreUrl && (
                        <a
                          href={integration.learnMoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-medium text-[var(--accent)] hover:underline"
                        >
                          Saiba mais sobre {integration.name}
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </WidgetCard>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 px-1"
      >
        <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
          Integrações são ativadas individualmente. Cada serviço requer uma conta própria. A Essyn se conecta via API oficial de cada plataforma para garantir segurança e estabilidade.
        </p>
      </motion.div>

      {/* Config Modal */}
      {configModalProvider === "asaas" && (
        <AsaasConfigModal
          active={getActive("asaas")}
          onClose={() => setConfigModalProvider(null)}
          onConnected={(integration) => {
            setActives((prev) => {
              const filtered = prev.filter((a) => a.provider !== "asaas");
              return [...filtered, integration];
            });
            setConfigModalProvider(null);
          }}
          onDisconnected={() => {
            setActives((prev) => prev.filter((a) => a.provider !== "asaas"));
            setConfigModalProvider(null);
          }}
        />
      )}

      {configModalProvider === "google_calendar" && (
        <GoogleCalendarConfigModal
          active={getActive("google_calendar")}
          onClose={() => setConfigModalProvider(null)}
          onDisconnected={() => {
            setActives((prev) => prev.filter((a) => a.provider !== "google_calendar"));
            setConfigModalProvider(null);
          }}
        />
      )}
    </PageTransition>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Asaas Config Modal                                            */
/* ═══════════════════════════════════════════════════════════════ */

function AsaasConfigModal({
  active,
  onClose,
  onConnected,
  onDisconnected,
}: {
  active: ActiveIntegration | undefined;
  onClose: () => void;
  onConnected: (i: ActiveIntegration) => void;
  onDisconnected: () => void;
}) {
  const isConnected = !!active;
  const [apiKey, setApiKey] = useState("");
  const [sandbox, setSandbox] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error("Cole sua API Key do Asaas");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/integrations/asaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), sandbox }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Falha na conexão");
        return;
      }

      toast.success(`Asaas conectado! ${data.testResult?.details || ""}`);
      onConnected(data.integration);
    } catch {
      toast.error("Erro de rede ao conectar");
    } finally {
      setTesting(false);
    }
  }, [apiKey, sandbox, onConnected]);

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/asaas", { method: "DELETE" });
      toast.success("Asaas desconectado");
      onDisconnected();
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  }, [onDisconnected]);

  return (
    <AppleModal open onClose={onClose} title="Configurar Asaas" maxWidth="max-w-sm">
      <div className="space-y-5">
        {/* Status */}
        {isConnected ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--success-subtle)] border border-[var(--success)]/20">
            <Check size={16} className="text-[var(--success)] shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-[var(--fg)]">Conectado</p>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {(active?.config as { sandbox?: boolean })?.sandbox ? "Ambiente sandbox" : "Ambiente de produção"}
                {active?.connected_at && ` · Desde ${new Date(active.connected_at).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <Shield size={16} className="text-[var(--fg-muted)] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">
                Acesse o painel do Asaas → Integrações → Gerar nova API Key.
                Sua chave é armazenada de forma segura e usada apenas para criar cobranças.
              </p>
            </div>
          </div>
        )}

        {/* API Key input */}
        {!isConnected && (
          <>
            <div>
              <label className={LABEL_CLS}>API Key do Asaas</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="$aas_xxxxxxxxxxxxxxxxxxxxxxx..."
                  className={`${INPUT_CLS} !pr-10`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className={`${GHOST_BTN} absolute right-1 top-1/2 -translate-y-1/2 !p-1.5`}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Sandbox toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Modo Sandbox</p>
                <p className="text-[11px] text-[var(--fg-muted)]">
                  Use para testes sem cobranças reais
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSandbox(!sandbox)}
                className="shrink-0 relative"
              >
                <motion.div
                  className="w-11 h-6 rounded-full p-0.5 transition-colors"
                  style={{
                    backgroundColor: sandbox ? "var(--warning)" : "var(--success)",
                  }}
                  animate={{ backgroundColor: sandbox ? "var(--warning)" : "var(--success)" }}
                  transition={springSnappy}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ x: sandbox ? 0 : 20 }}
                    transition={springSnappy}
                  />
                </motion.div>
              </button>
            </div>

            {sandbox && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--warning-subtle)] border border-[var(--warning)]/20">
                <AlertCircle size={13} className="text-[var(--warning)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">
                  No modo sandbox, cobranças são simuladas. Mude para produção quando estiver pronto.
                </p>
              </div>
            )}

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={testing || !apiKey.trim()}
              className={`${PRIMARY_CTA} w-full`}
            >
              {testing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testando conexão...
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  Conectar ao Asaas
                </>
              )}
            </button>
          </>
        )}

        {/* Connected actions */}
        {isConnected && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">
                Como funciona
              </p>
              <ul className="space-y-1.5 text-[12px] text-[var(--fg-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--fg-muted)]">1.</span>
                  Vá em Financeiro e clique em "Cobrar" em qualquer parcela pendente
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--fg-muted)]">2.</span>
                  A cobrança é criada no Asaas automaticamente (PIX, boleto ou cartão)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--fg-muted)]">3.</span>
                  Quando o cliente paga, o status atualiza automaticamente via webhook
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <AlertCircle size={13} className="text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                Configure o webhook no Asaas: Painel → Integrações → Webhooks → URL:{" "}
                <code className="text-[10px] bg-[var(--bg-elevated)] px-1 py-0.5 rounded">
                  https://app.essyn.studio/api/webhooks/asaas
                </code>
              </p>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className={`${SECONDARY_CTA} w-full !text-[var(--error)]`}
            >
              {disconnecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
              Desconectar Asaas
            </button>
          </div>
        )}
      </div>
    </AppleModal>
  );
}

// ─── Google Calendar Config Modal ────────────────────────────────────────────

function GoogleCalendarConfigModal({
  active,
  onClose,
  onDisconnected,
}: {
  active: ActiveIntegration | undefined;
  onClose: () => void;
  onDisconnected: () => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/google-calendar/disconnect", { method: "DELETE" });
      toast.success("Google Calendar desconectado");
      onDisconnected();
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <AppleModal open onClose={onClose} title="Google Calendar">
      <div className="p-6 space-y-4">
        {active ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--success-subtle)]">
              <Check size={16} className="text-[var(--success)]" />
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Conectado</p>
                {active.connected_at && (
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    Desde {new Date(active.connected_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[12px] text-[var(--fg-secondary)]">
              Eventos criados na Essyn são sincronizados automaticamente com o Google Calendar.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className={`${SECONDARY_CTA} w-full !text-[var(--error)]`}
            >
              {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Desconectar Google Calendar
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] text-[var(--fg-secondary)]">
              Conecte sua conta do Google para sincronizar eventos automaticamente.
            </p>
            <a
              href="/api/integrations/google-calendar/connect"
              className={`${PRIMARY_CTA} w-full justify-center`}
            >
              <Link2 size={14} />
              Conectar com Google
            </a>
          </>
        )}
      </div>
    </AppleModal>
  );
}
