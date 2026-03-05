import { useState } from "react";
import { createPortal } from "react-dom";
import { SERIF } from "../ui/editorial";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import {
  PermissionRoleBadge,
  permissionRoleConfig,
  type PermissionRole,
} from "../ui/permission-role-badge";
import { TagPill } from "../ui/tag-pill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type MemberStatus = "ativo" | "pendente" | "desativado";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: PermissionRole;
  status: MemberStatus;
  lastAccess?: string;
}

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

const initialMembers: TeamMember[] = [
  {
    id: "1",
    name: "Marina Reis",
    email: "marina@essyn.com",
    role: "admin",
    status: "ativo",
    lastAccess: "Agora",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos@essyn.com",
    role: "producao",
    status: "ativo",
    lastAccess: "Há 2h",
  },
  {
    id: "3",
    name: "Julia Farias",
    email: "julia@essyn.com",
    role: "atendimento",
    status: "ativo",
    lastAccess: "Há 1 dia",
  },
  {
    id: "4",
    name: "Rafael Silva",
    email: "rafael@essyn.com",
    role: "financeiro",
    status: "pendente",
  },
  {
    id: "5",
    name: "Lucas Prado",
    email: "lucas@contabil.com",
    role: "contador",
    status: "ativo",
    lastAccess: "Há 3 dias",
  },
];

/* ═══════════════════════════════════════════════════ */
/*  PERMISSION MATRIX                                 */
/* ═══════════════════════════════════════════════════ */

interface PermissionRow {
  module: string;
  admin: boolean;
  financeiro: boolean;
  atendimento: boolean;
  producao: boolean;
  contador: boolean;
}

const permissionMatrix: PermissionRow[] = [
  { module: "Dashboard", admin: true, financeiro: true, atendimento: true, producao: true, contador: false },
  { module: "Produção", admin: true, financeiro: false, atendimento: false, producao: true, contador: false },
  { module: "Agenda", admin: true, financeiro: false, atendimento: true, producao: true, contador: false },
  { module: "Galeria", admin: true, financeiro: false, atendimento: true, producao: true, contador: false },
  { module: "Projetos", admin: true, financeiro: true, atendimento: true, producao: true, contador: false },
  { module: "Financeiro", admin: true, financeiro: true, atendimento: false, producao: false, contador: true },
  { module: "CRM", admin: true, financeiro: false, atendimento: true, producao: false, contador: false },
  { module: "Configurações", admin: true, financeiro: false, atendimento: false, producao: false, contador: false },
  { module: "Relatórios", admin: true, financeiro: true, atendimento: false, producao: false, contador: true },
];

const roleColumns: PermissionRole[] = ["admin", "financeiro", "atendimento", "producao", "contador"];

/* ═══════════════════════════════════════════════════ */
/*  STATUS PILL                                       */
/* ═══════════════════════════════════════════════════ */

function StatusPill({ status }: { status: MemberStatus }) {
  const cfg: Record<MemberStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
    ativo: { label: "Ativo", variant: "success" },
    pendente: { label: "Pendente", variant: "warning" },
    desativado: { label: "Desativado", variant: "neutral" },
  };
  const c = cfg[status];
  return <TagPill variant={c.variant} size="xs">{c.label}</TagPill>;
}

/* ═══════════════════════════════════════════════════ */
/*  INVITE MODAL                                      */
/* ═══════════════════════════════════════════════════ */

function InviteModal({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvite: (email: string, role: PermissionRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PermissionRole | "">("");
  const [sending, setSending] = useState(false);

  const canSend = email.includes("@") && role !== "";

  const handleSend = () => {
    if (!canSend || role === "") return;
    setSending(true);
    setTimeout(() => {
      onInvite(email, role);
      setSending(false);
      setEmail("");
      setRole("");
      onOpenChange(false);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 rounded-2xl overflow-hidden border-[#E5E5EA]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[16px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
            Convidar usuário
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Envie um convite por e-mail. O usuário receberá acesso conforme o papel selecionado.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 pb-4 flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
              style={{ fontWeight: 400 }}
            />
          </div>

          {/* Role select */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              Papel
            </label>
            <Select value={role} onValueChange={(v) => setRole(v as PermissionRole)}>
              <SelectTrigger className="h-10 rounded-xl border-[#E5E5EA] text-[13px] bg-white px-3.5">
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {roleColumns.map((r) => (
                  <SelectItem key={r} value={r} className="text-[13px]">
                    <div className="flex items-center gap-2">
                      <PermissionRoleBadge role={r} size="sm" showDot />
                      <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                        {roleDescriptions[r]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role preview */}
          {role && role !== "" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <PermissionRoleBadge role={role} size="md" showDot />
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                  {roleFullDescriptions[role]}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[#F5F5F7] bg-[#FAFAFA]">
          <DialogClose asChild>
            <button
              className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Cancelar
            </button>
          </DialogClose>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white transition-all cursor-pointer " + (
              canSend && !sending
                ? "bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98]"
                : "bg-[#AEAEB2] cursor-not-allowed"
            )}
            style={{ fontWeight: 500 }}
          >
            {sending ? (
              <>
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Enviar convite
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const roleDescriptions: Record<PermissionRole, string> = {
  admin: "Acesso total",
  financeiro: "Finanças e relatórios",
  atendimento: "CRM e atendimento",
  producao: "Produção e galeria",
  contador: "Financeiro (somente leitura)",
};

const roleFullDescriptions: Record<PermissionRole, string> = {
  admin: "Acesso total ao sistema. Pode gerenciar equipe, configurações, financeiro e todos os módulos.",
  financeiro: "Acessa Dashboard, Projetos, Financeiro e Relatórios. Não acessa Produção, Agenda ou CRM.",
  atendimento: "Acessa Dashboard, Agenda, Galeria, Projetos e CRM. Ideal para gestão de clientes.",
  producao: "Acessa Dashboard, Produção, Agenda, Galeria e Projetos. Focado no fluxo operacional.",
  contador: "Acessa somente Financeiro e Relatórios. Ideal para contadores e escritórios externos.",
};

/* ═══════════════════════════════════════════════════ */
/*  MEMBER ROW                                        */
/* ═══════════════════════════════════════════════════ */

function MemberRow({
  member,
  index,
  onRemove,
  onChangeRole,
}: {
  member: TeamMember;
  index: number;
  onRemove: (id: string) => void;
  onChangeRole: (id: string, role: PermissionRole) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springStagger(index)}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E5E5EA] to-[#F2F2F7] flex items-center justify-center shrink-0">
        <span className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 600 }}>
          {member.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </span>
      </div>

      {/* Name + email */}
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span
          className="text-[13px] text-[#636366] truncate"
          style={{ fontWeight: 500 }}
        >
          {member.name}
        </span>
        <span
          className="text-[11px] text-[#C7C7CC] truncate"
          style={{ fontWeight: 400 }}
        >
          {member.email}
        </span>
      </div>

      {/* Role badge */}
      <PermissionRoleBadge role={member.role} size="sm" showDot />

      {/* Status */}
      <StatusPill status={member.status} />

      {/* Last access */}
      <span
        className="text-[11px] text-[#C7C7CC] tabular-nums w-20 text-right shrink-0"
        style={{ fontWeight: 400 }}
      >
        {member.status === "pendente" ? (
          <span className="flex items-center gap-1 justify-end text-[#FF9500]">
            <Clock className="w-3 h-3" />
            Convite
          </span>
        ) : (
          member.lastAccess || "—"
        )}
      </span>

      {/* Actions */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            {createPortal(
              <div className="fixed inset-0 z-[9998]" onClick={() => { setMenuOpen(false); setRoleMenuOpen(false); }} />,
              document.body
            )}
            <div className="absolute right-0 top-8 z-[9999] w-48 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
              {/* Alterar papel */}
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left"
                  style={{ fontWeight: 400 }}
                >
                  <Users className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  Alterar papel
                </button>
                {roleMenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
                    {roleColumns.filter((r) => r !== member.role).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          onChangeRole(member.id, r);
                          setRoleMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left"
                        style={{ fontWeight: 400 }}
                      >
                        <PermissionRoleBadge role={r} size="sm" showDot />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {member.role !== "admin" && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(member.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer text-left"
                  style={{ fontWeight: 400 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PERMISSION TABLE                                  */
/* ═══════════════════════════════════════════════════ */

function PermissionTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.2 }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[13px] text-[#636366] uppercase tracking-[0.06em]"
          style={{ fontWeight: 600 }}
        >
          O que cada papel pode acessar
        </span>
        <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Matriz de permissões por módulo
        </span>
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#FAFAFA]">
                <th
                  className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]"
                  style={{ fontWeight: 600, minWidth: 140 }}
                >
                  Módulo
                </th>
                {roleColumns.map((r) => (
                  <th key={r} className="px-3 py-3 text-center" style={{ minWidth: 100 }}>
                    <PermissionRoleBadge role={r} size="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((row, ri) => (
                <tr
                  key={row.module}
                  className={"border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors " + (
                    ri % 2 === 1 ? "bg-[#FAFAFA]" : ""
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className="text-[12px] text-[#8E8E93]"
                      style={{ fontWeight: 500 }}
                    >
                      {row.module}
                    </span>
                  </td>
                  {roleColumns.map((col) => (
                    <td key={col} className="px-3 py-2.5 text-center">
                      {row[col] ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#D4EDDB]">
                          <Check className="w-3 h-3 text-[#34C759]" style={{ opacity: 0.6 }} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#F5F5F7]">
                          <X className="w-3 h-3 text-[#D1D1D6]" />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  VIEW STATES                                       */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0">
            <div className="w-9 h-9 rounded-full bg-[#E5E5EA] animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 rounded-md bg-[#E5E5EA] animate-pulse" style={{ width: "40%" }} />
              <div className="h-3 rounded bg-[#F5F5F7] animate-pulse" style={{ width: "55%" }} />
            </div>
            <div className="h-5 w-16 rounded-md bg-[#E5E5EA] animate-pulse" />
            <div className="h-4 w-12 rounded bg-[#F5F5F7] animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 py-4">
        <LoaderCircle className="w-4 h-4 text-[#E5E5EA] animate-spin" />
        <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          Carregando equipe…
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
        <Users className="w-7 h-7 text-[#E5E5EA]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[16px] text-[#636366]" style={{ fontWeight: 500 }}>
          Nenhum membro na equipe
        </span>
        <span className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]" style={{ fontWeight: 400 }}>
          Convide membros para colaborar na gestão de projetos, produção e financeiro.
        </span>
      </div>
      <button
        onClick={onInvite}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <UserPlus className="w-3.5 h-3.5" />
        Convidar primeiro membro
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#FBF5F4] flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[16px] text-[#636366]" style={{ fontWeight: 500 }}>
          Erro ao carregar equipe
        </span>
        <span className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]" style={{ fontWeight: 400 }}>
          Não foi possível carregar os membros. Verifique sua conexão e tente novamente.
        </span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Tentar novamente
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

interface UsuariosPermissoesContentProps {
  onBack: () => void;
}

export function UsuariosPermissoesContent({ onBack }: UsuariosPermissoesContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleInvite = (email: string, role: PermissionRole) => {
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const newMember: TeamMember = {
      id: String(Date.now()),
      name,
      email,
      role,
      status: "pendente",
    };
    setMembers((prev) => [...prev, newMember]);
    toast.success("Convite enviado", {
      description: email + " receberá o convite como " + permissionRoleConfig[role].label,
      duration: 3000,
    });
  };

  const handleRemove = (id: string) => {
    const member = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (member) {
      toast("Membro removido", {
        description: member.name + " foi removido da equipe",
        duration: 3000,
      });
    }
  };

  const handleRoleChange = (id: string, newRole: PermissionRole) => {
    const member = members.find((m) => m.id === id);
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
    if (member) {
      toast.success("Papel alterado", {
        description: member.name + " agora é " + permissionRoleConfig[newRole].label,
        duration: 3000,
      });
    }
  };

  const activeCount = members.filter((m) => m.status === "ativo").length;
  const pendingCount = members.filter((m) => m.status === "pendente").length;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1
              className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]"
              style={{ fontWeight: 700 }}
            >
              Usuários & Permissões
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
              Gerencie a equipe e controle acessos
            </span>
            {viewState === "ready" && (
              <>
                <span className="w-px h-3 bg-[#E5E5EA]" />
                <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  {activeCount} ativos
                  {pendingCount > 0 && (" · " + pendingCount + " pendente" + (pendingCount > 1 ? "s" : ""))}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* State toggles (dev) */}
          <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
            {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
              <button
                key={s}
                onClick={() => setViewState(s)}
                className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (
                  viewState === s
                    ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]"
                    : "text-[#C7C7CC] hover:text-[#8E8E93]"
                )}
                style={{ fontWeight: 500 }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Invite CTA */}
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_#F2F2F7]"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Convidar usuário
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <EmptyState onInvite={() => setInviteOpen(true)} />
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <ErrorState onRetry={() => setViewState("ready")} />
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex flex-col gap-8"
          >
            {/* ── Summary pills ── */}
            <div className="flex items-center gap-3">
              {[
                { label: "Total", value: members.length, variant: "neutral" as const },
                { label: "Ativos", value: activeCount, variant: "success" as const },
                { label: "Pendentes", value: pendingCount, variant: "warning" as const },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5EA]"
                >
                  <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                    {stat.label}
                  </span>
                  <TagPill variant={stat.variant} size="xs">
                    {stat.value}
                  </TagPill>
                </div>
              ))}

              <div className="flex-1" />

              {/* Role legend */}
              <div className="flex items-center gap-1.5">
                {roleColumns.map((r) => (
                  <PermissionRoleBadge key={r} role={r} size="sm" />
                ))}
              </div>
            </div>

            {/* ── Members list ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] text-[#636366] uppercase tracking-[0.06em]"
                  style={{ fontWeight: 600 }}
                >
                  Membros
                </span>
                <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                  {members.length} membro{members.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
                {/* Table header */}
                <div className="flex items-center gap-4 px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E5E5EA]">
                  <div className="w-9 shrink-0" />
                  <span className="flex-1 text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
                    Usuário
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
                    Papel
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
                    Status
                  </span>
                  <span className="w-20 text-right text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC] shrink-0" style={{ fontWeight: 600 }}>
                    Último acesso
                  </span>
                  <span className="w-7 shrink-0" />
                </div>

                {/* Rows */}
                <AnimatePresence>
                  {members.map((m, i) => (
                    <MemberRow key={m.id} member={m} index={i} onRemove={handleRemove} onChangeRole={handleRoleChange} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Permission matrix ── */}
            <PermissionTable />

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_#F5F5F7]">
              <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                Permissões v1 — somente leitura. Edição de permissões granulares em breve.
              </span>
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                {roleColumns.length} papéis
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite modal ── */}
      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} onInvite={handleInvite} />
    </div>
  );
}