// v1 seguranca V4 editorial film studio 2026-02-25
import { ShieldCheck, Lock, Database, Eye, Server, FileCheck, ArrowRight } from "lucide-react";
import { GR, MagLink, SERIF, GOLD } from "../../../components/ui/editorial";

const serif = SERIF;
const P = "/v4";

const items = [
  { icon: Lock, title: "Criptografia SSL/TLS", desc: "Todos os dados em transito sao criptografados com TLS 1.3. Conexoes seguras, sempre." },
  { icon: Database, title: "Backups diarios", desc: "Backups automaticos com retencao de 30 dias. Seus dados protegidos contra perda acidental." },
  { icon: ShieldCheck, title: "Conformidade LGPD", desc: "Tratamento de dados conforme a Lei Geral de Protecao de Dados. Transparencia total." },
  { icon: Eye, title: "Seus dados sao seus", desc: "Voce e o controlador dos dados dos seus clientes. Exportacao e exclusao a qualquer momento." },
  { icon: Server, title: "Infraestrutura isolada", desc: "Servidores em data centers brasileiros com redundancia geografica e 99.9% uptime." },
  { icon: FileCheck, title: "Cancelamento limpo", desc: "Cancele a qualquer momento. Seus dados ficam disponiveis por 30 dias para exportacao." },
];

export function SegurancaV4Page() {
  return (
    <div style={{ background: "#F5F5F7" }}>
      <section className="pt-12 pb-20 px-6 text-center">
        <GR>
          <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Seguranca & LGPD</span>
          <h1 data-g className="text-[clamp(32px,5vw,56px)] tracking-[-0.04em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.1 }}>
            Confianca <span className="italic" style={{ color: "#C8BFB5" }}>em primeiro lugar</span>
          </h1>
          <p data-g className="text-[15px] text-[#636366] max-w-[460px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65 }}>
            Seus dados e os dados dos seus clientes protegidos com padroes de mercado.
          </p>
        </GR>
      </section>

      <section className="max-w-[900px] mx-auto px-6 pb-32">
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <GR key={item.title} delay={i * 0.06}>
              <div data-g className="rounded-2xl border border-[#E5E5EA] bg-white p-7 h-full hover:shadow-[0_6px_24px_#F5F5F7] hover:border-[#E5E5EA] transition-all duration-300" style={{ boxShadow: "0 1px 4px #F5F5F7" }}>
                <div className="w-10 h-10 rounded-xl bg-[#F7F5F4] flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-[#CDC5BC]" />
                </div>
                <h3 className="text-[16px] text-[#111111] mb-2" style={{ fontWeight: 600 }}>{item.title}</h3>
                <p className="text-[13px] text-[#636366]" style={{ fontWeight: 400, lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            </GR>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 text-center" style={{ background: "#FFFFFF" }}>
        <GR>
          <h3 data-g className="text-[clamp(24px,3vw,36px)] tracking-[-0.03em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.15 }}>
            Seguranca que voce pode <span className="italic" style={{ color: "#C8BFB5" }}>verificar</span>
          </h3>
          <MagLink data-g to={`${P}/criar-conta`} variant="dark">
            <span className="relative z-10 flex items-center gap-2">Comecar agora <ArrowRight className="w-4 h-4" /></span>
          </MagLink>
        </GR>
      </section>
    </div>
  );
}