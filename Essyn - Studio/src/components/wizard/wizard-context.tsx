"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { WizardFormData } from "@/lib/types";
import { INITIAL_WIZARD_DATA } from "@/lib/types";

interface WizardContextValue {
  form: WizardFormData;
  updateForm: (partial: Partial<WizardFormData>) => void;
  currentStep: number;
  setStep: (step: number) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  resetForm: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children, initialData, initialStep = 0 }: { children: ReactNode; initialData?: Partial<WizardFormData>; initialStep?: number }) {
  const [form, setForm] = useState<WizardFormData>({ ...INITIAL_WIZARD_DATA, ...initialData });
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = useCallback((partial: Partial<WizardFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const setStep = useCallback((step: number) => {
    if (step >= 0 && step <= 8) setCurrentStep(step);
  }, []);

  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_WIZARD_DATA, ...initialData });
    setCurrentStep(initialStep);
    setIsSubmitting(false);
  }, [initialData, initialStep]);

  return (
    <WizardContext.Provider
      value={{ form, updateForm, currentStep, setStep, isSubmitting, setIsSubmitting, resetForm }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
