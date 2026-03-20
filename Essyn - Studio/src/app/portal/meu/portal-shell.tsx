"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, ChevronDown, MessageCircle, CalendarDays } from "lucide-react";
import {
  IconPortal, IconGaleria, IconFinanceiro, IconContratos,
  IconEntregas, IconLoja, IconMensagens,
} from "@/components/icons/essyn-icons";
import { EssynIcon } from "@/components/icons/EssynIcon";
import { springDefault } from "@/lib/motion-tokens";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { PortalSessionData } from "./layout";
import { PortalSessionProvider } from "./portal-session-context";

interface Props {
  sessionData: PortalSessionData;
  children: React.ReactNode;
}

/* ---- Background — Essyn warm teal + gold ---- */
const BG = [
  "radial-gradient(ellipse 120% 80% at 10% 0%, #C9B99A 0%, transparent 50%)",
  "radial-gradient(ellipse 90% 70% at 90% 10%, #BBA888 0%, transparent 45%)",
  "radial-gradient(ellipse 100% 90% at 50% 95%, #C4B49A 0%, transparent 50%)",
  "radial-gradient(ellipse 60% 55% at 0% 65%, #B8A890 0%, transparent 40%)",
  "radial-gradient(ellipse 65% 45% at 100% 60%, #AF9F85 0%, transparent 40%)",
  "radial-gradient(ellipse 45% 35% at 35% 35%, #D2C4AC 0%, transparent 35%)",
  "radial-gradient(circle 30% at 70% 50%, rgba(44,68,77,0.04) 0%, transparent 100%)",
  "linear-gradient(155deg, #D6CBBA 0%, #C8BAA2 20%, #BDAF96 45%, #C4B69E 70%, #D0C2AA 100%)",
].join(", ");

/* ---- Tokens — Essyn palette ---- */
const fg = "#2D2A26";
const muted = "#8E8880";
const subtle = "#B5AFA6";
const accent = "#A58D66"; // Essyn gold
const accentBg = "rgba(165,141,102,0.12)";

/* ---- Nav items — Essyn custom icons ---- */
function PortalIcon({ size = 16, className }: { size?: number; className?: string }) {
  return <EssynIcon name="visao-geral" size={size} className={className} />;
}

function AgendaIcon({ size = 16, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return <CalendarDays size={size} className={className} style={style} />;
}

const BASE_NAV: { href: string; label: string; icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>; exact?: boolean; onlyCasamento?: boolean }[] = [
  { href: "/portal/meu", label: "Resumo", icon: PortalIcon, exact: true },
  { href: "/portal/meu/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/portal/meu/galeria", label: "Galeria", icon: IconGaleria },
  { href: "/portal/meu/pagamentos", label: "Pagamentos", icon: IconFinanceiro },
  { href: "/portal/meu/contrato", label: "Contrato", icon: IconContratos },
  { href: "/portal/meu/briefing", label: "Briefing", icon: IconEntregas, onlyCasamento: true },
  { href: "/portal/meu/servicos", label: "Serviços", icon: IconLoja },
  { href: "/portal/meu/mensagens", label: "Mensagens", icon: IconMensagens },
];

export function PortalShell({ sessionData, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const bgUrl = sessionData.branding.portalBgUrl;
  const isCasamento = sessionData.eventType === "casamento";
  const NAV = BASE_NAV.filter(item => !item.onlyCasamento || isCasamento);

  const handleLogout = () => {
    document.cookie = "portal_session=; path=/portal; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/portal");
  };

  const initials = sessionData.client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = sessionData.client.name.split(" ")[0];

  const isActive = (item: typeof BASE_NAV[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen relative">

      {/* ═══ Background ═══ */}
      <div className="fixed inset-0 z-0">
        {bgUrl ? (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgUrl})`, filter: "blur(8px) saturate(1.1)", transform: "scale(1.05)" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: BG }} />
        )}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />
      </div>

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="fixed left-0 top-0 bottom-0 w-48 z-30 hidden md:flex flex-col backdrop-blur-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRight: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "1px 0 20px rgba(0,0,0,0.04)",
        }}
      >
        {/* Studio branding — Essyn monogram + name */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[22%] bg-[#2C444D] flex items-center justify-center shrink-0 relative overflow-hidden">
            <div className="absolute inset-[8%] rounded-full border border-[rgba(194,173,144,0.33)]" />
            <span className="font-[family-name:var(--font-playfair)] text-[9px] font-normal text-[#C2AD90] tracking-[0.05em] relative z-10">
              ES
            </span>
          </div>
          <span className="text-[14px] font-medium truncate" style={{ color: fg }}>
            {sessionData.studio.name}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={active
                  ? { backgroundColor: "rgba(255,255,255,0.45)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)" }
                  : { backgroundColor: "transparent" }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Icon size={16} style={{ color: active ? accent : muted }} />
                <span className="text-[13px] font-medium" style={{ color: active ? fg : muted }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 space-y-2">
          {sessionData.studio.phone && (
            <a href={`https://wa.me/${sessionData.studio.phone.replace(/\D/g, "")}?text=Ol%C3%A1!`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/20"
            >
              <MessageCircle size={14} className="text-[#25D366]" />
              <span className="text-[11px]" style={{ color: subtle }}>WhatsApp</span>
            </a>
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.35)" }} className="pt-3">
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/20"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.5)", color: "#6B6560", border: "1px solid rgba(255,255,255,0.55)" }}
                >{initials}</div>
                <div className="text-left min-w-0">
                  <p className="text-[11px] font-semibold truncate" style={{ color: fg }}>{firstName}</p>
                  <p className="text-[9px] truncate" style={{ color: subtle }}>{sessionData.client.email}</p>
                </div>
                <ChevronDown size={10} style={{ color: subtle, transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "none" }} className="ml-auto shrink-0" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={springDefault}
                      className="absolute left-0 bottom-full mb-2 w-full backdrop-blur-2xl rounded-xl overflow-hidden z-50"
                      style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 -8px 30px rgba(0,0,0,0.1)" }}
                    >
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-[12px] hover:bg-white/40 transition-colors" style={{ color: muted }}>
                        <LogOut size={13} /> Sair do portal
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <a href="https://essyn.studio" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-[9px] pt-1 transition-colors hover:opacity-70"
            style={{ color: "rgba(100,90,80,0.3)" }}
          >
            <span className="font-[family-name:var(--font-playfair)] tracking-[0.08em] uppercase text-[8px]">ESSYN</span>
            <span style={{ color: "rgba(165,141,102,0.4)" }}>·</span>
            <span className="font-[family-name:var(--font-cormorant)] tracking-[0.15em] uppercase text-[7px] font-light">STUDIO</span>
          </a>
        </div>
      </aside>

      {/* ═══ Mobile Header ═══ */}
      <header className="sticky top-0 z-40 md:hidden backdrop-blur-3xl"
        style={{ backgroundColor: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 1px 20px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between px-5 h-13">
          <span className="text-[14px]" style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: fg }}>
            {sessionData.studio.name}
          </span>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-white/30"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", color: "#6B6560", border: "1px solid rgba(255,255,255,0.55)" }}
            >{initials}</div>
          </button>
        </div>
      </header>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.45)",
          borderTop: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 -1px 20px rgba(0,0,0,0.04)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-around px-2 h-14">
          {NAV.slice(0, 5).map(item => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all"
              >
                <Icon size={18} style={{ color: active ? accent : subtle }} />
                <span className="text-[8px] font-medium" style={{ color: active ? accent : subtle }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══ Content ═══ */}
      <main className="relative z-10 md:ml-48 min-h-screen md:pb-0 pb-20">
        <PortalSessionProvider data={sessionData}>
          {children}
        </PortalSessionProvider>
      </main>
    </div>
  );
}
