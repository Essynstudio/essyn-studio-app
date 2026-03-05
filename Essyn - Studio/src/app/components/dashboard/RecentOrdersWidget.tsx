/**
 * RecentOrdersWidget — Dashboard mini-card for recent orders
 *
 * Shows latest orders with status badges, pending value KPI,
 * and quick link to /pedidos. Apple Premium design, zero transparency.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingBag,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { WidgetCard } from "../ui/apple-kit";
import { useAppStore, type OrderStatus } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; bgDark: string }> = {
  pendente:  { label: "Pendente",  color: "#FF9500", bg: "#FFF0DC", bgDark: "#2C2410" },
  pago:      { label: "Pago",      color: "#34C759", bg: "#E8EFE5", bgDark: "#1A2C1E" },
  producao:  { label: "Produção",  color: "#007AFF", bg: "#F2F2F7", bgDark: "#1A2030" },
  enviado:   { label: "Enviado",   color: "#5856D6", bg: "#F0F0FF", bgDark: "#1E1A30" },
  entregue:  { label: "Entregue",  color: "#4E7545", bg: "#F2F8F4", bgDark: "#1A2C1E" },
  cancelado: { label: "Cancelado", color: "#FF3B30", bg: "#FDEDEF", bgDark: "#2C1A1A" },
};

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export function RecentOrdersWidget() {
  const navigate = useNavigate();
  const { orders } = useAppStore();
  const { isDark } = useDk();

  const { recent, pendingTotal, pendingCount, totalRevenue } = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pending = orders.filter((o) => o.status === "pendente");
    const nonCancelled = orders.filter((o) => o.status !== "cancelado");
    return {
      recent: sorted.slice(0, 4),
      pendingTotal: pending.reduce((s, o) => s + o.total, 0),
      pendingCount: pending.length,
      totalRevenue: nonCancelled.reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  if (orders.length === 0) return null;

  return (
    <WidgetCard title="Pedidos Recentes" count={orders.length} delay={0.14}>
      {/* KPI strip */}
      <div className={`flex items-center gap-0 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
        <div className="flex-1 flex items-center gap-3 px-5 py-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isDark ? "#2C2410" : "#FFF0DC" }}>
            <Clock className="w-3.5 h-3.5 text-[#FF9500]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[14px] tabular-nums ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`} style={{ fontWeight: 600 }}>
              {fmtCurrency(pendingTotal)}
            </span>
            <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className={`w-px h-8 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
        <div className="flex-1 flex items-center gap-3 px-5 py-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isDark ? "#1A2C1E" : "#E8EFE5" }}>
            <TrendingUp className="w-3.5 h-3.5 text-[#34C759]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[14px] tabular-nums ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`} style={{ fontWeight: 600 }}>
              {fmtCurrency(totalRevenue)}
            </span>
            <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              receita total
            </span>
          </div>
        </div>
      </div>

      {/* Recent list */}
      <div className="flex flex-col">
        {recent.map((order, idx) => {
          const sc = statusConfig[order.status];
          return (
            <div key={order.id}>
              {idx > 0 && <div className={`mx-5 h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />}
              <div className="flex items-center gap-3 px-5 py-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? sc.bgDark : sc.bg, color: sc.color }}
                >
                  <ShoppingBag className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] truncate ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`} style={{ fontWeight: 500 }}>
                    {order.cliente}
                  </p>
                  <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                    {order.items.length} item{order.items.length !== 1 ? "ns" : ""} · {order.createdAt}
                  </p>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0"
                  style={{ fontWeight: 600, backgroundColor: isDark ? sc.bgDark : sc.bg, color: sc.color }}
                >
                  {sc.label}
                </span>
                <span className={`text-[12px] tabular-nums shrink-0 ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`} style={{ fontWeight: 600 }}>
                  {fmtCurrency(order.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`border-t ${isDark ? "border-[#2C2C2E]" : "border-[#F2F2F7]"}`}>
        <button
          onClick={() => navigate("/pedidos")}
          className={`w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-[12px] text-[#007AFF] transition-colors cursor-pointer ${
            isDark ? "hover:bg-[#1C1C1E]" : "hover:bg-[#FAFAFA]"
          }`}
          style={{ fontWeight: 500 }}
        >
          Ver todos os pedidos
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </WidgetCard>
  );
}