import type { PlanId } from "./plans";

export interface TrialStatus {
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  isExpired: boolean;
  effectivePlan: PlanId;
}

export function getTrialStatus(
  plan: PlanId,
  planStartedAt: string | null,
  trialEndsAt: string | null
): TrialStatus {
  // No trial for starter
  if (plan === "starter" || !planStartedAt) {
    return { isOnTrial: false, daysRemaining: 0, trialEndsAt: null, isExpired: false, effectivePlan: plan };
  }

  // If trial_ends_at is set, use it
  if (trialEndsAt) {
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      // Trial expired — check if payment was made
      // For now, without Asaas integration, expired trial = downgrade to starter
      return {
        isOnTrial: false,
        daysRemaining: 0,
        trialEndsAt: endDate,
        isExpired: true,
        effectivePlan: "starter", // Downgrade
      };
    }

    return {
      isOnTrial: true,
      daysRemaining,
      trialEndsAt: endDate,
      isExpired: false,
      effectivePlan: plan, // Keep the trial plan
    };
  }

  // Legacy: trial_ends_at not set but plan_started_at exists
  // Calculate trial end from plan_started_at + 7 days
  const startDate = new Date(planStartedAt);
  const trialEnd = new Date(startDate);
  trialEnd.setDate(trialEnd.getDate() + 7);

  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      isOnTrial: false,
      daysRemaining: 0,
      trialEndsAt: trialEnd,
      isExpired: true,
      effectivePlan: "starter",
    };
  }

  return {
    isOnTrial: true,
    daysRemaining,
    trialEndsAt: trialEnd,
    isExpired: false,
    effectivePlan: plan,
  };
}
