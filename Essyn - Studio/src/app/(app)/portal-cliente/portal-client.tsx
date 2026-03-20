"use client";

import { useState } from "react";
import {
  Globe,
  Image,
  FileSignature,
  CreditCard,
  MousePointerClick,
  Link2,
  Send,
  Loader2,
  Check,
  Clock,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { motion } from "motion/react";
import {
  PageTransition,
} from "@/components/ui/apple-kit";
import { springDefault } from "@/lib/motion-tokens";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PortalStats {
  totalClients: number;
  sharedGalleries: number;
  paidInstallments: number;
  totalInstallments: number;
  paidValue: number;
  signedContracts: number;
  totalContracts: number;
}

interface ClientAccess {
  id: string;
  name: string;
  email: string | null;
  portal_sent_at: string | null;
  portal_last_access: string | null;
}

interface Props {
  studioId: string;
  studioName: string;
  stats: PortalStats;
  clientsWithAccess: ClientAccess[];
  clientsWithoutAccess: ClientAccess[];
}

/* ------------------------------------------------------------------ */
/*  Features list                                                      */
/* ------------------------------------------------------------------ */

const portalFeatures = [
  {
    icon: Image,
    title: "Visualizar galerias",
    description: "Clientes acessam galerias de fotos com opção de download e favoritos.",
  },
  {
    icon: FileSignature,
    title: "Contratos digitais",
    description: "Visualização de contratos com status de assinatura.",
  },
  {
    icon: CreditCard,
    title: "Acompanhar pagamentos",
    description: "Status de parcelas, valores e datas de vencimento.",
  },
  {
    icon: MousePointerClick,
    title: "Selecionar fotos",
    description: "Seleção de fotos para álbum diretamente na galeria compartilhada.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PortalClienteClient({ studioId, stats, clientsWithAccess, clientsWithoutAccess }: Props) {
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [previewingFor, setPreviewingFor] = useState<string | null>(null);

  async function handlePreviewPortal(clientId: string) {
    setPreviewingFor(clientId);
    try {
      const res = await fetch("/api/portal/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerar link");
        return;
      }
      window.open(data.url, "_blank");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setPreviewingFor(null);
    }
  }

  const paidPercent = stats.totalInstallments > 0
    ? Math.round((stats.paidInstallments / stats.totalInstallments) * 100)
    : 0;

  async function handleSendAccess(clientId: string, email: string) {
    setSendingFor(clientId);
    try {
      const res = await fetch("/api/portal/send-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, studioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar acesso");
        return;
      }
      if (data.warning) {
        toast.warning("SMTP não configurado — email não foi enviado. Configure as variáveis de ambiente.");
      } else {
        toast.success(`Acesso enviado para ${email}`);
      }
      setSentIds((prev) => new Set(prev).add(clientId));
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSendingFor(null);
    }
  }

  async function handleBulkSend() {
    const eligible = clientsWithoutAccess.filter((c) => c.email && !sentIds.has(c.id));
    if (eligible.length === 0) return;

    setBulkSending(true);
    setBulkProgress({ current: 0, total: eligible.length });
    let successCount = 0;

    for (let i = 0; i < eligible.length; i++) {
      const client = eligible[i];
      setBulkProgress({ current: i + 1, total: eligible.length });
      try {
        const res = await fetch("/api/portal/send-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: client.id, studioId }),
        });
        if (res.ok) {
          successCount++;
          setSentIds((prev) => new Set(prev).add(client.id));
        }
      } catch {
        // continue with next client
      }
      // Small delay to avoid rate limiting
      if (i < eligible.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setBulkSending(false);
    toast.success(`Acesso enviado para ${successCount} clientes`);
  }

  const accessedCount = clientsWithAccess.filter((c) => c.portal_last_access).length;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ═══ Header + Stats ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Portal do Cliente</h1>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1">
              {stats.totalClients} clientes · {accessedCount} acessaram o portal · {formatCurrency(stats.paidValue)} recebido
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <div className="px-5 py-4 text-left">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Com acesso</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{clientsWithAccess.length}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">de {stats.totalClients} clientes</p>
            </div>
            <div className="px-5 py-4 text-left">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Galerias Ativas</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{stats.sharedGalleries}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">compartilhadas</p>
            </div>
            <div className="px-5 py-4 text-left">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Parcelas Pagas</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{stats.paidInstallments}/{stats.totalInstallments}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{paidPercent}%</p>
            </div>
            <div className="px-5 py-4 text-left">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Contratos</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{stats.signedContracts}/{stats.totalContracts}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">assinados</p>
            </div>
          </div>
        </div>

        {/* ═══ Clientes com acesso ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.1 }}
        >
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-[var(--success)]" />
                <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">
                  Clientes com acesso ({clientsWithAccess.length})
                </h2>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)]">
              {clientsWithAccess.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Globe size={24} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-30" />
                  <p className="text-[13px] text-[var(--fg-muted)]">Nenhum cliente com acesso ao portal ainda.</p>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1">Envie o acesso pelo cadastro do cliente.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {clientsWithAccess.map((client) => (
                    <div key={client.id} className="px-6 py-3 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--fg)] truncate">{client.name}</p>
                        <p className="text-[11px] text-[var(--fg-muted)] truncate">{client.email}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        {client.portal_last_access ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                            <span className="text-[11px] text-[var(--fg-muted)]">
                              Acessou {timeAgo(client.portal_last_access)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-[var(--warning)]" />
                            <span className="text-[11px] text-[var(--fg-muted)]">
                              Enviado {client.portal_sent_at ? timeAgo(client.portal_sent_at) : ""}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => handlePreviewPortal(client.id)}
                          disabled={previewingFor === client.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg text-[var(--info)] hover:bg-[var(--info-subtle)] transition-colors disabled:opacity-40"
                          title="Abrir portal deste cliente"
                        >
                          {previewingFor === client.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}
                          Ver portal
                        </button>
                        <button
                          onClick={() => handleSendAccess(client.id, client.email!)}
                          disabled={sendingFor === client.id || sentIds.has(client.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-40"
                          title="Reenviar acesso por email"
                        >
                          {sendingFor === client.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : sentIds.has(client.id) ? (
                            <Check size={12} className="text-[var(--success)]" />
                          ) : (
                            <Send size={12} />
                          )}
                          {sentIds.has(client.id) ? "Enviado" : "Reenviar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ Clientes sem acesso (com email) ═══ */}
        {clientsWithoutAccess.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: 0.15 }}
          >
            <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-[var(--warning)]" />
                  <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">
                    Sem acesso ao portal ({clientsWithoutAccess.length})
                  </h2>
                </div>
                <button
                  onClick={handleBulkSend}
                  disabled={bulkSending || clientsWithoutAccess.every((c) => sentIds.has(c.id))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[var(--info)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {bulkSending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Enviando {bulkProgress.current} de {bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Enviar para todos
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                {clientsWithoutAccess.slice(0, 10).map((client) => (
                  <div key={client.id} className="px-6 py-3 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--fg)] truncate">{client.name}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] truncate">{client.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => handlePreviewPortal(client.id)}
                        disabled={previewingFor === client.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg text-[var(--info)] hover:bg-[var(--info-subtle)] transition-colors disabled:opacity-40"
                        title="Abrir portal deste cliente"
                      >
                        {previewingFor === client.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                        Ver portal
                      </button>
                    <button
                      onClick={() => handleSendAccess(client.id, client.email!)}
                      disabled={sendingFor === client.id || sentIds.has(client.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[var(--info)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {sendingFor === client.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : sentIds.has(client.id) ? (
                        <>
                          <Check size={12} />
                          Enviado
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Enviar acesso
                        </>
                      )}
                    </button>
                    </div>
                  </div>
                ))}
                {clientsWithoutAccess.length > 10 && (
                  <div className="px-6 py-3 text-center">
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      e mais {clientsWithoutAccess.length - 10} clientes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ O que o portal oferece ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.2 }}
        >
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 flex items-center gap-2">
              <Globe size={16} className="text-[var(--info)]" />
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">O que o portal oferece</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-[var(--border-subtle)]">
              {portalFeatures.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`p-4 flex items-start gap-3 ${i >= 2 ? "border-t border-[var(--border-subtle)]" : ""} ${i % 2 === 0 ? "sm:border-r sm:border-[var(--border-subtle)]" : ""}`}
                  >
                    <Icon size={20} className="text-[var(--fg-secondary)] shrink-0" />
                    <div>
                      <h3 className="text-[13px] font-medium text-[var(--fg)]">
                        {feature.title}
                      </h3>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ Como funciona ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.25 }}
        >
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="px-6 py-4 flex items-center gap-3">
              <Link2 size={20} className="text-[var(--fg-secondary)] shrink-0" />
              <div>
                <h3 className="text-[13px] font-medium text-[var(--fg)]">
                  Como funciona o acesso
                </h3>
                <p className="text-[11px] text-[var(--fg-muted)]">
                  Cada cliente recebe um link unico e seguro por email.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] px-6 py-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--info-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-[var(--info)]">1</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--fg)]">Envie o acesso</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">Clique em &ldquo;Enviar acesso&rdquo; ao lado do cliente acima, ou pelo cadastro do cliente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--info-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-[var(--info)]">2</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--fg)]">Cliente recebe email</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">Um link seguro e enviado por email (valido por 15 minutos).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--info-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-[var(--info)]">3</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--fg)]">Acesso por 30 dias</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">Apos clicar no link, o cliente tem acesso ao portal por 30 dias. Depois, basta reenviar.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
