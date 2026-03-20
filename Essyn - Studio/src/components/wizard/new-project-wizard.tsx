"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppleModal } from "@/components/ui/apple-kit";
import { PRIMARY_CTA, SECONDARY_CTA } from "@/lib/design-tokens";
import { springSnappy } from "@/lib/motion-tokens";
import { WizardProvider, useWizard } from "./wizard-context";
import { WizardProgress } from "./wizard-progress";
import { StepClient } from "./steps/step-client";
import { StepEvent } from "./steps/step-event";
import { StepPack } from "./steps/step-pack";
import { StepWorkflow } from "./steps/step-workflow";
import { StepFinancial } from "./steps/step-financial";
import { StepTeam } from "./steps/step-team";
import { StepContract } from "./steps/step-contract";
import { StepProducts } from "./steps/step-products";
import { StepReview } from "./steps/step-review";
import { createProject } from "./create-project";
import { updateProject } from "./update-project";
import type { Pack, WorkflowTemplate, CatalogProduct, WizardFormData } from "@/lib/types";

/* ── Step metadata ──────────────────────────────── */
const STEP_META = [
  { title: "Quem é o cliente?", desc: "Selecione um cliente existente ou cadastre um novo." },
  { title: "Detalhes do evento", desc: "Nome do projeto, tipo, data e locais do evento." },
  { title: "Selecione um pacote", desc: "Escolha um pacote pré-definido ou monte o seu." },
  { title: "Produção", desc: "Escolha um modelo de produção e configure a entrega." },
  { title: "Equipe do evento", desc: "Selecione os membros da equipe para este projeto." },
  { title: "Valores e pagamento", desc: "Defina o valor e as condições de pagamento." },
  { title: "Contrato", desc: "Anexe o contrato em PDF (opcional)." },
  { title: "Produtos adicionais", desc: "Adicione álbuns, impressões ou outros produtos." },
  // Step 8 = Review (no header)
];

const TOTAL_STEPS = 9;

/* ── Props ──────────────────────────────────────── */
interface NewProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
  clients: { id: string; name: string; email: string | null; phone: string | null }[];
  packs: Pack[];
  workflowTemplates: WorkflowTemplate[];
  catalogProducts: CatalogProduct[];
  teamMembers: { id: string; name: string; role: string; avatar_url: string | null }[];
  studioId: string;
  /** Edit mode: existing project ID */
  editProjectId?: string;
  /** Edit mode: pre-filled form data */
  initialData?: Partial<WizardFormData>;
  /** Edit mode: target step to open at */
  initialStep?: number;
}

export function NewProjectWizard(props: NewProjectWizardProps) {
  const step = props.initialStep ?? (props.editProjectId ? 1 : 0);
  return (
    <WizardProvider initialData={props.initialData} initialStep={step}>
      <WizardInner {...props} />
    </WizardProvider>
  );
}

function WizardInner({
  open,
  onClose,
  onCreated,
  clients,
  packs,
  workflowTemplates,
  catalogProducts,
  teamMembers,
  studioId,
  editProjectId,
}: NewProjectWizardProps) {
  const isEditMode = !!editProjectId;
  const { form, currentStep, setStep, isSubmitting, setIsSubmitting, resetForm } = useWizard();

  // Dynamic data — items created inline during wizard
  const [dynamicPacks, setDynamicPacks] = useState<Pack[]>([]);
  const [dynamicTemplates, setDynamicTemplates] = useState<WorkflowTemplate[]>([]);
  const [dynamicTeam, setDynamicTeam] = useState<typeof teamMembers>([]);
  const [dynamicProducts, setDynamicProducts] = useState<CatalogProduct[]>([]);

  const allPacks = [...packs, ...dynamicPacks];
  const allTemplates = [...workflowTemplates, ...dynamicTemplates];
  const allTeam = [...teamMembers, ...dynamicTeam];
  const allProducts = [...catalogProducts, ...dynamicProducts];

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: return form.client_mode === "existing" ? !!form.client_id : !!form.client_name.trim();
      case 1: return !!form.project_name.trim();
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5:
        if (form.payment_splits.length > 0) {
          const total = form.payment_splits.reduce((s, p) => s + p.percent, 0);
          return Math.abs(total - 100) < 0.01;
        }
        return true;
      case 6: return true;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  }, [currentStep, form]);

  const handleNext = useCallback(() => {
    if (!canProceed()) {
      toast.error("Preencha os campos obrigatórios antes de continuar.");
      return;
    }
    if (!isLastStep) setStep(currentStep + 1);
  }, [canProceed, isLastStep, setStep, currentStep]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) setStep(currentStep - 1);
  }, [isFirstStep, setStep, currentStep]);

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { warnings } = await updateProject(editProjectId!, form, studioId);
        if (warnings.length > 0) {
          warnings.forEach((w) => toast.warning(w));
          toast.success("Projeto atualizado, mas com avisos.");
        } else {
          toast.success("Projeto atualizado com sucesso!");
        }
        resetForm();
        onCreated(editProjectId!);
      } else {
        const { projectId, warnings } = await createProject(form, studioId);
        if (warnings.length > 0) {
          warnings.forEach((w) => toast.warning(w));
          toast.success("Projeto criado, mas com avisos.");
        } else {
          toast.success("Projeto criado com sucesso!");
        }
        resetForm();
        onCreated(projectId);
      }
    } catch (err: any) {
      console.error("[Wizard] Submit error:", err);
      toast.error(err.message || (isEditMode ? "Erro ao atualizar projeto." : "Erro ao criar projeto."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDirty = (() => {
    if (isEditMode) return true;
    return currentStep > 0 || !!form.project_name.trim() || !!form.client_name.trim();
  })();

  const handleClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      const confirmed = window.confirm(
        "Tem certeza que deseja sair? Os dados não salvos serão perdidos."
      );
      if (!confirmed) return;
    }
    resetForm();
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight" && canProceed() && !isLastStep) {
        e.preventDefault();
        handleNext();
      }
      if (e.key === "ArrowLeft" && !isFirstStep) {
        e.preventDefault();
        handleBack();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, canProceed, isLastStep, isFirstStep, handleNext, handleBack]);

  const stepMeta = STEP_META[currentStep];

  return (
    <AppleModal open={open} onClose={handleClose} title={isEditMode ? "Editar Projeto" : "Novo Projeto"} maxWidth="max-w-2xl">
      {/* Progress */}
      <div className="border-b border-[var(--border)]">
        <WizardProgress currentStep={currentStep} />
      </div>

      {/* Step content */}
      <div className="px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springSnappy}
          >
            {/* Step heading */}
            {stepMeta && (
              <div className="mb-5">
                <h3 className="text-[17px] font-semibold text-[var(--fg)] tracking-[-0.016em]">
                  {stepMeta.title}
                </h3>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-1">
                  {stepMeta.desc}
                </p>
              </div>
            )}

            {currentStep === 0 && <StepClient clients={clients} />}
            {currentStep === 1 && <StepEvent />}
            {currentStep === 2 && (
              <StepPack
                packs={allPacks}
                studioId={studioId}
                onPackCreated={(p) => setDynamicPacks((prev) => [...prev, p])}
              />
            )}
            {currentStep === 3 && (
              <StepWorkflow
                studioId={studioId}
                teamMembers={allTeam}
              />
            )}
            {currentStep === 4 && (
              <StepTeam
                teamMembers={allTeam}
                studioId={studioId}
                onMemberCreated={(m) => setDynamicTeam((prev) => [...prev, m])}
              />
            )}
            {currentStep === 5 && <StepFinancial />}
            {currentStep === 6 && <StepContract />}
            {currentStep === 7 && (
              <StepProducts
                catalogProducts={allProducts}
                studioId={studioId}
                onProductCreated={(p) => setDynamicProducts((prev) => [...prev, p])}
              />
            )}
            {currentStep === 8 && (
              <StepReview
                packs={allPacks}
                catalogProducts={allProducts}
                teamMembers={allTeam}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)]">
        <div>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className={SECONDARY_CTA}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--fg-muted)] tabular-nums mr-1 sm:mr-2">
            {currentStep + 1}/{TOTAL_STEPS}
          </span>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className={PRIMARY_CTA}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isSubmitting ? (isEditMode ? "Salvando..." : "Criando...") : (isEditMode ? "Salvar" : "Criar Projeto")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={PRIMARY_CTA}
            >
              Próximo
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </AppleModal>
  );
}
