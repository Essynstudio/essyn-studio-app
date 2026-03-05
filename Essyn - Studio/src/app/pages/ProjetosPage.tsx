import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { Plus } from "lucide-react";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { ProjetosContent } from "../components/projetos/ProjetosContent";
import { readProjectNavState, type ProjetoTab } from "../lib/navigation";

export function ProjetosPage() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ─── CTA onClick to open modal ─── */
  const handleOpenNewProject = useCallback(() => {
    window.dispatchEvent(new Event("essyn:openNewProject"));
  }, []);

  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Projetos" },
    cta: {
      label: "Novo Projeto",
      icon: <Plus className="w-3.5 h-3.5" />,
      onClick: handleOpenNewProject,
      quickActions: defaultQuickActions,
    },
  });

  /* ─── Deep-link state for drawer ─── */
  const navState = readProjectNavState(location.state);

  const [deepLinkProjectId, setDeepLinkProjectId] = useState<string | null>(
    null,
  );
  const [deepLinkTab, setDeepLinkTab] = useState<ProjetoTab | undefined>(
    undefined,
  );

  useEffect(() => {
    if (navState) {
      setDeepLinkProjectId(navState.openProjectId);
      setDeepLinkTab(navState.initialTab);
      window.history.replaceState({}, document.title);
    }
  }, [navState?.openProjectId, navState?.initialTab]);

  // Auto-open "Novo Projeto" modal via ?action=create query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "create") {
      window.dispatchEvent(new Event("essyn:openNewProject"));
      navigate("/projetos", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <ProjetosContent
      deepLinkProjectId={deepLinkProjectId}
      deepLinkTab={deepLinkTab}
      onDeepLinkConsumed={() => {
        setDeepLinkProjectId(null);
        setDeepLinkTab(undefined);
      }}
    />
  );
}
