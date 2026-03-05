import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { AgendaContent } from "../components/agenda/AgendaContent";
import { navigateToProject, type ProjetoTab } from "../lib/navigation";
import { projetos } from "../components/projetos/projetosData";

export function AgendaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useShellConfig({
    breadcrumb: { section: "Operação", page: "Agenda" },
    cta: {
      label: "Novo evento",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  // Deep link support - track processed event to avoid duplicates
  const [processedEventId, setProcessedEventId] = useState<string | null>(null);

  useEffect(() => {
    const eventId = searchParams.get("eventId");

    // Only process if eventId exists and hasn't been processed yet
    if (eventId && eventId !== processedEventId) {
      setProcessedEventId(eventId);

      toast.success("Evento localizado", {
        description: `Navegando para ${eventId}`,
        duration: 2000,
      });

      setTimeout(() => {
        const element = document.getElementById(`event-${eventId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-[#9C8B7A]", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-[#9C8B7A]", "ring-offset-2");
          }, 2000);
        }
      }, 300);
    }
  }, [searchParams, processedEventId]);

  const handleNavigateToProject = useCallback(
    (projetoId: string, tab: ProjetoTab = "cadastro") => {
      const proj = projetos.find((p) => p.id === projetoId);
      navigateToProject(navigate, {
        projectId: projetoId,
        tab,
        from: "agenda",
        projetoNome: proj?.nome,
      });
    },
    [navigate],
  );

  return (
    <AgendaContent onNavigateToProject={handleNavigateToProject} />
  );
}
