/**
 * Onboarding shared state — persisted in sessionStorage so it
 * survives page navigations during the onboarding flow.
 */

const STORAGE_KEY = "essyn_onboarding";

export interface OnboardingData {
  /* Step 1 – Criar Studio */
  studioName: string;
  city: string;
  uf: string;
  currency: string;

  /* Step 2 – Preferências */
  deliveryDays: number;
  workflowTemplate: string;
  paymentMethods: string[];
}

const defaults: OnboardingData = {
  studioName: "",
  city: "",
  uf: "",
  currency: "BRL",
  deliveryDays: 30,
  workflowTemplate: "padrao",
  paymentMethods: ["pix"],
};

export function getOnboarding(): OnboardingData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return { ...defaults };
}

export function setOnboarding(patch: Partial<OnboardingData>): OnboardingData {
  const current = getOnboarding();
  const next = { ...current, ...patch };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearOnboarding(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
