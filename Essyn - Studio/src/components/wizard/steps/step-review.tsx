"use client";

import { motion } from "motion/react";
import {
  User,
  Calendar,
  MapPin,
  Package,
  CheckSquare,
  Users,
  DollarSign,
  ShoppingBag,
  FileText,
  Image,
  Clock,
  ChevronRight,
  Check,
  Pencil,
  StickyNote,
} from "lucide-react";
import { springSnappy } from "@/lib/motion-tokens";
import { INPUT_CLS } from "@/lib/design-tokens";
import { useWizard } from "../wizard-context";
import type { Pack, CatalogProduct } from "@/lib/types";

interface StepReviewProps {
  packs: Pack[];
  catalogProducts: CatalogProduct[];
  teamMembers: { id: string; name: string; role: string; avatar_url: string | null }[];
}

const TYPE_LABELS: Record<string, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Review Section ──────────────────────────

function ReviewSection({
  icon: Icon,
  title,
  stepIndex,
  onEdit,
  filled,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  filled: boolean;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay }}
      className="group"
    >
      <button
        type="button"
        onClick={() => onEdit(stepIndex)}
        className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-[var(--card-hover)] transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: filled ? "var(--success-subtle)" : "var(--bg-subtle)",
          }}
        >
          {filled ? (
            <Check size={14} style={{ color: "var(--success)" }} strokeWidth={2.5} />
          ) : (
            <Icon size={14} style={{ color: "var(--fg-muted)" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">
              {title}
            </p>
          </div>
          <div className="mt-1">{children}</div>
        </div>

        <div className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[var(--info)]">
          <Pencil size={11} />
          <span className="text-[10px] font-medium">Editar</span>
        </div>
      </button>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <span className="text-[12px] text-[var(--fg-secondary)] tracking-[-0.004em]">
      <span className="text-[var(--fg-muted)]">{label}:</span> {value}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[10px] font-medium text-[var(--fg-secondary)]">
      {children}
    </span>
  );
}

// ── Main Component ──────────────────────────

export function StepReview({ packs, catalogProducts, teamMembers }: StepReviewProps) {
  const { form, setStep, updateForm } = useWizard();

  const selectedPack = packs.find((p) => p.id === form.pack_id);
  const selectedTeam = teamMembers.filter((m) => form.selected_team_ids.includes(m.id));
  const selectedProducts = form.selected_products || [];
  const hasLocations = form.locations.some((l) => l.name || l.address);
  const hasSplits = form.payment_splits.length > 0;
  const hasValue = form.total_value > 0;

  return (
    <div className="space-y-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center pb-3"
      >
        <p className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em] leading-tight">
          {form.project_name || "Novo Projeto"}
        </p>
        {form.event_type && (
          <p className="text-[12px] text-[var(--fg-muted)] mt-1">
            {TYPE_LABELS[form.event_type] || form.event_type}
            {form.event_date && ` · ${formatDate(form.event_date)}`}
          </p>
        )}
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-[var(--border-subtle)] mx-4" />

      {/* Sections */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {/* Cliente */}
        <ReviewSection
          icon={User}
          title="Cliente"
          stepIndex={0}
          onEdit={setStep}
          filled={!!form.client_id || !!form.client_name}
          delay={0.02}
        >
          {form.client_name ? (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              <span className="text-[12px] font-medium text-[var(--fg)]">{form.client_name}</span>
              {form.client_email && (
                <span className="text-[11px] text-[var(--fg-muted)]">{form.client_email}</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum cliente selecionado</span>
          )}
        </ReviewSection>

        {/* Evento */}
        <ReviewSection
          icon={Calendar}
          title="Evento"
          stepIndex={1}
          onEdit={setStep}
          filled={!!form.project_name}
          delay={0.04}
        >
          <div className="flex flex-wrap gap-2">
            {form.event_type && <Tag>{TYPE_LABELS[form.event_type] || form.event_type}</Tag>}
            {form.event_date && <Tag>{formatDate(form.event_date)}</Tag>}
            {form.event_time && <Tag>{form.event_time.slice(0, 5)}</Tag>}
          </div>
          {hasLocations && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={10} className="text-[var(--fg-muted)] shrink-0" />
              <span className="text-[11px] text-[var(--fg-muted)] truncate">
                {form.locations
                  .filter((l) => l.name || l.address)
                  .map((l) => l.name || l.address)
                  .join(" · ")}
              </span>
            </div>
          )}
        </ReviewSection>

        {/* Pack */}
        <ReviewSection
          icon={Package}
          title="Pack"
          stepIndex={2}
          onEdit={setStep}
          filled={!!selectedPack || form.pack_custom}
          delay={0.06}
        >
          <div className="flex flex-wrap gap-2">
            {selectedPack ? (
              <>
                <Tag>{selectedPack.name}</Tag>
                {selectedPack.base_value > 0 && (
                  <Tag>{formatCurrency(selectedPack.base_value)}</Tag>
                )}
              </>
            ) : form.pack_custom ? (
              <Tag>Personalizado</Tag>
            ) : (
              <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum pack selecionado</span>
            )}
          </div>
        </ReviewSection>

        {/* Produção */}
        <ReviewSection
          icon={CheckSquare}
          title="Produção"
          stepIndex={3}
          onEdit={setStep}
          filled={form.workflows.length > 0}
          delay={0.07}
        >
          {form.workflows.length > 0 ? (
            <div className="space-y-1">
              {form.workflows.map((wf) => (
                <div key={wf.id} className="flex flex-wrap gap-1.5">
                  <Tag>{wf.name || "Sem nome"}</Tag>
                  <span className="text-[10px] text-[var(--fg-muted)]">{wf.steps.length} etapas</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum workflow adicionado</span>
          )}
          {form.delivery_deadline_days > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Clock size={9} className="text-[var(--fg-muted)]" />
              <span className="text-[11px] text-[var(--fg-muted)]">Entrega {form.delivery_deadline_days}d</span>
            </div>
          )}
          {form.gallery_auto_create && (
            <div className="flex items-center gap-1.5 mt-1">
              <Image size={10} className="text-[var(--info)] shrink-0" />
              <span className="text-[11px] text-[var(--info)]">Galeria automática</span>
            </div>
          )}
        </ReviewSection>

        {/* Equipe */}
        <ReviewSection
          icon={Users}
          title="Equipe"
          stepIndex={4}
          onEdit={setStep}
          filled={selectedTeam.length > 0}
          delay={0.08}
        >
          {selectedTeam.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedTeam.map((m) => (
                <Tag key={m.id}>{m.name}</Tag>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum membro selecionado</span>
          )}
        </ReviewSection>

        {/* Financeiro */}
        <ReviewSection
          icon={DollarSign}
          title="Financeiro"
          stepIndex={5}
          onEdit={setStep}
          filled={hasValue}
          delay={0.1}
        >
          {hasValue ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-[16px] font-bold text-[var(--fg)] tabular-nums tracking-[-0.02em]">
                  {formatCurrency(form.total_value)}
                </span>
                {form.payment_method && (
                  <Tag>{METHOD_LABELS[form.payment_method] || form.payment_method}</Tag>
                )}
              </div>
              {hasSplits && (
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {form.payment_splits.map((s, i) => (
                    <span key={i} className="text-[10px] text-[var(--fg-muted)] tabular-nums">
                      {s.label || `Parcela ${i + 1}`}: {s.percent}%
                      {s.due_date && ` · ${formatDate(s.due_date)}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Valor não definido</span>
          )}
        </ReviewSection>

        {/* Contrato */}
        <ReviewSection
          icon={FileText}
          title="Contrato"
          stepIndex={6}
          onEdit={setStep}
          filled={!!form.contract_file}
          delay={0.11}
        >
          {form.contract_file ? (
            <div className="flex flex-wrap gap-2">
              <Tag>{form.contract_name || form.contract_file.name}</Tag>
              <span className="text-[10px] text-[var(--fg-muted)]">
                {form.contract_file.size > 1024 * 1024
                  ? `${(form.contract_file.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(form.contract_file.size / 1024).toFixed(0)} KB`}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum contrato anexado</span>
          )}
        </ReviewSection>

        {/* Produtos */}
        <ReviewSection
          icon={ShoppingBag}
          title="Produtos"
          stepIndex={7}
          onEdit={setStep}
          filled={selectedProducts.length > 0}
          delay={0.13}
        >
          {selectedProducts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedProducts.map((p, i) => (
                <Tag key={i}>
                  {p.quantity > 1 && `${p.quantity}x `}
                  {p.name}
                </Tag>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--fg-muted)] italic">Nenhum produto selecionado</span>
          )}
        </ReviewSection>
      </div>

      {/* Observações */}
      <div className="mt-4 px-1">
        <div className="flex items-center gap-1.5 mb-2">
          <StickyNote size={12} className="text-[var(--fg-muted)]" />
          <span className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Observações</span>
        </div>
        <textarea
          value={form.notes}
          onChange={(e) => updateForm({ notes: e.target.value })}
          placeholder="Notas internas sobre o projeto (opcional)..."
          rows={3}
          className={`${INPUT_CLS} !h-auto resize-none`}
        />
      </div>
    </div>
  );
}
