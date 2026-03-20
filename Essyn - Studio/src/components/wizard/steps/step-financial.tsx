"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, Plus, X, AlertTriangle, Hash } from "lucide-react";
import { useWizard } from "../wizard-context";
import { ActionPill, InlineBanner } from "@/components/ui/apple-kit";
import { INPUT_CLS, LABEL_CLS, SELECT_CLS, SECONDARY_CTA, COMPACT_SECONDARY_CTA, GHOST_BTN } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import type { PaymentMethod, PaymentSplit } from "@/lib/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
];

type PresetKey = "avista" | "50_50" | "30_70" | "3x" | "parcelar" | "custom";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function StepFinancial() {
  const { form, updateForm } = useWizard();
  const [showParcelar, setShowParcelar] = useState(false);
  const [numParcelas, setNumParcelas] = useState(6);
  const [parcelaFrequencia, setParcelaFrequencia] = useState<"mensal" | "quinzenal" | "semanal">("mensal");

  const totalPercent = useMemo(
    () => form.payment_splits.reduce((sum, s) => sum + s.percent, 0),
    [form.payment_splits]
  );

  const isValidSplit = totalPercent === 100;

  const currentPreset = useMemo((): PresetKey | null => {
    const splits = form.payment_splits;
    if (splits.length === 1 && splits[0].percent === 100) return "avista";
    if (splits.length === 2 && splits[0].percent === 50 && splits[1].percent === 50) return "50_50";
    if (splits.length === 2 && splits[0].percent === 30 && splits[1].percent === 70) return "30_70";
    if (splits.length === 3 && splits.every((s) => Math.abs(s.percent - 33.33) < 0.5)) return "3x";
    return "custom";
  }, [form.payment_splits]);

  const baseDate = form.event_date || new Date().toISOString().split("T")[0];

  const applyPreset = (preset: PresetKey) => {
    switch (preset) {
      case "avista":
        updateForm({
          payment_splits: [
            { percent: 100, label: "Pagamento único", due_date: baseDate },
          ],
        });
        break;
      case "50_50":
        updateForm({
          payment_splits: [
            { percent: 50, label: "Sinal", due_date: baseDate },
            { percent: 50, label: "Restante", due_date: addDays(baseDate, 30) },
          ],
        });
        break;
      case "30_70":
        updateForm({
          payment_splits: [
            { percent: 30, label: "Sinal", due_date: baseDate },
            { percent: 70, label: "Restante", due_date: addDays(baseDate, 30) },
          ],
        });
        break;
      case "3x":
        updateForm({
          payment_splits: [
            { percent: 33.34, label: "1a parcela", due_date: baseDate },
            { percent: 33.33, label: "2a parcela", due_date: addDays(baseDate, 30) },
            { percent: 33.33, label: "3a parcela", due_date: addDays(baseDate, 60) },
          ],
        });
        break;
      case "parcelar":
        setShowParcelar(true);
        return;
      case "custom":
        updateForm({
          payment_splits: [
            { percent: 100, label: "Parcela 1", due_date: baseDate },
          ],
        });
        break;
    }
    setShowParcelar(false);
  };

  const generateParcelas = () => {
    const freqDays = parcelaFrequencia === "mensal" ? 30 : parcelaFrequencia === "quinzenal" ? 15 : 7;
    const percentPerSplit = Math.round((10000 / numParcelas)) / 100;
    const splits: PaymentSplit[] = Array.from({ length: numParcelas }, (_, i) => ({
      percent: i === numParcelas - 1 ? +(100 - percentPerSplit * (numParcelas - 1)).toFixed(2) : percentPerSplit,
      label: `${i + 1}a parcela`,
      due_date: addDays(baseDate, i * freqDays),
    }));
    updateForm({ payment_splits: splits });
    setShowParcelar(false);
  };

  const updateSplit = (index: number, partial: Partial<PaymentSplit>) => {
    const splits = [...form.payment_splits];
    splits[index] = { ...splits[index], ...partial };
    updateForm({ payment_splits: splits });
  };

  const addSplit = () => {
    const remaining = Math.max(0, 100 - totalPercent);
    updateForm({
      payment_splits: [
        ...form.payment_splits,
        {
          percent: remaining,
          label: `Parcela ${form.payment_splits.length + 1}`,
          due_date: addDays(baseDate, form.payment_splits.length * 30),
        },
      ],
    });
  };

  const removeSplit = (index: number) => {
    if (form.payment_splits.length <= 1) return;
    updateForm({
      payment_splits: form.payment_splits.filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div {...springContentIn} className="space-y-5">
      {/* Total value */}
      <div>
        <label className={LABEL_CLS}>
          <DollarSign size={13} className="inline mr-1.5 -mt-0.5" />
          Valor total do projeto
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-muted)]">
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={form.total_value ? form.total_value.toString().replace(".", ",") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d,]/g, "").replace(",", ".");
              updateForm({ total_value: parseFloat(raw) || 0 });
            }}
            placeholder="0,00"
            className={`${INPUT_CLS} !pl-12`}
          />
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className={LABEL_CLS}>Forma de pagamento</label>
        <select
          value={form.payment_method}
          onChange={(e) => updateForm({ payment_method: e.target.value as PaymentMethod | "" })}
          className={`${SELECT_CLS} w-full`}
        >
          <option value="">Selecione...</option>
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm.value} value={pm.value}>
              {pm.label}
            </option>
          ))}
        </select>
      </div>

      {/* Payment split presets */}
      <div>
        <label className={LABEL_CLS}>Condições de pagamento</label>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(
            [
              { key: "avista", label: "À vista" },
              { key: "50_50", label: "50/50" },
              { key: "30_70", label: "30/70" },
              { key: "3x", label: "3x iguais" },
              { key: "parcelar", label: "Parcelar (N vezes)" },
              { key: "custom", label: "Personalizado" },
            ] as { key: PresetKey; label: string }[]
          ).map((preset) => (
            <ActionPill
              key={preset.key}
              label={preset.label}
              active={currentPreset === preset.key}
              onClick={() => applyPreset(preset.key)}
            />
          ))}
        </div>

        {/* Parcelar config */}
        <AnimatePresence>
          {showParcelar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSnappy}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-lg border border-[var(--info)] bg-[var(--info-subtle)] space-y-3 mb-4">
                <p className="text-[12px] font-medium text-[var(--info)] flex items-center gap-1.5">
                  <Hash size={13} />
                  Configurar parcelamento
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                      Parcelas
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={24}
                      value={numParcelas}
                      onChange={(e) => setNumParcelas(parseInt(e.target.value) || 2)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                      Frequência
                    </label>
                    <select
                      value={parcelaFrequencia}
                      onChange={(e) => setParcelaFrequencia(e.target.value as typeof parcelaFrequencia)}
                      className={`${SELECT_CLS} w-full`}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={generateParcelas}
                      className={`${COMPACT_SECONDARY_CTA} w-full`}
                    >
                      Gerar {numParcelas}x
                    </button>
                  </div>
                </div>
                {form.total_value > 0 && (
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    {numParcelas}x de <strong className="text-[var(--fg)]">{formatBRL(form.total_value / numParcelas)}</strong>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Splits */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {form.payment_splits.map((split, i) => {
              const amount = form.total_value * (split.percent / 100);
              const formattedDate = split.due_date
                ? new Date(split.due_date + "T12:00:00").toLocaleDateString("pt-BR")
                : "";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springSnappy}
                  className="overflow-hidden"
                >
                  <div className="relative p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] space-y-3">
                    {form.payment_splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSplit(i)}
                        className={`${GHOST_BTN} absolute top-2 right-2 !p-1.5`}
                      >
                        <X size={14} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Label */}
                      <div>
                        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={split.label}
                          onChange={(e) => updateSplit(i, { label: e.target.value })}
                          className={INPUT_CLS}
                        />
                      </div>

                      {/* Percent */}
                      <div>
                        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                          Percentual (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={split.percent}
                          onChange={(e) =>
                            updateSplit(i, { percent: parseFloat(e.target.value) || 0 })
                          }
                          className={INPUT_CLS}
                        />
                      </div>

                      {/* Due date */}
                      <div>
                        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                          Vencimento
                        </label>
                        <input
                          type="date"
                          value={split.due_date}
                          onChange={(e) => updateSplit(i, { due_date: e.target.value })}
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>

                    {/* Real-time calculator */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[11px] text-[var(--fg-muted)]">
                        {split.label}: <strong className="text-[var(--fg)]">{formatBRL(amount)}</strong>
                        {formattedDate && (
                          <span className="ml-1">({formattedDate})</span>
                        )}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--fg-muted)]">
                        {split.percent}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add split button */}
          <button
            type="button"
            onClick={addSplit}
            className={`${COMPACT_SECONDARY_CTA} w-full`}
          >
            <Plus size={14} />
            Adicionar parcela
          </button>
        </div>

        {/* Warning: splits without value */}
        {form.payment_splits.length > 0 && form.total_value === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="mt-3"
          >
            <InlineBanner variant="warning">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Defina o <strong>valor total</strong> acima para que as parcelas sejam geradas corretamente.
              </span>
            </InlineBanner>
          </motion.div>
        )}

        {/* Validation warning */}
        {form.payment_splits.length > 0 && !isValidSplit && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="mt-3"
          >
            <InlineBanner variant="warning">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                O total dos percentuais está em <strong>{totalPercent.toFixed(2)}%</strong> — precisa ser exatamente 100%.
              </span>
            </InlineBanner>
          </motion.div>
        )}

        {/* Summary */}
        {form.total_value > 0 && form.payment_splits.length > 0 && isValidSplit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSnappy}
            className="mt-3 p-3 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]"
          >
            <p className="text-[11px] font-medium text-[var(--success)] mb-1">Resumo do parcelamento</p>
            {form.payment_splits.map((split, i) => {
              const amount = form.total_value * (split.percent / 100);
              const formattedDate = split.due_date
                ? new Date(split.due_date + "T12:00:00").toLocaleDateString("pt-BR")
                : "Sem data";
              return (
                <p key={i} className="text-[12px] text-[var(--fg)]">
                  {split.label}: <strong>{formatBRL(amount)}</strong> — {formattedDate}
                </p>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
