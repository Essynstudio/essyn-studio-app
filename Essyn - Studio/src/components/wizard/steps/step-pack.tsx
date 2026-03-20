"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Package, Clock, Users, Camera, Truck, Layers, Plus, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useWizard } from "../wizard-context";
import { WidgetEmptyState } from "@/components/ui/apple-kit";
import { INPUT_CLS, LABEL_CLS, GHOST_BTN, SECONDARY_CTA, COMPACT_SECONDARY_CTA, PRIMARY_CTA, SELECT_CLS } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import { createClient } from "@/lib/supabase/client";
import type { Pack } from "@/lib/types";

interface StepPackProps {
  packs: Pack[];
  studioId: string;
  onPackCreated?: (pack: Pack) => void;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  galeria_online: "Galeria Online",
  pendrive: "Pendrive",
  download: "Download Direto",
  impresso: "Impresso",
};

export function StepPack({ packs, studioId, onPackCreated }: StepPackProps) {
  const { form, updateForm } = useWizard();

  const [showPackForm, setShowPackForm] = useState(false);
  const [packName, setPackName] = useState("");
  const [packValue, setPackValue] = useState("");
  const [packDesc, setPackDesc] = useState("");
  const [packDurationHours, setPackDurationHours] = useState("");
  const [packPhotographers, setPackPhotographers] = useState("1");
  const [packMinImages, setPackMinImages] = useState("");
  const [packDeliveryMethod, setPackDeliveryMethod] = useState("galeria_online");
  const [packIncludes, setPackIncludes] = useState<string[]>([""]);
  const [packSaving, setPackSaving] = useState(false);

  const addIncludeItem = () => setPackIncludes((prev) => [...prev, ""]);
  const updateIncludeItem = (idx: number, value: string) =>
    setPackIncludes((prev) => prev.map((item, i) => (i === idx ? value : item)));
  const removeIncludeItem = (idx: number) =>
    setPackIncludes((prev) => prev.filter((_, i) => i !== idx));

  const handleCreatePack = async () => {
    if (!packName.trim()) { toast.error("Nome do pack é obrigatório."); return; }
    setPackSaving(true);
    try {
      const supabase = createClient();
      const includeItems = packIncludes.map((s) => s.trim()).filter(Boolean).map((label) => ({ label, qty: 1 }));
      const { data, error } = await supabase
        .from("packs")
        .insert({
          studio_id: studioId,
          name: packName.trim(),
          base_value: parseFloat(packValue) || 0,
          description: packDesc.trim() || null,
          duration_hours: packDurationHours ? parseInt(packDurationHours) : null,
          photographers_count: parseInt(packPhotographers) || 1,
          min_images: packMinImages ? parseInt(packMinImages) : null,
          delivery_method: packDeliveryMethod,
          includes: includeItems,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Pack criado!");
      onPackCreated?.(data);
      selectPack(data);
      setPackName(""); setPackValue(""); setPackDesc("");
      setPackDurationHours(""); setPackPhotographers("1");
      setPackMinImages(""); setPackDeliveryMethod("galeria_online");
      setPackIncludes([""]);
      setShowPackForm(false);
    } catch (err: any) { toast.error(err.message || "Erro ao criar pack."); }
    finally { setPackSaving(false); }
  };

  const activePacks = useMemo(() => packs.filter((p) => p.active), [packs]);

  const selectPack = (pack: Pack | null) => {
    if (pack) {
      updateForm({ pack_id: pack.id, pack_custom: false, total_value: pack.base_value });
    } else {
      updateForm({ pack_id: "", pack_custom: true, total_value: 0 });
    }
  };

  return (
    <motion.div {...springContentIn} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className={LABEL_CLS + " !mb-0"}>
          <Package size={13} className="inline mr-1.5 -mt-0.5" />
          Selecione um pacote
        </label>
        {!showPackForm && (
          <button type="button" onClick={() => setShowPackForm(true)} className={COMPACT_SECONDARY_CTA}>
            <Plus size={12} /> Novo pack
          </button>
        )}
      </div>

      {/* Pack creation form */}
      {showPackForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={springSnappy} className="overflow-hidden">
          <div className="p-4 rounded-lg border border-[var(--info)] bg-[var(--info-subtle)] space-y-3">
            <p className="text-[12px] font-semibold text-[var(--info)]">Novo pacote</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Nome do pack *</label>
                <input type="text" placeholder="Ex: Casamento Premium" value={packName} onChange={(e) => setPackName(e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Valor base (R$)</label>
                <input type="number" placeholder="0,00" value={packValue} onChange={(e) => setPackValue(e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLS}><Clock size={10} className="inline mr-1 -mt-0.5" />Duração (horas)</label>
                <input type="number" min={1} placeholder="Ex: 9" value={packDurationHours} onChange={(e) => setPackDurationHours(e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}><Users size={10} className="inline mr-1 -mt-0.5" />Fotógrafos</label>
                <input type="number" min={1} placeholder="1" value={packPhotographers} onChange={(e) => setPackPhotographers(e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}><Camera size={10} className="inline mr-1 -mt-0.5" />Mín. imagens</label>
                <input type="number" min={1} placeholder="Ex: 900" value={packMinImages} onChange={(e) => setPackMinImages(e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}><Truck size={10} className="inline mr-1 -mt-0.5" />Método de entrega</label>
              <select value={packDeliveryMethod} onChange={(e) => setPackDeliveryMethod(e.target.value)} className={SELECT_CLS}>
                <option value="galeria_online">Galeria Online</option>
                <option value="pendrive">Pendrive</option>
                <option value="download">Download Direto</option>
                <option value="impresso">Impresso</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Descrição geral</label>
              <input type="text" placeholder="Ex: Cobertura completa do casamento com Making of" value={packDesc} onChange={(e) => setPackDesc(e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL_CLS + " !mb-0"}><Layers size={10} className="inline mr-1 -mt-0.5" />O que está incluso</label>
                <button type="button" onClick={addIncludeItem} className={`${GHOST_BTN} !h-6 !px-2 !text-[10px]`}><Plus size={10} /> Adicionar item</button>
              </div>
              <div className="space-y-1.5">
                {packIncludes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[var(--fg-muted)] text-[11px] flex-shrink-0">•</span>
                    <input type="text" placeholder={`Ex: Making of noivos`} value={item} onChange={(e) => updateIncludeItem(idx, e.target.value)} className={`${INPUT_CLS} flex-1`} />
                    {packIncludes.length > 1 && (
                      <button type="button" onClick={() => removeIncludeItem(idx)} className={`${GHOST_BTN} !p-1`}><X size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowPackForm(false)} className={SECONDARY_CTA} disabled={packSaving}>Cancelar</button>
              <button type="button" onClick={handleCreatePack} className={PRIMARY_CTA} disabled={packSaving}>
                {packSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {packSaving ? "Salvando..." : "Criar pack"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pack cards */}
      {activePacks.length === 0 && !showPackForm ? (
        <WidgetEmptyState
          icon={Package}
          title="Nenhum pack cadastrado"
          description="Crie seus packs de serviço para vincular aos projetos."
          action={
            <button type="button" onClick={() => setShowPackForm(true)} className={SECONDARY_CTA}>
              <Plus size={14} /> Cadastrar primeiro pack
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {activePacks.map((pack) => (
            <div
              key={pack.id}
              onClick={() => selectPack(pack)}
              className={`rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] cursor-pointer p-4 transition-all ${form.pack_id === pack.id ? "!border-[var(--info)] ring-2 ring-[var(--info)] ring-opacity-30" : ""}`}
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-[13px] font-semibold text-[var(--fg)] leading-snug pr-2">{pack.name}</h4>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: form.pack_id === pack.id ? "var(--info)" : "var(--border)",
                    backgroundColor: form.pack_id === pack.id ? "var(--info)" : "transparent",
                  }}
                >
                  {form.pack_id === pack.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springSnappy} className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-[15px] font-bold text-[var(--fg)] mb-2">{formatBRL(pack.base_value)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                {pack.duration_hours && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]"><Clock size={9} /> {pack.duration_hours}h</span>
                )}
                {pack.photographers_count && pack.photographers_count > 1 && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]"><Users size={9} /> {pack.photographers_count} fotógrafos</span>
                )}
                {pack.min_images && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]"><Camera size={9} /> Mín. {pack.min_images.toLocaleString()}</span>
                )}
                {pack.delivery_method && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]"><Truck size={9} /> {DELIVERY_METHOD_LABELS[pack.delivery_method] ?? pack.delivery_method}</span>
                )}
              </div>
              {pack.includes.length > 0 && (
                <ul className="space-y-0.5 mb-1">
                  {pack.includes.map((item, idx) => (
                    <li key={idx} className="text-[11px] text-[var(--fg-muted)] flex items-start gap-1">
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {pack.description && (
                <p className="text-[10px] text-[var(--fg-muted)] mt-1.5 line-clamp-2 italic">{pack.description}</p>
              )}
            </div>
          ))}

          {/* Custom option */}
          <div
            onClick={() => selectPack(null)}
            className={`rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] cursor-pointer p-4 transition-all ${form.pack_custom ? "!border-[var(--info)] ring-2 ring-[var(--info)] ring-opacity-30" : ""}`}
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-[13px] font-semibold text-[var(--fg)]">Personalizado</h4>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: form.pack_custom ? "var(--info)" : "var(--border)",
                  backgroundColor: form.pack_custom ? "var(--info)" : "transparent",
                }}
              >
                {form.pack_custom && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springSnappy} className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-[var(--fg-muted)]">Monte um pacote sob medida com valor e itens personalizados.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
