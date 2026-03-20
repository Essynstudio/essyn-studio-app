"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  ArrowLeft,
  Plus,
  Check,
  X,
  Shield,
  UserPlus,
  Clock,
  Mail,
  Search,
  Loader2,
} from "lucide-react";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  WidgetEmptyState,
  AppleModal,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
  PILL_CLS,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { toast } from "sonner";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastAccess: string | null;
  initials: string;
  color: string;
}

type StatusFilter = "todos" | "ativo" | "pendente";
type RoleFilter = "todos" | "admin" | "financeiro" | "visualizador" | "producao";

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const PLACEHOLDER_MEMBERS: TeamMember[] = [
  { id: "1", name: "Marina Reis", email: "marina@essyn.com", role: "admin", status: "ativo", lastAccess: "Agora", initials: "MR", color: "#6B5B8D" },
  { id: "2", name: "Carlos Mendes", email: "carlos@essyn.com", role: "producao", status: "ativo", lastAccess: "Há 2h", initials: "CM", color: "#2C444D" },
  { id: "3", name: "Julia Farias", email: "julia@essyn.com", role: "visualizador", status: "ativo", lastAccess: "Há 1 dia", initials: "JF", color: "#2D7A4F" },
  { id: "4", name: "Rafael Silva", email: "rafael@essyn.com", role: "financeiro", status: "pendente", lastAccess: null, initials: "RS", color: "#C87A20" },
  { id: "5", name: "Lucas Prado", email: "lucas@contabil.com", role: "visualizador", status: "ativo", lastAccess: "Há 3 dias", initials: "LP", color: "#B84233" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#B84233" },
  financeiro: { label: "Financeiro", color: "#C87A20" },
  visualizador: { label: "Visualizador", color: "#7A8A8F" },
  producao: { label: "Produção", color: "#6B5B8D" },
};

const PERMISSION_MATRIX = [
  { module: "Dashboard", admin: true, financeiro: true, visualizador: true, producao: true },
  { module: "Produção", admin: true, financeiro: false, visualizador: false, producao: true },
  { module: "Agenda", admin: true, financeiro: false, visualizador: true, producao: true },
  { module: "Galeria", admin: true, financeiro: false, visualizador: true, producao: true },
  { module: "Projetos", admin: true, financeiro: true, visualizador: true, producao: true },
  { module: "Financeiro", admin: true, financeiro: true, visualizador: false, producao: false },
  { module: "CRM", admin: true, financeiro: false, visualizador: true, producao: false },
  { module: "Configurações", admin: true, financeiro: false, visualizador: false, producao: false },
  { module: "Relatórios", admin: true, financeiro: true, visualizador: false, producao: false },
];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "todos", label: "Total" },
  { key: "ativo", label: "Ativos" },
  { key: "pendente", label: "Pendentes" },
];

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "admin", label: "Admin" },
  { key: "financeiro", label: "Financeiro" },
  { key: "visualizador", label: "Visualizador" },
  { key: "producao", label: "Produção" },
];

// ═══════════════════════════════════════════════
// Avatar Component
// ═══════════════════════════════════════════════

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Role Badge Component
// ═══════════════════════════════════════════════

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] || { label: role, color: "#7A8A8F" };
  return (
    <span
      className={PILL_CLS}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      {config.label}
    </span>
  );
}

// ═══════════════════════════════════════════════
// Status Badge Component
// ═══════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ativo";
  return (
    <span
      className={PILL_CLS}
      style={{
        backgroundColor: isActive
          ? "color-mix(in srgb, var(--success) 10%, transparent)"
          : "color-mix(in srgb, var(--warning) 10%, transparent)",
        color: isActive ? "var(--success)" : "var(--warning)",
        border: isActive
          ? "1px solid color-mix(in srgb, var(--success) 19%, transparent)"
          : "1px solid color-mix(in srgb, var(--warning) 19%, transparent)",
      }}
    >
      {isActive ? "Ativo" : "Pendente"}
    </span>
  );
}

// ═══════════════════════════════════════════════
// Permission Cell Component
// ═══════════════════════════════════════════════

function PermissionCell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check size={16} className="text-[var(--success)] mx-auto" />
  ) : (
    <X size={16} className="text-[var(--fg-muted)] opacity-40 mx-auto" />
  );
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

interface UsuariosClientProps {
  studioId: string;
  initialMembers: never[];
}

export function UsuariosClient({ studioId, initialMembers }: UsuariosClientProps) {
  const router = useRouter();

  // Use placeholder data if no real members
  const members: TeamMember[] = useMemo(() => {
    if (initialMembers.length > 0) {
      // Map DB members to our format
      return (initialMembers as Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        active: boolean;
        created_at: string;
      }>).map((m) => {
        const parts = (m.name || "").split(" ");
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : (m.name || "U").substring(0, 2).toUpperCase();
        const colors = ["#6B5B8D", "#2C444D", "#2D7A4F", "#C87A20", "#B84233", "#A0566B", "#2C444D"];
        const colorIndex = m.name ? m.name.charCodeAt(0) % colors.length : 0;
        return {
          id: m.id,
          name: m.name || m.email,
          email: m.email,
          role: m.role || "visualizador",
          status: m.active ? "ativo" : "pendente",
          lastAccess: null,
          initials,
          color: colors[colorIndex],
        };
      });
    }
    return PLACEHOLDER_MEMBERS;
  }, [initialMembers]);

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "visualizador" });
  const [sending, setSending] = useState(false);

  // Computed
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (statusFilter !== "todos" && m.status !== statusFilter) return false;
      if (roleFilter !== "todos" && m.role !== roleFilter) return false;
      return true;
    });
  }, [members, statusFilter, roleFilter]);

  const activeCount = members.filter((m) => m.status === "ativo").length;
  const pendingCount = members.filter((m) => m.status === "pendente").length;

  const statusCounts: Record<StatusFilter, number> = {
    todos: members.length,
    ativo: activeCount,
    pendente: pendingCount,
  };

  // Handlers
  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSending(true);
    // Stub — simulate invite
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setShowInviteModal(false);
    setInviteForm({ name: "", email: "", role: "visualizador" });
    toast.success("Convite enviado!");
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.push("/configuracoes")}
            className={GHOST_BTN}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-[11px] text-[var(--fg-muted)] font-medium tracking-wide">
            Configurações › Usuários &amp; Permissões
          </span>
        </div>

        <HeaderWidget
          title="Usuários & Permissões"
          subtitle={`${activeCount} ativos${pendingCount > 0 ? ` · ${pendingCount} pendente${pendingCount > 1 ? "s" : ""}` : ""} · Gerencie a equipe e controle acessos`}
        >
          <button
            onClick={() => setShowInviteModal(true)}
            className={PRIMARY_CTA}
          >
            <Plus size={16} />
            Convidar usuário
          </button>
        </HeaderWidget>

        {/* ── Filter Row ── */}
        <div className="flex items-center justify-between gap-4">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <ActionPill
                key={tab.key}
                label={tab.label}
                active={statusFilter === tab.key}
                onClick={() => setStatusFilter(tab.key)}
                count={statusCounts[tab.key]}
              />
            ))}
          </div>

          {/* Role filter pills */}
          <div className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map((rf) => (
              <ActionPill
                key={rf.key}
                label={rf.label}
                active={roleFilter === rf.key}
                onClick={() => setRoleFilter(rf.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Members Table ── */}
        <WidgetCard hover={false}>
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[var(--fg-muted)]" />
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">
                MEMBROS
              </h2>
            </div>
            <span className="text-[12px] text-[var(--fg-muted)]">
              {filteredMembers.length} membro{filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredMembers.length === 0 ? (
            <WidgetEmptyState
              icon={Users}
              title="Nenhum membro encontrado"
              description="Ajuste os filtros ou convide alguem para a equipe"
              action={
                <button className={PRIMARY_CTA} onClick={() => setShowInviteModal(true)}>
                  <Plus size={16} /> Convidar usuário
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                      Ultimo acesso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredMembers.map((member, idx) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26, delay: idx * 0.04 }}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--sidebar-hover)] transition-colors"
                      >
                        {/* User cell */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar initials={member.initials} color={member.color} />
                            <div>
                              <p className="text-[13px] font-medium text-[var(--fg)]">
                                {member.name}
                              </p>
                              <p className="text-[11px] text-[var(--fg-muted)]">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role cell */}
                        <td className="px-5 py-3">
                          <RoleBadge role={member.role} />
                        </td>

                        {/* Status cell */}
                        <td className="px-5 py-3">
                          <StatusBadge status={member.status} />
                        </td>

                        {/* Last access cell */}
                        <td className="px-5 py-3">
                          {member.status === "pendente" ? (
                            <button className="text-[12px] text-[var(--info)] hover:underline flex items-center gap-1">
                              <Mail size={12} />
                              Convite
                            </button>
                          ) : (
                            <span className="text-[12px] text-[var(--fg-muted)] flex items-center gap-1.5">
                              <Clock size={12} />
                              {member.lastAccess || "—"}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </WidgetCard>

        {/* ── Permission Matrix ── */}
        <WidgetCard hover={false}>
          <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={15} className="text-[var(--fg-muted)]" />
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">
                O QUE CADA PAPEL PODE ACESSAR
              </h2>
            </div>
            <p className="text-[12px] text-[var(--fg-muted)] ml-[23px]">
              Matriz de permissoes por modulo
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                    Modulo
                  </th>
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-center"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map((row, idx) => (
                  <motion.tr
                    key={row.module}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    <td className="px-5 py-2.5 text-[13px] text-[var(--fg)] font-medium">
                      {row.module}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <PermissionCell allowed={row.admin} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <PermissionCell allowed={row.financeiro} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <PermissionCell allowed={row.visualizador} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <PermissionCell allowed={row.producao} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--fg-muted)] italic">
              Permissoes v1 — somente leitura. Edicao de permissoes granulares em breve.
            </p>
          </div>
        </WidgetCard>

        {/* ── Invite Modal ── */}
        <AppleModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Convidar Usuario"
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className={LABEL_CLS}>Nome</label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
                className={INPUT_CLS}
              />
            </div>

            {/* Email */}
            <div>
              <label className={LABEL_CLS}>E-mail</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className={INPUT_CLS}
              />
            </div>

            {/* Role */}
            <div>
              <label className={LABEL_CLS}>Papel</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                className={`${SELECT_CLS} w-full`}
              >
                <option value="admin">Admin</option>
                <option value="financeiro">Financeiro</option>
                <option value="visualizador">Visualizador</option>
                <option value="producao">Produção</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className={SECONDARY_CTA}
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={sending}
                className={PRIMARY_CTA}
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {sending ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          </div>
        </AppleModal>
      </div>
    </PageTransition>
  );
}
