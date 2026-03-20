"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconConfiguracoes } from "@/components/icons/essyn-icons";
import {
  Bell as IconBell,
  ChevronRight as IconChevronRight,
  Search as IconSearch,
  Moon as IconMoon,
  Sun as IconSun,
  Menu as IconMenu,
  LogOut as IconLogOut,
  User as IconUser,
  UserPlus,
  DollarSign,
  AlertCircle,
  Cog,
  ImageIcon,
  Eye,
  ShoppingBag,
  FileSignature,
  Info,
} from "lucide-react";

const IconNotifLeadNovo = UserPlus;
const IconNotifLeadConvertido = UserPlus;
const IconNotifPagamento = DollarSign;
const IconNotifPagamentoVencido = AlertCircle;
const IconNotifProducao = Cog;
const IconNotifEntrega = ImageIcon;
const IconNotifGaleriaCriada = ImageIcon;
const IconNotifGaleriaView = Eye;
const IconNotifPedido = ShoppingBag;
const IconNotifContrato = FileSignature;
const IconNotifSistema = Info;
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springPopoverIn, springOverlay, springSnappy } from "@/lib/motion-tokens";
import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import Link from "next/link";

interface TopbarProps {
  onMobileMenuToggle: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  studioName?: string;
  userEmail?: string;
}

/* ── Notification helpers ── */
type NType = "lead_novo" | "lead_convertido" | "pagamento_recebido" | "pagamento_vencido" | "producao_avancou" | "entrega_pronta" | "galeria_criada" | "galeria_visualizada" | "pedido_recebido" | "contrato_assinado" | "sistema";
interface QuickNotif { id: string; type: NType; title: string; description: string | null; read: boolean; route: string | null; created_at: string; }
const nIcon: Record<NType, typeof IconNotifSistema> = { lead_novo: IconNotifLeadNovo, lead_convertido: IconNotifLeadConvertido, pagamento_recebido: IconNotifPagamento, pagamento_vencido: IconNotifPagamentoVencido, producao_avancou: IconNotifProducao, entrega_pronta: IconNotifEntrega, galeria_criada: IconNotifGaleriaCriada, galeria_visualizada: IconNotifGaleriaView, pedido_recebido: IconNotifPedido, contrato_assinado: IconNotifContrato, sistema: IconNotifSistema };
const nActionLabel: Partial<Record<NType, { label: string; fallbackRoute: string }>> = {
  pagamento_vencido: { label: "Ver", fallbackRoute: "/financeiro" },
  pagamento_recebido: { label: "Ver", fallbackRoute: "/financeiro" },
  lead_novo: { label: "Ver lead", fallbackRoute: "/crm" },
  producao_avancou: { label: "Ver", fallbackRoute: "/producao" },
  galeria_criada: { label: "Ver", fallbackRoute: "/galeria" },
  galeria_visualizada: { label: "Ver", fallbackRoute: "/galeria" },
  entrega_pronta: { label: "Ver", fallbackRoute: "/producao" },
  contrato_assinado: { label: "Ver", fallbackRoute: "/contratos" },
  pedido_recebido: { label: "Ver", fallbackRoute: "/pedidos" },
};
function timeAgo(s: string) { const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000); if (diff < 60) return "agora"; if (diff < 3600) return `${Math.floor(diff / 60)}min`; if (diff < 86400) return `${Math.floor(diff / 3600)}h`; return `${Math.floor(diff / 86400)}d`; }

const pathLabels: Record<string, string> = {
  "/iris": "Iris",
  "/projetos": "Projetos",
  "/producao": "Produção",
  "/agenda": "Agenda",
  "/crm": "CRM",
  "/clientes": "Clientes",
  "/portal-cliente": "Portal do Cliente",
  "/galeria": "Galeria",
  "/financeiro": "Financeiro",
  "/pedidos": "Loja & Pedidos",
  "/contratos": "Contratos",
  "/whatsapp": "WhatsApp",
  "/email-templates": "Modelos de Email",
  "/notificacoes": "Notificações",
  "/time": "Time",
  "/relatorios": "Relatórios",
  "/automacoes": "Automações",
  "/mensagens": "Mensagens",
  "/integracoes": "Integrações",
  "/armazenamento": "Armazenamento",
  "/configuracoes": "Configurações",
  "/configuracoes/assinatura": "Assinatura",
  "/configuracoes/usuarios": "Usuários",
  "/configuracoes/templates": "Templates",
  "/configuracoes/equipamentos": "Equipamentos",
  "/configuracoes/financeiro-config": "Config. Financeiro",
};

export function Topbar({
  onMobileMenuToggle,
  isDark,
  onToggleDark,
  studioName,
  userEmail,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifs, setNotifs] = useState<QuickNotif[]>([]);
  const notifsRef = useRef<HTMLDivElement>(null);

  const { openPalette } = useCommandPalette();
  const currentLabel = pathLabels[pathname] || pathLabels[pathname.split("/").slice(0, 3).join("/")] || pathLabels[pathname.split("/").slice(0, 2).join("/")] || "Essyn";

  const unreadCount = notifs.filter(n => !n.read).length;

  const loadNotifs = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, description, read, route, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setNotifs(data as QuickNotif[]);
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Supabase Realtime — badge atualiza instantaneamente
  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as QuickNotif;
            setNotifs((prev) => [n, ...prev].slice(0, 8));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/entrar");
    router.refresh();
  }

  return (
    <header className="h-[var(--topbar-height)] border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] backdrop-blur-[20px] saturate-[1.8] flex items-center justify-between px-4 sm:px-5 lg:px-6 sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      {/* Left — Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 -ml-2 text-[var(--fg-muted)] hover:text-[var(--fg)]"
          aria-label="Abrir menu"
        >
          <IconMenu size={20} />
        </button>

        {pathname !== "/iris" && (
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-[var(--fg-muted)] font-[family-name:var(--font-fraunces)] text-[13px] font-light">essyn</span>
            <IconChevronRight size={11} className="text-[var(--border-strong)]" />
            <span className="font-medium text-[var(--fg)] text-[13px]">{currentLabel}</span>
          </nav>
        )}
      </div>

      {/* Center — Search (desktop only) */}
      <div className="hidden lg:flex items-center max-w-[320px] w-full mx-4">
        <button
          onClick={openPalette}
          className="relative w-full group flex items-center h-9 pl-8 pr-3 rounded-[8px] bg-[var(--bg-subtle)] text-[12px] text-[var(--fg-muted)] cursor-pointer hover:bg-[var(--bg)] transition-all duration-150 tracking-[-0.004em]"
        >
          <IconSearch
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] transition-colors group-hover:text-[var(--fg-secondary)]"
          />
          <span>Buscar...</span>
          <kbd className="ml-auto text-[10px] text-[var(--fg-muted)] bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-0.5">
        {/* Mobile search button */}
        <button
          onClick={openPalette}
          className="lg:hidden p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-all"
          aria-label="Buscar"
        >
          <IconSearch size={17} />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-all"
          title={isDark ? "Modo claro" : "Modo escuro"}
          aria-label={isDark ? "Alternar para modo claro" : "Alternar para modo escuro"}
        >
          {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>

        {/* Notifications dropdown */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setNotifsOpen(!notifsOpen); if (!notifsOpen) loadNotifs(); }}
            className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-all relative"
            aria-label="Notificações"
          >
            <IconBell size={17} />
            {unreadCount > 0 && (
              <motion.span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--error)] rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </button>

          <AnimatePresence>
            {notifsOpen && (
              <motion.div
                {...springPopoverIn}
                className="absolute right-0 top-full mt-2 w-[min(340px,calc(100vw-24px))] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--card)] shadow-[var(--shadow-xl)] z-50 origin-top-right overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                  <p className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Notificações</p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--info)] text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[360px] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="py-10 text-center">
                      <IconBell size={22} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-30" />
                      <p className="text-[12px] text-[var(--fg-muted)]">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifs.map(n => {
                      const Icon = nIcon[n.type] || IconNotifSistema;
                      const action = nActionLabel[n.type];
                      const actionRoute = n.route || action?.fallbackRoute;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                            if (n.route) { router.push(n.route); setNotifsOpen(false); }
                          }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--sidebar-hover)] cursor-pointer ${!n.read ? "bg-[var(--info-subtle)]/30" : ""}`}
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--bg-subtle)]">
                            <Icon size={13} className="text-[var(--fg-secondary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[12px] leading-snug ${!n.read ? "font-semibold text-[var(--fg)]" : "font-medium text-[var(--fg-secondary)]"}`}>
                                {n.title}
                              </p>
                              <span className="text-[9px] text-[var(--fg-muted)] shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                            </div>
                            {n.description && (
                              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5 line-clamp-1">{n.description}</p>
                            )}
                            {/* Quick action buttons */}
                            {action && actionRoute && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!n.read) markRead(n.id);
                                    router.push(actionRoute);
                                    setNotifsOpen(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-[var(--info)] bg-[var(--info-subtle)] hover:bg-[var(--info)]/15 transition-colors"
                                >
                                  {action.label}
                                </button>
                              </div>
                            )}
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--info)] shrink-0 mt-2" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--border-subtle)]">
                  <Link
                    href="/notificacoes"
                    onClick={() => setNotifsOpen(false)}
                    className="block w-full text-center py-2.5 text-[12px] font-medium text-[var(--info)] hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    Ver todas
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar menu */}
        <div ref={avatarRef} className="relative ml-1.5">
          <motion.button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="w-8 h-8 rounded-full bg-[var(--bg-ink)] flex items-center justify-center text-[var(--fg-light)] text-xs font-medium"
            aria-label="Menu do usuário"
          >
            {(studioName || userEmail || "U").charAt(0).toUpperCase()}
          </motion.button>

          <AnimatePresence>
            {avatarMenuOpen && (
              <motion.div
                {...springPopoverIn}
                className="absolute right-0 top-full mt-2 w-[min(208px,calc(100vw-24px))] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--card)] shadow-[var(--shadow-xl)] py-1 z-50 origin-top-right overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                  <p className="text-[13px] font-semibold text-[var(--fg)] truncate tracking-[-0.006em]">
                    {studioName || "Meu Estúdio"}
                  </p>
                  <p className="text-[11px] text-[var(--fg-muted)] truncate mt-0.5 tracking-[-0.003em]">
                    {userEmail || ""}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push("/configuracoes");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    <IconConfiguracoes size={15} />
                    Configurações
                  </button>
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push("/configuracoes/assinatura");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    <IconUser size={15} />
                    Minha conta
                  </button>
                </div>
                <div className="border-t border-[var(--border-subtle)] py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-[var(--error)] hover:bg-[var(--sidebar-hover)] transition-colors"
                  >
                    <IconLogOut size={15} />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
