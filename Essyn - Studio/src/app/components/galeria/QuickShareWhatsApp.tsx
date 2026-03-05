import { MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface QuickShareWhatsAppProps {
  clienteNome: string;
  colecaoNome: string;
  shareUrl: string;
  senha?: string;
  telefone?: string;
}

export function QuickShareWhatsApp({
  clienteNome,
  colecaoNome,
  shareUrl,
  senha,
  telefone,
}: QuickShareWhatsAppProps) {
  const [copied, setCopied] = useState(false);

  const mensagem = `Olá ${clienteNome}! 👋

Sua galeria "${colecaoNome}" está pronta! 🎉

📸 Acesse aqui: https://${shareUrl}
${senha ? `🔐 Senha: ${senha}` : ""}

Aproveite! 😊`;

  const whatsappUrl = `https://wa.me/${telefone?.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;

  function handleCopyMessage() {
    navigator.clipboard.writeText(mensagem);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenWhatsApp() {
    window.open(whatsappUrl, "_blank");
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#EAF7EE] border border-[#C8E6CE]">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-4 h-4 text-[#25D366]" />
        <h4 className="text-[12px] text-[#494745]" style={{ fontWeight: 600 }}>
          Compartilhar por WhatsApp
        </h4>
      </div>

      {/* Preview da mensagem */}
      <div className="p-3 rounded-lg bg-white border border-[#E5E5E7]">
        <pre className="text-[11px] text-[#494745] whitespace-pre-wrap font-sans" style={{ fontWeight: 400 }}>
          {mensagem}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {telefone ? (
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-[12px] hover:bg-[#20BA5A] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 600 }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Enviar WhatsApp
          </button>
        ) : (
          <button
            onClick={handleCopyMessage}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-[12px] hover:bg-[#3A3A3C] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar mensagem
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-[10px] text-[#34C759]" style={{ fontWeight: 400 }}>
        {telefone
          ? "💡 Abrirá WhatsApp com a mensagem pronta"
          : "💡 Copie a mensagem e envie manualmente pelo WhatsApp"}
      </p>
    </div>
  );
}