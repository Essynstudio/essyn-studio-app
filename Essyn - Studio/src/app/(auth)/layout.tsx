import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — Editorial Branding Panel */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-14 relative overflow-hidden" style={{ backgroundColor: "#2C444D" }}>

        {/* Layered gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3239]/50 via-transparent to-[#0C100E]/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E3239]/40 via-transparent to-transparent pointer-events-none" />

        {/* Large monogram watermark — centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="font-[family-name:var(--font-playfair)] text-[340px] font-normal tracking-[0.05em] opacity-[0.025] text-[#C2AD90]"
            style={{ lineHeight: 1 }}
          >
            ES
          </span>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[10%] right-[-6%] w-[320px] h-[320px] rounded-full border border-[#C2AD90]/[0.05]" />
        <div className="absolute top-[13%] right-[-3%] w-[240px] h-[240px] rounded-full border border-[#C2AD90]/[0.03]" />
        <div className="absolute bottom-[5%] left-[-8%] w-[500px] h-[500px] rounded-full border border-[#C2AD90]/[0.035]" />
        {/* Subtle diagonal gold line */}
        <div className="absolute top-0 right-[30%] w-[1px] h-[200px] bg-gradient-to-b from-transparent via-[#C2AD90]/[0.08] to-transparent" />
        <div className="absolute bottom-0 left-[20%] w-[1px] h-[150px] bg-gradient-to-t from-transparent via-[#C2AD90]/[0.06] to-transparent" />

        {/* Logo — clickable */}
        <Link href="/entrar" className="relative z-10 flex items-center gap-3.5 group w-fit">
          <div className="w-11 h-11 rounded-full border-[1.5px] border-[#C2AD90]/50 flex items-center justify-center relative transition-all duration-500 group-hover:border-[#C2AD90]/80 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(194,173,144,0.1)]">
            <div className="absolute inset-[3px] rounded-full border border-[#C2AD90]/20 transition-all duration-500 group-hover:border-[#C2AD90]/40" />
            <span className="font-[family-name:var(--font-playfair)] text-[13px] font-normal text-[#C2AD90] tracking-[0.05em] relative z-10">
              ES
            </span>
          </div>
          <span className="flex items-baseline gap-[5px] opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0">
            <span className="font-[family-name:var(--font-playfair)] text-[12px] font-semibold text-[#C2AD90]/70 tracking-[0.14em] uppercase">ESSYN</span>
            <span className="text-[7px] text-[#C2AD90]/40 self-center">&middot;</span>
            <span className="font-[family-name:var(--font-cormorant)] text-[10px] font-light text-[#C2AD90]/50 tracking-[0.22em] uppercase">STUDIO</span>
          </span>
        </Link>

        {/* Hero — main content */}
        <div className="relative z-10 max-w-lg">
          {/* Gold accent — diamond + line */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-[6px] h-[6px] rotate-45 bg-[#C2AD90]/40" />
            <div className="w-16 h-[1px] bg-gradient-to-r from-[#C2AD90]/40 to-transparent" />
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-[46px] font-normal leading-[1.08] text-white tracking-[-0.015em]">
            Organize o negócio.
          </h1>
          <h1 className="font-[family-name:var(--font-cormorant)] italic text-[52px] font-light leading-[1.08] text-[#C2AD90] tracking-[-0.01em] mt-1">
            Liberte o artista.
          </h1>

          <p className="text-white/30 text-[14px] leading-[1.8] mt-8 max-w-[300px] font-light tracking-[0.01em]">
            Gestão inteligente para fotógrafos que
            levam seu trabalho a sério.
          </p>

          {/* Feature indicators — refined */}
          <div className="flex flex-wrap items-center gap-2.5 mt-12">
            {[
              { label: "Iris IA", gold: true },
              { label: "Portal do Cliente" },
              { label: "Galerias" },
              { label: "Financeiro" },
            ].map(({ label, gold }) => (
              <span
                key={label}
                className={`text-[9px] tracking-[0.12em] uppercase font-medium px-3.5 py-[7px] rounded-full backdrop-blur-sm transition-all duration-300 ${
                  gold
                    ? "border border-[#C2AD90]/30 text-[#C2AD90]/80 bg-[#C2AD90]/[0.06]"
                    : "border border-white/[0.07] text-white/25 bg-white/[0.02]"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer — editorial quote + copyright */}
        <div className="relative z-10 space-y-5">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[4px] h-[4px] rotate-45 bg-[#C2AD90]/25" />
              <div className="w-6 h-[1px] bg-[#C2AD90]/15" />
            </div>
            <blockquote className="text-[13px] text-white/20 font-[family-name:var(--font-cormorant)] italic leading-[1.6]">
              &ldquo;A fotografia e a arte de tornar momentos eternos.
              A gestão é a arte de tornar isso sustentável.&rdquo;
            </blockquote>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-[10px] text-white/12 font-light tracking-[0.06em] uppercase">
              &copy; {new Date().getFullYear()} Essyn Studio
            </p>
            <div className="w-[3px] h-[3px] rounded-full bg-white/[0.06]" />
            <Link href="/privacidade" className="text-[10px] text-white/12 font-light tracking-[0.06em] hover:text-white/30 transition-colors">
              Privacidade
            </Link>
            <div className="w-[3px] h-[3px] rounded-full bg-white/[0.06]" />
            <Link href="/termos" className="text-[10px] text-white/12 font-light tracking-[0.06em] hover:text-white/30 transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-[var(--bg)]">
        <div className="w-full max-w-[400px]">{children}</div>
        <div className="flex gap-4 mt-8">
          <Link href="/privacidade" className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Política de Privacidade</Link>
          <span className="text-[11px] text-[var(--fg-muted)]">·</span>
          <Link href="/termos" className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </div>
  );
}
