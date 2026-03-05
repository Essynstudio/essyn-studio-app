import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  DollarSign,
  Users,
  Image,
  BarChart3,
  FolderKanban,
  Shield,
  Lock,
  Zap,
  ExternalLink,
  Database,
} from "lucide-react";
import {
  PaywallDrawerSheet,
  type PlanTier,
  type PaywallBenefit,
} from "./paywall-drawer-sheet";
import { PaywallModalDialog } from "./paywall-modal-dialog";

/* ═══════════════════════════════════════════════════ */
/*  PaywallProvider — Global paywall context            */
/*  Provides openDrawer(featureKey) and                */
/*  openModal(featureKey) to any descendant             */
/*  Renders PaywallDrawerSheet + PaywallModalDialog     */
/*  Feature registry defines all locked features        */
/* ═══════════════════════════════════════════════════ */

/* ── Feature config ── */

export interface PaywallFeatureConfig {
  featureKey: string;
  moduleIcon: ReactNode;
  moduleLabel: string;
  moduleDescription: string;
  requiredPlan: PlanTier;
  benefits: PaywallBenefit[];
  isAddon?: boolean;
  addonName?: string;
  addonPrice?: number;
  /** For modal: action-specific title */
  modalTitle?: string;
  /** For modal: action-specific description */
  modalDescription?: string;
}

/* ── Default feature registry ── */

export const defaultFeatureRegistry: Record<string, PaywallFeatureConfig> = {
  financeiro: {
    featureKey: "financeiro",
    moduleIcon: <DollarSign className="w-6 h-6" />,
    moduleLabel: "Financeiro",
    moduleDescription:
      "Gestão completa de receitas, despesas, fluxo de caixa e relatórios financeiros.",
    requiredPlan: "pro",
    benefits: [
      {
        icon: <DollarSign className="w-4 h-4" />,
        title: "Fluxo de Caixa",
        description: "Controle completo de entradas e saídas",
      },
      {
        icon: <BarChart3 className="w-4 h-4" />,
        title: "Relatórios",
        description: "Gráficos e métricas em tempo real",
      },
      {
        icon: <FolderKanban className="w-4 h-4" />,
        title: "Conciliação",
        description: "Match automático com extrato bancário",
      },
      {
        icon: <Shield className="w-4 h-4" />,
        title: "NF-e e Recibos",
        description: "Geração automática de documentos fiscais",
      },
    ],
    modalTitle: "Recurso do plano Pro",
    modalDescription:
      "O módulo Financeiro está disponível a partir do plano Pro. Faça upgrade para desbloquear.",
  },
  crm: {
    featureKey: "crm",
    moduleIcon: <Users className="w-6 h-6" />,
    moduleLabel: "CRM",
    moduleDescription:
      "Pipeline de vendas, gestão de leads e clientes com funil visual e contatos.",
    requiredPlan: "pro",
    benefits: [
      {
        icon: <Users className="w-4 h-4" />,
        title: "Pipeline Visual",
        description: "Kanban de oportunidades com drag & drop",
      },
      {
        icon: <FolderKanban className="w-4 h-4" />,
        title: "Gestão de Leads",
        description: "Capture e qualifique leads automaticamente",
      },
      {
        icon: <BarChart3 className="w-4 h-4" />,
        title: "Relatórios de Vendas",
        description: "Métricas de conversão e receita",
      },
      {
        icon: <Zap className="w-4 h-4" />,
        title: "Automações",
        description: "Follow-up automático por e-mail",
      },
    ],
    modalTitle: "Recurso do plano Pro",
    modalDescription:
      "O CRM está disponível a partir do plano Pro. Faça upgrade para desbloquear.",
  },
  equipe: {
    featureKey: "equipe",
    moduleIcon: <Users className="w-6 h-6" />,
    moduleLabel: "Equipe & Permissões",
    moduleDescription:
      "Convide membros, defina papéis e controle acessos granulares por módulo.",
    requiredPlan: "studio",
    benefits: [
      {
        icon: <Users className="w-4 h-4" />,
        title: "Até 10 membros",
        description: "Equipe completa com convites por e-mail",
      },
      {
        icon: <Shield className="w-4 h-4" />,
        title: "5 papéis",
        description:
          "Admin, Financeiro, Atendimento, Produção, Contador",
      },
      {
        icon: <Lock className="w-4 h-4" />,
        title: "Permissões granulares",
        description: "Controle por módulo e ação",
      },
      {
        icon: <Zap className="w-4 h-4" />,
        title: "Log de atividades",
        description: "Histórico completo de acessos e ações",
      },
    ],
    modalTitle: "Recurso do plano Studio Pro",
    modalDescription:
      "Equipe & Permissões está disponível no plano Studio Pro.",
  },
  time: {
    featureKey: "time",
    moduleIcon: <Users className="w-6 h-6" />,
    moduleLabel: "Time",
    moduleDescription:
      "Convide membros, defina papéis e controle acessos granulares por módulo.",
    requiredPlan: "studio",
    benefits: [
      {
        icon: <Users className="w-4 h-4" />,
        title: "Até 10 membros",
        description: "Equipe completa com convites por e-mail",
      },
      {
        icon: <Shield className="w-4 h-4" />,
        title: "5 papéis",
        description:
          "Admin, Financeiro, Atendimento, Produção, Contador",
      },
      {
        icon: <Lock className="w-4 h-4" />,
        title: "Permissões granulares",
        description: "Controle por módulo e ação",
      },
      {
        icon: <Zap className="w-4 h-4" />,
        title: "Log de atividades",
        description: "Histórico completo de acessos e ações",
      },
    ],
    modalTitle: "Recurso do plano Studio Pro",
    modalDescription:
      "Time & Permissões está disponível no plano Studio Pro.",
  },
  galeria_pro: {
    featureKey: "galeria_pro",
    moduleIcon: <Image className="w-6 h-6" />,
    moduleLabel: "Galeria Pro",
    moduleDescription:
      "Galerias ilimitadas, domínio customizado, watermark automática e proofing avançado.",
    requiredPlan: "pro",
    isAddon: true,
    addonName: "Galeria Pro",
    addonPrice: 39,
    benefits: [
      {
        icon: <Image className="w-4 h-4" />,
        title: "Galerias ilimitadas",
        description: "Sem limite de coleções por projeto",
      },
      {
        icon: <ExternalLink className="w-4 h-4" />,
        title: "Domínio customizado",
        description: "galeria.seuestudio.com",
      },
      {
        icon: <Shield className="w-4 h-4" />,
        title: "Watermark automática",
        description: "Marca d'água em proofing e download",
      },
      {
        icon: <Database className="w-4 h-4" />,
        title: "+50 GB storage",
        description: "Armazenamento extra para fotos",
      },
    ],
    modalTitle: "Add-on necessário",
    modalDescription:
      "A Galeria Pro é um add-on. Ative para desbloquear galerias ilimitadas e domínio customizado.",
  },
  exportar_relatorio: {
    featureKey: "exportar_relatorio",
    moduleIcon: <BarChart3 className="w-6 h-6" />,
    moduleLabel: "Relatórios Avançados",
    moduleDescription:
      "Exporte relatórios financeiros, métricas de produção e análises detalhadas.",
    requiredPlan: "pro",
    benefits: [
      {
        icon: <BarChart3 className="w-4 h-4" />,
        title: "Exportação PDF/Excel",
        description: "Relatórios formatados para impressão",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        title: "Relatório Financeiro",
        description: "DRE, fluxo de caixa e conciliação",
      },
    ],
    modalTitle: "Exportar Relatório",
    modalDescription:
      "A exportação de relatórios está disponível a partir do plano Pro.",
  },
};

/* ── Context ── */

interface PaywallContextType {
  /** Open the paywall drawer for a feature */
  openDrawer: (featureKey: string) => void;
  /** Open the paywall modal for a feature/action */
  openModal: (featureKey: string) => void;
  /** Current user plan (mock) */
  currentPlan: PlanTier;
}

const PaywallContext = createContext<PaywallContextType | null>(null);

/** Safe fallback so consumers don't crash if provider is missing during HMR */
const fallbackCtx: PaywallContextType = {
  openDrawer: () => {},
  openModal: () => {},
  currentPlan: "core",
};

export function usePaywall() {
  const ctx = useContext(PaywallContext);
  if (!ctx) {
    return fallbackCtx;
  }
  return ctx;
}

/* ── Provider ── */

interface PaywallProviderProps {
  children: ReactNode;
  /** Current user plan (default: "core" for demo) */
  currentPlan?: PlanTier;
  /** Custom feature registry (merges with defaults) */
  features?: Record<string, PaywallFeatureConfig>;
}

export function PaywallProvider({
  children,
  currentPlan = "core",
  features,
}: PaywallProviderProps) {
  const navigate = useNavigate();

  const registry = {
    ...defaultFeatureRegistry,
    ...features,
  };

  /* ── Drawer state ── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFeature, setDrawerFeature] =
    useState<PaywallFeatureConfig | null>(null);

  /* ── Modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeature, setModalFeature] =
    useState<PaywallFeatureConfig | null>(null);

  /* ── Actions ── */
  const navigateToAssinatura = useCallback(() => {
    navigate("/configuracoes?tab=assinatura");
  }, [navigate]);

  const openDrawer = useCallback(
    (featureKey: string) => {
      const feat = registry[featureKey];
      if (!feat) {
        console.warn(`[Paywall] Feature "${featureKey}" not found in registry`);
        return;
      }
      setDrawerFeature(feat);
      setDrawerOpen(true);
    },
    [registry],
  );

  const openModal = useCallback(
    (featureKey: string) => {
      const feat = registry[featureKey];
      if (!feat) {
        console.warn(`[Paywall] Feature "${featureKey}" not found in registry`);
        return;
      }
      setModalFeature(feat);
      setModalOpen(true);
    },
    [registry],
  );

  return (
    <PaywallContext.Provider value={{ openDrawer, openModal, currentPlan }}>
      {children}

      {/* Global Paywall Drawer */}
      {drawerFeature && (
        <PaywallDrawerSheet
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          featureKey={drawerFeature.featureKey}
          moduleIcon={drawerFeature.moduleIcon}
          moduleLabel={drawerFeature.moduleLabel}
          moduleDescription={drawerFeature.moduleDescription}
          currentPlan={currentPlan}
          requiredPlan={drawerFeature.requiredPlan}
          benefits={drawerFeature.benefits}
          isAddon={drawerFeature.isAddon}
          addonName={drawerFeature.addonName}
          addonPrice={drawerFeature.addonPrice}
          onUpgrade={navigateToAssinatura}
          onViewPlans={navigateToAssinatura}
        />
      )}

      {/* Global Paywall Modal */}
      {modalFeature && (
        <PaywallModalDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          featureKey={modalFeature.featureKey}
          title={modalFeature.modalTitle ?? "Recurso bloqueado"}
          description={
            modalFeature.modalDescription ??
            `Este recurso está disponível a partir do plano ${modalFeature.requiredPlan}.`
          }
          currentPlan={currentPlan}
          requiredPlan={modalFeature.requiredPlan}
          isAddon={modalFeature.isAddon}
          addonName={modalFeature.addonName}
          onUpgrade={navigateToAssinatura}
          onViewPlans={navigateToAssinatura}
        />
      )}
    </PaywallContext.Provider>
  );
}