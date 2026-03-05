// v2 entrar V4 editorial film studio warm identity 2026-02-25
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springSnappy } from "../../../lib/motion-tokens";
import gsap from "gsap";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { SERIF, EASE, GOLD } from "../../../components/ui/editorial";
import heroRenaissance from "figma:asset/e7f46b7d315e7cdf071580dadff840c13a62757d.png";

const P = "/v4";
const serif = SERIF;

export function EntrarV4Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-auth-el]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.2 });
    }, formRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Preencha todos os campos."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/dashboard"); }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 relative">
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.012]" aria-hidden="true">
        <svg width="100%" height="100%"><filter id="grainEntrar"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grainEntrar)" /></svg>
      </div>

      <div ref={formRef} className="flex items-center justify-center px-6 py-16 lg:py-0">
        <div className="w-full max-w-[380px]">
          <div data-auth-el className="flex items-center gap-1.5 mb-10">
            <span className="text-[18px] tracking-[-0.06em] text-[#111111]" style={{ fontWeight: 700 }}>ESSYN</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          </div>
          <h1 data-auth-el className="text-[24px] tracking-[-0.03em] text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.2 }}>Bem-vindo de volta</h1>
          <p data-auth-el className="text-[14px] text-[#8E8E93] mb-8" style={{ fontWeight: 400, lineHeight: 1.6 }}>Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div data-auth-el className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>E-mail</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="seu@email.com" disabled={loading} autoFocus className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#111111] placeholder:text-[#C7C7CC] focus:border-[#D7D0C9] focus:bg-white focus:ring-2 focus:ring-[#F7F5F4] outline-none transition-all" style={{ fontWeight: 400 }} />
            </div>
            <div data-auth-el className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Senha</label>
                <Link to={`${P}/esqueci-senha`} className="text-[11px] text-[#AEAEB2] hover:text-[#B5A99E] transition-colors" style={{ fontWeight: 400 }}>Esqueceu?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" disabled={loading} className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#111111] placeholder:text-[#C7C7CC] focus:border-[#D7D0C9] focus:bg-white focus:ring-2 focus:ring-[#F7F5F4] outline-none transition-all" style={{ fontWeight: 400 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C7C7CC] hover:text-[#8E8E93] transition-colors cursor-pointer">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springSnappy} className="flex items-center gap-2 text-[12px] text-[#FF3B30]" style={{ opacity: 0.7 }}><AlertCircle className="w-3.5 h-3.5" /> {error}</motion.div>
              )}
            </AnimatePresence>
            <button data-auth-el type="submit" disabled={loading} className="group relative w-full flex items-center justify-center gap-2 text-[14px] py-3.5 rounded-full bg-[#111111] text-white overflow-hidden transition-transform duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer" style={{ fontWeight: 500 }}>
              <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: EASE }} />
              <span className="relative z-10 flex items-center gap-2">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : <>Entrar <ArrowRight className="w-4 h-4" /></>}</span>
            </button>
          </form>
          <p data-auth-el className="text-[13px] text-[#8E8E93] mt-8 text-center" style={{ fontWeight: 400 }}>Nao tem conta? <Link to={`${P}/criar-conta`} className="text-[#636366] hover:text-[#48484A] transition-colors" style={{ fontWeight: 500 }}>Criar conta</Link></p>
          <p data-auth-el className="text-[11px] text-[#AEAEB2] mt-6 text-center" style={{ fontWeight: 400, lineHeight: 1.5 }}>Ao entrar, voce concorda com os <a href="#termos" onClick={(e) => e.preventDefault()} className="underline">Termos</a> e <a href="#privacidade" onClick={(e) => e.preventDefault()} className="underline">Privacidade</a>.</p>
        </div>
      </div>
      <div className="hidden lg:block relative overflow-hidden" style={{ background: "#1a1814" }}>
        <ImageWithFallback src={heroRenaissance} alt="" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111111 0%, transparent 60%)", opacity: 0.75 }} />
        <div className="absolute bottom-16 left-10 right-10 z-10">
          <p className="text-[clamp(20px,2.2vw,32px)] tracking-[-0.03em] text-[#AEAEB2] mb-2" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.15 }}>Menos planilha.<br /><span className="italic" style={{ color: "#504840" }}>Mais fotografia.</span></p>
          <p className="text-[11px] text-[#636366]" style={{ fontWeight: 400 }}>O sistema operacional do fotógrafo de eventos</p>
        </div>
      </div>
    </div>
  );
}