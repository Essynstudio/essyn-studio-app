// v2 checkout V4 editorial film studio warm identity 2026-02-25
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springDefault, springSnappy } from "../../../lib/motion-tokens";
import { ArrowLeft, CreditCard, QrCode, Check, ShieldCheck, Lock, Loader2, AlertCircle, ArrowRight, Copy } from "lucide-react";
import { SERIF, EASE, GOLD } from "../../../components/ui/editorial";

const P = "/v4";
type PayMethod = "pix" | "card";
const planData: Record<string, { name: string; monthly: number; yearly: number }> = {
  core: { name: "Core", monthly: 49, yearly: 39 },
  pro: { name: "Pro", monthly: 99, yearly: 79 },
  studio: { name: "Studio", monthly: 199, yearly: 159 },
};

export function CheckoutV4Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "pro";
  const billing = (searchParams.get("billing") || "yearly") as "monthly" | "yearly";
  const plan = planData[planId] || planData.pro;
  const price = billing === "monthly" ? plan.monthly : plan.yearly;

  const [payMethod, setPayMethod] = useState<PayMethod>("pix");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  const handleSubmit = (ev?: React.FormEvent | React.MouseEvent) => {
    if (ev) ev.preventDefault();
    if (payMethod === "card" && (!cardName || !cardNumber || !cardExp || !cardCvv)) {
      setError("Preencha todos os campos do cartão.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate(`${P}/sucesso?plan=${planId}&billing=${billing}&total=${price}&method=${payMethod}`);
    }, 1600);
  };

  const handleCopyPix = () => { setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); };

  return (
    <div style={{ background: "#F5F5F7" }} className="relative">
      {/* Film grain texture — editorial 1.8% */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.018]" aria-hidden="true">
        <svg width="100%" height="100%"><filter id="grainCheckout"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grainCheckout)" /></svg>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Link to={`${P}/planos`} className="inline-flex items-center gap-1.5 text-[13px] text-[#AEAEB2] hover:text-[#636366] transition-colors mb-8" style={{ fontWeight: 400 }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para planos
        </Link>

        <div className="grid lg:grid-cols-[1fr_340px] gap-10">
          <div>
            <h1 className="text-[24px] tracking-[-0.03em] text-[#111111] mb-8" style={{ fontWeight: 600, lineHeight: 1.2 }}>Checkout</h1>

            {/* Payment method */}
            <div className="mb-8">
              <span className="text-[12px] text-[#8E8E93] block mb-3" style={{ fontWeight: 600 }}>Metodo de pagamento</span>
              <div className="grid grid-cols-2 gap-3">
                {([{ id: "pix", label: "PIX", icon: QrCode, desc: "Aprovacao instantanea" }, { id: "card", label: "Cartao", icon: CreditCard, desc: "Debito recorrente" }] as const).map((m) => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)} className={`cursor-pointer flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 ${payMethod === m.id ? "border-[#E6E2DD] bg-[#FAFAF9] ring-1 ring-[#F5F3F1]" : "border-[#E5E5EA] bg-white hover:border-[#E5E5EA]"}`}>
                    <m.icon className={`w-5 h-5 ${payMethod === m.id ? "text-[#9C8B7A]" : "text-[#AEAEB2]"}`} />
                    <div className="text-left"><span className="text-[14px] text-[#111111] block" style={{ fontWeight: 500 }}>{m.label}</span><span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{m.desc}</span></div>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {payMethod === "pix" ? (
                <motion.div key="pix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springDefault}>
                  <div className="rounded-xl border border-[#E5E5EA] bg-white p-8" style={{ boxShadow: "0 1px 4px #F5F5F7" }}>
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-36 h-36 rounded-xl bg-[#FAFAFA] flex items-center justify-center mb-4"><QrCode className="w-14 h-14 text-[#D1D1D6]" /></div>
                      <p className="text-[14px] text-[#111111] mb-1" style={{ fontWeight: 500 }}>QR Code PIX</p>
                      <p className="text-[12px] text-[#8E8E93] mb-4" style={{ fontWeight: 400 }}>Escaneie ou copie o codigo</p>
                      <button onClick={handleCopyPix} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5EA] text-[12px] text-[#8E8E93] hover:text-[#636366] hover:border-[#E5E5EA] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
                        {pixCopied ? <><Check className="w-3.5 h-3.5 text-[#9C8B7A]" /> Codigo copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar codigo PIX</>}
                      </button>
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="group relative w-full flex items-center justify-center gap-2 text-[14px] py-3.5 rounded-full bg-[#111111] text-white overflow-hidden transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer" style={{ fontWeight: 500 }}>
                      <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: EASE }} />
                      <span className="relative z-10 flex items-center gap-2">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : <>Ja paguei via PIX <ArrowRight className="w-4 h-4" /></>}</span>
                    </button>
                    <p className="text-[11px] text-[#AEAEB2] text-center mt-3" style={{ fontWeight: 400 }}>O pagamento e verificado automaticamente em ate 30 segundos</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springDefault} onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {[
                    { label: "Nome no cartao", value: cardName, set: setCardName, ph: "Como esta no cartao" },
                    { label: "Numero do cartao", value: cardNumber, set: setCardNumber, ph: "0000 0000 0000 0000" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>{f.label}</label>
                      <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#111111] placeholder:text-[#C7C7CC] focus:border-[#D7D0C9] focus:bg-white focus:ring-2 focus:ring-[#F7F5F4] outline-none transition-all" style={{ fontWeight: 400 }} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Validade</label>
                      <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/AA" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#111111] placeholder:text-[#C7C7CC] focus:border-[#D7D0C9] focus:bg-white focus:ring-2 focus:ring-[#F7F5F4] outline-none transition-all" style={{ fontWeight: 400 }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>CVV</label>
                      <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="000" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#111111] placeholder:text-[#C7C7CC] focus:border-[#D7D0C9] focus:bg-white focus:ring-2 focus:ring-[#F7F5F4] outline-none transition-all" style={{ fontWeight: 400 }} />
                    </div>
                  </div>
                  <AnimatePresence>{error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[12px] text-[#FF3B30]" style={{ opacity: 0.7 }}><AlertCircle className="w-3.5 h-3.5" /> {error}</motion.div>}</AnimatePresence>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-6 mt-8">
              {[{ icon: ShieldCheck, t: "Criptografia SSL" }, { icon: Lock, t: "Conformidade LGPD" }].map((b) => (
                <div key={b.t} className="flex items-center gap-2"><b.icon className="w-3.5 h-3.5 text-[#D7D0C9]" /><span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{b.t}</span></div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-28 self-start">
            <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6" style={{ boxShadow: "0 2px 12px #F5F5F7" }}>
              <h3 className="text-[14px] text-[#111111] mb-5" style={{ fontWeight: 600 }}>Resumo</h3>
              <div className="flex items-center justify-between mb-3"><span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Plano {plan.name}</span><span className="text-[13px] text-[#111111]" style={{ fontWeight: 500 }}>R${price}/mes</span></div>
              <div className="flex items-center justify-between mb-3"><span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Ciclo</span><span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{billing === "yearly" ? "Anual" : "Mensal"}</span></div>
              {billing === "yearly" && <div className="flex items-center justify-between mb-3"><span className="text-[13px] text-[#B5A99E]" style={{ fontWeight: 400 }}>Economia anual</span><span className="text-[13px] text-[#9C8B7A]" style={{ fontWeight: 500 }}>-R${(planData[planId]?.monthly ?? 99 - (planData[planId]?.yearly ?? 79)) * 12}</span></div>}
              <div className="h-px bg-[#F2F2F7] my-4" />
              <div className="flex items-center justify-between mb-6"><span className="text-[14px] text-[#111111]" style={{ fontWeight: 600 }}>Total</span><span className="text-[22px] tracking-[-0.03em] text-[#111111]" style={{ fontWeight: 700 }}>R${price}<span className="text-[12px] text-[#AEAEB2] ml-1" style={{ fontWeight: 400 }}>/mes</span></span></div>
              {payMethod === "card" && (
                <button onClick={handleSubmit} disabled={loading} className="group relative w-full flex items-center justify-center gap-2 text-[14px] py-3.5 rounded-full bg-[#111111] text-white overflow-hidden transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer" style={{ fontWeight: 500 }}>
                  <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: EASE }} />
                  <span className="relative z-10 flex items-center gap-2">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <>Assinar agora <ArrowRight className="w-4 h-4" /></>}</span>
                </button>
              )}
              <p className="text-[11px] text-[#AEAEB2] mt-4 text-center" style={{ fontWeight: 400, lineHeight: 1.5 }}>Cancele a qualquer momento. Sem multa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}