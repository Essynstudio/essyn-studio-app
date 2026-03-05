import { useState } from "react";
import { X, Copy, Search, Check } from "lucide-react";
import { GalleryPrivacyBadge } from "../ui/gallery-privacy-badge";
import { AppleModal, CTAButton } from "../ui/apple-kit";
import { C, FOCUS_RING } from "../../lib/apple-style";
import type { ColecaoFormData } from "./types";

interface ColecaoMock {
  id: string;
  nome: string;
  cliente: string;
  config: Partial<ColecaoFormData>;
}

// Mock de coleções existentes
const COLECOES_EXISTENTES: ColecaoMock[] = [
  {
    id: "col-1",
    nome: "Casamento Oliveira & Santos",
    cliente: "Ana Oliveira",
    config: {
      tipoGaleria: "wedding",
      privacy: "senha",
      permiteDownload: true,
      tipoDownload: "alta-res",
      permiteFavoritar: true,
      permiteSelecionar: true,
      marcaDagua: false,
      corTema: "#007AFF",
      templateEmail: "elegante",
    },
  },
  {
    id: "col-2",
    nome: "Formatura Direito UFMG",
    cliente: "Coord. Direito UFMG",
    config: {
      tipoGaleria: "graduation",
      privacy: "privado",
      permiteDownload: true,
      tipoDownload: "web-res",
      permiteFavoritar: false,
      permiteSelecionar: false,
      marcaDagua: true,
      posicaoMarcaDagua: "bottom-right",
      corTema: "#AF52DE",
      templateEmail: "padrao",
    },
  },
  {
    id: "col-3",
    nome: "15 Anos Isabela",
    cliente: "Márcia Ferreira",
    config: {
      tipoGaleria: "birthday",
      privacy: "publico",
      permiteDownload: true,
      tipoDownload: "original",
      permiteFavoritar: true,
      permiteSelecionar: true,
      marcaDagua: false,
      corTema: "#007AFF",
      templateEmail: "minimalista",
    },
  },
];

interface CopiarConfiguracoesModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (config: Partial<ColecaoFormData>) => void;
}

export function CopiarConfiguracoesModal({ open, onClose, onSelect }: CopiarConfiguracoesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredColecoes = COLECOES_EXISTENTES.filter((col) => {
    const q = searchQuery.toLowerCase();
    return col.nome.toLowerCase().includes(q) || col.cliente.toLowerCase().includes(q);
  });

  function handleSelect() {
    const selected = COLECOES_EXISTENTES.find((c) => c.id === selectedId);
    if (selected) {
      onSelect(selected.config);
      onClose();
    }
  }

  const selectedBorderCls =
    "border-[" + C.blue + "] bg-[" + C.separator + "] shadow-[0_0_0_1px_" + C.blue + "]";
  const unselectedBorderCls =
    "border-[" + C.separatorDark + "] bg-white hover:border-[" + C.disabled + "] hover:bg-[" + C.hoverBg + "]";

  /* ── Footer ── */
  const footer = (
    <div className="flex items-center gap-2 w-full justify-end">
      <CTAButton
        label="Cancelar"
        variant="secondary"
        onClick={onClose}
        radius={12}
      />
      <CTAButton
        label="Copiar configurações"
        icon={<Check className="w-3.5 h-3.5" />}
        variant="primary"
        onClick={handleSelect}
        disabled={!selectedId}
        radius={12}
      />
    </div>
  );

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Copiar configurações"
      subtitle="Copiar de uma coleção existente"
      size="md"
      footer={footer}
    >
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: C.disabled }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar coleção..."
            className={
              "w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-[13px] transition-all " +
              FOCUS_RING +
              " border-[" + C.separatorDark + "] text-[" + C.secondary + "] placeholder:text-[" + C.disabled + "] focus-visible:border-[" + C.blue + "]"
            }
            style={{ fontWeight: 400 }}
          />
        </div>
      </div>

      {/* Content */}
      {filteredColecoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Search className="w-6 h-6" style={{ color: C.separatorDark }} />
          <span className="text-[13px]" style={{ fontWeight: 400, color: C.muted }}>
            Nenhuma coleção encontrada
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredColecoes.map((col) => {
            const isSelected = selectedId === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedId(col.id)}
                className={
                  "flex items-start gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer " +
                  (isSelected ? selectedBorderCls : unselectedBorderCls)
                }
              >
                <div className="flex-1">
                  <h3
                    className="text-[13px] mb-1"
                    style={{ fontWeight: 600, color: C.secondary }}
                  >
                    {col.nome}
                  </h3>
                  <p
                    className="text-[11px] mb-2"
                    style={{ fontWeight: 400, color: C.muted }}
                  >
                    Cliente: {col.cliente}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {col.config.privacy && (
                      <GalleryPrivacyBadge privacy={col.config.privacy} size="sm" />
                    )}
                    {col.config.marcaDagua && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px]"
                        style={{
                          fontWeight: 500,
                          backgroundColor: C.separator,
                          color: C.tertiary,
                        }}
                      >
                        Marca d'água
                      </span>
                    )}
                    {col.config.permiteSelecionar && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px]"
                        style={{
                          fontWeight: 500,
                          backgroundColor: C.separator,
                          color: C.tertiary,
                        }}
                      >
                        Seleção
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: C.blue }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </AppleModal>
  );
}
