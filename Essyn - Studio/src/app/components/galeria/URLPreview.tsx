import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface URLPreviewProps {
  nome: string;
  cliente: string;
}

export function URLPreview({ nome, cliente }: URLPreviewProps) {
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!nome && !cliente) return "";

    const text = nome || cliente;
    
    // Gera slug limpo
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s-]/g, "") // Remove especiais
      .replace(/\s+/g, "-") // Espaços → hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-|-$/g, "") // Remove hífens nas pontas
      .substring(0, 60); // Limita tamanho
  }, [nome, cliente]);

  const fullUrl = slug ? `essyn.co/g/${slug}` : "";

  function handleCopy() {
    if (!fullUrl) return;
    
    navigator.clipboard.writeText(`https://${fullUrl}`);
    setCopied(true);
    toast.success("Link copiado!");
    
    setTimeout(() => setCopied(false), 2000);
  }

  if (!slug) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 p-3 rounded-xl bg-[#F0EDEB] border border-[#E0DCD7]"
    >
      <Link2 className="w-3.5 h-3.5 text-[#9C8B7A] shrink-0" />
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.04em]" style={{ fontWeight: 500 }}>
          Link da galeria
        </span>
        <code className="text-[12px] text-[#48484A] font-mono" style={{ fontWeight: 500 }}>
          {fullUrl}
        </code>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 w-7 h-7 rounded-lg bg-[#007AFF] hover:bg-[#0066D6] flex items-center justify-center transition-all cursor-pointer"
        title="Copiar link"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Copy className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}