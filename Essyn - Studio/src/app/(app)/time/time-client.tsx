"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Phone, Mail, Loader2, UserCircle,
  Users, SearchX, DollarSign, FileText, Briefcase,
  Copy, Check, MessageCircle, Shield, ChevronDown,
  Send,
} from "lucide-react";
import {
  PageTransition, AppleModal, StatusBadge, WidgetEmptyState,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA, SECONDARY_CTA, INPUT_CLS, SELECT_CLS, LABEL_CLS,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

type TeamRole = "admin" | "fotografo" | "editor" | "atendimento" | "financeiro" | "contador";
type MemberType = "interno" | "freelancer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  custom_role: string | null;
  phone: string | null;
  active: boolean;
  avatar_url: string | null;
  member_type: MemberType;
  specialty: string | null;
  hourly_rate: number | null;
  notes: string | null;
  permissions: TeamPermissions | null;
  user_id: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamPermissions {
  modules: string[];
  scope: Record<string, "assigned" | "all">;
}

interface TeamInvite {
  id: string;
  token: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  custom_role: string | null;
  permissions: TeamPermissions;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

const roleConfig: Record<TeamRole, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "var(--info)", bg: "color-mix(in srgb, var(--info) 15%, transparent)" },
  fotografo: { label: "Fotógrafo", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 15%, transparent)" },
  editor: { label: "Editor", color: "var(--purple)", bg: "color-mix(in srgb, var(--purple) 15%, transparent)" },
  atendimento: { label: "Atendimento", color: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 15%, transparent)" },
  financeiro: { label: "Financeiro", color: "var(--success)", bg: "color-mix(in srgb, var(--success) 15%, transparent)" },
  contador: { label: "Contador", color: "var(--fg-muted)", bg: "color-mix(in srgb, var(--fg-muted) 15%, transparent)" },
};

const FREELANCER_SPECIALTIES = [
  "Fotografo", "Videomaker", "Editor de fotos", "Editor de video",
  "Drone", "Maquiador(a)", "Assistente", "DJ", "Cerimonialista", "Decorador(a)", "Outro",
];

// ── Permission modules ──
const ALL_MODULES = [
  { id: "iris", label: "Iris (IA)", group: "Geral" },
  { id: "projetos", label: "Projetos", group: "Trabalho", hasScope: true },
  { id: "producao", label: "Produção", group: "Trabalho", hasScope: true },
  { id: "agenda", label: "Agenda", group: "Trabalho" },
  { id: "crm", label: "CRM", group: "Clientes" },
  { id: "clientes", label: "Clientes", group: "Clientes" },
  { id: "portal", label: "Portal do Cliente", group: "Clientes" },
  { id: "galeria", label: "Galeria", group: "Clientes", hasScope: true },
  { id: "financeiro", label: "Financeiro", group: "Financeiro" },
  { id: "pedidos", label: "Loja & Pedidos", group: "Financeiro" },
  { id: "contratos", label: "Contratos", group: "Financeiro" },
  { id: "mensagens", label: "Mensagens", group: "Comunicação" },
  { id: "time", label: "Time (ver)", group: "Gestão" },
  { id: "relatorios", label: "Relatórios", group: "Gestão" },
  { id: "configuracoes", label: "Configurações", group: "Gestão" },
];

const PRESETS: Record<string, { modules: string[]; scope: Record<string, "assigned" | "all"> }> = {
  fotografo: {
    modules: ["iris", "projetos", "producao", "agenda", "galeria"],
    scope: { projetos: "assigned", producao: "assigned", galeria: "assigned" },
  },
  editor: {
    modules: ["producao", "galeria"],
    scope: { producao: "assigned", galeria: "assigned" },
  },
  atendimento: {
    modules: ["iris", "crm", "clientes", "mensagens", "agenda", "portal"],
    scope: {},
  },
  financeiro: {
    modules: ["financeiro", "contratos", "pedidos", "relatorios"],
    scope: {},
  },
  admin: {
    modules: ALL_MODULES.map(m => m.id),
    scope: { projetos: "all", producao: "all", galeria: "all" },
  },
  contador: {
    modules: ["financeiro", "relatorios"],
    scope: {},
  },
  personalizado: { modules: [], scope: {} },
};

function cur(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function TimeClient({
  members: initial,
  invites: initialInvites,
  studioId,
}: {
  members: TeamMember[];
  invites: TeamInvite[];
  studioId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [invites, setInvites] = useState(initialInvites);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<MemberType | "convites">("interno");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editPermsId, setEditPermsId] = useState<string | null>(null);

  const internos = members.filter(m => m.member_type === "interno" || !m.member_type);
  const freelancers = members.filter(m => m.member_type === "freelancer");
  const pendingInvites = invites.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date());

  const currentList = tab === "interno" ? internos : tab === "freelancer" ? freelancers : [];
  const filtered = currentList.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) ||
      (m.specialty && m.specialty.toLowerCase().includes(q));
  });

  const totalAtivos = currentList.filter(m => m.active).length;

  async function toggleActive(member: TeamMember) {
    const supabase = createClient();
    const newActive = !member.active;
    const { error } = await supabase
      .from("team_members")
      .update({ active: newActive })
      .eq("id", member.id)
      .eq("studio_id", studioId);
    if (error) { toast.error("Erro: " + error.message); return; }
    setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, active: newActive } : m)));
    toast.success(newActive ? "Ativado" : "Desativado");
  }

  async function savePermissions(memberId: string, perms: TeamPermissions) {
    const supabase = createClient();
    const { error } = await supabase
      .from("team_members")
      .update({ permissions: perms })
      .eq("id", memberId)
      .eq("studio_id", studioId);
    if (error) { toast.error("Erro: " + error.message); return; }
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: perms } : m));
    toast.success("Permissões atualizadas");
    setEditPermsId(null);
  }

  const editingMember = editPermsId ? members.find(m => m.id === editPermsId) : null;

  return (
    <PageTransition>
      {/* Unified Panel */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)]">Time</h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-0.5">
                {internos.length} interno{internos.length !== 1 ? "s" : ""} · {freelancers.length} freelancer{freelancers.length !== 1 ? "s" : ""}
                {pendingInvites.length > 0 && ` · ${pendingInvites.length} convite${pendingInvites.length > 1 ? "s" : ""} pendente${pendingInvites.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
              <Plus size={16} />
              {tab === "freelancer" ? "Adicionar freelancer" : "Convidar membro"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 p-1 rounded-xl bg-[var(--bg-subtle)]">
            {([
              { key: "interno" as const, icon: Users, label: "Equipe interna", count: internos.length },
              { key: "freelancer" as const, icon: Briefcase, label: "Freelancers", count: freelancers.length },
              { key: "convites" as const, icon: Send, label: "Convites", count: pendingInvites.length },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  tab === t.key
                    ? "bg-[var(--bg)] text-[var(--fg)] shadow-sm"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]"
                }`}
              >
                <t.icon size={14} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search (not on convites tab) */}
          {tab !== "convites" && (
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder={tab === "interno" ? "Buscar por nome ou email..." : "Buscar por nome, email ou especialidade..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          )}
        </div>

        {/* Stats (interno/freelancer tabs) */}
        {tab === "interno" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <StatBlock label="Total" value={internos.length} sub="membros" />
            <StatBlock label="Ativos" value={totalAtivos} sub="no momento" color="var(--success)" />
            <StatBlock label="Com acesso" value={internos.filter(m => m.user_id).length} sub="logaram" />
            <StatBlock label="Cargos" value={new Set(internos.map(m => m.role)).size} sub="diferentes" />
          </div>
        )}

        {tab === "freelancer" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <StatBlock label="Total" value={freelancers.length} sub="freelancers" />
            <StatBlock label="Ativos" value={totalAtivos} sub="disponíveis" color="var(--success)" />
            <StatBlock label="Especialidades" value={new Set(freelancers.map(m => m.specialty).filter(Boolean)).size} sub="diferentes" />
            <StatBlock label="Valor médio" value={
              freelancers.filter(f => f.hourly_rate).length > 0
                ? cur(freelancers.filter(f => f.hourly_rate).reduce((s, f) => s + Number(f.hourly_rate), 0) / freelancers.filter(f => f.hourly_rate).length)
                : "—"
            } sub="por serviço" isText />
          </div>
        )}

        {/* Empty states */}
        {tab !== "convites" && currentList.length === 0 && (
          <div className="border-t border-[var(--border-subtle)]">
            <WidgetEmptyState
              icon={tab === "interno" ? Users : Briefcase}
              title={tab === "interno" ? "Nenhum membro na equipe interna." : "Nenhum freelancer cadastrado."}
              description={tab === "interno"
                ? "Convide fotógrafos, editores e assistentes para colaborar nos seus projetos."
                : "Cadastre freelancers que você contrata para seus eventos."
              }
              action={
                <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
                  <Plus size={16} />
                  {tab === "interno" ? "Convidar membro" : "Adicionar freelancer"}
                </button>
              }
            />
          </div>
        )}

        {/* Convites tab */}
        {tab === "convites" && (
          <div className="border-t border-[var(--border-subtle)]">
            {pendingInvites.length === 0 ? (
              <WidgetEmptyState
                icon={Send}
                title="Nenhum convite pendente."
                description="Convites aceitos ou expirados não aparecem aqui."
              />
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {pendingInvites.map(inv => (
                  <InviteRow key={inv.id} invite={inv} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member cards */}
      {tab !== "convites" && currentList.length > 0 && (
        filtered.length === 0 ? (
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
            <WidgetEmptyState icon={SearchX} title="Nenhum resultado encontrado." />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((member, i) => (
              <motion.div
                key={member.id}
                initial={springContentIn.initial}
                animate={springContentIn.animate}
                transition={{ ...springContentIn.transition, delay: i * 0.04 }}
              >
                {tab === "interno" ? (
                  <InternalCard member={member} onToggle={() => toggleActive(member)} onEditPerms={() => setEditPermsId(member.id)} />
                ) : (
                  <FreelancerCard member={member} onToggle={() => toggleActive(member)} />
                )}
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* New member/freelancer modal */}
      <AppleModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={tab === "freelancer" ? "Adicionar freelancer" : "Convidar membro"}
      >
        {tab === "freelancer" ? (
          <NewFreelancerForm
            studioId={studioId}
            onClose={() => setShowNewModal(false)}
            onCreated={(member) => {
              setMembers([...members, member].sort((a, b) => a.name.localeCompare(b.name)));
              setShowNewModal(false);
              toast.success("Freelancer adicionado!");
            }}
          />
        ) : (
          <NewInviteForm
            studioId={studioId}
            onClose={() => setShowNewModal(false)}
            onCreated={(invite) => {
              setInvites(prev => [invite, ...prev]);
              setShowNewModal(false);
            }}
          />
        )}
      </AppleModal>

      {/* Edit permissions modal */}
      <AppleModal
        open={!!editPermsId}
        onClose={() => setEditPermsId(null)}
        title={`Permissões — ${editingMember?.name || ""}`}
      >
        {editingMember && (
          <PermissionsEditor
            current={editingMember.permissions || { modules: [], scope: {} }}
            role={editingMember.role}
            onSave={(p) => savePermissions(editingMember.id, p)}
            onClose={() => setEditPermsId(null)}
          />
        )}
      </AppleModal>
    </PageTransition>
  );
}

// ═══════════════════════════════════════════════
// Stat Block
// ═══════════════════════════════════════════════

function StatBlock({ label, value, sub, color, isText }: { label: string; value: number | string; sub: string; color?: string; isText?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">{label}</p>
      <p className={`${isText ? "text-[18px]" : "text-[24px]"} font-bold`} style={{ color: color || "var(--fg)" }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{sub}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Internal Member Card (with permissions badge)
// ═══════════════════════════════════════════════

function InternalCard({ member, onToggle, onEditPerms }: { member: TeamMember; onToggle: () => void; onEditPerms: () => void }) {
  const role = roleConfig[member.role] || roleConfig.fotografo;
  const displayRole = member.custom_role || role.label;
  const moduleCount = member.permissions?.modules?.length || 0;
  const hasAccess = !!member.user_id;

  return (
    <div className="bg-[var(--card)] rounded-2xl overflow-hidden p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <UserCircle size={22} className="text-[var(--fg-secondary)] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-[var(--fg)] truncate">{member.name}</h3>
              {hasAccess && (
                <span className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0" title="Acesso ativo" />
              )}
            </div>
            <StatusBadge label={displayRole} color={role.color} bg={role.bg} />
          </div>
        </div>
        <div className="space-y-1 text-[11px] text-[var(--fg-muted)]">
          <span className="flex items-center gap-1.5"><Mail size={11} /> {member.email}</span>
          {member.phone && <span className="flex items-center gap-1.5"><Phone size={11} /> {member.phone}</span>}
        </div>

        {/* Permissions badge */}
        <button
          onClick={onEditPerms}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg)] transition-colors text-left"
        >
          <Shield size={12} className="text-[var(--fg-muted)]" />
          <span className="text-[11px] text-[var(--fg-secondary)] flex-1">
            {moduleCount > 0 ? `${moduleCount} módulo${moduleCount > 1 ? "s" : ""}` : "Sem permissões definidas"}
          </span>
          <ChevronDown size={12} className="text-[var(--fg-muted)]" />
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-[10px] text-[var(--fg-muted)]">
            {member.active ? "Ativo" : "Inativo"}
            {member.joined_at && " · Conectado"}
          </span>
          <button
            onClick={onToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ${member.active ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--bg-elevated)] shadow transition-all ${member.active ? "left-[calc(100%-18px)]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Freelancer Card (unchanged)
// ═══════════════════════════════════════════════

function FreelancerCard({ member, onToggle }: { member: TeamMember; onToggle: () => void }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl overflow-hidden p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Briefcase size={20} className="text-[var(--fg-secondary)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-medium text-[var(--fg)] truncate">{member.name}</h3>
            {member.specialty && (
              <StatusBadge label={member.specialty} color="var(--accent)" bg="color-mix(in srgb, var(--accent) 15%, transparent)" />
            )}
          </div>
          {member.hourly_rate && (
            <span className="text-[12px] font-semibold text-[var(--fg)] shrink-0">{cur(member.hourly_rate)}</span>
          )}
        </div>
        <div className="space-y-1 text-[11px] text-[var(--fg-muted)]">
          {member.phone && <span className="flex items-center gap-1.5"><Phone size={11} /> {member.phone}</span>}
          {member.email && <span className="flex items-center gap-1.5"><Mail size={11} /> {member.email}</span>}
          {member.notes && (
            <span className="flex items-start gap-1.5">
              <FileText size={11} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{member.notes}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-[10px] text-[var(--fg-muted)]">{member.active ? "Disponível" : "Indisponível"}</span>
          <button
            onClick={onToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ${member.active ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--bg-elevated)] shadow transition-all ${member.active ? "left-[calc(100%-18px)]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Invite Row
// ═══════════════════════════════════════════════

function InviteRow({ invite }: { invite: TeamInvite }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    setDaysLeft(Math.max(0, Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / 86400000)));
  }, [invite.expires_at]);

  const inviteUrl = `${origin}/convite/${invite.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  const role = roleConfig[invite.role as TeamRole] || roleConfig.fotografo;
  const displayRole = invite.custom_role || role.label;

  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
        <Send size={14} className="text-[var(--fg-muted)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--fg)] truncate">{invite.name}</p>
        <p className="text-[11px] text-[var(--fg-muted)]">{invite.email}</p>
      </div>
      <StatusBadge label={displayRole} color={role.color} bg={role.bg} />
      <span className="text-[10px] text-[var(--fg-muted)] shrink-0">Expira em {daysLeft}d</span>
      <div className="flex items-center gap-1">
        <button onClick={copyLink} className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors" title="Copiar link">
          {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} className="text-[var(--fg-muted)]" />}
        </button>
        <a
          href={`https://wa.me/${invite.phone ? invite.phone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(`Olá ${invite.name}! Você foi convidado para nossa equipe no Essyn. Acesse: ${inviteUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          title="Enviar por WhatsApp"
        >
          <MessageCircle size={14} className="text-[var(--success)]" />
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Permissions Editor
// ═══════════════════════════════════════════════

function PermissionsEditor({
  current,
  role,
  onSave,
  onClose,
}: {
  current: TeamPermissions;
  role: TeamRole;
  onSave: (p: TeamPermissions) => void;
  onClose: () => void;
}) {
  const [modules, setModules] = useState<string[]>(
    current.modules?.length ? current.modules : (PRESETS[role]?.modules || [])
  );
  const [scope, setScope] = useState<Record<string, "assigned" | "all">>(
    Object.keys(current.scope || {}).length ? current.scope : (PRESETS[role]?.scope || {})
  );
  const [preset, setPreset] = useState("personalizado");

  function applyPreset(key: string) {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setModules([...p.modules]);
      setScope({ ...p.scope });
    }
  }

  function toggleModule(id: string) {
    setPreset("personalizado");
    setModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function toggleScope(id: string) {
    setScope(prev => ({ ...prev, [id]: prev[id] === "all" ? "assigned" : "all" }));
  }

  const grouped = ALL_MODULES.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  return (
    <div className="p-6 space-y-5">
      {/* Preset selector */}
      <div>
        <label className={LABEL_CLS}>Preset de acesso</label>
        <select value={preset} onChange={e => applyPreset(e.target.value)} className={`w-full ${SELECT_CLS}`}>
          <option value="personalizado">Personalizado</option>
          {Object.entries(roleConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Module checklist by group */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([group, mods]) => (
          <div key={group}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-2">{group}</p>
            <div className="space-y-1">
              {mods.map(mod => {
                const checked = modules.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center gap-3 py-1.5">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        checked
                          ? "bg-[var(--fg)] border-[var(--fg)]"
                          : "border-[var(--border-strong)] hover:border-[var(--fg-muted)]"
                      }`}
                    >
                      {checked && <Check size={12} className="text-[var(--bg)]" />}
                    </button>
                    <span className="text-[13px] text-[var(--fg)] flex-1">{mod.label}</span>
                    {mod.hasScope && checked && (
                      <button
                        onClick={() => toggleScope(mod.id)}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                          scope[mod.id] === "all"
                            ? "bg-[var(--info)] text-white"
                            : "bg-[var(--bg-subtle)] text-[var(--fg-muted)]"
                        }`}
                      >
                        {scope[mod.id] === "all" ? "Todos" : "Atribuídos"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <p className="text-[11px] text-[var(--fg-muted)]">{modules.length} módulo{modules.length !== 1 ? "s" : ""} selecionado{modules.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className={SECONDARY_CTA}>Cancelar</button>
          <button onClick={() => onSave({ modules, scope })} className={PRIMARY_CTA}>
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// New Invite Form (with permissions)
// ═══════════════════════════════════════════════

function NewInviteForm({
  studioId,
  onClose,
  onCreated,
}: {
  studioId: string;
  onClose: () => void;
  onCreated: (invite: TeamInvite) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "fotografo" as TeamRole | "outro", customRole: "",
  });
  const [modules, setModules] = useState<string[]>(PRESETS.fotografo.modules);
  const [scope, setScope] = useState<Record<string, "assigned" | "all">>(PRESETS.fotografo.scope);
  const [preset, setPreset] = useState("fotografo");
  const [showPerms, setShowPerms] = useState(false);

  function applyPreset(key: string) {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setModules([...p.modules]);
      setScope({ ...p.scope });
    }
  }

  function handleRoleChange(role: TeamRole | "outro") {
    setForm(f => ({ ...f, role }));
    if (role !== "outro" && PRESETS[role]) {
      applyPreset(role);
    } else {
      setPreset("personalizado");
    }
  }

  async function handleSubmit(sendMethod: "email" | "whatsapp" | "copy") {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role === "outro" ? "fotografo" : form.role,
          customRole: form.role === "outro" ? form.customRole.trim() : null,
          permissions: { modules, scope },
          sendMethod: sendMethod === "email" ? "email" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar convite");
        setLoading(false);
        return;
      }

      const inviteUrl = data.inviteUrl;

      if (sendMethod === "copy") {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Link copiado para a área de transferência!");
      } else if (sendMethod === "whatsapp") {
        const phone = form.phone.replace(/\D/g, "");
        const msg = encodeURIComponent(`Olá ${form.name.trim()}! Você foi convidado para nossa equipe no Essyn. Acesse: ${inviteUrl}`);
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
        toast.success("Abrindo WhatsApp...");
      } else if (sendMethod === "email") {
        toast.success(data.emailSent ? "Convite enviado por email!" : "Convite criado. " + (data.warning || ""));
      }

      onCreated(data.invite);
    } catch {
      toast.error("Erro ao criar convite");
    }
    setLoading(false);
  }

  const grouped = ALL_MODULES.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  return (
    <div className="p-6 space-y-4">
      {/* ── Dados do membro ── */}
      <div>
        <label className={LABEL_CLS}>Nome *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" required className={INPUT_CLS} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Email *</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" required className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Telefone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className={INPUT_CLS} />
        </div>
      </div>

      {/* ── Cargo ── */}
      <div>
        <label className={LABEL_CLS}>Cargo</label>
        <select value={form.role} onChange={e => handleRoleChange(e.target.value as TeamRole | "outro")} className={`w-full ${SELECT_CLS}`}>
          {Object.entries(roleConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          <option value="outro">Outro (personalizado)</option>
        </select>
        {form.role !== "outro" && (
          <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">
            O cargo define automaticamente quais páginas o membro pode acessar. Você pode ajustar abaixo.
          </p>
        )}
      </div>
      {form.role === "outro" && (
        <div>
          <label className={LABEL_CLS}>Nome do cargo *</label>
          <input
            type="text"
            value={form.customRole}
            onChange={e => setForm(f => ({ ...f, customRole: e.target.value }))}
            placeholder="Ex: Social media, Recepcionista, Segundo fotógrafo..."
            className={INPUT_CLS}
          />
          <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">
            Marque abaixo quais páginas este membro pode acessar.
          </p>
        </div>
      )}

      {/* ── Acesso (módulos) ── */}
      <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPerms(!showPerms)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Shield size={15} className="text-[var(--fg-muted)]" />
            <div className="text-left">
              <p className="text-[13px] font-medium text-[var(--fg)]">Acesso ao sistema</p>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {modules.length} página{modules.length !== 1 ? "s" : ""} liberada{modules.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ChevronDown size={14} className={`text-[var(--fg-muted)] transition-transform ${showPerms ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showPerms && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-3 max-h-[40vh] overflow-y-auto">
                {Object.entries(grouped).map(([group, mods]) => (
                  <div key={group}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-1.5">{group}</p>
                    <div className="space-y-0.5">
                      {mods.map(mod => {
                        const checked = modules.includes(mod.id);
                        return (
                          <div key={mod.id} className="flex items-center gap-3 py-1.5">
                            <button
                              onClick={() => {
                                setPreset("personalizado");
                                setModules(prev => checked ? prev.filter(m => m !== mod.id) : [...prev, mod.id]);
                              }}
                              className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                                checked ? "bg-[var(--fg)] border-[var(--fg)]" : "border-[var(--border-strong)] hover:border-[var(--fg-muted)]"
                              }`}
                            >
                              {checked && <Check size={10} className="text-[var(--bg)]" />}
                            </button>
                            <span className="text-[12px] text-[var(--fg)] flex-1">{mod.label}</span>
                            {mod.hasScope && checked && (
                              <button
                                onClick={() => setScope(prev => ({ ...prev, [mod.id]: prev[mod.id] === "all" ? "assigned" : "all" }))}
                                className={`text-[9px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                                  scope[mod.id] === "all" ? "bg-[var(--info)] text-white" : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:bg-[var(--bg)]"
                                }`}
                                title={scope[mod.id] === "all" ? "Vê todos os dados" : "Só vê projetos onde está atribuído"}
                              >
                                {scope[mod.id] === "all" ? "Todos" : "Só atribuídos"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Enviar convite ── */}
      <div className="border-t border-[var(--border)] pt-4">
        <p className="text-[12px] font-medium text-[var(--fg-secondary)] mb-3">Enviar convite por:</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSubmit("email")}
            disabled={loading || !form.name.trim() || !form.email.trim()}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-[var(--border)] hover:border-[var(--info)] hover:bg-[color-mix(in_srgb,var(--info)_5%,transparent)] transition-all disabled:opacity-40 group"
          >
            {loading ? <Loader2 size={20} className="animate-spin text-[var(--fg-muted)]" /> : <Mail size={20} className="text-[var(--info)] group-hover:scale-110 transition-transform" />}
            <span className="text-[11px] font-medium text-[var(--fg-secondary)]">Email</span>
          </button>
          <button
            onClick={() => handleSubmit("whatsapp")}
            disabled={loading || !form.name.trim() || !form.email.trim()}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-[var(--border)] hover:border-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_5%,transparent)] transition-all disabled:opacity-40 group"
          >
            <MessageCircle size={20} className="text-[var(--success)] group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium text-[var(--fg-secondary)]">WhatsApp</span>
          </button>
          <button
            onClick={() => handleSubmit("copy")}
            disabled={loading || !form.name.trim() || !form.email.trim()}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-[var(--border)] hover:border-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-40 group"
          >
            <Copy size={20} className="text-[var(--fg-muted)] group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium text-[var(--fg-secondary)]">Copiar link</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// New Freelancer Form (unchanged)
// ═══════════════════════════════════════════════

function NewFreelancerForm({
  studioId, onClose, onCreated,
}: {
  studioId: string;
  onClose: () => void;
  onCreated: (member: TeamMember) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", specialty: "Fotografo",
    hourly_rate: "", notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        email: form.email.trim() || `${form.name.trim().toLowerCase().replace(/\s+/g, ".")}@freelancer`,
        role: "fotografo",
        phone: form.phone || null,
        member_type: "freelancer",
        specialty: form.specialty,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        notes: form.notes || null,
        active: true,
      })
      .select("id, name, email, role, phone, active, avatar_url, member_type, specialty, hourly_rate, notes, permissions, user_id, joined_at, created_at, updated_at")
      .single();
    if (error) { toast.error("Erro: " + error.message); setLoading(false); return; }
    onCreated(data as unknown as TeamMember);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={LABEL_CLS}>Nome *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do freelancer" required className={INPUT_CLS} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Telefone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className={INPUT_CLS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Especialidade *</label>
          <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className={`w-full ${SELECT_CLS}`}>
            {FREELANCER_SPECIALTIES.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Valor por serviço (R$)</label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="500" className={`${INPUT_CLS} !pl-9`} />
          </div>
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Observações</label>
        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Trabalha bem com casamentos, pontual..." rows={3} className={INPUT_CLS} style={{ resize: "none" }} />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>Cancelar</button>
        <button type="submit" disabled={loading || !form.name.trim()} className={PRIMARY_CTA}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
