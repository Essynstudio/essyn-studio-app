"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, Plus, ChevronRight,
  FolderOpen, UserPlus, Image as ImageIcon, FileText, CreditCard, Calendar, Star,
} from "lucide-react";
import Link from "next/link";
import { format, isToday, isYesterday, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { springSnappy, springDefault } from "@/lib/motion-tokens";
import { PageTransition } from "@/components/ui/apple-kit";
import { PRIMARY_CTA, COMPACT_PRIMARY_CTA } from "@/lib/design-tokens";
import { useDrawer } from "@/components/drawers/drawer-provider";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface DashboardStats {
  activeProjects: number;
  totalLeads: number;
  newLeadsToday: number;
  pipelineValue: number;
  pendingReceivables: number;
  overdueReceivables: number;
  receivedThisMonth: number;
  productionInProgress: number;
}

interface DashboardEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  status: string;
  location: string | null;
}

interface TodayEvent extends DashboardEvent {
  project_id: string | null;
  projects: { id: string; name: string } | null;
}

interface ActivityEntry {
  id: string;
  entity_type: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface DashboardAlerts {
  overdueInstallments: { count: number; total: number };
  dueThisWeek: { count: number; total: number };
  projectsNoTeam: number;
  overdueDeliveries: { id: string; name: string; deadline: string }[];
  deliveriesThisWeek: { id: string; name: string; deadline: string }[];
  staleProjects: number;
}

interface OnboardingData {
  hasClients: boolean;
  hasProjects: boolean;
  hasEvents: boolean;
  hasGalleries: boolean;
  hasFinanceiro: boolean;
}

interface Breakdowns {
  projectsByType: Record<string, number>;
  projectsByStatus: Record<string, number>;
  totalProjectsValue: number;
  nextEvent: { title: string; date: string } | null;
  leadsByStage: Record<string, number>;
  recentLeadNames: string[];
  pipelineByStage: Record<string, number>;
  leadsWon: number;
  leadsLost: number;
  productionByPhase: Record<string, number>;
  nearestDeadline: { name: string; date: string } | null;
}

interface DashboardClientProps {
  studioName: string;
  stats: DashboardStats;
  breakdowns: Breakdowns;
  alerts: DashboardAlerts;
  todayEvents: TodayEvent[];
  upcomingEvents: DashboardEvent[];
  recentActivity: ActivityEntry[];
  onboarding: OnboardingData;
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function cur(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const TYPE_LABELS: Record<string, string> = {
  casamento: "Casamento", ensaio: "Ensaio", corporativo: "Corporativo",
  aniversario: "Aniversário", formatura: "Formatura", batizado: "Batizado", outro: "Outro",
};
const STAGE_LABELS: Record<string, string> = {
  novo: "Novo", contato: "Contato", reuniao: "Reunião",
  proposta: "Proposta", negociacao: "Negociação",
};
const PHASE_LABELS: Record<string, string> = {
  agendado: "Agendado", captacao: "Captação", selecao: "Seleção",
  edicao: "Edição", revisao: "Revisão", entrega: "Entrega", concluido: "Concluído",
};
const STATUS_LABELS: Record<string, string> = {
  confirmado: "Confirmado", producao: "Produção", edicao: "Edição",
};

// Elevated card style — shadow-based instead of hard borders
const CARD = "bg-[var(--card)] rounded-2xl";
function cardShadow() {
  return { boxShadow: "var(--shadow-sm)" } as React.CSSProperties;
}

// ═══════════════════════════════════════════════
// Financial Hero — the star card
// ═══════════════════════════════════════════════

function FinancialHero({ stats }: { stats: DashboardStats }) {
  const total = stats.receivedThisMonth + stats.pendingReceivables;
  const pct = total > 0 ? Math.round((stats.receivedThisMonth / total) * 100) : 0;
  const hasOverdue = stats.overdueReceivables > 0;

  return (
    <Link href="/financeiro" className={`group block ${CARD} overflow-hidden hover:bg-[var(--card-hover)] transition-colors`} style={cardShadow()}>
      <div className="h-[2px] bg-[var(--accent)]" />
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.08em]">
            Financeiro do mês
          </p>
          <span className="text-[11px] text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors flex items-center gap-0.5">
            Ver tudo <ChevronRight size={11} />
          </span>
        </div>

        <div className="flex items-end gap-8 sm:gap-12">
          <div>
            <p className="text-[10px] text-[var(--fg-muted)] mb-1.5 tracking-[0.02em]">Recebido</p>
            <p className="text-[34px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none tabular-nums">
              {cur(stats.receivedThisMonth)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--fg-muted)] mb-1.5 tracking-[0.02em]">A receber</p>
            <p className="text-[22px] font-semibold text-[var(--fg-secondary)] tracking-[-0.02em] leading-none tabular-nums">
              {cur(stats.pendingReceivables)}
            </p>
          </div>
          {hasOverdue && (
            <div>
              <p className="text-[10px] text-[var(--error)] mb-1.5 tracking-[0.02em]">Vencido</p>
              <p className="text-[22px] font-semibold text-[var(--error)] tracking-[-0.02em] leading-none tabular-nums">
                {cur(stats.overdueReceivables)}
              </p>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[var(--fg-muted)] tabular-nums">{pct}% recebido</span>
              <span className="text-[10px] text-[var(--fg-muted)] tabular-nums">{cur(total)}</span>
            </div>
            <div className="h-[3px] rounded-full bg-[var(--border-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--success)]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 16, delay: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════
// Stats Panel — unified 3-column
// ═══════════════════════════════════════════════

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--bg)] text-[10px] font-medium text-[var(--fg-secondary)]">
      {children}
    </span>
  );
}

function PillList({ items }: { items: [string, number][] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, count]) => (
        <Pill key={label}>
          {label} <span className="text-[var(--fg)] tabular-nums font-semibold">{count}</span>
        </Pill>
      ))}
    </div>
  );
}

function StatsGrid({ stats, breakdowns }: { stats: DashboardStats; breakdowns: Breakdowns }) {
  const types = Object.entries(breakdowns.projectsByType)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => [TYPE_LABELS[t] || t, c] as [string, number]);

  const statuses = Object.entries(breakdowns.projectsByStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => [STATUS_LABELS[s] || s, c] as [string, number]);

  const stages = Object.entries(breakdowns.leadsByStage)
    .filter(([s]) => !["ganho", "perdido"].includes(s))
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => [STAGE_LABELS[s] || s, c] as [string, number]);

  const phases = Object.entries(breakdowns.productionByPhase)
    .sort((a, b) => b[1] - a[1])
    .map(([p, c]) => [PHASE_LABELS[p] || p, c] as [string, number]);

  return (
    <div className={CARD} style={cardShadow()}>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">

        {/* Projetos */}
        <Link href="/projetos" className="group block px-6 py-5 hover:bg-[var(--card-hover)] transition-colors">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">
              {stats.activeProjects}
            </p>
            <ChevronRight size={13} className="text-[var(--fg-muted)] opacity-0 group-hover:opacity-60 transition-opacity" />
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] font-medium mb-3">projetos ativos</p>
          {types.length > 0 ? <PillList items={types} /> : statuses.length > 0 ? <PillList items={statuses} /> : (
            <p className="text-[11px] text-[var(--fg-muted)]">Crie projetos para ver o resumo</p>
          )}
          {breakdowns.nextEvent && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-[3px] h-5 rounded-full bg-[var(--info)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--fg)] truncate">{breakdowns.nextEvent.title}</p>
                <p className="text-[10px] text-[var(--fg-muted)]">
                  {format(new Date(breakdowns.nextEvent.date), "d MMM, HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </Link>

        {/* Leads */}
        <Link href="/crm" className="group block px-6 py-5 hover:bg-[var(--card-hover)] transition-colors">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">
              {stats.totalLeads}
            </p>
            <ChevronRight size={13} className="text-[var(--fg-muted)] opacity-0 group-hover:opacity-60 transition-opacity" />
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] font-medium mb-3">
            {stats.newLeadsToday > 0 ? `leads · +${stats.newLeadsToday} hoje` : "leads"}
          </p>
          {stages.length > 0 ? (
            <>
              <div className="flex h-[3px] rounded-full overflow-hidden bg-[var(--border-subtle)] mb-2.5">
                {stages.map(([label, count]) => {
                  const total = stages.reduce((s, [, c]) => s + c, 0);
                  const stageKey = Object.entries(STAGE_LABELS).find(([, v]) => v === label)?.[0] || "";
                  const colors: Record<string, string> = {
                    novo: "var(--info)", contato: "#5A8A96", reuniao: "var(--warning)",
                    proposta: "var(--accent)", negociacao: "var(--success)",
                  };
                  return (
                    <div key={label} className="h-full" style={{
                      width: `${(count / total) * 100}%`,
                      backgroundColor: colors[stageKey] || "var(--fg-muted)",
                      minWidth: count > 0 ? "3px" : "0",
                    }} />
                  );
                })}
              </div>
              <PillList items={stages} />
            </>
          ) : (
            <p className="text-[11px] text-[var(--fg-muted)]">Adicione leads pelo CRM</p>
          )}
          {stats.pipelineValue > 0 && (
            <p className="text-[11px] text-[var(--fg-secondary)] mt-2.5 font-medium tabular-nums">
              {cur(stats.pipelineValue)} em negociação
            </p>
          )}
        </Link>

        {/* Produção */}
        <Link href="/producao" className="group block px-6 py-5 hover:bg-[var(--card-hover)] transition-colors">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">
              {stats.productionInProgress}
            </p>
            <ChevronRight size={13} className="text-[var(--fg-muted)] opacity-0 group-hover:opacity-60 transition-opacity" />
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] font-medium mb-3">em produção</p>
          {phases.length > 0 ? <PillList items={phases} /> : (
            <p className="text-[11px] text-[var(--fg-muted)]">Projetos em andamento aparecem aqui</p>
          )}
          {breakdowns.nearestDeadline && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-[3px] h-5 rounded-full bg-[var(--warning)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--fg)] truncate">{breakdowns.nearestDeadline.name}</p>
                <p className="text-[10px] text-[var(--fg-muted)]">
                  entrega {format(new Date(breakdowns.nearestDeadline.date + "T12:00:00"), "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </Link>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Today — schedule timeline
// ═══════════════════════════════════════════════

function TodaySection({ todayEvents, upcomingEvents }: { todayEvents: TodayEvent[]; upcomingEvents: DashboardEvent[] }) {
  const now = new Date();
  const next = upcomingEvents[0] ?? null;

  return (
    <div className="px-6 py-5 flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.08em]">Hoje</h3>
        <Link
          href="/agenda"
          className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors flex items-center gap-0.5"
        >
          Agenda <ChevronRight size={11} />
        </Link>
      </div>

      {todayEvents.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[22px] font-semibold text-[var(--fg)] leading-tight tracking-[-0.02em]">
            Dia livre
          </p>
          {next && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-[0.08em] font-medium mb-1">Próximo</p>
              <p className="text-[13px] font-medium text-[var(--fg)]">{next.title}</p>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {format(new Date(next.start_at), "EEEE, d MMM · HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 space-y-0.5">
          {todayEvents.map((event, i) => {
            const start = new Date(event.start_at);
            const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 3600000);
            const isCurrent = now >= start && now <= end;
            const isPast = now > end;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSnappy, delay: i * 0.04 }}
                className={`flex items-center gap-3 py-2 px-2 rounded-lg ${isCurrent ? "bg-[var(--info-subtle)]" : ""}`}
                style={{ opacity: isPast ? 0.4 : 1 }}
              >
                <div className="w-[3px] h-7 rounded-full shrink-0" style={{
                  backgroundColor: isCurrent ? "var(--info)" : isPast ? "var(--border)" : "var(--fg-muted)",
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--fg)] truncate">{event.title}</p>
                  <p className="text-[10px] text-[var(--fg-muted)] tabular-nums">
                    {format(start, "HH:mm")}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-[9px] font-bold text-[var(--info)] uppercase tracking-widest">Agora</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Attention — alerts that need action
// ═══════════════════════════════════════════════

type AlertVariant = "error" | "warning" | "info" | "muted";

interface AlertItem {
  key: string;
  variant: AlertVariant;
  text: string;
  sub: string;
  action: { type: "link" | "drawer"; href?: string; projectId?: string; tab?: "dados" | "producao" };
}

function buildAlerts(a: DashboardAlerts): AlertItem[] {
  const out: AlertItem[] = [];
  if (a.overdueInstallments.count > 0)
    out.push({ key: "overdue", variant: "error", text: `${a.overdueInstallments.count} parcela${a.overdueInstallments.count > 1 ? "s" : ""} vencida${a.overdueInstallments.count > 1 ? "s" : ""}`, sub: cur(a.overdueInstallments.total), action: { type: "link", href: "/financeiro" } });
  if (a.dueThisWeek.count > 0)
    out.push({ key: "due-week", variant: "warning", text: `${a.dueThisWeek.count} parcela${a.dueThisWeek.count > 1 ? "s" : ""} vence${a.dueThisWeek.count > 1 ? "m" : ""} essa semana`, sub: cur(a.dueThisWeek.total), action: { type: "link", href: "/financeiro" } });
  for (const p of a.overdueDeliveries) {
    const d = Math.ceil((Date.now() - new Date(p.deadline).getTime()) / 86400000);
    out.push({ key: `od-${p.id}`, variant: "error", text: `Entrega atrasada: ${p.name}`, sub: `${d} dia${d > 1 ? "s" : ""}`, action: { type: "drawer", projectId: p.id, tab: "producao" } });
  }
  for (const p of a.deliveriesThisWeek)
    out.push({ key: `dw-${p.id}`, variant: "warning", text: `Entrega essa semana: ${p.name}`, sub: "Verifique produção", action: { type: "drawer", projectId: p.id, tab: "producao" } });
  if (a.projectsNoTeam > 0)
    out.push({ key: "no-team", variant: "info", text: `${a.projectsNoTeam} projeto${a.projectsNoTeam > 1 ? "s" : ""} sem equipe`, sub: "Atribua responsáveis", action: { type: "link", href: "/projetos" } });
  if (a.staleProjects > 0)
    out.push({ key: "stale", variant: "muted", text: `${a.staleProjects} rascunho${a.staleProjects > 1 ? "s" : ""} parado${a.staleProjects > 1 ? "s" : ""}`, sub: "Avance ou arquive", action: { type: "link", href: "/projetos" } });
  return out;
}

const DOT: Record<AlertVariant, string> = { error: "var(--error)", warning: "var(--warning)", info: "var(--info)", muted: "var(--fg-muted)" };
const DISMISSED_KEY = "essyn_dismissed_alerts";

function AttentionSection({ alerts }: { alerts: DashboardAlerts }) {
  const { openDrawer } = useDrawer();
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    try { setDismissed(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")); } catch { /* noop */ }
  }, []);
  const dismiss = useCallback((k: string) => {
    setDismissed(p => { const n = [...p, k]; localStorage.setItem(DISMISSED_KEY, JSON.stringify(n)); return n; });
  }, []);

  const items = buildAlerts(alerts).filter(i => !dismissed.includes(i.key)).slice(0, 5);

  return (
    <div className="px-6 py-5 flex flex-col min-h-[180px]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.08em]">Atenção</h3>
        {items.length > 0 && (
          <span className="min-w-[16px] h-[16px] rounded-full bg-[var(--error)] text-white text-[9px] font-bold flex items-center justify-center px-1">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[22px] font-semibold text-[var(--success)] leading-tight tracking-[-0.02em]">
            Tudo certo
          </p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">Nenhuma pendência no momento.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-0.5">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ ...springSnappy, delay: i * 0.03 }}
                className="group"
              >
                <div
                  className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                  onClick={() => {
                    if (item.action.type === "drawer" && item.action.projectId) openDrawer(item.action.projectId, item.action.tab || "dados");
                  }}
                >
                  <div
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{
                      backgroundColor: DOT[item.variant],
                      boxShadow: item.variant === "error" ? `0 0 0 3px color-mix(in srgb, ${DOT[item.variant]} 20%, transparent)` : "none",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--fg)] truncate">{item.text}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">{item.sub}</p>
                  </div>
                  {item.action.type === "link" && (
                    <Link href={item.action.href!} onClick={e => e.stopPropagation()} className="shrink-0">
                      <ChevronRight size={13} className="text-[var(--fg-muted)]" />
                    </Link>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(item.key); }}
                    className="shrink-0 p-0.5 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Activity — grouped timeline with semantic icons
// ═══════════════════════════════════════════════

const ENTITY_LABELS: Record<string, string> = {
  project: "Projeto", client: "Cliente", gallery: "Galeria",
  contract: "Contrato", installment: "Parcela", event: "Evento", lead: "Lead",
};
const ACTION_VERBS: Record<string, string> = {
  created: "criado", updated: "atualizado", deleted: "removido",
  published: "publicado", completed: "concluído", sent: "enviado",
  signed: "assinado", paid: "pago",
};

const ENTITY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  project: FolderOpen,
  client: UserPlus,
  gallery: ImageIcon,
  contract: FileText,
  installment: CreditCard,
  event: Calendar,
  lead: Star,
};

const ENTITY_COLORS: Record<string, string> = {
  project: "var(--info)",
  client: "var(--accent)",
  gallery: "var(--purple)",
  contract: "var(--fg-muted)",
  installment: "var(--success)",
  event: "var(--warning)",
  lead: "var(--pink)",
};

const ENTITY_BG: Record<string, string> = {
  project: "var(--info-subtle)",
  client: "var(--accent-subtle)",
  gallery: "var(--purple-subtle)",
  contract: "var(--bg-subtle)",
  installment: "var(--success-subtle)",
  event: "var(--warning-subtle)",
  lead: "var(--pink-subtle)",
};

function groupActivities(activities: ActivityEntry[]) {
  const groups: { label: string; items: ActivityEntry[] }[] = [];
  const today: ActivityEntry[] = [];
  const yesterday: ActivityEntry[] = [];
  const older: ActivityEntry[] = [];

  for (const a of activities.slice(0, 8)) {
    const d = new Date(a.created_at);
    if (isToday(d)) today.push(a);
    else if (isYesterday(d)) yesterday.push(a);
    else older.push(a);
  }

  if (today.length) groups.push({ label: "Hoje", items: today });
  if (yesterday.length) groups.push({ label: "Ontem", items: yesterday });
  if (older.length) groups.push({ label: "Anteriores", items: older });

  return groups;
}

function ActivityTimeline({ recentActivity }: { recentActivity: ActivityEntry[] }) {
  if (recentActivity.length === 0) return null;

  const groups = groupActivities(recentActivity);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.08em] mb-2">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((a, i) => {
              const Icon = ENTITY_ICONS[a.entity_type] || FolderOpen;
              const color = ENTITY_COLORS[a.entity_type] || "var(--fg-muted)";
              const bg = ENTITY_BG[a.entity_type] || "var(--bg-subtle)";
              const msg = String(
                (a.details as Record<string, unknown>)?.message ||
                `${ENTITY_LABELS[a.entity_type] || a.entity_type} ${ACTION_VERBS[a.action] || a.action}`
              );
              const time = isToday(new Date(a.created_at))
                ? format(new Date(a.created_at), "HH:mm")
                : formatDistanceToNowStrict(new Date(a.created_at), { locale: ptBR, addSuffix: false });

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: bg, color }}
                  >
                    <Icon size={11} />
                  </div>
                  <p className="text-[12px] text-[var(--fg)] flex-1 truncate">{msg}</p>
                  <span className="text-[10px] text-[var(--fg-muted)] tabular-nums shrink-0">{time}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Welcome — new users
// ═══════════════════════════════════════════════

const OB_KEY = "essyn_onboarding_dismissed";

function Welcome({ onboarding }: { onboarding: OnboardingData }) {
  const [off, setOff] = useState(false);
  useEffect(() => { if (typeof window !== "undefined") setOff(localStorage.getItem(OB_KEY) === "true"); }, []);
  if (off || onboarding.hasProjects) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springSnappy}>
      <div className={`relative ${CARD} overflow-hidden`} style={cardShadow()}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--info)]" />
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[13px] font-semibold text-[var(--fg)]">Bem-vindo ao Essyn</p>
              <p className="text-[12px] text-[var(--fg-muted)] mt-0.5 max-w-sm">
                Crie seu primeiro projeto — galeria, financeiro e produção são configurados automaticamente.
              </p>
            </div>
            <Link href="/projetos?new=1" className={`${COMPACT_PRIMARY_CTA} shrink-0`}>
              <Plus size={13} /> Criar projeto
            </Link>
          </div>
          <button
            onClick={() => { setOff(true); localStorage.setItem(OB_KEY, "true"); }}
            className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors p-1 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

export function DashboardClient({
  studioName, stats, breakdowns, alerts, todayEvents, upcomingEvents, recentActivity, onboarding,
}: DashboardClientProps) {
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springSnappy}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-[12px] text-[var(--fg-muted)] capitalize">{today}</p>
            <h1 className="text-[28px] font-bold text-[var(--fg)] tracking-tight mt-0.5 leading-tight">
              {greeting()}, {studioName}
            </h1>
          </div>
          <Link href="/projetos" className={`${COMPACT_PRIMARY_CTA} hidden sm:flex`}>
            <Plus size={15} /> Novo Projeto
          </Link>
        </motion.div>

        {/* Welcome */}
        <Welcome onboarding={onboarding} />

        {/* Financial Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.03 }}>
          <FinancialHero stats={stats} />
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.06 }}>
          <StatsGrid stats={stats} breakdowns={breakdowns} />
        </motion.div>

        {/* Today + Attention — unified panel, asymmetric */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springDefault, delay: 0.09 }}
          className={CARD}
          style={cardShadow()}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
            <TodaySection todayEvents={todayEvents} upcomingEvents={upcomingEvents} />
            <AttentionSection alerts={alerts} />
          </div>
        </motion.div>

        {/* Activity */}
        {recentActivity.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.12 }}>
            <div className={CARD} style={cardShadow()}>
              <div className="px-6 pt-5 pb-1">
                <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.08em]">Atividade</p>
              </div>
              <div className="px-6 pb-4">
                <ActivityTimeline recentActivity={recentActivity} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
