"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Crown, Check, ArrowRight } from "lucide-react";
import { PLANS, type PlanId, formatPrice } from "@/lib/plans";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanId;
  blockedFeature?: string;
}

const PLAN_HIGHLIGHTS: Record<string, { features: string[]; color: string }> = {
  pro: {
    color: "#2C444D",
    features: [
      "Projetos e clientes ilimitados",
      "CRM Pipeline com 7 estágios",
      "Financeiro completo (receitas + despesas)",
      "Contratos digitais com assinatura",
      "Produção kanban com workflows",
      "Relatórios com 16+ gráficos",
      "Iris IA com 50 msgs/dia",
      "Portal do cliente sem marca Essyn",
      "Até 3 membros na equipe",
    ],
  },
  studio: {
    color: "#6B5B8D",
    features: [
      "Tudo do Pro",
      "200 GB de armazenamento",
      "Iris IA sem limite",
      "Até 10 membros na equipe",
      "Integração WhatsApp",
      "Loja de produtos",
      "10 automações",
      "Domínio personalizado no portal",
      "Suporte prioritário 24h",
    ],
  },
  business: {
    color: "#A58D66",
    features: [
      "Tudo do Studio",
      "500 GB de armazenamento",
      "Equipe ilimitada",
      "API + Webhooks",
      "Automações ilimitadas",
      "Loja avançada",
      "Suporte dedicado com call mensal",
    ],
  },
};

export function UpgradeModal({ open, onClose, currentPlan, blockedFeature }: UpgradeModalProps) {
  // Determine which plan to recommend
  const recommendedPlan: PlanId = currentPlan === "starter" ? "pro" : currentPlan === "pro" ? "studio" : "business";
  const plan = PLANS[recommendedPlan];
  const highlights = PLAN_HIGHLIGHTS[recommendedPlan] || PLAN_HIGHLIGHTS.pro;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors">
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${highlights.color}15` }}>
                    <Crown size={20} style={{ color: highlights.color }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[var(--fg)]">
                      Upgrade para {plan.name}
                    </h3>
                    <p className="text-[13px] text-[var(--fg-muted)]">
                      {formatPrice(recommendedPlan, "monthly")}/mês · 7 dias grátis
                    </p>
                  </div>
                </div>
                {blockedFeature && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--warning,#C87A20)]/[0.06] border border-[var(--warning)]/10">
                    <p className="text-[12px] text-[var(--warning,#C87A20)]">
                      <strong>{blockedFeature}</strong> está disponível a partir do plano {plan.name}.
                    </p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="px-6 pb-4">
                <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
                  O que você desbloqueia
                </p>
                <ul className="space-y-2">
                  {highlights.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={14} className="shrink-0 mt-0.5" style={{ color: highlights.color }} />
                      <span className="text-[13px] text-[var(--fg-secondary)]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 space-y-2">
                <a
                  href="/configuracoes/assinatura"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: highlights.color }}
                >
                  Começar 7 dias grátis
                  <ArrowRight size={16} />
                </a>
                <button
                  onClick={onClose}
                  className="w-full text-center text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors py-1.5"
                >
                  Continuar no plano {PLANS[currentPlan].name}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
