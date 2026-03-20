"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { springDefault } from "@/lib/motion-tokens";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  AppleModal,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  LABEL_CLS,
  SELECT_CLS,
} from "@/lib/design-tokens";
import {
  Settings,
  Crown,
  Users,
  GitBranch,
  Package,
  DollarSign,
  Camera,
  Bell,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  MessageSquare,
  Zap,
  Plug,
  HardDrive,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Pack, WorkflowTemplate } from "@/lib/types";

// ── Types ───────────────────────────────────────

interface Studio {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  document: string | null;
  logo_url: string | null;
  plan: string | null;
  plan_interval: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
}

interface Props {
  studio: Studio;
  userEmail: string;
  initialPacks?: Pack[];
  initialWorkflows?: WorkflowTemplate[];
  teamCount?: number;
}

// ── Helpers ─────────────────────────────────────

function getPlanLabel(plan: string | null) {
  switch (plan) {
    case "starter": return "Starter";
    case "pro": return "Studio Pro";
    case "studio": return "Studio Max";
    default: return "Free";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Toggle ──────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── Section ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Settings Row ─────────────────────────────────

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor,
  onClick,
  delay = 0,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay }}
    >
      <WidgetCard hover onClick={onClick}>
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-[var(--fg-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-[var(--fg)]">{title}</span>
              {badge && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    color: badgeColor || "var(--info)",
                    backgroundColor: `color-mix(in srgb, ${badgeColor || "var(--info)"} 12%, transparent)`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">{subtitle}</p>
          </div>
          <ChevronRight size={14} className="text-[var(--fg-muted)] flex-shrink-0" />
        </div>
      </WidgetCard>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────

export function ConfiguracoesClient({
  studio,
  userEmail,
  initialPacks = [],
  initialWorkflows = [],
  teamCount = 1,
}: Props) {
  const router = useRouter();

  // Studio edit modal
  const [modalEstudio, setModalEstudio] = useState(false);
  const [studioName, setStudioName] = useState(studio.name || "");
  const [studioPhone, setStudioPhone] = useState(studio.phone || "");
  const [studioEmail, setStudioEmail] = useState(studio.email || "");
  const [studioWebsite, setStudioWebsite] = useState(studio.website || "");
  const [studioCity, setStudioCity] = useState(studio.city || "");
  const [studioState, setStudioState] = useState(studio.state || "");
  const [studioAddress, setStudioAddress] = useState(studio.address || "");
  const [studioDocument, setStudioDocument] = useState(studio.document || "");
  const [savingEstudio, setSavingEstudio] = useState(false);

  // Password change modal
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);

  // Notifications modal
  const [modalNotif, setModalNotif] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifPagamentos, setNotifPagamentos] = useState(true);
  const [notifEventos, setNotifEventos] = useState(true);
  const [notifResumo, setNotifResumo] = useState(false);

  const planLabel = getPlanLabel(studio.plan);
  const planExpiry = formatDate(studio.plan_expires_at);
  const packCount = initialPacks.length;
  const workflowCount = initialWorkflows.length;

  // ── Save studio profile ──────────────────────

  const handleSaveEstudio = async () => {
    if (!studioName.trim()) { toast.error("Nome do estúdio é obrigatório."); return; }
    setSavingEstudio(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("studios")
        .update({
          name: studioName.trim(),
          phone: studioPhone.trim() || null,
          email: studioEmail.trim() || null,
          website: studioWebsite.trim() || null,
          city: studioCity.trim() || null,
          state: studioState.trim() || null,
          address: studioAddress.trim() || null,
          document: studioDocument.trim() || null,
        })
        .eq("id", studio.id);
      if (error) throw error;
      toast.success("Dados do estúdio atualizados!");
      setModalEstudio(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSavingEstudio(false);
    }
  };

  // ── Change password ──────────────────────────

  const handleChangeSenha = async () => {
    if (!senhaAtual.trim()) {
      toast.error("Digite sua senha atual.");
      return;
    }
    if (!senhaNova.trim() || senhaNova.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senhaNova !== senhaConfirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingSenha(true);
    try {
      const supabase = createClient();
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: senhaAtual,
      });
      if (signInError) {
        toast.error("Senha atual incorreta.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: senhaNova });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setSenhaAtual(""); setSenhaNova(""); setSenhaConfirm("");
      setModalSenha(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha.");
    } finally {
      setSavingSenha(false);
    }
  };

  return (
    <PageTransition>
      <HeaderWidget
        title="Configurações"
        subtitle="Gerencie seu estúdio, equipe e preferências"
      >
        <button onClick={() => setModalEstudio(true)} className={PRIMARY_CTA}>
          <Settings size={14} />
          Editar estúdio
        </button>
      </HeaderWidget>

      {/* ── Studio summary card ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springDefault}
      >
        <WidgetCard hover onClick={() => setModalEstudio(true)}>
          <div className="flex items-center gap-4 p-5">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--info)] to-[var(--info-dark,var(--info))] flex items-center justify-center flex-shrink-0 text-white text-[18px] font-bold shadow-sm">
              {studio.name?.charAt(0)?.toUpperCase() || "E"}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-[var(--fg)] mb-0.5">{studio.name}</h2>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {studio.email && (
                  <span className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                    <Mail size={9} /> {studio.email}
                  </span>
                )}
                {studio.phone && (
                  <span className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                    <Phone size={9} /> {studio.phone}
                  </span>
                )}
                {(studio.city || studio.state) && (
                  <span className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                    <MapPin size={9} /> {[studio.city, studio.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  color: "var(--warning)",
                  backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
                }}
              >
                <Crown size={10} />
                {planLabel}
              </span>
              {studio.plan_expires_at && (
                <p className="text-[10px] text-[var(--fg-muted)] mt-1">Renova {planExpiry}</p>
              )}
            </div>
          </div>
        </WidgetCard>
      </motion.div>

      {/* ── Conta ───────────────────────────────── */}
      <Section title="Conta">
        <SettingsRow
          icon={Building2}
          title="Dados do Estúdio"
          subtitle="Nome, CNPJ, endereço, telefone e e-mail de contato"
          onClick={() => setModalEstudio(true)}
          delay={0.05}
        />
        <SettingsRow
          icon={Crown}
          title="Plano & Assinatura"
          subtitle="Gerencie seu plano, limites de uso, cobrança e faturas"
          badge={planLabel}
          badgeColor="var(--warning)"
          onClick={() => router.push("/configuracoes/assinatura")}
          delay={0.1}
        />
        <SettingsRow
          icon={Settings}
          title="Alterar Senha"
          subtitle="Atualize a senha de acesso à sua conta"
          onClick={() => setModalSenha(true)}
          delay={0.15}
        />
      </Section>

      {/* ── Equipe ──────────────────────────────── */}
      <Section title="Equipe">
        <SettingsRow
          icon={Users}
          title="Membros da Equipe"
          subtitle="Convide fotógrafos, assistentes e gerencie permissões de acesso"
          badge={`${teamCount} ${teamCount === 1 ? "membro" : "membros"}`}
          badgeColor="var(--info)"
          onClick={() => router.push("/configuracoes/usuarios")}
          delay={0.2}
        />
      </Section>

      {/* ── Produção ────────────────────────────── */}
      <Section title="Produção">
        <SettingsRow
          icon={GitBranch}
          title="Workflows de Produção"
          subtitle="Etapas reutilizáveis de edição, seleção, entrega e revisão"
          badge={workflowCount > 0 ? `${workflowCount} templates` : undefined}
          badgeColor="var(--info)"
          onClick={() => router.push("/configuracoes/templates")}
          delay={0.25}
        />
        <SettingsRow
          icon={Package}
          title="Packs de Serviço"
          subtitle="Gerencie os pacotes cadastrados e seus preços base"
          badge={packCount > 0 ? `${packCount} packs` : undefined}
          badgeColor="var(--info)"
          onClick={() => router.push("/configuracoes/templates")}
          delay={0.3}
        />
      </Section>

      {/* ── Financeiro ──────────────────────────── */}
      <Section title="Financeiro">
        <SettingsRow
          icon={DollarSign}
          title="Categorias & Métodos de Pagamento"
          subtitle="Categorias de receita/despesa, métodos aceitos e centros de custo"
          onClick={() => router.push("/configuracoes/financeiro-config")}
          delay={0.35}
        />
      </Section>

      {/* ── Equipamentos ────────────────────────── */}
      <Section title="Equipamentos">
        <SettingsRow
          icon={Camera}
          title="Inventário de Equipamentos"
          subtitle="Câmeras, lentes, flashes e histórico de manutenção"
          onClick={() => router.push("/configuracoes/equipamentos")}
          delay={0.4}
        />
      </Section>

      {/* ── Comunicação ─────────────────────────── */}
      <Section title="Comunicação">
        <SettingsRow
          icon={Mail}
          title="Modelos de Email"
          subtitle="Modelos de e-mail para galeria pronta, contratos, boas-vindas"
          onClick={() => router.push("/email-templates")}
          delay={0.45}
        />
        <SettingsRow
          icon={Bell}
          title="Notificações"
          subtitle="E-mail, lembretes de pagamento e eventos próximos"
          onClick={() => router.push("/notificacoes")}
          delay={0.5}
        />
      </Section>

      {/* ── Sistema ───────────────────────────── */}
      <Section title="Sistema">
        <SettingsRow
          icon={Zap}
          title="Automações"
          subtitle="Regras automáticas para lembretes, cobranças e notificações"
          onClick={() => router.push("/automacoes")}
          delay={0.55}
        />
        <SettingsRow
          icon={Plug}
          title="Integrações"
          subtitle="WhatsApp, Google Calendar, Stripe e outras conexões"
          onClick={() => router.push("/integracoes")}
          delay={0.6}
        />
        <SettingsRow
          icon={HardDrive}
          title="Armazenamento"
          subtitle="Uso de espaço, fotos armazenadas e limites do plano"
          onClick={() => router.push("/armazenamento")}
          delay={0.65}
        />
      </Section>

      {/* Footer */}
      <p className="text-center text-[11px] text-[var(--fg-muted)] py-2">
        Essyn Studio · {userEmail} · v0.9.5-beta
      </p>

      {/* ═══════════════════════════════════════════
          MODAL: Dados do Estúdio
      ══════════════════════════════════════════════ */}
      <AppleModal open={modalEstudio} onClose={() => setModalEstudio(false)} title="Dados do Estúdio">
        <div className="p-6 space-y-5">
          <p className="text-[12px] text-[var(--fg-muted)] -mt-2">
            Estas informações aparecem em contratos, recibos e na galeria de clientes.
          </p>

          {/* Nome */}
          <div>
            <label className={LABEL_CLS}>
              <Building2 size={11} className="inline mr-1 -mt-0.5" />
              Nome do Estúdio *
            </label>
            <input
              type="text"
              placeholder="Ex: Studio Mendes Fotografia"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* CNPJ / CPF */}
          <div>
            <label className={LABEL_CLS}>
              <FileText size={11} className="inline mr-1 -mt-0.5" />
              CPF / CNPJ
            </label>
            <input
              type="text"
              placeholder="Ex: 12.345.678/0001-90"
              value={studioDocument}
              onChange={(e) => setStudioDocument(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>
                <Mail size={11} className="inline mr-1 -mt-0.5" />
                E-mail de contato
              </label>
              <input
                type="email"
                placeholder="contato@seuestúdio.com"
                value={studioEmail}
                onChange={(e) => setStudioEmail(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>
                <Phone size={11} className="inline mr-1 -mt-0.5" />
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-8888"
                value={studioPhone}
                onChange={(e) => setStudioPhone(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className={LABEL_CLS}>
              <Globe size={11} className="inline mr-1 -mt-0.5" />
              Website
            </label>
            <input
              type="url"
              placeholder="https://seuestúdio.com.br"
              value={studioWebsite}
              onChange={(e) => setStudioWebsite(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Endereço */}
          <div>
            <label className={LABEL_CLS}>
              <MapPin size={11} className="inline mr-1 -mt-0.5" />
              Endereço
            </label>
            <input
              type="text"
              placeholder="Rua das Flores, 123 — Jardim Primavera"
              value={studioAddress}
              onChange={(e) => setStudioAddress(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Cidade</label>
              <input
                type="text"
                placeholder="São Paulo"
                value={studioCity}
                onChange={(e) => setStudioCity(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select
                value={studioState}
                onChange={(e) => setStudioState(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">Selecionar</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button onClick={() => setModalEstudio(false)} className={SECONDARY_CTA} disabled={savingEstudio}>
              Cancelar
            </button>
            <button onClick={handleSaveEstudio} className={PRIMARY_CTA} disabled={savingEstudio}>
              {savingEstudio ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
              {savingEstudio ? "Salvando..." : "Salvar dados"}
            </button>
          </div>
        </div>
      </AppleModal>

      {/* ═══════════════════════════════════════════
          MODAL: Alterar Senha
      ══════════════════════════════════════════════ */}
      <AppleModal open={modalSenha} onClose={() => setModalSenha(false)} title="Alterar Senha">
        <div className="p-6 space-y-4">
          <p className="text-[12px] text-[var(--fg-muted)] -mt-2">
            Conta vinculada a: <strong className="text-[var(--fg)]">{userEmail}</strong>
          </p>

          <div>
            <label className={LABEL_CLS}>Senha atual</label>
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Digite sua senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Nova senha</label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                className={`${INPUT_CLS} !pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
              >
                {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Confirmar nova senha</label>
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={senhaConfirm}
              onChange={(e) => setSenhaConfirm(e.target.value)}
              className={INPUT_CLS}
            />
            {senhaConfirm && senhaNova !== senhaConfirm && (
              <p className="text-[11px] text-[var(--error)] mt-1">As senhas não coincidem.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button onClick={() => setModalSenha(false)} className={SECONDARY_CTA} disabled={savingSenha}>
              Cancelar
            </button>
            <button onClick={handleChangeSenha} className={PRIMARY_CTA} disabled={savingSenha}>
              {savingSenha ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
              {savingSenha ? "Salvando..." : "Alterar senha"}
            </button>
          </div>
        </div>
      </AppleModal>

      {/* ═══════════════════════════════════════════
          MODAL: Notificações
      ══════════════════════════════════════════════ */}
      <AppleModal open={modalNotif} onClose={() => setModalNotif(false)} title="Notificações">
        <div className="p-6 space-y-6">
          <p className="text-[12px] text-[var(--fg-muted)] -mt-2">
            Preferências de aviso e lembretes automáticos.
          </p>

          <div>
            <h4 className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
              Canais
            </h4>
            <div className="space-y-4">
              {[
                { label: "E-mail", desc: "Receba avisos no seu e-mail", state: notifEmail, setter: setNotifEmail },
                { label: "Push no navegador", desc: "Notificações enquanto estiver logado", state: notifPush, setter: setNotifPush },
              ].map((ch) => (
                <div key={ch.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-[var(--fg)]">{ch.label}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">{ch.desc}</p>
                  </div>
                  <Toggle checked={ch.state} onChange={ch.setter} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
              Lembretes
            </h4>
            <div className="space-y-4">
              {[
                { label: "Pagamentos vencendo", desc: "Aviso 3 dias antes do vencimento", state: notifPagamentos, setter: setNotifPagamentos },
                { label: "Eventos próximos", desc: "Lembrete 1 dia antes de cada evento", state: notifEventos, setter: setNotifEventos },
                { label: "Resumo semanal", desc: "Todo domingo, resumo da semana", state: notifResumo, setter: setNotifResumo },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-[var(--fg)]">{r.label}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">{r.desc}</p>
                  </div>
                  <Toggle checked={r.state} onChange={r.setter} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-[11px] text-[var(--fg-muted)]">
            Notificações por e-mail e push chegam em breve. Por enquanto, preferências salvas localmente.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button onClick={() => setModalNotif(false)} className={SECONDARY_CTA}>Fechar</button>
          </div>
        </div>
      </AppleModal>
    </PageTransition>
  );
}
