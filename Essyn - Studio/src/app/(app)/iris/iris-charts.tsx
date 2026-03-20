"use client";

import { motion } from "motion/react";

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export function MiniBarChart({ data, title, format = "currency" }: { data: BarChartData[]; title?: string; format?: "currency" | "number" | "percent" }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  function formatValue(v: number): string {
    if (format === "currency") return `R$ ${v.toLocaleString("pt-BR")}`;
    if (format === "percent") return `${v}%`;
    return v.toLocaleString("pt-BR");
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 mt-2 mb-1 max-w-sm">
      {title && (
        <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">{title}</p>
      )}
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.label} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--fg-secondary)]">{item.label}</span>
              <span className="text-[11px] font-semibold text-[var(--fg)] tabular-nums">{formatValue(item.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color || "var(--info)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniStatCards({ stats }: { stats: { label: string; value: string; color?: string; subtext?: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 mb-1">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-center">
          <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">{stat.label}</p>
          <p className="text-[16px] font-semibold mt-0.5 tabular-nums" style={{ color: stat.color || "var(--fg)" }}>{stat.value}</p>
          {stat.subtext && <p className="text-[9px] text-[var(--fg-muted)] mt-0.5">{stat.subtext}</p>}
        </div>
      ))}
    </div>
  );
}

// Parse Iris response to detect chart-worthy data
export interface ChartBlock {
  type: "bar" | "stats";
  data: any;
  title?: string;
  format?: "currency" | "number" | "percent";
}

export function parseChartData(content: string): ChartBlock | null {
  // Pattern: financial summary with R$ values
  const financialPattern = /(?:recebido|recebeu)[:\s]*\*?\*?R\$\s*([\d.,]+)\*?\*?[\s\S]*?(?:pendente|a receber)[:\s]*\*?\*?R\$\s*([\d.,]+)\*?\*?[\s\S]*?(?:vencido|atrasado)[:\s]*\*?\*?R\$\s*([\d.,]+)\*?\*?/i;
  const match = content.match(financialPattern);

  if (match) {
    const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
    return {
      type: "bar",
      title: "Resumo financeiro",
      format: "currency",
      data: [
        { label: "Recebido", value: parse(match[1]), color: "#2D7A4F" },
        { label: "Pendente", value: parse(match[2]), color: "#C87A20" },
        { label: "Vencido", value: parse(match[3]), color: "#B84233" },
      ],
    };
  }

  // Pattern: multiple project statuses with numbers
  const projectPattern = /(\d+)\s*(?:projetos?\s+)?(?:ativo|confirmado)[\s\S]*?(\d+)\s*(?:em\s+)?(?:produ[çc][ãa]o|edi[çc][ãa]o)[\s\S]*?(\d+)\s*(?:entregue|conclu[ií]do)/i;
  const projMatch = content.match(projectPattern);

  if (projMatch) {
    return {
      type: "bar",
      title: "Status dos projetos",
      format: "number",
      data: [
        { label: "Ativos", value: Number(projMatch[1]), color: "#2C444D" },
        { label: "Em produção", value: Number(projMatch[2]), color: "#C87A20" },
        { label: "Entregues", value: Number(projMatch[3]), color: "#2D7A4F" },
      ],
    };
  }

  // Pattern: leads pipeline with stage counts
  const leadsPattern = /(\d+)\s*novo[\s\S]*?(\d+)\s*(?:contato|reuni[ãa]o)[\s\S]*?(\d+)\s*(?:proposta|negocia)/i;
  const leadsMatch = content.match(leadsPattern);

  if (leadsMatch) {
    return {
      type: "bar",
      title: "Pipeline de leads",
      format: "number",
      data: [
        { label: "Novos", value: Number(leadsMatch[1]), color: "#7A8A8F" },
        { label: "Em contato", value: Number(leadsMatch[2]), color: "#C87A20" },
        { label: "Proposta", value: Number(leadsMatch[3]), color: "#2D7A4F" },
      ],
    };
  }

  return null;
}
