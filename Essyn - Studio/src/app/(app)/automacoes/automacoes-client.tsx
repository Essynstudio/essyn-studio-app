"use client";

import { useState, useCallback } from "react";
import {
  Bell, MessageSquare, ArrowRightCircle, Image, HardDrive,
  FileSignature, UserPlus, CalendarCheck, Zap, Users, CreditCard,
} from "lucide-react";
import { motion } from "motion/react";
import { PageTransition, HeaderWidget, WidgetCard } from "@/components/ui/apple-kit";
import { springDefault, springSnappy } from "@/lib/motion-tokens";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */
interface Automation {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  trigger: string;
  triggerColor: string;
  defaultOn: boolean;
}

/* ── Default automations ── */
const AUTOMATIONS: Automation[] = [
  {
    id: "lembrete_pagamento",
    icon: Bell,
    title: "Lembrete de pagamento vencido",
    description: "Cria alerta quando uma parcela está vencida há mais de 1 dia. A Iris também notifica no chat.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: true,
  },
  {
    id: "lead_sem_contato",
    icon: MessageSquare,
    title: "Alerta de lead sem contato",
    description: "Avisa quando um lead no pipeline não recebeu ação nos últimos 3 dias úteis.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: true,
  },
  {
    id: "avancar_producao",
    icon: ArrowRightCircle,
    title: "Avançar produção automaticamente",
    description: "Quando todas as tarefas de uma etapa são concluídas, avança para a próxima fase.",
    trigger: "Ao concluir",
    triggerColor: "var(--success)",
    defaultOn: false,
  },
  {
    id: "enviar_galeria",
    icon: Image,
    title: "Notificar cliente quando galeria pronta",
    description: "Envia email ao cliente automaticamente quando a galeria muda para status 'prova' ou 'final'.",
    trigger: "Ao publicar",
    triggerColor: "var(--success)",
    defaultOn: false,
  },
  {
    id: "contrato_expirando",
    icon: FileSignature,
    title: "Alerta de contrato expirando",
    description: "Notifica quando um contrato enviado está a 7 dias de expirar sem aceite do cliente.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: true,
  },
  {
    id: "novo_cliente_portal",
    icon: UserPlus,
    title: "Enviar acesso ao portal automaticamente",
    description: "Ao cadastrar um cliente com email, envia o link de acesso ao portal automaticamente.",
    trigger: "Ao criar",
    triggerColor: "var(--accent)",
    defaultOn: false,
  },
  {
    id: "lembrete_evento",
    icon: CalendarCheck,
    title: "Lembrete de evento amanhã",
    description: "Cria alerta no dia anterior a cada evento agendado no calendário.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: true,
  },
  {
    id: "lembrete_sessao_cliente",
    icon: Users,
    title: "Lembrete de sessão para o cliente",
    description: "Envia email ao cliente no dia anterior à sessão com data, horário e local confirmados.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: true,
  },
  {
    id: "cobranca_cliente",
    icon: CreditCard,
    title: "Aviso de pagamento em atraso ao cliente",
    description: "Envia um lembrete educado ao cliente no 1º dia de atraso de uma parcela. Disparado apenas uma vez por vencimento.",
    trigger: "Diário",
    triggerColor: "var(--info)",
    defaultOn: false,
  },
  {
    id: "backup_fotos",
    icon: HardDrive,
    title: "Backup semanal de fotos",
    description: "Realiza backup automático das galerias para o armazenamento em nuvem configurado.",
    trigger: "Semanal",
    triggerColor: "var(--fg-muted)",
    defaultOn: false,
  },
];

/* ── Component ── */
interface Props {
  studioId: string;
  initialSettings: Record<string, boolean>;
}

export function AutomacoesClient({ studioId, initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const merged: Record<string, boolean> = {};
    for (const a of AUTOMATIONS) {
      merged[a.id] = a.id in initialSettings ? initialSettings[a.id] : a.defaultOn;
    }
    return merged;
  });
  const [saving, setSaving] = useState<string | null>(null);

  const toggleAutomation = useCallback(async (id: string) => {
    const newValue = !settings[id];
    const newSettings = { ...settings, [id]: newValue };
    setSettings(newSettings);
    setSaving(id);

    try {
      const supabase = createClient();
      // Read current settings, merge automations
      const { data: studio } = await supabase
        .from("studios")
        .select("settings")
        .eq("id", studioId)
        .single();

      const currentSettings = (studio?.settings || {}) as Record<string, unknown>;
      await supabase
        .from("studios")
        .update({
          settings: { ...currentSettings, automations: newSettings },
        })
        .eq("id", studioId);

      toast.success(newValue ? "Automação ativada" : "Automação desativada");
    } catch {
      // Revert on error
      setSettings(settings);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(null);
    }
  }, [settings, studioId]);

  const activeCount = Object.values(settings).filter(Boolean).length;

  return (
    <PageTransition>
      <HeaderWidget
        title="Automações"
        subtitle={`${activeCount} de ${AUTOMATIONS.length} ativas · Ações automáticas para economizar tempo.`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]/20">
            <Zap size={13} className="text-[var(--success)]" />
            <span className="text-[11px] font-semibold text-[var(--success)]">{activeCount} ativas</span>
          </div>
        </div>
      </HeaderWidget>

      <div className="space-y-2">
        {AUTOMATIONS.map((automation, index) => {
          const Icon = automation.icon;
          const isOn = settings[automation.id] ?? automation.defaultOn;
          const isSaving = saving === automation.id;

          return (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springDefault, delay: 0.03 + index * 0.04 }}
            >
              <WidgetCard
                className={`p-4 flex items-center gap-4 transition-opacity ${isOn ? "" : "opacity-50"}`}
                hover={false}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isOn ? "var(--accent-subtle)" : "var(--bg-subtle)",
                  }}
                >
                  <Icon size={18} className={isOn ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-medium text-[var(--fg)]">
                      {automation.title}
                    </h3>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${automation.triggerColor} 12%, transparent)`,
                        color: automation.triggerColor,
                      }}
                    >
                      {automation.trigger}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                    {automation.description}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleAutomation(automation.id)}
                  disabled={isSaving}
                  className="shrink-0 relative"
                  title={isOn ? "Desativar" : "Ativar"}
                >
                  <motion.div
                    className="w-11 h-6 rounded-full p-0.5 transition-colors"
                    style={{
                      backgroundColor: isOn ? "var(--success)" : "var(--border)",
                    }}
                    animate={{ backgroundColor: isOn ? "var(--success)" : "var(--border)" }}
                    transition={springSnappy}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ x: isOn ? 20 : 0 }}
                      transition={springSnappy}
                    />
                  </motion.div>
                </button>
              </WidgetCard>
            </motion.div>
          );
        })}
      </div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 px-1"
      >
        <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
          As automações ativas geram alertas e notificações no sistema. A Iris também utiliza essas configurações para avisar sobre itens que precisam de atenção. Automações com gatilho &quot;Ao concluir&quot; e &quot;Ao publicar&quot; serão executadas automaticamente quando a condição for atendida.
        </p>
      </motion.div>
    </PageTransition>
  );
}
