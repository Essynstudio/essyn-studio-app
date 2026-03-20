"use client";

import { motion } from "motion/react";
import { Package, Check, Clock, Truck, Camera, BookOpen, Image, Gift } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";

interface ProjectItem {
  id: string; name: string; description: string | null; category: string;
  quantity: number; unit_price: number; status: string; delivered_at: string | null; created_at: string;
}
interface Project { id: string; name: string; value: number; paid: number; }
interface Props { items: ProjectItem[]; project: Project | null; }

const fg = "#2D2A26";
const muted = "#8E8880";
const subtle = "#B5AFA6";
const green = "#2D7A4F";
const greenBg = "rgba(45,122,79,0.12)";
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

function cur(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }); }

const CAT_ICON: Record<string, React.ReactNode> = {
  servico: <Camera size={16} />,
  album: <BookOpen size={16} />,
  impressao: <Image size={16} />,
  produto: <Gift size={16} />,
  extra: <Package size={16} />,
};
const CAT_LABEL: Record<string, string> = {
  servico: "Serviço", album: "Álbum", impressao: "Impressão", produto: "Produto", extra: "Extra",
};
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  contratado: { label: "Contratado", color: warn, bg: "rgba(200,122,32,0.1)", icon: <Clock size={12} /> },
  em_producao: { label: "Em produção", color: "#2C444D", bg: "rgba(44,68,77,0.1)", icon: <Truck size={12} /> },
  entregue: { label: "Entregue", color: green, bg: greenBg, icon: <Check size={12} /> },
  cancelado: { label: "Cancelado", color: subtle, bg: "rgba(0,0,0,0.04)", icon: <Package size={12} /> },
};

export function ServicosClient({ items, project }: Props) {
  const totalItems = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="mb-6">
        <h1 className="text-[28px] tracking-[-0.025em]"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
        >Serviços Contratados</h1>
        {project && <p className="text-[12px] mt-1" style={{ color: muted }}>{project.name}</p>}
      </motion.div>

      {/* Summary */}
      {project && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.03 }}
          className="rounded-2xl p-5 mb-5" style={gc()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: muted }}>Valor do pacote</p>
              <p className="text-[26px] font-semibold tabular-nums tracking-tight" style={{ color: fg }}>{cur(project.value)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: muted }}>Itens</p>
              <p className="text-[26px] font-semibold tabular-nums tracking-tight" style={{ color: green }}>{items.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Items list */}
      {items.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.06 }}
          className="rounded-2xl overflow-hidden" style={gc()}
        >
          {items.map((item, i) => {
            const st = STATUS_LABEL[item.status] || STATUS_LABEL.contratado;
            return (
              <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
                  {CAT_ICON[item.category] || <Package size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: fg }}>{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: subtle }}>{CAT_LABEL[item.category] || item.category}</span>
                    {item.quantity > 1 && <span className="text-[10px]" style={{ color: subtle }}>x{item.quantity}</span>}
                    {item.description && <span className="text-[10px] truncate" style={{ color: subtle }}>— {item.description}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {item.unit_price > 0 && <p className="text-[13px] font-semibold tabular-nums" style={{ color: fg }}>{cur(item.unit_price * item.quantity)}</p>}
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full mt-0.5" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.icon} {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.06 }}
          className="rounded-2xl p-12 text-center" style={gc()}
        >
          <Package size={32} className="mx-auto mb-3 opacity-20" style={{ color: subtle }} />
          <p className="text-[15px] font-semibold" style={{ color: fg }}>Serviços em breve</p>
          <p className="text-[12px] mt-1.5 max-w-[260px] mx-auto" style={{ color: muted }}>
            Os detalhes do seu pacote contratado aparecerão aqui quando o fotógrafo configurar.
          </p>
        </motion.div>
      )}
    </div>
  );
}
