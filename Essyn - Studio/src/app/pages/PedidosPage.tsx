/**
 * PedidosPage — Loja / Pedidos (photographer side)
 *
 * Shows all orders from clients across galleries.
 * Apple Premium design system, zero transparency rule.
 */
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ShoppingBag, Package, Truck, CheckCircle2,
  Clock, ChevronRight, Search,
  DollarSign, TrendingUp, Eye,
  X, Printer, Mail, FileText, QrCode, Download,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { springDefault } from "../lib/motion-tokens";
import {
  WidgetCard,
  HeaderWidget,
} from "../components/ui/apple-kit";
import { useAppStore, type OrderStatus, type AppOrder } from "../lib/appStore";
import { useDk } from "../lib/useDarkColors";
import { CatalogManager } from "../components/pedidos/CatalogManager";

/* ── Spring preset ── */
const spring = springDefault;

/* ── Status config ── */
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; darkBg: string; icon: React.ReactNode }> = {
  pendente:  { label: "Pendente",  color: "#FF9500", bg: "#FFF0DC", darkBg: "#2C2410", icon: <Clock className="w-3.5 h-3.5" /> },
  pago:      { label: "Pago",      color: "#34C759", bg: "#E8EFE5", darkBg: "#1A2C1E", icon: <DollarSign className="w-3.5 h-3.5" /> },
  producao:  { label: "Produção",  color: "#007AFF", bg: "#F2F2F7", darkBg: "#1A2030", icon: <Printer className="w-3.5 h-3.5" /> },
  enviado:   { label: "Enviado",   color: "#5856D6", bg: "#F0F0FF", darkBg: "#1E1A30", icon: <Truck className="w-3.5 h-3.5" /> },
  entregue:  { label: "Entregue",  color: "#4E7545", bg: "#F2F8F4", darkBg: "#1A2C1E", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelado: { label: "Cancelado", color: "#FF3B30", bg: "#FDEDEF", darkBg: "#2C1A1A", icon: <X className="w-3.5 h-3.5" /> },
};

type TabFilter = "todos" | "pendentes" | "em_andamento" | "concluidos";
type SectionTab = "pedidos" | "catalogo";

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

export function PedidosPage() {
  const dk = useDk();
  const { orders, updateOrderStatus, galleries, catalog } = useAppStore();
  const [sectionTab, setSectionTab] = useState<SectionTab>("pedidos");
  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<AppOrder | null>(null);

  /* ── Filter orders ── */
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab === "pendentes") result = result.filter((o) => o.status === "pendente");
    else if (activeTab === "em_andamento") result = result.filter((o) => ["pago", "producao", "enviado"].includes(o.status));
    else if (activeTab === "concluidos") result = result.filter((o) => ["entregue", "cancelado"].includes(o.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) => o.cliente.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeTab, search]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const pendentes = orders.filter((o) => o.status === "pendente");
    const emAndamento = orders.filter((o) => ["pago", "producao", "enviado"].includes(o.status));
    const totalReceita = orders.filter((o) => o.status !== "cancelado").reduce((sum, o) => sum + o.total, 0);
    return {
      totalPedidos: orders.length,
      pendentes: pendentes.length,
      valorPendente: pendentes.reduce((sum, o) => sum + o.total, 0),
      emAndamento: emAndamento.length,
      totalReceita,
      ticketMedio: orders.length > 0 ? Math.round(totalReceita / orders.length) : 0,
    };
  }, [orders]);

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: orders.length },
    { id: "pendentes", label: "Pendentes", count: stats.pendentes },
    { id: "em_andamento", label: "Em Andamento", count: stats.emAndamento },
    { id: "concluidos", label: "Concluídos", count: orders.filter((o) => ["entregue", "cancelado"].includes(o.status)).length },
  ];

  const contextLine = `${stats.totalPedidos} pedido${stats.totalPedidos !== 1 ? "s" : ""} · ${fmtCurrency(stats.totalReceita)} receita total · Ticket médio ${fmtCurrency(stats.ticketMedio)}`;

  const handleAdvanceStatus = (order: AppOrder) => {
    const flow: OrderStatus[] = ["pendente", "pago", "producao", "enviado", "entregue"];
    const idx = flow.indexOf(order.status);
    if (idx >= 0 && idx < flow.length - 1) {
      const next = flow[idx + 1];
      updateOrderStatus(order.id, next);
      toast.success(`Pedido ${order.id} → ${statusConfig[next].label}`);
    }
  };

  const activeCatalog = catalog.filter((p) => p.enabled);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <HeaderWidget
        greeting="Loja & Pedidos"
        userName=""
        contextLine={contextLine}
        delay={0}
      />

      {/* ── Section tabs (Pedidos / Catálogo) ── */}
      <WidgetCard delay={0.01}>
        <div className="flex items-center gap-1 px-5 py-2.5">
          {([
            { id: "pedidos" as SectionTab, label: "Pedidos", icon: <ShoppingBag className="w-3.5 h-3.5" />, count: orders.length },
            { id: "catalogo" as SectionTab, label: "Catálogo", icon: <Package className="w-3.5 h-3.5" />, count: catalog.length },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSectionTab(tab.id)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] transition-all cursor-pointer"
              style={{
                fontWeight: sectionTab === tab.id ? 600 : 500,
                backgroundColor: sectionTab === tab.id
                  ? (dk.isDark ? "#F5F5F7" : "#1D1D1F")
                  : "transparent",
                color: sectionTab === tab.id
                  ? (dk.isDark ? "#1D1D1F" : "#FFFFFF")
                  : dk.textMuted,
              }}
            >
              {tab.icon}
              {tab.label}
              <span
                className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md"
                style={{
                  fontWeight: 600,
                  backgroundColor: sectionTab === tab.id
                    ? (dk.isDark ? "#E5E5EA" : "#3C3C43")
                    : dk.bgMuted,
                  color: sectionTab === tab.id
                    ? (dk.isDark ? "#636366" : "#AEAEB2")
                    : dk.textSubtle,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </WidgetCard>

      {/* ── Section Content ── */}
      {sectionTab === "pedidos" ? (
        <>
          {/* ── KPI strip ── */}
          <WidgetCard delay={0.02}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { label: "Pedidos", value: stats.totalPedidos.toString(), icon: <ShoppingBag className="w-4 h-4" />, color: "#007AFF", bg: dk.isDark ? "#1A2030" : "#F2F2F7" },
                { label: "Pendentes", value: fmtCurrency(stats.valorPendente), icon: <Clock className="w-4 h-4" />, color: "#FF9500", bg: dk.isDark ? "#2C2410" : "#FFF0DC" },
                { label: "Receita Total", value: fmtCurrency(stats.totalReceita), icon: <TrendingUp className="w-4 h-4" />, color: "#34C759", bg: dk.isDark ? "#1A2C1E" : "#E8EFE5" },
                { label: "Catálogo", value: `${activeCatalog.length} ativos`, icon: <Package className="w-4 h-4" />, color: "#5856D6", bg: dk.isDark ? "#1E1A30" : "#F0F0FF" },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-5 py-4 ${idx > 0 ? "border-l" : ""}`}
                  style={{ borderColor: idx > 0 ? dk.hairline : undefined }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] tabular-nums truncate" style={{ fontWeight: 600, color: dk.textPrimary }}>{kpi.value}</span>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{kpi.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </WidgetCard>

          {/* ── Catalog preview strip ── */}
          <WidgetCard title="Catálogo de Produtos" count={activeCatalog.length} delay={0.04}>
            <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 py-3">
              {activeCatalog.map((prod) => {
                const priceLabel = prod.sizesPricing && prod.sizesPricing.length > 0
                  ? `a partir de ${fmtCurrency(Math.min(...prod.sizesPricing.map((s) => s.price)))}`
                  : `a partir de ${fmtCurrency(prod.price)}`;
                return (
                  <div
                    key={prod.id}
                    className="shrink-0 w-[200px] rounded-xl border overflow-hidden transition-colors cursor-pointer"
                    style={{ borderColor: dk.border, backgroundColor: dk.bg }}
                    onClick={() => setSectionTab("catalogo")}
                  >
                    <div className="h-24 flex items-center justify-center overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8" style={{ color: dk.textDisabled }} />
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>{prod.name}</span>
                      <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{prod.desc}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: "#007AFF" }}>
                          {priceLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prod.sizes.slice(0, 3).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}>{s}</span>
                        ))}
                        {prod.sizes.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}>+{prod.sizes.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Quick add card */}
              <div
                className="shrink-0 w-[200px] rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center gap-2 py-10 transition-colors cursor-pointer"
                style={{ borderColor: dk.border, color: dk.textSubtle }}
                onClick={() => setSectionTab("catalogo")}
              >
                <Plus className="w-6 h-6" />
                <span className="text-[12px]" style={{ fontWeight: 500 }}>Gerir Catálogo</span>
              </div>
            </div>
          </WidgetCard>

          {/* ── Orders list ── */}
          <WidgetCard title="Pedidos" delay={0.06}>
            {/* Tab bar + search */}
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-5 py-2.5 border-b"
              style={{ borderColor: dk.hairline }}
            >
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer"
                    style={{
                      fontWeight: 500,
                      backgroundColor: activeTab === tab.id
                        ? (dk.isDark ? "#F5F5F7" : "#1D1D1F")
                        : "transparent",
                      color: activeTab === tab.id
                        ? (dk.isDark ? "#1D1D1F" : "#FFFFFF")
                        : dk.textMuted,
                      boxShadow: activeTab === tab.id ? (dk.isDark ? "none" : "0 1px 3px #D1D1D6") : "none",
                    }}
                  >
                    {tab.label}
                    <span
                      className="text-[10px] tabular-nums"
                      style={{
                        fontWeight: 600,
                        color: activeTab === tab.id
                          ? (dk.isDark ? "#636366" : "#8E8E93")
                          : dk.textDisabled,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all max-w-[240px]"
                style={{ borderColor: dk.border, backgroundColor: dk.bg }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar pedido..."
                  className="flex-1 text-[12px] bg-transparent outline-none"
                  style={{ fontWeight: 400, color: dk.textPrimary }}
                />
              </div>
            </div>

            {/* Order rows */}
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => {
                    const sc = statusConfig[order.status];
                    const gallery = galleries.find((g) => g.id === order.galleryId);
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ ...spring, delay: idx * 0.02 }}
                      >
                        {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                        <div
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer group"
                          style={{ backgroundColor: "transparent" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = dk.bgHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {/* Status icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: dk.isDark ? sc.darkBg : sc.bg, color: sc.color }}
                          >
                            {sc.icon}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
                                {order.cliente}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[9px]"
                                style={{ fontWeight: 600, backgroundColor: dk.isDark ? sc.darkBg : sc.bg, color: sc.color }}
                              >
                                {sc.label}
                              </span>
                            </div>
                            <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
                              {order.items.length} item{order.items.length !== 1 ? "ns" : ""} · {gallery?.nome || order.galleryId} · {order.createdAt}
                            </span>
                          </div>

                          {/* Total */}
                          <span className="text-[14px] tabular-nums shrink-0" style={{ fontWeight: 600, color: dk.textPrimary }}>
                            {fmtCurrency(order.total)}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setDetailOrder(order); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                              style={{ color: dk.textSubtle, backgroundColor: "transparent" }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {order.status !== "entregue" && order.status !== "cancelado" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(order); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                style={{ color: dk.textSubtle, backgroundColor: "transparent" }}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={spring}
                    className="flex flex-col items-center justify-center py-16 gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                      <ShoppingBag className="w-6 h-6" style={{ color: dk.textDisabled }} />
                    </div>
                    <p className="text-[13px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      Nenhum pedido encontrado
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </WidgetCard>
        </>
      ) : (
        /* ── CATÁLOGO SECTION ── */
        <CatalogManager />
      )}

      {/* ── Order detail modal ── */}
      <AnimatePresence>
        {detailOrder && (
          <OrderDetailModal
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
            onAdvance={() => {
              handleAdvanceStatus(detailOrder);
              setDetailOrder(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  ORDER DETAIL MODAL                                 */
/* ═══════════════════════════════════════════════════ */

function OrderDetailModal({
  order,
  onClose,
  onAdvance,
}: {
  order: AppOrder;
  onClose: () => void;
  onAdvance: () => void;
}) {
  const sc = statusConfig[order.status];
  const canAdvance = order.status !== "entregue" && order.status !== "cancelado";
  const [showComposer, setShowComposer] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Pedido ${order.id} — Atualização`);
  const [emailBody, setEmailBody] = useState(
    `Olá ${order.cliente},\n\nSegue atualização do seu pedido ${order.id} (${statusConfig[order.status].label}).\n\nItens:\n${order.items.map((i) => `• ${i.product} (${i.size}) x${i.qty}`).join("\n")}\n\nTotal: ${fmtCurrency(order.total)}\n\nQualquer dúvida, estou à disposição.\n\nAtenciosamente,\nESSYN Studio`
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="order-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="order-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={spring}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-2xl shadow-[0_8px_32px_#E5E5EA] border border-[#F2F2F7] w-full max-w-[480px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.bg, color: sc.color }}>
                {sc.icon}
              </div>
              <div>
                <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                  Pedido {order.id}
                </h3>
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  {order.cliente} · {order.createdAt}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="px-5 py-3">
            <p className="text-[11px] text-[#8E8E93] mb-2" style={{ fontWeight: 600 }}>ITENS DO PEDIDO</p>
            <div className="flex flex-col gap-0">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  {idx > 0 && <div className="h-px bg-[#F2F2F7]" />}
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {item.product}
                      </span>
                      <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                        {item.size} · Qtd: {item.qty}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 500 }}>
                      {fmtCurrency(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="px-5 py-3">
            <p className="text-[11px] text-[#8E8E93] mb-3" style={{ fontWeight: 600 }}>TRACKING</p>
            <div className="flex flex-col">
              {(["pendente", "pago", "producao", "enviado", "entregue"] as OrderStatus[]).map((step, idx, arr) => {
                const stepCfg = statusConfig[step];
                const currentIdx = arr.indexOf(order.status);
                const isCancelled = order.status === "cancelado";
                const isDone = !isCancelled && idx <= currentIdx;
                const isCurrent = !isCancelled && idx === currentIdx;
                const isLast = idx === arr.length - 1;
                return (
                  <div key={step} className="flex items-start gap-3">
                    {/* Dot & line */}
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full border-2 mt-0.5 ${
                          isCurrent
                            ? "border-[#007AFF] bg-[#007AFF]"
                            : isDone
                            ? "border-[#34C759] bg-[#34C759]"
                            : "border-[#E5E5EA] bg-white"
                        }`}
                      />
                      {!isLast && (
                        <div
                          className={`w-px flex-1 min-h-[20px] ${
                            isDone && idx < currentIdx ? "bg-[#34C759]" : "bg-[#F2F2F7]"
                          }`}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-3 ${isLast ? "pb-0" : ""}`}>
                      <span
                        className={`text-[12px] ${
                          isCurrent ? "text-[#007AFF]" : isDone ? "text-[#1D1D1F]" : "text-[#D1D1D6]"
                        }`}
                        style={{ fontWeight: isCurrent ? 600 : isDone ? 500 : 400 }}
                      >
                        {stepCfg.label}
                      </span>
                      {isCurrent && (
                        <span className="ml-1.5 text-[9px] text-[#007AFF] px-1.5 py-0.5 rounded-md bg-[#F2F2F7]" style={{ fontWeight: 600 }}>
                          ATUAL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {order.status === "cancelado" && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <div className="w-3 h-3 rounded-full border-2 border-[#FF3B30] bg-[#FF3B30] mt-0.5" />
                  </div>
                  <span className="text-[12px] text-[#FF3B30]" style={{ fontWeight: 600 }}>
                    Cancelado
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="mx-5 h-px bg-[#E5E5EA]" />
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>Total</span>
            <span className="text-[17px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 700 }}>
              {fmtCurrency(order.total)}
            </span>
          </div>

          {/* Email Composer */}
          <AnimatePresence>
            {showComposer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="overflow-hidden border-t border-[#F2F2F7]"
              >
                <div className="px-5 py-3 flex flex-col gap-2">
                  <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 600 }}>COMPOR E-MAIL</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#AEAEB2] shrink-0" style={{ fontWeight: 500 }}>Para:</span>
                    <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{order.cliente}</span>
                  </div>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E5EA] text-[12px] text-[#1D1D1F] bg-white focus:outline-none focus:border-[#007AFF] transition-colors"
                    style={{ fontWeight: 500 }}
                    placeholder="Assunto"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E5EA] text-[12px] text-[#1D1D1F] bg-white resize-none focus:outline-none focus:border-[#007AFF] transition-colors"
                    style={{ fontWeight: 400, lineHeight: "1.5" }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowComposer(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        toast.success("E-mail enviado!", { description: `Para: ${order.cliente} — ${emailSubject}` });
                        setShowComposer(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Enviar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-[#F2F2F7]">
            <button
              onClick={() => setShowComposer(!showComposer)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-[12px] transition-colors cursor-pointer ${
                showComposer
                  ? "border-[#007AFF] bg-[#F2F2F7] text-[#007AFF]"
                  : "border-[#E5E5EA] text-[#636366] hover:bg-[#FAFAFA]"
              }`}
              style={{ fontWeight: 500 }}
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowInvoice(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Fatura
            </button>
            {canAdvance && (
              <button
                onClick={onAdvance}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Avançar Status
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Invoice preview modal */}
      <AnimatePresence>
        {showInvoice && (
          <InvoicePreviewModal order={order} onClose={() => setShowInvoice(false)} />
        )}
      </AnimatePresence>
    </AnimatePresence>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INVOICE PREVIEW MODAL                              */
/* ═══════════════════════════════════════════════════ */

function InvoicePreviewModal({ order, onClose }: { order: AppOrder; onClose: () => void }) {
  const invoiceNumber = `FAT-${order.id.replace("o", "").padStart(4, "0")}`;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const dueDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <motion.div
        key="invoice-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[10000] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="invoice-modal"
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
        transition={spring}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4 overflow-y-auto"
      >
        <div
          className="bg-white rounded-2xl shadow-[0_16px_64px_#D1D1D6] w-full max-w-[520px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F2F2F7] bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#636366]" />
              <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                Pré-visualização de Fatura
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success("Download iniciado!", { description: `${invoiceNumber}.pdf` });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-[11px] hover:bg-[#0066D6] transition-colors cursor-pointer"
                style={{ fontWeight: 600 }}
              >
                <Download className="w-3 h-3" />
                PDF
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[#F2F2F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* A4 Document Body */}
          <div className="p-6 bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header with brand */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-[22px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>
                  ESSYN
                </h1>
                <p className="text-[10px] text-[#8E8E93] mt-0.5" style={{ fontWeight: 500 }}>
                  Fotografia Profissional
                </p>
                <p className="text-[10px] text-[#AEAEB2] mt-2" style={{ fontWeight: 400, lineHeight: "1.4" }}>
                  Rua da Fotografia, 42 — São Paulo, SP{"\n"}
                  CNPJ: 12.345.678/0001-90{"\n"}
                  contato@essyn.studio
                </p>
              </div>
              <div className="text-right">
                <p className="text-[18px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                  FATURA
                </p>
                <p className="text-[12px] text-[#007AFF] mt-0.5" style={{ fontWeight: 600 }}>
                  {invoiceNumber}
                </p>
                <div className="mt-2 flex flex-col gap-0.5">
                  <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                    Emissão: {today}
                  </p>
                  <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                    Vencimento: {dueDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#E5E5EA] mb-4" />

            {/* Client info */}
            <div className="mb-5">
              <p className="text-[9px] text-[#8E8E93] mb-1" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                FATURAR PARA
              </p>
              <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{order.cliente}</p>
              <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                Pedido: {order.id} · Criado em {order.createdAt}
              </p>
            </div>

            {/* Items table */}
            <div className="mb-4">
              <div className="flex items-center gap-2 py-2 border-b border-[#E5E5EA]">
                <span className="flex-1 text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Descrição
                </span>
                <span className="w-12 text-center text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tam.
                </span>
                <span className="w-10 text-center text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Qtd
                </span>
                <span className="w-20 text-right text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Unit.
                </span>
                <span className="w-20 text-right text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total
                </span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-2.5 border-b border-[#F2F2F7]">
                  <span className="flex-1 text-[11px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                    {item.product}
                  </span>
                  <span className="w-12 text-center text-[11px] text-[#636366] tabular-nums" style={{ fontWeight: 400 }}>
                    {item.size}
                  </span>
                  <span className="w-10 text-center text-[11px] text-[#636366] tabular-nums" style={{ fontWeight: 400 }}>
                    {item.qty}
                  </span>
                  <span className="w-20 text-right text-[11px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>
                    {fmtCurrency(item.price)}
                  </span>
                  <span className="w-20 text-right text-[11px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>
                    {fmtCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end gap-1 mb-5">
              <div className="flex items-center gap-8">
                <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Subtotal</span>
                <span className="text-[11px] text-[#1D1D1F] tabular-nums w-24 text-right" style={{ fontWeight: 500 }}>
                  {fmtCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Impostos (0%)</span>
                <span className="text-[11px] text-[#1D1D1F] tabular-nums w-24 text-right" style={{ fontWeight: 500 }}>
                  R$ 0
                </span>
              </div>
              <div className="h-px w-48 bg-[#E5E5EA] my-1" />
              <div className="flex items-center gap-8">
                <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>Total</span>
                <span className="text-[16px] text-[#1D1D1F] tabular-nums w-24 text-right" style={{ fontWeight: 700 }}>
                  {fmtCurrency(order.total)}
                </span>
              </div>
            </div>

            {/* Payment — PIX QR mock */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 mb-4">
              <p className="text-[9px] text-[#8E8E93] mb-2" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DADOS PARA PAGAMENTO
              </p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-[#E5E5EA] shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <QrCode className="w-8 h-8 text-[#1D1D1F]" />
                    <span className="text-[7px] text-[#8E8E93]" style={{ fontWeight: 600 }}>PIX</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>Banco:</span>
                    <span className="text-[10px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Nu Pagamentos S.A.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>PIX:</span>
                    <span className="text-[10px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>contato@essyn.studio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>Titular:</span>
                    <span className="text-[10px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>ESSYN Fotografia LTDA</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>Valor:</span>
                    <span className="text-[12px] text-[#007AFF] tabular-nums" style={{ fontWeight: 700 }}>{fmtCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-center">
              <p className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                Fatura gerada automaticamente pelo ESSYN · Válida como documento fiscal auxiliar
              </p>
              <p className="text-[9px] text-[#D1D1D6] mt-0.5" style={{ fontWeight: 400 }}>
                essyn.studio · Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}