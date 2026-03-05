import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { X, Command } from "lucide-react";
import { useEffect, useState } from "react";

interface Shortcut {
  keys: string[];
  description: string;
  category: "navigation" | "actions" | "general";
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["N"], description: "Nova coleção", category: "actions" },
  { keys: ["J"], description: "Próxima coleção", category: "navigation" },
  { keys: ["K"], description: "Coleção anterior", category: "navigation" },
  { keys: ["/"], description: "Buscar", category: "general" },
  { keys: ["?"], description: "Mostrar atalhos", category: "general" },
  { keys: ["ESC"], description: "Fechar modal/busca", category: "general" },
  { keys: ["Ctrl", "Enter"], description: "Confirmar ação", category: "actions" },
  { keys: ["D"], description: "Duplicar selecionada", category: "actions" },
  { keys: ["A"], description: "Arquivar", category: "actions" },
];

interface KeyboardShortcutsHelperProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelper({ open, onClose }: KeyboardShortcutsHelperProps) {
  const categorized = {
    navigation: SHORTCUTS.filter((s) => s.category === "navigation"),
    actions: SHORTCUTS.filter((s) => s.category === "actions"),
    general: SHORTCUTS.filter((s) => s.category === "general"),
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[#1D1D1F]"
            style={{ opacity: 0.4 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px #E5E5EA" }}
          >
            {/* Header */}
            <div className="border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-[#007AFF]" />
                <h2 className="text-[18px] text-[#48484A] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
                  Atalhos do teclado
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 flex flex-col gap-6">
              {/* Navegação */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] text-[#8E8E93] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                  Navegação
                </h3>
                {categorized.navigation.map((shortcut) => (
                  <ShortcutRow key={shortcut.description} {...shortcut} />
                ))}
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] text-[#8E8E93] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                  Ações
                </h3>
                {categorized.actions.map((shortcut) => (
                  <ShortcutRow key={shortcut.description} {...shortcut} />
                ))}
              </div>

              {/* Geral */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] text-[#8E8E93] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                  Geral
                </h3>
                {categorized.general.map((shortcut) => (
                  <ShortcutRow key={shortcut.description} {...shortcut} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E5EA] px-6 py-3 bg-[#FAFAFA]">
              <p className="text-[11px] text-[#C7C7CC] text-center" style={{ fontWeight: 400 }}>
                💡 Pressione <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E5EA] text-[#48484A] text-[10px] font-mono">?</kbd> a qualquer momento para ver atalhos
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ShortcutRow({ keys, description }: Shortcut) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-[#48484A]" style={{ fontWeight: 400 }}>
        {description}
      </span>
      <div className="flex items-center gap-1">
        {keys.map((key, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <kbd className="px-2 py-1 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] text-[#48484A] font-mono min-w-[28px] text-center" style={{ fontWeight: 500 }}>
              {key}
            </kbd>
            {idx < keys.length - 1 && (
              <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Hook para usar keyboard shortcuts */
export function useKeyboardShortcuts(callbacks: {
  onNewCollection?: () => void;
  onSearch?: () => void;
  onShowHelp?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignora se está digitando em input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        // Exceto ESC que sempre funciona
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          callbacks.onNewCollection?.();
          break;
        case "/":
          e.preventDefault();
          callbacks.onSearch?.();
          break;
        case "?":
          e.preventDefault();
          callbacks.onShowHelp?.();
          setHelpOpen(true);
          break;
        case "j":
          e.preventDefault();
          callbacks.onNext?.();
          break;
        case "k":
          e.preventDefault();
          callbacks.onPrev?.();
          break;
        case "d":
          e.preventDefault();
          callbacks.onDuplicate?.();
          break;
        case "a":
          e.preventDefault();
          callbacks.onArchive?.();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);

  return { helpOpen, setHelpOpen };
}