import {
  LayoutDashboard,
  Clapperboard,
  CalendarDays,
  Images,
  FolderKanban,
  DollarSign,
  Users,
  Settings,
  Contact,
  UsersRound,
  ShoppingBag,
  BarChart3,
  FileText,
  Zap,
  Link2,
  MessageCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { SidebarSection } from "./Sidebar";
import type { NavItemState } from "./NavItem";
import { defaultFeatureRegistry } from "./paywall-provider";

/* ═══════════════════════════════════════════════════ */
/*  Shared Sidebar Config — ESSYN                      */
/*  Central source of truth for sidebar nav items      */
/*  Supports paywall-locked items via state:"locked"   */
/*  + onLockedClick callback                           */
/* ═══════════════════════════════════════════════════ */

export type EssynModule =
  | "dashboard"
  | "producao"
  | "agenda"
  | "galeria"
  | "pedidos"
  | "whatsapp"
  | "projetos"
  | "financeiro"
  | "crm"
  | "clientes"
  | "time"
  | "relatorios"
  | "contratos"
  | "automacoes"
  | "integracoes"
  | "configuracoes";

interface ModuleDef {
  icon: ReactNode;
  label: string;
  module: EssynModule;
  route: string;
  section: "OPERAÇÃO" | "GESTÃO" | "SISTEMA";
  /** Feature key for paywall (if lockable) */
  paywallFeatureKey?: string;
  /** Default badge count */
  defaultBadge?: number;
}

const moduleDefs: ModuleDef[] = [
  {
    icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    label: "Dashboard",
    module: "dashboard",
    route: "/dashboard",
    section: "OPERAÇÃO",
  },
  {
    icon: <Clapperboard className="w-[18px] h-[18px]" />,
    label: "Produção",
    module: "producao",
    route: "/producao",
    section: "OPERAÇÃO",
    defaultBadge: 3,
  },
  {
    icon: <CalendarDays className="w-[18px] h-[18px]" />,
    label: "Agenda",
    module: "agenda",
    route: "/agenda",
    section: "OPERAÇÃO",
    defaultBadge: 1,
  },
  {
    icon: <Images className="w-[18px] h-[18px]" />,
    label: "Galeria",
    module: "galeria",
    route: "/galeria",
    section: "OPERAÇÃO",
  },
  {
    icon: <ShoppingBag className="w-[18px] h-[18px]" />,
    label: "Pedidos",
    module: "pedidos",
    route: "/pedidos",
    section: "OPERAÇÃO",
    paywallFeatureKey: "pedidos",
  },
  {
    icon: <MessageCircle className="w-[18px] h-[18px]" />,
    label: "WhatsApp",
    module: "whatsapp",
    route: "/whatsapp",
    section: "OPERAÇÃO",
  },
  {
    icon: <FolderKanban className="w-[18px] h-[18px]" />,
    label: "Projetos",
    module: "projetos",
    route: "/projetos",
    section: "GESTÃO",
    defaultBadge: 10,
  },
  {
    icon: <DollarSign className="w-[18px] h-[18px]" />,
    label: "Financeiro",
    module: "financeiro",
    route: "/financeiro",
    section: "GESTÃO",
    paywallFeatureKey: "financeiro",
  },
  {
    icon: <Users className="w-[18px] h-[18px]" />,
    label: "CRM",
    module: "crm",
    route: "/crm",
    section: "GESTÃO",
    paywallFeatureKey: "crm",
  },
  {
    icon: <Contact className="w-[18px] h-[18px]" />,
    label: "Clientes",
    module: "clientes",
    route: "/clientes",
    section: "GESTÃO",
    paywallFeatureKey: "clientes",
  },
  {
    icon: <UsersRound className="w-[18px] h-[18px]" />,
    label: "Time",
    module: "time",
    route: "/time",
    section: "GESTÃO",
    paywallFeatureKey: "time",
  },
  {
    icon: <BarChart3 className="w-[18px] h-[18px]" />,
    label: "Relatórios",
    module: "relatorios",
    route: "/relatorios",
    section: "GESTÃO",
    paywallFeatureKey: "relatorios",
  },
  {
    icon: <FileText className="w-[18px] h-[18px]" />,
    label: "Contratos",
    module: "contratos",
    route: "/contratos",
    section: "GESTÃO",
    paywallFeatureKey: "contratos",
  },
  {
    icon: <Zap className="w-[18px] h-[18px]" />,
    label: "Automações",
    module: "automacoes",
    route: "/automacoes",
    section: "SISTEMA",
  },
  {
    icon: <Link2 className="w-[18px] h-[18px]" />,
    label: "Integrações",
    module: "integracoes",
    route: "/integracoes",
    section: "SISTEMA",
  },
  {
    icon: <Settings className="w-[18px] h-[18px]" />,
    label: "Configurações",
    module: "configuracoes",
    route: "/configuracoes",
    section: "SISTEMA",
  },
];

/* ── Build sections ── */

interface BuildSidebarOptions {
  /** Currently active module */
  activeModule: EssynModule;
  /** Navigate callback */
  navigate: (path: string) => void;
  /** Locked feature keys (modules that require upgrade) */
  lockedFeatures?: string[];
  /** Callback when a locked module is clicked — should call paywall.openDrawer(featureKey) */
  onLockedClick?: (featureKey: string) => void;
  /** Override badges */
  badges?: Partial<Record<EssynModule, number>>;
}

export function buildSidebarSections({
  activeModule,
  navigate,
  lockedFeatures = [],
  onLockedClick,
  badges,
}: BuildSidebarOptions): SidebarSection[] {
  const sectionMap: Record<string, typeof moduleDefs> = {};

  for (const mod of moduleDefs) {
    if (!sectionMap[mod.section]) sectionMap[mod.section] = [];
    sectionMap[mod.section].push(mod);
  }

  const sectionOrder = ["OPERAÇÃO", "GESTÃO", "SISTEMA"];

  return sectionOrder
    .filter((s) => sectionMap[s])
    .map((sectionTitle) => ({
      title: sectionTitle,
      items: sectionMap[sectionTitle].map((mod) => {
        const isActive = mod.module === activeModule;
        const isLocked =
          mod.paywallFeatureKey !== undefined &&
          lockedFeatures.includes(mod.paywallFeatureKey);

        let state: NavItemState = "default";
        if (isActive) state = "active";
        else if (isLocked) state = "locked";

        const badge = badges?.[mod.module] ?? mod.defaultBadge;

        return {
          icon: mod.icon,
          label: mod.label,
          state,
          badge,
          disabledReason: isLocked && mod.paywallFeatureKey
            ? `Disponível no ${defaultFeatureRegistry[mod.paywallFeatureKey]?.requiredPlan === "studio" ? "Studio Pro" : "plano Pro"}`
            : undefined,
          onClick: () => navigate(mod.route),
          onLockedClick:
            isLocked && onLockedClick && mod.paywallFeatureKey
              ? () => onLockedClick(mod.paywallFeatureKey!)
              : undefined,
        };
      }),
    }));
}

/**
 * Default locked features for "Core" plan demo.
 * In a real app, this would come from the user's subscription.
 */
export const corePlanLockedFeatures = ["financeiro", "crm"];
export const proPlanLockedFeatures: string[] = [];
export const studioPlanLockedFeatures: string[] = [];