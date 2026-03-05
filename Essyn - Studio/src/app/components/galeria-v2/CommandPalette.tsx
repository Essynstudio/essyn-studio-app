import { motion, AnimatePresence } from "motion/react";
import { Search, Command, ArrowRight, Clock, Star, Folder, Plus, Settings, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDk } from "../../lib/useDarkColors";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "actions" | "collections" | "navigation" | "recent";
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  recentCollections?: Array<{ id: string; nome: string }>;
  onOpenCollection?: (id: string) => void;
}

export function CommandPalette({
  open,
  onClose,
  onCreateNew,
  recentCollections = [],
  onOpenCollection,
}: CommandPaletteProps) {
  const dk = useDk();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Commands disponíveis
  const commands: CommandItem[] = [
    {
      id: "new-collection",
      label: "Nova coleção",
      description: "Criar uma nova coleção de fotos",
      icon: <Plus className="w-4 h-4" />,
      shortcut: "N",
      action: () => {
        onCreateNew();
        onClose();
      },
      category: "actions",
    },
    {
      id: "search-collections",
      label: "Buscar coleções",
      description: "Buscar por nome ou cliente",
      icon: <Search className="w-4 h-4" />,
      shortcut: "/",
      action: () => {
        onClose();
        // Trigger search focus
      },
      category: "actions",
    },
    {
      id: "view-favorites",
      label: "Ver favoritas",
      description: "Coleções marcadas como favoritas",
      icon: <Star className="w-4 h-4" />,
      action: () => {
        onClose();
      },
      category: "navigation",
    },
    {
      id: "settings",
      label: "Configurações",
      description: "Preferências da galeria",
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        onClose();
      },
      category: "navigation",
    },
    {
      id: "help",
      label: "Ajuda e atalhos",
      description: "Ver todos os atalhos de teclado",
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: "?",
      action: () => {
        onClose();
      },
      category: "navigation",
    },
  ];

  // Adiciona coleções recentes
  const recentCommands: CommandItem[] = recentCollections.map((col) => ({
    id: `recent-${col.id}`,
    label: col.nome,
    description: "Abrir coleção",
    icon: <Folder className="w-4 h-4" />,
    action: () => {
      onOpenCollection?.(col.id);
      onClose();
    },
    category: "recent",
  }));

  const allCommands = [...commands, ...recentCommands];

  // Filtra por query
  const filteredCommands = query
    ? allCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Agrupa por categoria
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const categoryLabels = {
    actions: "Ações",
    collections: "Coleções",
    navigation: "Navegação",
    recent: "Recentes",
  };

  return (
    <AnimatePresence>
      {open && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[#1D1D1F]"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: dk.border }}>
              <Search className="w-5 h-5" style={{ color: dk.textMuted }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Digite um comando ou busca..."
                className="flex-1 bg-transparent text-[15px] focus-visible:outline-none"
                style={{ fontWeight: 400, color: dk.textSecondary, }}
              />
              <kbd className="px-2 py-1 rounded border text-[10px] font-mono" style={{ fontWeight: 600, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-8 h-8 mb-3" style={{ color: dk.border }} />
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                    Nenhum resultado encontrado
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {(Object.keys(groupedCommands) as Array<keyof typeof groupedCommands>).map((category) => (
                    <div key={category} className="mb-2">
                      {/* Category label */}
                      <div className="px-5 py-2">
                        <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 700, color: dk.textMuted }}>
                          {categoryLabels[category]}
                        </span>
                      </div>

                      {/* Items */}
                      {groupedCommands[category].map((cmd, index) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className="w-full flex items-center gap-3 px-5 py-3 transition-all cursor-pointer"
                            style={{ backgroundColor: isSelected ? dk.bgMuted : "transparent" }}
                          >
                            {/* Icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: isSelected ? "#007AFF" : dk.bgMuted,
                                color: isSelected ? "#FFFFFF" : dk.textTertiary,
                              }}
                            >
                              {cmd.icon}
                            </div>

                            {/* Label */}
                            <div className="flex-1 text-left">
                              <div className="text-[13px]" style={{ fontWeight: 600, color: dk.textSecondary }}>
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                                  {cmd.description}
                                </div>
                              )}
                            </div>

                            {/* Shortcut or arrow */}
                            {cmd.shortcut ? (
                              <kbd className="px-2 py-1 rounded border text-[10px] font-mono" style={{ fontWeight: 600, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}>
                                {cmd.shortcut}
                              </kbd>
                            ) : (
                              isSelected && <ArrowRight className="w-4 h-4 text-[#007AFF]" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
              <div className="flex items-center gap-4 text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ fontWeight: 600, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}>↑↓</kbd>
                  <span>Navegar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ fontWeight: 600, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}>↵</kbd>
                  <span>Selecionar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ fontWeight: 600, backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}>ESC</kbd>
                  <span>Fechar</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                <Command className="w-3 h-3" />
                <span>Command Palette</span>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
}

// Hook para usar Command Palette globalmente
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}