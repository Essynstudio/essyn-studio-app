"use client";

import { motion } from "motion/react";
import { Mail, ArrowLeft } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";
import Link from "next/link";

export default function PortalVerificarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springDefault}
        className="w-full max-w-sm text-center"
      >
        {/* Animated envelope */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springDefault, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-5"
        >
          <Mail size={28} className="text-[var(--accent)]" />
        </motion.div>

        <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">
          Verifique seu email
        </h1>
        <p className="text-[13px] text-[var(--fg-muted)] mt-2 leading-relaxed">
          Enviamos um link de acesso para o seu email.
          <br />
          Clique no link para entrar no seu portal.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-[var(--card)] border border-[var(--border-subtle)]">
          <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">
            O link expira em <strong>15 minutos</strong>.
            <br />
            Verifique também a caixa de spam.
          </p>
        </div>

        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 mt-6 text-[13px] text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={14} />
          Voltar e tentar outro email
        </Link>
      </motion.div>
    </div>
  );
}
