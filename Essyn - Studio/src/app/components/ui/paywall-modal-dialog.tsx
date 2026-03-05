import type { ReactNode } from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { TagPill } from "./tag-pill";
import type { PlanTier } from "./paywall-drawer-sheet";
import { plans } from "./paywall-drawer-sheet";

/* ═══════════════════════════════════════════════════ */
/*  PaywallModalDialog — Centered modal (420px)        */
/*  For: specific action blocked by plan/add-on        */
/*  CTA primary always black                           */
/*  Colors only in badges/tags/banners                 */
/*  Ref: P21 Paywall Pattern (extracted to /ui/)       */
/* ═══════════════════════════════════════════════════ */

/* ── Plan badge (local) ── */

function PlanBadge({ tier }: { tier: PlanTier }) {
  const cfg: Record<PlanTier, { label: string; bg: string; text: string; border: string }> = {
    core: {
      label: "Core",
      bg: "bg-[#F2F2F7]",
      text: "text-[#AEAEB2]",
      border: "border-[#E5E5EA]",
    },
    pro: {
      label: "Pro",
      bg: "bg-[#F2F2F7]",
      text: "text-[#5B8AD6]",
      border: "border-[#E5E5EA]",
    },
    studio: {
      label: "Studio Pro",
      bg: "bg-[#F2F2F7]",
      text: "text-[#8B5CF6]",
      border: "border-[#E5E5EA]",
    },
  };
  const c = cfg[tier];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${c.bg} ${c.text} ${c.border}`}
      style={{ fontWeight: 600 }}
    >
      {c.label}
    </span>
  );
}

/* ── Props ── */

export interface PaywallModalDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Feature identifier */
  featureKey: string;
  /** Action label (e.g. "Exportar Relatório") */
  actionLabel?: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Current plan */
  currentPlan: PlanTier;
  /** Required plan to unlock */
  requiredPlan: PlanTier;
  /** Is this an add-on? */
  isAddon?: boolean;
  /** Add-on name */
  addonName?: string;
  /** Primary CTA: navigate to Assinatura */
  onUpgrade: () => void;
  /** Secondary: "Ver planos" */
  onViewPlans?: () => void;
}

/* ── Main Component ── */

export function PaywallModalDialog({
  open,
  onOpenChange,
  title,
  description,
  currentPlan,
  requiredPlan,
  isAddon = false,
  addonName,
  onUpgrade,
  onViewPlans,
}: PaywallModalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 rounded-2xl overflow-hidden border-[#E5E5EA]">
        <DialogHeader className="p-6 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#C48A06]" />
          </div>

          <div className="flex flex-col gap-1.5">
            <DialogTitle
              className="text-[16px] text-[#48484A] tracking-[-0.01em]"
              style={{ fontWeight: 600 }}
            >
              {title}
            </DialogTitle>
            <DialogDescription
              className="text-[13px] text-[#AEAEB2] max-w-[340px]"
              style={{ fontWeight: 400, lineHeight: "1.55" }}
            >
              {description}
            </DialogDescription>
          </div>

          {/* Plan badges */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F2F2F7]">
            <PlanBadge tier={currentPlan} />
            <ArrowRight className="w-3 h-3 text-[#D1D1D6]" />
            {isAddon && addonName ? (
              <TagPill variant="purple" size="xs">
                {addonName}
              </TagPill>
            ) : (
              <PlanBadge tier={requiredPlan} />
            )}
          </div>
        </DialogHeader>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[#F2F2F7] bg-[#FAFAFA] flex flex-col gap-2 sm:flex-col">
          <button
            onClick={() => {
              onUpgrade();
              onOpenChange(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Sparkles className="w-4 h-4" />
            {isAddon ? `Ativar ${addonName}` : "Fazer upgrade"}
          </button>
          <DialogClose asChild>
            <button
              onClick={() => {
                (onViewPlans ?? onUpgrade)();
              }}
              className="w-full text-center text-[12px] text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer py-1"
              style={{ fontWeight: 400 }}
            >
              Ver todos os planos &rarr;
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}