import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell/app-shell";
import { DrawerProvider } from "@/components/drawers/drawer-provider";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { getTrialStatus } from "@/lib/trial";
import type { PlanId } from "@/lib/plans";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  // Check if user is studio owner
  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, email, phone, city, state, plan, plan_interval, plan_started_at, plan_expires_at, trial_ends_at")
    .eq("owner_id", user.id)
    .single();

  // Sync user data to studio if missing (first login after signup)
  if (studio) {
    const meta = user.user_metadata || {};
    const updates: Record<string, string> = {};
    if (!studio.email && user.email) updates.email = user.email;
    if (!studio.phone && meta.phone) updates.phone = meta.phone;
    if (!(studio as Record<string, unknown>).city && meta.city) updates.city = meta.city;
    if (!(studio as Record<string, unknown>).state && meta.state) updates.state = meta.state;
    if (Object.keys(updates).length > 0) {
      await supabase.from("studios").update(updates).eq("id", studio.id);
    }
  }

  // If not owner, check if user is a team member of some studio
  let teamPermissions: string[] | null = null;
  let studioName = studio?.name;

  if (!studio) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("permissions, studios(name)")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (!membership) {
      // User is not an owner nor a team member — redirect to login
      redirect("/entrar");
    }

    const perms = membership.permissions as { modules?: string[] } | null;
    teamPermissions = perms?.modules || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studioData = membership.studios as any;
    studioName = Array.isArray(studioData) ? studioData[0]?.name : studioData?.name;
  }

  const trialStatus = studio
    ? getTrialStatus(
        (studio.plan || "starter") as PlanId,
        studio.plan_started_at,
        studio.trial_ends_at ?? studio.plan_expires_at ?? null
      )
    : null;

  return (
    <DrawerProvider>
      <CommandPaletteProvider>
        <AppShell
          studioName={studioName}
          userEmail={user.email}
          teamPermissions={teamPermissions}
          plan={trialStatus?.effectivePlan ?? ((studio?.plan as PlanId) || "starter")}
          trialStatus={trialStatus ? { isOnTrial: trialStatus.isOnTrial, daysRemaining: trialStatus.daysRemaining, isExpired: trialStatus.isExpired } : undefined}
        >
          {children}
        </AppShell>
      </CommandPaletteProvider>
    </DrawerProvider>
  );
}
