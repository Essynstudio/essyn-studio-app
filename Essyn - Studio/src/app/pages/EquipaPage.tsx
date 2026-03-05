import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { EquipaContent } from "../components/equipa/EquipaContent";

export function EquipaPage() {
  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Time" },
    cta: {
      label: "Convidar membro",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  return <EquipaContent />;
}
