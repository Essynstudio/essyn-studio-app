// EsqueciSenhaV4 — editorial film studio identity
import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springDefault, springSnappy } from "../../../lib/motion-tokens";
import { ArrowLeft, AlertCircle, Loader2, Mail } from "lucide-react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";

const INK = "#111111";

export function EsqueciSenhaV4Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("E-mail inválido."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-6 py-16" style={{ background: "#F7F5F0" }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="w-full max-w-[380px]">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springDefault}>
              <Link to="/v4/entrar" className="inline-flex items-center gap-1.5 text-[13px] transition-colors mb-10" style={{ fontWeight: 400, color: "#AEAEB2" }}>
                <ArrowLeft className="w-4 h-4" /> Voltar para login
              </Link>

              <h1 className="text-[20px] tracking-[-0.02em] mb-2" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.3, color: INK }}>
                Esqueceu sua senha?
              </h1>
              <p className="text-[14px] mb-8" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>
                Informe seu e-mail
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px]" style={{ fontWeight: 500, color: "#8E8E93" }}>E-mail</label>
                  <input
                    type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="seu@email.com" disabled={loading} autoFocus
                    className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all"
                    style={{ borderColor: "#E5E5EA", background: "#FAFAFA", color: INK, fontWeight: 400 }}
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={springSnappy} className="flex items-center gap-1.5 text-[12px] text-[#FF3B30]" style={{ opacity: 0.7 }}>
                        <AlertCircle className="w-3.5 h-3.5" /> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button type="submit" disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 text-[14px] py-3.5 rounded-full text-white overflow-hidden disabled:opacity-50 cursor-pointer"
                  style={{ fontWeight: 500, background: INK }}
                >
                  <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
                  <span className="relative z-10">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar link de redefinição"}</span>
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${GOLD}10`, border: `2px solid ${GOLD}20` }}>
                <Mail className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <h2 className="text-[20px] tracking-[-0.02em] mb-2" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.3, color: INK }}>E-mail enviado!</h2>
              <p className="text-[14px] mb-8" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>
                Enviamos
              </p>
              <Link to="/v4/entrar" className="group relative inline-flex items-center justify-center gap-2 text-white text-[14px] px-8 py-3.5 rounded-full overflow-hidden transition-colors" style={{ fontWeight: 500, background: INK }}>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
                <span className="relative z-10">Voltar para login</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}