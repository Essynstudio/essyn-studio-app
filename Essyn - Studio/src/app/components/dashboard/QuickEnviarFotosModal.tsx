import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  FolderOpen,
  LoaderCircle,
  CircleCheck,
  File,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { AppleModal, CTAButton } from "../ui/apple-kit";
import { C, FOCUS_RING } from "../../lib/apple-style";
import { springContentIn, springBounce } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ModalState = "form" | "uploading" | "success";

interface FilePreview {
  id: string;
  name: string;
  size: number;
  preview?: string;
}

interface QuickEnviarFotosModalProps {
  open: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                         */
/* ═══════════════════════════════════════════════════ */

export function QuickEnviarFotosModal({ open, onClose }: QuickEnviarFotosModalProps) {
  const dk = useDk();
  const [state, setState] = useState<ModalState>("form");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [projeto, setProjeto] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setState("form");
        setFiles([]);
        setProjeto("");
        setUploadProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  // Remove file
  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Handle submit
  async function handleSubmit() {
    if (files.length === 0) {
      toast.error("Selecione pelo menos uma foto");
      return;
    }

    setState("uploading");
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    await new Promise((r) => setTimeout(r, 1500));

    setState("success");
    const countLabel = files.length === 1 ? "foto enviada" : "fotos enviadas";
    toast.success(files.length + " " + countLabel + " com sucesso!");

    setTimeout(() => {
      onClose();
    }, 1500);
  }

  const canSubmit = files.length > 0;

  /* ── Dark-aware field styles ── */
  const inputWrapStyle: React.CSSProperties = {
    backgroundColor: dk.bg,
    borderColor: dk.border,
  };
  const inputWrapCls =
    "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all";
  const inputTextStyle: React.CSSProperties = { fontWeight: 400, color: dk.textPrimary };

  /* ── Footer ── */
  const footer =
    state === "form" ? (
      <div className="flex items-center gap-2 w-full">
        <CTAButton
          label="Cancelar"
          variant="secondary"
          onClick={onClose}
          className="flex-1 justify-center"
          radius={12}
        />
        <CTAButton
          label={"Enviar" + (files.length > 0 ? " (" + files.length + ")" : "")}
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 justify-center"
          radius={12}
        />
      </div>
    ) : undefined;

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Enviar fotos"
      subtitle="Upload de arquivos para o projeto"
      size="md"
      footer={footer}
      persistent={state === "uploading"}
    >
      <AnimatePresence mode="wait">
        {/* ── SUCCESS STATE ── */}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springBounce}
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: dk.successBg }}
            >
              <CircleCheck
                className="w-8 h-8"
                style={{ color: C.green }}
                strokeWidth={2}
              />
            </div>
            <h3
              className="text-[15px] text-center mb-2"
              style={{ fontWeight: 600, color: dk.textPrimary }}
            >
              Upload concluído!
            </h3>
            <p
              className="text-[13px] text-center"
              style={{ fontWeight: 400, color: dk.textSecondary }}
            >
              {files.length} {files.length === 1 ? "arquivo enviado" : "arquivos enviados"}
            </p>
          </motion.div>
        )}

        {/* ── UPLOADING STATE ── */}
        {state === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springContentIn}
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <LoaderCircle
              className="w-12 h-12 animate-spin mb-4"
              style={{ color: C.blue }}
              strokeWidth={2}
            />
            <h3
              className="text-[15px] text-center mb-2"
              style={{ fontWeight: 600, color: dk.textPrimary }}
            >
              Processando envio…
            </h3>
            <div className="w-full max-w-xs mt-4">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: dk.bgMuted }}
              >
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: uploadProgress + "%",
                    backgroundColor: C.blue,
                  }}
                />
              </div>
              <p
                className="text-[11px] text-center mt-2"
                style={{ fontWeight: 400, color: dk.textTertiary }}
              >
                {uploadProgress}%
              </p>
            </div>
          </motion.div>
        )}

        {/* ── FORM STATE ── */}
        {state === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springContentIn}
            className="flex flex-col gap-4"
          >
            {/* Projeto (opcional) */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Projeto (opcional)
              </label>
              <div className={inputWrapCls} style={inputWrapStyle}>
                <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={projeto}
                  onChange={(e) => setProjeto(e.target.value)}
                  placeholder="Selecione ou crie uma pasta"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
                  style={inputTextStyle}
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{
                borderColor: dk.border,
                backgroundColor: dk.bgHover,
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: dk.bgMuted }}
              >
                <Upload className="w-5 h-5" style={{ color: C.blue }} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p
                  className="text-[13px]"
                  style={{ fontWeight: 500, color: dk.textPrimary }}
                >
                  Clique para selecionar arquivos
                </p>
                <p
                  className="text-[11px]"
                  style={{ fontWeight: 400, color: dk.textTertiary }}
                >
                  JPG, PNG, RAW até 50MB cada
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-[11px]"
                    style={{ fontWeight: 500, color: dk.textMuted }}
                  >
                    Arquivos selecionados
                  </label>
                  <button
                    onClick={() => setFiles([])}
                    className="text-[11px] transition-colors cursor-pointer"
                    style={{ fontWeight: 500, color: C.red }}
                  >
                    Limpar tudo
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border group"
                      style={{
                        borderColor: dk.hairline,
                        backgroundColor: dk.bgHover,
                      }}
                    >
                      {file.preview ? (
                        <div
                          className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0"
                          style={{ backgroundImage: "url(" + file.preview + ")" }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: dk.bgMuted }}
                        >
                          <File className="w-4 h-4" style={{ color: dk.textDisabled }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] truncate"
                          style={{ fontWeight: 500, color: dk.textPrimary }}
                        >
                          {file.name}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ fontWeight: 400, color: dk.textTertiary }}
                        >
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        style={{ backgroundColor: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = dk.bgMuted)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Trash2
                          className="w-3.5 h-3.5"
                          style={{ color: C.red }}
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppleModal>
  );
}
