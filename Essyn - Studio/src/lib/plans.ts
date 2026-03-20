// ═══════════════════════════════════════════════
// Essyn Studio — Plan Definitions
// Source of truth for all plan-related logic
// ═══════════════════════════════════════════════

export type PlanId = "starter" | "pro" | "studio" | "business";
export type PlanInterval = "monthly" | "annual";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: { monthly: number; annual: number };
  trial: { days: number; requiresCard: boolean };
  limits: {
    projects: number; // -1 = unlimited
    clients: number;
    galleries: number;
    storage_gb: number;
    team_members: number;
    iris_msgs_per_day: number; // -1 = unlimited
    brands: number;
    automations: number; // -1 = unlimited
  };
  features: {
    crm: boolean;
    contracts: boolean;
    production: boolean;
    reports: boolean;
    briefing: boolean;
    export_csv: boolean;
    portal_whitelabel: boolean;
    portal_custom_domain: boolean;
    whatsapp: boolean;
    shop: boolean;
    shop_advanced: boolean;
    api_webhooks: boolean;
    permissions_module: boolean;
    permissions_granular: boolean;
  };
  support: "self-service" | "email-48h" | "priority-24h" | "dedicated";
  onboarding: "none" | "call-30min" | "full-setup";
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: { monthly: 0, annual: 0 },
    trial: { days: 0, requiresCard: false },
    limits: {
      projects: 3,
      clients: 10,
      galleries: 1,
      storage_gb: 1,
      team_members: 1,
      iris_msgs_per_day: 3,
      brands: 1,
      automations: 0,
    },
    features: {
      crm: false,
      contracts: false,
      production: false,
      reports: false,
      briefing: false,
      export_csv: false,
      portal_whitelabel: false,
      portal_custom_domain: false,
      whatsapp: false,
      shop: false,
      shop_advanced: false,
      api_webhooks: false,
      permissions_module: false,
      permissions_granular: false,
    },
    support: "self-service",
    onboarding: "none",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: { monthly: 89, annual: 69 },
    trial: { days: 7, requiresCard: true },
    limits: {
      projects: -1,
      clients: -1,
      galleries: -1,
      storage_gb: 50,
      team_members: 3,
      iris_msgs_per_day: 50,
      brands: 1,
      automations: 0,
    },
    features: {
      crm: true,
      contracts: true,
      production: true,
      reports: true,
      briefing: true,
      export_csv: true,
      portal_whitelabel: true,
      portal_custom_domain: false,
      whatsapp: false,
      shop: false,
      shop_advanced: false,
      api_webhooks: false,
      permissions_module: false,
      permissions_granular: false,
    },
    support: "email-48h",
    onboarding: "none",
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: { monthly: 179, annual: 139 },
    trial: { days: 7, requiresCard: true },
    limits: {
      projects: -1,
      clients: -1,
      galleries: -1,
      storage_gb: 200,
      team_members: 10,
      iris_msgs_per_day: -1,
      brands: 3,
      automations: 10,
    },
    features: {
      crm: true,
      contracts: true,
      production: true,
      reports: true,
      briefing: true,
      export_csv: true,
      portal_whitelabel: true,
      portal_custom_domain: true,
      whatsapp: true,
      shop: true,
      shop_advanced: false,
      api_webhooks: false,
      permissions_module: true,
      permissions_granular: false,
    },
    support: "priority-24h",
    onboarding: "call-30min",
  },
  business: {
    id: "business",
    name: "Business",
    price: { monthly: 299, annual: 237 },
    trial: { days: 7, requiresCard: true },
    limits: {
      projects: -1,
      clients: -1,
      galleries: -1,
      storage_gb: 500,
      team_members: -1,
      iris_msgs_per_day: -1,
      brands: -1,
      automations: -1,
    },
    features: {
      crm: true,
      contracts: true,
      production: true,
      reports: true,
      briefing: true,
      export_csv: true,
      portal_whitelabel: true,
      portal_custom_domain: true,
      whatsapp: true,
      shop: true,
      shop_advanced: true,
      api_webhooks: true,
      permissions_module: true,
      permissions_granular: true,
    },
    support: "dedicated",
    onboarding: "full-setup",
  },
};

// Helper: get plan by ID
export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

// Helper: check if feature is available for plan
export function hasFeature(planId: PlanId, feature: keyof PlanDefinition["features"]): boolean {
  return PLANS[planId].features[feature];
}

// Helper: check if limit is exceeded
export function isLimitReached(planId: PlanId, resource: keyof PlanDefinition["limits"], current: number): boolean {
  const limit = PLANS[planId].limits[resource];
  if (limit === -1) return false;
  return current >= limit;
}

// Helper: get price for interval
export function getPrice(planId: PlanId, interval: PlanInterval): number {
  return PLANS[planId].price[interval];
}

// Helper: format price display
export function formatPrice(planId: PlanId, interval: PlanInterval): string {
  const price = getPrice(planId, interval);
  if (price === 0) return "Gratis";
  return `R$ ${price}`;
}

// Helper: format limit display
export function formatLimit(value: number, unit?: string): string {
  if (value === -1) return "Ilimitado";
  return unit ? `${value} ${unit}` : `${value}`;
}

// Plan order for comparison/upgrade flows
export const PLAN_ORDER: PlanId[] = ["starter", "pro", "studio", "business"];

// Check if plan A is higher than plan B
export function isHigherPlan(a: PlanId, b: PlanId): boolean {
  return PLAN_ORDER.indexOf(a) > PLAN_ORDER.indexOf(b);
}
