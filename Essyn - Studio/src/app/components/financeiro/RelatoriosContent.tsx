import { useState } from "react";
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Download,
  FileText,
  Send,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { KpiCard } from "../ui/kpi-card";
import { fmtCurrency } from "../ui/action-row-item";
import { AlertBanner } from "../ui/alert-banner";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import { AnimatePresence } from "motion/react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Relatórios — DRE simplificado + gráficos          */
/*  Ref: QuickBooks Reports + Xero Dashboard           */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";

const dreData = [
  { categoria: "Receita bruta", valor: 45800, tipo: "receita" },
  { categoria: "(-) Impostos", valor: -4580, tipo: "deducao" },
  { categoria: "Receita líquida", valor: 41220, tipo: "subtotal" },
  { categoria: "(-) Custos diretos", valor: -8400, tipo: "custo" },
  { categoria: "(-) Equipe (2ºs fotógrafos)", valor: -4200, tipo: "custo" },
  { categoria: "(-) Fornecedores", valor: -2100, tipo: "custo" },
  { categoria: "Margem bruta", valor: 26520, tipo: "subtotal" },
  { categoria: "(-) Despesas operacionais", valor: -3200, tipo: "despesa" },
  { categoria: "(-) Software/Assinaturas", valor: -890, tipo: "despesa" },
  { categoria: "Lucro operacional", valor: 22430, tipo: "resultado" },
];

const receitaPorTipo = [
  { tipo: "Casamento", valor: 18600, cor: "#1D1D1F" },
  { tipo: "Formatura", valor: 9500, cor: "#636366" },
  { tipo: "Corporativo", valor: 8400, cor: "#AEAEB2" },
  { tipo: "Ensaio/Família", valor: 5200, cor: "#C7C7CC" },
  { tipo: "Outros", valor: 4100, cor: "#D1D1D6" },
];

const margemPorProjeto = [
  { projeto: "Casamento Oliveira", receita: 11200, custo: 3800, margem: 66 },
  { projeto: "Formatura UFMG", receita: 9500, custo: 4100, margem: 57 },
  { projeto: "Corporativo TechBR", receita: 4200, custo: 800, margem: 81 },
  { projeto: "15 Anos Isabela", receita: 6600, custo: 2200, margem: 67 },
  { projeto: "Batizado Gabriel", receita: 2400, custo: 600, margem: 75 },
];

const inadimplenciaMensal = [
  { mes: "Set", valor: 2100 },
  { mes: "Out", valor: 3400 },
  { mes: "Nov", valor: 1800 },
  { mes: "Dez", valor: 2600 },
  { mes: "Jan", valor: 4500 },
  { mes: "Fev", valor: 8900 },
];

/* ── QuickActions (P05 Header pattern) ── */
const quickActionsRelatorios: QuickAction[] = [
  { label: "Exportar DRE", icon: <FileText className="w-3 h-3" /> },
  { label: "Exportar PDF completo", icon: <Download className="w-3 h-3" /> },
  { label: "Enviar ao contador", icon: <Send className="w-3 h-3" /> },
  { label: "Comparar períodos", icon: <BarChart3 className="w-3 h-3" /> },
];

function StateSwitcher({ active, onChange }: { active: ViewState; onChange: (v: ViewState) => void }) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ backgroundColor: dk.bgMuted }}>
      {(["ready","loading","empty","error"] as ViewState[]).map((s) => (
        <button key={s} onClick={() => onChange(s)} className="px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer" style={{ fontWeight: active === s ? 500 : 400, backgroundColor: active === s ? dk.bg : "transparent", color: active === s ? dk.textSecondary : dk.textMuted, boxShadow: active === s ? dk.shadowCard : "none" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#1D1D1F", color: "#FFFFFF", boxShadow: "0 4px 16px #000000" }}>
      <p className="text-[11px] text-[#8E8E93] mb-1" style={{ fontWeight: 400 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[12px] tabular-nums" style={{ fontWeight: 500 }}>
          {fmtCurrency(Math.abs(p.value))}
        </p>
      ))}
    </div>
  );
}

export function RelatoriosContent() {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [alertsDismissed, setAlertsDismissed] = useState<Set<string>>(new Set());

  const faturamento = 45800;
  const lucro = 22430;
  const margemMedia = Math.round((lucro / faturamento) * 100);
  const totalInadimplencia = inadimplenciaMensal[inadimplenciaMensal.length - 1].valor;
  const inadimplenciaAnterior = inadimplenciaMensal[inadimplenciaMensal.length - 2].valor;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header Financeiro ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] tracking-tight" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>Financeiro</h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Relatórios</span>
            <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textSubtle }}>DRE simplificado · Receita por tipo · Margem por projeto</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}>
            <Download className="w-3.5 h-3.5" />Exportar
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.border }} />
          <StateSwitcher active={viewState} onChange={setViewState} />
        </div>
      </div>

      {/* ═══ P05: QuickActionsBar ═══ */}
      <QuickActionsBar actions={quickActionsRelatorios} onAction={() => {}} />

      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="rounded-2xl p-4 h-20 animate-pulse" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }} />))}</div>
          <div className="grid grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => (<div key={i} className="rounded-2xl p-6 h-64 animate-pulse" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }} />))}</div>
          <div className="flex items-center justify-center py-4 gap-2"><LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} /><span className="text-[12px]" style={{ color: dk.textMuted }}>Carregando relatórios…</span></div>
        </div>
      )}
      {viewState === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.dangerBg }}><AlertCircle className="w-7 h-7 text-[#FF3B30]" /></div>
          <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Erro ao gerar relatórios</span>
          <button onClick={() => setViewState("ready")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}><RefreshCw className="w-3.5 h-3.5" />Tentar novamente</button>
        </div>
      )}
      {viewState === "empty" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}><PieChartIcon className="w-7 h-7" style={{ color: dk.textDisabled }} /></div>
          <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Sem dados para relatórios</span>
          <span className="text-[12px] text-center max-w-[300px]" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>Adicione lançamentos financeiros para visualizar os relatórios.</span>
        </div>
      )}

      {viewState === "ready" && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Faturamento" value={fmtCurrency(faturamento)} icon={<TrendingUp className="w-3.5 h-3.5 text-[#34C759]" />} trend={{ direction: "up", label: "+18%", positive: true }} sub="vs. Jan 2026" />
            <KpiCard label="Lucro operacional" value={fmtCurrency(lucro)} icon={<BarChart3 className="w-3.5 h-3.5 text-[#34C759]" />} sub="Fevereiro 2026" />
            <KpiCard label="Margem média" value={`${margemMedia}%`} icon={<PieChartIcon className="w-3.5 h-3.5 text-[#C7C7CC]" />} tooltip="Lucro operacional / Faturamento bruto" sub="todos os projetos" />
            <KpiCard label="Inadimplência" value={fmtCurrency(totalInadimplencia)} icon={<AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" />} trend={{ direction: "up", label: "+97%", positive: false }} sub="vs. Jan 2026" />
          </div>

          {/* P04: AlertBanners */}
          <AnimatePresence>
            {totalInadimplencia > inadimplenciaAnterior * 1.5 && !alertsDismissed.has("inadimplencia") && (
              <AlertBanner
                key="alert-inadimplencia"
                variant="danger"
                title={`Inadimplência cresceu ${Math.round(((totalInadimplencia - inadimplenciaAnterior) / inadimplenciaAnterior) * 100)}% em relação ao mês anterior`}
                desc={`De ${fmtCurrency(inadimplenciaAnterior)} para ${fmtCurrency(totalInadimplencia)}. Revise a estratégia de cobrança.`}
                ctaLabel="Ir para Cobrança"
                cta={() => setAlertsDismissed(prev => new Set(prev).add("inadimplencia"))}
                dismissible
                onDismiss={() => setAlertsDismissed(prev => new Set(prev).add("inadimplencia"))}
              />
            )}
            {margemMedia < 40 && !alertsDismissed.has("margem_baixa") && (
              <AlertBanner
                key="alert-margem-baixa"
                variant="warning"
                title={`Margem média de ${margemMedia}% está abaixo do ideal`}
                desc="Considere revisar custos diretos e precificação dos projetos."
                ctaLabel="Analisar custos"
                cta={() => setAlertsDismissed(prev => new Set(prev).add("margem_baixa"))}
                dismissible
                onDismiss={() => setAlertsDismissed(prev => new Set(prev).add("margem_baixa"))}
              />
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            {/* DRE */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <div className="px-5 py-3" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
                <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>DRE Simplificado — Fev 2026</span>
              </div>
              <div className="flex flex-col" style={{ borderColor: dk.hairline }}>
                {dreData.map((d, i) => (
                  <div key={d.categoria} className="flex items-center justify-between px-5 py-2.5" style={{ backgroundColor: d.tipo === "subtotal" || d.tipo === "resultado" ? dk.bgSub : "transparent", borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }}>
                    <span className="text-[12px]" style={{ fontWeight: d.tipo === "resultado" ? 600 : d.tipo === "subtotal" ? 500 : 400, color: d.tipo === "resultado" ? (dk.isDark ? "#AEAEB2" : "#48484A") : d.tipo === "subtotal" ? dk.textSecondary : dk.textTertiary }}>
                      {d.categoria}
                    </span>
                    <span className={`text-[13px] tabular-nums ${d.valor >= 0 ? "" : "text-[#FF3B30]"}`} style={{ fontWeight: d.tipo === "resultado" || d.tipo === "subtotal" ? 600 : 500, color: d.valor >= 0 ? dk.textSecondary : undefined }}>
                      {d.valor >= 0 ? fmtCurrency(d.valor) : `(${fmtCurrency(Math.abs(d.valor))})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receita por tipo */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <span className="text-[11px] uppercase tracking-[0.06em] block mb-4" style={{ fontWeight: 600, color: dk.textSubtle }}>Receita por tipo de evento</span>
              <div className="flex items-center gap-6">
                <PieChart width={160} height={160}>
                  <Pie key="pie-receita" data={receitaPorTipo} dataKey="valor" nameKey="tipo" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={2} stroke={dk.bg}>
                    {receitaPorTipo.map((entry) => (
                      <Cell key={entry.tipo} fill={entry.cor} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-2 flex-1">
                  {receitaPorTipo.map((r) => (
                    <div key={r.tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.cor }} />
                        <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textTertiary }}>{r.tipo}</span>
                      </div>
                      <span className="text-[12px] tabular-nums" style={{ fontWeight: 500, color: dk.textSecondary }}>{fmtCurrency(r.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Margem por projeto */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <div className="px-5 py-3" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
                <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Margem por projeto</span>
              </div>
              <div className="flex flex-col">
                {margemPorProjeto.map((p, i) => (
                  <div key={p.projeto} className="flex items-center gap-4 px-5 py-3" style={{ borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }}>
                    <span className="text-[12px] flex-1 truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>{p.projeto}</span>
                    <div className="w-24 h-1.5 rounded-full shrink-0 overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
                      <div className="h-full rounded-full bg-[#34C759]" style={{ width: `${p.margem}%`, opacity: 0.5 }} />
                    </div>
                    <span className="text-[12px] tabular-nums w-10 text-right" style={{ fontWeight: 600, color: dk.textTertiary }}>{p.margem}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inadimplência mensal */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <span className="text-[11px] uppercase tracking-[0.06em] block mb-4" style={{ fontWeight: 600, color: dk.textSubtle }}>Inadimplência mensal</span>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={inadimplenciaMensal}>
                  <CartesianGrid key="cg-inadim" strokeDasharray="3 3" stroke={dk.hairline} />
                  <XAxis key="x-inadim" dataKey="mes" tick={{ fontSize: 10, fill: dk.textSubtle }} axisLine={false} tickLine={false} />
                  <YAxis key="y-inadim" tick={{ fontSize: 10, fill: dk.textSubtle }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip key="tt-inadim" content={<CustomTooltip />} />
                  <Bar key="bar-inadim" dataKey="valor" fill="#FF3B30" fillOpacity={0.4} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}