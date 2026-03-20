"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  DollarSign, Users, FolderOpen, Image, FileText, BarChart3, Target,
  ArrowUpRight, ArrowDownRight, ShoppingCart, UserCheck,
  AlertTriangle, Package, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PageTransition, HeaderWidget, Panel, PanelHeader,
  StatBar, ActionPill, WidgetEmptyState, StatusBadge,
} from "@/components/ui/apple-kit";
import { springDefault, springContentIn } from "@/lib/motion-tokens";

/* ══════════════════════════════════════ */
/* Types                                  */
/* ══════════════════════════════════════ */
interface Installment {
  id: string; type: "receita" | "despesa"; amount: number; due_date: string;
  status: string; paid_at: string | null; paid_amount: number | null;
  payment_method: string | null; category: string | null; created_at: string;
  projects: { id: string; name: string } | null;
  clients: { id: string; name: string } | null;
}
interface Project {
  id: string; name: string; event_type: string; event_date: string | null;
  status: string; production_phase: string; value: number; paid: number; created_at: string;
}
interface Lead {
  id: string; name: string; stage: string; event_type: string;
  estimated_value: number; source: string | null; created_at: string;
}
interface Gallery {
  id: string; name: string; status: string; photo_count: number;
  views: number; downloads: number; created_at: string;
}
interface Client {
  id: string; name: string; status: string; total_spent: number; created_at: string;
}
interface Contract {
  id: string; title: string; status: string; value: number; created_at: string;
}
interface Order {
  id: string; status: string; total: number; created_at: string;
}
interface TeamMember {
  id: string; name: string; role: string; active: boolean; hourly_rate: number | null;
}
interface Workflow {
  id: string; name: string; status: string; deadline: string | null; assigned_to: string | null;
  projects: { id: string; name: string; event_type: string } | null;
}
interface CalEvent {
  id: string; title: string; start_at: string; status: string;
}
interface PortalMsg {
  id: string; sender_type: string; created_at: string;
}
interface Briefing {
  id: string; status: string; completed_at: string | null; created_at: string;
}
interface ProjectItem {
  id: string; name: string; category: string; status: string; quantity: number; unit_price: number;
}
interface Props {
  installments: Installment[]; projects: Project[]; leads: Lead[];
  galleries: Gallery[]; clients: Client[]; contracts: Contract[];
  orders: Order[]; team: TeamMember[]; workflows: Workflow[];
  events: CalEvent[]; messages: PortalMsg[]; briefings: Briefing[];
  items: ProjectItem[];
}

/* ══════════════════════════════════════ */
/* Helpers & Constants                    */
/* ══════════════════════════════════════ */
function cur(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }); }
function pct(v: number, t: number) { return t > 0 ? Math.round((v / t) * 100) : 0; }
type Periodo = "6m" | "12m" | "ano";

const CHART_COLORS = { receita: "#2D7A4F", despesa: "#B84233", lucro: "#2C444D" };
const PIE_COLORS = ["#2C444D", "#2D7A4F", "#C87A20", "#B84233", "#6B5B8D", "#7A8A8F", "#A0566B", "#A58D66", "#5A8A96"];

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho", confirmado: "Confirmado", producao: "Produção",
  edicao: "Edição", entregue: "Entregue", cancelado: "Cancelado",
};
const STAGE_LABELS: Record<string, string> = {
  novo: "Novo", contato: "Contato", reuniao: "Reunião", proposta: "Proposta",
  negociacao: "Negociação", ganho: "Ganho", perdido: "Perdido",
};
const EVENT_LABELS: Record<string, string> = {
  casamento: "Casamento", ensaio: "Ensaio", corporativo: "Corporativo",
  aniversario: "Aniversário", formatura: "Formatura", batizado: "Batizado", outro: "Outro",
};
const ROLE_LABELS: Record<string, string> = {
  fotografo: "Fotógrafo", videomaker: "Videomaker", editor: "Editor",
  assistente: "Assistente", admin: "Admin", drone: "Drone", outro: "Outro",
};
const WF_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado",
};

/* Custom tooltip */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[12px] font-semibold" style={{ color: p.color }}>
          {p.name}: {cur(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════ */
/* Main Component                         */
/* ══════════════════════════════════════ */
export function RelatoriosClient({
  installments, projects, leads, galleries, clients, contracts,
  orders, team, workflows, events, messages, briefings, items,
}: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("6m");

  /* ── Date range ── */
  const monthCount = useMemo(() => {
    if (periodo === "ano") return new Date().getMonth() + 1;
    return periodo === "6m" ? 6 : 12;
  }, [periodo]);

  /* ── Monthly financial data ── */
  const monthlyData = useMemo(() => {
    const months: { month: string; label: string; receita: number; despesa: number; lucro: number }[] = [];
    for (let i = 0; i < monthCount; i++) {
      const ms = startOfMonth(subMonths(new Date(), monthCount - 1 - i));
      const me = endOfMonth(ms);
      const label = format(ms, "MMM", { locale: ptBR });
      const monthKey = format(ms, "yyyy-MM");
      let receita = 0, despesa = 0;
      for (const inst of installments) {
        const d = new Date(inst.due_date + "T00:00:00");
        if (!isWithinInterval(d, { start: ms, end: me })) continue;
        const active = inst.status === "pago" || inst.status === "pendente" || inst.status === "vencido";
        if (!active) continue;
        const amt = inst.status === "pago" ? (inst.paid_amount || inst.amount) : inst.amount;
        if (inst.type === "receita") receita += amt;
        if (inst.type === "despesa") despesa += amt;
      }
      months.push({ month: monthKey, label: label.charAt(0).toUpperCase() + label.slice(1), receita, despesa, lucro: receita - despesa });
    }
    return months;
  }, [installments, monthCount]);

  /* ── Financial KPIs ── */
  const kpis = useMemo(() => {
    const totalReceita = installments.filter(i => i.type === "receita" && i.status === "pago").reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    const totalDespesa = installments.filter(i => i.type === "despesa" && i.status === "pago").reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    const pendente = installments.filter(i => i.type === "receita" && (i.status === "pendente" || i.status === "vencido")).reduce((s, i) => s + i.amount, 0);
    const vencido = installments.filter(i => (i.status === "vencido" || (i.status === "pendente" && new Date(i.due_date + "T00:00:00") < new Date()))).reduce((s, i) => s + i.amount, 0);
    const projetosAtivos = projects.filter(p => ["confirmado", "producao", "edicao"].includes(p.status)).length;
    const projetosEntregues = projects.filter(p => p.status === "entregue").length;
    const leadsGanhos = leads.filter(l => l.stage === "ganho").length;
    const taxaConversao = leads.length > 0 ? pct(leadsGanhos, leads.length) : 0;
    const pipelineValue = leads.filter(l => !["ganho", "perdido"].includes(l.stage)).reduce((s, l) => s + (l.estimated_value || 0), 0);
    const projsComValor = projects.filter(p => p.value > 0);
    const ticketMedio = projsComValor.length > 0 ? projsComValor.reduce((s, p) => s + p.value, 0) / projsComValor.length : 0;
    return {
      totalReceita, totalDespesa, lucro: totalReceita - totalDespesa, pendente, vencido,
      projetosAtivos, projetosEntregues, totalProjetos: projects.length,
      leadsAtivos: leads.filter(l => !["ganho", "perdido"].includes(l.stage)).length,
      leadsGanhos, taxaConversao, pipelineValue, ticketMedio,
      totalClientes: clients.length,
      totalGalerias: galleries.length,
      totalFotos: galleries.reduce((s, g) => s + (g.photo_count || 0), 0),
      totalViews: galleries.reduce((s, g) => s + (g.views || 0), 0),
      totalDownloads: galleries.reduce((s, g) => s + (g.downloads || 0), 0),
      contratosAssinados: contracts.filter(c => c.status === "assinado").length,
      valorContratos: contracts.filter(c => c.status === "assinado").reduce((s, c) => s + (c.value || 0), 0),
    };
  }, [installments, projects, leads, clients, galleries, contracts]);

  /* ── Month comparison ── */
  const comparison = useMemo(() => {
    const now = new Date();
    const curS = startOfMonth(now), curE = endOfMonth(now);
    const prevS = startOfMonth(subMonths(now, 1)), prevE = endOfMonth(subMonths(now, 1));
    let cur = 0, prev = 0;
    for (const inst of installments) {
      if (inst.type !== "receita") continue;
      const d = new Date(inst.due_date + "T00:00:00");
      const amt = inst.status === "pago" ? (inst.paid_amount || inst.amount) : inst.amount;
      if (isWithinInterval(d, { start: curS, end: curE })) cur += amt;
      if (isWithinInterval(d, { start: prevS, end: prevE })) prev += amt;
    }
    const diff = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
    return { curReceita: cur, diff };
  }, [installments]);

  /* ── Projects by status (pie) ── */
  const projectsByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    projects.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return Object.entries(c).map(([s, v]) => ({ name: STATUS_LABELS[s] || s, value: v })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [projects]);

  /* ── Projects by type (pie) ── */
  const projectsByType = useMemo(() => {
    const c: Record<string, number> = {};
    projects.forEach(p => { c[p.event_type] = (c[p.event_type] || 0) + 1; });
    return Object.entries(c).map(([t, v]) => ({ name: EVENT_LABELS[t] || t, value: v })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [projects]);

  /* ── Leads by stage ── */
  const leadsByStage = useMemo(() => {
    const order = ["novo", "contato", "reuniao", "proposta", "negociacao", "ganho", "perdido"];
    const c: Record<string, number> = {};
    leads.forEach(l => { c[l.stage] = (c[l.stage] || 0) + 1; });
    return order.map(s => ({ name: STAGE_LABELS[s] || s, value: c[s] || 0, stage: s })).filter(d => d.value > 0);
  }, [leads]);

  /* ── Payment methods ── */
  const paymentMethods = useMemo(() => {
    const labels: Record<string, string> = { pix: "PIX", boleto: "Boleto", cartao_credito: "Cartão Crédito", cartao_debito: "Cartão Débito", transferencia: "Transferência", dinheiro: "Dinheiro" };
    const c: Record<string, number> = {};
    installments.filter(i => i.type === "receita" && i.status === "pago" && i.payment_method)
      .forEach(i => { c[i.payment_method!] = (c[i.payment_method!] || 0) + (i.paid_amount || i.amount); });
    return Object.entries(c).map(([m, v]) => ({ name: labels[m] || m, value: v })).sort((a, b) => b.value - a.value);
  }, [installments]);

  /* ── NEW: Expense by category (pie) ── */
  const expenseByCategory = useMemo(() => {
    const c: Record<string, number> = {};
    installments.filter(i => i.type === "despesa" && (i.status === "pago" || i.status === "pendente" || i.status === "vencido"))
      .forEach(i => {
        const cat = i.category || "Sem categoria";
        c[cat] = (c[cat] || 0) + (i.status === "pago" ? (i.paid_amount || i.amount) : i.amount);
      });
    return Object.entries(c).map(([cat, v]) => ({ name: cat, value: v })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [installments]);

  /* ── NEW: Project paid vs value ── */
  const projectPayment = useMemo(() => {
    const projsComValor = projects.filter(p => p.value > 0 && p.status !== "cancelado");
    const totalValue = projsComValor.reduce((s, p) => s + p.value, 0);
    const totalPaid = projsComValor.reduce((s, p) => s + (p.paid || 0), 0);
    return { totalValue, totalPaid, pct: pct(totalPaid, totalValue), count: projsComValor.length };
  }, [projects]);

  /* ── NEW: Orders / Products ── */
  const orderStats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status === "entregue").length;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => ["pendente", "producao", "enviado"].includes(o.status)).length;
    return { total, delivered, revenue, pending };
  }, [orders]);

  /* ── NEW: Team stats ── */
  const teamStats = useMemo(() => {
    const active = team.filter(m => m.active);
    const roleCount: Record<string, number> = {};
    active.forEach(m => { roleCount[m.role] = (roleCount[m.role] || 0) + 1; });
    const roles = Object.entries(roleCount).map(([r, c]) => ({ name: ROLE_LABELS[r] || r, value: c })).sort((a, b) => b.value - a.value);
    return { total: team.length, active: active.length, roles };
  }, [team]);

  /* ── NEW: Workflow / Production stats ── */
  const prodStats = useMemo(() => {
    const total = workflows.length;
    const concluido = workflows.filter(w => w.status === "concluido").length;
    const emAndamento = workflows.filter(w => w.status === "em_andamento").length;
    const pendente = workflows.filter(w => w.status === "pendente").length;
    const atrasados = workflows.filter(w =>
      w.deadline && w.status !== "concluido" && w.status !== "cancelado" && isPast(new Date(w.deadline + "T23:59:59"))
    ).length;
    const taxaConclusao = total > 0 ? pct(concluido, total) : 0;

    // Workflows by assignee
    const byPerson: Record<string, { total: number; done: number; late: number }> = {};
    workflows.forEach(w => {
      const p = w.assigned_to || "Sem responsável";
      if (!byPerson[p]) byPerson[p] = { total: 0, done: 0, late: 0 };
      byPerson[p].total++;
      if (w.status === "concluido") byPerson[p].done++;
      if (w.deadline && w.status !== "concluido" && w.status !== "cancelado" && isPast(new Date(w.deadline + "T23:59:59"))) byPerson[p].late++;
    });
    const workload = Object.entries(byPerson)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);

    return { total, concluido, emAndamento, pendente, atrasados, taxaConclusao, workload };
  }, [workflows]);


  /* ── NEW: Gallery engagement ── */
  const galleryEngagement = useMemo(() => {
    const topViewed = [...galleries].filter(g => g.views > 0).sort((a, b) => b.views - a.views).slice(0, 5);
    return { topViewed };
  }, [galleries]);

  /* ── NEW: Project items / scope ── */
  const itemStats = useMemo(() => {
    const total = items.length;
    const entregue = items.filter(i => i.status === "entregue").length;
    const valor = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const byCat: Record<string, number> = {};
    items.forEach(i => { byCat[i.category || "servico"] = (byCat[i.category || "servico"] || 0) + 1; });
    const categories = Object.entries(byCat).map(([c, v]) => ({ name: c, value: v })).sort((a, b) => b.value - a.value);
    return { total, entregue, valor, deliveryRate: pct(entregue, total), categories };
  }, [items]);

  /* ── NEW: Lead sources ── */
  const leadSources = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach(l => { const s = l.source || "Direto"; c[s] = (c[s] || 0) + 1; });
    return Object.entries(c).map(([s, v]) => ({ name: s, value: v })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const isEmpty = installments.length === 0 && projects.length === 0 && leads.length === 0;

  if (isEmpty) {
    return (
      <PageTransition>
        <HeaderWidget title="Relatórios" subtitle="Visão completa do seu negócio" />
        <Panel><WidgetEmptyState icon={BarChart3} title="Sem dados ainda" description="Quando você tiver projetos, leads e movimentações financeiras, seus relatórios aparecerão aqui automaticamente." /></Panel>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <HeaderWidget title="Relatórios" subtitle="Visão completa do seu negócio">
        <div className="flex gap-1">
          {(["6m", "12m", "ano"] as Periodo[]).map(p => (
            <ActionPill key={p} label={p === "ano" ? "Este ano" : `${p.replace("m", "")} meses`} active={periodo === p} onClick={() => setPeriodo(p)} />
          ))}
        </div>
      </HeaderWidget>

      {/* ═══ SECTION 1: Financial KPIs ═══ */}
      <SectionTitle title="Financeiro" />

      <motion.div {...springContentIn}>
        <Panel>
          <StatBar stats={[
            { label: "Receita total", value: cur(kpis.totalReceita), valueColor: "var(--success)" },
            { label: "Despesas", value: cur(kpis.totalDespesa), valueColor: "var(--error)" },
            { label: "Lucro líquido", value: cur(kpis.lucro), valueColor: kpis.lucro >= 0 ? "var(--info)" : "var(--error)" },
            { label: "A receber", value: cur(kpis.pendente), subtitle: kpis.vencido > 0 ? `${cur(kpis.vencido)} vencido` : undefined, valueColor: kpis.vencido > 0 ? "var(--warning)" : "var(--fg)" },
          ]} />
        </Panel>
      </motion.div>

      <Delay d={0.03} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPISmall icon={DollarSign} label="Mês atual" value={cur(comparison.curReceita)}
          badge={comparison.diff !== 0 ? `${comparison.diff > 0 ? "+" : ""}${comparison.diff}%` : undefined}
          badgePositive={comparison.diff >= 0} />
        <KPISmall icon={FolderOpen} label="Projetos ativos" value={String(kpis.projetosAtivos)} sub={`${kpis.projetosEntregues} entregues`} />
        <KPISmall icon={Target} label="Taxa conversão" value={`${kpis.taxaConversao}%`} sub={`${kpis.leadsGanhos}/${leads.length} leads`} />
        <KPISmall icon={Users} label="Ticket médio" value={cur(kpis.ticketMedio)} />
      </Delay>

      {/* Revenue vs Expense chart */}
      <Delay d={0.05}>
        <Panel>
          <PanelHeader title="Receitas vs Despesas" subtitle="Evolução mensal" />
          <div className="px-5 py-4">
            {monthlyData.some(d => d.receita > 0 || d.despesa > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="receita" name="Receita" fill={CHART_COLORS.receita} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill={CHART_COLORS.despesa} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </Panel>
      </Delay>

      {/* Profit trend */}
      {monthlyData.some(d => d.lucro !== 0) && (
        <Delay d={0.07}>
          <Panel>
            <PanelHeader title="Lucro líquido" subtitle="Tendência mensal" />
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS.lucro} stopOpacity={0.15} /><stop offset="100%" stopColor={CHART_COLORS.lucro} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="lucro" name="Lucro" stroke={CHART_COLORS.lucro} fill="url(#lg)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </Delay>
      )}

      {/* Expense by category + Payment methods */}
      <Delay d={0.09} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Despesas por categoria" subtitle="Para onde vai o dinheiro" />
          <div className="px-5 py-4">
            {expenseByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[140px] h-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {expenseByCategory.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[12px] text-[var(--fg-secondary)]">{d.name}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{cur(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-[12px] text-[var(--fg-muted)] text-center py-8">Sem despesas categorizadas</p>}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Formas de pagamento" subtitle="Receitas recebidas" />
          <div className="px-5 py-4">
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((pm, i) => {
                  const total = paymentMethods.reduce((s, p) => s + p.value, 0);
                  return (
                    <div key={pm.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[var(--fg-secondary)]">{pm.name}</span>
                        <span className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{cur(pm.value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct(pm.value, total)}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-[12px] text-[var(--fg-muted)] text-center py-8">Sem pagamentos registrados</p>}
          </div>
        </Panel>
      </Delay>

      {/* Project payment status */}
      {projectPayment.count > 0 && (
        <Delay d={0.10}>
          <Panel>
            <PanelHeader title="Pagamento dos projetos" subtitle={`${projectPayment.count} projetos com valor`} />
            <div className="px-5 py-4">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[var(--fg-secondary)]">{pct(projectPayment.totalPaid, projectPayment.totalValue)}% recebido</span>
                    <span className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{cur(projectPayment.totalPaid)} / {cur(projectPayment.totalValue)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--success)] transition-all duration-700" style={{ width: `${projectPayment.pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </Delay>
      )}

      {/* ═══ SECTION 2: Projects & Leads ═══ */}
      <SectionTitle title="Projetos & Leads" />

      <Delay d={0.11} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PiePanel title="Projetos por status" subtitle={`${projects.length} total`} data={projectsByStatus} offset={0} />
        <PiePanel title="Projetos por tipo" subtitle="Distribuição" data={projectsByType} offset={2} />
      </Delay>

      {leads.length > 0 && (
        <Delay d={0.13} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel>
            <PanelHeader title="Funil de leads" subtitle={`${leads.length} total — Pipeline: ${cur(kpis.pipelineValue)}`} />
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={leadsByStage} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => [String(v), "Leads"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {leadsByStage.map((e, i) => <Cell key={i} fill={e.stage === "perdido" ? "#B84233" : e.stage === "ganho" ? "#2D7A4F" : "#2C444D"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {leadSources.length > 1 && (
            <PiePanel title="Origem dos leads" subtitle="De onde vêm" data={leadSources} offset={3} />
          )}
        </Delay>
      )}

      {/* ═══ SECTION 3: Produção & Equipe ═══ */}
      {(workflows.length > 0 || team.length > 0) && (
        <>
          <SectionTitle title="Produção & Equipe" />

          {workflows.length > 0 && (
            <Delay d={0.15}>
              <Panel>
                <StatBar stats={[
                  { label: "Total workflows", value: String(prodStats.total) },
                  { label: "Concluídos", value: String(prodStats.concluido), subtitle: `${prodStats.taxaConclusao}% taxa`, valueColor: "var(--success)" },
                  { label: "Em andamento", value: String(prodStats.emAndamento), valueColor: "var(--info)" },
                  { label: "Atrasados", value: String(prodStats.atrasados), valueColor: prodStats.atrasados > 0 ? "var(--error)" : "var(--fg)" },
                ]} />
              </Panel>
            </Delay>
          )}

          <Delay d={0.17} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Workload by person */}
            {prodStats.workload.length > 0 && (
              <Panel>
                <PanelHeader title="Carga de trabalho" subtitle="Por responsável" />
                <div className="divide-y divide-[var(--border-subtle)]">
                  {prodStats.workload.map(w => (
                    <div key={w.name} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg-muted)] shrink-0">
                        {w.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[var(--fg)] truncate">{w.name}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{w.total} tasks — {w.done} concluídas</p>
                      </div>
                      {w.late > 0 && <StatusBadge label={`${w.late} atrasada${w.late > 1 ? "s" : ""}`} variant="error" />}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Team composition */}
            {team.length > 0 && (
              <Panel>
                <PanelHeader title="Equipe" subtitle={`${teamStats.active} ativos de ${teamStats.total}`} />
                <div className="px-5 py-4">
                  {teamStats.roles.length > 0 ? (
                    <div className="space-y-3">
                      {teamStats.roles.map((r, i) => (
                        <div key={r.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-[12px] text-[var(--fg-secondary)]">{r.name}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[12px] text-[var(--fg-muted)] text-center py-8">Sem membros</p>}
                </div>
              </Panel>
            )}
          </Delay>
        </>
      )}

      {/* ═══ SECTION 4: Entregas & Produtos ═══ */}
      {(orders.length > 0 || items.length > 0 || galleries.length > 0) && (
        <>
          <SectionTitle title="Entregas & Produtos" />

          <Delay d={0.19} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {orders.length > 0 && <KPISmall icon={ShoppingCart} label="Pedidos" value={String(orderStats.total)} sub={`${cur(orderStats.revenue)} receita`} />}
            {items.length > 0 && <KPISmall icon={Package} label="Itens contratados" value={String(itemStats.total)} sub={`${itemStats.deliveryRate}% entregues`} />}
            <KPISmall icon={Image} label="Galerias" value={String(kpis.totalGalerias)} sub={`${kpis.totalFotos} fotos`} />
            <KPISmall icon={Eye} label="Visualizações" value={String(kpis.totalViews)} sub={`${kpis.totalDownloads} downloads`} />
          </Delay>

          {/* Top galleries */}
          {galleryEngagement.topViewed.length > 0 && (
            <Delay d={0.21}>
              <Panel>
                <PanelHeader title="Galerias mais vistas" subtitle="Engajamento" />
                <div className="divide-y divide-[var(--border-subtle)]">
                  {galleryEngagement.topViewed.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[11px] font-semibold text-[var(--fg-muted)] w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[var(--fg)] truncate">{g.name}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{g.photo_count} fotos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{g.views} views</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{g.downloads} downloads</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </Delay>
          )}
        </>
      )}

      {/* ═══ SECTION 5: Contratos & Clientes ═══ */}
      {(contracts.length > 0 || clients.length > 0) && (
        <>
          <SectionTitle title="Contratos & Clientes" />

          <Delay d={0.23} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPISmall icon={FileText} label="Contratos assinados" value={String(kpis.contratosAssinados)} sub={`de ${contracts.length} total`} />
            <KPISmall icon={DollarSign} label="Valor contratado" value={cur(kpis.valorContratos)} />
            <KPISmall icon={UserCheck} label="Clientes ativos" value={String(clients.filter(c => c.status === "ativo").length)} sub={`${kpis.totalClientes} total`} />
            <KPISmall icon={Users} label="Ticket medio" value={cur(kpis.ticketMedio)} sub={`${kpis.totalProjetos} projetos`} />
          </Delay>
        </>
      )}
    </PageTransition>
  );
}

/* ══════════════════════════════════════ */
/* Reusable sub-components                */
/* ══════════════════════════════════════ */

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.08em] mt-6 mb-1 px-1">{title}</p>
  );
}

function Delay({ d, children, className }: { d: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: d }} className={className}>
      {children}
    </motion.div>
  );
}

function EmptyChart() {
  return <div className="h-[260px] flex items-center justify-center"><p className="text-[12px] text-[var(--fg-muted)]">Sem movimentações no período</p></div>;
}

function PiePanel({ title, subtitle, data, offset = 0 }: { title: string; subtitle: string; data: { name: string; value: number }[]; offset?: number }) {
  return (
    <Panel>
      <PanelHeader title={title} subtitle={subtitle} />
      <div className="px-5 py-4">
        {data.length > 0 ? (
          <div className="flex items-center gap-6">
            <div className="w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                  {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + offset) % PIE_COLORS.length]} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[(i + offset) % PIE_COLORS.length] }} />
                    <span className="text-[12px] text-[var(--fg-secondary)]">{d.name}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--fg)] tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-[12px] text-[var(--fg-muted)] text-center py-8">Sem dados</p>}
      </div>
    </Panel>
  );
}

function KPISmall({ icon: Icon, label, value, sub, badge, badgePositive }: {
  icon: typeof DollarSign; label: string; value: string; sub?: string;
  badge?: string; badgePositive?: boolean;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-[10px] bg-[var(--bg-subtle)] flex items-center justify-center">
          <Icon size={15} className="text-[var(--fg-secondary)]" />
        </div>
        {badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${badgePositive ? "bg-[var(--success-subtle)] text-[var(--success)]" : "bg-[var(--error-subtle)] text-[var(--error)]"}`}>
            {badgePositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {badge}
          </span>
        )}
      </div>
      <p className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.02em] tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-[var(--fg-muted)] mt-1.5">{label}</p>
      {sub && <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{sub}</p>}
    </Panel>
  );
}

