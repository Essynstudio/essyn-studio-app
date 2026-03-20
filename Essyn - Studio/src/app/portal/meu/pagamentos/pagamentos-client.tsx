"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Installment {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  category: string | null;
  projects: { id: string; name: string } | null;
}

interface Props { installments: Installment[]; }

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }); }

const METHODS: Record<string, string> = {
  pix: "PIX", boleto: "Boleto", cartao_credito: "Cartao", cartao_debito: "Debito", transferencia: "Transferencia", dinheiro: "Dinheiro",
};

const T = { fg: "#2D2A26", muted: "#8E8880", subtle: "#B5AFA6", green: "#2D7A4F", greenSoft: "rgba(45,122,79,0.12)", error: "#B84233", warning: "#C87A20" };
const GS = { bg: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.55)", shadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(255,255,255,0.4) inset" };

export function PortalPagamentosClient({ installments }: Props) {
  const summary = useMemo(() => {
    const total = installments.reduce((s, i) => s + i.amount, 0);
    const paid = installments.filter((i) => i.status === "pago").reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    return { total, paid, remaining: total - paid, percent: total > 0 ? Math.round((paid / total) * 100) : 0 };
  }, [installments]);

  const nextPayment = useMemo(() => {
    return installments.filter((i) => i.status === "pendente" || i.status === "vencido" || (!["pago", "cancelado"].includes(i.status) && !isPast(new Date(i.due_date))))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] || null;
  }, [installments]);

  return (
    <div className="px-6 lg:px-10 py-8 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springDefault}>
        <h1 className="text-[24px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: T.fg }}>Pagamentos</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.05 }}
        className="rounded-2xl p-5 backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[28px] font-semibold tabular-nums tracking-[-0.02em]" style={{ color: T.fg }}>{summary.percent}%</span>
          <span className="text-[12px]" style={{ color: T.muted }}>{fmt(summary.paid)} de {fmt(summary.total)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${summary.percent}%`, backgroundColor: T.green }} />
        </div>
        {summary.remaining > 0 && <p className="text-[11px] mt-2" style={{ color: T.subtle }}>Faltam {fmt(summary.remaining)}</p>}
      </motion.div>

      {nextPayment && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.08 }}
          className="rounded-2xl p-5 border-l-[3px] backdrop-blur-2xl"
          style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow, borderLeftColor: nextPayment.status === "vencido" || isPast(new Date(nextPayment.due_date)) ? T.error : T.warning }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: T.muted }}>Proximo pagamento</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold" style={{ color: T.fg }}>{nextPayment.description}</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>
                {(() => {
                  const d = new Date(nextPayment.due_date); const days = differenceInDays(d, new Date());
                  if (isPast(d) && !isToday(d)) return <span style={{ color: T.error, fontWeight: 500 }}>Vencido</span>;
                  if (isToday(d)) return <span style={{ color: T.warning, fontWeight: 500 }}>Vence hoje</span>;
                  return `Vence em ${days} dia${days !== 1 ? "s" : ""} · ${format(d, "dd/MM", { locale: ptBR })}`;
                })()}
              </p>
            </div>
            <p className="text-[20px] font-semibold tabular-nums" style={{ color: T.fg }}>{fmt(nextPayment.amount)}</p>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.12 }}
        className="rounded-2xl overflow-hidden backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}
      >
        {installments.map((inst, i) => {
          const isPago = inst.status === "pago";
          const isVencido = inst.status === "vencido" || (!isPago && isPast(new Date(inst.due_date)) && !isToday(new Date(inst.due_date)));
          return (
            <div key={inst.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "rgba(255,255,255,0.4)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isPago ? T.greenSoft : isVencido ? "rgba(184,66,51,0.1)" : "rgba(200,122,32,0.1)" }}
                >
                  {isPago ? <Check size={13} style={{ color: T.green }} /> : isVencido ? <AlertCircle size={13} style={{ color: T.error }} /> : <Clock size={13} style={{ color: T.warning }} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: T.fg }}>{inst.description}</p>
                  <p className="text-[10px]" style={{ color: T.subtle }}>
                    {isPago && inst.paid_at ? `${format(new Date(inst.paid_at), "dd/MM/yy", { locale: ptBR })}${inst.payment_method ? ` · ${METHODS[inst.payment_method] || inst.payment_method}` : ""}` : format(new Date(inst.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[14px] font-semibold tabular-nums" style={{ color: isPago ? T.muted : T.fg }}>{fmt(inst.amount)}</p>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: isPago ? T.green : isVencido ? T.error : T.warning, backgroundColor: isPago ? T.greenSoft : isVencido ? "rgba(184,66,51,0.1)" : "rgba(200,122,32,0.1)" }}
                >{isPago ? "Pago" : isVencido ? "Vencido" : "Pendente"}</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
