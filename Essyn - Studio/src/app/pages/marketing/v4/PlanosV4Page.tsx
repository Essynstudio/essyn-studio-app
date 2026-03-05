// v1 planos V4 editorial film studio identity 2026-02-25
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springToggle, springDefault } from "../../../lib/motion-tokens";
import { Check, Minus, ArrowRight, ChevronDown, Image, Users, HardDrive, Zap } from "lucide-react";
import { GR, SERIF, EASE, INK, GOLD } from "../../../components/ui/editorial";

const serif = SERIF;
const ease = EASE;
const P = "/v4";

type BillingCycle = "monthly" | "yearly";
type PlanId = "core" | "pro" | "studio";

const plans = [
  { id: "core" as PlanId, name: "Core", tagline: "Para quem está começando", monthly: 49, yearly: 39, features: ["5 projetos ativos", "Produção + Agenda", "Galeria básica (3 coleções)", "5 GB storage", "1 usuário"] },
  { id: "pro" as PlanId, name: "Pro", tagline: "Para quem faz eventos toda semana", monthly: 99, yearly: 79, features: ["Projetos ilimitados", "Financeiro BR completo", "CRM + Pipeline", "20 GB storage", "2 usuários", "Relatórios"], recommended: true },
  { id: "studio" as PlanId, name: "Studio", tagline: "Para estúdios e equipes", monthly: 199, yearly: 159, features: ["Tudo do Pro", "Até 10 membros", "5 papéis + permissões", "50 GB storage", "Prioridade no suporte", "Automações"] },
];

const addOns = [
  { id: "galeria-pro", name: "Galeria Pro", price: 39, icon: Image, desc: "Galerias ilimitadas, domínio customizado e watermark" },
  { id: "equipe-extra", name: "Equipe Extra", price: 29, icon: Users, desc: "+5 membros adicionais com permissões" },
  { id: "storage-50", name: "+50 GB Storage", price: 19, icon: HardDrive, desc: "Armazenamento extra para fotos" },
  { id: "automacao-ia", name: "Automação & IA", price: 49, icon: Zap, desc: "Follow-up inteligente e sugestões automáticas" },
];

const comparison = [
  { feature: "Projetos ativos", core: "5", pro: "Ilimitado", studio: "Ilimitado" },
  { feature: "Produção (Workflow)", core: true, pro: true, studio: true },
  { feature: "Agenda operacional", core: true, pro: true, studio: true },
  { feature: "Galeria de entrega", core: "3 coleções", pro: "10 coleções", studio: "Ilimitado" },
  { feature: "Financeiro BR", core: false, pro: true, studio: true },
  { feature: "CRM + Pipeline", core: false, pro: true, studio: true },
  { feature: "Relatórios", core: false, pro: true, studio: true },
  { feature: "Usuários", core: "1", pro: "2", studio: "Até 10" },
  { feature: "Permissões granulares", core: false, pro: false, studio: true },
  { feature: "Storage", core: "5 GB", pro: "20 GB", studio: "50 GB" },
  { feature: "Suporte", core: "E-mail", pro: "E-mail + Chat", studio: "Prioritário" },
];

export function PlanosV4Page() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [activeAddOns, setActiveAddOns] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  const toggleAddOn = (id: string) => setActiveAddOns((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const plan = plans.find((p) => p.id === selectedPlan)!;
  const basePrice = billing === "monthly" ? plan.monthly : plan.yearly;
  const addOnsTotal = [...activeAddOns].reduce((s, id) => s + (addOns.find((a) => a.id === id)?.price ?? 0), 0);
  const total = basePrice + addOnsTotal;

  const handleCheckout = () => {
    const params = new URLSearchParams({ plan: selectedPlan, billing, addons: [...activeAddOns].join(",") });
    navigate(`${P}/checkout?${params.toString()}`);
  };

  return (
    <div style={{ background: "#F5F5F7" }}>
      {/* Hero */}
      <section className="relative pt-12 pb-20 px-6 text-center">

        <GR>
          <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Planos & Precos</span>
          <h1 data-g className="text-[clamp(32px,5vw,56px)] tracking-[-0.04em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.1 }}>
            Invista no controle<br /><span className="italic" style={{ color: "#C8BFB5" }}>do seu negocio</span>
          </h1>
          <p data-g className="text-[15px] text-[#636366] max-w-[420px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65 }}>
            Todos os planos incluem 14 dias gratis. Sem cartao de credito. Cancele quando quiser.
          </p>
        </GR>
      </section>

      {/* Toggle */}
      <div className="flex justify-center mb-12 px-6">
        <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
          {(["monthly", "yearly"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)} className={`relative px-5 py-2 rounded-full text-[13px] transition-all cursor-pointer ${billing === b ? "text-white" : "text-[#8E8E93]"}`} style={{ fontWeight: billing === b ? 500 : 400 }}>
              {billing === b && <motion.div layoutId="bpV4" className="absolute inset-0 bg-[#111111] rounded-full" transition={springToggle} style={{ zIndex: 0 }} />}
              <span className="relative z-10">{b === "monthly" ? "Mensal" : "Anual"}</span>
            </button>
          ))}
          {billing === "yearly" && <span className="px-2.5 py-1 rounded-full bg-[#F5F3F1] text-[11px] text-[#9C8B7A] ml-1" style={{ fontWeight: 600 }}>-20%</span>}
        </div>
      </div>

      {/* Plan cards */}
      <section className="max-w-[1100px] mx-auto px-6 mb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => {
            const selected = selectedPlan === p.id;
            return (
              <GR key={p.id} delay={i * 0.08}>
                <button
                  data-g
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full text-left cursor-pointer relative rounded-2xl border p-7 flex flex-col h-full transition-all duration-300 overflow-hidden ${
                    p.recommended && selected
                      ? "border-[#E6E2DD] bg-white shadow-[0_12px_40px_#F0EDEB]"
                      : selected
                        ? "border-[#E6E2DD] bg-white shadow-[0_8px_30px_#F2F2F7] ring-2 ring-[#E6E2DD]"
                        : "border-[#E5E5EA] bg-white hover:shadow-[0_4px_20px_#F5F5F7]"
                  }`}
                  style={{ boxShadow: selected ? undefined : "0 1px 4px #F5F5F7" }}
                >
                  {p.recommended && selected && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #CDC5BC, transparent)" }} />}
                  {p.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] text-white" style={{ fontWeight: 600, background: GOLD }}>RECOMENDADO</span>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>{p.tagline}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected ? "border-[#9C8B7A] bg-[#9C8B7A]" : "border-[#E5E5EA]"
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <h3 className="text-[22px] tracking-[-0.02em] mb-4 text-[#111111]" style={{ fontWeight: 600 }}>{p.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-[40px] tracking-[-0.04em] text-[#111111]" style={{ fontWeight: 700 }}>
                      R${billing === "monthly" ? p.monthly : p.yearly}
                    </span>
                    <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>/mes</span>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    {p.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? "text-[#9C8B7A]" : "text-[#D7D0C9]"}`} />
                        <span className="text-[13px] text-[#636366]" style={{ fontWeight: 400 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </button>
              </GR>
            );
          })}
        </div>
      </section>

      {/* Add-ons */}
      <section className="max-w-[1100px] mx-auto px-6 mb-20">
        <GR className="mb-8">
          <h3 data-g className="text-[18px] tracking-[-0.02em] text-[#111111]" style={{ fontWeight: 600 }}>Add-ons opcionais</h3>
          <p data-g className="text-[13px] text-[#8E8E93] mt-1" style={{ fontWeight: 400 }}>Amplie seu plano com modulos extras</p>
        </GR>
        <div className="grid sm:grid-cols-2 gap-4">
          {addOns.map((a) => {
            const active = activeAddOns.has(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleAddOn(a.id)}
                className={`cursor-pointer w-full text-left rounded-2xl border p-5 flex items-start gap-4 transition-all duration-300 ${
                  active ? "border-[#E6E2DD] bg-[#FAFAF9] ring-1 ring-[#F5F3F1]" : "border-[#E5E5EA] bg-white hover:border-[#E5E5EA]"
                }`}
                style={{ boxShadow: "0 1px 4px #F5F5F7" }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-[#F5F3F1] text-[#9C8B7A]" : "bg-[#F5F5F7] text-[#AEAEB2]"}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] text-[#111111]" style={{ fontWeight: 500 }}>{a.name}</span>
                    <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 500 }}>+R${a.price}/mes</span>
                  </div>
                  <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{a.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? "border-[#9C8B7A] bg-[#9C8B7A]" : "border-[#E5E5EA]"}`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Comparison toggle */}
      <section className="max-w-[1100px] mx-auto px-6 mb-20">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full flex items-center justify-between rounded-2xl border border-[#E5E5EA] bg-white px-6 py-4 cursor-pointer hover:border-[#E5E5EA] transition-all"
          style={{ boxShadow: "0 1px 4px #F5F5F7" }}
        >
          <span className="text-[14px] text-[#111111]" style={{ fontWeight: 500 }}>Ver comparativo detalhado</span>
          <ChevronDown className={`w-4 h-4 text-[#AEAEB2] transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showComparison && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springDefault} className="overflow-hidden">
              <div className="mt-4 rounded-2xl border border-[#E5E5EA] bg-white overflow-x-auto" style={{ boxShadow: "0 1px 4px #F5F5F7" }}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#F2F2F7]">
                      <th className="px-6 py-4 text-[13px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Recurso</th>
                      {plans.map((p) => (
                        <th key={p.id} className={`px-6 py-4 text-[13px] text-center ${selectedPlan === p.id ? "text-[#111111]" : "text-[#8E8E93]"}`} style={{ fontWeight: 600 }}>{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={i} className={i < comparison.length - 1 ? "border-b border-[#F5F5F7]" : ""}>
                        <td className="px-6 py-3.5 text-[13px] text-[#636366]" style={{ fontWeight: 400 }}>{row.feature}</td>
                        {(["core", "pro", "studio"] as const).map((p) => {
                          const v = row[p];
                          return (
                            <td key={p} className={`px-6 py-3.5 text-center text-[13px] ${selectedPlan === p ? "bg-[#FAFAF9]" : ""}`}>
                              {v === true ? <Check className="w-4 h-4 text-[#9C8B7A] mx-auto" /> :
                               v === false ? <Minus className="w-4 h-4 text-[#D1D1D6] mx-auto" /> :
                               <span className="text-[#8E8E93]" style={{ fontWeight: 400 }}>{v}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Sticky checkout bar */}
      <div className="sticky bottom-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 pb-6">
          <div className="rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] shadow-[0_-4px_30px_#F2F2F7] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] text-[#8E8E93] block" style={{ fontWeight: 500 }}>Plano selecionado</span>
                <span className="text-[16px] text-[#111111]" style={{ fontWeight: 600 }}>{plan.name}</span>
              </div>
              {activeAddOns.size > 0 && (
                <>
                  <span className="w-px h-8 bg-[#E5E5EA]" />
                  <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>+{activeAddOns.size} add-on{activeAddOns.size > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <span className="text-[24px] tracking-[-0.03em] text-[#111111]" style={{ fontWeight: 700 }}>R${total}</span>
                <span className="text-[12px] text-[#AEAEB2] ml-1" style={{ fontWeight: 400 }}>/mes</span>
              </div>
              <button
                onClick={handleCheckout}
                className="group relative inline-flex items-center gap-2 text-[14px] px-7 py-3.5 rounded-full bg-[#111111] text-white overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                style={{ fontWeight: 500, transitionTimingFunction: ease }}
              >
                <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: ease }} />
                <span className="relative z-10 flex items-center gap-2">Continuar <ArrowRight className="w-4 h-4" /></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-28" />
    </div>
  );
}