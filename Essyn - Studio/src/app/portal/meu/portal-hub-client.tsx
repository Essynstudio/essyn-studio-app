"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import {
  Check, Clock, Camera, AlertCircle, ChevronRight, Heart,
} from "lucide-react";
import {
  IconGaleria, IconFinanceiro, IconContratos, IconEntregas,
  IconLoja, IconMensagens,
} from "@/components/icons/essyn-icons";
import { springDefault, springGentle } from "@/lib/motion-tokens";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { usePortalSession } from "./portal-session-context";

/* ---- Types ---- */
interface Gallery {
  id: string; name: string; status: string; photo_count: number;
  cover_url: string | null; delivery_deadline_date: string | null; created_at: string;
  projects: { id: string; name: string; event_type: string; event_date: string | null } | null;
}
interface Project { id: string; name: string; event_type: string; event_date: string | null; status: string; production_phase: string; value: number; paid: number; }
interface Contract { id: string; title: string; status: string; file_url: string | null; signed_at: string | null; created_at: string; projects: { id: string; name: string } | null; }
interface Installment { id: string; description: string; amount: number; due_date: string; status: string; payment_method: string | null; paid_at: string | null; paid_amount: number | null; projects: { id: string; name: string } | null; }
interface ProjectItem { id: string; name: string; category: string; quantity: number; unit_price: number; status: string; }
interface Props { galleries: Gallery[]; projects: Project[]; contracts: Contract[]; installments: Installment[]; items: ProjectItem[]; clientId: string; studioId: string; }

/* ---- Tokens ---- */
const fg = "#2D2A26";
const muted = "#8E8880";
const subtle = "#B5AFA6";
const accent = "#A58D66"; // Essyn gold
const accentBg = "rgba(165,141,102,0.12)";
const err = "#B84233";
const warn = "#C87A20";

function gc(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    ...extra,
  };
}

/* ---- Helpers ---- */
function cur(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }); }
function dF(d: string) { return format(new Date(d + "T00:00:00"), "d 'de' MMMM, yyyy", { locale: ptBR }); }
const EV: Record<string, string> = { casamento: "Casamento", ensaio: "Ensaio", corporativo: "Corporativo", aniversario: "Aniversario", formatura: "Formatura", batizado: "Batizado", outro: "Evento" };
function greet() { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }

/* ---- Main ---- */
export function PortalHubClient({ galleries, projects, contracts, installments, items }: Props) {
  const s = usePortalSession();
  const main = projects.find(p => p.event_date) || projects[0] || null;
  const ev = main?.event_date ? new Date(main.event_date + "T00:00:00") : null;
  const days = ev ? differenceInDays(ev, new Date()) : null;
  const passed = ev ? isPast(ev) : false;
  const name = s?.client.name?.split(" ")[0] || "Cliente";

  const fin = useMemo(() => {
    const t = installments.reduce((a, i) => a + i.amount, 0);
    const p = installments.filter(i => i.status === "pago").reduce((a, i) => a + (i.paid_amount || i.amount), 0);
    return { t, p, pct: t > 0 ? Math.round((p / t) * 100) : 0 };
  }, [installments]);

  const nxt = useMemo(() => installments.filter(i => i.status === "pendente" || i.status === "vencido")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] || null, [installments]);

  const hasOverdue = useMemo(() => installments.some(i =>
    i.status === "vencido" || (i.status === "pendente" && isPast(new Date(i.due_date + "T00:00:00")) && !isToday(new Date(i.due_date + "T00:00:00")))
  ), [installments]);

  const gal = galleries[0] || null;
  const ctr = contracts[0] || null;

  const isCasamento = s?.eventType === "casamento" || main?.event_type === "casamento";
  const [briefPct, setBriefPct] = useState<number | null>(null);
  const [briefStatus, setBriefStatus] = useState("");
  useEffect(() => {
    if (!isCasamento) return;
    fetch("/api/portal/briefing").then(r => r.ok ? r.json() : null).then(d => {
      if (!d?.briefing) return;
      setBriefStatus(d.briefing.status);
      const secs = d.briefing.sections || {};
      const COUNTS: Record<string, number> = { info: 5, making_noiva: 5, making_noivo: 4, cerimonia: 9, festa: 7, detalhes: 10, preferencias: 4, fornecedores: 12 };
      const total = Object.values(COUNTS).reduce((a, b) => a + b, 0);
      let filled = 0;
      for (const [k] of Object.entries(COUNTS)) {
        const data = secs[k] || {};
        filled += Object.values(data).filter((v: unknown) => typeof v === "string" && (v as string).trim()).length;
      }
      setBriefPct(total > 0 ? Math.round((filled / total) * 100) : 0);
    }).catch(() => { console.error("[Portal] Erro ao carregar briefing"); });
  }, [isCasamento]);

  const [unreadMsgs, setUnreadMsgs] = useState(0);
  useEffect(() => {
    fetch("/api/portal/messages").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.messages) setUnreadMsgs(d.messages.filter((m: { sender_type: string; read_at: string | null }) => m.sender_type === "studio" && !m.read_at).length);
    }).catch(() => { console.error("[Portal] Erro ao carregar mensagens"); });
  }, []);

  return (
    <div className="px-6 lg:px-10 pt-8 pb-8">

      {/* ═══ HERO — greeting + event + countdown ═══ */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springDefault}
        className="rounded-2xl p-6 lg:p-8 mb-5" style={gc()}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-[12px] mb-1.5" style={{ color: muted }}>{greet()}, {name}</p>
            {main ? (
              <>
                <h1 className="text-[28px] lg:text-[32px] leading-[1.1] tracking-[-0.025em]"
                  style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
                >{main.name}</h1>
                <p className="text-[11px] mt-1.5 font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>
                  {EV[main.event_type] || "Evento"}
                </p>
              </>
            ) : (
              <h1 className="text-[28px] lg:text-[32px] leading-[1.1] tracking-[-0.025em]"
                style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
              >Seu portal</h1>
            )}
          </div>

          {ev && !passed && days !== null && days >= 0 && (
            <div className="text-center px-6">
              <p className="text-[48px] lg:text-[56px] font-light tabular-nums leading-none tracking-tight" style={{ color: accent }}>{days}</p>
              <p className="text-[12px] mt-1" style={{ color: muted }}>{days === 1 ? "dia" : "dias"}</p>
              <p className="text-[10px] mt-1.5" style={{ color: subtle }}>{dF(main!.event_date!)}</p>
            </div>
          )}
          {ev && passed && (
            <div className="text-center px-6">
              <div className="flex items-center gap-2">
                <Check size={18} style={{ color: accent }} />
                <p className="text-[16px] font-semibold" style={{ color: accent }}>Realizado</p>
              </div>
              <p className="text-[10px] mt-1" style={{ color: subtle }}>{dF(main!.event_date!)}</p>
            </div>
          )}
        </div>

        {/* Alert inline */}
        {hasOverdue && (
          <Link href="/portal/meu/pagamentos"
            className="flex items-center gap-2.5 mt-5 px-4 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
            style={{ backgroundColor: "rgba(184,66,51,0.08)", border: "1px solid rgba(184,66,51,0.12)" }}
          >
            <AlertCircle size={15} style={{ color: err }} />
            <p className="text-[12px] font-medium" style={{ color: err }}>Você tem pagamento vencido</p>
            <ChevronRight size={13} style={{ color: err }} className="ml-auto opacity-50" />
          </Link>
        )}
      </motion.div>

      {/* ═══ Grid — 3 cols on lg, 2 cols default ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >

        {/* ── Galeria ── */}
        <Link href={gal ? `/portal/meu/galeria/${gal.id}` : "/portal/meu/galeria"} className="group">
          <div className="rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg flex flex-col" style={gc()}>
            {gal?.cover_url && gal.status !== "agendada" ? (
              <div className="h-32 overflow-hidden relative">
                <img src={gal.cover_url} alt={gal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.2), transparent 60%)" }} />
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(45,122,79,0.06), rgba(255,255,255,0.12), rgba(45,122,79,0.04))" }}
              >
                <Camera size={24} style={{ color: accent }} className="opacity-15" />
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <Camera size={10} style={{ color: accent }} className="opacity-50" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Galeria</p>
              </div>
              <p className="text-[15px] font-semibold" style={{ color: fg }}>
                {gal ? gal.status === "agendada" ? "Em preparação" : `${gal.photo_count} fotos` : "Em breve"}
              </p>
              <p className="text-[11px] mt-1 truncate" style={{ color: subtle }}>{gal?.name || "Aguardando"}</p>
              <div className="mt-auto pt-3">
                <ChevronRight size={14} style={{ color: subtle }} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </Link>

        {/* ── Pagamentos ── */}
        <Link href="/portal/meu/pagamentos" className="group">
          <div className="rounded-2xl p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg relative flex flex-col" style={gc()}>
            {hasOverdue && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white/50" style={{ backgroundColor: err, boxShadow: `0 0 6px ${err}50` }} />}
            <div className="flex items-center gap-1.5 mb-3">
              <IconFinanceiro size={10} style={{ color: accent }} className="opacity-50" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Pagamentos</p>
            </div>
            {nxt ? (
              <>
                <p className="text-[24px] font-semibold tabular-nums tracking-tight leading-none" style={{ color: fg }}>{cur(nxt.amount)}</p>
                <p className="text-[11px] mt-2" style={{ color: muted }}>
                  {hasOverdue
                    ? <span style={{ color: err, fontWeight: 600 }}>Vencido</span>
                    : <>Vence {format(new Date(nxt.due_date + "T00:00:00"), "dd/MM", { locale: ptBR })}</>}
                </p>
                <div className="mt-auto pt-4">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.35)" }}>
                    <div className="h-full rounded-full" style={{ width: `${fin.pct}%`, backgroundColor: accent, transition: "width 0.7s", boxShadow: `0 0 8px ${accent}40` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] tabular-nums" style={{ color: subtle }}>{fin.pct}% pago</span>
                    <span className="text-[10px] tabular-nums" style={{ color: subtle }}>{cur(fin.p)} / {cur(fin.t)}</span>
                  </div>
                </div>
              </>
            ) : installments.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Check size={16} style={{ color: accent }} />
                  <p className="text-[16px] font-semibold" style={{ color: accent }}>Em dia</p>
                </div>
                <p className="text-[11px] mt-1" style={{ color: muted }}>{cur(fin.p)} pago</p>
                <div className="mt-auto pt-4">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.35)" }}>
                    <div className="h-full rounded-full" style={{ width: `${fin.pct}%`, backgroundColor: accent }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold" style={{ color: subtle }}>Sem parcelas</p>
                <p className="text-[11px] mt-1" style={{ color: subtle }}>Nenhum pagamento registrado</p>
              </>
            )}
          </div>
        </Link>

        {/* ── Contrato ── */}
        <Link href={ctr ? `/portal/meu/contrato/${ctr.id}` : "/portal/meu/contrato"} className="group">
          <div className="rounded-2xl p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg relative flex flex-col" style={gc()}>
            {ctr?.status === "enviado" && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white/50" style={{ backgroundColor: warn, boxShadow: `0 0 6px ${warn}50` }} />}
            <div className="flex items-center gap-1.5 mb-3">
              <IconContratos size={10} style={{ color: accent }} className="opacity-50" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Contrato</p>
            </div>
            {ctr ? (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: ctr.status === "assinado" ? accentBg : ctr.status === "enviado" ? "rgba(200,122,32,0.1)" : "rgba(255,255,255,0.3)" }}
                  >
                    {ctr.status === "assinado" ? <Check size={13} style={{ color: accent }} /> : <Clock size={13} style={{ color: ctr.status === "enviado" ? warn : subtle }} />}
                  </div>
                  <p className="text-[16px] font-semibold" style={{ color: ctr.status === "assinado" ? accent : ctr.status === "enviado" ? warn : muted }}>
                    {ctr.status === "assinado" ? "Assinado" : ctr.status === "enviado" ? "Pendente" : "Em preparo"}
                  </p>
                </div>
                <p className="text-[11px] truncate" style={{ color: subtle }}>{ctr.title}</p>
                {ctr.status === "enviado" && (
                  <p className="text-[10px] mt-2" style={{ color: warn }}>Aguardando sua assinatura</p>
                )}
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold" style={{ color: subtle }}>Em breve</p>
                <p className="text-[11px] mt-1" style={{ color: subtle }}>Contrato sendo preparado</p>
              </>
            )}
            <div className="mt-auto pt-3">
              <ChevronRight size={14} style={{ color: subtle }} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </Link>

        {/* ── Briefing (only casamento) ── */}
        {isCasamento && <Link href="/portal/meu/briefing" className="group">
          <div className="rounded-2xl p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg flex flex-col" style={gc()}>
            <div className="flex items-center gap-1.5 mb-3">
              <IconEntregas size={10} style={{ color: accent }} className="opacity-50" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Briefing</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: briefStatus === "preenchido" ? accentBg : "rgba(255,255,255,0.35)" }}
              >
                {briefStatus === "preenchido" ? <Check size={16} style={{ color: accent }} /> : <IconEntregas size={16} style={{ color: muted }} />}
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: briefStatus === "preenchido" ? accent : fg }}>
                  {briefStatus === "preenchido" ? "Preenchido" : briefPct !== null && briefPct > 0 ? `${briefPct}%` : "Preencher"}
                </p>
                <p className="text-[10px]" style={{ color: subtle }}>
                  {briefStatus === "preenchido" ? "Enviado" : briefPct !== null && briefPct > 0 ? "Continue" : "Detalhes do evento"}
                </p>
              </div>
            </div>
            {briefPct !== null && briefPct > 0 && briefStatus !== "preenchido" && (
              <div className="mt-auto pt-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.35)" }}>
                  <div className="h-full rounded-full" style={{ width: `${briefPct}%`, backgroundColor: accent, boxShadow: `0 0 8px ${accent}40` }} />
                </div>
              </div>
            )}
            {(briefPct === null || briefPct === 0 || briefStatus === "preenchido") && (
              <div className="mt-auto pt-3">
                <ChevronRight size={14} style={{ color: subtle }} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            )}
          </div>
        </Link>}

        {/* ── Servicos ── */}
        <Link href="/portal/meu/servicos" className="group">
          <div className="rounded-2xl p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg flex flex-col" style={gc()}>
            <div className="flex items-center gap-1.5 mb-3">
              <IconLoja size={10} style={{ color: accent }} className="opacity-50" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Serviços</p>
            </div>
            {items.length > 0 ? (
              <>
                <p className="text-[24px] font-semibold tabular-nums tracking-tight leading-none" style={{ color: fg }}>{items.length}</p>
                <p className="text-[11px] mt-1.5" style={{ color: muted }}>{items.length === 1 ? "item contratado" : "itens contratados"}</p>
                <div className="mt-auto pt-3 flex gap-2 flex-wrap">
                  {items.slice(0, 3).map(i => (
                    <span key={i.id} className="text-[9px] px-2 py-0.5 rounded-full truncate max-w-[120px]"
                      style={{ backgroundColor: i.status === "entregue" ? accentBg : "rgba(255,255,255,0.4)", color: i.status === "entregue" ? accent : muted, border: "1px solid rgba(255,255,255,0.3)" }}
                    >{i.name}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold" style={{ color: fg }}>Ver pacote</p>
                <p className="text-[11px] mt-1" style={{ color: subtle }}>Serviços contratados</p>
                <div className="mt-auto pt-3">
                  <ChevronRight size={14} style={{ color: subtle }} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </>
            )}
          </div>
        </Link>

        {/* ── Mensagens ── */}
        <Link href="/portal/meu/mensagens" className="group">
          <div className="rounded-2xl p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg relative flex flex-col" style={gc()}>
            {unreadMsgs > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white/50" style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}50` }} />}
            <div className="flex items-center gap-1.5 mb-3">
              <IconMensagens size={10} style={{ color: accent }} className="opacity-50" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>Mensagens</p>
              {unreadMsgs > 0 && (
                <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: accentBg, color: accent }}>
                  {unreadMsgs}
                </span>
              )}
            </div>
            <p className="text-[15px] font-semibold" style={{ color: fg }}>
              {unreadMsgs > 0 ? `${unreadMsgs} nova${unreadMsgs > 1 ? "s" : ""}` : "Conversar"}
            </p>
            <p className="text-[11px] mt-1" style={{ color: subtle }}>{s?.studio.name || "Fotografo"}</p>
            <div className="mt-auto pt-3">
              <ChevronRight size={14} style={{ color: subtle }} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </Link>

      </motion.div>

      {/* ═══ Gallery preview ═══ */}
      {gal && gal.cover_url && gal.status !== "agendada" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.1 }}
          className="mt-5"
        >
          <Link href={`/portal/meu/galeria/${gal.id}`} className="group block">
            <div className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-lg" style={gc()}>
              <div className="h-52 overflow-hidden relative">
                <img src={gal.cover_url} alt={gal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent 50%)" }} />
                <div className="absolute bottom-5 left-6">
                  <p className="text-[18px] font-semibold text-white">{gal.name}</p>
                  <p className="text-[12px] text-white/70">{gal.photo_count} fotos</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ═══ Empty state ═══ */}
      {galleries.length === 0 && contracts.length === 0 && installments.length === 0 && !main && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springGentle, delay: 0.06 }}
          className="flex flex-col items-center justify-center py-16 text-center mt-8"
        >
          <div className="w-14 h-14 rounded-full backdrop-blur-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.5)" }}
          ><Heart size={22} style={{ color: accent }} className="opacity-50" /></div>
          <p className="text-[18px] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
          >Seu portal esta sendo preparado</p>
          <p className="text-[12px] mt-2 max-w-[260px] leading-relaxed" style={{ color: muted }}>
            Suas galerias, contratos e pagamentos aparecerao aqui em breve.
          </p>
        </motion.div>
      )}
    </div>
  );
}
