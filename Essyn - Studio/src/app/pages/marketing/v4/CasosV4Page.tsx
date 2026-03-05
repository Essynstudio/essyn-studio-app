// v1 casos V4 editorial film studio 2026-02-25
import { ArrowRight, Heart, Briefcase, Camera } from "lucide-react";
import { GR, MagLink, SERIF } from "../../../components/ui/editorial";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";

const serif = SERIF;
const P = "/v4";

const cases = [
  {
    id: "casamento",
    icon: Heart,
    segment: "Casamentos",
    headline: "40 casamentos por ano, controle total",
    desc: "Gerencie briefings, timelines, parcelas e entregas de dezenas de eventos simultaneos sem perder uma cobranca.",
    pain: "Planilha com 15 abas, PIX manual, cobranca por WhatsApp",
    solution: "Um projeto por casamento. Financeiro automatico. Galeria premium.",
    img: "https://images.unsplash.com/photo-1769812343322-f4a6e73c8aa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "corporativo",
    icon: Briefcase,
    segment: "Eventos Corporativos",
    headline: "Propostas, contratos e NF em um fluxo",
    desc: "CRM para captar leads, converter em projetos, e entregar com galeria privada e NF-e automatica.",
    pain: "E-mail para proposta, Drive para fotos, planilha para NF",
    solution: "Pipeline → Projeto → Entrega → Recebimento. Tudo conectado.",
    img: "https://images.unsplash.com/photo-1768508663007-997685a1ff01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "ensaio",
    icon: Camera,
    segment: "Ensaios & Retratos",
    headline: "Agenda cheia, zero retrabalho",
    desc: "Automatize agendamentos, selecao e entrega. Foque no que importa: a fotografia.",
    pain: "DM para agendar, WeTransfer para entregar, Pix manual",
    solution: "Agenda integrada. Galeria com selecao. Pagamento rastreado.",
    img: "https://images.unsplash.com/photo-1614181861503-e6418d05d609?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export function CasosV4Page() {
  return (
    <div style={{ background: "#F5F5F7" }}>
      <section className="pt-12 pb-20 px-6 text-center">
        <GR>
          <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Casos de uso</span>
          <h1 data-g className="text-[clamp(32px,5vw,56px)] tracking-[-0.04em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.1 }}>
            Feito para cada <span className="italic" style={{ color: "#C8BFB5" }}>tipo de fotografo</span>
          </h1>
          <p data-g className="text-[15px] text-[#636366] max-w-[460px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65 }}>
            De casamentos a eventos corporativos — o ESSYN se adapta ao seu workflow.
          </p>
        </GR>
      </section>

      <section className="max-w-[1000px] mx-auto px-6 pb-32">
        <div className="flex flex-col gap-12">
          {cases.map((c, i) => (
            <GR key={c.id} delay={0.05}>
              <div data-g className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden" style={{ boxShadow: "0 2px 12px #F5F5F7" }}>
                <div className="grid md:grid-cols-2">
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F5F4] flex items-center justify-center mb-5">
                      <c.icon className="w-5 h-5 text-[#CDC5BC]" />
                    </div>
                    <span className="text-[11px] tracking-[0.1em] uppercase text-[#CDC5BC] mb-2 block" style={{ fontWeight: 600 }}>{c.segment}</span>
                    <h2 className="text-[clamp(22px,3vw,30px)] tracking-[-0.03em] text-[#111111] mb-3" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.15 }}>
                      {c.headline}
                    </h2>
                    <p className="text-[14px] text-[#636366] mb-6" style={{ fontWeight: 400, lineHeight: 1.65 }}>{c.desc}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <span className="text-[10px] tracking-[0.1em] uppercase text-red-400 block mb-2" style={{ fontWeight: 600 }}>Antes</span>
                        <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: 1.5 }}>{c.pain}</p>
                      </div>
                      <div className="rounded-xl border border-[#E6E2DD] bg-[#FAFAF9] p-4">
                        <span className="text-[10px] tracking-[0.1em] uppercase text-[#C3B9AF] block mb-2" style={{ fontWeight: 600 }}>Depois</span>
                        <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: 1.5 }}>{c.solution}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`relative h-[280px] md:h-auto ${i % 2 === 1 ? "md:order-first" : ""}`}>
                    <ImageWithFallback src={c.img} alt={c.segment} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" style={{ opacity: 0.2 }} />
                  </div>
                </div>
              </div>
            </GR>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 text-center" style={{ background: "#FFFFFF" }}>
        <GR>
          <h3 data-g className="text-[clamp(24px,3vw,36px)] tracking-[-0.03em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.15 }}>
            Pronto para <span className="italic" style={{ color: "#C8BFB5" }}>comecar?</span>
          </h3>
          <MagLink data-g to={`${P}/criar-conta`} variant="dark">
            <span className="relative z-10 flex items-center gap-2">Comecar agora <ArrowRight className="w-4 h-4" /></span>
          </MagLink>
        </GR>
      </section>
    </div>
  );
}