/**
 * CatalogManager — Full CRUD catalog management for ESSYN photographers.
 *
 * Features:
 * - Grid/List view with category filter and search
 * - Add/Edit modal with 3 tabs: Detalhes / Precos / Galerias
 * - Per-size pricing table
 * - Product image URL with live preview
 * - Gallery linkage (select which galleries show each product)
 * - Toggle active/inactive, delete with confirmation
 *
 * Apple Premium design, zero transparency, useDk() tokens.
 */
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Package, Search, Edit3, Trash2, X,
  ToggleLeft, ToggleRight, ChevronRight,
  Image as ImageIcon, Tag, Ruler, DollarSign,
  Grid3X3, List, AlertCircle, Link2,
  Check, Layers, ImagePlus, Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { springDefault } from "../../lib/motion-tokens";
import { WidgetCard } from "../ui/apple-kit";
import { useAppStore, type CatalogProduct } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

const spring = springDefault;

/* ── Category config ── */
const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "Impressoes", label: "Impressoes" },
  { id: "Digital", label: "Digital" },
  { id: "Albums", label: "Albums" },
  { id: "Molduras", label: "Molduras" },
  { id: "Extras", label: "Extras" },
] as const;

const CATEGORY_OPTIONS = ["Impressoes", "Digital", "Albums", "Molduras", "Extras"] as const;

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                     */
/* ═══════════════════════════════════════════════════ */

export function CatalogManager() {
  const dk = useDk();
  const { catalog, toggleCatalogProduct, deleteCatalogProduct } = useAppStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const normalizeCategory = (cat: string) =>
    cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "");

  const filtered = useMemo(() => {
    let result = [...catalog];
    if (categoryFilter !== "all") {
      result = result.filter((p) => normalizeCategory(p.category) === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [catalog, categoryFilter, search]);

  const stats = useMemo(() => ({
    total: catalog.length,
    active: catalog.filter((p) => p.enabled).length,
    inactive: catalog.filter((p) => !p.enabled).length,
    categories: [...new Set(catalog.map((p) => p.category))].length,
  }), [catalog]);

  const handleDelete = (id: string) => {
    deleteCatalogProduct(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stats strip ── */}
      <WidgetCard delay={0.02}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: "Total Produtos", value: stats.total.toString(), icon: <Package className="w-4 h-4" />, color: "#007AFF", bg: dk.isDark ? "#1A2030" : "#F2F2F7" },
            { label: "Ativos", value: stats.active.toString(), icon: <ToggleRight className="w-4 h-4" />, color: "#34C759", bg: dk.isDark ? "#1A2C1E" : "#E8EFE5" },
            { label: "Inativos", value: stats.inactive.toString(), icon: <ToggleLeft className="w-4 h-4" />, color: "#FF9500", bg: dk.isDark ? "#2C2410" : "#FFF0DC" },
            { label: "Categorias", value: stats.categories.toString(), icon: <Tag className="w-4 h-4" />, color: "#5856D6", bg: dk.isDark ? "#1E1A30" : "#F0F0FF" },
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

      {/* ── Toolbar ── */}
      <WidgetCard delay={0.04}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer"
                style={{
                  fontWeight: 500,
                  backgroundColor: categoryFilter === cat.id
                    ? (dk.isDark ? "#F5F5F7" : "#1D1D1F")
                    : "transparent",
                  color: categoryFilter === cat.id
                    ? (dk.isDark ? "#1D1D1F" : "#FFFFFF")
                    : dk.textMuted,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all max-w-[200px]"
              style={{ borderColor: dk.border, backgroundColor: dk.bg }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="flex-1 text-[12px] bg-transparent outline-none"
                style={{ fontWeight: 400, color: dk.textPrimary }}
              />
            </div>

            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: dk.border }}>
              <button
                onClick={() => setViewMode("grid")}
                className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: viewMode === "grid" ? (dk.isDark ? "#2C2C2E" : "#F2F2F7") : "transparent",
                  color: viewMode === "grid" ? "#007AFF" : dk.textMuted,
                }}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: viewMode === "list" ? (dk.isDark ? "#2C2C2E" : "#F2F2F7") : "transparent",
                  color: viewMode === "list" ? "#007AFF" : dk.textMuted,
                }}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] text-white transition-colors cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: "#007AFF" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Produto
            </button>
          </div>
        </div>
      </WidgetCard>

      {/* ── Products ── */}
      <WidgetCard title="Produtos" count={filtered.length} delay={0.06}>
        {filtered.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((prod, idx) => (
                  <motion.div
                    key={prod.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ ...spring, delay: idx * 0.02 }}
                  >
                    <ProductCard
                      product={prod}
                      onEdit={() => setEditProduct(prod)}
                      onToggle={() => toggleCatalogProduct(prod.id)}
                      onDelete={() => setDeleteConfirm(prod.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {filtered.map((prod, idx) => (
                  <motion.div
                    key={prod.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ ...spring, delay: idx * 0.02 }}
                  >
                    {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                    <ProductRow
                      product={prod}
                      onEdit={() => setEditProduct(prod)}
                      onToggle={() => toggleCatalogProduct(prod.id)}
                      onDelete={() => setDeleteConfirm(prod.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
              <Package className="w-6 h-6" style={{ color: dk.textDisabled }} />
            </div>
            <p className="text-[13px]" style={{ fontWeight: 400, color: dk.textMuted }}>
              Nenhum produto encontrado
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] text-white transition-colors cursor-pointer mt-2"
              style={{ fontWeight: 500, backgroundColor: "#007AFF" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Criar primeiro produto
            </button>
          </div>
        )}
      </WidgetCard>

      {/* ── Modals ── */}
      <AnimatePresence>
        {(showAddModal || editProduct) && (
          <ProductFormModal
            product={editProduct}
            onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            productName={catalog.find((p) => p.id === deleteConfirm)?.name || ""}
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PRODUCT CARD (Grid view)                           */
/* ═══════════════════════════════════════════════════ */

function ProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: CatalogProduct;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const dk = useDk();
  const { galleries } = useAppStore();

  const priceRange = useMemo(() => {
    if (product.sizesPricing && product.sizesPricing.length > 0) {
      const prices = product.sizesPricing.map((s) => s.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? fmtCurrency(min) : `${fmtCurrency(min)} – ${fmtCurrency(max)}`;
    }
    return fmtCurrency(product.price);
  }, [product]);

  const linkedGalleries = useMemo(() => {
    if (!product.galleryIds || product.galleryIds.length === 0) return galleries.length;
    return product.galleryIds.length;
  }, [product.galleryIds, galleries]);

  const isAllGalleries = !product.galleryIds || product.galleryIds.length === 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all group cursor-pointer"
      style={{
        backgroundColor: dk.bg,
        borderColor: product.enabled ? dk.border : (dk.isDark ? "#2C2C2E" : "#E5E5EA"),
        opacity: product.enabled ? 1 : 0.6,
      }}
      onClick={onEdit}
    >
      {/* Image */}
      <div
        className="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: dk.bgMuted }}
      >
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10" style={{ color: dk.textDisabled }} />
        )}

        {/* Badges overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <div
            className="px-2 py-0.5 rounded-md text-[9px]"
            style={{
              fontWeight: 600,
              backgroundColor: product.enabled ? (dk.isDark ? "#1A2C1E" : "#E8EFE5") : (dk.isDark ? "#2C2410" : "#FFF0DC"),
              color: product.enabled ? "#34C759" : "#FF9500",
            }}
          >
            {product.enabled ? "Ativo" : "Inativo"}
          </div>
        </div>

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
          <div
            className="px-2 py-0.5 rounded-md text-[9px]"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#2C2C2E" : "#F5F5F7", color: dk.textSecondary }}
          >
            {product.category}
          </div>
        </div>

        {/* Gallery count badge */}
        <div className="absolute bottom-2.5 right-2.5">
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]"
            style={{
              fontWeight: 500,
              backgroundColor: dk.isDark ? "#2C2C2E" : "#F5F5F7",
              color: isAllGalleries ? "#007AFF" : dk.textSecondary,
            }}
          >
            <Globe className="w-2.5 h-2.5" />
            {isAllGalleries ? "Todas" : `${linkedGalleries} galeria${linkedGalleries !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5">
        <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
          {product.name}
        </span>
        <span className="text-[11px] line-clamp-2" style={{ fontWeight: 400, color: dk.textMuted, lineHeight: "1.4" }}>
          {product.desc}
        </span>

        {/* Price range */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[14px] tabular-nums" style={{ fontWeight: 600, color: "#007AFF" }}>
            {priceRange}
          </span>
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
            {product.sizesPricing && product.sizesPricing.length > 1 ? `${product.sizes.length} tamanhos` : "preco base"}
          </span>
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {product.sizes.map((s) => {
            const sp = product.sizesPricing?.find((p) => p.size === s);
            return (
              <span
                key={s}
                className="px-1.5 py-0.5 rounded-md text-[9px]"
                style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}
                title={sp ? fmtCurrency(sp.price) : undefined}
              >
                {s}{sp ? ` · ${fmtCurrency(sp.price)}` : ""}
              </span>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: dk.hairline }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textSecondary }}
          >
            <Edit3 className="w-3 h-3" />
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
            style={{
              fontWeight: 500,
              backgroundColor: product.enabled ? (dk.isDark ? "#2C2410" : "#FFF0DC") : (dk.isDark ? "#1A2C1E" : "#E8EFE5"),
              color: product.enabled ? "#FF9500" : "#34C759",
            }}
          >
            {product.enabled ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#2C1A1A" : "#FBF5F4", color: "#FF3B30" }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PRODUCT ROW (List view)                            */
/* ═══════════════════════════════════════════════════ */

function ProductRow({
  product,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: CatalogProduct;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const dk = useDk();

  const priceLabel = useMemo(() => {
    if (product.sizesPricing && product.sizesPricing.length > 0) {
      const prices = product.sizesPricing.map((s) => s.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? fmtCurrency(min) : `${fmtCurrency(min)} – ${fmtCurrency(max)}`;
    }
    return fmtCurrency(product.price);
  }, [product]);

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer group"
      style={{ opacity: product.enabled ? 1 : 0.6 }}
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: dk.bgMuted }}
      >
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-5 h-5" style={{ color: dk.textDisabled }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
            {product.name}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0"
            style={{
              fontWeight: 600,
              backgroundColor: product.enabled ? (dk.isDark ? "#1A2C1E" : "#E8EFE5") : (dk.isDark ? "#2C2410" : "#FFF0DC"),
              color: product.enabled ? "#34C759" : "#FF9500",
            }}
          >
            {product.enabled ? "Ativo" : "Inativo"}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0"
            style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}
          >
            {product.category}
          </span>
        </div>
        <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
          {product.desc} · {product.sizes.length} tamanho{product.sizes.length !== 1 ? "s" : ""}
          {(!product.galleryIds || product.galleryIds.length === 0) ? " · Todas as galerias" : ` · ${product.galleryIds.length} galeria${product.galleryIds.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Price */}
      <span className="text-[14px] tabular-nums shrink-0" style={{ fontWeight: 600, color: "#007AFF" }}>
        {priceLabel}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{ color: product.enabled ? "#FF9500" : "#34C759", backgroundColor: dk.bgMuted }}
        >
          {product.enabled ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{ color: dk.textSecondary, backgroundColor: dk.bgMuted }}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{ color: "#FF3B30", backgroundColor: dk.isDark ? "#2C1A1A" : "#FBF5F4" }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PRODUCT FORM MODAL (Add / Edit) — 3 Tabs           */
/* ═══════════════════════════════════════════════════ */

type ModalTab = "detalhes" | "precos" | "galerias";

interface SizePriceRow {
  size: string;
  price: string;
}

function ProductFormModal({
  product,
  onClose,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
}) {
  const dk = useDk();
  const { addCatalogProduct, updateCatalogProduct, galleries } = useAppStore();
  const isEdit = !!product;

  const [tab, setTab] = useState<ModalTab>("detalhes");

  /* ── Tab 1: Detalhes ── */
  const [name, setName] = useState(product?.name || "");
  const [desc, setDesc] = useState(product?.desc || "");
  const [category, setCategory] = useState(product?.category || "Impressoes");
  const [enabled, setEnabled] = useState(product?.enabled ?? true);
  const [imageUrl, setImageUrl] = useState(product?.image || "");
  const [imageError, setImageError] = useState(false);

  /* ── Tab 2: Precos ── */
  const initialRows: SizePriceRow[] = product?.sizesPricing && product.sizesPricing.length > 0
    ? product.sizesPricing.map((sp) => ({ size: sp.size, price: sp.price.toString() }))
    : product?.sizes?.length
      ? product.sizes.map((s) => ({ size: s, price: product.price.toString() }))
      : [{ size: "", price: "" }];

  const [sizeRows, setSizeRows] = useState<SizePriceRow[]>(initialRows);
  const [basePrice, setBasePrice] = useState(product?.price?.toString() || "");

  /* ── Tab 3: Galerias ── */
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>(
    product?.galleryIds && product.galleryIds.length > 0 ? [...product.galleryIds] : []
  );
  const [allGalleries, setAllGalleries] = useState(
    !product?.galleryIds || product.galleryIds.length === 0
  );

  const canSave = name.trim() && desc.trim() && sizeRows.some((r) => r.size.trim() && Number(r.price) > 0);

  /* ── Size row helpers ── */
  const addSizeRow = () => setSizeRows((prev) => [...prev, { size: "", price: "" }]);
  const removeSizeRow = (idx: number) => setSizeRows((prev) => prev.filter((_, i) => i !== idx));
  const updateSizeRow = (idx: number, field: "size" | "price", value: string) => {
    setSizeRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  /* ── Gallery toggle helpers ── */
  const toggleGallery = (id: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
    if (allGalleries) setAllGalleries(false);
  };

  const toggleAllGalleries = () => {
    setAllGalleries(!allGalleries);
    if (!allGalleries) setSelectedGalleryIds([]);
  };

  const handleSave = () => {
    if (!canSave) return;

    const validRows = sizeRows.filter((r) => r.size.trim() && Number(r.price) > 0);
    const sizes = validRows.map((r) => r.size.trim());
    const sizesPricing = validRows.map((r) => ({ size: r.size.trim(), price: Number(r.price) }));
    const minPrice = Math.min(...sizesPricing.map((s) => s.price));

    const data: Omit<CatalogProduct, "id"> = {
      name: name.trim(),
      desc: desc.trim(),
      category,
      price: basePrice ? Number(basePrice) : minPrice,
      sizes,
      enabled,
      sizesPricing,
      image: imageUrl.trim() || undefined,
      galleryIds: allGalleries ? [] : selectedGalleryIds,
    };

    if (isEdit && product) {
      updateCatalogProduct(product.id, data);
    } else {
      addCatalogProduct(data);
    }
    onClose();
  };

  const inputStyle = {
    backgroundColor: dk.bg,
    borderColor: dk.border,
    color: dk.textPrimary,
  };

  const modalTabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: "detalhes", label: "Detalhes", icon: <Package className="w-3.5 h-3.5" /> },
    { id: "precos", label: "Precos", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "galerias", label: "Galerias", icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return createPortal(
    <>
      <motion.div
        key="catalog-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[9998]"
        style={{ backgroundColor: dk.isDark ? "#000000" : "#1D1D1F" }}
        onClick={onClose}
      />
      <motion.div
        key="catalog-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={spring}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className="rounded-2xl border w-full max-w-[560px] overflow-hidden"
          style={{ backgroundColor: dk.bg, borderColor: dk.hairline, boxShadow: dk.shadowModal }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: dk.hairline }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: dk.isDark ? "#1A2030" : "#F2F2F7", color: "#007AFF" }}
              >
                {isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
                  {isEdit ? "Editar Produto" : "Novo Produto"}
                </h3>
                <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                  {isEdit ? "Atualize as informacoes do produto" : "Configure seu produto em 3 passos"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              style={{ backgroundColor: dk.bgMuted, color: dk.textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-5 py-2.5 border-b" style={{ borderColor: dk.hairline }}>
            {modalTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer"
                style={{
                  fontWeight: tab === t.id ? 600 : 500,
                  backgroundColor: tab === t.id
                    ? (dk.isDark ? "#2C2C2E" : "#F2F2F7")
                    : "transparent",
                  color: tab === t.id ? "#007AFF" : dk.textMuted,
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 py-4 flex flex-col gap-4 max-h-[55vh] overflow-y-auto">

            {/* ── TAB: DETALHES ── */}
            {tab === "detalhes" && (
              <>
                {/* Image preview + URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] flex items-center gap-1.5" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    <ImagePlus className="w-3 h-3" />
                    IMAGEM DO PRODUTO
                  </label>
                  <div className="flex gap-3">
                    {/* Preview */}
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border"
                      style={{ borderColor: dk.border, backgroundColor: dk.bgMuted }}
                    >
                      {imageUrl && !imageError ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6" style={{ color: dk.textDisabled }} />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
                        placeholder="Cole a URL da imagem aqui..."
                        className="w-full px-3 py-2 rounded-xl border text-[12px] bg-transparent focus:outline-none transition-colors"
                        style={{ ...inputStyle, fontWeight: 400 }}
                      />
                      <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                        Use uma URL de imagem publica (Unsplash, etc.)
                      </span>
                      {imageError && (
                        <span className="text-[10px]" style={{ fontWeight: 500, color: "#FF3B30" }}>
                          Nao foi possivel carregar a imagem
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] flex items-center gap-1.5" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    <Package className="w-3 h-3" />
                    NOME DO PRODUTO
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Impressao Fine Art"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-transparent focus:outline-none transition-colors"
                    style={{ ...inputStyle, fontWeight: 500 }}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] flex items-center gap-1.5" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    <Edit3 className="w-3 h-3" />
                    DESCRICAO
                  </label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Descreva o produto para seus clientes..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-transparent resize-none focus:outline-none transition-colors"
                    style={{ ...inputStyle, fontWeight: 400, lineHeight: "1.5" }}
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] flex items-center gap-1.5" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    <Tag className="w-3 h-3" />
                    CATEGORIA
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] focus:outline-none transition-colors cursor-pointer"
                    style={{ ...inputStyle, fontWeight: 500 }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Enabled toggle */}
                <div
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl border"
                  style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}
                >
                  <div className="flex flex-col">
                    <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                      Produto ativo
                    </span>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      {enabled ? "Visivel para clientes nas galerias" : "Oculto — nao aparece nas galerias"}
                    </span>
                  </div>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className="cursor-pointer"
                    style={{ color: enabled ? "#34C759" : dk.textDisabled }}
                  >
                    {enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>
              </>
            )}

            {/* ── TAB: PRECOS ── */}
            {tab === "precos" && (
              <>
                {/* Info banner */}
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border"
                  style={{ borderColor: dk.infoBorder, backgroundColor: dk.infoBg }}
                >
                  <DollarSign className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#007AFF" }} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                      Tabela de precos por tamanho
                    </span>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted, lineHeight: "1.4" }}>
                      Defina um preco para cada tamanho/variante. O preco base sera automaticamente o menor valor.
                    </span>
                  </div>
                </div>

                {/* Size-price table */}
                <div className="flex flex-col gap-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 pb-2">
                    <span className="flex-1 text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                      TAMANHO / VARIANTE
                    </span>
                    <span className="w-28 text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                      PRECO (R$)
                    </span>
                    <span className="w-7" />
                  </div>

                  {/* Rows */}
                  {sizeRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        value={row.size}
                        onChange={(e) => updateSizeRow(idx, "size", e.target.value)}
                        placeholder="Ex: 30x40"
                        className="flex-1 px-3 py-2 rounded-xl border text-[12px] bg-transparent focus:outline-none transition-colors"
                        style={{ ...inputStyle, fontWeight: 500 }}
                      />
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => updateSizeRow(idx, "price", e.target.value)}
                        placeholder="180"
                        min={0}
                        className="w-28 px-3 py-2 rounded-xl border text-[12px] bg-transparent focus:outline-none transition-colors tabular-nums"
                        style={{ ...inputStyle, fontWeight: 600 }}
                      />
                      <button
                        onClick={() => removeSizeRow(idx)}
                        disabled={sizeRows.length <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        style={{
                          color: sizeRows.length <= 1 ? dk.textDisabled : "#FF3B30",
                          backgroundColor: sizeRows.length <= 1 ? "transparent" : (dk.isDark ? "#2C1A1A" : "#FBF5F4"),
                          cursor: sizeRows.length <= 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add row */}
                  <button
                    onClick={addSizeRow}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed text-[11px] transition-colors cursor-pointer mt-1"
                    style={{ fontWeight: 500, borderColor: dk.border, color: dk.textMuted }}
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar tamanho
                  </button>
                </div>

                {/* Price summary */}
                {sizeRows.filter((r) => r.size.trim() && Number(r.price) > 0).length > 0 && (
                  <div
                    className="flex items-center justify-between px-3.5 py-3 rounded-xl border"
                    style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}
                  >
                    <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                      Faixa de preco
                    </span>
                    <span className="text-[14px] tabular-nums" style={{ fontWeight: 600, color: "#007AFF" }}>
                      {(() => {
                        const valid = sizeRows.filter((r) => r.size.trim() && Number(r.price) > 0);
                        const prices = valid.map((r) => Number(r.price));
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? fmtCurrency(min) : `${fmtCurrency(min)} – ${fmtCurrency(max)}`;
                      })()}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ── TAB: GALERIAS ── */}
            {tab === "galerias" && (
              <>
                {/* Info banner */}
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border"
                  style={{ borderColor: dk.infoBorder, backgroundColor: dk.infoBg }}
                >
                  <Link2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#007AFF" }} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                      Disponibilidade por galeria
                    </span>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted, lineHeight: "1.4" }}>
                      Escolha em quais galerias este produto fica disponivel para compra. "Todas as galerias" inclui futuras galerias automaticamente.
                    </span>
                  </div>
                </div>

                {/* All galleries toggle */}
                <button
                  onClick={toggleAllGalleries}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors cursor-pointer"
                  style={{
                    borderColor: allGalleries ? "#007AFF" : dk.border,
                    backgroundColor: allGalleries ? (dk.isDark ? "#1A2030" : "#F4F7FB") : dk.bg,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4" style={{ color: allGalleries ? "#007AFF" : dk.textMuted }} />
                    <div className="flex flex-col text-left">
                      <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                        Todas as galerias
                      </span>
                      <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                        Disponivel em todas as galerias atuais e futuras
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: allGalleries ? "#007AFF" : "transparent",
                      borderWidth: allGalleries ? 0 : 2,
                      borderColor: dk.border,
                      borderStyle: "solid",
                    }}
                  >
                    {allGalleries && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>

                {/* Individual galleries */}
                {!allGalleries && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                      SELECIONE AS GALERIAS
                    </span>

                    {galleries.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {galleries.map((g) => {
                          const isSelected = selectedGalleryIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              onClick={() => toggleGallery(g.id)}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer"
                              style={{
                                borderColor: isSelected ? "#007AFF" : dk.border,
                                backgroundColor: isSelected ? (dk.isDark ? "#1A2030" : "#F4F7FB") : dk.bg,
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <Layers className="w-3.5 h-3.5" style={{ color: isSelected ? "#007AFF" : dk.textMuted }} />
                                <div className="flex flex-col text-left">
                                  <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                                    {g.nome}
                                  </span>
                                  <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                                    {g.cliente} · {g.photoCount} fotos · {g.status}
                                  </span>
                                </div>
                              </div>
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isSelected ? "#007AFF" : "transparent",
                                  borderWidth: isSelected ? 0 : 2,
                                  borderColor: dk.border,
                                  borderStyle: "solid",
                                }}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <Layers className="w-6 h-6" style={{ color: dk.textDisabled }} />
                        <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                          Nenhuma galeria criada ainda
                        </span>
                      </div>
                    )}

                    {selectedGalleryIds.length === 0 && galleries.length > 0 && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: dk.isDark ? "#2C2410" : "#FFF0DC" }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF9500" }} />
                        <span className="text-[11px]" style={{ fontWeight: 500, color: "#FF9500" }}>
                          Selecione ao menos uma galeria ou ative "Todas as galerias"
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: dk.hairline }}>
            {/* Tab navigation dots */}
            <div className="flex items-center gap-1.5">
              {modalTabs.map((t) => (
                <div
                  key={t.id}
                  className="w-1.5 h-1.5 rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: tab === t.id ? "#007AFF" : dk.textDisabled }}
                  onClick={() => setTab(t.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
                style={{ fontWeight: 500, borderColor: dk.border, color: dk.textSecondary, backgroundColor: dk.bg }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] text-white transition-colors"
                style={{
                  fontWeight: 500,
                  backgroundColor: canSave ? "#007AFF" : (dk.isDark ? "#2C2C2E" : "#D1D1D6"),
                  cursor: canSave ? "pointer" : "not-allowed",
                }}
              >
                {isEdit ? "Salvar Alteracoes" : "Criar Produto"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DELETE CONFIRM MODAL                               */
/* ═══════════════════════════════════════════════════ */

function DeleteConfirmModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dk = useDk();

  return createPortal(
    <>
      <motion.div
        key="delete-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[10000]"
        style={{ backgroundColor: dk.isDark ? "#000000" : "#1D1D1F" }}
        onClick={onCancel}
      />
      <motion.div
        key="delete-modal"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={spring}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      >
        <div
          className="rounded-2xl border w-full max-w-[340px] overflow-hidden"
          style={{ backgroundColor: dk.bg, borderColor: dk.hairline, boxShadow: dk.shadowModal }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center p-6 gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: dk.isDark ? "#2C1A1A" : "#FBF5F4", color: "#FF3B30" }}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.textPrimary }}>
              Remover produto?
            </h3>
            <p className="text-[12px]" style={{ fontWeight: 400, color: dk.textMuted, lineHeight: "1.5" }}>
              <strong style={{ fontWeight: 500, color: dk.textSecondary }}>{productName}</strong> sera removido permanentemente do catalogo.
              Pedidos existentes nao serao afetados.
            </p>
          </div>
          <div className="flex items-center gap-2 px-5 py-4 border-t" style={{ borderColor: dk.hairline }}>
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 500, borderColor: dk.border, color: dk.textSecondary, backgroundColor: dk.bg }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-[13px] text-white transition-colors cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: "#FF3B30" }}
            >
              Remover
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
