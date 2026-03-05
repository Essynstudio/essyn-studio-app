import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, User, Mail, Phone, Building2, Check } from "lucide-react";
import { toast } from "sonner";
import type { Cliente } from "./types";

interface NovoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cliente: Cliente) => void;
}

export function NovoClienteModal({ open, onClose, onSubmit }: NovoClienteModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nomeError, setNomeError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setNome("");
        setEmail("");
        setTelefone("");
        setEmpresa("");
        setNomeError("");
        setEmailError("");
      }, 200);
    }
  }, [open]);

  // Validação em tempo real
  useEffect(() => {
    if (nome.trim() && nomeError) setNomeError("");
  }, [nome, nomeError]);

  useEffect(() => {
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Email inválido");
      } else {
        setEmailError("");
      }
    } else if (emailError) {
      setEmailError("");
    }
  }, [email, emailError]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let hasError = false;

    if (!nome.trim()) {
      setNomeError("Nome é obrigatório");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Email inválido");
        hasError = true;
      }
    }

    if (hasError) return;

    setIsSubmitting(true);

    // Simular criação
    setTimeout(() => {
      const novoCliente: Cliente = {
        id: `cl-${Date.now()}`,
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || undefined,
        empresa: empresa.trim() || undefined,
      };

      onSubmit(novoCliente);
      setIsSubmitting(false);
      toast.success("Cliente criado!", { description: novoCliente.nome, duration: 2000 });
      onClose();
    }, 800);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-[#1D1D1F]"
        style={{ opacity: 0.4 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: "0 8px 32px #E5E5EA" }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between bg-white">
          <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
            Novo cliente
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Nome completo <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ana Oliveira"
                aria-required="true"
                aria-invalid={!!nomeError}
                aria-describedby={nomeError ? "nome-error" : undefined}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#D1D1D6] focus-visible:outline-none transition-all ${
                  nomeError
                    ? "border-[#FF3B30] ring-2 ring-[#F2F2F7]"
                    : "border-[#E5E5EA] focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7]"
                }`}
                style={{ fontWeight: 400 }}
              />
            </div>
            {nomeError && (
              <span id="nome-error" role="alert" className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
                {nomeError}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Email <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: ana@example.com"
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#D1D1D6] focus-visible:outline-none transition-all ${
                  emailError
                    ? "border-[#FF3B30] ring-2 ring-[#F2F2F7]"
                    : "border-[#E5E5EA] focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7]"
                }`}
                style={{ fontWeight: 400 }}
              />
            </div>
            {emailError && (
              <span id="email-error" role="alert" className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
                {emailError}
              </span>
            )}
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Telefone <span className="text-[#AEAEB2]">(opcional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (31) 99999-9999"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#D1D1D6] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Empresa <span className="text-[#AEAEB2]">(opcional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ex: Empresa XPTO"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#D1D1D6] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E5E5EA] px-6 py-4 flex items-center justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13px] text-[#AEAEB2] hover:bg-[#F2F2F7] hover:text-[#636366] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !!nomeError || !!emailError}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            style={{ fontWeight: 600 }}
          >
            {isSubmitting ? (
              <>Criando...</>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Criar cliente
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>,
    document.body
  );
}