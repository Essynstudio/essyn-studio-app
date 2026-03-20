"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Users, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWizard } from "../wizard-context";
import { StatusBadge, WidgetEmptyState } from "@/components/ui/apple-kit";
import { INPUT_CLS, LABEL_CLS, SELECT_CLS, SECONDARY_CTA, COMPACT_SECONDARY_CTA, PRIMARY_CTA } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface StepTeamProps {
  teamMembers: TeamMember[];
  studioId: string;
  onMemberCreated?: (member: TeamMember) => void;
}

const ROLE_COLORS: Record<string, { color: string; bg: string; avatar: string }> = {
  fotografo: { color: "var(--info)", bg: "var(--info-subtle)", avatar: "#2C444D" },
  videomaker: { color: "var(--accent)", bg: "var(--accent-subtle)", avatar: "#6B5B8D" },
  assistente: { color: "var(--warning)", bg: "var(--warning-subtle)", avatar: "#C87A20" },
  editor: { color: "var(--success)", bg: "var(--success-subtle)", avatar: "#2D7A4F" },
  maquiador: { color: "var(--error)", bg: "var(--error-subtle)", avatar: "#B84233" },
  default: { color: "var(--fg-muted)", bg: "var(--border-subtle)", avatar: "#7A8A8F" },
};

function getRoleStyle(role: string) {
  return ROLE_COLORS[role.toLowerCase()] || ROLE_COLORS.default;
}

export function StepTeam({ teamMembers, studioId, onMemberCreated }: StepTeamProps) {
  const { form, updateForm } = useWizard();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("fotografo");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedSet = useMemo(
    () => new Set(form.selected_team_ids),
    [form.selected_team_ids]
  );

  const toggleMember = (id: string) => {
    if (selectedSet.has(id)) {
      updateForm({
        selected_team_ids: form.selected_team_ids.filter((mid) => mid !== id),
      });
    } else {
      updateForm({
        selected_team_ids: [...form.selected_team_ids, id],
      });
    }
  };

  const handleCreateMember = async () => {
    if (!newName.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("team_members")
        .insert({
          studio_id: studioId,
          name: newName.trim(),
          email: newEmail.trim() || null,
          role: newRole,
          phone: newPhone.trim() || null,
          active: true,
        })
        .select("id, name, role, avatar_url")
        .single();
      if (error) throw error;
      toast.success("Membro adicionado!");
      onMemberCreated?.(data);
      updateForm({ selected_team_ids: [...form.selected_team_ids, data.id] });
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole("fotografo");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar membro.");
    } finally {
      setIsSaving(false);
    }
  };

  const inlineForm = (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={springSnappy}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-lg border border-[var(--info)] bg-[var(--info-subtle)] space-y-3">
        <p className="text-[12px] font-medium text-[var(--info)]">Novo membro da equipe</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Nome *</label>
            <input type="text" placeholder="Ex: Carlos Oliveira" value={newName} onChange={(e) => setNewName(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Cargo</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={`${SELECT_CLS} w-full`}>
              <option value="fotografo">Fotógrafo</option>
              <option value="videomaker">Videomaker</option>
              <option value="editor">Editor</option>
              <option value="assistente">Assistente</option>
              <option value="maquiador">Maquiador(a)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Email</label>
            <input type="email" placeholder="carlos@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Telefone</label>
            <input type="tel" placeholder="(11) 99999-9999" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setShowForm(false)} className={SECONDARY_CTA} disabled={isSaving}>Cancelar</button>
          <button type="button" onClick={handleCreateMember} className={PRIMARY_CTA} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {isSaving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (teamMembers.length === 0) {
    return (
      <motion.div {...springContentIn} className="space-y-4">
        <WidgetEmptyState
          icon={Users}
          title="Nenhum membro cadastrado"
          description="Adicione membros da equipe para vincular aos projetos."
          action={
            !showForm ? (
              <button type="button" onClick={() => setShowForm(true)} className={SECONDARY_CTA}>
                <Plus size={14} /> Cadastrar membro
              </button>
            ) : undefined
          }
        />
        {showForm && inlineForm}
      </motion.div>
    );
  }

  return (
    <motion.div {...springContentIn} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-[var(--fg)] mb-1">
            Equipe do evento
          </p>
          <p className="text-[11px] text-[var(--fg-muted)]">
            Selecione quem participará deste evento <span className="italic text-[var(--fg-muted)] opacity-70">(opcional)</span>
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className={COMPACT_SECONDARY_CTA}>
            <Plus size={14} /> Novo
          </button>
        )}
      </div>

      {showForm && inlineForm}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {teamMembers.map((member, index) => {
          const isSelected = selectedSet.has(member.id);
          const roleStyle = getRoleStyle(member.role);
          const initial = member.name.charAt(0).toUpperCase();

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 26,
                delay: index * 0.04,
              }}
            >
              <div
                onClick={() => toggleMember(member.id)}
                className={`rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] cursor-pointer p-4 transition-all ${
                  isSelected
                    ? "!border-[var(--success)] ring-2 ring-[var(--success)] ring-opacity-30"
                    : ""
                }`}
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: roleStyle.avatar }}
                  >
                    <span className="text-[13px] font-semibold text-white">
                      {initial}
                    </span>
                  </div>

                  {/* Checkmark */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      borderColor: isSelected ? "var(--success)" : "var(--border)",
                      backgroundColor: isSelected ? "var(--success)" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springSnappy}
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <p className="text-[13px] font-medium text-[var(--fg)] mt-2 truncate">
                  {member.name}
                </p>

                {/* Role badge */}
                <div className="mt-1.5">
                  <StatusBadge
                    label={member.role}
                    color={roleStyle.color}
                    bg={roleStyle.bg}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {form.selected_team_ids.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
          className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-2"
        >
          <Users size={14} className="text-[var(--fg-muted)]" />
          <span className="text-[12px] text-[var(--fg)]">
            <strong>{form.selected_team_ids.length}</strong> membro
            {form.selected_team_ids.length !== 1 ? "s" : ""} selecionado
            {form.selected_team_ids.length !== 1 ? "s" : ""}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
