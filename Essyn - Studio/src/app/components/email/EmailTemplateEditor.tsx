/**
 * EmailTemplateEditor — Visual Email Template Builder
 *
 * Drag-free block editor with:
 * - Block types: header, text, image, button, divider, footer
 * - Live preview panel
 * - Pre-built templates
 * - Save/load
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Type, Image, Square, Minus, AlignLeft,
  Plus, Trash2, ChevronUp, ChevronDown,
  Eye, Save, Copy, X, Settings,
  Camera, Mail, Sparkles, Check,
} from "lucide-react";
import { toast } from "sonner";
import { springDefault } from "../../lib/motion-tokens";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

type BlockType = "header" | "text" | "image" | "button" | "divider" | "footer";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  style?: {
    align?: "left" | "center" | "right";
    color?: string;
    bgColor?: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "header", label: "Cabeçalho", icon: <Type className="w-3.5 h-3.5" />, desc: "Título grande" },
  { type: "text", label: "Texto", icon: <AlignLeft className="w-3.5 h-3.5" />, desc: "Parágrafo" },
  { type: "image", label: "Imagem", icon: <Image className="w-3.5 h-3.5" />, desc: "Foto ou banner" },
  { type: "button", label: "Botão", icon: <Square className="w-3.5 h-3.5" />, desc: "Call to action" },
  { type: "divider", label: "Divisor", icon: <Minus className="w-3.5 h-3.5" />, desc: "Linha separadora" },
  { type: "footer", label: "Rodapé", icon: <Settings className="w-3.5 h-3.5" />, desc: "Info do studio" },
];

const DEFAULT_BLOCKS: EmailBlock[] = [
  { id: "b1", type: "header", content: "ESSYN Fotografia", style: { align: "center" } },
  { id: "b2", type: "text", content: "Olá {{nome}},\n\nSua galeria de fotos está pronta! Foram selecionadas as melhores imagens do seu evento para você reviver cada momento especial." },
  { id: "b3", type: "image", content: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=300&fit=crop", style: { align: "center" } },
  { id: "b4", type: "button", content: "Ver Minha Galeria", style: { bgColor: "#007AFF", color: "#FFFFFF", align: "center" } },
  { id: "b5", type: "divider", content: "" },
  { id: "b6", type: "footer", content: "ESSYN Fotografia · essyn.studio\nEste e-mail foi enviado automaticamente. Não responda." },
];

const PRESET_TEMPLATES: { name: string; subject: string; blocks: EmailBlock[] }[] = [
  {
    name: "Galeria Pronta",
    subject: "Sua galeria está pronta! ✨",
    blocks: DEFAULT_BLOCKS,
  },
  {
    name: "Confirmação de Pedido",
    subject: "Pedido confirmado — {{numero}}",
    blocks: [
      { id: "t1", type: "header", content: "Pedido Confirmado!", style: { align: "center" } },
      { id: "t2", type: "text", content: "Olá {{nome}},\n\nSeu pedido #{{numero}} foi confirmado com sucesso! Estamos preparando seus produtos com todo o cuidado." },
      { id: "t3", type: "text", content: "Detalhes do pedido:\n• {{itens}}\n• Total: {{total}}\n• Previsão de entrega: {{prazo}}" },
      { id: "t4", type: "button", content: "Acompanhar Pedido", style: { bgColor: "#34C759", color: "#FFFFFF", align: "center" } },
      { id: "t5", type: "divider", content: "" },
      { id: "t6", type: "footer", content: "ESSYN Fotografia · essyn.studio" },
    ],
  },
  {
    name: "Lembrete de Evento",
    subject: "Amanhã é o grande dia! 📸",
    blocks: [
      { id: "r1", type: "header", content: "Lembrete: Seu Evento é Amanhã!", style: { align: "center" } },
      { id: "r2", type: "text", content: "Olá {{nome}},\n\nEstamos animados para o {{evento}} amanhã! Aqui vão algumas dicas para garantir que tudo saia perfeito:" },
      { id: "r3", type: "text", content: "📋 Checklist:\n• Confirme o horário: {{horario}}\n• Local: {{local}}\n• Outfit preparado\n• Acessórios prontos" },
      { id: "r4", type: "button", content: "Ver Detalhes do Evento", style: { bgColor: "#007AFF", color: "#FFFFFF", align: "center" } },
      { id: "r5", type: "footer", content: "ESSYN Fotografia · essyn.studio" },
    ],
  },
];

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                          */
/* ═══════════════════════════════════════════════════ */

export function EmailTemplateEditor({
  onClose,
  onSave,
  initialTemplate,
}: {
  onClose: () => void;
  onSave?: (template: EmailTemplate) => void;
  initialTemplate?: EmailTemplate;
}) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialTemplate?.blocks || DEFAULT_BLOCKS);
  const [subject, setSubject] = useState(initialTemplate?.subject || "Sua galeria está pronta!");
  const [templateName, setTemplateName] = useState(initialTemplate?.name || "Novo Template");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: `b-${Date.now()}`,
      type,
      content: type === "header" ? "Título" : type === "text" ? "Seu texto aqui..." : type === "button" ? "Clique Aqui" : type === "footer" ? "ESSYN Fotografia · essyn.studio" : "",
      style: type === "button" ? { bgColor: "#007AFF", color: "#FFFFFF", align: "center" } : { align: type === "header" ? "center" : "left" },
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, content } : b));
  };

  const handleSave = () => {
    const template: EmailTemplate = {
      id: initialTemplate?.id || `tmpl-${Date.now()}`,
      name: templateName,
      subject,
      blocks,
    };
    onSave?.(template);
    toast.success("Template salvo!", { description: templateName });
  };

  const loadPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setBlocks(preset.blocks.map((b) => ({ ...b, id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })));
    setSubject(preset.subject);
    setTemplateName(preset.name);
    toast.success("Template carregado", { description: preset.name });
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="email-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springDefault}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="email-editor"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={springDefault}
        className="fixed inset-4 z-[9999] flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex bg-white rounded-2xl shadow-[0_16px_64px_#D1D1D6] overflow-hidden">
          {/* ── Left: Block Editor ── */}
          <div className="w-[340px] border-r border-[#F2F2F7] flex flex-col shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#007AFF]" />
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Editor de Template</span>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F2F2F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template name & subject */}
            <div className="px-4 py-3 border-b border-[#F2F2F7] flex flex-col gap-2">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-[13px] text-[#1D1D1F] bg-transparent outline-none border-b border-transparent focus:border-[#007AFF] transition-colors pb-1"
                style={{ fontWeight: 600 }}
                placeholder="Nome do template"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>Assunto:</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 text-[11px] text-[#1D1D1F] bg-transparent outline-none placeholder:text-[#C7C7CC]"
                  style={{ fontWeight: 400 }}
                  placeholder="Assunto do e-mail"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="px-4 py-2 border-b border-[#F2F2F7]">
              <span className="text-[9px] text-[#8E8E93]" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Templates prontos
              </span>
              <div className="flex gap-1.5 mt-1.5">
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className="px-2 py-1 rounded-lg bg-[#F5F5F7] text-[10px] text-[#636366] hover:bg-[#E5E5EA] transition-colors cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add block buttons */}
            <div className="px-4 py-2 border-b border-[#F2F2F7]">
              <span className="text-[9px] text-[#8E8E93] mb-1.5 block" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Adicionar bloco
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BLOCK_TYPES.map((bt) => (
                  <button
                    key={bt.type}
                    onClick={() => addBlock(bt.type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#F2F2F7] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer"
                  >
                    <span className="text-[#8E8E93]">{bt.icon}</span>
                    <span className="text-[9px] text-[#636366]" style={{ fontWeight: 500 }}>{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Block list */}
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1.5">
              <span className="text-[9px] text-[#8E8E93] mb-0.5" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Blocos ({blocks.length})
              </span>
              {blocks.map((block, idx) => {
                const bt = BLOCK_TYPES.find((b) => b.type === block.type);
                const isSelected = selectedBlock === block.id;
                return (
                  <div
                    key={block.id}
                    className={`rounded-xl border p-2.5 transition-all cursor-pointer ${
                      isSelected ? "border-[#007AFF] bg-[#F0F5FF]" : "border-[#F2F2F7] hover:border-[#D1D1D6]"
                    }`}
                    onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={isSelected ? "text-[#007AFF]" : "text-[#8E8E93]"}>{bt?.icon}</span>
                      <span className="text-[11px] text-[#1D1D1F] flex-1" style={{ fontWeight: 500 }}>{bt?.label}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                          disabled={idx === 0}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${idx === 0 ? "text-[#E5E5EA]" : "text-[#AEAEB2] hover:text-[#636366]"}`}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                          disabled={idx === blocks.length - 1}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${idx === blocks.length - 1 ? "text-[#E5E5EA]" : "text-[#AEAEB2] hover:text-[#636366]"}`}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#AEAEB2] hover:text-[#FF3B30] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {isSelected && block.type !== "divider" && (
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        className="w-full text-[11px] text-[#636366] bg-white rounded-lg border border-[#E5E5EA] p-2 outline-none focus:border-[#007AFF] resize-none"
                        style={{ fontWeight: 400, minHeight: block.type === "text" ? "80px" : "36px" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#F2F2F7]">
              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] transition-colors cursor-pointer"
                style={{ fontWeight: 600 }}
              >
                <Save className="w-3.5 h-3.5" />
                Salvar
              </button>
            </div>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="flex-1 bg-[#F5F5F7] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5EA] bg-white">
              <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Pré-visualização</span>
              <span className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                Assunto: {subject}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <EmailPreviewRenderer blocks={blocks} />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/* ═══════════════════════════════════════════════════ */
/*  EMAIL PREVIEW RENDERER                             */
/* ═══════════════════════════════════════════════════ */

function EmailPreviewRenderer({ blocks }: { blocks: EmailBlock[] }) {
  return (
    <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_2px_8px_#E5E5EA] overflow-hidden">
      {/* Email chrome */}
      <div className="px-5 py-3 border-b border-[#F2F2F7] bg-[#FAFAFA]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-[#1D1D1F] flex items-center justify-center">
            <Camera className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>ESSYN Fotografia</span>
        </div>
        <p className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
          para: cliente@email.com
        </p>
      </div>

      {/* Blocks */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {blocks.map((block) => {
          switch (block.type) {
            case "header":
              return (
                <h2
                  key={block.id}
                  className="text-[20px] text-[#1D1D1F]"
                  style={{ fontWeight: 700, textAlign: block.style?.align || "left" }}
                >
                  {block.content}
                </h2>
              );
            case "text":
              return (
                <p
                  key={block.id}
                  className="text-[13px] text-[#636366] whitespace-pre-line"
                  style={{ fontWeight: 400, lineHeight: "1.6", textAlign: block.style?.align || "left" }}
                >
                  {block.content}
                </p>
              );
            case "image":
              return (
                <div key={block.id} style={{ textAlign: block.style?.align || "center" }}>
                  <div className="w-full h-[200px] bg-[#F2F2F7] rounded-xl flex items-center justify-center overflow-hidden">
                    {block.content ? (
                      <img src={block.content} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-[#D1D1D6]" />
                    )}
                  </div>
                </div>
              );
            case "button":
              return (
                <div key={block.id} style={{ textAlign: block.style?.align || "center" }}>
                  <span
                    className="inline-block px-6 py-3 rounded-xl text-[13px]"
                    style={{
                      fontWeight: 600,
                      backgroundColor: block.style?.bgColor || "#007AFF",
                      color: block.style?.color || "#FFFFFF",
                    }}
                  >
                    {block.content}
                  </span>
                </div>
              );
            case "divider":
              return <div key={block.id} className="h-px bg-[#E5E5EA]" />;
            case "footer":
              return (
                <p
                  key={block.id}
                  className="text-[10px] text-[#C7C7CC] whitespace-pre-line"
                  style={{ fontWeight: 400, textAlign: "center", lineHeight: "1.5" }}
                >
                  {block.content}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

export type { EmailTemplate, EmailBlock };
