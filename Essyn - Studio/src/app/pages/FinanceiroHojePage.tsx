import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { FinanceiroSubnav, type FinanceiroTab } from "../components/financeiro/FinanceiroSubnav";
import { FinanceiroHojeContent } from "../components/financeiro/FinanceiroHojeContent";
import { ReceberContent } from "../components/financeiro/ReceberContent";
import { PagarContent } from "../components/financeiro/PagarContent";
import { CaixaContent } from "../components/financeiro/CaixaContent";
import { ConciliacaoContent } from "../components/financeiro/ConciliacaoContent";
import { CobrancaContent } from "../components/financeiro/CobrancaContent";
import { FiscalContent } from "../components/financeiro/FiscalContent";
import { RelatoriosContent } from "../components/financeiro/RelatoriosContent";
import { ConfigContent } from "../components/financeiro/ConfigContent";
import { navigateToProject } from "../lib/navigation";
import { projetos } from "../components/projetos/projetosData";

export function FinanceiroHojePage() {
  const [activeTab, setActiveTab] = useState<FinanceiroTab>("hoje");
  const navigate = useNavigate();

  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Financeiro" },
    cta: {
      label: "Novo Lançamento",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  /* ─── Deep-link: navigate to ProjetoDrawer tab financeiro ─── */
  const handleNavigateToProject = useCallback(
    (projectId: string) => {
      const proj = projetos.find((p) => p.id === projectId);
      navigateToProject(navigate, {
        projectId,
        tab: "financeiro",
        from: "financeiro",
        projetoNome: proj?.nome,
      });
    },
    [navigate],
  );

  function renderTabContent() {
    switch (activeTab) {
      case "hoje":
        return <FinanceiroHojeContent onNavigateToProject={handleNavigateToProject} />;
      case "receber":
        return <ReceberContent onNavigateToProject={handleNavigateToProject} />;
      case "pagar":
        return <PagarContent onNavigateToProject={handleNavigateToProject} />;
      case "caixa":
        return <CaixaContent />;
      case "conciliacao":
        return <ConciliacaoContent onNavigateToProject={handleNavigateToProject} />;
      case "cobranca":
        return <CobrancaContent onNavigateToProject={handleNavigateToProject} />;
      case "fiscal":
        return <FiscalContent onNavigateToProject={handleNavigateToProject} />;
      case "relatorios":
        return <RelatoriosContent />;
      case "config":
        return <ConfigContent />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      <FinanceiroSubnav
        active={activeTab}
        onChange={setActiveTab}
        badges={{ hoje: 12, receber: 8, pagar: 8, fiscal: 2, cobranca: 1 }}
      />
      {renderTabContent()}
    </div>
  );
}