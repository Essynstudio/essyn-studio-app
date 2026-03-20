"use client";

import { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useWizard } from "../wizard-context";
import { INPUT_CLS, GHOST_BTN } from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (Supabase bucket limit)

export function StepContract() {
  const { form, updateForm } = useWizard();
  const contractInputRef = useRef<HTMLInputElement>(null);

  const handleContractFile = useCallback((file: File | null) => {
    if (file && file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. O limite é 10 MB.");
      return;
    }
    updateForm({
      contract_file: file,
      contract_name: file ? (form.contract_name || file.name.replace(/\.pdf$/i, "")) : "",
    });
  }, [form.contract_name, updateForm]);

  const handleContractDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleContractFile(file);
  }, [handleContractFile]);

  const removeContract = useCallback(() => {
    updateForm({ contract_file: null, contract_name: "" });
    if (contractInputRef.current) contractInputRef.current.value = "";
  }, [updateForm]);

  return (
    <motion.div {...springContentIn} className="space-y-4">
      {!form.contract_file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleContractDrop}
          onClick={() => contractInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--info)] hover:bg-[var(--info-subtle)] transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center">
            <Upload size={24} className="text-[var(--fg-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[var(--fg)]">
              Arraste o contrato aqui <span className="text-[var(--fg-muted)] font-normal">(opcional)</span>
            </p>
            <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
              ou <span className="text-[var(--info)] font-medium">clique para selecionar</span>
            </p>
          </div>
          <p className="text-[10px] text-[var(--fg-muted)]">Apenas PDF, máximo 10 MB</p>
          <input
            ref={contractInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleContractFile(e.target.files?.[0] || null)}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* File info */}
          <div className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-[var(--info-subtle)] flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-[var(--info)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[var(--fg)] truncate">{form.contract_file.name}</p>
              <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
                {form.contract_file.size > 1024 * 1024
                  ? `${(form.contract_file.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(form.contract_file.size / 1024).toFixed(0)} KB`} · PDF
              </p>
            </div>
            <button type="button" onClick={removeContract} className={`${GHOST_BTN} !p-2`} title="Remover contrato">
              <X size={16} />
            </button>
          </div>

          {/* Contract name */}
          <div className="px-5 pb-5 pt-0">
            <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 block">
              Nome do contrato
            </label>
            <input
              type="text"
              placeholder="Ex: Contrato Casamento Ana & Pedro"
              value={form.contract_name}
              onChange={(e) => updateForm({ contract_name: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
        </div>
      )}

      <p className="text-[11px] text-[var(--fg-muted)] text-center">
        O contrato ficará vinculado a este projeto e disponível para o cliente no portal.
      </p>
    </motion.div>
  );
}
