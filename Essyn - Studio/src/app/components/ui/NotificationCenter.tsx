import { useState, useRef, useEffect, useMemo, forwardRef, type ReactNode } from "react";
import {
  Bell,
  DollarSign,
  Camera,
  Images,
  Calendar,
  Users,
  Settings,
  X,
  Check,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useDk } from "../../lib/useDarkColors";

/* ─── Types ─── */

export type NotificationType = "financeiro" | "producao" | "galeria" | "agenda" | "leads" | "sistema";
export type NotificationPriority = "alta" | "media" | "baixa";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: {
    projectId?: string;
    clientName?: string;
    amount?: number;
    dueDate?: Date;
  };
}

/* ─── Mock Data ─── */

const now = Date.now();
const mockNotifications: Notification[] = [
  {
    id: "0",
    type: "sistema",
    priority: "media",
    title: "Atualização disponível",
    message: "Nova versão do ESSYN com melhorias de performance",
    timestamp: new Date(now - 2 * 60 * 1000), // 2 minutes ago
    read: false,
    actionLabel: "Ver novidades",
    actionUrl: "/",
  },
  {
    id: "1",
    type: "financeiro",
    priority: "alta",
    title: "Parcela vencida",
    message: "Casamento Silva - Parcela 2/3 venceu há 3 dias (R$ 2.500)",
    timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
    read: false,
    actionLabel: "Ver cobrança",
    actionUrl: "/financeiro",
    metadata: { clientName: "Silva", amount: 2500 },
  },
  {
    id: "2",
    type: "financeiro",
    priority: "media",
    title: "Nota fiscal pendente",
    message: "Formatura Oliveira - NF-e aguardando emissão (R$ 4.200)",
    timestamp: new Date(now - 2 * 60 * 60 * 1000),
    read: false,
    actionLabel: "Emitir NF",
    actionUrl: "/financeiro",
    metadata: { clientName: "Oliveira", amount: 4200 },
  },
  {
    id: "3",
    type: "producao",
    priority: "alta",
    title: "Prazo de entrega próximo",
    message: "Ensaio Casal Martins - Entrega em 48h",
    timestamp: new Date(now - 5 * 60 * 60 * 1000),
    read: false,
    actionLabel: "Abrir projeto",
    actionUrl: "/producao",
    metadata: { projectId: "proj-123", clientName: "Martins" },
  },
  {
    id: "4",
    type: "galeria",
    priority: "media",
    title: "Cliente visualizou galeria",
    message: "Aniversário Costa - Cliente acessou pela 1ª vez",
    timestamp: new Date(now - 1 * 60 * 60 * 1000),
    read: true,
    actionLabel: "Ver galeria",
    actionUrl: "/galeria",
    metadata: { clientName: "Costa" },
  },
  {
    id: "5",
    type: "agenda",
    priority: "alta",
    title: "Evento amanhã",
    message: "Casamento Fernandes - 14h no Villa Bisutti",
    timestamp: new Date(now - 30 * 60 * 60 * 1000),
    read: false,
    actionLabel: "Ver agenda",
    actionUrl: "/agenda",
    metadata: { clientName: "Fernandes" },
  },
  {
    id: "6",
    type: "leads",
    priority: "media",
    title: "Novo lead recebido",
    message: "Proposta de casamento para Setembro/2026",
    timestamp: new Date(now - 4 * 60 * 60 * 1000),
    read: true,
    actionLabel: "Ver lead",
    actionUrl: "/crm",
  },
  {
    id: "7",
    type: "financeiro",
    priority: "media",
    title: "Pagamento confirmado",
    message: "Batizado Souza - Pix R$ 1.800 recebido",
    timestamp: new Date(now - 6 * 60 * 60 * 1000),
    read: true,
    actionLabel: "Ver recebimento",
    actionUrl: "/financeiro",
    metadata: { clientName: "Souza", amount: 1800 },
  },
  {
    id: "8",
    type: "producao",
    priority: "media",
    title: "Aprovação pendente",
    message: "Editorial Moda - Cliente precisa aprovar seleção",
    timestamp: new Date(now - 12 * 60 * 60 * 1000),
    read: true,
    actionLabel: "Acompanhar",
    actionUrl: "/producao",
  },
];

/* ─── Category Config ─── */

const categoryConfig: Record<
  NotificationType | "todas",
  { label: string; icon: ReactNode; color: string }
> = {
  todas: {
    label: "Todas",
    icon: <Bell className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  financeiro: {
    label: "Financeiro",
    icon: <DollarSign className="w-3.5 h-3.5" />,
    color: "#007AFF",
  },
  producao: {
    label: "Produção",
    icon: <Camera className="w-3.5 h-3.5" />,
    color: "#007AFF",
  },
  galeria: {
    label: "Galeria",
    icon: <Images className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  agenda: {
    label: "Agenda",
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  leads: {
    label: "Leads",
    icon: <Users className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  sistema: {
    label: "Sistema",
    icon: <Settings className="w-3.5 h-3.5" />,
    color: "#636366",
  },
};

/* ─── Priority Config ─── */

const priorityConfig: Record<NotificationPriority, { icon: ReactNode; color: string; label: string }> = {
  alta: {
    icon: <AlertCircle className="w-3 h-3" />,
    color: "#FF3B30",
    label: "Alta prioridade",
  },
  media: {
    icon: <Clock className="w-3 h-3" />,
    color: "#FF9500",
    label: "Média prioridade",
  },
  baixa: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: "#636366",
    label: "Baixa prioridade",
  },
};

/* ─── Time Formatter ─── */

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "ontem";
  return `${days}d`;
}

/* ─── Check if notification is new (< 5min) ─── */

function isNewNotification(date: Date): boolean {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  return minutes < 5;
}

/* ─── Sort by priority then timestamp ─── */

function sortNotifications(notifications: Notification[]): Notification[] {
  const priorityOrder: Record<NotificationPriority, number> = {
    alta: 0,
    media: 1,
    baixa: 2,
  };

  return [...notifications].sort((a, b) => {
    // First sort by priority (alta → media → baixa)
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by timestamp (most recent first)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

/* ─── Notification Item ─── */

const NotificationItem = forwardRef<
  HTMLDivElement,
  {
    notification: Notification;
    onRead: (id: string) => void;
    onAction: (url?: string) => void;
  }
>(({ notification, onRead, onAction }, ref) => {
  const categoryInfo = categoryConfig[notification.type];
  const priorityInfo = priorityConfig[notification.priority];
  const isNew = isNewNotification(notification.timestamp);
  const { isDark } = useDk();

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={`group relative px-4 py-3 transition-colors ${
        isDark
          ? `border-b border-[#2C2C2E] ${notification.read ? "bg-[#141414]" : "bg-[#1C1C1E]"} hover:bg-[#1C1C1E]`
          : `border-b border-[#F2F2F7] ${notification.read ? "bg-white" : "bg-[#FAFAFA]"} hover:bg-[#FAFAFA]`
      }`}
    >
      {/* Priority indicator (left border) */}
      {notification.priority === "alta" && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: priorityInfo.color }}
        />
      )}

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ backgroundColor: isDark ? "#2C2C2E" : "#F5F5F7", color: categoryInfo.color }}
        >
          {categoryInfo.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              <span
                className={`text-[13px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                style={{ fontWeight: 500 }}
              >
                {notification.title}
              </span>
              
              {/* NEW badge (< 5min) */}
              {isNew && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-[#F59E0B] text-white uppercase tracking-wider"
                  style={{ fontWeight: 700 }}
                >
                  Novo
                </motion.span>
              )}
              
              {/* Priority badge for alta/media */}
              {notification.priority !== "baixa" && (
                <span
                  className="shrink-0"
                  style={{ color: priorityInfo.color }}
                  title={priorityInfo.label}
                >
                  {priorityInfo.icon}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#8E8E93] shrink-0" style={{ fontWeight: 400 }}>
              {formatTimeAgo(notification.timestamp)}
            </span>
          </div>

          <p className={`text-[12px] mb-2 ${isDark ? "text-[#8E8E93]" : "text-[#636366]"}`} style={{ fontWeight: 400 }}>
            {notification.message}
          </p>

          {/* Action */}
          {notification.actionLabel && (
            <button
              type="button"
              onClick={() => onAction(notification.actionUrl)}
              className="flex items-center gap-1 text-[12px] text-[#007AFF] hover:text-[#0066D6] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              {notification.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mark as read (visible on hover OR focus) */}
        {!notification.read && (
          <button
            type="button"
            onClick={() => onRead(notification.id)}
            className={`opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer ${
              isDark ? "hover:bg-[#2C2C2E] text-[#636366] hover:text-[#8E8E93]" : "hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#636366]"
            }`}
            title="Marcar como lida"
            aria-label="Marcar como lida"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
});

NotificationItem.displayName = "NotificationItem";

/* ─── Main Component ─── */

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationType | "todas">("todas");
  const [, forceUpdate] = useState(0); // Force re-render for timestamp updates
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  /* Auto-update timestamps every 60 seconds */
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      forceUpdate((prev) => prev + 1);
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [isOpen]);

  /* Focus trap: auto-focus on open */
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  /* Close on outside click (exclude bell button) */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Ignore if clicking the bell button itself
      if (target.closest('[aria-label="Notificações"]')) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }
    if (isOpen) {
      // Delay to avoid immediate trigger
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  /* Keyboard: Escape to close */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* Handle action click */
  function handleAction(url?: string) {
    if (url) {
      navigate(url);
      onClose();
    }
  }

  /* Calculate counts (memoized for performance) */
  const totalUnread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  /* Apply smart sorting (priority → timestamp) then filter */
  const filtered = useMemo(() => {
    const sorted = sortNotifications(notifications);
    return activeFilter === "todas"
      ? sorted
      : sorted.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  /* Filter counts (memoized for performance) */
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts.todas = notifications.filter((n) => !n.read).length;
    (["financeiro", "producao", "galeria", "agenda", "leads", "sistema"] as const).forEach((type) => {
      counts[type] = notifications.filter((n) => n.type === type && !n.read).length;
    });
    return counts;
  }, [notifications]);

  const { isDark: panelDark } = useDk();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`absolute right-0 top-full mt-2 w-full max-w-[420px] max-h-[600px] rounded-2xl border overflow-hidden z-50 ${
            panelDark ? "border-[#2C2C2E] bg-[#141414]" : "border-[#E5E5EA] bg-white"
          }`}
          style={{ 
            minWidth: "320px",
            boxShadow: panelDark ? "0 8px 32px #000000" : "0 8px 32px #E5E5EA"
          }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 ${
            panelDark ? "border-b border-[#2C2C2E] bg-[#1C1C1E]" : "border-b border-[#F2F2F7] bg-[#FAFAFA]"
          }`}>
            <div className="flex items-center gap-2">
              <Bell className={`w-4 h-4 ${panelDark ? "text-[#8E8E93]" : "text-[#636366]"}`} />
              <h3 className={`text-[15px] ${panelDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`} style={{ fontWeight: 600 }}>
                Notificações
              </h3>
              {totalUnread > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full bg-[#007AFF] text-[10px] text-white"
                  style={{ fontWeight: 600 }}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {totalUnread}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-[12px] text-[#636366] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className={`flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer ${
                  panelDark ? "hover:bg-[#2C2C2E] text-[#636366] hover:text-[#8E8E93]" : "hover:bg-[#F2F2F7] text-[#8E8E93] hover:text-[#636366]"
                }`}
                aria-label="Fechar notificações"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`flex items-center gap-2 px-5 py-3 overflow-x-auto ${
            panelDark ? "border-b border-[#2C2C2E]" : "border-b border-[#F2F2F7]"
          }`}>
            {(["todas", "financeiro", "producao", "galeria", "agenda", "leads", "sistema"] as const).map(
              (filter) => {
                const config = categoryConfig[filter];
                const count = filterCounts[filter] || 0;
                const isActive = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer whitespace-nowrap ${
                      panelDark
                        ? isActive
                          ? "bg-[#2C2C2E] text-[#F5F5F7] border border-[#3C3C43]"
                          : "bg-[#141414] text-[#8E8E93] border border-[#2C2C2E] hover:bg-[#1C1C1E]"
                        : isActive
                          ? "bg-[#F0EDE8] text-[#1D1D1F] border border-[#E5E0D8]"
                          : "bg-white text-[#636366] border border-[#F2F2F7] hover:bg-[#FAFAFA]"
                    }`}
                    style={{ fontWeight: isActive ? 600 : 500 }}
                  >
                    <span style={{ color: isActive ? config.color : undefined }}>
                      {config.icon}
                    </span>
                    {config.label}
                    {count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          isActive
                            ? "bg-[#007AFF] text-white"
                            : panelDark
                              ? "bg-[#2C2C2E] text-[#636366]"
                              : "bg-[#F2F2F7] text-[#8E8E93]"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[420px]">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-6"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-[#8E8E93]" />
                  </div>
                  <p className="text-[14px] text-[#636366] text-center" style={{ fontWeight: 500 }}>
                    Nenhuma notificação
                  </p>
                  <p className="text-[12px] text-[#8E8E93] text-center mt-1" style={{ fontWeight: 400 }}>
                    {activeFilter === "todas" ? "Você está em dia! 🎉" : "Tudo limpo nesta categoria"}
                  </p>
                </motion.div>
              ) : (
                filtered.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={onMarkAsRead}
                    onAction={handleAction}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className={`px-5 py-3 ${
              panelDark ? "border-t border-[#2C2C2E] bg-[#1C1C1E]" : "border-t border-[#F2F2F7] bg-[#FAFAFA]"
            }`}>
              <button
                type="button"
                onClick={() => {
                  if (activeFilter !== "todas") {
                    setActiveFilter("todas");
                  } else {
                    onClose();
                  }
                }}
                className={`w-full text-center text-[12px] transition-colors cursor-pointer ${
                  panelDark ? "text-[#8E8E93] hover:text-[#F5F5F7]" : "text-[#636366] hover:text-[#1D1D1F]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {activeFilter !== "todas" ? "Ver todas →" : "Fechar"}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Export mock data for parent components ─── */
export { mockNotifications };