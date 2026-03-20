"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, User, UserPlus, Loader2 } from "lucide-react";
import { useWizard } from "../wizard-context";
import { ActionPill } from "@/components/ui/apple-kit";
import { INPUT_CLS, LABEL_CLS } from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { createClient } from "@/lib/supabase/client";

interface StepClientProps {
  clients: { id: string; name: string; email: string | null; phone: string | null }[];
}

export function StepClient({ clients: initialClients }: StepClientProps) {
  const { form, updateForm } = useWizard();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState(initialClients);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh clients from database when switching to existing mode
  useEffect(() => {
    if (form.client_mode !== "existing") return;
    let cancelled = false;
    setIsRefreshing(true);
    const supabase = createClient();
    supabase
      .from("clients")
      .select("id, name, email, phone")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data) {
          setClients(data);
        }
        if (!cancelled) setIsRefreshing(false);
      });
    return () => { cancelled = true; };
  }, [form.client_mode]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [clients, search]);

  const selectExistingClient = (client: (typeof clients)[0]) => {
    updateForm({
      client_id: client.id,
      client_name: client.name,
      client_email: client.email || "",
      client_phone: client.phone || "",
    });
  };

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <ActionPill
          label="Cliente existente"
          active={form.client_mode === "existing"}
          onClick={() => updateForm({ client_mode: "existing", client_id: "", client_name: "", client_email: "", client_phone: "", client_document: "" })}
        />
        <ActionPill
          label="Novo cliente"
          active={form.client_mode === "new"}
          onClick={() => updateForm({ client_mode: "new", client_id: "" })}
        />
      </div>

      <AnimatePresence mode="wait">
        {form.client_mode === "existing" ? (
          <motion.div key="existing" {...springContentIn} className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10`}
              />
            </div>

            {/* Client list */}
            <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border-subtle)]">
              {isRefreshing ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--fg-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  Carregando clientes...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--fg-muted)]">
                  Nenhum cliente encontrado
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => selectExistingClient(client)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-[var(--card-hover)] ${
                      form.client_id === client.id ? "bg-[var(--info-subtle)]" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg)] flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-[var(--fg-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--fg)] truncate">{client.name}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] truncate">
                        {[client.email, client.phone].filter(Boolean).join(" \u00B7 ") || "Sem contato"}
                      </p>
                    </div>
                    {form.client_id === client.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--info)] flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="new" {...springContentIn} className="space-y-4">
            {/* Name */}
            <div>
              <label className={LABEL_CLS}>
                <UserPlus size={13} className="inline mr-1.5 -mt-0.5" />
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Ex: Ana Silva"
                value={form.client_name}
                onChange={(e) => {
                  updateForm({ client_name: e.target.value });
                  // Auto-generate project name
                  if (e.target.value && form.event_type) {
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
                      client_name: e.target.value,
                      project_name: `${typeLabels[form.event_type] || "Projeto"} ${e.target.value}`,
                    });
                  }
                }}
                className={INPUT_CLS}
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Email</label>
                <input
                  type="email"
                  placeholder="ana@email.com"
                  value={form.client_email}
                  onChange={(e) => updateForm({ client_email: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.client_phone}
                  onChange={(e) => updateForm({ client_phone: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label className={LABEL_CLS}>CPF / CNPJ</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={form.client_document}
                onChange={(e) => updateForm({ client_document: e.target.value })}
                className={INPUT_CLS}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
