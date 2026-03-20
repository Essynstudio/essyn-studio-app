import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerificarEmailPage() {
  return (
    <div className="text-center">
      {/* Mobile logo */}
      <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-[#C2AD90]/40 flex items-center justify-center relative">
          <div className="absolute inset-[3px] rounded-full border border-[#C2AD90]/20" />
          <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[#2C444D] tracking-[0.05em] relative z-10">ES</span>
        </div>
        <span className="flex items-baseline gap-[5px]">
          <span className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold text-[var(--fg)] tracking-[0.14em] uppercase">ESSYN</span>
          <span className="text-[8px] text-[#A58D66] self-center">&middot;</span>
          <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.22em] uppercase">STUDIO</span>
        </span>
      </div>

      <div className="mx-auto w-16 h-16 rounded-full bg-[var(--info-subtle)] flex items-center justify-center mb-6">
        <Mail size={28} className="text-[var(--info)]" />
      </div>

      <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2">
        Verifique seu email
      </h2>
      <p className="text-sm text-[var(--fg-secondary)] mb-8 max-w-xs mx-auto">
        Enviamos um link de confirmação para o seu email. Clique no link para
        ativar sua conta.
      </p>

      <div className="space-y-3">
        <Link
          href="/entrar"
          className="block w-full h-12 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold hover:bg-[#1E3239] active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#A58D66] focus-visible:ring-offset-2"
        >
          Ir para o login
        </Link>
      </div>

      <p className="mt-6 text-xs text-[var(--fg-muted)]">
        Não recebeu? Verifique a pasta de spam ou{" "}
        <Link href="/criar-conta" className="text-[var(--accent)] hover:underline">
          tente novamente
        </Link>
        .
      </p>
    </div>
  );
}
