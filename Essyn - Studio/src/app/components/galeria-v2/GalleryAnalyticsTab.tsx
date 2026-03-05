/**
 * GalleryAnalyticsTab — Gallery-level analytics dashboard
 *
 * Metrics: views, downloads, favorites, avg session time
 * Charts: daily views trend (AreaChart), photo engagement heatmap (BarChart),
 *         funnel (gallery → shop → checkout), device breakdown (PieChart)
 *
 * Apple Premium design, zero transparency rule.
 * Uses mock historical data enriched from gallery metadata.
 */
import { useMemo } from "react";
import {
  Eye, Download, Heart, Clock, ShoppingBag,
  Smartphone, Monitor, Tablet,
  TrendingUp, ArrowUpRight,
  MousePointer,
} from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";
import { WidgetCard } from "../ui/apple-kit";
import { springDefault } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

interface GalleryAnalyticsProps {
  galleryId: string;
  galleryName: string;
  photoCount: number;
  views: number;
  downloads: number;
  favorites: number;
}

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA GENERATORS                               */
/* ═══════════════════════════════════════════════════ */

function generateDailyViews(totalViews: number): { day: string; views: number; unique: number }[] {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom",
                "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const weights = [0.06, 0.05, 0.07, 0.08, 0.09, 0.12, 0.1,
                   0.07, 0.06, 0.08, 0.07, 0.05, 0.06, 0.04];
  return days.map((day, i) => {
    const views = Math.round(totalViews * weights[i]);
    return { day: `${day} ${i + 1}`, views, unique: Math.round(views * 0.65) };
  });
}

function generatePhotoEngagement(photoCount: number): { name: string; views: number; favs: number }[] {
  const photos = [];
  const topCount = Math.min(photoCount, 10);
  for (let i = 0; i < topCount; i++) {
    const views = Math.round(Math.random() * 200 + 50) * (topCount - i);
    photos.push({
      name: `Foto ${String(i + 1).padStart(3, "0")}`,
      views: Math.round(views / topCount),
      favs: Math.round(views / topCount * 0.15),
    });
  }
  return photos.sort((a, b) => b.views - a.views);
}

/* ── Device breakdown ── */
const DEVICE_DATA = [
  { name: "Mobile", value: 58 },
  { name: "Desktop", value: 32 },
  { name: "Tablet", value: 10 },
];
const DEVICE_COLORS = ["#007AFF", "#34C759", "#FF9500"];
const DEVICE_BG_COLORS = ["#E8F0FE", "#E8EFE5", "#FFF0DC"];
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Mobile: <Smartphone className="w-3 h-3" />,
  Desktop: <Monitor className="w-3 h-3" />,
  Tablet: <Tablet className="w-3 h-3" />,
};

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                            */
/* ═══════════════════════════════════════════════════ */

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* ═══════════════════════════════════════════════════ */
/*  CUSTOM TOOLTIP                                     */
/* ═══════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  const dk = useDk();
  if (!active || !payload?.length) return null;
  return (
    <div className="border rounded-2xl px-4 py-3" style={{ backgroundColor: dk.bg, borderColor: dk.border, boxShadow: dk.shadowCard, minWidth: 120 }}>
      <p className="text-[11px] mb-1" style={{ fontWeight: 500, color: dk.textTertiary }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[12px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
          {entry.value} {entry.dataKey === "views" ? "visualizações" : entry.dataKey === "unique" ? "únicos" : "favoritos"}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                          */
/* ═══════════════════════════════════════════════════ */

export function GalleryAnalyticsTab({
  galleryId,
  galleryName,
  photoCount,
  views,
  downloads,
  favorites,
}: GalleryAnalyticsProps) {
  const dk = useDk();
  const dailyViews = useMemo(() => generateDailyViews(views), [views]);
  const photoEngagement = useMemo(() => generatePhotoEngagement(photoCount), [photoCount]);

  /* Mock metrics */
  const avgSessionTime = "2m 34s";
  const bounceRate = 18;
  const shopVisits = Math.round(views * 0.22);
  const checkouts = Math.round(shopVisits * 0.35);
  const conversionRate = views > 0 ? ((checkouts / views) * 100).toFixed(1) : "0";

  /* Funnel data */
  const funnel = [
    { stage: "Galeria", count: views, color: "#007AFF", bg: "#E8F0FE", pct: 100 },
    { stage: "Loja", count: shopVisits, color: "#FF9500", bg: "#FFF0DC", pct: views > 0 ? Math.round((shopVisits / views) * 100) : 0 },
    { stage: "Checkout", count: checkouts, color: "#34C759", bg: "#E8EFE5", pct: views > 0 ? Math.round((checkouts / views) * 100) : 0 },
  ];

  /* KPIs */
  const kpis = [
    { label: "Visualizações", value: fmtNum(views), icon: <Eye className="w-3.5 h-3.5" />, color: "#007AFF", bg: "#E8F0FE", change: 12.4 },
    { label: "Downloads", value: fmtNum(downloads), icon: <Download className="w-3.5 h-3.5" />, color: "#34C759", bg: "#E8EFE5", change: 8.7 },
    { label: "Favoritos", value: fmtNum(favorites), icon: <Heart className="w-3.5 h-3.5" />, color: "#FF3B30", bg: "#FDEDEF", change: 15.2 },
    { label: "Tempo Médio", value: avgSessionTime, icon: <Clock className="w-3.5 h-3.5" />, color: "#5856D6", bg: "#F0F0FF", change: 3.1 },
    { label: "Visitas Loja", value: fmtNum(shopVisits), icon: <ShoppingBag className="w-3.5 h-3.5" />, color: "#FF9500", bg: "#FFF0DC", change: 22.6 },
    { label: "Conversão", value: `${conversionRate}%`, icon: <TrendingUp className="w-3.5 h-3.5" />, color: "#AF52DE", bg: "#F6EDFC", change: 5.8 },
  ];

  return (
    <>
      {/* ── KPI Grid ── */}
      <WidgetCard title="Métricas da Galeria" delay={0.02}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0">
          {kpis.map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springDefault, delay: idx * 0.04 }}
              className="flex flex-col gap-2 px-4 py-3"
              style={{ borderLeft: idx > 0 ? `1px solid ${dk.hairline}` : "none" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: kpi.bg, color: kpi.color }}
                >
                  {kpi.icon}
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-[#34C759]" style={{ fontWeight: 600 }}>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  {kpi.change}%
                </div>
              </div>
              <div>
                <p className="text-[16px] tabular-nums" style={{ fontWeight: 700, color: dk.textPrimary }}>{kpi.value}</p>
                <p className="text-[10px] mt-0.5" style={{ fontWeight: 500, color: dk.textTertiary }}>{kpi.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </WidgetCard>

      {/* ── Row: Views Trend + Devices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily views — 2/3 */}
        <div className="lg:col-span-2">
          <WidgetCard title="Visualizações (14 dias)" delay={0.06}>
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                  <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
                  <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Únicos</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyViews} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid key="dv-grid" strokeDasharray="3 3" stroke={dk.hairline} vertical={false} />
                  <XAxis key="dv-xaxis" dataKey="day" axisLine={false} tickLine={false} tick={{ fill: dk.textMuted, fontSize: 9, fontWeight: 500 }} />
                  <YAxis key="dv-yaxis" axisLine={false} tickLine={false} tick={{ fill: dk.textMuted, fontSize: 9, fontWeight: 500 }} width={30} />
                  <ReTooltip key="dv-tooltip" content={<ChartTooltip />} />
                  <Area key="dv-views" type="monotone" dataKey="views" stroke="#007AFF" strokeWidth={2} fill={dk.isDark ? "#1A2030" : "#E8F0FE"} dot={false} activeDot={{ r: 4, fill: "#007AFF", stroke: dk.bg, strokeWidth: 2 }} />
                  <Area key="dv-unique" type="monotone" dataKey="unique" stroke="#34C759" strokeWidth={1.5} fill={dk.isDark ? "#1A2C1E" : "#E8EFE5"} dot={false} activeDot={{ r: 3, fill: "#34C759", stroke: dk.bg, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetCard>
        </div>

        {/* Device breakdown — 1/3 */}
        <div className="lg:col-span-1">
          <WidgetCard title="Dispositivos" delay={0.08}>
            <div className="px-5 pt-2 pb-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    key="pie-devices"
                    data={DEVICE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    stroke={dk.bg}
                    strokeWidth={3}
                  >
                    {DEVICE_DATA.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 w-full mt-2">
                {DEVICE_DATA.map((device, i) => (
                  <div key={device.name} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: DEVICE_BG_COLORS[i], color: DEVICE_COLORS[i] }}
                    >
                      {DEVICE_ICONS[device.name]}
                    </div>
                    <span className="flex-1 text-[11px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                      {device.name}
                    </span>
                    <span className="text-[12px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                      {device.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* ── Row: Photo Engagement + Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Photos */}
        <WidgetCard title="Fotos Mais Vistas" count={photoEngagement.length} delay={0.1}>
          <div className="px-5 pt-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={photoEngagement.slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid key="photo-grid" strokeDasharray="3 3" stroke={dk.hairline} horizontal={false} />
                <XAxis key="photo-xaxis" type="number" axisLine={false} tickLine={false} tick={{ fill: dk.textMuted, fontSize: 9, fontWeight: 500 }} />
                <YAxis key="photo-yaxis" type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: dk.textSecondary, fontSize: 10, fontWeight: 500 }} width={60} />
                <ReTooltip
                  key="photo-tooltip"
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="border rounded-2xl px-3 py-2" style={{ backgroundColor: dk.bg, borderColor: dk.border, boxShadow: dk.shadowCard }}>
                        <p className="text-[11px]" style={{ fontWeight: 600, color: dk.textPrimary }}>{d.name}</p>
                        <p className="text-[10px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                          {d.views} views · {d.favs} favs
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar key="photo-bar" dataKey="views" fill="#007AFF" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetCard>

        {/* Conversion Funnel */}
        <WidgetCard title="Funil de Conversão" delay={0.12}>
          <div className="flex flex-col px-5 pt-3 pb-4 gap-3">
            {funnel.map((step, idx) => {
              const widthPct = Math.max(step.pct, 10);
              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: step.bg, color: step.color }}
                      >
                        <MousePointer className="w-3 h-3" />
                      </div>
                      <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                        {step.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                        {fmtNum(step.count)}
                      </span>
                      <span className="text-[10px] tabular-nums" style={{ fontWeight: 500, color: dk.textTertiary }}>
                        {step.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: step.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ ...springDefault, delay: 0.15 + idx * 0.08 }}
                    />
                  </div>
                  {idx < funnel.length - 1 && (
                    <div className="flex items-center justify-center my-1">
                      <div className="w-px h-3" style={{ backgroundColor: dk.border }} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Funnel summary */}
            <div className="mt-2 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: dk.bgActive }}>
              <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#34C759]" />
              </div>
              <div>
                <p className="text-[12px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
                  Taxa de conversão: {conversionRate}%
                </p>
                <p className="text-[10px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                  {checkouts} checkouts de {fmtNum(views)} visualizações
                </p>
              </div>
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* ── Engagement Summary ── */}
      <WidgetCard title="Resumo de Engajamento" delay={0.14}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: "Taxa de Rejeição", value: `${bounceRate}%`, desc: "visitantes que saíram rápido", color: "#FF3B30" },
            { label: "Fotos por Sessão", value: Math.round(photoCount * 0.35).toString(), desc: "fotos visualizadas em média", color: "#007AFF" },
            { label: "Downloads / Visita", value: (downloads / Math.max(views, 1) * 100).toFixed(1) + "%", desc: "taxa de download", color: "#34C759" },
            { label: "Compartilhamentos", value: Math.round(views * 0.04).toString(), desc: "links compartilhados", color: "#AF52DE" },
          ].map((stat, idx) => (
            <div key={stat.label} className="px-5 py-3" style={{ borderLeft: idx > 0 ? `1px solid ${dk.hairline}` : "none" }}>
              <p className="text-[16px] tabular-nums" style={{ fontWeight: 700, color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ fontWeight: 500, color: dk.textPrimary }}>{stat.label}</p>
              <p className="text-[9px]" style={{ fontWeight: 400, color: dk.textMuted }}>{stat.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    </>
  );
}