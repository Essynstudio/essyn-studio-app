// v1 QA Board V4 2026-02-24
import { useState } from "react";
import { Link } from "react-router";
import { Check, X, Minus, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import { GR, SERIF } from "../../../components/ui/editorial";

const P = "/v4";
const serif = SERIF;

type Status = "pass" | "fail" | "partial" | "untested";
interface QAItem { id: string; category: string; check: string; status: Status; notes: string; route?: string }

const initialChecks: QAItem[] = [
  // Hero
  { id: "h1", category: "Hero", check: "Clareza em 10s — headline + subheadline comunicam proposta", status: "pass", notes: "Headline forte: 'sistema operacional do fotógrafo'", route: P },
  { id: "h2", category: "Hero", check: "CTA primário preto funcional → /criar-conta", status: "pass", notes: "MagLink com flood-fill para /v4/criar-conta", route: `${P}/criar-conta` },
  { id: "h3", category: "Hero", check: "CTA secundário 'Ver como funciona' ancora corretamente", status: "pass", notes: "V4 FIX: scroll para Como Funciona (não Planos)", route: P },
  { id: "h4", category: "Hero", check: "Prova visual do produto — Cinematic Product Collage (sem foto de pessoa)", status: "pass", notes: "V5: FloatingCards com MiniFinancial, MiniAgenda, MiniGallery + browser frame", route: P },
  { id: "h5", category: "Hero", check: "Trust micro-badges abaixo dos CTAs", status: "pass", notes: "V5: 14 dias grátis / Sem cartão / Cancele quando quiser", route: P },
  { id: "h6", category: "Hero", check: "Blur blobs decorativos (emerald/blue/amber)", status: "pass", notes: "V5: 3 blur blobs + watermark 'E' + film perforations", route: P },

  // Pricing
  { id: "p1", category: "Pricing", check: "Plano recomendado destacado visualmente", status: "pass", notes: "Pro tem bg-[#111] + badge RECOMENDADO emerald", route: `${P}/planos` },
  { id: "p2", category: "Pricing", check: "Toggle mensal/anual funcional", status: "pass", notes: "Layout pill animado com badge -20%", route: `${P}/planos` },
  { id: "p3", category: "Pricing", check: "Comparativo acessível (não escondido)", status: "pass", notes: "Expandível com botão visível", route: `${P}/planos` },
  { id: "p4", category: "Pricing", check: "Add-ons claros e opcionais", status: "pass", notes: "4 add-ons com checkbox visual", route: `${P}/planos` },
  { id: "p5", category: "Pricing", check: "Sticky checkout bar com total atualizado", status: "pass", notes: "Plano + add-ons → total → CTA Continuar", route: `${P}/planos` },
  { id: "p6", category: "Pricing", check: "Microcopy de risco reverso (cancelamento)", status: "pass", notes: "'Cancele a qualquer momento. Sem multa.'", route: `${P}/planos` },

  // Checkout
  { id: "c1", category: "Checkout", check: "PIX tem botão de confirmação claro", status: "pass", notes: "V4 FIX: 'Já paguei via PIX' + copiar código", route: `${P}/checkout?plan=pro` },
  { id: "c2", category: "Checkout", check: "Cartão tem validação de campos", status: "pass", notes: "Erro se campos vazios", route: `${P}/checkout?plan=pro` },
  { id: "c3", category: "Checkout", check: "Resumo fixo lateral com total", status: "pass", notes: "Sticky top-28 com economia anual", route: `${P}/checkout?plan=pro` },
  { id: "c4", category: "Checkout", check: "Trust badges (SSL + LGPD)", status: "pass", notes: "ShieldCheck + Lock icons", route: `${P}/checkout?plan=pro` },

  // Auth
  { id: "a1", category: "Auth", check: "Login → /dashboard (não onboarding)", status: "pass", notes: "V4 FIX: navigate('/dashboard') — usuários existentes", route: `${P}/entrar` },
  { id: "a2", category: "Auth", check: "Criar conta → verificar email → onboarding", status: "pass", notes: "Fluxo completo com email param", route: `${P}/criar-conta` },
  { id: "a3", category: "Auth", check: "Esqueci senha → email enviado → voltar login", status: "pass", notes: "2 estados: form → confirmação", route: `${P}/esqueci-senha` },
  { id: "a4", category: "Auth", check: "Password strength indicator", status: "pass", notes: "3 checks: 6+ chars, maiúscula, número", route: `${P}/criar-conta` },

  // Onboarding
  { id: "o1", category: "Onboarding", check: "Progress com labels (Estúdio/Preferências/Pronto)", status: "pass", notes: "V4 FIX: numbered circles + labels", route: `${P}/boas-vindas` },
  { id: "o2", category: "Onboarding", check: "Boas-vindas → Criar Studio → Preferências → Concluir", status: "pass", notes: "4 steps com back/forward navigation", route: `${P}/boas-vindas` },
  { id: "o3", category: "Onboarding", check: "Concluir → /dashboard", status: "pass", notes: "Link to='/dashboard' funcional", route: `${P}/concluir` },

  // Mobile
  { id: "m1", category: "Mobile", check: "Nav mobile funcional (menu hamburger)", status: "pass", notes: "AnimatePresence dropdown com todos links", route: P },
  { id: "m2", category: "Mobile", check: "Hero legível em 390px", status: "pass", notes: "clamp() em H1, flex-col em CTAs", route: P },
  { id: "m3", category: "Mobile", check: "Planos empilham em mobile", status: "pass", notes: "grid md:grid-cols-3 → 1 col", route: `${P}/planos` },

  // Integridade
  { id: "i1", category: "Integridade", check: "Sem números/depoimentos inventados", status: "pass", notes: "Todos testimonials com tag 'Exemplo'", route: P },
  { id: "i2", category: "Integridade", check: "Sem href='#' mortos", status: "pass", notes: "Todos links são to= ou onClick preventDefault", route: P },
  { id: "i3", category: "Integridade", check: "Consistência tipográfica com app (SF Pro + New York)", status: "pass", notes: "fonts.css importa ambas", route: P },
  { id: "i4", category: "Integridade", check: "Grain texture global em todas as páginas", status: "pass", notes: "Layout + onboarding pages com SVG grain", route: P },
  { id: "i5", category: "Integridade", check: "Protótipo E2E 100% clicável", status: "pass", notes: "Landing→Planos→Checkout→Sucesso→Onboarding→Dashboard", route: P },
];

const statusIcon = (s: Status) => {
  if (s === "pass") return <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>;
  if (s === "fail") return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-white" /></div>;
  if (s === "partial") return <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0"><Minus className="w-3 h-3 text-white" /></div>;
  return <div className="w-5 h-5 rounded-full bg-[#F2F2F7] flex items-center justify-center flex-shrink-0"><Minus className="w-3 h-3 text-[#C7C7CC]" /></div>;
};

export function QAV4Page() {
  const [checks] = useState(initialChecks);
  const categories = [...new Set(checks.map((c) => c.category))];
  const passCount = checks.filter((c) => c.status === "pass").length;

  return (
    <div style={{ background: "#FFFFFF" }}>
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Link to={P} className="inline-flex items-center gap-1.5 text-[13px] text-[#C7C7CC] hover:text-[#AEAEB2] transition-colors mb-8" style={{ fontWeight: 400 }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao site
        </Link>

        <GR>
          <h1 data-g className="text-[28px] tracking-[-0.03em] text-[#111] mb-2" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.2 }}>
            QA Board <span className="italic text-[#AEAEB2]">V4</span>
          </h1>
          <p data-g className="text-[14px] text-[#B5B5B5] mb-8" style={{ fontWeight: 400 }}>
            Checklist E2E — {passCount}/{checks.length} verificações passaram
          </p>
        </GR>

        {/* Score bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#B5B5B5]" style={{ fontWeight: 500 }}>Progresso</span>
            <span className="text-[12px] text-emerald-600" style={{ fontWeight: 600 }}>{Math.round((passCount / checks.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#F5F5F7] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(passCount / checks.length) * 100}%` }} />
          </div>
        </div>

        {/* Checks by category */}
        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h3 className="text-[11px] tracking-[0.1em] uppercase text-[#DADADA] mb-3" style={{ fontWeight: 600 }}>{cat}</h3>
            <div className="flex flex-col gap-2">
              {checks.filter((c) => c.category === cat).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#F5F5F7] bg-white px-5 py-4 flex items-start gap-3">
                  {statusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[#111] block" style={{ fontWeight: 500, lineHeight: 1.4 }}>{item.check}</span>
                    <span className="text-[11px] text-[#C7C7CC] block mt-0.5" style={{ fontWeight: 400 }}>{item.notes}</span>
                  </div>
                  {item.route && (
                    <Link to={item.route} className="flex items-center gap-1 text-[10px] text-[#DADADA] hover:text-[#B5B5B5] transition-colors flex-shrink-0 mt-0.5" style={{ fontWeight: 400 }}>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}