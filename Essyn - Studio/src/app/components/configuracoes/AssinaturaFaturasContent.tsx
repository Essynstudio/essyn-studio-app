import { useState, type ReactNode } from "react";
import { SERIF } from "../ui/editorial";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  FolderKanban,
  Image,
  LoaderCircle,
  Lock,
  Package,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { TagPill } from "../ui/tag-pill";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";

/* ═══════════════════════════════════════════════════ */
/*  TYPES & CONSTANTS                                 */
/* ═══════════════════════════════════════════════════ */
// Cache refresh 2026-03-01

type ViewState = "ready" | "loading" | "empty" | "error";
type PlanTier = "core" | "pro" | "studio";
type PlanStatus = "ativo" | "cancelado" | "trial";
type BillingCycle = "mensal" | "anual";
type InvoiceStatus = "pago" | "pendente" | "falhou";

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  PLAN CONFIG                                       */
/* ═══════════════════════════════════════════════════ */

interface PlanConfig {
  label: string;
  price: { mensal: number; anual: number };
  features: string[];
  limits: { projects: number | null; users: number; storageGb: number };
}

const planConfigs: Record<PlanTier, PlanConfig> = {
  core: {
    label: "Core",
    price: { mensal: 49, anual: 470 },
    features: ["5 projetos/mês", "1 usuário", "10 GB", "Galeria básica"],
    limits: { projects: 5, users: 1, storageGb: 10 },
  },
  pro: {
    label: "Pro",
    price: { mensal: 129, anual: 1290 },
    features: ["20 projetos/mês", "3 usuários", "50 GB", "Galeria + proofing"],
    limits: { projects: 20, users: 3, storageGb: 50 },
  },
  studio: {
    label: "Studio Pro",
    price: { mensal: 249, anual: 2490 },
    features: ["Ilimitado", "10 usuários", "100 GB", "Tudo incluso"],
    limits: { projects: null, users: 10, storageGb: 100 },
  },
};

/* ── Plan tiers for drawer comparison ── */
const planTierOrder: PlanTier[] = ["core", "pro", "studio"];

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  icon: ReactNode;
}

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
}

const mockAddOns: AddOn[] = [
  { id: "addon-1", name: "Storage Extra", description: "+50 GB armazenamento", price: 29, active: true, icon: <Database className="w-4 h-4" /> },
  { id: "addon-2", name: "Assinatura Digital", description: "Contratos com assinatura eletrônica", price: 19, active: true, icon: <Shield className="w-4 h-4" /> },
  { id: "addon-3", name: "WhatsApp API", description: "Mensagens automáticas via WhatsApp", price: 39, active: false, icon: <Zap className="w-4 h-4" /> },
  { id: "addon-4", name: "Domínio Customizado", description: "galeria.seuestudio.com", price: 15, active: false, icon: <ExternalLink className="w-4 h-4" /> },
];

const mockInvoices: Invoice[] = [
  { id: "inv-001", date: "01 Fev 2026", description: "Studio Pro — Mensal", amount: 249, status: "pago" },
  { id: "inv-002", date: "01 Jan 2026", description: "Studio Pro — Mensal", amount: 249, status: "pago" },
  { id: "inv-003", date: "01 Dez 2025", description: "Studio Pro — Mensal + Storage Extra", amount: 278, status: "pago" },
  { id: "inv-004", date: "01 Nov 2025", description: "Studio Pro — Mensal", amount: 249, status: "pago" },
  { id: "inv-005", date: "01 Out 2025", description: "Pro — Mensal", amount: 129, status: "pago" },
  { id: "inv-006", date: "01 Set 2025", description: "Pro — Mensal", amount: 129, status: "falhou" },
];

const mockUsage = {
  projects: { used: 12, label: "Projetos este mês" },
  users: { used: 5, label: "Usuários ativos" },
  storage: { usedGb: 67.4, label: "Armazenamento" },
};

/* ═══════════════════════════════════════════════════ */
/*  PAYWALL DRAWER — embedded (P21 pattern)            */
/* ═══════════════════════════════════════════════════ */

type DrawerMode = "upgrade" | "addons";

interface PaywallDrawerScenario {
  moduleIcon: ReactNode;
  moduleLabel: string;
  moduleDescription: string;
  currentPlan: PlanTier;
  suggestedPlan: PlanTier;
  benefits: { icon: ReactNode; title: string; description: string }[];
}

const upgradeScenarios: Record<PlanTier, PaywallDrawerScenario | null> = {
  core: {
    moduleIcon: <Sparkles className="w-6 h-6" />,
    moduleLabel: "Upgrade de Plano",
    moduleDescription: "Desbloqueie mais projetos, usuários e funcionalidades avançadas para o seu estúdio.",
    currentPlan: "core",
    suggestedPlan: "pro",
    benefits: [
      { icon: <FolderKanban className="w-4 h-4" />, title: "20 projetos/mês", description: "4x mais projetos simultâneos" },
      { icon: <Users className="w-4 h-4" />, title: "3 usuários", description: "Convide membros para a equipe" },
      { icon: <DollarSign className="w-4 h-4" />, title: "Financeiro completo", description: "Fluxo de caixa, relatórios e conciliação" },
      { icon: <Image className="w-4 h-4" />, title: "Galeria + Proofing", description: "Prova digital com seleção de favoritos" },
    ],
  },
  pro: {
    moduleIcon: <Crown className="w-6 h-6" />,
    moduleLabel: "Upgrade para Studio Pro",
    moduleDescription: "O plano definitivo: projetos ilimitados, equipe completa e todas as funcionalidades do ESSYN.",
    currentPlan: "pro",
    suggestedPlan: "studio",
    benefits: [
      { icon: <FolderKanban className="w-4 h-4" />, title: "Projetos ilimitados", description: "Sem limite de projetos por mês" },
      { icon: <Users className="w-4 h-4" />, title: "10 usuários", description: "Equipe completa com permissões granulares" },
      { icon: <Database className="w-4 h-4" />, title: "100 GB storage", description: "2x mais armazenamento" },
      { icon: <BarChart3 className="w-4 h-4" />, title: "Relatórios avançados", description: "Métricas, projeções e dashboards" },
    ],
  },
  studio: null, // Already top tier
};

function PlanComparisonRow({
  tier,
  currentTier,
  suggestedTier,
  onSelect,
}: {
  tier: PlanTier;
  currentTier: PlanTier;
  suggestedTier: PlanTier;
  onSelect: () => void;
}) {
  const cfg = planConfigs[tier];
  const isCurrent = tier === currentTier;
  const isSuggested = tier === suggestedTier;
  
  const rowClasses = isSuggested
    ? "border-[#C7C7CC] bg-[#F2F2F7] shadow-[0_2px_8px_#E5E5EA]"
    : isCurrent
    ? "border-[#E5E5EA] bg-[#F2F2F7] opacity-60"
    : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]";
  
  const radioClasses = isSuggested 
    ? "border-[#1D1D1F] bg-[#1D1D1F]" 
    : "border-[#D1D1D6] bg-transparent";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={"w-full flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer text-left " + rowClasses}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[#636366]" style={{ fontWeight: 600 }}>
            {cfg.label}
          </span>
          {isCurrent && <TagPill variant="neutral" size="xs">Atual</TagPill>}
          {isSuggested && <TagPill variant="success" size="xs">Recomendado</TagPill>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {cfg.features.slice(0, 3).map((f) => (
            <span key={f} className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-0.5 shrink-0">
        <span className="text-[18px] text-[#636366] tabular-nums tracking-[-0.02em]" style={{ fontWeight: 600 }}>
          R$ {cfg.price.mensal}
        </span>
        <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>/mês</span>
      </div>
      <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors " + radioClasses}>
        {isSuggested && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

function PaywallDrawer({
  open,
  onOpenChange,
  mode,
  currentTier,
  addOns,
  onToggleAddon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: DrawerMode;
  currentTier: PlanTier;
  addOns: AddOn[];
  onToggleAddon: (id: string) => void;
}) {
  const scenario = upgradeScenarios[currentTier];
  const isUpgrade = mode === "upgrade" && scenario;

  const drawerTitle = isUpgrade ? scenario.moduleLabel : "Gerenciar Add-ons";
  const drawerDesc = isUpgrade
    ? scenario.moduleDescription
    : "Ative ou desative add-ons para expandir as funcionalidades do seu plano.";
  const drawerIcon = isUpgrade ? scenario.moduleIcon : <Package className="w-6 h-6" />;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[520px] !max-w-[520px] p-0 gap-0 border-l border-[#E5E5EA] flex flex-col [&>button]:hidden"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#F2F2F7] bg-gradient-to-b from-[#F2F2F7] to-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
              <span className="text-[#AEAEB2]">{drawerIcon}</span>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isUpgrade ? (
                  <Lock className="w-3.5 h-3.5 text-[#FF9500]" />
                ) : (
                  <Package className="w-3.5 h-3.5 text-[#AEAEB2]" />
                )}
                <span
                  className={"text-[12px] " + (isUpgrade ? "text-[#FF9500]" : "text-[#AEAEB2]")}
                  style={{ fontWeight: 500 }}
                >
                  {isUpgrade ? "Fazer upgrade" : "Add-ons disponíveis"}
                </span>
              </div>
              <SheetTitle className="text-[18px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
                {drawerTitle}
              </SheetTitle>
              <SheetDescription className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                {drawerDesc}
              </SheetDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 w-7 h-7 rounded-lg flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {isUpgrade && (
            <>
              {/* Benefits */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                  O que você desbloqueia
                </span>
                <div className="flex flex-col gap-2">
                  {scenario.benefits.map((b, i) => (
                    <motion.div
                      key={b.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={springStagger(i)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-[0_1px_2px_#F5F5F7]">
                        <span className="text-[#AEAEB2]">{b.icon}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] text-[#636366]" style={{ fontWeight: 500 }}>
                          {b.title}
                        </span>
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                          {b.description}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Plan comparison */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                    Escolha seu plano
                  </span>
                  <div className="flex items-center gap-1">
                    <TagPill variant="neutral" size="xs">{planConfigs[currentTier].label}</TagPill>
                    <ArrowRight className="w-3 h-3 text-[#D1D1D6]" />
                    <TagPill variant="success" size="xs">{planConfigs[scenario.suggestedPlan].label}</TagPill>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {planTierOrder.map((t) => (
                    <PlanComparisonRow
                      key={t}
                      tier={t}
                      currentTier={currentTier}
                      suggestedTier={scenario.suggestedPlan}
                      onSelect={() =>
                        toast("Plano selecionado", {
                          description: planConfigs[t].label + " — R$ " + planConfigs[t].price.mensal + "/mês (mock)",
                          duration: 2000,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Add-ons list (always shown for addons mode, also available in upgrade) */}
          {mode === "addons" && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                Add-ons disponíveis
              </span>
              <div className="flex flex-col gap-2">
                {addOns.map((addon, i) => {
                  const addonCardClasses = addon.active
                    ? "border-[#D1D1D6] bg-[#FAFAFA] shadow-[0_2px_6px_#F5F5F7]"
                    : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]";
                  const addonIconClasses = addon.active ? "bg-[#E5E5EA]" : "bg-[#F5F5F7]";
                  const addonIconColor = addon.active ? "text-[#AEAEB2]" : "text-[#D1D1D6]";
                  const addonNameColor = addon.active ? "text-[#636366]" : "text-[#AEAEB2]";
                  const addonRadioClasses = addon.active ? "border-[#1D1D1F] bg-[#1D1D1F]" : "border-[#D1D1D6] bg-transparent";
                  
                  return (
                    <motion.div
                      key={addon.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={springStagger(i)}
                      onClick={() => onToggleAddon(addon.id)}
                      className={"flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer " + addonCardClasses}
                    >
                      <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + addonIconClasses}>
                        <span className={addonIconColor}>
                          {addon.icon}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className={"text-[12px] truncate " + (addon.active ? "text-[#636366]" : "text-[#AEAEB2]")} style={{ fontWeight: 500 }}>
                          {addon.name}
                        </span>
                        <span className="text-[10px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>
                          {addon.description}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[14px] text-[#8E8E93] tabular-nums" style={{ fontWeight: 600 }}>
                          +R$ {addon.price}
                        </span>
                        <TagPill variant={addon.active ? "success" : "neutral"} size="xs">
                          {addon.active ? "Ativo" : "Inativo"}
                        </TagPill>
                      </div>
                      {/* Toggle indicator */}
                      <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors " + addonRadioClasses}>
                        {addon.active && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]">
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                  Total add-ons
                </span>
                <span className="text-[14px] text-[#636366] tabular-nums" style={{ fontWeight: 600 }}>
                  +R$ {addOns.filter((a) => a.active).reduce((s, a) => s + a.price, 0)}/mês
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[#F5F5F7] bg-[#FAFAFA] flex items-center gap-3">
          <button
            onClick={() => {
              if (isUpgrade && scenario) {
                toast.success("Upgrade iniciado", {
                  description: "Upgrade para " + planConfigs[scenario.suggestedPlan].label + " em processamento (mock)",
                  duration: 3000,
                });
              } else {
                toast.success("Add-ons atualizados", {
                  description: addOns.filter((a) => a.active).length + " add-ons ativos salvos (mock)",
                  duration: 2500,
                });
              }
              onOpenChange(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Sparkles className="w-4 h-4" />
            {isUpgrade && scenario
              ? "Upgrade para " + planConfigs[scenario.suggestedPlan].label
              : "Salvar alterações"}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer shrink-0"
            style={{ fontWeight: 500 }}
          >
            {isUpgrade ? "Ver planos" : "Fechar"}
            {isUpgrade && <ChevronRight className="w-3 h-3" />}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PLAN CARD                                          */
/* ═══════════════════════════════════════════════════ */

function PlanCard({
  tier,
  status,
  cycle,
  onUpgrade,
  onCancel,
  onToggleCycle,
}: {
  tier: PlanTier;
  status: PlanStatus;
  cycle: BillingCycle;
  onUpgrade: () => void;
  onCancel: () => void;
  onToggleCycle: () => void;
}) {
  const cfg = planConfigs[tier];
  const price = cfg.price[cycle];
  const statusCfg: Record<PlanStatus, { label: string; variant: "success" | "danger" | "info" }> = {
    ativo: { label: "Ativo", variant: "success" },
    cancelado: { label: "Cancelado", variant: "danger" },
    trial: { label: "Trial", variant: "info" },
  };
  const st = statusCfg[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-br from-white to-[#FAFAFA] overflow-hidden"
    >
      {/* Top bar accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#C7C7CC] via-[#E5E5EA] to-transparent" />

      <div className="p-6 flex flex-col gap-5">
        {/* Plan heading */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#E5E5EA] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#AEAEB2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[16px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
                  {cfg.label}
                </span>
                <TagPill variant={st.variant} size="xs">{st.label}</TagPill>
              </div>
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                Ciclo {cycle} · Renova 15 Mar 2026
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] text-[#48484A] tracking-[-0.03em] tabular-nums" style={{ fontWeight: 600 }}>
                R$ {price}
              </span>
              <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                /{cycle === "mensal" ? "mês" : "ano"}
              </span>
            </div>
            {cycle === "anual" && (
              <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>
                Economia de R$ {cfg.price.mensal * 12 - cfg.price.anual}/ano
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {cfg.features.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F5F7] text-[11px] text-[#AEAEB2]"
              style={{ fontWeight: 400 }}
            >
              <Check className="w-3 h-3 text-[#34C759]" />
              {f}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#F5F5F7]">
          {tier !== "studio" && (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fazer upgrade
            </button>
          )}
          <button
            onClick={onToggleCycle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Trocar para {cycle === "mensal" ? "anual" : "mensal"}
          </button>
          <div className="flex-1" />
          {status === "ativo" && (
            <button
              onClick={onCancel}
              className="text-[11px] text-[#FF3B30] hover:text-[#FF3B30] transition-colors cursor-pointer"
              style={{ fontWeight: 400, opacity: 0.6 }}
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  ADD-ONS SECTION                                   */
/* ═══════════════════════════════════════════════════ */

function AddOnsSection({
  addOns,
  onToggle,
  onManage,
}: {
  addOns: AddOn[];
  onToggle: (id: string) => void;
  onManage: () => void;
}) {
  const activeCount = addOns.filter((a) => a.active).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.08 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-[#636366] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Add-ons
          </span>
          <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            {activeCount} ativo{activeCount !== 1 ? "s" : ""} · Cobrado junto com a assinatura
          </span>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1 text-[11px] text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Gerenciar add-ons
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {addOns.map((addon, i) => (
          <motion.div
            key={addon.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springStagger(i)}
            className={"flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer " + (addon.active
                ? "border-[#E5E5EA] bg-white shadow-[0_1px_3px_#F5F5F7]"
                : "border-[#E5E5EA] bg-[#FAFAFA] hover:border-[#D1D1D6]")}
            onClick={() => onToggle(addon.id)}
          >
            <div className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + (addon.active ? "bg-[#E5E5EA]" : "bg-[#F5F5F7]")}>
              <span className={addon.active ? "text-[#AEAEB2]" : "text-[#D1D1D6]"}>
                {addon.icon}
              </span>
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
              <span className={"text-[12px] truncate " + (addon.active ? "text-[#636366]" : "text-[#AEAEB2]")} style={{ fontWeight: 500 }}>
                {addon.name}
              </span>
              <span className="text-[10px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>
                {addon.description}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-[12px] text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
                R$ {addon.price}
              </span>
              <TagPill variant={addon.active ? "success" : "neutral"} size="xs">
                {addon.active ? "Ativo" : "Inativo"}
              </TagPill>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PAYMENT METHOD                                     */
/* ═══════════════════════════════════════════════════ */

function PaymentMethodCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      className="flex flex-col gap-3"
    >
      <span className="text-[13px] text-[#636366] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
        Método de pagamento
      </span>

      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-[#E5E5EA] bg-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D1D1F] to-[#3C3C43] flex items-center justify-center shrink-0">
          <CreditCard className="w-4.5 h-4.5 text-[#AEAEB2]" />
        </div>
        <div className="flex flex-col gap-0 flex-1 min-w-0">
          <span className="text-[13px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>
            •••• •••• •••• 4289
          </span>
          <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            Visa · Expira 08/27
          </span>
        </div>
        <TagPill variant="success" size="xs">Principal</TagPill>
        <button
          onClick={() => toast("Atualizar cartão", { description: "Redirecionaria para o gateway de pagamento (mock)", duration: 2500 })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] bg-white text-[11px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Atualizar
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  USAGE BLOCK                                        */
/* ═══════════════════════════════════════════════════ */

function UsageBlock({ tier }: { tier: PlanTier }) {
  const limits = planConfigs[tier].limits;

  const items = [
    {
      icon: <FolderKanban className="w-4 h-4" />,
      label: mockUsage.projects.label,
      used: mockUsage.projects.used,
      total: limits.projects,
      unit: "",
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: mockUsage.users.label,
      used: mockUsage.users.used,
      total: limits.users,
      unit: "",
    },
    {
      icon: <Database className="w-4 h-4" />,
      label: mockUsage.storage.label,
      used: mockUsage.storage.usedGb,
      total: limits.storageGb,
      unit: " GB",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.16 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-[#636366] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Uso atual
          </span>
          <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            Limites do plano {planConfigs[tier].label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item, i) => {
          const pct = item.total === null ? 0 : (item.used / item.total) * 100;
          const isUnlimited = item.total === null;
          const isWarning = pct > 80;
          const isDanger = pct > 95;
          const widthValue = isUnlimited ? "15%" : Math.min(pct, 100) + "%";
          const bgColor = isDanger ? "bg-[#FF3B30]" : isWarning ? "bg-[#FF9500]" : "bg-[#D1D1D6]";
          const footerLabel = isUnlimited ? "Ilimitado" : pct.toFixed(0) + "% utilizado";

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springStagger(i)}
              className="flex flex-col gap-3 p-4 rounded-2xl border border-[#E5E5EA] bg-white"
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-[#C7C7CC]">{item.icon}</span>
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                  {item.label}
                </span>
              </div>

              {/* Numbers */}
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] text-[#636366] tabular-nums tracking-[-0.02em]" style={{ fontWeight: 600 }}>
                  {typeof item.used === "number" && !Number.isInteger(item.used)
                    ? item.used.toFixed(1)
                    : item.used}
                </span>
                <span className="text-[12px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>
                  {isUnlimited ? (
                    <>
                      {item.unit} / &infin;
                    </>
                  ) : (
                    <>
                      {item.unit} / {item.total}{item.unit}
                    </>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: widthValue }}
                  transition={{ ...spring, delay: 0.3 + i * 0.08 }}
                  className={"h-full rounded-full transition-colors " + bgColor}
                />
              </div>

              {/* Footer label */}
              <span className="text-[10px] tabular-nums" style={{ fontWeight: 400, color: isDanger ? "#FF3B30" : isWarning ? "#FF9500" : "#D1D1D6" }}>
                {footerLabel}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INVOICES TABLE                                     */
/* ═══════════════════════════════════════════════════ */

function InvoiceStatusPill({ status }: { status: InvoiceStatus }) {
  const cfg: Record<InvoiceStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    pago: { label: "Pago", variant: "success" },
    pendente: { label: "Pendente", variant: "warning" },
    falhou: { label: "Falhou", variant: "danger" },
  };
  const c = cfg[status];
  return <TagPill variant={c.variant} size="xs">{c.label}</TagPill>;
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.2 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-[#636366] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Histórico de faturas
          </span>
          <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            Últimas {invoices.length} cobranças
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E5E5EA]">
          <span className="w-24 text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC] shrink-0" style={{ fontWeight: 600 }}>
            Data
          </span>
          <span className="flex-1 text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
            Descrição
          </span>
          <span className="w-20 text-right text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
            Valor
          </span>
          <span className="w-16 text-center text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC]" style={{ fontWeight: 600 }}>
            Status
          </span>
          <span className="w-16 text-center text-[10px] uppercase tracking-[0.08em] text-[#C7C7CC] shrink-0" style={{ fontWeight: 600 }}>
            Fatura
          </span>
        </div>

        {/* Rows */}
        {invoices.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springStagger(i)}
            className="group flex items-center gap-4 px-4 py-3 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
          >
            <span className="w-24 text-[12px] text-[#AEAEB2] tabular-nums shrink-0" style={{ fontWeight: 400 }}>
              {inv.date}
            </span>
            <span className="flex-1 text-[12px] text-[#8E8E93] truncate" style={{ fontWeight: 400 }}>
              {inv.description}
            </span>
            <span className="w-20 text-right text-[13px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>
              R$ {inv.amount}
            </span>
            <span className="w-16 flex justify-center">
              <InvoiceStatusPill status={inv.status} />
            </span>
            <span className="w-16 flex justify-center shrink-0">
              <button
                onClick={() => toast("Download", { description: inv.id + ".pdf baixado (mock)", duration: 2000 })}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CANCEL DIALOG                                      */
/* ═══════════════════════════════════════════════════ */

function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
  planLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  planLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      onConfirm();
      setConfirming(false);
      onOpenChange(false);
    }, 1200);
  };

  const buttonClasses = confirming
    ? "bg-[#FF3B30] cursor-not-allowed"
    : "bg-[#FF3B30] hover:bg-[#FF3B30] active:scale-[0.98]";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px] p-0 gap-0 rounded-2xl overflow-hidden border-[#E5E5EA]">
        <AlertDialogHeader className="px-6 pt-6 pb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FBF5F4] flex items-center justify-center mb-3">
            <Trash2 className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <AlertDialogTitle className="text-[16px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
            Cancelar assinatura?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Ao cancelar, você perderá acesso ao plano {planLabel} e todos os add-ons ao final do ciclo atual (15 Mar 2026). Seus dados serão mantidos por 90 dias.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-6 pb-4">
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#FBF5F4] border border-[#F2DDD9]">
            <span className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
              O que acontece ao cancelar:
            </span>
            <ul className="flex flex-col gap-1">
              {[
                "Projetos existentes ficam em somente leitura",
                "Galerias públicas serão desativadas",
                "Add-ons são cancelados automaticamente",
                "Dados mantidos por 90 dias",
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <X className="w-3 h-3 text-[#FF3B30] mt-0.5 shrink-0" style={{ opacity: 0.5 }} />
                  <span className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 400, opacity: 0.7 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="px-6 py-4 border-t border-[#F5F5F7] bg-[#FAFAFA]">
          <AlertDialogCancel
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer h-auto"
            style={{ fontWeight: 500 }}
          >
            Manter assinatura
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={confirming}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white transition-all cursor-pointer h-auto " + buttonClasses}
            style={{ fontWeight: 500 }}
          >
            {confirming ? (
              <>
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                Cancelando…
              </>
            ) : (
              "Sim, cancelar assinatura"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  VIEW STATES                                        */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      {/* Plan skeleton */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
        <div className="h-[3px] bg-[#F5F5F7]" />
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#E5E5EA] animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-32 rounded-md bg-[#E5E5EA] animate-pulse" />
              <div className="h-3 w-48 rounded bg-[#F5F5F7] animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-28 rounded-lg bg-[#F5F5F7] animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Usage skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-[#E5E5EA] bg-white animate-pulse" />
        ))}
      </div>

      {/* Add-ons skeleton */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-[#E5E5EA] bg-white animate-pulse" />
        ))}
      </div>

      {/* Invoices skeleton */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#F5F5F7] last:border-b-0">
            <div className="h-3 w-20 rounded bg-[#E5E5EA] animate-pulse" />
            <div className="flex-1 h-3 rounded bg-[#F5F5F7] animate-pulse" />
            <div className="h-3 w-14 rounded bg-[#E5E5EA] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-4">
        <LoaderCircle className="w-4 h-4 text-[#E5E5EA] animate-spin" />
        <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          Carregando assinatura…
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onChoosePlan }: { onChoosePlan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
        <Crown className="w-7 h-7 text-[#E5E5EA]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[16px] text-[#636366]" style={{ fontWeight: 500 }}>
          Nenhuma assinatura ativa
        </span>
        <span className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]" style={{ fontWeight: 400 }}>
          Escolha um plano para começar a usar o ESSYN e desbloquear todas as funcionalidades.
        </span>
      </div>
      <button
        onClick={onChoosePlan}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <Zap className="w-3.5 h-3.5" />
        Escolher plano
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#FBF5F4] flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[16px] text-[#636366]" style={{ fontWeight: 500 }}>
          Erro ao carregar assinatura
        </span>
        <span className="text-[13px] text-[#C7C7CC] text-center max-w-[360px]" style={{ fontWeight: 400 }}>
          Não foi possível carregar os dados da sua assinatura. Tente novamente.
        </span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Tentar novamente
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                        */
/* ═══════════════════════════════════════════════════ */

interface AssinaturaFaturasContentProps {
  onBack: () => void;
}

export function AssinaturaFaturasContent({ onBack }: AssinaturaFaturasContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>(mockAddOns);

  /* Paywall Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("upgrade");

  /* mock current subscription */
  const [currentTier] = useState<PlanTier>("pro");
  const [currentStatus] = useState<PlanStatus>("ativo");
  const [currentCycle, setCurrentCycle] = useState<BillingCycle>("mensal");

  const handleToggleAddon = (id: string) => {
    const addon = addOns.find((a) => a.id === id);
    setAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    if (addon) {
      toast(addon.active ? "Add-on desativado" : "Add-on ativado", {
        description: addon.name + " foi " + (addon.active ? "removido" : "adicionado"),
        duration: 2500,
      });
    }
  };

  const handleCancelSubscription = () => {
    toast.error("Assinatura cancelada", {
      description: "Você terá acesso até 15 Mar 2026. Pode reativar a qualquer momento.",
      duration: 4000,
    });
  };

  const openUpgradeDrawer = () => {
    setDrawerMode("upgrade");
    setDrawerOpen(true);
  };

  const openAddonsDrawer = () => {
    setDrawerMode("addons");
    setDrawerOpen(true);
  };

  const activeAddonsCost = addOns.filter((a) => a.active).reduce((sum, a) => sum + a.price, 0);
  const totalMonthlyCost = planConfigs[currentTier].price[currentCycle] + activeAddonsCost;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1
              className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]"
              style={{ fontWeight: 700 }}
            >
              Assinatura & Faturas
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
              Gerencie plano, add-ons e histórico de pagamentos
            </span>
            {viewState === "ready" && (
              <>
                <span className="w-px h-3 bg-[#E5E5EA]" />
                <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  R$ {totalMonthlyCost}/mês
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* State toggles (dev) */}
          <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
            {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => {
              const toggleClasses = viewState === s
                ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]"
                : "text-[#C7C7CC] hover:text-[#8E8E93]";
              
              return (
                <button
                  key={s}
                  onClick={() => setViewState(s)}
                  className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + toggleClasses}
                  style={{ fontWeight: 500 }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <EmptyState onChoosePlan={openUpgradeDrawer} />
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <ErrorState onRetry={() => setViewState("ready")} />
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex flex-col gap-8"
          >
            {/* ── Plan card ── */}
            <PlanCard
              tier={currentTier}
              status={currentStatus}
              cycle={currentCycle}
              onUpgrade={openUpgradeDrawer}
              onCancel={() => setCancelOpen(true)}
              onToggleCycle={() => {
                const newCycle = currentCycle === "mensal" ? "anual" : "mensal";
                setCurrentCycle(newCycle);
                toast.success("Ciclo alterado", {
                  description: "Ciclo de cobrança alterado para " + newCycle + (newCycle === "anual" ? " — economia de R$ " + (planConfigs[currentTier].price.mensal * 12 - planConfigs[currentTier].price.anual) + "/ano" : ""),
                  duration: 3000,
                });
              }}
            />

            {/* ── Usage block ── */}
            <UsageBlock tier={currentTier} />

            {/* ── Add-ons ── */}
            <AddOnsSection addOns={addOns} onToggle={handleToggleAddon} onManage={openAddonsDrawer} />

            {/* ── Payment method ── */}
            <PaymentMethodCard />

            {/* ── Invoices ── */}
            <InvoicesTable invoices={mockInvoices} />

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_#F5F5F7]">
              <span className="text-[11px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
                Cobranças processadas via Stripe (mock). Dúvidas? financeiro@essyn.com
              </span>
              <span className="text-[11px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
                {mockInvoices.length} faturas · {addOns.filter((a) => a.active).length} add-ons
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Paywall Drawer ── */}
      <PaywallDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        currentTier={currentTier}
        addOns={addOns}
        onToggleAddon={handleToggleAddon}
      />

      {/* ── Cancel dialog ── */}
      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancelSubscription}
        planLabel={planConfigs[currentTier].label}
      />
    </div>
  );
}