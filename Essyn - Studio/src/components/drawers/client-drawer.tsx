"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  Briefcase,
  Star,
  Edit,
  Check,
  X,
  Loader2,
  Crown,
  UserX,
  UserCheck,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { springContentIn } from "@/lib/motion-tokens";
import {
  AppleDrawer,
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  StatusBadge,
  SectionHeader,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

type ClientStatus = "ativo" | "inativo" | "vip";

interface ClientData {
  id: string;
  studio_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: ClientStatus;
  notes: string | null;
  tags: string[];
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface ClientProject {
  id: string;
  name: string;
  status: string;
  event_type: string;
  event_date: string | null;
  value: number;
}

interface ClientInstallment {
  id: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
}

interface ClientDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

// ═══════════════════════════════════════════════
// Status helpers
// ═══════════════════════════════════════════════

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  ativo: { label: "Ativo", color: "var(--success)", bg: "var(--success-subtle)" },
  inativo: { label: "Inativo", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  vip: { label: "VIP", color: "var(--accent)", bg: "var(--accent-subtle)" },
};

const PROJECT_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--bg)" },
  confirmado: { label: "Confirmado", color: "var(--info)", bg: "var(--info-subtle)" },
  producao: { label: "Produção", color: "var(--warning)", bg: "var(--warning-subtle)" },
  edicao: { label: "Edição", color: "var(--warning)", bg: "var(--warning-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error-subtle)" },
};

const EVENT_TYPE_MAP: Record<string, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export function ClientDrawer({ clientId, onClose }: ClientDrawerProps) {
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [installments, setInstallments] = useState<ClientInstallment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [sendingPortalAccess, setSendingPortalAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const [
        { data: clientData, error: clientErr },
        { data: projectsData },
        { data: installmentsData },
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, studio_id, name, email, phone, document, address, city, state, status, notes, tags, total_spent, created_at, updated_at")
          .eq("id", id)
          .single(),
        supabase
          .from("projects")
          .select("id, name, status, event_type, event_date, value")
          .eq("client_id", id)
          .order("event_date", { ascending: false }),
        supabase
          .from("installments")
          .select("id, amount, status, due_date, paid_at")
          .eq("client_id", id)
          .order("due_date"),
      ]);

      if (clientErr) throw clientErr;

      setClient(clientData as ClientData);
      setProjects((projectsData || []) as ClientProject[]);
      setInstallments((installmentsData || []) as ClientInstallment[]);
    } catch (err) {
      console.error("Client drawer fetch error:", err);
      setError("Erro ao carregar dados do cliente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchData(clientId);
      setEditing(false);
    } else {
      setClient(null);
      setProjects([]);
      setInstallments([]);
    }
  }, [clientId, fetchData]);

  // Populate edit form when client loads
  useEffect(() => {
    if (client) {
      setEditForm({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        document: client.document || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  async function handleSave() {
    if (!client) return;
    setSaving(true);

    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from("clients")
      .update({
        name: editForm.name.trim(),
        email: editForm.email || null,
        phone: editForm.phone || null,
        document: editForm.document || null,
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        notes: editForm.notes || null,
      })
      .eq("id", client.id);

    if (updateErr) {
      toast.error("Erro: " + updateErr.message);
    } else {
      toast.success("Cliente atualizado!");
      setEditing(false);
      fetchData(client.id);
      router.refresh();
    }
    setSaving(false);
  }

  async function toggleStatus(newStatus: ClientStatus) {
    if (!client) return;

    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from("clients")
      .update({ status: newStatus })
      .eq("id", client.id);

    if (updateErr) {
      toast.error("Erro: " + updateErr.message);
    } else {
      toast.success(`Status alterado para ${STATUS_CONFIG[newStatus].label}`);
      fetchData(client.id);
      router.refresh();
    }
  }

  // Financial summary
  const totalValue = projects.reduce((sum, p) => sum + Number(p.value || 0), 0);
  const totalPaid = installments
    .filter((i) => i.status === "pago")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalPending = totalValue - totalPaid;

  const statusInfo = client ? STATUS_CONFIG[client.status] : null;

  return (
    <AppleDrawer
      open={!!clientId}
      onClose={onClose}
      title={client?.name || "Carregando..."}
      width="max-w-md"
    >
      {loading ? (
        <div className="p-6">
          <WidgetSkeleton lines={5} />
        </div>
      ) : error ? (
        <div className="p-6">
          <WidgetErrorState message={error} onRetry={() => clientId && fetchData(clientId)} />
        </div>
      ) : client ? (
        <div className="flex flex-col">
          {/* Status + Actions Header */}
          <motion.div {...springContentIn} className="px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--border-subtle)] flex items-center justify-center">
                  {client.status === "vip" ? (
                    <Star size={18} className="text-[var(--accent)]" fill="currentColor" />
                  ) : (
                    <span className="text-[15px] font-semibold text-[var(--fg-muted)]">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <StatusBadge label={statusInfo!.label} color={statusInfo!.color} bg={statusInfo!.bg} />
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    Cliente desde {formatDate(client.created_at?.split("T")[0] || client.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Status toggle buttons */}
                {client.status !== "vip" && (
                  <button
                    onClick={() => toggleStatus("vip")}
                    className={GHOST_BTN}
                    title="Marcar como VIP"
                  >
                    <Crown size={16} />
                  </button>
                )}
                {client.status !== "ativo" && (
                  <button
                    onClick={() => toggleStatus("ativo")}
                    className={GHOST_BTN}
                    title="Marcar como Ativo"
                  >
                    <UserCheck size={16} />
                  </button>
                )}
                {client.status !== "inativo" && (
                  <button
                    onClick={() => toggleStatus("inativo")}
                    className={GHOST_BTN}
                    title="Marcar como Inativo"
                  >
                    <UserX size={16} />
                  </button>
                )}
                <button
                  onClick={() => setEditing(!editing)}
                  className={GHOST_BTN}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Edit Mode */}
          {editing && (
            <motion.div {...springContentIn} className="px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLS}>Nome</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Telefone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL_CLS}>CPF</label>
                    <input
                      type="text"
                      value={editForm.document}
                      onChange={(e) => setEditForm({ ...editForm, document: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Cidade</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Estado</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      maxLength={2}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Endereço</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Observações</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--info)] focus:border-transparent transition-shadow resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className={SECONDARY_CTA}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editForm.name.trim()}
                    className={PRIMARY_CTA}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contact Info */}
          <motion.div {...springContentIn} className="px-6 py-4">
            <SectionHeader title="Contato" />
            <WidgetCard className="divide-y divide-[var(--border)]" hover={false}>
              {client.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail size={14} className="text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[13px] text-[var(--fg)]">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone size={14} className="text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[13px] text-[var(--fg)]">{client.phone}</span>
                </div>
              )}
              {client.document && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FileText size={14} className="text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[13px] text-[var(--fg)]">{client.document}</span>
                </div>
              )}
              {(client.city || client.state || client.address) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin size={14} className="text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[13px] text-[var(--fg)]">
                    {[client.address, client.city, client.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {!client.email && !client.phone && !client.document && !client.city && !client.address && (
                <div className="px-4 py-3 text-[12px] text-[var(--fg-muted)]">
                  Nenhuma informação de contato cadastrada.
                </div>
              )}
            </WidgetCard>
          </motion.div>

          {/* Send Portal Access */}
          {client.email && (
            <motion.div {...springContentIn} className="px-6 pb-4">
              <button
                onClick={async () => {
                  if (sendingPortalAccess) return;
                  setSendingPortalAccess(true);
                  try {
                    const res = await fetch("/api/portal/send-access", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ clientId: client.id, studioId: client.studio_id }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      toast.success(`Acesso ao portal enviado para ${result.email}`);
                    } else {
                      toast.error(result.error || "Erro ao enviar acesso");
                    }
                  } catch {
                    toast.error("Erro ao enviar acesso ao portal");
                  } finally {
                    setSendingPortalAccess(false);
                  }
                }}
                disabled={sendingPortalAccess}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[12px] font-medium text-[var(--accent)] bg-[var(--accent-subtle)] hover:opacity-80 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                {sendingPortalAccess ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Enviar acesso ao portal
              </button>
            </motion.div>
          )}

          {/* Financial Summary */}
          <motion.div {...springContentIn} className="px-6 pb-4">
            <SectionHeader title="Financeiro" />
            <div className="grid grid-cols-3 gap-3">
              <WidgetCard className="p-3 text-center" hover={false}>
                <p className="text-[10px] text-[var(--fg-muted)] mb-0.5">Valor Total</p>
                <p className="text-[14px] font-bold text-[var(--fg)]">{formatCurrency(totalValue)}</p>
              </WidgetCard>
              <WidgetCard className="p-3 text-center" hover={false}>
                <p className="text-[10px] text-[var(--fg-muted)] mb-0.5">Pago</p>
                <p className="text-[14px] font-bold text-[var(--success)]">{formatCurrency(totalPaid)}</p>
              </WidgetCard>
              <WidgetCard className="p-3 text-center" hover={false}>
                <p className="text-[10px] text-[var(--fg-muted)] mb-0.5">Pendente</p>
                <p className="text-[14px] font-bold text-[var(--warning)]">{formatCurrency(totalPending < 0 ? 0 : totalPending)}</p>
              </WidgetCard>
            </div>
          </motion.div>

          {/* Projects */}
          <motion.div {...springContentIn} className="px-6 pb-6">
            <SectionHeader title={`Projetos (${projects.length})`} />
            {projects.length === 0 ? (
              <WidgetCard hover={false}>
                <WidgetEmptyState
                  icon={Briefcase}
                  title="Nenhum projeto"
                  description="Este cliente ainda não possui projetos."
                />
              </WidgetCard>
            ) : (
              <WidgetCard className="divide-y divide-[var(--border)]" hover={false}>
                {projects.map((proj) => {
                  const projStatus = PROJECT_STATUS_MAP[proj.status] || {
                    label: proj.status,
                    color: "var(--fg-muted)",
                    bg: "var(--bg)",
                  };
                  const eventLabel = EVENT_TYPE_MAP[proj.event_type] || proj.event_type;

                  return (
                    <div key={proj.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                          {proj.name}
                        </p>
                        <p className="text-[11px] text-[var(--fg-muted)]">
                          {eventLabel} {proj.event_date ? ` · ${formatDate(proj.event_date)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[var(--fg-muted)]">
                          {formatCurrency(Number(proj.value || 0))}
                        </span>
                        <StatusBadge label={projStatus.label} color={projStatus.color} bg={projStatus.bg} />
                      </div>
                    </div>
                  );
                })}
              </WidgetCard>
            )}
          </motion.div>

          {/* Notes */}
          {client.notes && (
            <motion.div {...springContentIn} className="px-6 pb-6">
              <SectionHeader title="Observações" />
              <WidgetCard className="p-4" hover={false}>
                <p className="text-[13px] text-[var(--fg-secondary)] whitespace-pre-wrap">
                  {client.notes}
                </p>
              </WidgetCard>
            </motion.div>
          )}
        </div>
      ) : null}
    </AppleDrawer>
  );
}
