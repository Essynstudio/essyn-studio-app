"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Package,
  DollarSign,
  Clock,
  Factory,
  ChevronRight,
  Loader2,
  Truck,
  CheckCircle2,
  CreditCard,
  Plus,
  ShoppingBag,
  Grid3X3,
  List,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Tag,
  X,
} from "lucide-react";
import {
  PageTransition,
  WidgetEmptyState,
  StatusBadge,
  ActionPill,
  AppleModal,
  SectionHeader,
} from "@/components/ui/apple-kit";
import {
  INPUT_CLS,
  SELECT_CLS,
  PRIMARY_CTA,
  SECONDARY_CTA,
  COMPACT_PRIMARY_CTA,
  COMPACT_SECONDARY_CTA,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn, springDefault } from "@/lib/motion-tokens";

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type MainTab = "pedidos" | "catalogo";
type OrderStatus = "pendente" | "pago" | "producao" | "enviado" | "entregue" | "cancelado";
type ProductCategory = "impressoes" | "digital" | "albuns" | "molduras" | "extras";

interface OrderItem {
  photo_id?: string;
  product_id?: string;
  product_name?: string;
  size?: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  tracking_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  galleries: { id: string; name: string } | null;
  clients: { id: string; name: string } | null;
}

interface ProductSize {
  size: string;
  price: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  base_price: number;
  sizes: ProductSize[];
  image_url: string | null;
  active: boolean;
  created_at: string;
}

interface GalleryRef {
  id: string;
  name: string;
}

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const TAB_ITEMS: { key: MainTab; label: string }[] = [
  { key: "pedidos", label: "Pedidos" },
  { key: "catalogo", label: "Catálogo" },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pendente:  { label: "Pendente",   color: "var(--warning)",  bg: "var(--warning-subtle)" },
  pago:      { label: "Pago",       color: "var(--info)",     bg: "var(--info-subtle)" },
  producao:  { label: "Produção",   color: "var(--accent)",   bg: "var(--accent-subtle)" },
  enviado:   { label: "Enviado",    color: "var(--purple)",    bg: "var(--purple-subtle)" },
  entregue:  { label: "Entregue",   color: "var(--success)",  bg: "var(--success-subtle)" },
  cancelado: { label: "Cancelado",  color: "var(--error)",    bg: "var(--error-subtle)" },
};

const statusFlow: Record<string, { next: OrderStatus; label: string; icon: typeof CreditCard }> = {
  pendente:  { next: "pago",      label: "Confirmar pagamento", icon: CreditCard },
  pago:      { next: "producao",  label: "Iniciar produção",    icon: Factory },
  producao:  { next: "enviado",   label: "Marcar enviado",      icon: Truck },
  enviado:   { next: "entregue",  label: "Marcar entregue",     icon: CheckCircle2 },
};

const CATEGORIES: { key: ProductCategory | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "impressoes", label: "Impressões" },
  { key: "digital", label: "Digital" },
  { key: "albuns", label: "Álbuns" },
  { key: "molduras", label: "Molduras" },
  { key: "extras", label: "Extras" },
];

const categoryLabels: Record<ProductCategory, string> = {
  impressoes: "Impressões",
  digital: "Digital",
  albuns: "Álbuns",
  molduras: "Molduras",
  extras: "Extras",
};

const categoryColors: Record<ProductCategory, { color: string; bg: string }> = {
  impressoes: { color: "var(--info)", bg: "var(--info-subtle)" },
  digital: { color: "var(--success)", bg: "var(--success-subtle)" },
  albuns: { color: "var(--accent)", bg: "var(--accent-subtle)" },
  molduras: { color: "var(--purple)", bg: "var(--purple-subtle)" },
  extras: { color: "var(--warning)", bg: "var(--warning-subtle)" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

const rowStagger = {
  initial: { opacity: 0, y: 6 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springDefault, delay: i * 0.015 },
  }),
};

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export function PedidosClient({
  orders: initialOrders,
  products: initialProducts,
  galleries,
  studioId,
}: {
  orders: Order[];
  products: CatalogProduct[];
  galleries: GalleryRef[];
  studioId: string;
}) {
  const [activeTab, setActiveTab] = useState<MainTab>("pedidos");
  const [orders, setOrders] = useState(initialOrders);
  const [products, setProducts] = useState(initialProducts);

  // Global KPIs
  const totalPedidos = orders.length;
  const receitaTotal = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

  return (
    <PageTransition>
      {/* Unified Header Card */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Loja & Pedidos</h1>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                {totalPedidos} pedidos · {formatCurrency(receitaTotal)} receita total · Ticket médio {formatCurrency(ticketMedio)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {TAB_ITEMS.map((tab) => {
              const count = tab.key === "pedidos" ? orders.length : products.length;
              return (
                <ActionPill
                  key={tab.key}
                  label={tab.label}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  count={count}
                />
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "pedidos" && (
          <motion.div key="pedidos" {...springContentIn} className="flex flex-col gap-6">
            <TabPedidos
              orders={orders}
              setOrders={setOrders}
              products={products}
              studioId={studioId}
            />
          </motion.div>
        )}
        {activeTab === "catalogo" && (
          <motion.div key="catalogo" {...springContentIn} className="flex flex-col gap-6">
            <TabCatalogo
              products={products}
              setProducts={setProducts}
              galleries={galleries}
              studioId={studioId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

// ═══════════════════════════════════════════════
// TAB PEDIDOS
// ═══════════════════════════════════════════════

function TabPedidos({
  orders,
  setOrders,
  products,
  studioId,
}: {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: CatalogProduct[];
  studioId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "todos">("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingValue, setTrackingValue] = useState("");

  const pendentesValor = orders
    .filter((o) => o.status === "pendente")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const emProducao = orders.filter((o) => o.status === "producao").length;
  const catalogoAtivos = products.filter((p) => p.active).length;

  const filtered = orders.filter((o) => {
    const term = search.toLowerCase();
    const matchesSearch =
      o.clients?.name.toLowerCase().includes(term) ||
      o.galleries?.name.toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term) ||
      o.tracking_code?.toLowerCase().includes(term);
    const matchesStatus = filterStatus === "todos" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Status atualizado para ${statusConfig[newStatus].label}`);
      router.refresh();
    }
    setUpdatingId(null);
  }

  async function handleTrackingSave(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ tracking_code: trackingValue || null })
      .eq("id", orderId)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao salvar rastreio: " + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_code: trackingValue || null } : o))
      );
      toast.success("Código de rastreio salvo!");
    }
    setEditingTrackingId(null);
    setTrackingValue("");
  }

  return (
    <>
      {/* Stats + Search + Filters — Unified Panel */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[var(--border-subtle)]">
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{orders.length}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Total pedidos</p>
          </div>
          <div className="p-5">
            <p className="text-[18px] font-bold text-[var(--warning)] tracking-[-0.02em] leading-none tabular-nums">{formatCurrency(pendentesValor)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Pendentes</p>
          </div>
          <div className="p-5">
            <p className="text-[18px] font-bold text-[var(--success)] tracking-[-0.02em] leading-none tabular-nums">{formatCurrency(orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + Number(o.total), 0))}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Receita total</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{catalogoAtivos}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Catálogo ativos</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Buscar por cliente, galeria, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${INPUT_CLS} !pl-9`}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <ActionPill
              label="Todos"
              active={filterStatus === "todos"}
              onClick={() => setFilterStatus("todos")}
              count={statusCounts.todos}
            />
            {(["pendente", "pago", "producao", "enviado", "entregue"] as const).map((s) => (
              <ActionPill
                key={s}
                label={statusConfig[s].label}
                active={filterStatus === s}
                onClick={() => setFilterStatus(s)}
                count={statusCounts[s] || 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={Package}
            title={orders.length === 0 ? "Nenhum pedido ainda" : "Nenhum pedido encontrado"}
            description={orders.length === 0 ? "Pedidos são gerados quando clientes compram produtos na galeria. Configure seu catálogo primeiro." : "Tente ajustar os filtros de busca."}
          />
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Itens</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Galeria</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Data</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => {
                  const status = statusConfig[order.status];
                  const flow = statusFlow[order.status];
                  const itemCount = Array.isArray(order.items) ? order.items.length : 0;

                  return (
                    <motion.tr
                      key={order.id}
                      variants={rowStagger}
                      initial="initial"
                      animate="animate"
                      custom={idx}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-[var(--fg)]">
                          {order.clients?.name || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge label={status.label} color={status.color} bg={status.bg} />
                      </td>

                      <td className="px-4 py-3 text-[11px] text-[var(--fg-secondary)]">
                        {itemCount} {itemCount === 1 ? "item" : "itens"}
                      </td>

                      <td className="px-4 py-3 text-[11px]">
                        {order.galleries ? (
                          <Link
                            href={`/galeria/${order.galleries.id}`}
                            className="text-[var(--info)] hover:underline transition-colors"
                          >
                            {order.galleries.name}
                          </Link>
                        ) : "—"}
                      </td>

                      <td className="px-4 py-3 text-[var(--fg-muted)] text-[11px] whitespace-nowrap">
                        {format(new Date(order.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px] font-semibold text-[var(--fg)]">
                          {formatCurrency(Number(order.total))}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(order.status === "enviado" || order.status === "producao") && (
                            editingTrackingId === order.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={trackingValue}
                                  onChange={(e) => setTrackingValue(e.target.value)}
                                  placeholder="Código rastreio"
                                  className="h-7 w-32 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--info)]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTrackingSave(order.id);
                                    if (e.key === "Escape") {
                                      setEditingTrackingId(null);
                                      setTrackingValue("");
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleTrackingSave(order.id)}
                                  className={COMPACT_PRIMARY_CTA}
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingTrackingId(order.id);
                                  setTrackingValue(order.tracking_code || "");
                                }}
                                className="h-7 px-2 rounded-lg text-[11px] border border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--card-hover)] transition-colors whitespace-nowrap"
                                title={order.tracking_code || "Adicionar rastreio"}
                              >
                                <Truck size={12} className="inline mr-1" />
                                {order.tracking_code || "Rastreio"}
                              </button>
                            )
                          )}

                          {flow && (
                            <button
                              onClick={() => handleStatusChange(order.id, flow.next)}
                              disabled={updatingId === order.id}
                              className={`${COMPACT_PRIMARY_CTA} whitespace-nowrap`}
                            >
                              {updatingId === order.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <flow.icon size={12} />
                                  {flow.label}
                                  <ChevronRight size={10} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// TAB CATALOGO
// ═══════════════════════════════════════════════

function TabCatalogo({
  products,
  setProducts,
  galleries,
  studioId,
}: {
  products: CatalogProduct[];
  setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>>;
  galleries: GalleryRef[];
  studioId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<ProductCategory | "todos">("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const totalProdutos = products.length;
  const ativos = products.filter((p) => p.active).length;
  const inativos = products.filter((p) => !p.active).length;
  const categoriasUsadas = new Set(products.map((p) => p.category)).size;

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term);
    const matchesCategory = filterCategory === "todos" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  async function handleToggleActive(product: CatalogProduct) {
    setTogglingId(product.id);
    const { error } = await supabase
      .from("catalog_products")
      .update({ active: !product.active })
      .eq("id", product.id)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      );
      toast.success(product.active ? "Produto desativado" : "Produto ativado");
    }
    setTogglingId(null);
  }

  async function handleDelete(productId: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase
      .from("catalog_products")
      .delete()
      .eq("id", productId)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Produto excluído");
      router.refresh();
    }
  }

  function handleEdit(product: CatalogProduct) {
    setEditingProduct(product);
    setShowModal(true);
  }

  function handleSaved(product: CatalogProduct, isNew: boolean) {
    if (isNew) {
      setProducts((prev) => [product, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    }
    setShowModal(false);
    setEditingProduct(null);
    router.refresh();
  }

  function getPriceRange(product: CatalogProduct): string {
    const sizes = product.sizes as ProductSize[];
    if (!sizes || sizes.length === 0) return formatCurrency(Number(product.base_price));
    const prices = sizes.map((s) => Number(s.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  }

  return (
    <>
      {/* Stats + Search + Filters — Unified Panel */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[var(--border-subtle)]">
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{totalProdutos}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Total produtos</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">{ativos}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Ativos</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg-muted)] tracking-[-0.026em] leading-none tabular-nums">{inativos}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Inativos</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{categoriasUsadas}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Categorias</p>
          </div>
        </div>

        {/* Search + View Toggle + New Product */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-9`}
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--card)] shadow-sm text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--card)] shadow-sm text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}
              >
                <List size={14} />
              </button>
            </div>
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className={PRIMARY_CTA}
            >
              <Plus size={16} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <ActionPill
                key={cat.key}
                label={cat.label}
                active={filterCategory === cat.key}
                onClick={() => setFilterCategory(cat.key)}
                count={categoryCounts[cat.key] || 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Product grid/list */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <WidgetEmptyState
            icon={ShoppingBag}
            title={products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
            description={products.length === 0 ? "Crie seu primeiro produto para começar a vender pela galeria." : "Tente ajustar os filtros."}
            action={products.length === 0 ? (
              <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className={PRIMARY_CTA}>
                <Plus size={16} />
                Novo Produto
              </button>
            ) : undefined}
          />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onEdit={() => handleEdit(product)}
              onToggle={() => handleToggleActive(product)}
              onDelete={() => handleDelete(product.id)}
              toggling={togglingId === product.id}
              getPriceRange={getPriceRange}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Categoria</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Variantes</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Preço</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => {
                  const sizes = product.sizes as ProductSize[];
                  const cat = categoryColors[product.category];
                  return (
                    <motion.tr
                      key={product.id}
                      variants={rowStagger}
                      initial="initial"
                      animate="animate"
                      custom={idx}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                              <ImageIcon size={16} className="text-[var(--fg-muted)]" />
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-medium text-[var(--fg)]">{product.name}</p>
                            {product.description && (
                              <p className="text-[11px] text-[var(--fg-muted)] line-clamp-1">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={categoryLabels[product.category]} color={cat.color} bg={cat.bg} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--fg-secondary)]">
                        {sizes.length} {sizes.length === 1 ? "tamanho" : "tamanhos"}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-[var(--fg)]">
                        {getPriceRange(product)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={product.active ? "Ativo" : "Inativo"}
                          color={product.active ? "var(--success)" : "var(--fg-muted)"}
                          bg={product.active ? "var(--success-subtle)" : "var(--bg-elevated)"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(product)} className={GHOST_BTN} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(product)}
                            disabled={togglingId === product.id}
                            className={GHOST_BTN}
                            title={product.active ? "Desativar" : "Ativar"}
                          >
                            {product.active ? <ToggleRight size={14} className="text-[var(--success)]" /> : <ToggleLeft size={14} />}
                          </button>
                          <button onClick={() => handleDelete(product.id)} className={`${GHOST_BTN} hover:!text-[var(--error)]`} title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          galleries={galleries}
          studioId={studioId}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// PRODUCT CARD (Grid view)
// ═══════════════════════════════════════════════

function ProductCard({
  product,
  index,
  onEdit,
  onToggle,
  onDelete,
  toggling,
  getPriceRange,
}: {
  product: CatalogProduct;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  getPriceRange: (p: CatalogProduct) => string;
}) {
  const sizes = product.sizes as ProductSize[];
  const cat = categoryColors[product.category];

  return (
    <motion.div
      variants={rowStagger}
      initial="initial"
      animate="animate"
      custom={index}
    >
      <div className="rounded-2xl bg-[var(--card)] overflow-hidden flex flex-col h-full p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Image */}
        <div className="relative -mx-4 -mt-4 mb-3 h-40 rounded-t-2xl overflow-hidden bg-[var(--bg-elevated)]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={32} className="text-[var(--fg-muted)]" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <StatusBadge label={categoryLabels[product.category]} color={cat.color} bg={cat.bg} />
          </div>
          {/* Active/inactive badge */}
          {!product.active && (
            <div className="absolute top-3 right-3">
              <StatusBadge label="Inativo" color="var(--fg-muted)" bg="var(--border-subtle)" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="text-[14px] font-semibold text-[var(--fg)] line-clamp-1">{product.name}</h3>
          {product.description && (
            <p className="text-[11px] text-[var(--fg-muted)] line-clamp-2">{product.description}</p>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {sizes.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[10px] text-[var(--fg-secondary)]"
                >
                  {s.size} · {formatCurrency(Number(s.price))}
                </span>
              ))}
              {sizes.length > 4 && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[10px] text-[var(--fg-muted)]">
                  +{sizes.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price range */}
          <p className="text-[15px] font-semibold text-[var(--fg)] mt-auto pt-2">
            {getPriceRange(product)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 mt-3 border-t border-[var(--border)]">
          <button onClick={onEdit} className={`${COMPACT_SECONDARY_CTA} flex-1`}>
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={onToggle}
            disabled={toggling}
            className={`${GHOST_BTN} !p-1.5`}
            title={product.active ? "Desativar" : "Ativar"}
          >
            {product.active ? <ToggleRight size={16} className="text-[var(--success)]" /> : <ToggleLeft size={16} />}
          </button>
          <button onClick={onDelete} className={`${GHOST_BTN} !p-1.5 hover:!text-[var(--error)]`} title="Excluir">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// PRODUCT MODAL (3 steps: Detalhes → Preços → Galerias)
// ═══════════════════════════════════════════════

function ProductModal({
  product,
  galleries,
  studioId,
  onClose,
  onSaved,
}: {
  product: CatalogProduct | null;
  galleries: GalleryRef[];
  studioId: string;
  onClose: () => void;
  onSaved: (product: CatalogProduct, isNew: boolean) => void;
}) {
  const supabase = createClient();
  const isNew = !product;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Details
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState<ProductCategory>(product?.category || "impressoes");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [active, setActive] = useState(product?.active ?? true);

  // Step 2 — Sizes/Prices
  const [sizes, setSizes] = useState<ProductSize[]>(
    (product?.sizes as ProductSize[] | undefined)?.length
      ? (product!.sizes as ProductSize[])
      : [{ size: "", price: 0 }]
  );

  // Step 3 — Gallery availability (future: gallery_product_links table)
  const [availability, setAvailability] = useState<"all" | "selected">("all");
  const [selectedGalleries, setSelectedGalleries] = useState<string[]>([]);

  function addSize() {
    setSizes((prev) => [...prev, { size: "", price: 0 }]);
  }

  function removeSize(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSize(index: number, field: "size" | "price", value: string | number) {
    setSizes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  const basePrice = sizes.length > 0 ? Math.min(...sizes.map((s) => Number(s.price) || 0)) : 0;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    const validSizes = sizes.filter((s) => s.size.trim() && Number(s.price) > 0);
    if (validSizes.length === 0) {
      toast.error("Adicione pelo menos um tamanho com preço");
      return;
    }

    setSaving(true);

    const payload = {
      studio_id: studioId,
      name: name.trim(),
      description: description.trim() || null,
      category,
      base_price: basePrice,
      sizes: validSizes,
      image_url: imageUrl.trim() || null,
      active,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from("catalog_products")
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar produto: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Produto criado!");
      onSaved(data as CatalogProduct, true);
    } else {
      const { data, error } = await supabase
        .from("catalog_products")
        .update(payload)
        .eq("id", product!.id)
        .eq("studio_id", studioId)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao atualizar produto: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Produto atualizado!");
      onSaved(data as CatalogProduct, false);
    }
    setSaving(false);
  }

  const stepTitles = ["Detalhes", "Preços", "Galerias"];

  return (
    <AppleModal
      open
      onClose={onClose}
      title={isNew ? "Novo Produto" : "Editar Produto"}
      maxWidth="max-w-xl"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {stepTitles.map((title, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isPast = step > stepNum;
          return (
            <button
              key={i}
              onClick={() => setStep(stepNum)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
                ${isActive
                  ? "bg-[var(--bg-ink)] text-[var(--fg-light)]"
                  : isPast
                    ? "bg-[var(--success-subtle)] text-[var(--success)]"
                    : "bg-[var(--bg-elevated)] text-[var(--fg-muted)]"
                }
              `}
            >
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${isActive
                  ? "bg-[var(--fg-light)] text-[var(--bg-ink)]"
                  : isPast
                    ? "bg-[var(--success)] text-white"
                    : "bg-[var(--border)] text-[var(--fg-muted)]"
                }
              `}>
                {isPast ? "✓" : stepNum}
              </span>
              {title}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...springContentIn} className="flex flex-col gap-4">
            <div>
              <label className={LABEL_CLS}>Nome do produto *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Impressão Fine Art"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do produto..."
                rows={3}
                className={`${INPUT_CLS} !h-auto py-2.5 resize-none`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className={SELECT_CLS + " w-full"}
                >
                  {CATEGORIES.filter((c) => c.key !== "todos").map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Imagem (URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]">
              <span className="text-[13px] text-[var(--fg)]">Produto ativo</span>
              <button
                onClick={() => setActive(!active)}
                className="transition-colors"
              >
                {active ? (
                  <ToggleRight size={24} className="text-[var(--success)]" />
                ) : (
                  <ToggleLeft size={24} className="text-[var(--fg-muted)]" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" {...springContentIn} className="flex flex-col gap-4">
            <SectionHeader
              title="Tamanhos e Preços"
              action={
                <button onClick={addSize} className={COMPACT_SECONDARY_CTA}>
                  <Plus size={12} />
                  Adicionar tamanho
                </button>
              }
            />
            <div className="flex flex-col gap-2">
              {sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={s.size}
                    onChange={(e) => updateSize(i, "size", e.target.value)}
                    placeholder="Tamanho (ex: 20x30)"
                    className={`${INPUT_CLS} flex-1`}
                  />
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] text-sm">R$</span>
                    <input
                      type="number"
                      value={s.price || ""}
                      onChange={(e) => updateSize(i, "price", Number(e.target.value))}
                      placeholder="0"
                      className={`${INPUT_CLS} !pl-9`}
                    />
                  </div>
                  {sizes.length > 1 && (
                    <button
                      onClick={() => removeSize(i)}
                      className={`${GHOST_BTN} hover:!text-[var(--error)]`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sizes.filter((s) => s.size.trim() && Number(s.price) > 0).length > 0 && (
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-[12px] text-[var(--fg-secondary)]">
                Preço base (menor): <strong className="text-[var(--fg)]">{formatCurrency(basePrice)}</strong>
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...springContentIn} className="flex flex-col gap-4">
            <SectionHeader title="Disponibilidade nas Galerias" />
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "all"}
                  onChange={() => setAvailability("all")}
                  className="accent-[var(--info)]"
                />
                <div>
                  <p className="text-[13px] font-medium text-[var(--fg)]">Todas as galerias</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">Disponível em todas as galerias automaticamente</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "selected"}
                  onChange={() => setAvailability("selected")}
                  className="accent-[var(--info)]"
                />
                <div>
                  <p className="text-[13px] font-medium text-[var(--fg)]">Galerias específicas</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">Escolha em quais galerias este produto estará disponível</p>
                </div>
              </label>

              {availability === "selected" && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pl-1">
                  {galleries.length === 0 ? (
                    <p className="text-[12px] text-[var(--fg-muted)] py-2">Nenhuma galeria encontrada</p>
                  ) : (
                    galleries.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGalleries.includes(g.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGalleries((prev) => [...prev, g.id]);
                            } else {
                              setSelectedGalleries((prev) => prev.filter((id) => id !== g.id));
                            }
                          }}
                          className="accent-[var(--info)]"
                        />
                        <span className="text-[13px] text-[var(--fg)]">{g.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-[var(--fg-muted)]">
              A vinculação com galerias será ativada em breve. Por enquanto, o produto fica disponível em todas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
        <div>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className={SECONDARY_CTA}
            >
              Voltar
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className={SECONDARY_CTA}>
            Cancelar
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className={PRIMARY_CTA}
            >
              Próximo
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className={PRIMARY_CTA}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  {isNew ? "Criar Produto" : "Salvar Alterações"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </AppleModal>
  );
}
