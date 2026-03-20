"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

const inputCls = "w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[16px] sm:text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#2C444D]/20 focus:border-[#2C444D] transition-all";
const labelCls = "block text-[12px] font-medium text-[var(--fg-secondary)] mb-1.5";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function CriarContaPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allChecksPass = Object.values(passwordChecks).every(Boolean);
  const canSubmit = fullName.trim() && studioName.trim() && email.trim() && allChecksPass;

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          studio_name: studioName.trim(),
          phone: phone.replace(/\D/g, "") || null,
          instagram: instagram.trim().replace(/^@/, "") || null,
          city: city.trim() || null,
          state: state || null,
          slug: studioName
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Este email ja esta cadastrado. Tente fazer login.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/verificar-email");
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-[#C2AD90]/40 flex items-center justify-center relative">
          <div className="absolute inset-[3px] rounded-full border border-[#C2AD90]/20" />
          <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[#2C444D] tracking-[0.05em] relative z-10">ES</span>
        </div>
        <span className="flex items-baseline gap-[5px]">
          <span className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold text-[var(--fg)] tracking-[0.14em] uppercase">ESSYN</span>
          <span className="text-[8px] text-[#A58D66] self-center">·</span>
          <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.22em] uppercase">STUDIO</span>
        </span>
      </div>

      <div className="text-center lg:text-left">
        <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em]">
          Crie sua conta
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-8">
          Comece gratis. Sem cartao de credito.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--error-subtle)] text-[var(--error)] text-[13px]">
            {error}
          </div>
        )}

        {/* ── Dados pessoais ── */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium text-[var(--fg-muted)] tracking-[0.06em] uppercase">Seus dados</p>
          <div>
            <label htmlFor="fullName" className={labelCls}>Nome completo</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Julio Mendes" required autoFocus className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className={inputCls} />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-[var(--border)]" />

        {/* ── Estudio ── */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium text-[var(--fg-muted)] tracking-[0.06em] uppercase">Seu estúdio</p>
          <div>
            <label htmlFor="studio" className={labelCls}>Nome do estúdio</label>
            <input id="studio" type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Ex: Studio Mendes Fotografia" required className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={labelCls}>WhatsApp</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" className={inputCls} />
            </div>
            <div>
              <label htmlFor="instagram" className={labelCls}>Instagram</label>
              <input id="instagram" type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuinstagram" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelCls}>Cidade</label>
              <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" className={inputCls} />
            </div>
            <div>
              <label htmlFor="state" className={labelCls}>Estado</label>
              <select id="state" value={state} onChange={(e) => setState(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-[var(--border)]" />

        {/* ── Senha ── */}
        <div>
          <label htmlFor="password" className={labelCls}>Senha</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 8 caracteres" required className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="flex gap-4 mt-2.5">
              {[
                { key: "length" as const, label: "8+ caracteres" },
                { key: "upper" as const, label: "Maiuscula" },
                { key: "number" as const, label: "Numero" },
              ].map(({ key, label }) => (
                <div key={key} className={`flex items-center gap-1 text-[11px] ${passwordChecks[key] ? "text-[var(--success)]" : "text-[var(--fg-muted)]"}`}>
                  <Check size={10} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-12 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold tracking-[-0.01em] hover:bg-[#1E3239] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[#A58D66] focus-visible:ring-offset-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Criando conta...</> : "Criar conta grátis"}
        </button>

        <p className="text-[11px] text-center text-[var(--fg-muted)] leading-relaxed">
          Ao criar conta, você concorda com os{" "}
          <Link href="/termos" className="underline hover:text-[var(--fg-secondary)]">Termos de Uso</Link>{" "}
          e <Link href="/privacidade" className="underline hover:text-[var(--fg-secondary)]">Politica de Privacidade</Link>.
        </p>
      </form>

      <p className="mt-8 text-center text-[13px] text-[var(--fg-muted)]">
        Ja tem uma conta?{" "}
        <Link href="/entrar" className="text-[var(--accent)] font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
