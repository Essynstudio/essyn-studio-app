import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { ProducaoRadarContent } from "../components/producao/ProducaoRadarContent";
import { navigateToProject } from "../lib/navigation";
import { projetos } from "../components/projetos/projetosData";

export function ProducaoRadarPage() {
  const navigate = useNavigate();

  useShellConfig({
    breadcrumb: { section: "Operação", page: "Produção" },
    cta: {
      label: "Adicionar trabalho",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  const handleNavigateToProject = useCallback(
    (projetoId: string) => {
      const proj = projetos.find((p) => p.id === projetoId);
      navigateToProject(navigate, {
        projectId: projetoId,
        tab: "producao",
        from: "producao",
        projetoNome: proj?.nome,
      });
    },
    [navigate],
  );

  return (
    <ProducaoRadarContent onNavigateToProject={handleNavigateToProject} />
  );
}
