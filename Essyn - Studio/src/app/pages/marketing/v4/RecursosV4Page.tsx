// v1 recursos V4 editorial film studio 2026-02-25
import { Link } from "react-router";
import { Camera, Calendar, DollarSign, Users, Image, FolderKanban, ArrowRight, Check } from "lucide-react";
import { GR, MagLink, SERIF, GOLD } from "../../../components/ui/editorial";

const serif = SERIF;
const P = "/v4";

const modules = [
  { icon: FolderKanban, name: "Projetos", headline: "O hub central do seu negocio", features: ["Drawer completo com timeline, equipe e docs", "Status automatico por fase", "Deep links para producao e financeiro", "Filtros e busca avancada"] },
  { icon: Camera, name: "Producao", headline: "Do briefing a entrega, tudo visual", features: ["16 modelos de servico incluindo drone e same-day", "Workflow por etapas com Kanban", "Badge de status e progresso visual", "Radar de trabalhos com filtros"] },
  { icon: DollarSign, name: "Financeiro BR", headline: "Pensado para o fotografo brasileiro", features: ["Parcelas automaticas e cobranca via PIX", "Geracao de NF-e e recibos", "Conciliacao bancaria", "Repasses para equipe e fornecedores"] },
  { icon: Image, name: "Galeria", headline: "Entrega que impressiona", features: ["Galerias com link privado e senha", "Selecao de favoritas pelo cliente", "Watermark automatica em proofing", "Download em alta resolucao"] },
  { icon: Calendar, name: "Agenda", headline: "Sabados sao seu negocio", features: ["Visualizacao Mes / Semana / Dia / Lista", "Pills de disponibilidade para sabados", "Checklist integrado por evento", "Deep links para drawer do projeto"] },
  { icon: Users, name: "CRM", headline: "Do lead ao contrato", features: ["Pipeline visual com drag & drop", "Follow-up automatico por e-mail", "Metricas de conversao e receita", "Integracao com projetos e financeiro"] },
];

export function RecursosV4Page() {
  return (
    <div style={{ background: "#F5F5F7" }}>
      <section className="relative pt-12 pb-24 px-6 text-center">
        <GR>
          <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Recursos</span>
          <h1 data-g className="text-[clamp(32px,5vw,56px)] tracking-[-0.04em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.1 }}>
            Tudo que voce precisa,<br /><span className="italic" style={{ color: "#C8BFB5" }}>nada que nao precisa</span>
          </h1>
          <p data-g className="text-[15px] text-[#636366] max-w-[460px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65 }}>
            Seis modulos integrados. Um sistema. Zero retrabalho.
          </p>
        </GR>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-32">
        <div className="flex flex-col gap-16">
          {modules.map((mod, i) => (
            <GR key={mod.name} delay={0.05}>
              <div data-g className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:direction-rtl" : ""}`}>
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="w-12 h-12 rounded-xl bg-[#F7F5F4] flex items-center justify-center mb-5">
                    <mod.icon className="w-6 h-6 text-[#C3B9AF]" />
                  </div>
                  <span className="text-[11px] tracking-[0.1em] uppercase text-[#CDC5BC] mb-2 block" style={{ fontWeight: 600 }}>{mod.name}</span>
                  <h2 className="text-[clamp(22px,3vw,32px)] tracking-[-0.03em] text-[#111111] mb-4" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.15 }}>
                    {mod.headline}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {mod.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#CDC5BC] flex-shrink-0 mt-0.5" />
                        <span className="text-[14px] text-[#636366]" style={{ fontWeight: 400, lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-2xl border border-[#E5E5EA] bg-white p-6 aspect-[4/3] flex items-center justify-center ${i % 2 === 1 ? "md:order-1" : ""}`} style={{ boxShadow: "0 2px 12px #F5F5F7" }}>
                  <div className="w-full max-w-[280px]">
                    <div className="flex items-center gap-2 mb-4">
                      <mod.icon className="w-5 h-5 text-[#D7D0C9]" />
                      <span className="text-[14px] text-[#111111]" style={{ fontWeight: 600 }}>{mod.name}</span>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-3 rounded-full" style={{ background: "#F5F5F7", width: `${100 - n * 15}%` }} />
                      ))}
                    </div>
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
            Pronto para <span className="italic" style={{ color: "#C8BFB5" }}>simplificar?</span>
          </h3>
          <MagLink data-g to={`${P}/criar-conta`} variant="dark">
            <span className="relative z-10 flex items-center gap-2">Comecar agora <ArrowRight className="w-4 h-4" /></span>
          </MagLink>
        </GR>
      </section>
    </div>
  );
}