"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "motion/react";
import {
  Bell,
  Users,
  Check,
  DollarSign,
  AlertCircle,
  Clapperboard,
  Package,
  Image,
  Eye,
  ShoppingCart,
  FileText,
  CheckCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  WidgetEmptyState,
  ActionPill,
} from "@/components/ui/apple-kit";
import { SECONDARY_CTA } from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";

type NotificationType =
  | "lead_novo"
  | "lead_convertido"
  | "pagamento_recebido"
  | "pagamento_vencido"
  | "producao_avancou"
  | "entrega_pronta"
  | "galeria_criada"
  | "galeria_visualizada"
  | "pedido_recebido"
  | "contrato_assinado"
  | "sistema";

type FilterTab =
  | "todas"
  | "financeiro"
  | "producao"
  | "galeria"
  | "agenda"
  | "leads"
  | "sistema";

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description: string | null;
  read: boolean;
  route: string | null;
  created_at: string;
}

/* ── Action button config per notification type ── */
const typeActionMap: Partial<Record<NotificationType, { label: string; fallbackRoute: string }>> = {
  pagamento_vencido: { label: "Ver financeiro", fallbackRoute: "/financeiro" },
  pagamento_recebido: { label: "Ver financeiro", fallbackRoute: "/financeiro" },
  lead_novo: { label: "Ver lead", fallbackRoute: "/crm" },
  lead_convertido: { label: "Ver lead", fallbackRoute: "/crm" },
  producao_avancou: { label: "Ver produção", fallbackRoute: "/producao" },
  galeria_criada: { label: "Ver galeria", fallbackRoute: "/galeria" },
  galeria_visualizada: { label: "Ver galeria", fallbackRoute: "/galeria" },
  entrega_pronta: { label: "Ver entregas", fallbackRoute: "/producao" },
  contrato_assinado: { label: "Ver contratos", fallbackRoute: "/contratos" },
  pedido_recebido: { label: "Ver pedidos", fallbackRoute: "/pedidos" },
};

const typeIconMap: Record<NotificationType, typeof Bell> = {
  lead_novo: Users,
  lead_convertido: Check,
  pagamento_recebido: DollarSign,
  pagamento_vencido: AlertCircle,
  producao_avancou: Clapperboard,
  entrega_pronta: Package,
  galeria_criada: Image,
  galeria_visualizada: Eye,
  pedido_recebido: ShoppingCart,
  contrato_assinado: FileText,
  sistema: Bell,
};

const typeColorMap: Record<NotificationType, { color: string; bg: string }> = {
  lead_novo: { color: "var(--info)", bg: "var(--info-subtle)" },
  lead_convertido: { color: "var(--success)", bg: "var(--success-subtle)" },
  pagamento_recebido: { color: "var(--success)", bg: "var(--success-subtle)" },
  pagamento_vencido: { color: "var(--error)", bg: "var(--error-subtle)" },
  producao_avancou: { color: "var(--warning)", bg: "var(--warning-subtle)" },
  entrega_pronta: { color: "var(--success)", bg: "var(--success-subtle)" },
  galeria_criada: { color: "var(--info)", bg: "var(--info-subtle)" },
  galeria_visualizada: { color: "var(--info)", bg: "var(--info-subtle)" },
  pedido_recebido: { color: "var(--warning)", bg: "var(--warning-subtle)" },
  contrato_assinado: { color: "var(--success)", bg: "var(--success-subtle)" },
  sistema: { color: "var(--fg-muted)", bg: "var(--border-subtle)" },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "producao", label: "Produção" },
  { key: "galeria", label: "Galeria" },
  { key: "agenda", label: "Agenda" },
  { key: "leads", label: "Leads" },
  { key: "sistema", label: "Sistema" },
];

const filterTypeMap: Record<FilterTab, NotificationType[]> = {
  todas: [],
  financeiro: ["pagamento_recebido", "pagamento_vencido"],
  producao: ["producao_avancou", "entrega_pronta"],
  galeria: ["galeria_criada", "galeria_visualizada"],
  agenda: ["contrato_assinado"],
  leads: ["lead_novo", "lead_convertido"],
  sistema: ["sistema", "pedido_recebido"],
};

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  if (differenceInDays(new Date(), date) <= 7) return "Esta semana";
  return "Anteriores";
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm", { locale: ptBR });
  if (isYesterday(date)) return "Ontem, " + format(date, "HH:mm", { locale: ptBR });
  return format(date, "d MMM, HH:mm", { locale: ptBR });
}

export function NotificacoesClient({
  notifications: initial,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [markingAll, setMarkingAll] = useState(false);

  const filtered =
    activeTab === "todas"
      ? notifications
      : notifications.filter((n) =>
          filterTypeMap[activeTab].includes(n.type)
        );

  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    const group = getDateGroup(n.created_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const groupOrder = ["Hoje", "Ontem", "Esta semana", "Anteriores"];
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id: string) {
    const n = notifications.find((n) => n.id === id);
    if (!n || n.read) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao marcar como lida");
      return;
    }

    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("Notificação marcada como lida");
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      toast.error("Erro ao marcar todas como lidas");
      setMarkingAll(false);
      return;
    }

    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("Todas marcadas como lidas");
    setMarkingAll(false);
    router.refresh();
  }

  return (
    <PageTransition>
      <HeaderWidget
        title="Notificações"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
            : "Tudo em dia"
        }
      >
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className={SECONDARY_CTA}
          >
            {markingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Marcar todas como lidas
          </button>
        )}
      </HeaderWidget>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const count =
            tab.key === "todas"
              ? notifications.length
              : notifications.filter((n) =>
                  filterTypeMap[tab.key].includes(n.type)
                ).length;

          return (
            <ActionPill
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              count={count > 0 ? count : undefined}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <WidgetCard hover={false}>
          <WidgetEmptyState
            icon={Bell}
            title="Nenhuma notificação"
            description={
              activeTab === "todas"
                ? "Quando algo acontecer, você verá aqui."
                : "Nenhuma notificação nesta categoria."
            }
          />
        </WidgetCard>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupName) => {
            const items = grouped[groupName];
            if (!items || items.length === 0) return null;

            return (
              <motion.div key={groupName} {...springContentIn}>
                <h3 className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-3 px-1">
                  {groupName}
                </h3>
                <WidgetCard hover={false} className="divide-y divide-[var(--border-subtle)] overflow-hidden">
                  {items.map((notification, index) => {
                    const Icon = typeIconMap[notification.type] || Bell;
                    const colors = typeColorMap[notification.type] || typeColorMap.sistema;
                    const action = typeActionMap[notification.type];
                    const actionRoute = notification.route || action?.fallbackRoute;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 26,
                          delay: index * 0.04,
                        }}
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--sidebar-hover)] cursor-pointer ${
                          !notification.read ? "bg-[var(--info-subtle)]/30" : ""
                        }`}
                      >
                        <Icon size={18} className="text-[var(--fg-secondary)] shrink-0 mt-1" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className={`text-[13px] leading-snug ${
                                !notification.read
                                  ? "font-semibold text-[var(--fg)]"
                                  : "font-medium text-[var(--fg)]"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-[var(--fg-muted)] shrink-0 mt-0.5">
                              {formatTimestamp(notification.created_at)}
                            </span>
                          </div>
                          {notification.description && (
                            <p className="text-[11px] text-[var(--fg-secondary)] mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                          )}

                          {/* Quick action button */}
                          {action && actionRoute && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notification.read) markAsRead(notification.id);
                                router.push(actionRoute);
                              }}
                              className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--info)] bg-[var(--info-subtle)] hover:bg-[var(--info)]/15 transition-colors"
                            >
                              <ExternalLink size={11} />
                              {action.label}
                            </button>
                          )}
                        </div>

                        {!notification.read && (
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: "var(--info)" }} />
                        )}
                      </motion.div>
                    );
                  })}
                </WidgetCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
