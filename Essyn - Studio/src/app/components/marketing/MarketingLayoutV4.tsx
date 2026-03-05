// Monochrome Canvas — marketing layout
import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springToggle, springSnappy, springDefault } from "../../lib/motion-tokens";
import { Instagram, Youtube, Menu, X, ChevronDown, Calendar, DollarSign, Image } from "lucide-react";
import gsap from "gsap";
import { DISPLAY, GOLD } from "../ui/editorial";

const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const P = "/v4";
const INK = "#1D1D1F";

const navLinks = [
  { path: `${P}/recursos`, label: "Recursos", hasDropdown: true },
  { path: `${P}/planos`, label: "Planos" },
  { path: `${P}/casos`, label: "Cases" },
  { path: `${P}/faq`, label: "FAQ" },
];

const recursosDropdown = [
  { icon: Calendar, label: "Agenda", desc: "Calendário e operação", to: `${P}/recursos` },
  { icon: DollarSign, label: "Financeiro", desc: "PIX, NF-e e cobrança", to: `${P}/recursos` },
  { icon: Image, label: "Galeria", desc: "Entrega premium", to: `${P}/recursos` },
];

const footerCols = {
  produto: [
    { label: "Recursos", to: `${P}/recursos` },
    { label: "Planos & Preços", to: `${P}/planos` },
    { label: "Casos de uso", to: `${P}/casos` },
    { label: "FAQ", to: `${P}/faq` },
  ],
  empresa: [
    { label: "Segurança & LGPD", to: `${P}/seguranca` },
    { label: "Termos de Uso", to: `${P}/faq` },
    { label: "Privacidade", to: `${P}/faq` },
    { label: "Contato", to: `${P}/faq` },
  ],
};

export function MarketingLayoutV4() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [recursosOpen, setRecursosOpen] = useState(false);
  const [mobileRecursosOpen, setMobileRecursosOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLanding = location.pathname === P || location.pathname === `${P}/`;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMobileOpen(false); setRecursosOpen(false); }, [location.pathname]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!recursosOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setRecursosOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [recursosOpen]);

  const onDarkHero = isLanding && !scrolled;
  const navSolid = scrolled || mobileOpen || !isLanding;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-sans)", background: "#FAFAFA" }}>
      {/* ═══ NAVBAR — 72px ═══ */}
      <header ref={navRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{ transitionTimingFunction: ease }}>
        <nav
          className={`mx-auto flex items-center justify-between transition-all duration-500 ${
            navSolid
              ? "bg-white border-b border-[#E5E5EA] shadow-[0_1px_8px_#E5E5EA]"
              : "bg-transparent border-b border-transparent"
          }`}
          style={{ height: 72, paddingLeft: 32, paddingRight: 32, transitionTimingFunction: ease }}
        >
          {/* (A) LEFT — Logo */}
          <Link to={P} className="flex items-center gap-1.5 flex-shrink-0 group">
            <span
              className={`text-[17px] tracking-[-0.05em] transition-colors duration-300 ${onDarkHero ? "text-white" : "text-[#1D1D1F]"}`}
              style={{ fontWeight: 700 }}
            >
              ESSYN
            </span>
            <span className="w-[5px] h-[5px] rounded-full transition-all duration-300 group-hover:scale-125" style={{ background: GOLD }} />
          </Link>

          {/* (B) CENTER — Links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => {
              const active = location.pathname === l.path;
              if (l.hasDropdown) {
                return (
                  <div key={l.path} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setRecursosOpen(!recursosOpen)}
                      className={`relative flex items-center gap-1 px-4 py-2 text-[14px] rounded-full transition-all duration-200 cursor-pointer ${
                        active || recursosOpen
                          ? onDarkHero ? "text-white" : "text-[#1D1D1F]"
                          : onDarkHero ? "text-[#AEAEB2]  hover:text-[#D1D1D6]" : "text-[#8E8E93] hover:text-[#48484A]"
                      }`}
                      style={{ fontWeight: active || recursosOpen ? 500 : 400 }}
                    >
                      {l.label}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${recursosOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {recursosOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[260px] rounded-2xl bg-white border border-[#E5E5EA] shadow-[0_12px_40px_#D1D1D6] overflow-hidden"
                        >
                          <div className="p-2">
                            {recursosDropdown.map((item) => (
                              <Link
                                key={item.label}
                                to={item.to}
                                onClick={() => setRecursosOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F5F5F7] transition-colors group"
                              >
                                <div className="w-9 h-9 rounded-lg bg-[#F5F2EE] flex items-center justify-center flex-shrink-0 group-hover:bg-[#EDE8E0] transition-colors">
                                  <item.icon className="w-4 h-4 text-[#9C8B7A]" />
                                </div>
                                <div>
                                  <span className="text-[13px] text-[#1D1D1F] block" style={{ fontWeight: 500 }}>{item.label}</span>
                                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{item.desc}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`relative px-4 py-2 text-[14px] rounded-full transition-all duration-200 ${
                    active
                      ? onDarkHero ? "text-white" : "text-[#1D1D1F]"
                      : onDarkHero ? "text-[#AEAEB2] hover:text-[#D1D1D6]" : "text-[#8E8E93] hover:text-[#48484A]"
                  }`}
                  style={{ fontWeight: active ? 500 : 400 }}
                >
                  {l.label}
                  {active && (
                    <motion.div
                      layoutId="np4"
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                      style={{ background: onDarkHero ? "#636366" : "#D1D1D6" }}
                      transition={springToggle}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* (C) RIGHT — Actions */}
          <div className="flex items-center gap-2">
            <Link
              to={`${P}/entrar`}
              className={`hidden md:block text-[14px] px-4 py-2 rounded-full transition-all duration-200 ${
                onDarkHero ? "text-[#AEAEB2] hover:text-[#D1D1D6]" : "text-[#8E8E93] hover:text-[#48484A]"
              }`}
              style={{ fontWeight: 400 }}
            >
              Entrar
            </Link>
            <Link
              to={`${P}/criar-conta`}
              className="group relative hidden sm:inline-flex items-center text-[14px] px-[18px] py-[12px] rounded-full overflow-hidden bg-[#1D1D1F] text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_#C7C7CC] active:translate-y-0"
              style={{ fontWeight: 600, transitionTimingFunction: ease }}
            >
              <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: ease }} />
              <span className="relative z-10">Começar</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer ${
                onDarkHero ? "text-[#AEAEB2] hover:text-white hover:bg-[#3C3C43]" : "text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F2F2F7]"
              }`}
            >
              {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </nav>

        {/* Mobile sheet */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mn4"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={springSnappy}
              className="absolute top-full left-4 right-4 md:hidden rounded-2xl bg-white border border-[#E5E5EA] shadow-[0_16px_48px_#D1D1D6] overflow-hidden"
            >
              <div className="px-4 py-5 flex flex-col gap-0.5">
                {/* Recursos accordion */}
                <button
                  onClick={() => setMobileRecursosOpen(!mobileRecursosOpen)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] text-[#8E8E93] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                  style={{ fontWeight: 400 }}
                >
                  Recursos
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileRecursosOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileRecursosOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={springDefault}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-2 flex flex-col gap-0.5">
                        {recursosDropdown.map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5F5F7] transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-[#9C8B7A]" />
                            <div>
                              <span className="text-[14px] text-[#48484A] block" style={{ fontWeight: 500 }}>{item.label}</span>
                              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{item.desc}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {navLinks.filter(l => !l.hasDropdown).map((l) => (
                  <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)} className="px-4 py-3.5 rounded-xl text-[15px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors" style={{ fontWeight: 400 }}>
                    {l.label}
                  </Link>
                ))}

                <div className="h-px bg-[#E5E5EA] my-3 mx-4" />

                <Link to={`${P}/entrar`} onClick={() => setMobileOpen(false)} className="px-4 py-3.5 rounded-xl text-[15px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors" style={{ fontWeight: 400 }}>
                  Entrar
                </Link>
                <Link
                  to={`${P}/criar-conta`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center bg-[#1D1D1F] text-white text-[15px] py-3.5 rounded-full mt-2 hover:bg-[#1D1D1F] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Começar agora
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className={`flex-1 ${isLanding ? "" : "pt-[72px]"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springDefault}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER — Clean Canvas */}
      <footer className="relative z-10 overflow-hidden" style={{ background: "#F5F5F7" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-[#E5E5EA]" />
        <div className="relative z-10 max-w-[1120px] mx-auto px-6 lg:px-10 py-20">
          <div className="mb-16">
            <p className="text-[clamp(28px,4vw,48px)] tracking-[-0.04em] max-w-3xl" style={{ fontFamily: DISPLAY, fontWeight: 400, lineHeight: 1.15, color: "#E5E5EA" }}>Menos caos.<br />Mais controle.</p>
          </div>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-16 mb-16">
            <div className="max-w-[280px]">
              <div className="flex items-center gap-1.5 mb-5"><span className="text-[22px] tracking-[-0.06em] text-[#1D1D1F]" style={{ fontWeight: 700 }}>ESSYN</span><span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} /></div>
              <p className="text-[13px] text-[#636366]" style={{ fontWeight: 400, lineHeight: 1.75 }}>O sistema operacional para fotógrafos de eventos que levam o negócio a sério.</p>
            </div>
            <div className="flex flex-wrap gap-20">
              {Object.entries(footerCols).map(([title, links]) => (
                <div key={title} className="flex flex-col gap-3.5">
                  <span className="text-[10px] tracking-[0.14em] uppercase text-[#8E8E93] mb-1" style={{ fontWeight: 600 }}>{title}</span>
                  {links.map((l) => (<Link key={l.label} to={l.to} className="text-[13px] text-[#636366] hover:text-[#3C3C43] transition-all hover:-translate-y-px" style={{ fontWeight: 400 }}>{l.label}</Link>))}
                </div>
              ))}
              <div className="flex flex-col gap-3.5">
                <span className="text-[10px] tracking-[0.14em] uppercase text-[#8E8E93] mb-1" style={{ fontWeight: 600 }}>Social</span>
                <a href="#social" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 text-[13px] text-[#636366] hover:text-[#3C3C43] transition-all hover:-translate-y-px" style={{ fontWeight: 400 }}><Instagram className="w-3.5 h-3.5" /> Instagram</a>
                <a href="#social" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 text-[13px] text-[#636366] hover:text-[#3C3C43] transition-all hover:-translate-y-px" style={{ fontWeight: 400 }}><Youtube className="w-3.5 h-3.5" /> YouTube</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#E5E5EA]">
            <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>© 2026 ESSYN. Todos os direitos reservados.</span>
            <div className="flex items-center gap-3">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: GOLD }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: GOLD }} /></span>
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Todos os sistemas operacionais</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}