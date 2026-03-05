/**
 * OrganizationTab — Drag & Drop with react-dnd
 *
 * Replaces native HTML5 drag with react-dnd for smoother reordering,
 * better mobile support, and drop animations via motion.
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import {
  GripVertical,
  FolderPlus,
  FolderOpen,
  Trash2,
  Check,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { springDefault } from "../../lib/motion-tokens";
import { WidgetCard } from "../ui/apple-kit";
import { useDk } from "../../lib/useDarkColors";

/* ── Types ── */
interface Collection {
  id: string;
  name: string;
  count: number;
  coverUrl: string;
  isDefault: boolean;
}

const ITEM_TYPE = "COLLECTION";

interface DragItem {
  id: string;
  index: number;
}

const spring = springDefault;

/* ═══════════════════════════════════════════════════ */
/*  DND COLLECTION ROW                                 */
/* ═══════════════════════════════════════════════════ */

function DndCollectionRow({
  col,
  index,
  moveCollection,
  onStartRename,
  editingId,
  editName,
  setEditName,
  onSaveRename,
  onCancelRename,
  onDelete,
  totalCount,
}: {
  col: Collection;
  index: number;
  moveCollection: (fromIdx: number, toIdx: number) => void;
  onStartRename: (id: string, name: string) => void;
  editingId: string | null;
  editName: string;
  setEditName: (v: string) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onDelete: (id: string) => void;
  totalCount: number;
}) {
  const dk = useDk();
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({ id: col.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: DragItem) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveCollection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  preview(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      transition={spring}
      className="flex items-center gap-3 px-5 py-3 transition-colors"
      style={{ opacity: isDragging ? 0.5 : 1, backgroundColor: isOver ? dk.bgActive : "transparent" }}
    >
      {/* Drag handle */}
      <div
        ref={(node) => { drag(node); }}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
        style={{ color: dk.textDisabled }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Cover thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: dk.bgMuted }}>
        {col.coverUrl ? (
          <img src={col.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-4 h-4" style={{ color: dk.textDisabled }} />
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        {editingId === col.id ? (
          <div className="flex items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename(col.id);
                if (e.key === "Escape") onCancelRename();
              }}
              autoFocus
              className="flex-1 border rounded-lg px-2 py-1 text-[13px] focus:outline-none focus:border-[#007AFF]"
              style={{ fontWeight: 500, backgroundColor: dk.bgActive, borderColor: dk.border, color: dk.textPrimary }}
            />
            <button
              onClick={() => onSaveRename(col.id)}
              className="w-6 h-6 rounded-md bg-[#007AFF] text-white flex items-center justify-center cursor-pointer"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <p
              className="text-[13px] truncate cursor-pointer hover:text-[#007AFF] transition-colors"
              style={{ fontWeight: 500, color: dk.textPrimary }}
              onClick={() => onStartRename(col.id, col.name)}
            >
              {col.name}
            </p>
            <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
              {col.count} foto{col.count !== 1 ? "s" : ""}
              {col.isDefault && " · Destaque"}
            </p>
          </>
        )}
      </div>

      {/* Order badge */}
      <span
        className="text-[10px] tabular-nums shrink-0 w-5 text-center"
        style={{ fontWeight: 600, color: dk.textSubtle }}
      >
        {index + 1}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {col.isDefault && (
          <div
            className="px-1.5 py-0.5 rounded-md text-white text-[8px]"
            style={{ fontWeight: 700, backgroundColor: dk.textPrimary }}
          >
            HERO
          </div>
        )}
        {!col.isDefault && (
          <button
            onClick={() => onDelete(col.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: dk.textDisabled }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  ORGANIZATION TAB (exported)                        */
/* ═══════════════════════════════════════════════════ */

export function OrganizationTabDnd() {
  const dk = useDk();
  const [collections, setCollections] = useState<Collection[]>([
    { id: "c0", name: "Hero Set", count: 20, coverUrl: "https://images.unsplash.com/photo-1767986012138-4893f40932d5?w=200&h=150&fit=crop", isDefault: true },
    { id: "c1", name: "Making Of", count: 124, coverUrl: "https://images.unsplash.com/photo-1642630111276-821681d57568?w=200&h=150&fit=crop", isDefault: false },
    { id: "c2", name: "Cerimônia", count: 312, coverUrl: "https://images.unsplash.com/photo-1719223852076-6981754ebf76?w=200&h=150&fit=crop", isDefault: false },
    { id: "c3", name: "Festa", count: 289, coverUrl: "https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=200&h=150&fit=crop", isDefault: false },
    { id: "c4", name: "Detalhes", count: 56, coverUrl: "https://images.unsplash.com/photo-1561940329-7382e6704231?w=200&h=150&fit=crop", isDefault: false },
    { id: "c5", name: "Pista de Dança", count: 86, coverUrl: "https://images.unsplash.com/photo-1473652502225-6b6af0664e32?w=200&h=150&fit=crop", isDefault: false },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const moveCollection = useCallback((fromIdx: number, toIdx: number) => {
    setCollections((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  }, []);

  const handleAddCollection = () => {
    const newCol: Collection = {
      id: `c${Date.now()}`,
      name: `Nova Pasta ${collections.length + 1}`,
      count: 0,
      coverUrl: "",
      isDefault: false,
    };
    setCollections([...collections, newCol]);
    setEditingId(newCol.id);
    setEditName(newCol.name);
    toast.success("Pasta criada");
  };

  const handleDelete = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    toast.success("Pasta removida");
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c))
    );
    setEditingId(null);
    toast.success("Nome atualizado");
  };

  const totalPhotos = collections.reduce((sum, c) => sum + c.count, 0);

  /* ── Detect touch device for correct DnD backend ── */
  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0),
    []
  );
  const backend = isTouchDevice ? TouchBackend : HTML5Backend;
  const backendOptions = isTouchDevice ? { enableMouseEvents: true, delayTouchStart: 150 } : undefined;

  return (
    <DndProvider backend={backend} options={backendOptions}>
      {/* Summary strip */}
      <WidgetCard title="Estrutura da Galeria" delay={0.03}>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span
                className="text-[18px] tabular-nums"
                style={{ fontWeight: 600, color: dk.textPrimary }}
              >
                {collections.length}
              </span>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                Pastas
              </span>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: dk.hairline }} />
            <div className="flex flex-col">
              <span
                className="text-[18px] tabular-nums"
                style={{ fontWeight: 600, color: dk.textPrimary }}
              >
                {totalPhotos}
              </span>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                Fotos
              </span>
            </div>
          </div>
          <button
            onClick={handleAddCollection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nova pasta
          </button>
        </div>
      </WidgetCard>

      {/* Drag & drop list */}
      <WidgetCard title="Pastas & Coleções" count={collections.length} delay={0.06}>
        <div className="flex items-center gap-2 px-5 py-2.5">
          <GripVertical className="w-3 h-3" style={{ color: dk.textDisabled }} />
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
            Arraste para reordenar as pastas. A ordem será reflectida na galeria do cliente.
          </span>
        </div>
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />

        <div className="flex flex-col">
          <AnimatePresence>
            {collections.map((col, idx) => (
              <div key={col.id}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <DndCollectionRow
                  col={col}
                  index={idx}
                  moveCollection={moveCollection}
                  onStartRename={(id, name) => {
                    setEditingId(id);
                    setEditName(name);
                  }}
                  editingId={editingId}
                  editName={editName}
                  setEditName={setEditName}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  onDelete={handleDelete}
                  totalCount={collections.length}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </WidgetCard>

      {/* Cover photo selection */}
      <WidgetCard title="Foto de Capa" delay={0.09}>
        <div className="px-5 py-3">
          <div className="aspect-[16/9] rounded-xl overflow-hidden relative group cursor-pointer" style={{ backgroundColor: dk.bgMuted }}>
            <img
              src="https://images.unsplash.com/photo-1767986012138-4893f40932d5?w=800&h=450&fit=crop"
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[11px] text-white" style={{ fontWeight: 500 }}>
                Clique para trocar a foto de capa
              </span>
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_2px_8px_#D1D1D6]">
                <Camera className="w-4 h-4 text-[#636366]" />
              </div>
            </div>
          </div>
          <p className="text-[11px] mt-2" style={{ fontWeight: 400, color: dk.textMuted }}>
            A foto de capa será exibida no topo da galeria do cliente e em links compartilhados.
          </p>
        </div>
      </WidgetCard>
    </DndProvider>
  );
}