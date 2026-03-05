import { motion, AnimatePresence } from "motion/react";
import { X, Share2, Copy, Archive, Trash2, Download, CheckSquare } from "lucide-react";
import { createPortal } from "react-dom";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkShare: () => void;
  onBulkDuplicate: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkShare,
  onBulkDuplicate,
  onBulkArchive,
  onBulkDelete,
  onBulkDownload,
  onSelectAll,
  totalCount,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9998]"
        >
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#1D1D1F] text-white border border-[#48484A]"
            style={{ boxShadow: "0 20px 60px #48484A" }}
          >
            {/* Selection count */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px]" style={{ fontWeight: 700 }}>
                  {selectedCount} {selectedCount === 1 ? "selecionada" : "selecionadas"}
                </span>
                {selectedCount < totalCount && (
                  <button
                    onClick={onSelectAll}
                    className="text-[11px] text-[#FF9500] hover:underline text-left cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    Selecionar todas ({totalCount})
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-[#48484A]" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <BulkActionButton
                icon={<Share2 className="w-4 h-4" />}
                label="Compartilhar"
                onClick={onBulkShare}
              />
              <BulkActionButton
                icon={<Copy className="w-4 h-4" />}
                label="Duplicar"
                onClick={onBulkDuplicate}
              />
              <BulkActionButton
                icon={<Download className="w-4 h-4" />}
                label="Baixar"
                onClick={onBulkDownload}
              />
              <BulkActionButton
                icon={<Archive className="w-4 h-4" />}
                label="Arquivar"
                onClick={onBulkArchive}
              />

              {/* Divider */}
              <div className="w-px h-6 bg-[#48484A] mx-1" />

              <BulkActionButton
                icon={<Trash2 className="w-4 h-4" />}
                label="Excluir"
                onClick={onBulkDelete}
                variant="danger"
              />
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-[#48484A]" />

            {/* Close */}
            <button
              onClick={onClearSelection}
              className="w-10 h-10 rounded-xl bg-[#48484A] hover:bg-[#636366] flex items-center justify-center transition-all cursor-pointer"
              aria-label="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
  );
}

function BulkActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] transition-all cursor-pointer ${
        variant === "danger"
          ? "bg-[#FF3B30] hover:bg-[#FF3B30] text-white"
          : "bg-[#48484A] hover:bg-[#636366] text-white"
      }`}
      style={{ fontWeight: 600 }}
      title={label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </motion.button>
  );
}