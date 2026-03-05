/**
 * EmailTemplatesPage — Email Template Library
 *
 * List of saved email templates with preview,
 * create new, edit, duplicate, delete.
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Plus, Eye, Copy, Trash2,
  Edit, CheckCircle2, Clock, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { springDefault } from "../lib/motion-tokens";
import { WidgetCard, HeaderWidget } from "../components/ui/apple-kit";
import { useShellConfig } from "../components/ui/ShellContext";
import { EmailTemplateEditor, type EmailTemplate } from "../components/email/EmailTemplateEditor";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";

/* ═══════════════════════════════════════════════════ */
/*  DATA                                               */
/* ═══════════════════════════════════════════════════ */

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: "et-1",
    name: "Galeria Pronta",
    subject: "Sua galeria está pronta! ✨",
    blocks: [
      { id: "b1", type: "header", content: "ESSYN Fotografia", style: { align: "center" } },
      { id: "b2", type: "text", content: "Olá {{nome}},\n\nSua galeria de fotos está pronta! Foram selecionadas as melhores imagens do seu evento." },
      { id: "b3", type: "button", content: "Ver Minha Galeria", style: { bgColor: "#007AFF", color: "#FFFFFF", align: "center" } },
      { id: "b4", type: "footer", content: "ESSYN Fotografia · essyn.studio" },
    ],
  },
  {
    id: "et-2",
    name: "Confirmação de Pedido",
    subject: "Pedido confirmado — {{numero}}",
    blocks: [
      { id: "b1", type: "header", content: "Pedido Confirmado!", style: { align: "center" } },
      { id: "b2", type: "text", content: "Olá {{nome}},\n\nSeu pedido #{{numero}} foi confirmado com sucesso!" },
      { id: "b3", type: "button", content: "Acompanhar Pedido", style: { bgColor: "#34C759", color: "#FFFFFF", align: "center" } },
      { id: "b4", type: "footer", content: "ESSYN Fotografia · essyn.studio" },
    ],
  },
  {
    id: "et-3",
    name: "Lembrete de Evento",
    subject: "Amanhã é o grande dia! 📸",
    blocks: [
      { id: "b1", type: "header", content: "Lembrete: Seu Evento é Amanhã!", style: { align: "center" } },
      { id: "b2", type: "text", content: "Olá {{nome}},\n\nEstamos animados para o {{evento}} amanhã!" },
      { id: "b3", type: "button", content: "Ver Detalhes", style: { bgColor: "#007AFF", color: "#FFFFFF", align: "center" } },
      { id: "b4", type: "footer", content: "ESSYN Fotografia · essyn.studio" },
    ],
  },
];

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();

  useShellConfig({
    breadcrumb: { section: "Sistema", page: "Templates de Email" },
  });

  const handleSave = (template: EmailTemplate) => {
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === template.id);
      if (exists) return prev.map((t) => (t.id === template.id ? template : t));
      return [template, ...prev];
    });
    setEditorOpen(false);
    setEditingTemplate(undefined);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleDuplicate = (template: EmailTemplate) => {
    const dup: EmailTemplate = {
      ...template,
      id: `et-${Date.now()}`,
      name: `${template.name} (cópia)`,
      blocks: template.blocks.map((b) => ({ ...b, id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setTemplates((prev) => [dup, ...prev]);
    toast.success("Template duplicado", { description: dup.name });
  };

  const handleDelete = (id: string) => {
    const tmpl = templates.find((t) => t.id === id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template removido", { description: tmpl?.name });
  };

  const handleNew = () => {
    setEditingTemplate(undefined);
    setEditorOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      <OnboardingBanner
        id="email-templates-intro"
        title="Editor de Templates"
        message="Crie templates visuais de email com blocos arrastáveis, variáveis dinâmicas e preview em tempo real."
      />

      <HeaderWidget
        greeting="Templates de Email"
        userName=""
        contextLine={`${templates.length} template${templates.length !== 1 ? "s" : ""} · Editor visual de blocos`}
        delay={0}
      />

      <div className="flex items-center justify-end">
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] transition-colors cursor-pointer"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Template
        </button>
      </div>

      <WidgetCard title="Biblioteca" count={templates.length} delay={0.02}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-5 py-3">
          {templates.map((tmpl, idx) => (
            <motion.div
              key={tmpl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springDefault, delay: idx * 0.03 }}
              className="rounded-xl border border-[#F2F2F7] overflow-hidden hover:border-[#D1D1D6] transition-colors group"
            >
              {/* Preview mini */}
              <div className="h-[120px] bg-[#FAFAFA] p-4 flex flex-col gap-1.5 overflow-hidden">
                {tmpl.blocks.slice(0, 3).map((block) => {
                  if (block.type === "header") {
                    return <div key={block.id} className="h-3 bg-[#E5E5EA] rounded w-3/4 mx-auto" />;
                  }
                  if (block.type === "text") {
                    return (
                      <div key={block.id} className="flex flex-col gap-1">
                        <div className="h-2 bg-[#E5E5EA] rounded w-full" />
                        <div className="h-2 bg-[#E5E5EA] rounded w-4/5" />
                      </div>
                    );
                  }
                  if (block.type === "button") {
                    return <div key={block.id} className="h-5 bg-[#007AFF] rounded-lg w-24 mx-auto mt-1" />;
                  }
                  if (block.type === "divider") {
                    return <div key={block.id} className="h-px bg-[#E5E5EA] my-1" />;
                  }
                  return null;
                })}
              </div>

              {/* Info */}
              <div className="px-4 py-3 border-t border-[#F2F2F7]">
                <h4 className="text-[13px] text-[#1D1D1F] mb-0.5" style={{ fontWeight: 600 }}>{tmpl.name}</h4>
                <p className="text-[10px] text-[#8E8E93] truncate" style={{ fontWeight: 400 }}>
                  {tmpl.subject}
                </p>
                <p className="text-[9px] text-[#C7C7CC] mt-1" style={{ fontWeight: 400 }}>
                  {tmpl.blocks.length} blocos
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-4 py-2.5 border-t border-[#F2F2F7]">
                <button
                  onClick={() => handleEdit(tmpl)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-[#007AFF] hover:bg-[#E8F0FE] transition-colors cursor-pointer"
                  style={{ fontWeight: 600 }}
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={() => handleDuplicate(tmpl)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                  style={{ fontWeight: 600 }}
                >
                  <Copy className="w-3 h-3" />
                  Duplicar
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(tmpl.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FDEDEF] transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Empty add card */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: templates.length * 0.03 }}
            onClick={handleNew}
            className="rounded-xl border-2 border-dashed border-[#E5E5EA] flex flex-col items-center justify-center gap-2 min-h-[200px] hover:border-[#007AFF] hover:bg-[#FAFAFA] transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center group-hover:bg-[#E8F0FE] transition-colors">
              <Plus className="w-5 h-5 text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors" />
            </div>
            <span className="text-[12px] text-[#AEAEB2] group-hover:text-[#007AFF] transition-colors" style={{ fontWeight: 500 }}>
              Criar Template
            </span>
          </motion.button>
        </div>
      </WidgetCard>

      {/* Editor Modal */}
      {editorOpen && (
        <EmailTemplateEditor
          onClose={() => { setEditorOpen(false); setEditingTemplate(undefined); }}
          onSave={handleSave}
          initialTemplate={editingTemplate}
        />
      )}
    </div>
  );
}