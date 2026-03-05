import { motion, AnimatePresence } from "motion/react";
import { Share2, Copy, Download, Archive, Trash2, ExternalLink, Star, Eye, Settings } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDk } from "../../lib/useDarkColors";

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function ContextMenu({ x, y, isOpen, onClose, onAction }: ContextMenuProps) {
  const dk = useDk();
  // Boundary detection — prevent overflow at screen edges
  const MENU_WIDTH = 224;  // w-56
  const MENU_HEIGHT = 320; // estimated
  const adjustedX = x + MENU_WIDTH > window.innerWidth ? x - MENU_WIDTH : x;
  const adjustedY = y + MENU_HEIGHT > window.innerHeight ? y - MENU_HEIGHT : y;

  useEffect(() => {
    if (!isOpen) return;

    function handleClick() {
      onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const menuItems = [
    { id: "open", label: "Abrir galeria", icon: <ExternalLink className="w-4 h-4" />, shortcut: "↵" },
    { id: "preview", label: "Preview rápido", icon: <Eye className="w-4 h-4" />, shortcut: "Space" },
    { id: "divider" },
    { id: "favorite", label: "Adicionar aos favoritos", icon: <Star className="w-4 h-4" />, shortcut: "F" },
    { id: "share", label: "Compartilhar", icon: <Share2 className="w-4 h-4" />, shortcut: "S" },
    { id: "duplicate", label: "Duplicar", icon: <Copy className="w-4 h-4" />, shortcut: "D" },
    { id: "download", label: "Baixar tudo", icon: <Download className="w-4 h-4" /> },
    { id: "divider" },
    { id: "settings", label: "Configurações", icon: <Settings className="w-4 h-4" /> },
    { id: "archive", label: "Arquivar", icon: <Archive className="w-4 h-4" /> },
    { id: "divider" },
    { id: "delete", label: "Excluir", icon: <Trash2 className="w-4 h-4" />, danger: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9998] w-56 rounded-xl py-1 overflow-hidden"
          style={{
            left: adjustedX,
            top: adjustedY,
            backgroundColor: dk.bg,
            borderColor: dk.border,
            border: `1px solid ${dk.border}`,
            boxShadow: dk.shadowModal,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item, index) => {
            if (item.id === "divider") {
              return <div key={`divider-${index}`} className="h-px my-1" style={{ backgroundColor: dk.border }} />;
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  onAction(item.id);
                  onClose();
                }}
                whileHover={{ backgroundColor: dk.bgHover }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors"
                style={{ color: item.danger ? "#FF3B30" : dk.textSecondary }}
              >
                <div style={{ color: item.danger ? "#FF3B30" : dk.textTertiary }}>{item.icon}</div>
                <span className="flex-1 text-[12px]" style={{ fontWeight: 500 }}>
                  {item.label}
                </span>
                {item.shortcut && (
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{ fontWeight: 600, backgroundColor: dk.bgMuted, borderColor: dk.border, border: `1px solid ${dk.border}`, color: dk.textTertiary }}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </motion.button>
            );
          })}
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
  );
}