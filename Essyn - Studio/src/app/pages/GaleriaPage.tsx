import { useState, useRef, useCallback } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useShellConfig } from "../components/ui/ShellContext";
import { defaultQuickActions } from "../components/ui/Topbar";
import { GaleriaContentApple } from "../components/galeria-v2/GaleriaContentApple";
import { GaleriaDetailContent, type GalleryDetailData } from "../components/galeria-v2/GaleriaDetailContent";
import { NovaColecaoModal } from "../components/galeria/NovaColecaoModal";
import type { ColecaoFormData } from "../components/galeria/types";
import {
  KeyboardShortcutsHelper,
  useKeyboardShortcuts,
} from "../components/galeria/KeyboardShortcutsHelper";
import { useAppStore } from "../lib/appStore";

/* ── Mock data reference (same as GaleriaContentApple) ── */
const mockLookup: Record<string, GalleryDetailData> = {
  "col-1": { id: "col-1", nome: "Casamento Oliveira & Santos", coverUrl: "https://images.unsplash.com/photo-1761574044344-394d47e1a96c?w=600&h=400&fit=crop", photoCount: 847, status: "final", privacy: "senha", views: 1240, downloads: 312, favoritos: 89, cliente: "Ana Oliveira", dataCriacao: "12 Jan 2026", tipo: "wedding" },
  "col-2": { id: "col-2", nome: "Ensaio Newborn — Sofia", coverUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop", photoCount: 124, status: "proofing", privacy: "senha", views: 456, downloads: 78, favoritos: 34, cliente: "Mariana Costa", dataCriacao: "18 Jan 2026", tipo: "newborn" },
  "col-3": { id: "col-3", nome: "Evento Corporativo TechCorp 2026", coverUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop", photoCount: 532, status: "delivered", privacy: "privado", views: 2340, downloads: 456, favoritos: 123, cliente: "TechCorp Brasil", dataCriacao: "05 Jan 2026", tipo: "corporate" },
  "col-4": { id: "col-4", nome: "Ensaio Gestante — Carolina", coverUrl: "https://images.unsplash.com/photo-1493101561940-44fac7e5d35c?w=600&h=400&fit=crop", photoCount: 86, status: "final", privacy: "senha", views: 234, downloads: 45, favoritos: 28, cliente: "Carolina Mendes", dataCriacao: "22 Jan 2026", tipo: "maternity" },
  "col-5": { id: "col-5", nome: "Festa de 15 Anos — Júlia", coverUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop", photoCount: 412, status: "draft", privacy: "privado", views: 0, downloads: 0, favoritos: 0, cliente: "Família Rodrigues", dataCriacao: "25 Jan 2026", tipo: "party" },
  "col-6": { id: "col-6", nome: "Ensaio de Casal — Lucas & Beatriz", coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop", photoCount: 156, status: "final", privacy: "senha", views: 567, downloads: 89, favoritos: 42, cliente: "Lucas Silva", dataCriacao: "15 Jan 2026", tipo: "portrait" },
  "col-7": { id: "col-7", nome: "Editorial Fashion Week São Paulo", coverUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=400&fit=crop", photoCount: 234, status: "final", privacy: "publico", views: 3456, downloads: 678, favoritos: 234, cliente: "Vogue Brasil", dataCriacao: "08 Jan 2026", tipo: "editorial" },
  "col-8": { id: "col-8", nome: "Casamento Fernanda & Pedro", coverUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop", photoCount: 923, status: "delivered", privacy: "senha", views: 1890, downloads: 445, favoritos: 156, cliente: "Fernanda Lima", dataCriacao: "02 Jan 2026", tipo: "wedding" },
};

export function GaleriaPage() {
  const [novaColecaoModalOpen, setNovaColecaoModalOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryDetailData | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { projects, getStats } = useAppStore();
  const stats = getStats();

  const handleOpenNewCollection = useCallback(() => {
    setNovaColecaoModalOpen(true);
  }, []);

  useShellConfig({
    breadcrumb: selectedGallery
      ? { section: "Galeria", page: selectedGallery.nome }
      : { section: "Operação", page: "Galeria" },
    cta: selectedGallery
      ? {
          label: "Voltar",
          icon: <ArrowLeft className="w-3.5 h-3.5" />,
          onClick: () => setSelectedGallery(null),
          quickActions: defaultQuickActions,
        }
      : {
          label: "Nova coleção",
          icon: <Plus className="w-3.5 h-3.5" />,
          onClick: handleOpenNewCollection,
          quickActions: defaultQuickActions,
        },
  });

  // Keyboard shortcuts
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts({
    onNewCollection: handleOpenNewCollection,
    onSearch: () => searchInputRef.current?.focus(),
    onShowHelp: () => setHelpOpen(true),
  });

  /* ─── FASE 1: Pós-criação com redirect + prompt ─── */
  function handleColecaoCriada(formData: ColecaoFormData, isDraft: boolean) {
    setNovaColecaoModalOpen(false);

    if (isDraft) {
      toast.success("Rascunho salvo!", {
        description: formData.nome,
        duration: 2000,
      });
      return;
    }

    toast.success("Coleção criada!", {
      description: formData.nome,
      duration: 3000,
      action: {
        label: "Adicionar fotos",
        onClick: () => {
          toast.info("Abrindo área de upload...", { duration: 2000 });
        },
      },
    });

    setTimeout(() => {
      const wantsUpload = window.confirm(
        `Coleção "${formData.nome}" criada com sucesso!\n\nDeseja adicionar fotos agora?`,
      );

      if (wantsUpload) {
        toast.info("Redirecionando para upload...", { duration: 2000 });
      }
    }, 500);
  }

  return (
    <>
      {selectedGallery ? (
        <GaleriaDetailContent
          gallery={selectedGallery}
          onBack={() => setSelectedGallery(null)}
        />
      ) : (
        <GaleriaContentApple
          onCreateNew={handleOpenNewCollection}
          onOpenCollection={(id) => {
            const gallery = mockLookup[id];
            if (gallery) {
              setSelectedGallery(gallery);
            } else {
              toast.info("Abrindo coleção...", { description: `ID: ${id}` });
            }
          }}
        />
      )}

      {/* Modal Nova Coleção */}
      <NovaColecaoModal
        open={novaColecaoModalOpen}
        onClose={() => setNovaColecaoModalOpen(false)}
        onSubmit={handleColecaoCriada}
      />

      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}