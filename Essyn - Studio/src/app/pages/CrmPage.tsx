import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { CrmPipelineContent } from "../components/crm/CrmPipelineContent";

export function CrmPage() {
  useShellConfig({
    breadcrumb: { section: "Gestão", page: "CRM" },
    cta: {
      label: "Novo lead",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  return <CrmPipelineContent />;
}
