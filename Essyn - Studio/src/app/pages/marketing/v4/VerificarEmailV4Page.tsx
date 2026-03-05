// VerificarEmailV4 — editorial film studio identity
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { springDefault } from "../../../lib/motion-tokens";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";

const INK = "#111111";

export function VerificarEmailV4Page() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "seu@email.com";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => { setResending(false); setResent(true); setTimeout(() => setResent(false), 3000); }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-6 py-16" style={{ background: "#F7F5F0" }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="w-full max-w-[400px] text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: "#F5F5F7", border: "1px solid #F2F2F7" }}>
          <Mail className="w-7 h-7" style={{ color: "#AEAEB2" }} />
        </div>

        <h1 className="text-[22px] tracking-[-0.02em] mb-3" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.3, color: INK }}>
          Verifique seu e-mail
        </h1>
        <p className="text-[14px] mb-1" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>Enviamos um link de confirmação para</p>
        <p className="text-[15px] mb-8" style={{ fontWeight: 500, color: INK }}>{email}</p>

        <div className="rounded-xl border p-5 mb-8 text-left" style={{ background: "#FFFFFF", borderColor: "#F2F2F7" }}>
          {["Abra seu e-mail e encontre a mensagem do ESSYN", 'Clique no link "Confirmar e-mail"', "Pronto! Sua conta estará ativada"].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${GOLD}12` }}>
                <span className="text-[11px]" style={{ fontWeight: 600, color: GOLD }}>{i + 1}</span>
              </div>
              <span className="text-[13px]" style={{ fontWeight: 400, lineHeight: 1.5, color: "#8E8E93" }}>{step}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/v4/boas-vindas")} className="group relative w-full inline-flex items-center justify-center gap-2 text-white text-[14px] py-3.5 rounded-full overflow-hidden cursor-pointer" style={{ fontWeight: 500, background: INK }}>
          <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
          <span className="relative z-10 flex items-center gap-2">Já confirmei, abrir ESSYN <ArrowRight className="w-4 h-4" /></span>
        </button>

        <button onClick={handleResend} disabled={resending} className="w-full inline-flex items-center justify-center gap-2 text-[13px] py-3 mt-2 disabled:opacity-50 transition-colors cursor-pointer" style={{ fontWeight: 400, color: "#AEAEB2" }}>
          {resending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reenviando...</> : resent ? "E-mail reenviado" : "Não recebeu? Reenviar e-mail"}
        </button>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/v4/entrar" className="text-[11px] transition-colors" style={{ fontWeight: 400, color: "#AEAEB2" }}>Voltar para login</Link>
        </div>
      </motion.div>
    </div>
  );
}