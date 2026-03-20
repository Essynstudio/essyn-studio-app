"use client";



import { motion } from "motion/react";
import {
  MessageSquare,
  Phone,
  Send,
  Link2,
  Info,
} from "lucide-react";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  WidgetEmptyState,
  StatusBadge,
} from "@/components/ui/apple-kit";
import { PRIMARY_CTA, SECONDARY_CTA } from "@/lib/design-tokens";
import { springContentIn, springDefault } from "@/lib/motion-tokens";

interface WhatsAppTemplate {
  id: string;
  title: string;
  preview: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const templates: WhatsAppTemplate[] = [
  {
    id: "confirmacao-evento",
    title: "Confirmação de evento",
    preview:
      "Ola {nome}! Confirmamos seu evento no dia {data}. Qualquer duvida, estamos a disposicao.",
    icon: MessageSquare,
  },
  {
    id: "lembrete-pagamento",
    title: "Lembrete de pagamento",
    preview:
      "Ola {nome}, este e um lembrete de que a parcela no valor de {valor} vence em {data}. Obrigado!",
    icon: MessageSquare,
  },
  {
    id: "galeria-pronta",
    title: "Galeria pronta",
    preview:
      "Olá {nome}! Sua galeria está pronta para visualização. Acesse pelo link: {link}",
    icon: MessageSquare,
  },
];

export function WhatsAppClient() {
  return (
    <PageTransition>
      <HeaderWidget
        title="WhatsApp Business"
        subtitle="Conecte seu WhatsApp para enviar mensagens automaticas"
      />

      {/* How it works */}
      <WidgetCard className="p-5" hover={false}>
        <h3 className="text-[13px] font-medium text-[var(--fg)] mb-3">Como funciona?</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", title: "Conecte", desc: "Vincule seu número do WhatsApp Business ao Essyn." },
            { step: "2", title: "Configure", desc: "Personalize templates de mensagem para cada situação." },
            { step: "3", title: "Envie", desc: "Mensagens automáticas de confirmação, lembrete e entrega." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-[var(--info-subtle)] text-[var(--info)] text-[13px] font-semibold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <p className="text-[12px] font-medium text-[var(--fg)]">{item.title}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>

      <WidgetCard className="p-4 flex items-center gap-4" hover={false}>
        <Phone size={20} className="text-[var(--fg-secondary)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--fg)]">
            Status da conexão
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge
              label="Não conectado"
              color="var(--error)"
              bg="var(--error-subtle)"
            />
          </div>
        </div>
        <button
          disabled
          className={`${PRIMARY_CTA} opacity-50 cursor-not-allowed shrink-0`}
        >
          <Link2 size={16} />
          <span className="hidden sm:inline">Conectar</span>
        </button>
      </WidgetCard>

      <div>
        <h2 className="text-[13px] font-medium text-[var(--fg)] mb-3">
          Templates de mensagem rapida
        </h2>
        <div className="space-y-3">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springDefault, delay: i * 0.05 }}
            >
              <WidgetCard className="p-4 flex items-start gap-4" hover={false}>
                <template.icon
                  size={20}
                  className="text-[var(--fg-secondary)] shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-medium text-[var(--fg)]">
                    {template.title}
                  </h3>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1 line-clamp-2">
                    {template.preview}
                  </p>
                </div>
                <button
                  disabled
                  className={`${SECONDARY_CTA} !h-9 !px-3 !text-[11px] opacity-50 cursor-not-allowed shrink-0`}
                >
                  <Send size={12} />
                  Enviar
                </button>
              </WidgetCard>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.2 }}
        className="flex items-start gap-3 rounded-xl border border-[var(--info)] bg-[var(--info-subtle)] p-4"
      >
        <Info size={18} className="text-[var(--info)] shrink-0 mt-0.5" />
        <p className="text-[13px] text-[var(--fg)]">
          A integração com WhatsApp estará disponível no plano Pro
        </p>
      </motion.div>
    </PageTransition>
  );
}
