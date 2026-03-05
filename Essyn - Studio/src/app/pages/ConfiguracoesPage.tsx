import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { useShellConfig } from "../components/ui/ShellContext";
import { ConfiguracoesContent } from "../components/configuracoes/ConfiguracoesContent";
import { UsuariosPermissoesContent } from "../components/configuracoes/UsuariosPermissoesContent";
import { AssinaturaFaturasContent } from "../components/configuracoes/AssinaturaFaturasContent";
import { EquipamentosContent } from "../components/configuracoes/EquipamentosContent";
import { DocumentosContent } from "../components/configuracoes/DocumentosContent";
import { GaleriaContent } from "../components/configuracoes/GaleriaContent";
import { FinanceiroConfigContent } from "../components/configuracoes/FinanceiroConfigContent";
import { TemplatesConfigContent } from "../components/configuracoes/TemplatesConfigContent";

type ConfigSubView = "overview" | "usuarios" | "assinatura" | "equipamentos" | "documentos" | "galeria" | "financeiro" | "templates";

export function ConfiguracoesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Read ?tab= from URL on mount and on change ── */
  const tabParam = searchParams.get("tab");
  const [subView, setSubView] = useState<ConfigSubView>(() => {
    if (tabParam === "assinatura") return "assinatura";
    if (tabParam === "usuarios") return "usuarios";
    if (tabParam === "equipamentos") return "equipamentos";
    if (tabParam === "documentos") return "documentos";
    if (tabParam === "galeria") return "galeria";
    if (tabParam === "financeiro") return "financeiro";
    if (tabParam === "templates") return "templates";
    return "overview";
  });

  useEffect(() => {
    if (tabParam === "assinatura" && subView !== "assinatura") {
      setSubView("assinatura");
    } else if (tabParam === "usuarios" && subView !== "usuarios") {
      setSubView("usuarios");
    } else if (tabParam === "equipamentos" && subView !== "equipamentos") {
      setSubView("equipamentos");
    } else if (tabParam === "documentos" && subView !== "documentos") {
      setSubView("documentos");
    } else if (tabParam === "galeria" && subView !== "galeria") {
      setSubView("galeria");
    } else if (tabParam === "financeiro" && subView !== "financeiro") {
      setSubView("financeiro");
    } else if (tabParam === "templates" && subView !== "templates") {
      setSubView("templates");
    }
  }, [tabParam]);

  const breadcrumb =
    subView === "usuarios"
      ? { section: "Configurações", page: "Usuários & Permissões" }
      : subView === "assinatura"
      ? { section: "Configurações", page: "Assinatura & Faturas" }
      : subView === "equipamentos"
      ? { section: "Configurações", page: "Equipamentos" }
      : subView === "documentos"
      ? { section: "Configurações", page: "Documentos" }
      : subView === "galeria"
      ? { section: "Configurações", page: "Galeria" }
      : subView === "financeiro"
      ? { section: "Configurações", page: "Financeiro" }
      : subView === "templates"
      ? { section: "Configurações", page: "Templates" }
      : { section: "Sistema", page: "Configurações" };

  useShellConfig({ breadcrumb });

  /* ── When subView changes, sync URL ── */
  function changeSubView(view: ConfigSubView) {
    setSubView(view);
    if (view === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: view });
    }
  }

  if (subView === "usuarios") {
    return <UsuariosPermissoesContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "assinatura") {
    return <AssinaturaFaturasContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "equipamentos") {
    return <EquipamentosContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "documentos") {
    return <DocumentosContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "galeria") {
    return <GaleriaContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "financeiro") {
    return <FinanceiroConfigContent onBack={() => changeSubView("overview")} />;
  }
  if (subView === "templates") {
    return <TemplatesConfigContent onBack={() => changeSubView("overview")} />;
  }

  return (
    <ConfiguracoesContent
      onNavigate={(id) => {
        if (id === "equipe" || id === "permissoes" || id === "seguranca") {
          changeSubView("usuarios");
        } else if (id === "plano" || id === "cobranca" || id === "faturas") {
          changeSubView("assinatura");
        } else if (id === "inventario" || id === "manutencao") {
          changeSubView("equipamentos");
        } else if (id === "contratos" || id === "modelos-docs") {
          changeSubView("documentos");
        } else if (id === "galeria-branding" || id === "galeria-privacidade" || id === "galeria-watermark") {
          changeSubView("galeria");
        } else if (id === "categorias" || id === "centros-custo" || id === "metodos-pagamento" || id === "conciliacao") {
          changeSubView("financeiro");
        } else if (id === "workflows" || id === "templates-cobranca" || id === "templates-mensagem") {
          changeSubView("templates");
        } else {
          toast("Em desenvolvimento", {
            description: "Esta seção estará disponível em breve (WIP)",
            duration: 2500,
          });
        }
      }}
    />
  );
}