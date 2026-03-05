import {
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ArrowRightLeft,
  Send,
  FileText,
  PieChart,
  Settings2,
} from "lucide-react";
import { SubnavSegmented, type SubnavTab } from "../ui/subnav-segmented";

/* ═══════════════════════════════════════════════════ */
/*  Financeiro Subnav — Segmented Control             */
/*  Wraps generic SubnavSegmented with 9 finance tabs  */
/* ═══════════════════════════════════════════════════ */

export type FinanceiroTab =
  | "hoje"
  | "receber"
  | "pagar"
  | "caixa"
  | "conciliacao"
  | "cobranca"
  | "fiscal"
  | "relatorios"
  | "config";

const tabs: SubnavTab[] = [
  { id: "hoje",        label: "Hoje",        icon: <Zap className="w-3.5 h-3.5" /> },
  { id: "receber",     label: "Receber",     icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  { id: "pagar",       label: "Pagar",       icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
  { id: "caixa",       label: "Caixa",       icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "conciliacao", label: "Conciliação", icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { id: "cobranca",    label: "Cobrança",    icon: <Send className="w-3.5 h-3.5" /> },
  { id: "fiscal",      label: "Fiscal",      icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "relatorios",  label: "Relatórios",  icon: <PieChart className="w-3.5 h-3.5" /> },
  { id: "config",      label: "Config",      icon: <Settings2 className="w-3.5 h-3.5" /> },
];

export function FinanceiroSubnav({
  active,
  onChange,
  badges,
}: {
  active: FinanceiroTab;
  onChange: (tab: FinanceiroTab) => void;
  badges?: Partial<Record<FinanceiroTab, number>>;
}) {
  const tabsWithBadges = badges
    ? tabs.map((t) => ({ ...t, badge: badges[t.id as FinanceiroTab] }))
    : tabs;

  return (
    <SubnavSegmented
      tabs={tabsWithBadges}
      active={active}
      onChange={(id) => onChange(id as FinanceiroTab)}
      layoutId="fin-subnav-bg"
    />
  );
}
