import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  PermissionRoleBadge — User permission role badge   */
/*  Admin | Financeiro | Atendimento | Produção        */
/*  | Contador                                         */
/*  Sizes: sm (9px) | md (10px)                        */
/*  Colors ONLY in badges — never in CTAs              */
/*  Primitivo: /ui/permission-role-badge.tsx            */
/* ═══════════════════════════════════════════════════ */

export type PermissionRole =
  | "admin"
  | "financeiro"
  | "atendimento"
  | "producao"
  | "contador";

export type PermissionRoleBadgeSize = "sm" | "md";

export const permissionRoleConfig: Record<
  PermissionRole,
  { label: string; cls: string; clsDark: string; dot: string }
> = {
  admin: {
    label: "Admin",
    cls: "bg-[#F2F2F7] text-[#8E8E93] border-[#E5E5EA]",
    clsDark: "bg-[#2C2C2E] text-[#8E8E93] border-[#3C3C43]",
    dot: "bg-[#8E8E93]",
  },
  financeiro: {
    label: "Financeiro",
    cls: "bg-[#F2F2F7] text-[#3D9A5E] border-[#E5E5EA]",
    clsDark: "bg-[#1A2E1C] text-[#3D9A5E] border-[#2A3E2C]",
    dot: "bg-[#34C759]",
  },
  atendimento: {
    label: "Atendimento",
    cls: "bg-[#F2F2F7] text-[#5B8AD6] border-[#E5E5EA]",
    clsDark: "bg-[#1A222E] text-[#5B8AD6] border-[#2C3A4E]",
    dot: "bg-[#007AFF]",
  },
  producao: {
    label: "Produção",
    cls: "bg-[#F2F2F7] text-[#C48A06] border-[#E5E5EA]",
    clsDark: "bg-[#2E2A1A] text-[#C48A06] border-[#3E3A2A]",
    dot: "bg-[#FF9500]",
  },
  contador: {
    label: "Contador",
    cls: "bg-[#F2F2F7] text-[#8B5CF6] border-[#E5E5EA]",
    clsDark: "bg-[#2A1A3A] text-[#8B5CF6] border-[#3A2A4E]",
    dot: "bg-[#7C3AED]",
  },
};

interface PermissionRoleBadgeProps {
  role: PermissionRole;
  size?: PermissionRoleBadgeSize;
  showDot?: boolean;
}

export function PermissionRoleBadge({
  role,
  size = "sm",
  showDot = false,
}: PermissionRoleBadgeProps) {
  const { isDark } = useDk();
  const cfg = permissionRoleConfig[role];
  const sizeClass =
    size === "sm"
      ? "px-1.5 py-[1px] text-[9px] rounded-md"
      : "px-2 py-[2px] text-[10px] rounded-lg";

  return (
    <span
      className={`inline-flex items-center gap-1 border ${isDark ? cfg.clsDark : cfg.cls} ${sizeClass}`}
      style={{ fontWeight: 600 }}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      )}
      {cfg.label}
    </span>
  );
}