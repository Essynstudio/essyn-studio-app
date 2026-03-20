import type { ComponentType, SVGProps } from "react";
import {
  IconIris,
  IconProjetos,
  IconProducao,
  IconAgenda,
  IconCRM,
  IconClientes,
  IconPortal,
  IconGaleria,
  IconFinanceiro,
  IconLoja,
  IconContratos,
  IconMensagens,
  IconWhatsApp,
  IconTime,
  IconRelatorios,
  IconConfiguracoes,
} from "@/components/icons/essyn-icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export interface EssynModule {
  id: string;
  label: string;
  icon: IconComponent;
  href: string;
  badge?: number;
  paywall?: boolean;
}

export interface ModuleGroup {
  label: string;
  modules: EssynModule[];
}

export const pinnedModules: EssynModule[] = [
  {
    id: "iris",
    label: "Iris",
    icon: IconIris,
    href: "/iris",
  },
];

export const moduleGroups: ModuleGroup[] = [
  {
    label: "Trabalho",
    modules: [
      { id: "projetos", label: "Projetos", icon: IconProjetos, href: "/projetos" },
      { id: "producao", label: "Produção", icon: IconProducao, href: "/producao" },
      { id: "agenda", label: "Agenda", icon: IconAgenda, href: "/agenda" },
    ],
  },
  {
    label: "Clientes",
    modules: [
      { id: "crm", label: "CRM", icon: IconCRM, href: "/crm", paywall: true },
      { id: "clientes", label: "Clientes", icon: IconClientes, href: "/clientes", paywall: true },
      { id: "portal", label: "Portal do Cliente", icon: IconPortal, href: "/portal-cliente" },
      { id: "galeria", label: "Galeria", icon: IconGaleria, href: "/galeria" },
    ],
  },
  {
    label: "Financeiro",
    modules: [
      { id: "financeiro", label: "Financeiro", icon: IconFinanceiro, href: "/financeiro", paywall: true },
      { id: "pedidos", label: "Loja", icon: IconLoja, href: "/pedidos", paywall: true },
      { id: "contratos", label: "Contratos", icon: IconContratos, href: "/contratos", paywall: true },
    ],
  },
  {
    label: "Comunicação",
    modules: [
      { id: "mensagens", label: "Mensagens", icon: IconMensagens, href: "/mensagens" },
      { id: "whatsapp", label: "WhatsApp", icon: IconWhatsApp, href: "/whatsapp", paywall: true },
    ],
  },
  {
    label: "Gestão",
    modules: [
      { id: "time", label: "Time", icon: IconTime, href: "/time", paywall: true },
      { id: "relatorios", label: "Relatórios", icon: IconRelatorios, href: "/relatorios", paywall: true },
    ],
  },
];

export const footerModules: EssynModule[] = [
  { id: "configuracoes", label: "Configurações", icon: IconConfiguracoes, href: "/configuracoes" },
];
