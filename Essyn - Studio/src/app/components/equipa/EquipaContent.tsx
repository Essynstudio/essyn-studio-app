import { useState, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  User,
  Shield,
  Camera,
  Palette,
  HeadphonesIcon,
  Clock,
  UserPlus,
  Download,
  Activity,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { springStiff } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";

const spring = springStiff;

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "fotografo" | "editor" | "atendimento";
  avatar: string; /* initials */
  status: "online" | "ausente" | "offline";
  projetosAtivos: number;
  horasSemana: number;
  ultimaAtividade: string;
  especialidade: string;
}

const mockTeam: TeamMember[] = [
  { id: "tm-1", nome: "Marina Reis", email: "marina@essyn.com", role: "admin", avatar: "MR", status: "online", projetosAtivos: 5, horasSemana: 42, ultimaAtividade: "há 5 min", especialidade: "Gestão geral" },
  { id: "tm-2", nome: "Carlos Mendes", email: "carlos@essyn.com", role: "fotografo", avatar: "CM", status: "online", projetosAtivos: 3, horasSemana: 38, ultimaAtividade: "há 12 min", especialidade: "Casamentos & Eventos" },
  { id: "tm-3", nome: "Julia Farias", email: "julia@essyn.com", role: "atendimento", avatar: "JF", status: "online", projetosAtivos: 8, horasSemana: 35, ultimaAtividade: "há 30 min", especialidade: "CRM & Relacionamento" },
  { id: "tm-4", nome: "Rafael Torres", email: "rafael@essyn.com", role: "editor", avatar: "RT", status: "ausente", projetosAtivos: 4, horasSemana: 40, ultimaAtividade: "há 2h", especialidade: "Edição & Álbuns" },
  { id: "tm-5", nome: "Ana Luiza", email: "ana@essyn.com", role: "fotografo", avatar: "AL", status: "offline", projetosAtivos: 2, horasSemana: 28, ultimaAtividade: "há 1 dia", especialidade: "Ensaios & Retratos" },
  { id: "tm-6", nome: "Bruno Costa", email: "bruno@essyn.com", role: "editor", avatar: "BC", status: "online", projetosAtivos: 6, horasSemana: 44, ultimaAtividade: "há 8 min", especialidade: "Edição & Retoque" },
  { id: "tm-7", nome: "Patrícia Alves", email: "patricia@essyn.com", role: "atendimento", avatar: "PA", status: "ausente", projetosAtivos: 5, horasSemana: 32, ultimaAtividade: "há 3h", especialidade: "Financeiro & Faturas" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "#007AFF",
  fotografo: "#34C759",
  editor: "#AF52DE",
  atendimento: "#FF9500",
};

/* Solid badge backgrounds — zero transparency (no hex alpha) */
const ROLE_BG_LIGHT: Record<string, string> = {
  admin: "#F0F5FF",
  fotografo: "#F0FAF2",
  editor: "#F5F0FA",
  atendimento: "#FFF5E6",
};
const ROLE_BG_DARK: Record<string, string> = {
  admin: "#1A2030",
  fotografo: "#1A2C1E",
  editor: "#2A1A35",
  atendimento: "#2C2410",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  fotografo: "Fotógrafo",
  editor: "Editor",
  atendimento: "Atendimento",
};

const ROLE_ICONS: Record<string, typeof User> = {
  admin: Shield,
  fotografo: Camera,
  editor: Palette,
  atendimento: HeadphonesIcon,
};

const STATUS_DOT: Record<string, string> = {
  online: "#34C759",
  ausente: "#FF9500",
  offline: "#8E8E93",
};

/* ═══════════════════════════════════════════════════ */
/*  MAIN                                               */
/* ═══════════════════════════════════════════════════ */

const INITIAL_VISIBLE = 5;

export function EquipaContent() {
  const dk = useDk();
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const team = mockTeam;
  const totalMembers = team.length;
  const onlineCount = team.filter((m) => m.status === "online").length;
  const totalProjetos = team.reduce((s, m) => s + m.projetosAtivos, 0);
  const avgHours = Math.round(team.reduce((s, m) => s + m.horasSemana, 0) / totalMembers);

  const filtered = useMemo(() => {
    if (!searchQuery) return team;
    const q = searchQuery.toLowerCase();
    return team.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        ROLE_LABELS[m.role].toLowerCase().includes(q) ||
        m.especialidade.toLowerCase().includes(q)
    );
  }, [team, searchQuery]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - INITIAL_VISIBLE;

  const contextLine = useMemo(() => {
    return `${totalMembers} membros · ${onlineCount} online · ${totalProjetos} projetos ativos`;
  }, [totalMembers, onlineCount, totalProjetos]);

  const quickActions = useMemo(() => [
    { label: "Convidar", icon: <UserPlus className="w-4 h-4" />, onClick: () => toast("Convidar membro", { description: "Em desenvolvimento" }) },
    { label: "Relatório", icon: <Download className="w-4 h-4" />, onClick: () => toast("Relatório do time", { description: "Em desenvolvimento" }) },
    { label: "Atividade", icon: <Activity className="w-4 h-4" />, onClick: () => toast("Log de atividades", { description: "Em desenvolvimento" }) },
  ], []);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          ════════════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Time"
        userName=""
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchPlaceholder="Buscar membros, funções..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── KPIs ─── */}
        {isLoading ? (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <MetricsSkeleton />
          </>
        ) : (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <DashboardKpiGrid
              flat
              projetos={{
                label: "Membros",
                value: String(totalMembers),
                sub: `${onlineCount} online agora`,
              }}
              aReceber={{
                label: "Projetos Ativos",
                value: String(totalProjetos),
                sub: `${(totalProjetos / totalMembers).toFixed(1)}/membro`,
              }}
              producao={{
                label: "Horas/Semana",
                value: String(avgHours),
                sub: "média por membro",
              }}
              compromissos={{
                label: "Funções",
                value: String(new Set(team.map((m) => m.role)).size),
                sub: "papéis definidos",
              }}
            />
          </>
        )}
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          WIDGET 2 — LISTA DE MEMBROS
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <WidgetSkeleton key="time-sk" rows={5} delay={0.06} />
        ) : filtered.length === 0 ? (
          <WidgetCard key="time-empty" delay={0.06}>
            <WidgetEmptyState
              icon={<Inbox className="w-5 h-5" />}
              message={searchQuery ? "Nenhum membro encontrado — tente ajustar a busca" : "Nenhum membro ainda — convide o primeiro membro para o time"}
            />
          </WidgetCard>
        ) : (
          <WidgetCard
            key="time-list"
            title="Membros do Time"
            count={filtered.length}
            action="Convidar"
            onAction={() => toast("Convidar membro", { description: "Em desenvolvimento" })}
            delay={0.06}
            footer={
              <div
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                  <span className="numeric" style={{ fontWeight: 500, color: dk.textTertiary }}>{filtered.length}</span> membros
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    {onlineCount} online
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF9500]" />
                    {team.filter((m) => m.status === "ausente").length} ausente
                  </span>
                </div>
              </div>
            }
          >
            <AnimatePresence initial={false}>
              {visible.map((member, i) => {
                const RoleIcon = ROLE_ICONS[member.role] || User;
                const badgeBg = dk.isDark
                  ? (ROLE_BG_DARK[member.role] || dk.bgMuted)
                  : (ROLE_BG_LIGHT[member.role] || dk.bgMuted);
                return (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                  >
                    {i > 0 && <WidgetHairline />}
                    <button
                      onClick={() => toast(member.nome, { description: `${ROLE_LABELS[member.role]} · ${member.especialidade}` })}
                      className="w-full flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer text-left group"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {/* Avatar with status dot */}
                      <div className="relative shrink-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: dk.bgMuted }}
                        >
                          <span className="text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                            {member.avatar}
                          </span>
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: STATUS_DOT[member.status],
                            border: `2px solid ${dk.bg}`,
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-0 flex-1 min-w-0">
                        <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>
                          {member.nome}
                        </span>
                        <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
                          {member.especialidade} · {member.ultimaAtividade}
                        </span>
                      </div>

                      {/* Meta / badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: badgeBg }}
                        >
                          <RoleIcon className="w-2.5 h-2.5" style={{ color: ROLE_COLORS[member.role] }} />
                          <span
                            className="text-[10px]"
                            style={{ fontWeight: 500, color: ROLE_COLORS[member.role] }}
                          >
                            {ROLE_LABELS[member.role]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: dk.textMuted }}>
                          <Clock className="w-2.5 h-2.5" />
                          <span className="numeric" style={{ fontWeight: 500 }}>{member.horasSemana}h</span>
                        </div>
                      </div>

                      {/* Chevron on hover */}
                      <ChevronRight
                        className="w-3.5 h-3.5 transition-colors shrink-0"
                        style={{ color: dk.textDisabled }}
                      />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Expand / collapse toggle */}
            {hiddenCount > 0 && (
              <>
                <WidgetHairline />
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] transition-all cursor-pointer"
                  style={{ fontWeight: 500, color: dk.textTertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = dk.bgHover;
                    e.currentTarget.style.color = dk.textSecondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = dk.textTertiary;
                  }}
                >
                  {expanded ? "Mostrar menos" : `Mais ${hiddenCount} membros`}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </button>
              </>
            )}
          </WidgetCard>
        )}
      </AnimatePresence>
    </div>
  );
}