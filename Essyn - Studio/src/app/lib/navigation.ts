import type { NavigateFunction } from "react-router";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════ */
/*  Navigation Contract — Deep-link entre módulos     */
/*                                                     */
/*  Contrato único para navegação Financeiro ↔ Agenda  */
/*  ↔ Projetos, usando navigate() state.               */
/*                                                     */
/*  Uso:                                               */
/*    navigateToProject(navigate, {                    */
/*      projectId: "proj-001",                         */
/*      tab: "financeiro",                             */
/*      from: "financeiro",                            */
/*      projetoNome: "Casamento Oliveira",             */
/*    });                                              */
/* ═══════════════════════════════════════════════════ */

/** Tabs supported by ProjetoDrawer */
export type ProjetoTab = "cadastro" | "producao" | "financeiro" | "galeria" | "docs" | "timeline" | "portal";

/** Origin module for context toast */
export type NavigationOrigin = "financeiro" | "agenda" | "dashboard" | "producao" | "crm";

/** State shape passed via navigate('/projetos', { state }) */
export interface ProjectNavigationState {
  openProjectId: string;
  initialTab: ProjetoTab;
}

/** Options for the navigation helper */
export interface NavigateToProjectOptions {
  projectId: string;
  tab?: ProjetoTab;
  from?: NavigationOrigin;
  /** Project name for the context toast */
  projetoNome?: string;
}

/**
 * Navigate to /projetos and auto-open a specific project drawer
 * with an optional tab + context toast.
 *
 * @example
 * navigateToProject(navigate, {
 *   projectId: "proj-001",
 *   tab: "financeiro",
 *   from: "financeiro",
 *   projetoNome: "Casamento Oliveira & Santos",
 * });
 */
export function navigateToProject(
  navigate: NavigateFunction,
  options: NavigateToProjectOptions,
) {
  const { projectId, tab = "cadastro", from, projetoNome } = options;

  const state: ProjectNavigationState = {
    openProjectId: projectId,
    initialTab: tab,
  };

  // Context toast — brief feedback
  if (projetoNome) {
    const tabLabels: Record<ProjetoTab, string> = {
      cadastro: "Cadastro",
      producao: "Produção",
      financeiro: "Financeiro",
      galeria: "Galeria",
      docs: "Documentos",
      timeline: "Timeline",
      portal: "Portal",
    };
    toast(`Abrindo ${projetoNome}`, {
      description: `Tab ${tabLabels[tab]}`,
      duration: 2000,
    });
  }

  navigate("/projetos", { state });
}

/**
 * Read project navigation state from location.
 * Returns null if no deep-link state is present.
 */
export function readProjectNavState(
  locationState: unknown,
): ProjectNavigationState | null {
  if (!locationState || typeof locationState !== "object") return null;
  const s = locationState as Record<string, unknown>;
  if (typeof s.openProjectId !== "string") return null;
  return {
    openProjectId: s.openProjectId,
    initialTab: (s.initialTab as ProjetoTab) || "cadastro",
  };
}

/* ═══════════════════════════════════════════════════ */
/*  PROJECT → COLLECTION MAPPING                      */
/*                                                     */
/*  Maps project IDs to their corresponding gallery   */
/*  collection IDs (from GaleriaContent mockColecoes). */
/*  Used by ProjetoDrawer, Dashboard, Agenda for      */
/*  deep-linking into the gallery.                     */
/* ═══════════════════════════════════════════════════ */

export const PROJECT_COLLECTION_MAP: Record<string, string> = {
  "proj-001": "col-1",  // Casamento Oliveira & Santos
  "proj-002": "col-5",  // Corporativo TechCo → TechBR
  "proj-003": "col-3",  // 15 Anos Sofia → 15 Anos Isabela
  "proj-004": "col-6",  // Batizado Gabriel
  "proj-005": "col-4",  // Ensaio Gestante — Família Lima
  "proj-006": "col-2",  // Formatura Direito UFMG
  "proj-007": "col-8",  // Casamento Pereira & Alves → Pré-Wedding Ferreira
  "proj-008": "col-7",  // Ensaio Newborn → Ensaio Família Rocha
};

/**
 * Get the gallery collection ID for a given project ID.
 * Returns null if the project has no gallery collection.
 */
export function getCollectionForProject(projectId: string): string | null {
  return PROJECT_COLLECTION_MAP[projectId] ?? null;
}

/**
 * Navigate directly to a gallery collection's detail drawer.
 * Uses /galeria?colecao=<colId> which GaleriaContent reads via useSearchParams.
 */
export function navigateToGalleryCollection(
  navigate: NavigateFunction,
  projectId: string,
  projetoNome?: string,
) {
  const colId = getCollectionForProject(projectId);
  if (!colId) {
    toast.info("Sem galeria", {
      description: projetoNome
        ? `${projetoNome} ainda não possui coleção publicada`
        : "Este projeto ainda não possui coleção publicada",
    });
    return;
  }
  if (projetoNome) {
    toast(`Abrindo galeria`, {
      description: projetoNome,
      duration: 2000,
    });
  }
  navigate(`/galeria?colecao=${colId}`);
}

/* ═══════════════════════════════════════════════════ */
/*  CRM LEAD → PROJECT MAPPING  (P31)                 */
/*                                                     */
/*  Maps converted CRM leads to their corresponding   */
/*  project IDs. Used by CrmPipelineContent for       */
/*  deep-linking CRM → Projetos Drawer.               */
/* ═══════════════════════════════════════════════════ */

/** Pre-existing lead→project mapping (mock) */
export const LEAD_PROJECT_MAP: Record<string, string> = {
  "l10": "proj-001",  // Ana Clara & Diego → Casamento Oliveira & Santos
};

/**
 * Resolve the project ID for a given lead.
 * Returns null if the lead has no linked project.
 */
export function getProjectForLead(leadId: string): string | null {
  return LEAD_PROJECT_MAP[leadId] ?? null;
}

/**
 * Check if a project has financial pendencies (parcelas vencidas).
 * Accepts the financeiro info object from projetosData.
 */
export function hasFinancialPendency(
  financeiro: { vencidas: number } | undefined,
): boolean {
  return (financeiro?.vencidas ?? 0) > 0;
}

/**
 * Navigate from CRM to a project drawer, auto-selecting the tab
 * based on financial pendency.
 *
 * - If `financeiro.vencidas > 0` → opens "financeiro" tab
 * - Otherwise → opens the specified tab (default "cadastro")
 */
export function navigateFromCrmToProject(
  navigate: NavigateFunction,
  options: NavigateToProjectOptions & {
    financeiro?: { vencidas: number };
  },
) {
  const { financeiro, ...rest } = options;
  const tab =
    hasFinancialPendency(financeiro) ? "financeiro" : (rest.tab ?? "cadastro");
  navigateToProject(navigate, { ...rest, tab, from: "crm" });
}