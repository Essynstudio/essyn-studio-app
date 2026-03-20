"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "motion/react";
import { Check, Loader2, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface InviteData {
  id: string;
  token: string;
  name: string;
  email: string;
  role: string;
  studio_name: string;
  permissions: { modules?: string[] };
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  fotografo: "Fotógrafo",
  editor: "Editor",
  atendimento: "Atendimento",
  financeiro: "Financeiro",
  contador: "Contador",
};

export function ConviteClient({ tokenPromise }: { tokenPromise: Promise<{ token: string }> }) {
  const { token } = use(tokenPromise);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "invite" | "signup" | "accepting" | "done" | "error">("loading");

  const [signupForm, setSignupForm] = useState({ password: "", confirm: "" });
  const [signingUp, setSigningUp] = useState(false);

  // Load invite data
  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/team/invite?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Convite inválido");
          setStep("error");
          return;
        }
        setInvite(data.invite);

        // Check if user is already logged in
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Auto-accept if already logged in
          setStep("accepting");
          await acceptInvite(token);
        } else {
          setStep("signup");
        }
      } catch {
        setError("Erro ao carregar convite");
        setStep("error");
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function acceptInvite(t: string) {
    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao aceitar convite");
        setStep("error");
        return;
      }
      setStep("done");
      toast.success("Convite aceito!");
      setTimeout(() => router.push("/iris"), 2000);
    } catch {
      setError("Erro ao aceitar convite");
      setStep("error");
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    if (signupForm.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (signupForm.password !== signupForm.confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSigningUp(true);
    const supabase = createClient();

    // Try signup
    const { error: signupError } = await supabase.auth.signUp({
      email: invite.email,
      password: signupForm.password,
      options: { data: { name: invite.name } },
    });

    if (signupError) {
      // If user already exists, try login
      if (signupError.message.includes("already registered")) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password: signupForm.password,
        });
        if (loginError) {
          toast.error("Email já registrado. Use sua senha existente.");
          setSigningUp(false);
          return;
        }
      } else {
        toast.error(signupError.message);
        setSigningUp(false);
        return;
      }
    }

    // Accept invite
    setStep("accepting");
    await acceptInvite(token);
    setSigningUp(false);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--card)] rounded-2xl shadow-lg overflow-hidden">
          {/* Gold bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#A58D66] via-[#C2AD90] to-[#A58D66]" />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#F0F0F0]">
            <span className="font-serif text-[22px] font-light text-[var(--fg)] tracking-[-0.5px]">
              essyn.
            </span>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {step === "loading" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 size={28} className="animate-spin text-[#A58D66]" />
                <p className="text-[14px] text-[var(--fg-muted)] mt-4">Carregando convite...</p>
              </div>
            )}

            {step === "error" && (
              <div className="flex flex-col items-center py-8">
                <div className="w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--error)_10%,transparent)] flex items-center justify-center mb-4">
                  <AlertCircle size={24} className="text-[var(--error)]" />
                </div>
                <h2 className="text-[18px] font-semibold text-[var(--fg)] mb-2">Convite inválido</h2>
                <p className="text-[14px] text-[var(--fg-muted)] text-center">{error}</p>
                <button
                  onClick={() => router.push("/entrar")}
                  className="mt-6 px-6 py-3 rounded-xl bg-[var(--bg-ink)] text-white text-[14px] font-medium"
                >
                  Ir para login
                </button>
              </div>
            )}

            {step === "signup" && invite && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                    <Users size={20} className="text-[#A58D66]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-[var(--fg)]">
                      Você foi convidado!
                    </h2>
                    <p className="text-[13px] text-[var(--fg-muted)]">
                      Para <strong>{invite.studio_name}</strong> como {roleLabels[invite.role] || invite.role}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-subtle)] rounded-xl p-4 mb-6">
                  <p className="text-[12px] text-[var(--fg-muted)]">
                    <strong className="text-[var(--fg)]">{invite.name}</strong>, crie uma senha para acessar o sistema.
                    Seu email: <strong>{invite.email}</strong>
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[var(--fg-muted)] mb-1.5">Senha</label>
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--border)] text-[16px] sm:text-[14px] text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[var(--fg-muted)] mb-1.5">Confirmar senha</label>
                    <input
                      type="password"
                      value={signupForm.confirm}
                      onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Repita a senha"
                      required
                      className="w-full h-11 px-4 rounded-xl border border-[var(--border)] text-[16px] sm:text-[14px] text-[var(--fg)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={signingUp}
                    className="w-full h-12 rounded-xl bg-[var(--bg-ink)] text-white text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                  >
                    {signingUp ? (
                      <><Loader2 size={16} className="animate-spin" /> Criando conta...</>
                    ) : (
                      <><Check size={16} /> Aceitar convite</>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-[var(--fg-muted)] mt-4 text-center">
                  Já tem conta?{" "}
                  <button
                    onClick={() => router.push(`/entrar?returnUrl=/convite/${token}`)}
                    className="text-[#A58D66] hover:underline"
                  >
                    Fazer login
                  </button>
                </p>
              </>
            )}

            {step === "accepting" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 size={28} className="animate-spin text-[#A58D66]" />
                <p className="text-[14px] text-[var(--fg-muted)] mt-4">Aceitando convite...</p>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-14 h-14 rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)] flex items-center justify-center mb-4"
                >
                  <Check size={24} className="text-[var(--success)]" />
                </motion.div>
                <h2 className="text-[18px] font-semibold text-[var(--fg)] mb-2">Bem-vindo à equipe!</h2>
                <p className="text-[14px] text-[var(--fg-muted)]">Redirecionando para o sistema...</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[#B5AFA6] text-center mt-6">
          © 2026 Essyn Studio. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}
