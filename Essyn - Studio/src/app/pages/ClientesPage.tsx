import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { ClientesContent } from "../components/clientes/ClientesContent";

export function ClientesPage() {
  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Clientes" },
    cta: {
      label: "Novo cliente",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  return <ClientesContent />;
}
