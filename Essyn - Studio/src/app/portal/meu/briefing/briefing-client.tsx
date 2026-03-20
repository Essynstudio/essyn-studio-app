"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ArrowRight, Check, Heart, Camera,
  Church, PartyPopper, Sparkles, Users, ListChecks, Store, Save,
} from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";

/* ---- Design tokens ---- */
const fg = "#2D2A26";
const soft = "#5C5650";
const muted = "#8E8880";
const subtle = "#B5AFA6";
const green = "#2D7A4F";
const greenBg = "rgba(45,122,79,0.12)";

function gc(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    ...extra,
  };
}

/* ---- Section definitions ---- */
interface SectionDef {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  questions: { key: string; label: string; placeholder: string; multiline?: boolean }[];
}

const SECTIONS: SectionDef[] = [
  {
    key: "info",
    title: "Informações do Casal",
    subtitle: "Dados básicos do evento",
    icon: <Heart size={20} />,
    questions: [
      { key: "nomes", label: "Nome dos noivos", placeholder: "Ex: Ana & Pedro" },
      { key: "local_cerimonia", label: "Local da cerimônia", placeholder: "Nome e endereço do local" },
      { key: "horario_cerimonia", label: "Horário da cerimônia", placeholder: "Ex: 16:00" },
      { key: "local_festa", label: "Local da festa", placeholder: "Nome e endereço do local" },
      { key: "horario_festa", label: "Horário previsto de início da festa", placeholder: "Ex: 18:00" },
    ],
  },
  {
    key: "making_noiva",
    title: "Making Of da Noiva",
    subtitle: "Detalhes da preparação",
    icon: <Camera size={20} />,
    questions: [
      { key: "local_nome", label: "Endereço do local e nome do salão", placeholder: "Onde a noiva vai se arrumar" },
      { key: "acompanhantes", label: "Quem estará com a noiva?", placeholder: "Nomes e parentesco", multiline: true },
      { key: "horario_maquiagem", label: "Horário de início da maquiagem", placeholder: "Ex: 08:00" },
      { key: "horario_pronta", label: "Horário previsto para ficar pronta", placeholder: "Ex: 14:00" },
      { key: "carro", label: "Que carro levará a noiva para a cerimônia?", placeholder: "Modelo e cor" },
    ],
  },
  {
    key: "making_noivo",
    title: "Making Of do Noivo",
    subtitle: "Se houver cobertura",
    icon: <Users size={20} />,
    questions: [
      { key: "local_nome", label: "Endereço do local", placeholder: "Onde o noivo vai se arrumar" },
      { key: "acompanhantes", label: "Quem estará com o noivo?", placeholder: "Nomes e parentesco", multiline: true },
      { key: "horario_troca", label: "Horário de início da troca de roupa", placeholder: "Ex: 10:30" },
      { key: "horario_pronto", label: "Horário previsto para ficar pronto", placeholder: "Ex: 14:00" },
    ],
  },
  {
    key: "cerimonia",
    title: "Sobre a Cerimônia",
    subtitle: "Cortejo, altar e momentos especiais",
    icon: <Church size={20} />,
    questions: [
      { key: "cortejo", label: "Haverá cortejo de entrada?", placeholder: "Sim/Não - detalhes" },
      { key: "entrada_noiva", label: "Com quem a noiva entrará no altar?", placeholder: "Ex: Com seu pai" },
      { key: "padrinhos_qtd", label: "Quantidade de madrinhas/padrinhos de cada lado", placeholder: "Ex: 8 de cada lado" },
      { key: "padrinhos_posicao", label: "Todos ficarão no altar ou sentados nos primeiros bancos?", placeholder: "Descreva a organização", multiline: true },
      { key: "cumprimentos", label: "Como será o momento dos cumprimentos?", placeholder: "Noivos vão até os padrinhos ou ficam no altar?", multiline: true },
      { key: "pajens_daminhas", label: "Haverá pajens, daminhas, floristas?", placeholder: "Detalhes de quem entra e como", multiline: true },
      { key: "musica", label: "A música será feita por coral ou instrumentistas?", placeholder: "Quem e que tipo" },
      { key: "saida", label: "Na saída da cerimônia: arroz, bolas de sabão, sparkles?", placeholder: "O que será usado na saída", multiline: true },
      { key: "situacao_diferente", label: "Alguma situação diferente durante a cerimônia?", placeholder: "Entradas ou saídas diferentes, etc", multiline: true },
    ],
  },
  {
    key: "festa",
    title: "Sobre a Festa",
    subtitle: "Decoração, danças e atrações",
    icon: <PartyPopper size={20} />,
    questions: [
      { key: "decoracao", label: "Algum detalhe da decoração que mereça atenção especial?", placeholder: "Mesa de bolo, arranjos, etc", multiline: true },
      { key: "valsa", label: "Haverá valsa ou dança especial dos noivos?", placeholder: "Detalhes da dança" },
      { key: "atracoes", label: "Haverá alguma atração especial?", placeholder: "Banda, escola de samba, DJ...", multiline: true },
      { key: "homenagens", label: "Haverá alguma homenagem ou discurso?", placeholder: "Votos, homenagem aos pais, brinde...", multiline: true },
      { key: "buque", label: "Como será o momento do buquê?", placeholder: "Tradicional, com fitas, cadeado...", multiline: true },
      { key: "noivo_joga", label: "O noivo jogará algo? (caixa de whisky, etc.)", placeholder: "Descreva" },
      { key: "refeicao_equipe", label: "Haverá local destinado para a refeição da equipe?", placeholder: "Sim/Não - onde" },
    ],
  },
  {
    key: "detalhes",
    title: "Detalhes Importantes",
    subtitle: "Registros especiais e cuidados",
    icon: <Sparkles size={20} />,
    questions: [
      { key: "registros_especiais", label: "Algum registro em especial que gostariam que fosse feito?", placeholder: "Alianças, sandália, detalhes do vestido...", multiline: true },
      { key: "pessoas_importantes", label: "Pessoas importantes a serem registradas", placeholder: "Pais, avos, padrinhos...", multiline: true },
      { key: "pais_separados", label: "Pais separados?", placeholder: "Sim/Não" },
      { key: "irmaos", label: "Nomes dos irmãos/irmãs e participação deles no evento", placeholder: "Nomes e o que farão", multiline: true },
      { key: "filhos", label: "O casal tem filhos? Se sim, quantos anos e participação no evento", placeholder: "Detalhes" },
      { key: "situacao_delicada", label: "Alguma situação especial ou delicada que devemos saber?", placeholder: "Informação confidencial" },
      { key: "imperfeicao", label: "Alguma imperfeição que não devemos fotografar?", placeholder: "Informação confidencial" },
      { key: "homenagem_detalhe", label: "Algum detalhe usado para homenagear alguém?", placeholder: "Brincos, colar, terço, fotos no buquê...", multiline: true },
      { key: "presentes_padrinhos", label: "Os padrinhos serão presenteados com algum item?", placeholder: "Cartinhas, presentes..." },
      { key: "tatuagem", label: "Tatuagem visivel de interesse em ser fotografada?", placeholder: "Descreva" },
    ],
  },
  {
    key: "preferencias",
    title: "Preferências do Casal",
    subtitle: "Onde e como gostariam das fotos",
    icon: <ListChecks size={20} />,
    questions: [
      { key: "local_fotos_casal", label: "Tem preferência de onde fazer as fotos do casal?", placeholder: "Ou podemos escolher o melhor local?", multiline: true },
      { key: "local_fotos_familia", label: "Tem preferência de onde fazer as fotos com pais e padrinhos?", placeholder: "Detalhes de cada combinação", multiline: true },
      { key: "fotos_extras", label: "Gostariam de tirar fotos com mais alguém?", placeholder: "Avós, padrinhos de batismo, filhos...", multiline: true },
      { key: "observacoes_gerais", label: "Observações que não foram abordadas", placeholder: "Qualquer detalhe adicional", multiline: true },
    ],
  },
  {
    key: "fornecedores",
    title: "Lista de Fornecedores",
    subtitle: "Instagram dos profissionais do evento",
    icon: <Store size={20} />,
    questions: [
      { key: "buffet", label: "Buffet", placeholder: "@buffet" },
      { key: "video", label: "Vídeo", placeholder: "@videomaker" },
      { key: "decoracao", label: "Decoração", placeholder: "@decoradora" },
      { key: "assessoria", label: "Assessoria", placeholder: "@assessoria" },
      { key: "espaco", label: "Espaço/Salão", placeholder: "@espaco" },
      { key: "musica_cerimonia", label: "Música da cerimônia", placeholder: "@coral" },
      { key: "dj_banda", label: "DJ / Banda", placeholder: "@dj" },
      { key: "maquiagem", label: "Maquiagem", placeholder: "@maquiadora" },
      { key: "doces_bolo", label: "Doces e bolo", placeholder: "@confeitaria" },
      { key: "bar", label: "Bar / Drinks", placeholder: "@bar" },
      { key: "florista", label: "Florista", placeholder: "@florista" },
      { key: "outros", label: "Outros fornecedores", placeholder: "Nicho — @instagram", multiline: true },
    ],
  },
];

/* ---- Component ---- */
export function BriefingClient() {
  const [step, setStep] = useState(0);
  const [sections, setSections] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [briefingStatus, setBriefingStatus] = useState("rascunho");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [direction, setDirection] = useState(1);

  // Load briefing
  useEffect(() => {
    fetch("/api/portal/briefing")
      .then(r => r.json())
      .then(d => {
        if (d.briefing) {
          setSections(d.briefing.sections || {});
          setBriefingStatus(d.briefing.status);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-save debounced
  const autoSave = useCallback((data: Record<string, Record<string, string>>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/portal/briefing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: data }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
      setSaving(false);
    }, 1500);
  }, []);

  const updateField = (sectionKey: string, questionKey: string, value: string) => {
    setSections(prev => {
      const next = { ...prev, [sectionKey]: { ...prev[sectionKey], [questionKey]: value } };
      autoSave(next);
      return next;
    });
  };

  const goTo = (i: number) => {
    setDirection(i > step ? 1 : -1);
    setStep(i);
  };

  const finalize = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/portal/briefing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, status: "preenchido" }),
      });
      if (r.ok) setBriefingStatus("preenchido");
    } catch {}
    setSaving(false);
  };

  // Progress calc
  const totalQ = SECTIONS.reduce((a, s) => a + s.questions.length, 0);
  const filledQ = SECTIONS.reduce((a, s) => {
    const data = sections[s.key] || {};
    return a + s.questions.filter(q => data[q.key]?.trim()).length;
  }, 0);
  const pct = totalQ > 0 ? Math.round((filledQ / totalQ) * 100) : 0;

  const sec = SECTIONS[step];
  const secData = sections[sec?.key] || {};
  const secFilled = sec ? sec.questions.filter(q => secData[q.key]?.trim()).length : 0;

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-12 flex justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${green} transparent ${green} ${green}` }} />
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="mb-6">
        <h1 className="text-[28px] tracking-[-0.025em]"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
        >Briefing do Evento</h1>
        <p className="text-[13px] mt-1" style={{ color: muted }}>
          Preencha com calma — tudo salva automaticamente.
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="mb-6 rounded-2xl p-4" style={gc()}
      >
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[12px] font-semibold" style={{ color: fg }}>{pct}% preenchido</p>
          <div className="flex items-center gap-1.5">
            {saving && <span className="text-[10px]" style={{ color: muted }}>Salvando...</span>}
            {saved && !saving && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] flex items-center gap-1" style={{ color: green }}
              ><Check size={10} /> Salvo</motion.span>
            )}
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
            style={{ backgroundColor: green, boxShadow: `0 0 10px ${green}40` }}
          />
        </div>
      </motion.div>

      {/* Section tabs — horizontal scroll */}
      <div className="mb-5 -mx-6 px-6 overflow-x-auto">
        <div className="flex gap-2 pb-2" style={{ minWidth: "max-content" }}>
          {SECTIONS.map((s, i) => {
            const sData = sections[s.key] || {};
            const sFilled = s.questions.filter(q => sData[q.key]?.trim()).length;
            const isComplete = sFilled === s.questions.length;
            const isActive = i === step;
            return (
              <button key={s.key} onClick={() => goTo(i)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 shrink-0"
                style={isActive
                  ? { ...gc(), backgroundColor: "rgba(255,255,255,0.5)" }
                  : { backgroundColor: "transparent", border: "1px solid transparent" }
                }
              >
                <span style={{ color: isComplete ? green : isActive ? fg : subtle }}>
                  {isComplete ? <Check size={13} /> : <span className="text-[12px]">{i + 1}</span>}
                </span>
                <span className="text-[11px] font-medium" style={{ color: isActive ? fg : muted }}>
                  {s.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active section */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={springDefault}
        >
          <div className="rounded-2xl p-6 mb-5" style={gc()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: greenBg, color: green }}>
                {sec.icon}
              </div>
              <div>
                <h2 className="text-[18px] font-semibold" style={{ color: fg }}>{sec.title}</h2>
                <p className="text-[11px]" style={{ color: muted }}>
                  {sec.subtitle} — {secFilled}/{sec.questions.length} respondidas
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {sec.questions.map(q => (
                <div key={q.key}>
                  <label className="text-[12px] font-medium mb-1.5 block" style={{ color: soft }}>{q.label}</label>
                  {q.multiline ? (
                    <textarea
                      value={secData[q.key] || ""}
                      onChange={e => updateField(sec.key, q.key, e.target.value)}
                      placeholder={q.placeholder}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        color: fg,
                      }}
                      onFocus={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = `${green}40`; }}
                      onBlur={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={secData[q.key] || ""}
                      onChange={e => updateField(sec.key, q.key, e.target.value)}
                      placeholder={q.placeholder}
                      className="w-full rounded-xl px-4 py-3 text-[13px] outline-none transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        color: fg,
                      }}
                      onFocus={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = `${green}40`; }}
                      onBlur={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-30"
          style={gc()}
        >
          <ArrowLeft size={14} /> Anterior
        </button>

        {step < SECTIONS.length - 1 ? (
          <button onClick={() => goTo(step + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:scale-[1.02]"
            style={{ backgroundColor: green, color: "#fff", boxShadow: `0 4px 12px ${green}30` }}
          >
            Proximo <ArrowRight size={14} />
          </button>
        ) : (
          <button onClick={finalize} disabled={saving || briefingStatus === "preenchido"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: green, color: "#fff", boxShadow: `0 4px 12px ${green}30` }}
          >
            {briefingStatus === "preenchido" ? (
              <><Check size={14} /> Briefing enviado</>
            ) : (
              <><Save size={14} /> Finalizar e enviar</>
            )}
          </button>
        )}
      </div>

      {briefingStatus === "preenchido" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] mt-4" style={{ color: green }}>
          Briefing enviado com sucesso! Você pode voltar e editar quando quiser.
        </motion.p>
      )}
    </div>
  );
}
