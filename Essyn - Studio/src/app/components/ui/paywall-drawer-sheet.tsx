import type { ReactNode } from "react";
import {
  Lock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./sheet";
import { TagPill } from "./tag-pill";

/* ═══════════════════════════════════════════════════ */
/*  PaywallDrawerSheet — Right drawer (520px)          */
/*  For: module blocked by plan                        */
/*  CTA primary always black — navigates to            */
/*  Configurações > Assinatura & Faturas               */
/*  Colors only in badges/tags/banners                 */
/*  Ref: P21 Paywall Pattern (extracted to /ui/)       */
/* ═══════════════════════════════════════════════════ */

import { springStiff, withDelay } from "../../lib/motion-tokens";

/* ═══════════════════════════════════════════════════ */

const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.05);

/* ── Plan types ── */

export type PlanTier = "core" | "pro" | "studio";

export interface PlanInfo {
  tier: PlanTier;
  label: string;
  price: number;
  priceSuffix: string;
  features: string[];
  highlighted?: boolean;
}

export const plans: Record<PlanTier, PlanInfo> = {
  core: {
    tier: "core",
    label: "Core",
    price: 49,
    priceSuffix: "/mês",
    features: [
      "5 projetos/mês",
      "1 usuário",
      "10 GB storage",
      "Galeria básica",
    ],
  },
  pro: {
    tier: "pro",
    label: "Pro",
    price: 129,
    priceSuffix: "/mês",
    features: [
      "20 projetos/mês",
      "3 usuários",
      "50 GB storage",
      "Galeria + Proofing",
      "Financeiro completo",
    ],
    highlighted: true,
  },
  studio: {
    tier: "studio",
    label: "Studio Pro",
    price: 249,
    priceSuffix: "/mês",
    features: [
      "Projetos ilimitados",
      "10 usuários",
      "100 GB storage",
      "Tudo incluso",
      "Equipe & Permissões",
      "Relatórios avançados",
    ],
  },
};

/* ── Benefit item ── */

export interface PaywallBenefit {
  icon: ReactNode;
  title: string;
  description: string;
}

/* ── Props ── */

export interface PaywallDrawerSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Feature identifier */
  featureKey: string;
  /** Module icon */
  moduleIcon: ReactNode;
  /** Module label */
  moduleLabel: string;
  /** Module description */
  moduleDescription: string;
  /** Current plan */
  currentPlan: PlanTier;
  /** Required plan to unlock */
  requiredPlan: PlanTier;
  /** Benefits list */
  benefits: PaywallBenefit[];
  /** Is this an add-on? */
  isAddon?: boolean;
  /** Add-on name */
  addonName?: string;
  /** Add-on price */
  addonPrice?: number;
  /** Primary CTA: navigate to Assinatura */
  onUpgrade: () => void;
  /** Secondary: "Ver planos" */
  onViewPlans?: () => void;
}

/* ── Plan badge ── */

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

/* ── Plan comparison row ── */

function PlanComparisonRow({
  plan,
  isCurrent,
  isTarget,
  onSelect,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  isTarget: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        isTarget
          ? "border-[#D1D1D6] bg-[#FAFAFA] shadow-[0_1px_3px_#F2F2F7]"
          : "border-[#E5E5EA] hover:border-[#D1D1D6]"
      }`}
    >
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] text-[#636366]"
            style={{ fontWeight: 500 }}
          >
            {plan.label}
          </span>
          {isCurrent && (
            <span
              className="text-[9px] text-[#AEAEB2] bg-[#F2F2F7] px-1.5 py-[1px] rounded"
              style={{ fontWeight: 500 }}
            >
              Atual
            </span>
          )}
          {isTarget && (
            <TagPill variant="success" size="xs">
              Recomendado
            </TagPill>
          )}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
          {plan.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="text-[10px] text-[#C7C7CC]"
              style={{ fontWeight: 400 }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-0.5 shrink-0">
        <span
          className="text-[16px] text-[#636366] numeric tracking-[-0.02em]"
          style={{ fontWeight: 600 }}
        >
          R$ {plan.price}
        </span>
        <span
          className="text-[10px] text-[#C7C7CC]"
          style={{ fontWeight: 400 }}
        >
          {plan.priceSuffix}
        </span>
      </div>
    </button>
  );
}

/* ── Main Component ── */

export function PaywallDrawerSheet({
  open,
  onOpenChange,
  moduleIcon,
  moduleLabel,
  moduleDescription,
  currentPlan,
  requiredPlan,
  benefits,
  isAddon = false,
  addonName,
  addonPrice,
  onUpgrade,
  onViewPlans,
}: PaywallDrawerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[520px] !max-w-[520px] p-0 gap-0 border-l border-[#E5E5EA] flex flex-col [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#F2F2F7] bg-gradient-to-b from-[#FAFAFA] to-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
              <span className="text-[#AEAEB2]">{moduleIcon}</span>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#C48A06]" />
                <span
                  className="text-[12px] text-[#C48A06]"
                  style={{ fontWeight: 500 }}
                >
                  {isAddon ? "Add-on necessário" : "Módulo bloqueado"}
                </span>
              </div>
              <SheetTitle
                className="text-[18px] text-[#48484A] tracking-[-0.01em]"
                style={{ fontWeight: 600 }}
              >
                {moduleLabel}
              </SheetTitle>
              <SheetDescription
                className="text-[12px] text-[#A8A7A6]"
                style={{ fontWeight: 400, lineHeight: "1.5" }}
              >
                {moduleDescription}
              </SheetDescription>
            </div>
          </div>
          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 w-7 h-7 rounded-lg flex items-center justify-center text-[#D1D1D6] hover:text-[#AEAEB2] hover:bg-[#F5F5F7] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Benefits */}
          <div className="flex flex-col gap-3">
            <span
              className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
              style={{ fontWeight: 600 }}
            >
              O que você desbloqueia
            </span>
            <div className="flex flex-col gap-2">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={springStagger(i)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-[0_1px_2px_#F2F2F7]">
                    <span className="text-[#AEAEB2]">{b.icon}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[12px] text-[#636366]"
                      style={{ fontWeight: 500 }}
                    >
                      {b.title}
                    </span>
                    <span
                      className="text-[11px] text-[#AEAEB2]"
                      style={{ fontWeight: 400 }}
                    >
                      {b.description}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Plans or Add-on */}
          {isAddon ? (
            <div className="flex flex-col gap-3">
              <span
                className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
                style={{ fontWeight: 600 }}
              >
                Add-on
              </span>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]">
                <div className="flex flex-col gap-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[14px] text-[#636366]"
                      style={{ fontWeight: 600 }}
                    >
                      {addonName}
                    </span>
                    <TagPill variant="purple" size="xs">
                      Add-on
                    </TagPill>
                  </div>
                  <span
                    className="text-[11px] text-[#AEAEB2]"
                    style={{ fontWeight: 400 }}
                  >
                    Cobrado junto com sua assinatura{" "}
                    {plans[currentPlan].label}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5 shrink-0">
                  <span
                    className="text-[20px] text-[#636366] numeric tracking-[-0.02em]"
                    style={{ fontWeight: 600 }}
                  >
                    +R$ {addonPrice}
                  </span>
                  <span
                    className="text-[11px] text-[#C7C7CC]"
                    style={{ fontWeight: 400 }}
                  >
                    /mês
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]"
                  style={{ fontWeight: 600 }}
                >
                  Escolha seu plano
                </span>
                <div className="flex items-center gap-1">
                  <PlanBadge tier={currentPlan} />
                  <ArrowRight className="w-3 h-3 text-[#D1D1D6]" />
                  <PlanBadge tier={requiredPlan} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(Object.values(plans) as PlanInfo[]).map((p) => (
                  <PlanComparisonRow
                    key={p.tier}
                    plan={p}
                    isCurrent={p.tier === currentPlan}
                    isTarget={p.tier === requiredPlan}
                    onSelect={onUpgrade}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F2F2F7] bg-[#FAFAFA] flex items-center gap-3">
          <button
            onClick={() => {
              onUpgrade();
              onOpenChange(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Sparkles className="w-4 h-4" />
            {isAddon
              ? `Ativar ${addonName}`
              : `Upgrade para ${plans[requiredPlan].label}`}
          </button>
          <button
            onClick={() => {
              (onViewPlans ?? onUpgrade)();
              onOpenChange(false);
            }}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer shrink-0"
            style={{ fontWeight: 500 }}
          >
            Ver planos
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}