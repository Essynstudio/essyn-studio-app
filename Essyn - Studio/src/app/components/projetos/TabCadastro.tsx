import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import type { Projeto } from "./projetosData";
import { statusConfig } from "./projetosData";
import { DrawerCard, DrawerCardRow, TabStateWrapper, type TabState } from "./drawer-primitives";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  PENDÊNCIAS DE CADASTRO                            */
/* ═══════════════════════════════════════════════════ */

function PendenciasCadastro({ projeto }: { projeto: Projeto }) {
  const dk = useDk();
  const pendencias: { label: string; field: string }[] = [];

  if (!projeto.locais || projeto.locais.length === 0)
    pendencias.push({ label: "Adicione pelo menos um local do evento", field: "locais" });
  if (!projeto.equipe || projeto.equipe.length === 0)
    pendencias.push({ label: "Defina a equipe do projeto", field: "equipe" });
  if (!projeto.contatos || projeto.contatos.length === 0)
    pendencias.push({ label: "Adicione os contatos do cliente", field: "contatos" });
  if (!projeto.pacote || projeto.pacote.trim() === "")
    pendencias.push({ label: "Selecione ou crie um pacote", field: "pacote" });
  if (!projeto.horario || projeto.horario.trim() === "")
    pendencias.push({ label: "Defina o horário do evento", field: "horario" });
  if (projeto.fotos === 0 && (projeto.status === "edicao" || projeto.status === "entregue"))
    pendencias.push({ label: "Nenhuma foto enviada para este projeto", field: "fotos" });
  if (projeto.financeiro.parcelas === 0 && projeto.status !== "rascunho")
    pendencias.push({ label: "Defina um plano de pagamento", field: "financeiro" });

  if (pendencias.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] uppercase tracking-[0.1em] text-[#007AFF]"
          style={{ fontWeight: 600 }}
        >
          Pendências de cadastro
        </span>
        <span
          className="text-[9px] text-white bg-[#007AFF] px-1.5 py-0.5 rounded-full numeric"
          style={{ fontWeight: 600 }}
        >
          {pendencias.length}
        </span>
      </div>
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}
      >
        {pendencias.map((p, i) => (
          <div
            key={p.field}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              borderBottom: i < pendencias.length - 1 ? `1px solid ${dk.border}` : undefined,
            }}
          >
            <TriangleAlert className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
            <span
              className="text-[12px] flex-1"
              style={{ fontWeight: 400, color: dk.textMuted }}
            >
              {p.label}
            </span>
            <button
              className="text-[11px] text-[#007AFF] hover:text-[#0066D6] transition-colors cursor-pointer shrink-0"
              style={{ fontWeight: 500 }}
            >
              Resolver
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TAB: CADASTRO                                     */
/* ═══════════════════════════════════════════════════ */

export function TabCadastro({
  projeto,
  tabState,
}: {
  projeto: Projeto;
  tabState: TabState;
}) {
  const dk = useDk();
  const sc = statusConfig[projeto.status];

  return (
    <TabStateWrapper state={tabState}>
      <div className="flex flex-col gap-6">
        {/* ── Pendências ── */}
        <PendenciasCadastro projeto={projeto} />

        {/* ── Card: Evento ── */}
        <DrawerCard title="Evento">
          <DrawerCardRow
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Tipo"
            value={projeto.tipo}
            trailing={
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${sc.bg} ${sc.border} ${sc.text} text-[10px] border`}
                style={{ fontWeight: 500 }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            }
          />
          <DrawerCardRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Data"
            value={
              <span className="flex items-center gap-2">
                {projeto.dataEvento}
                <span
                  className="text-[11px]"
                  style={{ fontWeight: 400, color: dk.textDisabled }}
                >
                  {projeto.diaSemana}
                </span>
              </span>
            }
          />
          <DrawerCardRow
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Horário"
            value={projeto.horario}
          />
        </DrawerCard>

        {/* ── Card: Locais ── */}
        <DrawerCard title="Locais do evento" count={projeto.locais.length}>
          {projeto.locais.map((loc) => (
            <DrawerCardRow
              key={loc.nome}
              icon={<MapPin className="w-3.5 h-3.5" />}
              value={
                <span style={{ fontWeight: 500 }}>{loc.nome}</span>
              }
              meta={loc.endereco}
              trailing={
                loc.horario ? (
                  <span
                    className="text-[11px] numeric"
                    style={{ fontWeight: 500, color: dk.textDisabled }}
                  >
                    {loc.horario}
                  </span>
                ) : undefined
              }
            />
          ))}
        </DrawerCard>

        {/* ── Card: Equipe ── */}
        <DrawerCard title="Equipe" count={projeto.equipe.length}>
          {projeto.equipe.map((m) => (
            <div
              key={m.nome}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: dk.hairline }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: dk.bgMuted }}
              >
                <span
                  className="text-[10px]"
                  style={{ fontWeight: 600, color: dk.textMuted }}
                >
                  {m.iniciais}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[13px]"
                  style={{ fontWeight: 500, color: dk.textSecondary }}
                >
                  {m.nome}
                </span>
                <span
                  className="text-[11px]"
                  style={{ fontWeight: 400, color: dk.textSubtle }}
                >
                  {m.funcao}
                </span>
              </div>
            </div>
          ))}
        </DrawerCard>

        {/* ── Card: Pacote contratado ── */}
        <DrawerCard title={`Pacote contratado — ${projeto.pacote}`}>
          <div className="flex flex-col">
            {projeto.itensPacote.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
                style={{ borderColor: dk.hairline }}
              >
                <CircleCheck className="w-3 h-3 text-[#34C759] shrink-0" />
                <span
                  className="text-[13px]"
                  style={{ fontWeight: 400, color: dk.textTertiary }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
          <div
            className="px-4 py-3 border-t flex items-center justify-between"
            style={{ borderColor: dk.hairline, backgroundColor: dk.bgSub }}
          >
            <span
              className="text-[11px]"
              style={{ fontWeight: 400, color: dk.textSubtle }}
            >
              Valor total
            </span>
            <span
              className="text-[14px] numeric"
              style={{ fontWeight: 600, color: dk.textSecondary }}
            >
              {projeto.valor}
            </span>
          </div>
        </DrawerCard>

        {/* ── Card: Prazo de entrega ── */}
        <DrawerCard title="Prazo de entrega">
          <DrawerCardRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            value={
              <span style={{ fontWeight: 500 }}>{projeto.prazoEntrega}</span>
            }
            noBorder
          />
        </DrawerCard>

        {/* ── Card: Contatos ── */}
        <DrawerCard title="Contatos" count={projeto.contatos.length}>
          {projeto.contatos.map((c) => (
            <div
              key={c.email}
              className="flex flex-col gap-1.5 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: dk.hairline }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px]"
                  style={{ fontWeight: 500, color: dk.textSecondary }}
                >
                  {c.nome}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    fontWeight: 500,
                    color: dk.textDisabled,
                    backgroundColor: dk.bgMuted,
                  }}
                >
                  {c.relacao}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: dk.textMuted }}>
                  <Phone className="w-3 h-3" />
                  {c.telefone}
                </span>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: dk.textMuted }}>
                  <Mail className="w-3 h-3" />
                  {c.email}
                </span>
              </div>
            </div>
          ))}
        </DrawerCard>
      </div>
    </TabStateWrapper>
  );
}
