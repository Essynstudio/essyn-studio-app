import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  FolderOpen,
  User,
  Calendar,
  Lock,
  Globe,
  Key,
  Clock,
  Download,
  Heart,
  MessageSquare,
  Image,
  Upload,
  Droplet,
  Mail,
  Eye,
  CheckCircle2,
  Briefcase,
  Save,
  Copy,
  Sparkles,
  RefreshCw,
  Edit2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { GalleryPrivacy } from "../ui/gallery-privacy-badge";
import type { ColecaoFormData, Cliente, GalleryType } from "./types";
import { GALLERY_TYPES, MOCK_CLIENTES, MOCK_PROJETOS, COLLECTION_TEMPLATES } from "./presets";
import { Combobox, type ComboboxOption } from "./Combobox";
import { NovoClienteModal } from "./NovoClienteModal";
import { EmailTemplatePreview } from "./EmailTemplatePreview";
import { CopiarConfiguracoesModal } from "./CopiarConfiguracoesModal";
import { PasswordStrength } from "./PasswordStrength";
import { URLPreview } from "./URLPreview";
import { SmartPrefillBanner } from "./SmartPrefillBanner";
import { QuickShareWhatsApp } from "./QuickShareWhatsApp";

/* ═══════════════════════════════════════════════════ */
/*  WIZARD COMPLETO — TODAS AS 3 FASES IMPLEMENTADAS  */
/* ═══════════════════════════════════════════════════ */

const TOTAL_STEPS = 6;
const AUTOSAVE_INTERVAL = 5000; // 5 segundos

interface NovaColecaoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: ColecaoFormData, isDraft: boolean) => void;
}

export function NovaColecaoModal({ open, onClose, onSubmit }: NovaColecaoModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Modais auxiliares
  const [novoClienteModalOpen, setNovoClienteModalOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [copiarConfigModalOpen, setCopiarConfigModalOpen] = useState(false);
  
  // Smart Prefill
  const [smartPrefillDismissed, setSmartPrefillDismissed] = useState(false);

  // Step 1: Informações básicas
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [projeto, setProjeto] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [tipoGaleria, setTipoGaleria] = useState<GalleryType>("wedding");
  const [dataEvento, setDataEvento] = useState("");

  // Step 2: Privacidade
  const [privacy, setPrivacy] = useState<GalleryPrivacy>("senha");
  const [senha, setSenha] = useState("");
  const [dataExpiracao, setDataExpiracao] = useState("");
  const [permitirIndexacao, setPermitirIndexacao] = useState(false);

  // Step 3: Permissões
  const [permiteDownload, setPermiteDownload] = useState(true);
  const [tipoDownload, setTipoDownload] = useState<"original" | "alta-res" | "web-res">("alta-res");
  const [permiteFavoritar, setPermiteFavoritar] = useState(true);
  const [permiteComentarios, setPermiteComentarios] = useState(true);
  const [permiteSelecionar, setPermiteSelecionar] = useState(true);
  const [limiteSelecoes, setLimiteSelecoes] = useState("");
  const [permiteUploadCliente, setPermiteUploadCliente] = useState(false);

  // Step 4: Marca d'água
  const [marcaDagua, setMarcaDagua] = useState(true);
  const [posicaoMarcaDagua, setPosicaoMarcaDagua] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center">("bottom-right");
  const [logoPersonalizado, setLogoPersonalizado] = useState("");
  const [corTema, setCorTema] = useState("#007AFF");

  // Step 5: Notificações
  const [notificarCliente, setNotificarCliente] = useState(true);
  const [templateEmail, setTemplateEmail] = useState<"padrao" | "minimalista" | "elegante">("elegante");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState("");

  // Validação em tempo real
  const [nomeError, setNomeError] = useState("");
  const [clienteError, setClienteError] = useState("");
  const [senhaError, setSenhaError] = useState("");

  // Lista dinâmica de clientes (atualizada ao criar novo)
  const [clientes, setClientes] = useState(MOCK_CLIENTES);

  // FASE 1: Focus trap + autosave
  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open, currentStep]);

  // Autosave rascunho a cada 5 segundos
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const formData = buildFormData();
      localStorage.setItem("galeria-draft", JSON.stringify(formData));
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [open, nome, cliente, tipoGaleria]); // Dependências mínimas

  // Recuperar rascunho ao abrir
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem("galeria-draft");
      if (draft) {
        try {
          const data: ColecaoFormData = JSON.parse(draft);
          if (data.nome) {
            const shouldRecover = window.confirm(
              "Encontramos um rascunho não salvo. Deseja recuperá-lo?"
            );
            if (shouldRecover) {
              loadFormData(data);
              toast.info("Rascunho recuperado!");
            } else {
              localStorage.removeItem("galeria-draft");
            }
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }
    }
  }, [open]);

  // ESC fecha modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
      // FASE 3: Navegação por teclado
      if (e.ctrlKey && e.key === "Enter" && open && currentStep === TOTAL_STEPS) {
        handleSubmit(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStep]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCurrentStep(1);
        resetForm();
      }, 200);
    }
  }, [open]);

  function resetForm() {
    setNome("");
    setCliente("");
    setClienteId("");
    setProjeto("");
    setProjetoId("");
    setTipoGaleria("wedding");
    setDataEvento("");
    setPrivacy("senha");
    setSenha("");
    setDataExpiracao("");
    setPermitirIndexacao(false);
    setPermiteDownload(true);
    setTipoDownload("alta-res");
    setPermiteFavoritar(true);
    setPermiteComentarios(true);
    setPermiteSelecionar(true);
    setLimiteSelecoes("");
    setPermiteUploadCliente(false);
    setMarcaDagua(true);
    setPosicaoMarcaDagua("bottom-right");
    setLogoPersonalizado("");
    setCorTema("#007AFF");
    setNotificarCliente(true);
    setTemplateEmail("elegante");
    setMensagemPersonalizada("");
    setDataEntregaPrevista("");
    setNomeError("");
    setClienteError("");
    setSenhaError("");
  }

  // FASE 1: Validação em tempo real
  useEffect(() => {
    if (nome.trim() && nomeError) setNomeError("");
  }, [nome, nomeError]);

  useEffect(() => {
    if (clienteId && clienteError) setClienteError("");
  }, [clienteId, clienteError]);

  useEffect(() => {
    if (privacy === "senha") {
      if (senha.trim() && senhaError) setSenhaError("");
    } else {
      setSenhaError("");
    }
  }, [senha, privacy, senhaError]);

  function validateStep(step: number): boolean {
    if (step === 1) {
      let hasError = false;

      if (!nome.trim()) {
        setNomeError("Nome da coleção é obrigatório");
        hasError = true;
      }

      if (!clienteId) {
        setClienteError("Cliente é obrigatório");
        hasError = true;
      }

      return !hasError;
    }

    if (step === 2) {
      if (privacy === "senha" && !senha.trim()) {
        setSenhaError("Senha é obrigatória quando privacidade = 'Senha'");
        return false;
      }
      return true;
    }

    return true;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  // FASE 3: Editar step específico da revisão
  function goToStep(step: number) {
    setCurrentStep(step);
  }

  function buildFormData(): ColecaoFormData {
    return {
      nome,
      cliente,
      clienteId,
      projeto,
      projetoId,
      tipoGaleria,
      dataEvento,
      privacy,
      senha,
      dataExpiracao,
      permitirIndexacao,
      permiteDownload,
      tipoDownload,
      permiteFavoritar,
      permiteComentarios,
      permiteSelecionar,
      limiteSelecoes: limiteSelecoes ? parseInt(limiteSelecoes) : undefined,
      permiteUploadCliente,
      marcaDagua,
      posicaoMarcaDagua,
      logoPersonalizado,
      corTema,
      notificarCliente,
      templateEmail,
      mensagemPersonalizada,
      dataEntregaPrevista,
      status: "previa",
    };
  }

  function loadFormData(data: ColecaoFormData) {
    setNome(data.nome || "");
    setCliente(data.cliente || "");
    setClienteId(data.clienteId || "");
    setProjeto(data.projeto || "");
    setProjetoId(data.projetoId || "");
    setTipoGaleria(data.tipoGaleria || "wedding");
    setDataEvento(data.dataEvento || "");
    setPrivacy(data.privacy || "senha");
    setSenha(data.senha || "");
    setDataExpiracao(data.dataExpiracao || "");
    setPermitirIndexacao(data.permitirIndexacao || false);
    setPermiteDownload(data.permiteDownload ?? true);
    setTipoDownload(data.tipoDownload || "alta-res");
    setPermiteFavoritar(data.permiteFavoritar ?? true);
    setPermiteComentarios(data.permiteComentarios ?? true);
    setPermiteSelecionar(data.permiteSelecionar ?? true);
    setLimiteSelecoes(data.limiteSelecoes ? String(data.limiteSelecoes) : "");
    setPermiteUploadCliente(data.permiteUploadCliente || false);
    setMarcaDagua(data.marcaDagua ?? true);
    setPosicaoMarcaDagua(data.posicaoMarcaDagua || "bottom-right");
    setLogoPersonalizado(data.logoPersonalizado || "");
    setCorTema(data.corTema || "#007AFF");
    setNotificarCliente(data.notificarCliente ?? true);
    setTemplateEmail(data.templateEmail || "elegante");
    setMensagemPersonalizada(data.mensagemPersonalizada || "");
    setDataEntregaPrevista(data.dataEntregaPrevista || "");
  }

  async function handleSubmit(isDraft: boolean) {
    if (!isDraft && !validateStep(currentStep)) return;

    const formData = buildFormData();

    setIsSubmitting(true);

    // Simular criação
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsSubmitting(false);
    onSubmit?.(formData, isDraft);
    localStorage.removeItem("galeria-draft"); // Limpar rascunho salvo
    onClose();

    if (isDraft) {
      toast.success("Rascunho salvo!", { description: formData.nome || "Coleção", duration: 2000 });
    }
  }

  // FASE 2: Gerador de senha
  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    setSenha(password);
    toast.success("Senha gerada!", { description: password, duration: 3000 });
  }

  // FASE 2: Copiar configurações
  function handleCopiarConfig(config: Partial<ColecaoFormData>) {
    loadFormData({ ...buildFormData(), ...config });
    toast.success("Configurações copiadas!");
  }

  // FASE 2: Aplicar template
  function applyTemplate(templateId: string) {
    const template = COLLECTION_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      loadFormData({ ...buildFormData(), ...template.config });
      toast.success("Template aplicado!", { description: template.nome, duration: 2000 });
    }
  }

  // Smart Prefill
  function handleApplySmartPrefill(config: Partial<ColecaoFormData>) {
    loadFormData({ ...buildFormData(), ...config });
    setSmartPrefillDismissed(true);
    toast.success("Configuração inteligente aplicada!", { duration: 2000 });
  }

  // FASE 2: Criar novo cliente
  function handleNovoCliente(newCliente: Cliente) {
    setClientes([...clientes, newCliente]);
    setClienteId(newCliente.id);
    setCliente(newCliente.nome);
  }

  if (!open) return null;

  const clienteOptions: ComboboxOption[] = clientes.map((c) => ({
    value: c.id,
    label: c.nome,
    sublabel: c.email,
  }));

  const projetoOptions: ComboboxOption[] = MOCK_PROJETOS.map((p) => ({
    value: p.id,
    label: p.nome,
    sublabel: clientes.find((c) => c.id === p.clienteId)?.nome,
  }));

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-[#1D1D1F]"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header fixo */}
          <div className="shrink-0 border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between bg-white">
            <div className="flex flex-col gap-1">
              <h2 id="modal-title" className="text-[18px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
                Nova coleção
              </h2>
              <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                Etapa {currentStep} de {TOTAL_STEPS}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* FASE 2: Copiar configurações */}
              <button
                onClick={() => setCopiarConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-[#636366] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Copiar de outra coleção"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="shrink-0 px-6 py-4 border-b border-[#E5E5EA] bg-[#FAFAFA]">
            <div
              className="flex items-center gap-2"
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label={"Etapa " + currentStep + " de " + TOTAL_STEPS}
            >
              {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                  <div key={stepNum} className="flex items-center gap-2 flex-1">
                    <div
                      className={"flex items-center justify-center w-6 h-6 rounded-full text-[11px] transition-all " + (
                        isCompleted
                          ? "bg-[#34C759] text-white"
                          : isActive
                          ? "bg-[#007AFF] text-white"
                          : "bg-[#E5E5EA] text-[#D1D1D6]"
                      )}
                      style={{ fontWeight: 600 }}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                    </div>
                    {stepNum < TOTAL_STEPS && (
                      <div className={"h-0.5 flex-1 rounded " + (isCompleted ? "bg-[#34C759]" : "bg-[#E5E5EA]")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1
                  key="step1"
                  {...{
                    nome,
                    setNome,
                    nomeError,
                    cliente,
                    clienteId,
                    setClienteId,
                    setCliente,
                    clienteError,
                    clienteOptions,
                    setNovoClienteModalOpen,
                    projeto,
                    projetoId,
                    setProjetoId,
                    setProjeto,
                    projetoOptions,
                    tipoGaleria,
                    setTipoGaleria,
                    dataEvento,
                    setDataEvento,
                    applyTemplate,
                    firstInputRef,
                    marcaDagua,
                    smartPrefillDismissed,
                    setSmartPrefillDismissed,
                    handleApplySmartPrefill,
                  }}
                />
              )}
              {currentStep === 2 && (
                <Step2
                  key="step2"
                  {...{
                    privacy,
                    setPrivacy,
                    senha,
                    setSenha,
                    senhaError,
                    generatePassword,
                    dataExpiracao,
                    setDataExpiracao,
                    permitirIndexacao,
                    setPermitirIndexacao,
                  }}
                />
              )}
              {currentStep === 3 && (
                <Step3
                  key="step3"
                  {...{
                    permiteDownload,
                    setPermiteDownload,
                    tipoDownload,
                    setTipoDownload,
                    permiteFavoritar,
                    setPermiteFavoritar,
                    permiteComentarios,
                    setPermiteComentarios,
                    permiteSelecionar,
                    setPermiteSelecionar,
                    limiteSelecoes,
                    setLimiteSelecoes,
                    permiteUploadCliente,
                    setPermiteUploadCliente,
                  }}
                />
              )}
              {currentStep === 4 && (
                <Step4
                  key="step4"
                  {...{
                    marcaDagua,
                    setMarcaDagua,
                    posicaoMarcaDagua,
                    setPosicaoMarcaDagua,
                    logoPersonalizado,
                    setLogoPersonalizado,
                    corTema,
                    setCorTema,
                  }}
                />
              )}
              {currentStep === 5 && (
                <Step5
                  key="step5"
                  {...{
                    notificarCliente,
                    setNotificarCliente,
                    templateEmail,
                    setTemplateEmail,
                    mensagemPersonalizada,
                    setMensagemPersonalizada,
                    dataEntregaPrevista,
                    setDataEntregaPrevista,
                    setEmailPreviewOpen,
                    clienteNome: cliente,
                    colecaoNome: nome,
                  }}
                />
              )}
              {currentStep === 6 && (
                <Step6
                  key="step6"
                  formData={buildFormData()}
                  goToStep={goToStep}
                  clienteNome={cliente}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer fixo */}
          <div className="shrink-0 border-t border-[#E5E5EA] px-6 py-4 flex items-center justify-between bg-white">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] text-[#AEAEB2] hover:bg-[#F2F2F7] hover:text-[#636366] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar
            </button>

            <div className="flex items-center gap-2">
              {/* FASE 2: Salvar como rascunho */}
              <button
                onClick={() => handleSubmit(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] text-[#636366] border border-[#E5E5EA] hover:bg-[#F2F2F7] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Salvar e continuar depois"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar rascunho
              </button>

              {currentStep < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Próximo
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{ fontWeight: 600 }}
                  title="Ctrl + Enter"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Clock className="w-3.5 h-3.5" />
                      </motion.div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Criar coleção
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modais auxiliares */}
      <NovoClienteModal
        open={novoClienteModalOpen}
        onClose={() => setNovoClienteModalOpen(false)}
        onSubmit={handleNovoCliente}
      />

      <EmailTemplatePreview
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        template={templateEmail}
        clienteNome={cliente}
        colecaoNome={nome}
        mensagemPersonalizada={mensagemPersonalizada}
      />

      <CopiarConfiguracoesModal
        open={copiarConfigModalOpen}
        onClose={() => setCopiarConfigModalOpen(false)}
        onSelect={handleCopiarConfig}
      />
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 1 — Informações Básicas + Templates          */
/* ═══════════════════════════════════════════════════ */

function Step1({
  nome,
  setNome,
  nomeError,
  cliente,
  clienteId,
  setClienteId,
  setCliente,
  clienteError,
  clienteOptions,
  setNovoClienteModalOpen,
  projetoId,
  setProjetoId,
  setProjeto,
  projetoOptions,
  tipoGaleria,
  setTipoGaleria,
  dataEvento,
  setDataEvento,
  applyTemplate,
  firstInputRef,
  marcaDagua,
  smartPrefillDismissed,
  setSmartPrefillDismissed,
  handleApplySmartPrefill,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      {/* Smart Prefill Banner */}
      {!smartPrefillDismissed && tipoGaleria && (
        <SmartPrefillBanner
          tipoGaleria={tipoGaleria}
          clienteNome={cliente}
          onApply={handleApplySmartPrefill}
          onDismiss={() => setSmartPrefillDismissed(true)}
          marcaDagua={marcaDagua}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
            Informações básicas
          </h3>
          <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Defina os dados essenciais da sua nova coleção
          </p>
        </div>

        {/* FASE 3: Templates rápidos */}
        <div className="flex items-center gap-1">
          {COLLECTION_TEMPLATES.slice(0, 2).map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#636366] bg-[#F2F2F7] hover:bg-[#007AFF] hover:text-white transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
              title={template.descricao}
            >
              <Sparkles className="w-3 h-3" />
              {template.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Nome da coleção */}
      <div className="flex flex-col gap-2">
        <label htmlFor="nome-colecao" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Nome da coleção <span className="text-[#FF3B30]">*</span>
        </label>
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
          <input
            id="nome-colecao"
            ref={firstInputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Casamento Silva & Oliveira"
            aria-required="true"
            aria-invalid={!!nomeError}
            aria-describedby={nomeError ? "nome-error" : undefined}
            className={"w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-[13px] text-[#48484A] placeholder:text-[#D1D1D6] focus-visible:outline-none transition-all " + (
              nomeError
                ? "border-[#FF3B30] ring-2 ring-[#FBF5F4]"
                : "border-[#E5E5EA] focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7]"
            )}
            style={{ fontWeight: 400 }}
          />
        </div>
        {nomeError && (
          <span id="nome-error" role="alert" className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
            {nomeError}
          </span>
        )}
        
        {/* URL Preview em tempo real */}
        <URLPreview nome={nome} cliente={cliente} />
      </div>

      {/* Cliente com Combobox */}
      <div className="flex flex-col gap-2">
        <label htmlFor="cliente" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Cliente <span className="text-[#FF3B30]">*</span>
        </label>
        <Combobox
          options={clienteOptions}
          value={clienteId}
          onChange={(val) => {
            setClienteId(val);
            const cl = clienteOptions.find((c) => c.value === val);
            setCliente(cl?.label || "");
          }}
          placeholder="Selecionar cliente"
          icon={<User className="w-3.5 h-3.5" />}
          error={clienteError}
        />
        {clienteError && (
          <span role="alert" className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
            {clienteError}
          </span>
        )}
        <button
          onClick={() => setNovoClienteModalOpen(true)}
          className="text-[11px] text-[#007AFF] hover:text-[#0066D6] transition-all self-start cursor-pointer flex items-center gap-1"
          style={{ fontWeight: 500 }}
        >
          <User className="w-3 h-3" />
          Criar novo cliente
        </button>
      </div>

      {/* Projeto com Combobox */}
      <div className="flex flex-col gap-2">
        <label htmlFor="projeto" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Projeto vinculado <span className="text-[#AEAEB2]">(opcional)</span>
        </label>
        <Combobox
          options={projetoOptions}
          value={projetoId}
          onChange={(val) => {
            setProjetoId(val);
            const pr = projetoOptions.find((p) => p.value === val);
            setProjeto(pr?.label || "");
          }}
          placeholder="Selecionar projeto (opcional)"
          icon={<Briefcase className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Tipo de galeria com tooltips */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Tipo de galeria
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GALLERY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setTipoGaleria(type.value)}
              className={"group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer " + (
                tipoGaleria === type.value
                  ? "border-[#007AFF] bg-[#F2F2F7] shadow-[0_0_0_1px_#007AFF]"
                  : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:bg-[#FAFAFA]"
              )}
              title={type.tooltip}
            >
              <div
                className={"w-8 h-8 rounded-xl flex items-center justify-center " + (
                  tipoGaleria === type.value ? "bg-[#007AFF] text-white" : "bg-[#F2F2F7] text-[#AEAEB2]"
                )}
              >
                {type.icon}
              </div>
              <span className="text-[11px] text-[#636366] text-center" style={{ fontWeight: 500 }}>
                {type.label}
              </span>

              {/* Tooltip ao hover */}
              {type.tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-[#1D1D1F] text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ fontWeight: 400 }}>
                  {type.tooltip}
                  <HelpCircle className="w-2.5 h-2.5 inline ml-1" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data do evento */}
      <div className="flex flex-col gap-2">
        <label htmlFor="data-evento" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Data do evento <span className="text-[#8E8E93]">(opcional)</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
          <input
            id="data-evento"
            type="date"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#48484A] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all cursor-pointer"
            style={{ fontWeight: 400 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 2 — Privacidade + Gerador de Senha           */
/* ═══════════════════════════════════════════════════ */

function Step2({
  privacy,
  setPrivacy,
  senha,
  setSenha,
  senhaError,
  generatePassword,
  dataExpiracao,
  setDataExpiracao,
  permitirIndexacao,
  setPermitirIndexacao,
}: any) {
  const privacyOptions: { value: GalleryPrivacy; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "publico", label: "Público", description: "Qualquer pessoa com o link pode acessar", icon: <Globe className="w-4 h-4" /> },
    { value: "senha", label: "Protegido por senha", description: "Requer senha para visualizar", icon: <Lock className="w-4 h-4" /> },
    { value: "privado", label: "Privado", description: "Apenas você pode acessar", icon: <Key className="w-4 h-4" /> },
    { value: "expira", label: "Link temporário", description: "Expira após data definida", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
          Privacidade e acesso
        </h3>
        <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          Controle quem pode visualizar sua coleção
        </p>
      </div>

      {/* Tipo de privacidade */}
      <div className="flex flex-col gap-3">
        {privacyOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPrivacy(opt.value)}
            className={"flex items-start gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer " + (
              privacy === opt.value
                ? "border-[#007AFF] bg-[#F2F2F7] shadow-[0_0_0_1px_#007AFF]"
                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:bg-[#FAFAFA]"
            )}
          >
            <div
              className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + (
                privacy === opt.value ? "bg-[#007AFF] text-white" : "bg-[#F2F2F7] text-[#AEAEB2]"
              )}
            >
              {opt.icon}
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-[13px] text-[#48484A]" style={{ fontWeight: 600 }}>
                {opt.label}
              </span>
              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                {opt.description}
              </span>
            </div>
            {privacy === opt.value && (
              <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Campo senha com gerador */}
      {privacy === "senha" && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
          <label htmlFor="senha" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
            Senha de acesso <span className="text-[#FF3B30]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Ex: silva2026"
              aria-required="true"
              aria-invalid={!!senhaError}
              aria-describedby={senhaError ? "senha-error" : undefined}
              className={"flex-1 px-3 py-2.5 rounded-xl border bg-white text-[13px] text-[#48484A] placeholder:text-[#D1D1D6] focus-visible:outline-none transition-all " + (
                senhaError
                  ? "border-[#FF3B30] ring-2 ring-[#FBF5F4]"
                  : "border-[#E5E5EA] focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7]"
              )}
              style={{ fontWeight: 400 }}
            />
            {/* FASE 2: Gerador de senha */}
            <button
              onClick={generatePassword}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] transition-all cursor-pointer shrink-0"
              style={{ fontWeight: 500 }}
              title="Gerar senha aleatória"
            >
              <RefreshCw className="w-3 h-3" />
              Gerar
            </button>
          </div>
          {senhaError && (
            <span id="senha-error" role="alert" className="text-[11px] text-[#FF3B30]" style={{ fontWeight: 500 }}>
              {senhaError}
            </span>
          )}
          
          {/* Password Strength Indicator */}
          <PasswordStrength password={senha} />
          
          <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            Escolha uma senha fácil de lembrar para compartilhar com seu cliente
          </p>
        </div>
      )}

      {/* Data de expiração */}
      {(privacy === "expira" || privacy === "publico" || privacy === "senha") && (
        <div className="flex flex-col gap-2">
          <label htmlFor="data-expiracao" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
            Data de expiração <span className="text-[#8E8E93]">(opcional)</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
            <input
              id="data-expiracao"
              type="date"
              value={dataExpiracao}
              onChange={(e) => setDataExpiracao(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#48484A] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all cursor-pointer"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      )}

      {/* Indexação */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <div className="flex-1">
          <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
            Permitir indexação
          </span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Aparecer em buscadores como Google
          </span>
        </div>
        <button
          onClick={() => setPermitirIndexacao(!permitirIndexacao)}
          className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
            permitirIndexacao ? "bg-[#34C759]" : "bg-[#E5E5EA]"
          )}
          aria-label="Toggle indexação"
          aria-pressed={permitirIndexacao}
        >
          <motion.div
            animate={{ x: permitirIndexacao ? 22 : 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
          />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 3 — Permissões do Cliente                    */
/* ═══════════════════════════════════════════════════ */

function Step3({
  permiteDownload,
  setPermiteDownload,
  tipoDownload,
  setTipoDownload,
  permiteFavoritar,
  setPermiteFavoritar,
  permiteComentarios,
  setPermiteComentarios,
  permiteSelecionar,
  setPermiteSelecionar,
  limiteSelecoes,
  setLimiteSelecoes,
  permiteUploadCliente,
  setPermiteUploadCliente,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
          Permissões do cliente
        </h3>
        <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          Defina o que o cliente pode fazer na galeria
        </p>
      </div>

      {/* Download */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <div className="flex items-start gap-3">
          <Download className="w-4 h-4 text-[#007AFF] mt-0.5" />
          <div className="flex-1">
            <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
              Permitir download
            </span>
            <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              Cliente pode baixar as fotos
            </span>
          </div>
          <button
            onClick={() => setPermiteDownload(!permiteDownload)}
            className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
              permiteDownload ? "bg-[#34C759]" : "bg-[#E5E5EA]"
            )}
            aria-label="Toggle download"
            aria-pressed={permiteDownload}
          >
            <motion.div
              animate={{ x: permiteDownload ? 22 : 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
            />
          </button>
        </div>

        {permiteDownload && (
          <div className="flex flex-col gap-2 pl-7">
            <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Qualidade do download:
            </span>
            <div className="flex items-center gap-2">
              {[
                { value: "original", label: "Original" },
                { value: "alta-res", label: "Alta resolução" },
                { value: "web-res", label: "Web" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTipoDownload(opt.value)}
                  className={"px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer " + (
                    tipoDownload === opt.value
                      ? "bg-[#007AFF] text-white"
                      : "bg-[#F2F2F7] text-[#636366] hover:bg-[#E5E5EA]"
                  )}
                  style={{ fontWeight: 500 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Favoritar */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <Heart className="w-4 h-4 text-[#007AFF] mt-0.5" />
        <div className="flex-1">
          <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
            Permitir favoritos
          </span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Cliente pode marcar fotos favoritas
          </span>
        </div>
        <button
          onClick={() => setPermiteFavoritar(!permiteFavoritar)}
          className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
            permiteFavoritar ? "bg-[#34C759]" : "bg-[#E5E5EA]"
          )}
          aria-label="Toggle favoritos"
          aria-pressed={permiteFavoritar}
        >
          <motion.div
            animate={{ x: permiteFavoritar ? 22 : 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
          />
        </button>
      </div>

      {/* Comentários */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <MessageSquare className="w-4 h-4 text-[#007AFF] mt-0.5" />
        <div className="flex-1">
          <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
            Permitir comentários
          </span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Cliente pode comentar nas fotos
          </span>
        </div>
        <button
          onClick={() => setPermiteComentarios(!permiteComentarios)}
          className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
            permiteComentarios ? "bg-[#34C759]" : "bg-[#E5E5EA]"
          )}
          aria-label="Toggle comentários"
          aria-pressed={permiteComentarios}
        >
          <motion.div
            animate={{ x: permiteComentarios ? 22 : 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
          />
        </button>
      </div>

      {/* Seleção */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <div className="flex items-start gap-3">
          <Image className="w-4 h-4 text-[#007AFF] mt-0.5" />
          <div className="flex-1">
            <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
              Permitir seleção de fotos
            </span>
            <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              Cliente pode selecionar fotos para edição/entrega
            </span>
          </div>
          <button
            onClick={() => setPermiteSelecionar(!permiteSelecionar)}
            className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
              permiteSelecionar ? "bg-[#34C759]" : "bg-[#E5E5EA]"
            )}
            aria-label="Toggle seleção"
            aria-pressed={permiteSelecionar}
          >
            <motion.div
              animate={{ x: permiteSelecionar ? 22 : 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
            />
          </button>
        </div>

        {permiteSelecionar && (
          <div className="flex flex-col gap-2 pl-7">
            <label htmlFor="limite-selecoes" className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Limite de seleções (opcional):
            </label>
            <input
              id="limite-selecoes"
              type="number"
              value={limiteSelecoes}
              onChange={(e) => setLimiteSelecoes(e.target.value)}
              placeholder="Ex: 50"
              min="1"
              className="w-32 px-3 py-1.5 rounded-lg border border-[#E5E5EA] bg-white text-[12px] text-[#48484A] placeholder:text-[#D1D1D6] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-1 focus-visible:ring-[#F2F2F7] transition-all"
              style={{ fontWeight: 400 }}
            />
          </div>
        )}
      </div>

      {/* Upload cliente */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <Upload className="w-4 h-4 text-[#007AFF] mt-0.5" />
        <div className="flex-1">
          <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
            Permitir upload pelo cliente
          </span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Cliente pode enviar suas próprias fotos
          </span>
        </div>
        <button
          onClick={() => setPermiteUploadCliente(!permiteUploadCliente)}
          className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
            permiteUploadCliente ? "bg-[#34C759]" : "bg-[#E5E5EA]"
          )}
          aria-label="Toggle upload cliente"
          aria-pressed={permiteUploadCliente}
        >
          <motion.div
            animate={{ x: permiteUploadCliente ? 22 : 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
          />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 4 — Marca d'água (sem upload ainda)          */
/* ═══════════════════════════════════════════════════ */

function Step4({
  marcaDagua,
  setMarcaDagua,
  posicaoMarcaDagua,
  setPosicaoMarcaDagua,
  logoPersonalizado,
  setLogoPersonalizado,
  corTema,
  setCorTema,
}: any) {
  const posicoes = [
    { value: "top-left", label: "Superior esquerdo" },
    { value: "top-right", label: "Superior direito" },
    { value: "bottom-left", label: "Inferior esquerdo" },
    { value: "bottom-right", label: "Inferior direito" },
    { value: "center", label: "Centro" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
          Marca d'água e branding
        </h3>
        <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          Personalize a aparência da sua galeria
        </p>
      </div>

      {/* Marca d'água */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <div className="flex items-start gap-3">
          <Droplet className="w-4 h-4 text-[#007AFF] mt-0.5" />
          <div className="flex-1">
            <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
              Aplicar marca d'água
            </span>
            <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              Protege suas imagens com logo/texto
            </span>
          </div>
          <button
            onClick={() => setMarcaDagua(!marcaDagua)}
            className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
              marcaDagua ? "bg-[#34C759]" : "bg-[#E5E5EA]"
            )}
            aria-label="Toggle marca d'água"
            aria-pressed={marcaDagua}
          >
            <motion.div
              animate={{ x: marcaDagua ? 22 : 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
            />
          </button>
        </div>

        {marcaDagua && (
          <div className="flex flex-col gap-3 pl-7">
            <div className="flex flex-col gap-2">
              <label htmlFor="posicao-marca" className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                Posição:
              </label>
              <select
                id="posicao-marca"
                value={posicaoMarcaDagua}
                onChange={(e) => setPosicaoMarcaDagua(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E5EA] bg-white text-[12px] text-[#48484A] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-1 focus-visible:ring-[#F2F2F7] transition-all cursor-pointer appearance-none"
                style={{ fontWeight: 400 }}
              >
                {posicoes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                Logo personalizado:
              </span>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E5EA] bg-white text-[12px] text-[#636366] hover:bg-[#FAFAFA] hover:border-[#D1D1D6] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Funcionalidade em desenvolvimento"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload logo (em breve)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cor do tema */}
      <div className="flex flex-col gap-2">
        <label htmlFor="cor-tema" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Cor do tema da galeria
        </label>
        <div className="flex items-center gap-3">
          <input
            id="cor-tema"
            type="color"
            value={corTema}
            onChange={(e) => setCorTema(e.target.value)}
            className="w-12 h-12 rounded-xl border border-[#E5E5EA] cursor-pointer"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-[#48484A]" style={{ fontWeight: 500 }}>
              {corTema}
            </span>
            <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              Usado em botões e destaques
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            Presets:
          </span>
          {["#007AFF", "#34C759", "#AF52DE", "#FF3B30", "#1D1D1F"].map((color) => (
            <button
              key={color}
              onClick={() => setCorTema(color)}
              className="w-8 h-8 rounded-lg border border-[#E5E5EA] transition-all hover:scale-110 cursor-pointer"
              style={{ backgroundColor: color }}
              aria-label={"Cor " + color}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Preview visual INTERATIVO */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3.5 h-3.5 text-[#AEAEB2]" />
          <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
            Preview da galeria
          </span>
        </div>
        <div className="relative aspect-video rounded-lg bg-[#D1D1D6] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="w-12 h-12 text-[#AEAEB2]" />
          </div>
          {marcaDagua && (
            <motion.div
              key={posicaoMarcaDagua}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={"absolute text-white text-[8px] px-2 py-1 bg-[#1D1D1F] rounded " + (
                posicaoMarcaDagua === "top-left"
                  ? "top-2 left-2"
                  : posicaoMarcaDagua === "top-right"
                  ? "top-2 right-2"
                  : posicaoMarcaDagua === "bottom-left"
                  ? "bottom-2 left-2"
                  : posicaoMarcaDagua === "bottom-right"
                  ? "bottom-2 right-2"
                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              )}
              style={{ fontWeight: 500 }}
            >
              ESSYN
            </motion.div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <motion.button
              key={corTema}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-1.5 rounded-lg text-white text-[9px]"
              style={{ backgroundColor: corTema, fontWeight: 500 }}
            >
              Ver fotos
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 5 — Notificações + Preview Email             */
/* ═══════════════════════════════════════════════════ */

function Step5({
  notificarCliente,
  setNotificarCliente,
  templateEmail,
  setTemplateEmail,
  mensagemPersonalizada,
  setMensagemPersonalizada,
  dataEntregaPrevista,
  setDataEntregaPrevista,
  setEmailPreviewOpen,
  clienteNome,
  colecaoNome,
}: any) {
  const templates = [
    { value: "padrao", label: "Padrão", description: "Template simples e direto" },
    { value: "minimalista", label: "Minimalista", description: "Design clean e moderno" },
    { value: "elegante", label: "Elegante", description: "Premium com serifas" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
          Notificações e entrega
        </h3>
        <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          Configure como o cliente será informado
        </p>
      </div>

      {/* Notificar cliente */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E5EA]">
        <Mail className="w-4 h-4 text-[#007AFF] mt-0.5" />
        <div className="flex-1">
          <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
            Enviar email de notificação
          </span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Cliente recebe email quando a galeria ficar pronta
          </span>
        </div>
        <button
          onClick={() => setNotificarCliente(!notificarCliente)}
          className={"relative w-11 h-6 rounded-full transition-all cursor-pointer " + (
            notificarCliente ? "bg-[#34C759]" : "bg-[#E5E5EA]"
          )}
          aria-label="Toggle notificação"
          aria-pressed={notificarCliente}
        >
          <motion.div
            animate={{ x: notificarCliente ? 22 : 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_2px_#D1D1D6]"
          />
        </button>
      </div>

      {notificarCliente && (
        <>
          {/* Template de email */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                Template de email
              </label>
              {/* FASE 2: Preview email */}
              <button
                onClick={() => setEmailPreviewOpen(true)}
                className="flex items-center gap-1 text-[11px] text-[#007AFF] hover:text-[#0066D6] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Eye className="w-3 h-3" />
                Ver preview
              </button>
            </div>
            {templates.map((tmpl) => (
              <button
                key={tmpl.value}
                onClick={() => setTemplateEmail(tmpl.value)}
                className={"flex items-start gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer " + (
                  templateEmail === tmpl.value
                    ? "border-[#007AFF] bg-[#F2F2F7]"
                    : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:bg-[#FAFAFA]"
                )}
              >
                <div className="flex-1">
                  <span className="text-[13px] text-[#48484A] block mb-0.5" style={{ fontWeight: 500 }}>
                    {tmpl.label}
                  </span>
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                    {tmpl.description}
                  </span>
                </div>
                {templateEmail === tmpl.value && (
                  <div className="w-4 h-4 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mensagem personalizada */}
          <div className="flex flex-col gap-2">
            <label htmlFor="mensagem-personalizada" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
              Mensagem personalizada <span className="text-[#8E8E93]">(opcional)</span>
            </label>
            <textarea
              id="mensagem-personalizada"
              value={mensagemPersonalizada}
              onChange={(e) => setMensagemPersonalizada(e.target.value)}
              placeholder="Adicione uma mensagem especial para o cliente..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#48484A] placeholder:text-[#D1D1D6] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all resize-none"
              style={{ fontWeight: 400 }}
            />
          </div>
        </>
      )}

      {/* Data de entrega prevista */}
      <div className="flex flex-col gap-2">
        <label htmlFor="data-entrega" className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
          Data de entrega prevista <span className="text-[#8E8E93]">(opcional)</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D1D1D6]" />
          <input
            id="data-entrega"
            type="date"
            value={dataEntregaPrevista}
            onChange={(e) => setDataEntregaPrevista(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#48484A] focus-visible:outline-none focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#F2F2F7] transition-all cursor-pointer"
            style={{ fontWeight: 400 }}
          />
        </div>
      </div>

      {/* Quick Share WhatsApp */}
      <QuickShareWhatsApp
        clienteNome={clienteNome}
        colecaoNome={colecaoNome || "Sua galeria"}
        shareUrl={"essyn.co/g/" + (colecaoNome?.toLowerCase().replace(/\s+/g, "-") || "exemplo")}
        senha={undefined}
      />

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F4F7FB] border border-[#DCE7F3]">
        <Info className="w-4 h-4 text-[#007AFF] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
          Você pode enviar o email de notificação manualmente depois, na página de detalhes da coleção
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STEP 6 — Revisão Editável                         */
/* ═══════════════════════════════════════════════════ */

function Step6({ formData, goToStep, clienteNome }: { formData: ColecaoFormData; goToStep: (step: number) => void; clienteNome: string }) {
  const tipoGaleriaLabel = GALLERY_TYPES.find((t) => t.value === formData.tipoGaleria)?.label || "—";

  const sections = [
    {
      title: "Informações básicas",
      step: 1,
      items: [
        { label: "Nome", value: formData.nome || "—" },
        { label: "Cliente", value: clienteNome || "—" },
        { label: "Projeto", value: formData.projeto || "—" },
        { label: "Tipo de galeria", value: tipoGaleriaLabel },
        { label: "Data do evento", value: formData.dataEvento || "—" },
      ],
    },
    {
      title: "Privacidade",
      step: 2,
      items: [
        {
          label: "Tipo",
          value:
            formData.privacy === "publico"
              ? "Público"
              : formData.privacy === "senha"
              ? "Senha"
              : formData.privacy === "privado"
              ? "Privado"
              : "Link temporário",
        },
        { label: "Senha", value: formData.senha || "—" },
        { label: "Expira em", value: formData.dataExpiracao || "—" },
        { label: "Indexação", value: formData.permitirIndexacao ? "Sim" : "Não" },
      ],
    },
    {
      title: "Permissões",
      step: 3,
      items: [
        { label: "Download", value: formData.permiteDownload ? "Sim (" + formData.tipoDownload + ")" : "Não" },
        { label: "Favoritos", value: formData.permiteFavoritar ? "Sim" : "Não" },
        { label: "Comentários", value: formData.permiteComentarios ? "Sim" : "Não" },
        {
          label: "Seleção",
          value: formData.permiteSelecionar ? "Sim" + (formData.limiteSelecoes ? " (max " + formData.limiteSelecoes + ")" : "") : "Não",
        },
        { label: "Upload cliente", value: formData.permiteUploadCliente ? "Sim" : "Não" },
      ],
    },
    {
      title: "Branding",
      step: 4,
      items: [
        { label: "Marca d'água", value: formData.marcaDagua ? "Sim (" + formData.posicaoMarcaDagua + ")" : "Não" },
        { label: "Cor do tema", value: formData.corTema },
      ],
    },
    {
      title: "Notificações",
      step: 5,
      items: [
        { label: "Email cliente", value: formData.notificarCliente ? "Sim (" + formData.templateEmail + ")" : "Não" },
        { label: "Mensagem", value: formData.mensagemPersonalizada || "—" },
        { label: "Entrega prevista", value: formData.dataEntregaPrevista || "—" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>
          Revisão final
        </h3>
        <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          Confira todas as configurações antes de criar
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2 p-4 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[12px] text-[#007AFF] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                {section.title}
              </h4>
              {/* FASE 3: Editar step específico */}
              <button
                onClick={() => goToStep(section.step)}
                className="flex items-center gap-1 text-[11px] text-[#636366] hover:text-[#007AFF] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
                title={"Editar " + section.title}
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.04em]" style={{ fontWeight: 500 }}>
                    {item.label}
                  </span>
                  <span className="text-[12px] text-[#48484A]" style={{ fontWeight: 400 }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Success message preview */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F2F8F4] border border-[#D4EDDB]">
        <CheckCircle2 className="w-5 h-5 text-[#34C759] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-[#48484A]" style={{ fontWeight: 600 }}>
            Tudo pronto!
          </span>
          <span className="text-[11px] text-[#34C759]" style={{ fontWeight: 400 }}>
            Ao confirmar, sua coleção será criada e você poderá começar a fazer upload das fotos.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
