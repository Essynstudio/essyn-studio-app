/**
 * RelatoriosPage — Analytics & Reports
 *
 * Full analytics dashboard for event photographers:
 *  - Hero KPI strip (6 metrics)
 *  - Revenue over time (AreaChart)
 *  - Lead source breakdown (DonutChart)
 *  - Top products sold (horizontal BarChart)
 *  - Sales funnel (leads by stage)
 *  - Top clients by revenue
 *  - Catalog performance table
 *
 * Apple Premium design, zero transparency rule.
 * Dark mode via useDk(). Reads live data from AppStore.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { WidgetCard } from "../components/ui/apple-kit";
import { useShellConfig } from "../components/ui/ShellContext";
import { useAppStore } from "../lib/appStore";
import { springDefault } from "../lib/motion-tokens";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";
import { useDk } from "../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  CONSTANTS & TYPES                                  */
/* ═══════════════════════════════════════════════════ */

type Period = "7d" | "30d" | "90d" | "12m";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
};

/* ── Mock historical revenue data ── */
const MONTHLY_REVENUE = [
  { month: "Mar", receita: 4200, pedidos: 6 },
  { month: "Abr", receita: 5800, pedidos: 9 },
  { month: "Mai", receita: 7200, pedidos: 11 },
  { month: "Jun", receita: 6100, pedidos: 8 },
  { month: "Jul", receita: 9400, pedidos: 14 },
  { month: "Ago", receita: 11200, pedidos: 18 },
  { month: "Set", receita: 8900, pedidos: 13 },
  { month: "Out", receita: 12500, pedidos: 20 },
  { month: "Nov", receita: 15800, pedidos: 24 },
  { month: "Dez", receita: 18200, pedidos: 28 },
  { month: "Jan", receita: 13400, pedidos: 19 },
  { month: "Fev", receita: 10800, pedidos: 16 },
];

const WEEKLY_REVENUE = [
  { month: "Seg", receita: 1200, pedidos: 2 },
  { month: "Ter", receita: 800, pedidos: 1 },
  { month: "Qua", receita: 1500, pedidos: 3 },
  { month: "Qui", receita: 2200, pedidos: 4 },
  { month: "Sex", receita: 1800, pedidos: 2 },
  { month: "Sáb", receita: 3200, pedidos: 5 },
  { month: "Dom", receita: 900, pedidos: 1 },
];

/* ── Lead source data ── */
const LEAD_SOURCE_COLORS = ["#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF3B30", "#5856D6"];

/* ── Stage config for funnel ── */
const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; bgDark: string }> = {
  novo:        { label: "Novos",       color: "#007AFF", bg: "#E8F0FE", bgDark: "#1A2030" },
  contato:     { label: "Contato",     color: "#5856D6", bg: "#F0F0FF", bgDark: "#1E1A30" },
  reuniao:     { label: "Reunião",     color: "#FF9500", bg: "#FFF0DC", bgDark: "#2C2410" },
  proposta:    { label: "Proposta",    color: "#AF52DE", bg: "#F6EDFC", bgDark: "#261A30" },
  negociacao:  { label: "Negociação",  color: "#FF3B30", bg: "#FDEDEF", bgDark: "#2C1A1A" },
  ganho:       { label: "Ganhos",      color: "#34C759", bg: "#E8EFE5", bgDark: "#1A2C1E" },
  perdido:     { label: "Perdidos",    color: "#8E8E93", bg: "#F2F2F7", bgDark: "#2C2C2E" },
};

/* ── KPI icon backgrounds (light/dark) ── */
const KPI_ICON_STYLES: Record<string, { bg: string; bgDark: string; color: string }> = {
  receita:   { bg: "#E8EFE5",  bgDark: "#1A2C1E", color: "#34C759" },
  pendente:  { bg: "#FFF0DC",  bgDark: "#2C2410", color: "#FF9500" },
  ticket:    { bg: "#F0F0FF",  bgDark: "#1E1A30", color: "#5856D6" },
  pedidos:   { bg: "#E8F0FE",  bgDark: "#1A2030", color: "#007AFF" },
  conversao: { bg: "#F6EDFC",  bgDark: "#261A30", color: "#AF52DE" },
  galerias:  { bg: "#F2F8F4",  bgDark: "#1A2C1E", color: "#34C759" },
};

/* ── Rank badge styles ── */
const RANK_STYLES = [
  { bg: "#FFF0DC", bgDark: "#2C2410", color: "#FF9500" },      // 1st — gold
  { bg: "#F2F2F7", bgDark: "#2C2C2E", color: "#636366" },      // 2nd — silver
  { bg: "#FBF5F4", bgDark: "#2C1A1A", color: "#AEAEB2" },      // 3rd — bronze
  { bg: "#F2F2F7", bgDark: "#2C2C2E", color: "#8E8E93" },      // fallback
];

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                            */
/* ═══════════════════════════════════════════════════ */

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

/* ═══════════════════════════════════════════════════ */
/*  CUSTOM TOOLTIP (dark-mode aware)                   */
/* ═══════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  const dk = useDk();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="border rounded-2xl px-4 py-3"
      style={{
        backgroundColor: dk.bg,
        borderColor: dk.border,
        boxShadow: dk.shadowCard,
        minWidth: 140,
      }}
    >
      <p className="text-[11px] mb-1" style={{ fontWeight: 500, color: dk.textTertiary }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
          {entry.dataKey === "receita" ? fmtCurrency(entry.value) : `${entry.value} pedidos`}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PAGE COMPONENT                                     */
/* ═══════════════════════════════════════════════════ */

export function RelatoriosPage() {
  const navigate = useNavigate();
  const dk = useDk();
  const { orders, leads, galleries, catalog } = useAppStore();
  const [period, setPeriod] = useState<Period>("12m");

  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Relatórios" },
  });

  /* ── Computed analytics ── */
  const analytics = useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== "cancelado");
    const totalRevenue = nonCancelled.reduce((s, o) => s + o.total, 0);
    const pendingRevenue = orders
      .filter((o) => o.status === "pendente")
      .reduce((s, o) => s + o.total, 0);
    const avgTicket = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;
    const activeGalleries = galleries.filter((g) => g.status === "publicada").length;
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.stage === "ganho").length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    /* Lead source breakdown */
    const sourceMap: Record<string, number> = {};
    for (const l of leads) {
      const src = l.origem || "outros";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const sourceLabels: Record<string, string> = {
      instagram: "Instagram",
      indicacao: "Indicação",
      site: "Website",
      anuncio: "Anúncio",
      outros: "Outros",
    };
    const leadSources = Object.entries(sourceMap)
      .map(([key, count]) => ({ name: sourceLabels[key] || key, value: count }))
      .sort((a, b) => b.value - a.value);

    /* Product breakdown from orders */
    const productMap: Record<string, { count: number; revenue: number }> = {};
    for (const order of nonCancelled) {
      for (const item of order.items) {
        const name = item.product;
        if (!productMap[name]) productMap[name] = { count: 0, revenue: 0 };
        productMap[name].count += item.qty;
        productMap[name].revenue += item.price * item.qty;
      }
    }
    const topProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    /* Stage funnel */
    const stageMap: Record<string, number> = {};
    for (const l of leads) {
      stageMap[l.stage] = (stageMap[l.stage] || 0) + 1;
    }
    const funnel = ["novo", "contato", "reuniao", "proposta", "negociacao", "ganho", "perdido"]
      .map((stage) => ({
        stage,
        count: stageMap[stage] || 0,
        ...STAGE_CONFIG[stage],
      }));

    /* Top clients */
    const clientMap: Record<string, { pedidos: number; total: number }> = {};
    for (const order of nonCancelled) {
      if (!clientMap[order.cliente]) clientMap[order.cliente] = { pedidos: 0, total: 0 };
      clientMap[order.cliente].pedidos += 1;
      clientMap[order.cliente].total += order.total;
    }
    const topClients = Object.entries(clientMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    /* Revenue chart data */
    const revenueData = period === "7d" ? WEEKLY_REVENUE : MONTHLY_REVENUE;

    /* Previous period comparison (mock) */
    const prevRevenue = totalRevenue * 0.82;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const prevOrders = Math.floor(nonCancelled.length * 0.75);
    const ordersGrowth = prevOrders > 0 ? ((nonCancelled.length - prevOrders) / prevOrders) * 100 : 0;

    return {
      totalRevenue,
      pendingRevenue,
      avgTicket,
      totalOrders: nonCancelled.length,
      activeGalleries,
      conversionRate,
      revenueGrowth,
      ordersGrowth,
      leadSources,
      topProducts,
      funnel,
      topClients,
      revenueData,
      totalLeads,
    };
  }, [orders, leads, galleries, period]);

  /* ═══ KPI CARDS DATA ═══ */
  const kpis = [
    {
      id: "receita",
      label: "Receita Total",
      value: fmtCurrency(analytics.totalRevenue),
      change: analytics.revenueGrowth,
      icon: <DollarSign className="w-4 h-4" />,
      style: KPI_ICON_STYLES.receita,
    },
    {
      id: "pendente",
      label: "Receita Pendente",
      value: fmtCurrency(analytics.pendingRevenue),
      change: null as number | null,
      icon: <TrendingUp className="w-4 h-4" />,
      style: KPI_ICON_STYLES.pendente,
    },
    {
      id: "ticket",
      label: "Ticket Médio",
      value: fmtCurrency(analytics.avgTicket),
      change: 12.3,
      icon: <BarChart3 className="w-4 h-4" />,
      style: KPI_ICON_STYLES.ticket,
    },
    {
      id: "pedidos",
      label: "Total Pedidos",
      value: analytics.totalOrders.toString(),
      change: analytics.ordersGrowth,
      icon: <ShoppingBag className="w-4 h-4" />,
      style: KPI_ICON_STYLES.pedidos,
    },
    {
      id: "conversao",
      label: "Taxa Conversão",
      value: fmtPercent(analytics.conversionRate),
      change: 5.2,
      icon: <Users className="w-4 h-4" />,
      style: KPI_ICON_STYLES.conversao,
    },
    {
      id: "galerias",
      label: "Galerias Ativas",
      value: analytics.activeGalleries.toString(),
      change: null as number | null,
      icon: <Image className="w-4 h-4" />,
      style: KPI_ICON_STYLES.galerias,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Onboarding ── */}
      <OnboardingBanner
        id="relatorios-intro"
        title="Relatórios e Analytics"
        message="Acompanhe métricas de receita, conversão de leads, produtos mais vendidos e performance do seu studio em tempo real."
      />

      {/* ── Period Selector ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: dk.textTertiary }} />
          <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
            Período
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ backgroundColor: dk.bgMuted }}
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer"
              style={{
                fontWeight: period === p ? 600 : 500,
                backgroundColor: period === p ? dk.bg : "transparent",
                color: period === p ? dk.textPrimary : dk.textTertiary,
                boxShadow: period === p ? dk.shadowCard : "none",
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: idx * 0.04 }}
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{
              backgroundColor: dk.bg,
              borderColor: dk.hairline,
              boxShadow: dk.shadowCard,
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: dk.isDark ? kpi.style.bgDark : kpi.style.bg,
                  color: kpi.style.color,
                }}
              >
                {kpi.icon}
              </div>
              {kpi.change !== null && (
                <div
                  className="flex items-center gap-0.5 text-[11px]"
                  style={{
                    fontWeight: 600,
                    color: kpi.change >= 0 ? "#34C759" : "#FF3B30",
                  }}
                >
                  {kpi.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(kpi.change).toFixed(1)}%
                </div>
              )}
            </div>
            <div>
              <p className="text-[18px] tabular-nums" style={{ fontWeight: 700, color: dk.textPrimary }}>
                {kpi.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ fontWeight: 500, color: dk.textTertiary }}>
                {kpi.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Row: Revenue Chart + Lead Sources ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue AreaChart — 2/3 width */}
        <div className="lg:col-span-2">
          <WidgetCard title="Receita ao Longo do Tempo" delay={0.08}>
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                  <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
                  <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Pedidos</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid key="rev-grid" strokeDasharray="3 3" stroke={dk.hairline} vertical={false} />
                  <XAxis
                    key="rev-xaxis"
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: dk.textTertiary, fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    key="rev-yaxis"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: dk.textTertiary, fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <ReTooltip key="rev-tooltip" content={<ChartTooltip />} />
                  <Area
                    key="rev-area"
                    type="monotone"
                    dataKey="receita"
                    stroke="#007AFF"
                    strokeWidth={2}
                    fill={dk.isDark ? "#1A2030" : "#E8F0FE"}
                    dot={false}
                    activeDot={{ r: 5, fill: "#007AFF", stroke: dk.bg, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetCard>
        </div>

        {/* Lead Sources Donut — 1/3 width */}
        <div className="lg:col-span-1">
          <WidgetCard title="Origem dos Leads" count={analytics.totalLeads} delay={0.12}>
            <div className="px-5 pt-2 pb-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    key="pie-sources"
                    data={analytics.leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    dataKey="value"
                    stroke={dk.bg}
                    strokeWidth={3}
                  >
                    {analytics.leadSources.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={LEAD_SOURCE_COLORS[i % LEAD_SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {analytics.leadSources.map((src, i) => (
                  <div key={src.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LEAD_SOURCE_COLORS[i % LEAD_SOURCE_COLORS.length] }}
                    />
                    <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                      {src.name}
                    </span>
                    <span className="text-[11px] tabular-nums" style={{ fontWeight: 500, color: dk.textMuted }}>
                      {src.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* ── Row: Top Products + Sales Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <WidgetCard title="Top Produtos" count={analytics.topProducts.length} delay={0.14}>
          <div className="px-5 pt-2 pb-4">
            {analytics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid key="prod-grid" strokeDasharray="3 3" stroke={dk.hairline} horizontal={false} />
                  <XAxis
                    key="prod-xaxis"
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: dk.textTertiary, fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(v: number) => fmtCurrency(v)}
                  />
                  <YAxis
                    key="prod-yaxis"
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: dk.textSecondary, fontSize: 11, fontWeight: 500 }}
                    width={130}
                  />
                  <ReTooltip
                    key="prod-tooltip"
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div
                          className="border rounded-2xl px-4 py-3"
                          style={{
                            backgroundColor: dk.bg,
                            borderColor: dk.border,
                            boxShadow: dk.shadowCard,
                          }}
                        >
                          <p className="text-[12px]" style={{ fontWeight: 600, color: dk.textPrimary }}>{d.name}</p>
                          <p className="text-[11px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                            {fmtCurrency(d.revenue)} · {d.count} un.
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar key="prod-bar" dataKey="revenue" fill="#007AFF" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textSubtle }}>
                  Sem dados de produtos vendidos
                </p>
              </div>
            )}
          </div>
        </WidgetCard>

        {/* Sales Funnel */}
        <WidgetCard title="Funil de Vendas" count={analytics.totalLeads} delay={0.16}>
          <div className="flex flex-col px-5 pt-2 pb-2">
            {analytics.funnel.map((stage, idx) => {
              const maxCount = Math.max(...analytics.funnel.map((f) => f.count), 1);
              const widthPct = Math.max((stage.count / maxCount) * 100, 8);
              return (
                <div key={stage.stage}>
                  {idx > 0 && <div className="h-px" style={{ backgroundColor: dk.hairline }} />}
                  <div className="flex items-center gap-3 py-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: dk.isDark ? stage.bgDark : stage.bg,
                        color: stage.color,
                      }}
                    >
                      <span className="text-[11px] tabular-nums" style={{ fontWeight: 700 }}>
                        {stage.count}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                          {stage.label}
                        </span>
                        <span className="text-[11px] tabular-nums" style={{ fontWeight: 500, color: dk.textTertiary }}>
                          {analytics.totalLeads > 0
                            ? `${((stage.count / analytics.totalLeads) * 100).toFixed(0)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: stage.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ ...springDefault, delay: 0.1 + idx * 0.05 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WidgetCard>
      </div>

      {/* ── Top Clients Table ── */}
      <WidgetCard
        title="Top Clientes"
        count={analytics.topClients.length}
        action="Ver CRM"
        onAction={() => navigate("/crm")}
        delay={0.18}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-2 border-b"
            style={{ borderColor: dk.hairline }}
          >
            <span className="flex-1 text-[10px]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Cliente
            </span>
            <span className="w-20 text-[10px] text-center" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Pedidos
            </span>
            <span className="w-24 text-[10px] text-right" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Receita
            </span>
          </div>

          {/* Rows */}
          {analytics.topClients.map((client, idx) => {
            const rank = RANK_STYLES[Math.min(idx, RANK_STYLES.length - 1)];
            return (
              <div key={client.name}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Rank */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: dk.isDark ? rank.bgDark : rank.bg,
                      color: rank.color,
                    }}
                  >
                    <span className="text-[10px] tabular-nums" style={{ fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
                      {client.name}
                    </p>
                  </div>

                  {/* Orders count */}
                  <div className="w-20 text-center">
                    <span className="text-[12px] tabular-nums" style={{ fontWeight: 500, color: dk.textSecondary }}>
                      {client.pedidos}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="w-24 text-right">
                    <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                      {fmtCurrency(client.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {analytics.topClients.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textSubtle }}>
                Sem dados de clientes
              </p>
            </div>
          )}
        </div>
      </WidgetCard>

      {/* ── Catalog Performance ── */}
      <WidgetCard title="Performance do Catálogo" count={catalog.filter((c) => c.enabled).length} delay={0.2}>
        <div className="flex flex-col">
          <div
            className="flex items-center gap-3 px-5 py-2 border-b"
            style={{ borderColor: dk.hairline }}
          >
            <span className="flex-1 text-[10px]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Produto
            </span>
            <span className="w-16 text-[10px] text-center" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Estado
            </span>
            <span className="w-20 text-[10px] text-center" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Categoria
            </span>
            <span className="w-20 text-[10px] text-right" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: dk.textMuted }}>
              Preço Base
            </span>
          </div>

          {catalog.map((prod, idx) => {
            /* Find how many were sold in orders */
            const soldCount = orders
              .filter((o) => o.status !== "cancelado")
              .flatMap((o) => o.items)
              .filter((item) => item.product.toLowerCase().includes(prod.name.toLowerCase().split(" ")[0]))
              .reduce((s, item) => s + item.qty, 0);

            return (
              <div key={prod.id}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] truncate"
                      style={{
                        fontWeight: 500,
                        color: prod.enabled ? dk.textPrimary : dk.textSubtle,
                      }}
                    >
                      {prod.name}
                    </p>
                    <p className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      {soldCount > 0 ? `${soldCount} vendido${soldCount !== 1 ? "s" : ""}` : "Sem vendas"}
                    </p>
                  </div>
                  <div className="w-16 flex justify-center">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px]"
                      style={{
                        fontWeight: 600,
                        backgroundColor: prod.enabled
                          ? (dk.isDark ? "#1A2C1E" : "#E8EFE5")
                          : dk.bgMuted,
                        color: prod.enabled ? "#34C759" : dk.textTertiary,
                      }}
                    >
                      {prod.enabled ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="w-20 text-center">
                    <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
                      {prod.category}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                      {fmtCurrency(prod.price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </div>
  );
}