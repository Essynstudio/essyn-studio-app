"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Package, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWizard } from "../wizard-context";
import { WidgetEmptyState } from "@/components/ui/apple-kit";
import { INPUT_CLS, LABEL_CLS, SECONDARY_CTA, COMPACT_SECONDARY_CTA, PRIMARY_CTA, SELECT_CLS } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import { createClient } from "@/lib/supabase/client";
import type { CatalogProduct, ProjectProduct } from "@/lib/types";

interface StepProductsProps {
  catalogProducts: CatalogProduct[];
  studioId: string;
  onProductCreated?: (product: CatalogProduct) => void;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function StepProducts({ catalogProducts, studioId, onProductCreated }: StepProductsProps) {
  const { form, updateForm } = useWizard();
  const [showForm, setShowForm] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("impressao");
  const [prodPrice, setProdPrice] = useState("");
  const [prodSaving, setProdSaving] = useState(false);

  const handleCreateProduct = async () => {
    if (!prodName.trim()) { toast.error("Nome do produto é obrigatório."); return; }
    setProdSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("catalog_products")
        .insert({
          studio_id: studioId,
          name: prodName.trim(),
          category: prodCategory,
          base_price: parseFloat(prodPrice) || 0,
          active: true,
          sizes: [],
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Produto criado!");
      onProductCreated?.(data);
      setProdName(""); setProdPrice(""); setProdCategory("impressao");
      setShowForm(false);
    } catch (err: any) { toast.error(err.message || "Erro ao criar produto."); }
    finally { setProdSaving(false); }
  };

  const activeProducts = useMemo(
    () => catalogProducts.filter((p) => p.active),
    [catalogProducts]
  );

  const selectedIds = useMemo(
    () => new Set(form.selected_products.map((p) => p.catalog_product_id)),
    [form.selected_products]
  );

  const toggleProduct = (product: CatalogProduct) => {
    if (selectedIds.has(product.id)) {
      updateForm({
        selected_products: form.selected_products.filter(
          (p) => p.catalog_product_id !== product.id
        ),
      });
    } else {
      const newProduct: ProjectProduct = {
        catalog_product_id: product.id,
        name: product.name,
        description: product.description,
        quantity: 1,
        unit_price: product.base_price,
        notes: null,
      };
      updateForm({
        selected_products: [...form.selected_products, newProduct],
      });
    }
  };

  const updateProduct = (
    catalogProductId: string,
    partial: Partial<ProjectProduct>
  ) => {
    updateForm({
      selected_products: form.selected_products.map((p) =>
        p.catalog_product_id === catalogProductId ? { ...p, ...partial } : p
      ),
    });
  };

  const totalSelected = form.selected_products.length;

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CatalogProduct[]> = {};
    for (const p of activeProducts) {
      const cat = p.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [activeProducts]);

  const productForm = (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={springSnappy} className="overflow-hidden">
      <div className="p-4 rounded-lg border border-[var(--info)] bg-[var(--info-subtle)] space-y-3">
        <p className="text-[12px] font-medium text-[var(--info)]">Novo produto</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={LABEL_CLS}>Nome *</label>
            <input type="text" placeholder="Ex: Album 30x30" value={prodName} onChange={(e) => setProdName(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Categoria</label>
            <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className={`${SELECT_CLS} w-full`}>
              <option value="impressao">Impressão</option>
              <option value="album">Álbum</option>
              <option value="digital">Arquivo digital</option>
              <option value="video">Edição de vídeo</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Preço (R$)</label>
            <input type="number" placeholder="0,00" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setShowForm(false)} className={SECONDARY_CTA} disabled={prodSaving}>Cancelar</button>
          <button type="button" onClick={handleCreateProduct} className={PRIMARY_CTA} disabled={prodSaving}>
            {prodSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {prodSaving ? "Salvando..." : "Criar produto"}
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (activeProducts.length === 0) {
    return (
      <motion.div {...springContentIn} className="space-y-4">
        <WidgetEmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Crie seus produtos para poder adicioná-los aos projetos."
          action={
            !showForm ? (
              <button type="button" onClick={() => setShowForm(true)} className={SECONDARY_CTA}>
                <Plus size={14} /> Cadastrar produto
              </button>
            ) : undefined
          }
        />
        {showForm && productForm}
      </motion.div>
    );
  }

  return (
    <motion.div {...springContentIn} className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--fg-muted)]">
          Selecione os produtos que serão incluídos neste projeto.
        </p>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className={COMPACT_SECONDARY_CTA}>
            <Plus size={12} /> Novo
          </button>
        )}
      </div>
      {showForm && productForm}

      {Object.entries(grouped).map(([category, products]) => (
        <div key={category}>
          <label className={`${LABEL_CLS} !text-[11px] uppercase tracking-wider !text-[var(--fg-muted)]`}>
            {category}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {products.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const selectedProduct = form.selected_products.find(
                (p) => p.catalog_product_id === product.id
              );

              return (
                <div key={product.id} className="space-y-2">
                  <div
                    onClick={() => toggleProduct(product)}
                    className={`rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] cursor-pointer p-3 transition-all ${
                      isSelected
                        ? "!border-[var(--info)] ring-2 ring-[var(--info)] ring-opacity-30"
                        : ""
                    }`}
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">
                          {product.category}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          borderColor: isSelected ? "var(--info)" : "var(--border)",
                          backgroundColor: isSelected ? "var(--info)" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springSnappy}
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--fg)] mt-2">
                      {formatBRL(product.base_price)}
                    </p>
                  </div>

                  {/* Quantity + Notes (shown only when selected) */}
                  {isSelected && selectedProduct && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={springSnappy}
                      className="space-y-2 px-1"
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-medium text-[var(--fg-muted)] whitespace-nowrap">
                          Qtd:
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={selectedProduct.quantity}
                          onChange={(e) =>
                            updateProduct(product.id, {
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className={`${INPUT_CLS} !h-7 !text-xs !w-16`}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Observações..."
                        value={selectedProduct.notes || ""}
                        onChange={(e) =>
                          updateProduct(product.id, {
                            notes: e.target.value || null,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className={`${INPUT_CLS} !h-7 !text-xs`}
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary */}
      {totalSelected > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
          className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-2"
        >
          <ShoppingBag size={14} className="text-[var(--fg-muted)]" />
          <span className="text-[12px] text-[var(--fg)]">
            <strong>{totalSelected}</strong> produto{totalSelected !== 1 ? "s" : ""} selecionado{totalSelected !== 1 ? "s" : ""}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
