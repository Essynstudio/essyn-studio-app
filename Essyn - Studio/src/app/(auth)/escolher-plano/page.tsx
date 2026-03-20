"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, type PlanId, type PlanInterval } from "@/lib/plans";
import { Check, Loader2 } from "lucide-react";

/* ── Plan card data (only paid plans) ── */
const PAID_PLANS: { id: PlanId; badge?: string; features: string[] }[] = [
  {
    id: "pro",
    badge: "Mais escolhido",
    features: [
      "Projetos e clientes ilimitados",
      "CRM + Contratos + Produção",
      "50 msgs Iris IA / dia",
      "Portal whitelabel",
      "50 GB armazenamento",
    ],
  },
  {
    id: "studio",
    features: [
      "Tudo do Pro, mais:",
      "Iris IA ilimitada",
      "WhatsApp integrado",
      "Loja de produtos",
      "200 GB + 3 marcas",
      "Até 10 membros + permissões",
    ],
  },
  {
    id: "business",
    features: [
      "Tudo do Studio, mais:",
      "Loja avancada + API/Webhooks",
      "Domínio próprio no portal",
      "Equipe e marcas ilimitadas",
      "500 GB + onboarding dedicado",
    ],
  },
];

export default function EscolherPlanoPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>("pro");
  const [interval, setInterval] = useState<PlanInterval>("monthly");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  async function handleSelectPlan() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/entrar");
        return;
      }

      const { error } = await supabase
        .from("studios")
        .update({
          plan: selected,
          plan_interval: interval,
          plan_started_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

      if (error) throw error;
      router.push("/iris");
    } catch {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      router.push("/iris");
    } catch {
      setSkipping(false);
    }
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-[#C2AD90]/40 flex items-center justify-center relative">
          <div className="absolute inset-[3px] rounded-full border border-[#C2AD90]/20" />
          <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[#2C444D] tracking-[0.05em] relative z-10">
            ES
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em]">
          Escolha seu plano
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1.5 leading-relaxed">
          Teste qualquer plano por 7 dias. Cartao necessario. Cancele quando quiser.
        </p>
      </div>

      {/* Interval toggle */}
      <div className="flex items-center justify-center lg:justify-start gap-0 mb-6">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={`px-4 py-2 rounded-l-xl text-[12px] font-medium tracking-[0.02em] transition-all border ${
            interval === "monthly"
              ? "bg-[#2C444D] text-white border-[#2C444D]"
              : "bg-[var(--bg-elevated)] text-[var(--fg-muted)] border-[var(--border)] hover:text-[var(--fg-secondary)]"
          }`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setInterval("annual")}
          className={`px-4 py-2 rounded-r-xl text-[12px] font-medium tracking-[0.02em] transition-all border border-l-0 flex items-center gap-1.5 ${
            interval === "annual"
              ? "bg-[#2C444D] text-white border-[#2C444D]"
              : "bg-[var(--bg-elevated)] text-[var(--fg-muted)] border-[var(--border)] hover:text-[var(--fg-secondary)]"
          }`}
        >
          Anual
          <span
            className={`text-[10px] font-semibold ${
              interval === "annual" ? "text-[#C2AD90]" : "text-[#C2AD90]"
            }`}
          >
            -22%
          </span>
        </button>
      </div>

      {/* Plan cards — stacked */}
      <div className="space-y-3 mb-6">
        {PAID_PLANS.map(({ id, badge, features }) => {
          const plan = PLANS[id];
          const price = plan.price[interval];
          const isSelected = selected === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[#2C444D] bg-[#2C444D]/[0.03] ring-1 ring-[#2C444D]/20"
                  : "border-[var(--border)] bg-[var(--bg-elevated)]/50 hover:border-[var(--fg-muted)]/30"
              }`}
            >
              {/* Badge */}
              {badge && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-[#C2AD90] text-white text-[9px] font-semibold tracking-[0.06em] uppercase">
                  {badge}
                </span>
              )}

              {/* Top row: name + radio + price */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "border-[#2C444D] bg-[#2C444D]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {isSelected && (
                      <Check size={11} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="font-[family-name:var(--font-playfair)] text-[16px] font-semibold text-[var(--fg)]">
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-semibold text-[var(--fg)] tracking-[-0.02em]">
                    R$ {price}
                  </span>
                  <span className="text-[11px] text-[var(--fg-muted)]">/mes</span>
                </div>
              </div>

              {/* Trial badge */}
              <p className="text-[10px] text-[#C2AD90] font-medium mb-3 ml-[30px]">
                7 dias gratis para testar
              </p>

              {/* Features — compact grid */}
              <ul
                className={`space-y-1.5 ml-[30px] transition-all duration-200 ${
                  isSelected
                    ? "max-h-[300px] opacity-100"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                {features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-[12px] text-[var(--fg-secondary)] leading-snug"
                  >
                    <Check
                      size={13}
                      className="text-[#2C444D] shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    {feat}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSelectPlan}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold tracking-[-0.01em] hover:bg-[#1E3239] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[#A58D66] focus-visible:ring-offset-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Ativando plano...
          </>
        ) : (
          "Começar 7 dias grátis"
        )}
      </button>

      {/* Disclaimer */}
      <p className="text-[11px] text-center text-[var(--fg-muted)] mt-3 leading-relaxed">
        Ao continuar, você cadastrará seu cartão de crédito. Cobrança apenas após 7 dias.
      </p>

      {/* Skip link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleSkip}
          disabled={skipping}
          className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors underline underline-offset-2 decoration-[var(--fg-muted)]/30"
        >
          {skipping ? "Redirecionando..." : "Continuar com Starter gratis"}
        </button>
      </div>
    </div>
  );
}
