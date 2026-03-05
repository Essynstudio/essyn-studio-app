/**
 * NotificationsWidget — Apple Premium KIT widget
 *
 * Displays AppStore notifications inline on the Dashboard.
 * Fully integrated with useAppStore — live updates on
 * lead conversions, payments, production changes.
 *
 * Zero transparency rule: compliant.
 */
import { useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  FolderKanban,
  Layers,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { springContentIn } from "../../lib/motion-tokens";
import { useAppStore, type AppNotification } from "../../lib/appStore";
import { WidgetCard, WidgetEmptyState, WidgetHairline } from "../ui/apple-kit";
import { useDk } from "../../lib/useDarkColors";

/* ── Notification type → visual ── */
function getNotifIcon(type: AppNotification["type"]) {
  switch (type) {
    case "lead_converted":
      return <FolderKanban className="w-3.5 h-3.5 text-[#007AFF]" />;
    case "payment_received":
      return <CreditCard className="w-3.5 h-3.5 text-[#34C759]" />;
    case "production_advanced":
      return <Layers className="w-3.5 h-3.5 text-[#FF9500]" />;
    case "delivery_ready":
      return <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />;
    default:
      return <Bell className="w-3.5 h-3.5 text-[#8E8E93]" />;
  }
}

function getNotifAccent(type: AppNotification["type"]): string {
  switch (type) {
    case "lead_converted": return "#EBF5FF";
    case "payment_received": return "#F0FFF4";
    case "production_advanced": return "#FFF8F0";
    case "delivery_ready": return "#F0FFF4";
    default: return "#F5F5F7";
  }
}

function getNotifAccentDark(type: AppNotification["type"]): string {
  switch (type) {
    case "lead_converted": return "#0A1A2E";
    case "payment_received": return "#0A1E0F";
    case "production_advanced": return "#1E150A";
    case "delivery_ready": return "#0A1E0F";
    default: return "#1C1C1E";
  }
}

export function NotificationsWidget() {
  const { notifications, markNotificationRead, clearNotifications } = useAppStore();
  const navigate = useNavigate();
  const { isDark } = useDk();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications]
  );

  function handleClick(notif: AppNotification) {
    if (!notif.read) markNotificationRead(notif.id);
    if (notif.route) navigate(notif.route);
  }

  return (
    <WidgetCard
      title="Notificacoes"
      count={unreadCount > 0 ? unreadCount : undefined}
      action={unreadCount > 0 ? "Marcar todas lidas" : undefined}
      onAction={unreadCount > 0 ? clearNotifications : undefined}
      delay={0.12}
    >
      {visibleNotifications.length === 0 ? (
        <WidgetEmptyState
          icon={<Bell className="w-6 h-6" />}
          message="Nenhuma notificacao recente."
        />
      ) : (
        <AnimatePresence initial={false}>
          {visibleNotifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springContentIn}
              className="overflow-hidden"
            >
              {i > 0 && <WidgetHairline indent={46} />}
              <button
                type="button"
                onClick={() => handleClick(notif)}
                className={`flex items-start gap-3 w-full text-left px-5 py-3 transition-colors cursor-pointer group ${
                  isDark ? "hover:bg-[#1C1C1E]" : "hover:bg-[#FAFAFA]"
                }`}
              >
                {/* Icon circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: isDark ? getNotifAccentDark(notif.type) : getNotifAccent(notif.type) }}
                >
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[12px] truncate ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                      style={{ fontWeight: notif.read ? 400 : 600 }}
                    >
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shrink-0" />
                    )}
                  </div>
                  <span
                    className="text-[11px] text-[#8E8E93] line-clamp-1"
                    style={{ fontWeight: 400 }}
                  >
                    {notif.description}
                  </span>
                  <span
                    className="text-[10px] text-[#AEAEB2] mt-0.5 block"
                    style={{ fontWeight: 400 }}
                  >
                    {notif.timestamp}
                  </span>
                </div>

                {/* Navigate arrow */}
                {notif.route && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </WidgetCard>
  );
}