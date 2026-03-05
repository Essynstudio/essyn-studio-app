/**
 * NotificacoesPage — Full Notification Center
 *
 * Complete notification history with:
 * - Filter by type (payment, production, lead, order, gallery)
 * - Mark all as read
 * - Links to context
 * - Time grouping (today, yesterday, this week, older)
 *
 * Reads from AppStore notifications.
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, Check, CheckCircle2, ChevronRight,
  DollarSign, Camera, Images, ShoppingBag,
  Users, AlertTriangle, X, Trash2,
  Filter, Eye, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { springDefault } from "../lib/motion-tokens";
import { WidgetCard, HeaderWidget } from "../components/ui/apple-kit";
import { useShellConfig } from "../components/ui/ShellContext";
import { useAppStore, type AppNotification } from "../lib/appStore";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";

/* ═══════════════════════════════════════════════════ */
/*  CONFIG                                             */
/* ═══════════════════════════════════════════════════ */

type NotifFilter = "todas" | "lead_converted" | "payment_received" | "production_advanced" | "delivery_ready" | "gallery_created" | "order_received";

const FILTER_TABS: { id: NotifFilter; label: string; icon: React.ReactNode }[] = [
  { id: "todas", label: "Todas", icon: <Bell className="w-3 h-3" /> },
  { id: "payment_received", label: "Pagamentos", icon: <DollarSign className="w-3 h-3" /> },
  { id: "production_advanced", label: "Produção", icon: <Camera className="w-3 h-3" /> },
  { id: "lead_converted", label: "Leads", icon: <Users className="w-3 h-3" /> },
  { id: "delivery_ready", label: "Entregas", icon: <Images className="w-3 h-3" /> },
  { id: "gallery_created", label: "Galerias", icon: <Images className="w-3 h-3" /> },
  { id: "order_received", label: "Pedidos", icon: <ShoppingBag className="w-3 h-3" /> },
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  lead_converted: { icon: <Users className="w-3.5 h-3.5" />, color: "#007AFF", bg: "#E8F0FE" },
  payment_received: { icon: <DollarSign className="w-3.5 h-3.5" />, color: "#34C759", bg: "#E8EFE5" },
  production_advanced: { icon: <Camera className="w-3.5 h-3.5" />, color: "#FF9500", bg: "#FFF0DC" },
  delivery_ready: { icon: <Images className="w-3.5 h-3.5" />, color: "#5856D6", bg: "#F0F0FF" },
  gallery_created: { icon: <Images className="w-3.5 h-3.5" />, color: "#FF9500", bg: "#FFF0DC" },
  order_received: { icon: <ShoppingBag className="w-3.5 h-3.5" />, color: "#007AFF", bg: "#E8F0FE" },
};

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function NotificacoesPage() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, clearNotifications } = useAppStore();
  const [filter, setFilter] = useState<NotifFilter>("todas");

  useShellConfig({
    breadcrumb: { section: "Sistema", page: "Notificações" },
  });

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    let result = [...notifications];
    if (filter !== "todas") result = result.filter((n) => n.type === filter);
    return result;
  }, [notifications, filter]);

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
    toast.success("Todas marcadas como lidas");
  };

  const handleClearAll = () => {
    clearNotifications();
    toast.success("Notificações limpas");
  };

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) markNotificationRead(notif.id);
    if (notif.route) navigate(notif.route);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      <OnboardingBanner
        id="notificacoes-intro"
        title="Central de Notificações"
        message="Veja todo o histórico de alertas, filtre por tipo e navegue diretamente para o contexto."
      />

      <HeaderWidget
        greeting="Notificações"
        userName=""
        contextLine={`${unread} não lida${unread !== 1 ? "s" : ""} · ${notifications.length} total`}
        delay={0}
      />

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleMarkAllRead}
          disabled={unread === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[12px] transition-colors cursor-pointer ${
            unread > 0 ? "text-[#007AFF] hover:bg-[#F5F5F7]" : "text-[#D1D1D6] cursor-not-allowed"
          }`}
          style={{ fontWeight: 500 }}
        >
          <Check className="w-3 h-3" />
          Marcar todas como lidas
        </button>
        <button
          onClick={handleClearAll}
          disabled={notifications.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[12px] transition-colors cursor-pointer ${
            notifications.length > 0 ? "text-[#FF3B30] hover:bg-[#FDEDEF]" : "text-[#D1D1D6] cursor-not-allowed"
          }`}
          style={{ fontWeight: 500 }}
        >
          <Trash2 className="w-3 h-3" />
          Limpar
        </button>
      </div>

      {/* KPI Strip */}
      <WidgetCard delay={0.02}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: "Total", value: notifications.length.toString(), icon: <Bell className="w-4 h-4" />, color: "#007AFF", bg: "#E8F0FE" },
            { label: "Não lidas", value: unread.toString(), icon: <Eye className="w-4 h-4" />, color: "#FF9500", bg: "#FFF0DC" },
            { label: "Pagamentos", value: notifications.filter((n) => n.type === "payment_received").length.toString(), icon: <DollarSign className="w-4 h-4" />, color: "#34C759", bg: "#E8EFE5" },
            { label: "Produção", value: notifications.filter((n) => n.type === "production_advanced").length.toString(), icon: <Camera className="w-4 h-4" />, color: "#5856D6", bg: "#F0F0FF" },
          ].map((kpi, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-5 py-4 ${idx > 0 ? "border-l border-[#F2F2F7]" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>{kpi.value}</span>
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{kpi.label}</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Notifications List */}
      <WidgetCard title="Histórico" count={filtered.length} delay={0.04}>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-[#F2F2F7] overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-[#1D1D1F] text-white"
                  : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#FAFAFA]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((notif, idx) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.lead_converted;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ ...springDefault, delay: idx * 0.015 }}
                  >
                    {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
                    <div
                      className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors group ${
                        notif.read ? "hover:bg-[#FAFAFA]" : "bg-[#FAFAFA] hover:bg-[#F5F5F7]"
                      }`}
                      onClick={() => handleClick(notif)}
                    >
                      {/* Unread dot */}
                      <div className="w-2 shrink-0 flex justify-center">
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-[#007AFF]" />}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] truncate ${notif.read ? "text-[#636366]" : "text-[#1D1D1F]"}`} style={{ fontWeight: notif.read ? 400 : 500 }}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
                          {notif.description}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="text-[10px] text-[#C7C7CC] shrink-0" style={{ fontWeight: 400 }}>
                        {notif.timestamp}
                      </span>

                      {/* Arrow */}
                      {notif.route && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#D1D1D6] group-hover:text-[#007AFF] transition-colors shrink-0" />
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springDefault}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#D1D1D6]" />
                </div>
                <p className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  Nenhuma notificação
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </WidgetCard>
    </div>
  );
}