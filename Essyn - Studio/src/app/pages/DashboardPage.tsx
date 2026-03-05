import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { DashboardContent } from "../components/dashboard/DashboardContent";
import { navigateToProject, type ProjetoTab } from "../lib/navigation";
import { projetos } from "../components/projetos/projetosData";
import { useAppStore } from "../lib/appStore";
import { toast } from "sonner";

/* ── Simulated incoming orders for demo ── */
const MOCK_PUSH_ORDERS = [
  { cliente: "Rodrigo Mendes", product: "Impressão Fine Art 30x40", total: 360 },
  { cliente: "Sofia Lima", product: "Álbum Fotográfico 25x25", total: 720 },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { createOrder } = useAppStore();
  const pushFired = useRef(false);

  /* Simulate a "push" order arriving ~8s after first dashboard mount */
  useEffect(() => {
    if (pushFired.current) return;
    pushFired.current = true;

    const timer = setTimeout(() => {
      const mock = MOCK_PUSH_ORDERS[Math.floor(Math.random() * MOCK_PUSH_ORDERS.length)];
      createOrder({
        galleryId: "g1",
        cliente: mock.cliente,
        items: [{ photoId: "ph-push", product: mock.product, size: "30x40", qty: 1, price: mock.total }],
        total: mock.total,
        status: "pendente",
      });
      toast("Novo pedido na loja!", {
        description: `${mock.cliente} — R$ ${mock.total.toLocaleString("pt-BR")}`,
        action: {
          label: "Ver pedidos",
          onClick: () => navigate("/pedidos"),
        },
      });
    }, 8000);

    return () => clearTimeout(timer);
  }, [createOrder, navigate]);

  useShellConfig({
    breadcrumb: { section: "Operação", page: "Dashboard" },
    cta: {
      label: "Novo Projeto",
      icon: <Plus className="w-3.5 h-3.5" />,
      quickActions: defaultQuickActions,
    },
  });

  /* ─── Deep link: open a project drawer with specific tab ─── */
  const handleNavigateToProject = useCallback(
    (projectId: string, tab: ProjetoTab = "cadastro") => {
      const proj = projetos.find((p) => p.id === projectId);
      navigateToProject(navigate, {
        projectId,
        tab,
        from: "dashboard",
        projetoNome: proj?.nome,
      });
    },
    [navigate],
  );

  /* ─── Navigate to a module page ─── */
  const handleNavigateToModule = useCallback(
    (
      module: "producao" | "financeiro" | "agenda" | "galeria" | "projetos",
      params?: Record<string, string>,
    ) => {
      const searchParams = params
        ? `?${new URLSearchParams(params).toString()}`
        : "";
      navigate(`/${module}${searchParams}`);
    },
    [navigate],
  );

  return (
    <DashboardContent
      onNavigateToProject={handleNavigateToProject}
      onNavigateToModule={handleNavigateToModule}
    />
  );
}
