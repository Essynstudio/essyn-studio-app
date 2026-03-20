"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  AppleDrawer,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  GHOST_BTN,
  PILL_CLS,
} from "@/lib/design-tokens";
import {
  Crown,
  CreditCard,
  ArrowLeft,
  Check,
  Sparkles,
  HardDrive,
  Users,
  Folder,
  ChevronRight,
  ExternalLink,
  Download,
  BarChart3,
  PenTool,
  MessageCircle,
  Globe,
} from "lucide-react";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface Studio {
  id: string;
  name: string;
  plan: string | null;
  plan_interval: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
}

interface Props {
  studio: Studio;
  teamCount: number;
  projectsThisMonth: number;
}

// ═══════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════

// Plans data defined locally below

const PLAN_LIMITS: Record<string, { projects: number; users: number; storage: number }> = {
  starter: { projects: 3, users: 1, storage: 1 },
  pro: { projects: -1, users: 3, storage: 50 },
  studio: { projects: -1, users: 10, storage: 200 },
  business: { projects: -1, users: -1, storage: 500 },
};

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  icon: typeof HardDrive;
}

const MOCK_ADDONS: AddOn[] = [
  { id: "storage", name: "Storage Extra", price: 29, description: "+50 GB armazenamento", active: true, icon: HardDrive },
  { id: "signature", name: "Assinatura Digital", price: 19, description: "Contratos com assinatura eletrônica", active: true, icon: PenTool },
  { id: "whatsapp", name: "WhatsApp API", price: 39, description: "Mensagens automáticas via WhatsApp", active: false, icon: MessageCircle },
  { id: "domain", name: "Domínio Customizado", price: 15, description: "galeria.seuestudio.com", active: false, icon: Globe },
];

interface Invoice {
  date: string;
  description: string;
  amount: number;
  status: "paid" | "failed";
}

const MOCK_INVOICES: Invoice[] = [
  { date: "01 Mar 2026", description: "Studio — Mensal", amount: 179, status: "paid" },
  { date: "01 Fev 2026", description: "Studio — Mensal", amount: 179, status: "paid" },
  { date: "01 Jan 2026", description: "Pro — Mensal", amount: 89, status: "paid" },
  { date: "01 Dez 2025", description: "Pro — Mensal + Storage Extra", amount: 118, status: "paid" },
  { date: "01 Nov 2025", description: "Pro — Mensal", amount: 89, status: "paid" },
  { date: "01 Out 2025", description: "Pro — Mensal", amount: 89, status: "failed" },
];

const PLAN_OPTIONS = [
  { id: "starter", name: "Starter", projects: "3 projetos", users: "1 usuario", storage: "1 GB", price: 0 },
  { id: "pro", name: "Pro", projects: "Ilimitado", users: "3 usuarios", storage: "50 GB", price: 89, recommended: true },
  { id: "studio", name: "Studio", projects: "Ilimitado", users: "10 usuarios", storage: "200 GB", price: 179 },
  { id: "business", name: "Business", projects: "Ilimitado", users: "Ilimitado", storage: "500 GB", price: 299 },
];

// ═══════════════════════════════════════════════
// UsageBar Component
// ═══════════════════════════════════════════════

function UsageBar({ used, total, label, unit, icon: Icon }: { used: number; total: number; label: string; unit: string; icon: typeof Folder }) {
  const pct = Math.round((used / total) * 100);
  const isOver = pct > 100;
  return (
    <WidgetCard className="p-5" hover={false}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-[var(--fg-secondary)]" />
        <span className="text-xs text-[var(--fg-muted)]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-semibold text-[var(--fg)]">{used}</span>
        <span className="text-sm text-[var(--fg-muted)]">/ {total} {unit}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? "bg-[var(--error)]" : "bg-[var(--info)]"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {isOver && <p className="text-xs text-[var(--error)] mt-1">{pct}% utilizado</p>}
      {!isOver && <p className="text-xs text-[var(--fg-muted)] mt-1">{pct}% utilizado</p>}
    </WidgetCard>
  );
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function AssinaturaClient({ studio, teamCount, projectsThisMonth }: Props) {
  const router = useRouter();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("studio");

  // Derive plan info
  const currentPlan = studio.plan || "pro";
  const planLabel = currentPlan === "business" ? "Business" : currentPlan === "studio" ? "Studio" : currentPlan === "pro" ? "Pro" : "Starter";
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.pro;
  const interval = studio.plan_interval || "mensal";

  // Mock usage data
  const storageUsed = 67.4;
  const monthlyTotal = 177; // R$ 129 plan + R$ 29 storage + R$ 19 signature

  // Format renewal date
  const renewalDate = studio.plan_expires_at
    ? new Date(studio.plan_expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "15 Mar 2026";

  return (
    <PageTransition>
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => router.push("/configuracoes")}
          className={`${GHOST_BTN} mb-3 flex items-center gap-1.5 text-sm`}
        >
          <ArrowLeft size={16} />
          <span className="text-xs text-[var(--fg-muted)]">
            Configuracoes <span className="mx-1">&gt;</span> Assinatura &amp; Faturas
          </span>
        </button>
        <HeaderWidget
          title="Assinatura & Faturas"
          subtitle="Gerencie plano, add-ons e historico de pagamentos"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-[var(--fg)]">
              R$ {monthlyTotal}
            </span>
            <span className="text-sm text-[var(--fg-muted)]">/mes</span>
          </div>
        </HeaderWidget>
      </div>

      {/* ── Plan Card ── */}
      <WidgetCard className="p-6" hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left */}
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <Crown size={20} className="text-[var(--fg-secondary)]" />
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--fg)]">{planLabel}</h2>
                <span className={`${PILL_CLS} bg-[var(--success-subtle)] text-[var(--success)]`}>
                  Ativo
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--fg-muted)] mb-4">
              Ciclo {interval} · Renova {renewalDate}
            </p>
            {/* Feature tags */}
            <div className="flex flex-wrap gap-2">
              {[
                `${limits.projects === -1 ? "Ilimitado" : limits.projects} projetos`,
                `${limits.users} usuarios`,
                `${limits.storage} GB`,
                "Galeria + proofing",
              ].map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg)] text-xs text-[var(--fg-secondary)]"
                >
                  <Check size={12} className="text-[var(--success)]" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
          {/* Right — price */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-bold text-[var(--fg)]">
                R$ {currentPlan === "business" ? "299" : currentPlan === "studio" ? "179" : currentPlan === "pro" ? "89" : "0"}
              </span>
              <span className="text-sm text-[var(--fg-muted)]">/mes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUpgradeOpen(true)}
              className={PRIMARY_CTA}
            >
              <Sparkles size={16} />
              Fazer upgrade
            </button>
            <button className={SECONDARY_CTA}>
              Trocar para anual
            </button>
          </div>
          <button className="text-xs text-[var(--error)] hover:underline mt-3 sm:mt-0 transition-colors">
            Cancelar assinatura
          </button>
        </div>
      </WidgetCard>

      {/* ── USO ATUAL ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--fg)]">Uso atual</h3>
            <p className="text-xs text-[var(--fg-muted)]">Limites do plano {planLabel}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageBar
            used={projectsThisMonth || 12}
            total={limits.projects === -1 ? 999 : limits.projects}
            label="Projetos este mês"
            unit=""
            icon={Folder}
          />
          <UsageBar
            used={teamCount || 5}
            total={limits.users}
            label="Usuarios ativos"
            unit=""
            icon={Users}
          />
          <UsageBar
            used={storageUsed}
            total={limits.storage}
            label="Armazenamento"
            unit="GB"
            icon={HardDrive}
          />
        </div>
      </div>

      {/* ── ADD-ONS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--fg)]">Add-ons</h3>
            <p className="text-xs text-[var(--fg-muted)]">
              {MOCK_ADDONS.filter((a) => a.active).length} ativos · Cobrado junto com a assinatura
            </p>
          </div>
          <button className="text-xs text-[var(--info)] hover:underline flex items-center gap-1 transition-colors">
            Gerenciar add-ons <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_ADDONS.map((addon) => {
            const Icon = addon.icon;
            return (
              <WidgetCard key={addon.id} className="p-5" hover={false}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon size={18} className="text-[var(--fg-secondary)] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-medium text-[var(--fg)]">{addon.name}</h4>
                        <span
                          className={`${PILL_CLS} ${
                            addon.active
                              ? "bg-[var(--success-subtle)] text-[var(--success)]"
                              : "bg-[var(--border-subtle)] text-[var(--fg-muted)]"
                          }`}
                        >
                          {addon.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--fg-muted)]">{addon.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--fg)] flex-shrink-0">
                    R$ {addon.price}
                  </span>
                </div>
              </WidgetCard>
            );
          })}
        </div>
      </div>

      {/* ── METODO DE PAGAMENTO ── */}
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-3">Metodo de pagamento</h3>
        <WidgetCard className="p-5" hover={false}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-[var(--fg-secondary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">
                  &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4289
                </p>
                <p className="text-xs text-[var(--fg-muted)]">Visa · Expira 08/27</p>
              </div>
              <span className={`${PILL_CLS} bg-[var(--accent-subtle,var(--info-subtle))] text-[var(--accent,var(--info))]`}>
                Principal
              </span>
            </div>
            <button className="text-xs text-[var(--info)] hover:underline flex items-center gap-1 transition-colors">
              Atualizar <ExternalLink size={12} />
            </button>
          </div>
        </WidgetCard>
      </div>

      {/* ── HISTORICO DE FATURAS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--fg)]">Histórico de faturas</h3>
            <p className="text-xs text-[var(--fg-muted)]">Últimas 6 cobranças</p>
          </div>
        </div>
        <WidgetCard className="overflow-hidden" hover={false}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_2fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
            <span>Data</span>
            <span>Descricao</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Status</span>
            <span className="text-center">Fatura</span>
          </div>
          {/* Table rows */}
          {MOCK_INVOICES.map((inv, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_2fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] last:border-0 text-sm hover:bg-[var(--sidebar-hover)] transition-colors"
            >
              <span className="text-xs text-[var(--fg-secondary)]">{inv.date}</span>
              <span className="text-xs text-[var(--fg)]">{inv.description}</span>
              <span className="text-xs text-[var(--fg)] text-right font-medium">
                R$ {inv.amount}
              </span>
              <span className="flex justify-center">
                <span
                  className={`${PILL_CLS} ${
                    inv.status === "paid"
                      ? "bg-[var(--success-subtle)] text-[var(--success)]"
                      : "bg-[var(--error-subtle)] text-[var(--error)]"
                  }`}
                >
                  {inv.status === "paid" ? "Pago" : "Falhou"}
                </span>
              </span>
              <span className="flex justify-center">
                <button className={`${GHOST_BTN} !p-1.5`}>
                  <Download size={14} />
                </button>
              </span>
            </div>
          ))}
          {/* Footer */}
          <div className="px-5 py-3 bg-[var(--bg)] text-[11px] text-[var(--fg-muted)]">
            Cobranças processadas via Asaas. Dúvidas?{" "}
            <a href="mailto:financeiro@essyn.com" className="text-[var(--info)] hover:underline">
              financeiro@essyn.com
            </a>
          </div>
        </WidgetCard>
      </div>

      {/* ── Upgrade Drawer ── */}
      <AppleDrawer
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Upgrade de plano"
        width="max-w-md"
      >
        <div className="p-6 space-y-6">
          {/* Hero */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={20} className="text-[var(--fg)]" />
              <h3 className="text-lg font-semibold text-[var(--fg)]">Escolha seu plano</h3>
            </div>
            <p className="text-sm text-[var(--fg-secondary)]">
              Desbloqueie mais recursos para crescer seu estúdio.
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
              O que você desbloqueia
            </h4>
            <div className="space-y-3">
              {[
                { icon: Folder, title: "Mais projetos e clientes", desc: "Sem limites no Pro, Studio e Business" },
                { icon: Users, title: "Equipe completa", desc: "Até 3, 10 ou ilimitados membros" },
                { icon: HardDrive, title: "Mais armazenamento", desc: "50 GB, 200 GB ou 500 GB" },
                { icon: BarChart3, title: "Iris IA completa", desc: "50 msgs/dia ou ilimitado" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon size={16} className="text-[var(--fg-secondary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">{item.title}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
              Escolha seu plano
            </h4>
            <div className="space-y-2">
              {PLAN_OPTIONS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isCurrent = currentPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[var(--bg-ink)] bg-[var(--sidebar-hover)]"
                        : "border-[var(--border)] hover:border-[var(--border-hover,var(--fg-muted))]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--fg)]">{plan.name}</span>
                        {isCurrent && (
                          <span className={`${PILL_CLS} bg-[var(--border-subtle)] text-[var(--fg-muted)]`}>
                            Atual
                          </span>
                        )}
                        {plan.recommended && (
                          <span className={`${PILL_CLS} bg-[var(--success-subtle)] text-[var(--success)]`}>
                            Recomendado
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[var(--fg)]">
                        R$ {plan.price}<span className="text-xs font-normal text-[var(--fg-muted)]">/mes</span>
                      </span>
                    </div>
                    <p className="text-xs text-[var(--fg-muted)]">
                      {plan.projects} · {plan.users} · {plan.storage}
                    </p>
                    {/* Radio indicator */}
                    {isSelected && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Check size={16} className="text-[var(--bg-ink)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setUpgradeOpen(false)}
              className={`${PRIMARY_CTA} w-full`}
              disabled={selectedPlan === currentPlan}
            >
              <Sparkles size={16} />
              {selectedPlan === currentPlan
                ? "Plano atual"
                : `Upgrade para ${PLAN_OPTIONS.find((p) => p.id === selectedPlan)?.name}`}
            </button>
            <button
              onClick={() => setUpgradeOpen(false)}
              className="w-full text-center text-xs text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors py-2"
            >
              Ver planos
            </button>
          </div>
        </div>
      </AppleDrawer>
    </PageTransition>
  );
}
