/* ═══════════════════════════════════════════════════ */
/*  UploadDropzone — File upload area (MVP)            */
/*  States: idle | dragover | uploading | complete     */
/*  Visual-only progress (no real upload)              */
/*  CTA always black                                   */
/* ═══════════════════════════════════════════════════ */

import { Upload, Image, CheckCircle, LoaderCircle } from "lucide-react";

export type UploadDropzoneState = "idle" | "dragover" | "uploading" | "complete";

interface UploadDropzoneProps {
  state?: UploadDropzoneState;
  /** Progress 0-100 (only relevant when state=uploading) */
  progress?: number;
  /** Number of files uploaded (only relevant when state=complete) */
  fileCount?: number;
  /** Click handler */
  onClick?: () => void;
}

export function UploadDropzone({
  state = "idle",
  progress = 0,
  fileCount = 0,
  onClick,
}: UploadDropzoneProps) {
  if (state === "complete") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-10 rounded-2xl border-2 border-dashed border-[#E5E5EA] bg-[#FAFAFA] transition-all">
        <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-[#34C759]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[13px] text-[#34C759]"
            style={{ fontWeight: 500 }}
          >
            Upload concluído
          </span>
          <span
            className="text-[12px] text-[#8E8E93] numeric"
            style={{ fontWeight: 400 }}
          >
            {fileCount} arquivo{fileCount !== 1 && "s"} enviado{fileCount !== 1 && "s"}
          </span>
        </div>
      </div>
    );
  }

  if (state === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-10 rounded-2xl border-2 border-dashed border-[#E5E5EA] bg-[#FAFAFA] transition-all">
        <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
          <LoaderCircle className="w-5 h-5 text-[#D1D1D6] animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
          <span
            className="text-[13px] text-[#AEAEB2]"
            style={{ fontWeight: 500 }}
          >
            Enviando...
          </span>
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#AEAEB2] transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span
              className="text-[10px] text-[#C7C7CC] numeric shrink-0"
              style={{ fontWeight: 600 }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isDragover = state === "dragover";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label="Área de upload — arraste fotos ou pressione Enter para selecionar"
      className={`flex flex-col items-center justify-center gap-3 px-8 py-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
        isDragover
          ? "border-[#AEAEB2] bg-[#FAFAFA] scale-[1.01]"
          : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:bg-[#FAFAFA]"
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
        {isDragover ? (
          <Image className="w-5 h-5 text-[#C7C7CC]" />
        ) : (
          <Upload className="w-5 h-5 text-[#D1D1D6]" />
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span
          className={`text-[13px] transition-colors ${isDragover ? "text-[#8E8E93]" : "text-[#AEAEB2]"}`}
          style={{ fontWeight: 500 }}
        >
          {isDragover ? "Solte os arquivos aqui" : "Arraste fotos ou clique para enviar"}
        </span>
        <span
          className="text-[11px] text-[#D1D1D6]"
          style={{ fontWeight: 400 }}
        >
          JPG, PNG, RAW, TIFF — Máx 50MB por arquivo
        </span>
      </div>
      {!isDragover && (
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_2px_#E5E5EA] mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E8E93] focus-visible:ring-offset-1"
          style={{ fontWeight: 500 }}
        >
          <Upload className="w-3 h-3" />
          Selecionar arquivos
        </button>
      )}
    </div>
  );
}