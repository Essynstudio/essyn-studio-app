import { PLANS, type PlanId, hasFeature, type PlanDefinition } from "@/lib/plans";

// Map routes to required features
const ROUTE_FEATURE_MAP: Record<string, keyof PlanDefinition["features"]> = {
  "/crm": "crm",
  "/clientes": "crm",
  "/financeiro": "contracts",
  "/pedidos": "shop",
  "/contratos": "contracts",
  "/time": "crm",
  "/relatorios": "reports",
  "/whatsapp": "whatsapp",
  "/automacoes": "crm",
};

export function isRouteAllowed(pathname: string, plan: PlanId): boolean {
  const feature = ROUTE_FEATURE_MAP[pathname];
  if (!feature) return true; // No gate for this route
  return hasFeature(plan, feature);
}

export function getRequiredPlanForRoute(pathname: string): PlanId | null {
  const feature = ROUTE_FEATURE_MAP[pathname];
  if (!feature) return null;
  // Find the lowest plan that has this feature
  const planOrder: PlanId[] = ["starter", "pro", "studio", "business"];
  for (const p of planOrder) {
    if (hasFeature(p, feature)) return p;
  }
  return "pro";
}
