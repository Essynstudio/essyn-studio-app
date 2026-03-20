"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Plus, X, Calendar, Clock } from "lucide-react";
import { useWizard } from "../wizard-context";
import { INPUT_CLS, LABEL_CLS, SELECT_CLS, SECONDARY_CTA, COMPACT_SECONDARY_CTA, GHOST_BTN } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import type { EventType, ProjectLocation } from "@/lib/types";

const EVENT_TYPES: { value: EventType | "custom"; label: string }[] = [
  { value: "casamento", label: "Casamento" },
  { value: "ensaio", label: "Ensaio" },
  { value: "corporativo", label: "Corporativo" },
  { value: "aniversario", label: "Aniversário" },
  { value: "formatura", label: "Formatura" },
  { value: "batizado", label: "Batizado" },
  { value: "outro", label: "Outro" },
  { value: "custom", label: "Personalizado..." },
];

export function StepEvent() {
  const { form, updateForm } = useWizard();
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");

  const updateLocation = (index: number, partial: Partial<ProjectLocation>) => {
    const locations = [...form.locations];
    locations[index] = { ...locations[index], ...partial };
    updateForm({ locations });
  };

  const addLocation = () => {
    updateForm({
      locations: [
        ...form.locations,
        { name: "", address: "", event_time: "", sort_order: form.locations.length },
      ],
    });
  };

  const removeLocation = (index: number) => {
    if (form.locations.length <= 1) return;
    const locations = form.locations.filter((_, i) => i !== index).map((loc, i) => ({ ...loc, sort_order: i }));
    updateForm({ locations });
  };

  return (
    <motion.div {...springContentIn} className="space-y-5">
      {/* Project name */}
      <div>
        <label className={LABEL_CLS}>Nome do projeto *</label>
        <input
          type="text"
          placeholder="Ex: Ana & Pedro"
          value={form.project_name}
          onChange={(e) => updateForm({ project_name: e.target.value })}
          className={INPUT_CLS}
        />
      </div>

      {/* Event type + date + time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLS}>
            <Calendar size={12} className="inline mr-1 -mt-0.5" />
            Tipo de evento
          </label>
          {isCustomType ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Chá Revelação, Debutante..."
                value={customTypeName}
                onChange={(e) => {
                  setCustomTypeName(e.target.value);
                  // Save custom type name in notes prefix so it's not lost
                  const customNote = e.target.value ? `[Tipo: ${e.target.value}] ` : "";
                  const existingNotes = (form.notes || "").replace(/^\[Tipo: [^\]]*\] /, "");
                  updateForm({ event_type: "outro", notes: customNote + existingNotes });
                  if (form.client_name && e.target.value) {
                    updateForm({
                      event_type: "outro",
                      project_name: `${e.target.value} ${form.client_name}`,
                      notes: customNote + existingNotes,
                    });
                  }
                }}
                className={`${INPUT_CLS} flex-1`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setIsCustomType(false); setCustomTypeName(""); }}
                className={`${GHOST_BTN} !p-1.5`}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <select
              value={form.event_type}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomType(true);
                  updateForm({ event_type: "outro" });
                  return;
                }
                const eventType = e.target.value as EventType;
                updateForm({ event_type: eventType });
                if (form.client_name) {
                  const typeLabels: Record<string, string> = {
                    casamento: "Casamento",
                    ensaio: "Ensaio",
                    corporativo: "Corporativo",
                    aniversario: "Aniversário",
                    formatura: "Formatura",
                    batizado: "Batizado",
                    outro: "Projeto",
                  };
                  updateForm({
                    event_type: eventType,
                    project_name: `${typeLabels[eventType]} ${form.client_name}`,
                  });
                }
              }}
              className={`${SELECT_CLS} w-full`}
            >
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={LABEL_CLS}>
            <Calendar size={12} className="inline mr-1 -mt-0.5" />
            Data
          </label>
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => updateForm({ event_date: e.target.value })}
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>
            <Clock size={12} className="inline mr-1 -mt-0.5" />
            Horário
          </label>
          <input
            type="time"
            value={form.event_time}
            onChange={(e) => updateForm({ event_time: e.target.value })}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={LABEL_CLS + " !mb-0"}>
            <MapPin size={12} className="inline mr-1 -mt-0.5" />
            Locais do evento
          </label>
          <button
            type="button"
            onClick={addLocation}
            className={COMPACT_SECONDARY_CTA}
          >
            <Plus size={14} />
            Adicionar local
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {form.locations.map((loc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={springSnappy}
                className="overflow-hidden"
              >
                <div className="relative p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] space-y-3">
                  {/* Remove button */}
                  {form.locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(i)}
                      className={`${GHOST_BTN} absolute top-2 right-2 !p-1.5`}
                    >
                      <X size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                        Local
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Igreja, Buffet"
                        value={loc.name}
                        onChange={(e) => updateLocation(i, { name: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                        Endereço
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, número, cidade"
                        value={loc.address}
                        onChange={(e) => updateLocation(i, { address: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={loc.event_time}
                        onChange={(e) => updateLocation(i, { event_time: e.target.value })}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
