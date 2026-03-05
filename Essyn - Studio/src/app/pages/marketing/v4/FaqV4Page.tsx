// v1 faq V4 editorial film studio 2026-02-25
import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springDefault } from "../../../lib/motion-tokens";
import { ChevronDown, ArrowRight } from "lucide-react";
import { GR, MagLink, SERIF } from "../../../components/ui/editorial";

const serif = SERIF;
const P = "/v4";

const categories = [
  {
    title: "Geral",
    questions: [
      { q: "O que e o ESSYN?", a: "O ESSYN e uma plataforma completa de gestao para fotografos de eventos. Inclui modulos de producao, agenda, financeiro, CRM e galeria — tudo integrado." },
      { q: "Preciso instalar alguma coisa?", a: "Nao. O ESSYN e 100% web. Funciona no desktop, tablet e celular." },
      { q: "Posso testar antes de assinar?", a: "Sim! Todos os planos incluem 14 dias gratis, sem necessidade de cartao de credito." },
    ],
  },
  {
    title: "Planos e pagamento",
    questions: [
      { q: "Como funciona o cancelamento?", a: "Cancele a qualquer momento na secao Configuracoes. Sem multa, sem burocracia. Seus dados ficam disponiveis por 30 dias." },
      { q: "Funciona com PIX e Nota Fiscal?", a: "Sim. O financeiro e 100% brasileiro — PIX, boleto, parcelas, NF-e e conciliacao bancaria." },
      { q: "Posso mudar de plano?", a: "Sim. Upgrade ou downgrade a qualquer momento. A diferenca e calculada proporcionalmente." },
    ],
  },
  {
    title: "Funcionalidades",
    questions: [
      { q: "Posso adicionar minha equipe?", a: "Sim. O plano Studio suporta ate 10 membros com 5 papeis e permissoes granulares por modulo." },
      { q: "Os clientes recebem link da galeria?", a: "Sim. Cada colecao gera um link privado com senha opcional, selecao de favoritas e download." },
      { q: "Como funciona o armazenamento?", a: "Core inclui 5 GB, Pro 20 GB e Studio 50 GB. Storage extra disponivel como add-on." },
      { q: "Posso migrar de outro sistema?", a: "Sim. Oferecemos importacao via CSV e onboarding assistido no plano Pro+." },
      { q: "O ESSYN e seguro?", a: "Dados criptografados, backups diarios e conformidade LGPD. Seus dados sao seus." },
    ],
  },
];

export function FaqV4Page() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpenMap((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ background: "#F5F5F7" }}>
      <section className="pt-12 pb-20 px-6 text-center">
        <GR>
          <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>FAQ</span>
          <h1 data-g className="text-[clamp(32px,5vw,56px)] tracking-[-0.04em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.1 }}>
            Perguntas <span className="italic" style={{ color: "#C8BFB5" }}>frequentes</span>
          </h1>
        </GR>
      </section>

      <section className="max-w-[680px] mx-auto px-6 pb-32">
        {categories.map((cat) => (
          <div key={cat.title} className="mb-10">
            <GR>
              <h3 data-g className="text-[11px] tracking-[0.1em] uppercase text-[#CDC5BC] mb-4" style={{ fontWeight: 600 }}>{cat.title}</h3>
            </GR>
            <div className="flex flex-col gap-2">
              {cat.questions.map((faq, i) => {
                const key = `${cat.title}-${i}`;
                const isOpen = !!openMap[key];
                return (
                  <GR key={key} delay={i * 0.04}>
                    <button data-g onClick={() => toggle(key)} className="w-full text-left rounded-2xl border border-[#E5E5EA] bg-white px-6 py-5 transition-all duration-300 hover:border-[#E5E5EA] hover:shadow-[0_4px_16px_#F5F5F7] cursor-pointer" style={{ boxShadow: "0 1px 4px #FAFAFA" }}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[14px] text-[#111111]" style={{ fontWeight: 500, lineHeight: 1.4 }}>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-[#AEAEB2] flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springDefault} className="overflow-hidden">
                            <p className="text-[13px] text-[#636366] pt-3" style={{ fontWeight: 400, lineHeight: 1.65 }}>{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </GR>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="py-20 px-6 text-center" style={{ background: "#FFFFFF" }}>
        <GR>
          <p data-g className="text-[14px] text-[#8E8E93] mb-6" style={{ fontWeight: 400 }}>Nao encontrou o que procura?</p>
          <MagLink data-g to={`${P}/criar-conta`} variant="dark">
            <span className="relative z-10 flex items-center gap-2">Fale conosco <ArrowRight className="w-4 h-4" /></span>
          </MagLink>
        </GR>
      </section>
    </div>
  );
}