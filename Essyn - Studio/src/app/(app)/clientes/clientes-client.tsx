"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Crown,
  Users,
  ChevronRight,
  Star,
  AlertCircle,
  X,
  DollarSign,
  Briefcase,
  UserCheck,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  StatusBadge,
  WidgetEmptyState,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  INPUT_ERROR_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { useClientDrawer } from "@/components/drawers/drawer-provider";

type ClientStatus = "ativo" | "inativo" | "vip";

interface Client {
  id: string;
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

interface ClientStats {
  total: number;
  active: number;
  vip: number;
  inactive: number;
  totalRevenue: number;
  totalProjects: number;
  avgTicket: number;
}

const statusConfig: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  ativo: { label: "Ativo", color: "var(--success)", bg: "var(--success-subtle)" },
  inativo: { label: "Inativo", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  vip: { label: "VIP", color: "var(--accent)", bg: "var(--accent-subtle)" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function ClientesClient({
  clients: initial,
  studioId,
  projectCounts,
  stats,
}: {
  clients: Client[];
  studioId: string;
  projectCounts: Record<string, { count: number; totalValue: number; lastType: string | null }>;
  stats: ClientStats;
}) {
  const router = useRouter();
  const { openClientDrawer } = useClientDrawer();
  const [clients, setClients] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "todos">("todos");
  const [showNewModal, setShowNewModal] = useState(false);
  const [dismissedInactive, setDismissedInactive] = useState(false);

  // Recompute stats from live clients array so they update when clients change
  const liveStats = useMemo<ClientStats>(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === "ativo").length;
    const vip = clients.filter(c => c.status === "vip").length;
    const inactive = clients.filter(c => c.status === "inativo").length;
    const totalRevenue = clients.reduce((s, c) => s + (c.total_spent || 0), 0);
    const totalProjects = Object.values(projectCounts).reduce((s, pc) => s + pc.count, 0);
    return {
      total,
      active,
      vip,
      inactive,
      totalRevenue,
      totalProjects,
      avgTicket: total > 0 ? totalRevenue / total : 0,
    };
  }, [clients, projectCounts]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        (projectCounts[c.id]?.lastType &&
          EVENT_TYPE_LABELS[projectCounts[c.id].lastType!]?.toLowerCase().includes(q));
      const matchesStatus = filterStatus === "todos" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, filterStatus, projectCounts]);

  function handleStatClick(type: "total" | "active" | "vip" | "inactive") {
    setSearch("");
    if (type === "total") {
      setFilterStatus("todos");
    } else if (type === "active") {
      setFilterStatus("ativo");
    } else if (type === "vip") {
      setFilterStatus("vip");
    } else if (type === "inactive") {
      setFilterStatus("inativo");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ═══ Unified Panel — header, search, alert, stats, filters all in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Clientes</h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {liveStats.total} {liveStats.total === 1 ? "cliente" : "clientes"} · {liveStats.vip} VIP · {formatCurrency(liveStats.totalRevenue)} faturado
                </p>
              </div>
              <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
                <Plus size={16} />
                Novo cliente
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar clientes, cidades, tipos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Alert Banner */}
          <AnimatePresence>
            {liveStats.inactive > 0 && !dismissedInactive && (
              <motion.div
                key="inactive_alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--info-subtle)]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--info)" }}>
                      {liveStats.inactive} cliente{liveStats.inactive !== 1 ? "s" : ""} inativo{liveStats.inactive !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                      Considere uma campanha de reativação.
                    </p>
                    <button
                      onClick={() => { setFilterStatus("inativo"); setDismissedInactive(true); }}
                      className="text-[11px] font-medium mt-1 hover:underline"
                      style={{ color: "var(--info)" }}
                    >
                      Ver inativos
                    </button>
                  </div>
                  <button
                    onClick={() => setDismissedInactive(true)}
                    className="p-1 shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <button
              onClick={() => handleStatClick("total")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "todos" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Total Clientes</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{liveStats.total}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{liveStats.vip} VIP</p>
            </button>
            <button
              onClick={() => handleStatClick("active")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "ativo" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Ativos</p>
              <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">{liveStats.active}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{liveStats.inactive} inativo{liveStats.inactive !== 1 ? "s" : ""}</p>
            </button>
            <button
              onClick={() => handleStatClick("vip")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "vip" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Receita Total</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatCurrency(liveStats.totalRevenue)}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{liveStats.totalProjects} projetos</p>
            </button>
            <button
              onClick={() => handleStatClick("inactive")}
              className={`group px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors ${filterStatus === "inativo" ? "bg-[var(--card-hover)]" : ""}`}
            >
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Ticket Médio</p>
              <p className="text-[24px] font-bold text-[var(--accent)] tracking-[-0.026em] leading-none tabular-nums">{formatCurrency(liveStats.avgTicket)}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">por cliente</p>
            </button>
          </div>

          {/* Filters — only when clients exist */}
          {clients.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <ActionPill
                  label="Todos"
                  active={filterStatus === "todos"}
                  onClick={() => setFilterStatus("todos")}
                  count={clients.length}
                />
                {(Object.entries(statusConfig) as [ClientStatus, { label: string }][]).map(
                  ([key, { label }]) => (
                    <ActionPill
                      key={key}
                      label={label}
                      active={filterStatus === key}
                      onClick={() => setFilterStatus(key)}
                      count={clients.filter((c) => c.status === key).length}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* Empty state — inside unified card */}
          {clients.length === 0 && (
            <div className="border-t border-[var(--border-subtle)]">
              <WidgetEmptyState
                icon={Users}
                title="Nenhum cliente ainda"
                description="Adicione seu primeiro cliente para começar."
                action={
                  <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
                    <Plus size={16} />
                    Adicionar primeiro cliente
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* ═══ No results state — separate card ═══ */}
        {clients.length > 0 && filtered.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <WidgetEmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Tente ajustar os filtros ou a busca."
            />
          </div>
        )}

        {/* ═══ Client List — separate card ═══ */}
        {filtered.length > 0 && (
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]" style={{ boxShadow: "var(--shadow-sm)" }}>
            {filtered.map((client, index) => {
              const status = statusConfig[client.status];
              const projInfo = projectCounts[client.id];
              const projCount = projInfo?.count || 0;
              const eventType = projInfo?.lastType
                ? EVENT_TYPE_LABELS[projInfo.lastType] || projInfo.lastType
                : null;

              return (
                <motion.button
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.015 }}
                  onClick={() => openClientDrawer(client.id)}
                  className="flex items-center gap-4 w-full text-left px-5 py-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[var(--border-subtle)] flex items-center justify-center shrink-0 relative">
                    {client.status === "vip" ? (
                      <Star size={16} className="text-[var(--accent)]" fill="currentColor" />
                    ) : (
                      <span className="text-[13px] font-semibold text-[var(--fg-muted)]">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)] truncate">
                      {[eventType, client.city].filter(Boolean).join(" · ") || "Sem informações"}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge label={status.label} color={status.color} bg={status.bg} />
                    {projCount > 0 && (
                      <span className="text-[11px] text-[var(--fg-muted)]">
                        {projCount} proj.
                      </span>
                    )}
                    <ChevronRight size={14} className="text-[var(--fg-muted)]" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AppleModal open={showNewModal} onClose={() => setShowNewModal(false)} title="Novo cliente">
        <NewClientForm
          studioId={studioId}
          onClose={() => setShowNewModal(false)}
          onCreated={(client) => {
            setClients([...clients, client].sort((a, b) => a.name.localeCompare(b.name)));
            setShowNewModal(false);
            toast.success("Cliente criado!");
            router.refresh();
          }}
        />
      </AppleModal>
    </PageTransition>
  );
}


/* ═══════════ New Client Form ═══════════ */

function NewClientForm({
  studioId,
  onClose,
  onCreated,
}: {
  studioId: string;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    city: "",
    state: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(f: typeof form) {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Nome é obrigatório";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      errs.email = "Email inválido";
    if (f.phone && f.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Telefone deve ter pelo menos 10 dígitos";
    if (f.document && f.document.replace(/\D/g, "").length !== 11)
      errs.document = "CPF deve ter 11 dígitos";
    if (f.state && f.state.length !== 2) errs.state = "Use 2 letras (ex: SP)";
    return errs;
  }

  function handleBlur(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form));
  }

  function updateField(field: string, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validate(next));
  }

  function fieldCls(field: string) {
    return touched[field] && errors[field] ? INPUT_ERROR_CLS : INPUT_CLS;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, document: true, state: true });
    if (Object.keys(errs).length > 0) {
      if (errs.name) {
        toast.error("Nome do cliente é obrigatório");
      }
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        document: form.document || null,
        city: form.city || null,
        state: form.state.toUpperCase() || null,
        notes: form.notes || null,
      })
      .select(
        `
        id, name, email, phone, document, address, city, state,
        status, notes, tags, total_spent, created_at, updated_at
      `
      )
      .single();

    if (error) {
      toast.error("Erro ao criar cliente: " + error.message);
      setLoading(false);
      return;
    }

    onCreated(data as unknown as Client);

    // Trigger automation: send portal access if enabled for studio
    if (data?.email) {
      fetch("/api/automations/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "client_created",
          clientId: data.id,
          clientName: data.name,
          clientEmail: data.email,
        }),
      }).catch(() => {}); // fire-and-forget, não bloqueia a criação
    }
  }

  const errMsg = (field: string) =>
    touched[field] && errors[field] ? (
      <p className="text-[11px] text-[var(--error)] mt-1">{errors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={LABEL_CLS}>Nome *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="Ex: Maria Silva"
          className={fieldCls("name")}
        />
        {errMsg("name")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="email@cliente.com"
            className={fieldCls("email")}
          />
          {errMsg("email")}
        </div>
        <div>
          <label className={LABEL_CLS}>Telefone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            placeholder="(11) 99999-9999"
            className={fieldCls("phone")}
          />
          {errMsg("phone")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>CPF</label>
          <input
            type="text"
            value={form.document}
            onChange={(e) => updateField("document", e.target.value)}
            onBlur={() => handleBlur("document")}
            placeholder="000.000.000-00"
            className={fieldCls("document")}
          />
          {errMsg("document")}
        </div>
        <div>
          <label className={LABEL_CLS}>Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Ex: São Paulo"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Estado</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => updateField("state", e.target.value.toUpperCase())}
            onBlur={() => handleBlur("state")}
            placeholder="SP"
            maxLength={2}
            className={fieldCls("state")}
          />
          {errMsg("state")}
        </div>
      </div>

      <div>
        <label className={LABEL_CLS}>Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Informações adicionais sobre o cliente..."
          className="w-full px-4 py-3 rounded-[10px] border border-[var(--border-field)] bg-[var(--bg-elevated)] text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] transition-[border-color,box-shadow] resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className={PRIMARY_CTA}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Criando...
            </>
          ) : (
            "Criar cliente"
          )}
        </button>
      </div>
    </form>
  );
}
