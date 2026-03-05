import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { TagPill } from "../ui/tag-pill";
import { AppleModal } from "../ui/apple-modal";
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from "../ui/apple-kit";

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type EquipmentCategory = "camera" | "lente" | "iluminacao" | "acessorio" | "audio";
type EquipmentCondition = "excelente" | "bom" | "regular" | "manutencao";

interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serial: string;
  condition: EquipmentCondition;
  purchaseDate: string;
  value: number;
  notes: string;
  nextMaintenance?: string;
  lastMaintenance?: string;
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: "revisao" | "calibracao" | "reparo" | "limpeza";
  date: string;
  cost: number;
  provider: string;
  notes: string;
}

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

const categoryConfig: Record<EquipmentCategory, { label: string; color: string; bg: string }> = {
  camera: { label: "Câmera", color: "#007AFF", bg: "#EDF4FF" },
  lente: { label: "Lente", color: "#34C759", bg: "#E8F8ED" },
  iluminacao: { label: "Iluminação", color: "#FF9500", bg: "#FFF4E6" },
  acessorio: { label: "Acessório", color: "#AF52DE", bg: "#F5EDFA" },
  audio: { label: "Áudio", color: "#FF2D55", bg: "#FFEBEF" },
};

const conditionConfig: Record<EquipmentCondition, { label: string; variant: "success" | "info" | "warning" | "error" }> = {
  excelente: { label: "Excelente", variant: "success" },
  bom: { label: "Bom", variant: "info" },
  regular: { label: "Regular", variant: "warning" },
  manutencao: { label: "Em manutenção", variant: "error" },
};

const maintenanceTypeConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "neutral" }> = {
  revisao: { label: "Revisão", variant: "info" },
  calibracao: { label: "Calibração", variant: "warning" },
  reparo: { label: "Reparo", variant: "neutral" },
  limpeza: { label: "Limpeza", variant: "success" },
};

const initialEquipment: Equipment[] = [
  { id: "eq1", name: "Canon R5 Mark II", category: "camera", brand: "Canon", model: "EOS R5 Mark II", serial: "CN-2024-00847", condition: "excelente", purchaseDate: "2024-03-15", value: 28500, notes: "Body principal — eventos e estúdio", nextMaintenance: "2026-06-15", lastMaintenance: "2025-12-10" },
  { id: "eq2", name: "Canon R6 Mark III", category: "camera", brand: "Canon", model: "EOS R6 Mark III", serial: "CN-2025-01293", condition: "excelente", purchaseDate: "2025-01-20", value: 18900, notes: "Body secundário — backup e making-of" },
  { id: "eq3", name: "RF 28-70mm f/2L", category: "lente", brand: "Canon", model: "RF 28-70mm f/2L USM", serial: "CN-L-2024-05521", condition: "bom", purchaseDate: "2024-03-15", value: 19500, notes: "Zoom principal para cerimônias", nextMaintenance: "2026-09-01", lastMaintenance: "2025-09-01" },
  { id: "eq4", name: "RF 85mm f/1.2L", category: "lente", brand: "Canon", model: "RF 85mm f/1.2L USM", serial: "CN-L-2023-03281", condition: "excelente", purchaseDate: "2023-08-10", value: 16800, notes: "Retratos e ensaios" },
  { id: "eq5", name: "RF 70-200mm f/2.8L", category: "lente", brand: "Canon", model: "RF 70-200mm f/2.8L IS USM", serial: "CN-L-2024-07012", condition: "bom", purchaseDate: "2024-06-05", value: 17200, notes: "Teleobjetiva para cerimônias e esportes" },
  { id: "eq6", name: "Godox AD600 Pro", category: "iluminacao", brand: "Godox", model: "AD600 Pro", serial: "GD-2023-11420", condition: "bom", purchaseDate: "2023-05-12", value: 4800, notes: "Flash principal para estúdio e externas", nextMaintenance: "2026-05-12", lastMaintenance: "2025-05-12" },
  { id: "eq7", name: "Godox V1 Canon", category: "iluminacao", brand: "Godox", model: "V1-C", serial: "GD-2024-08832", condition: "regular", purchaseDate: "2024-02-28", value: 1800, notes: "Flash on-camera para eventos — precisa recalibrar", nextMaintenance: "2026-04-01" },
  { id: "eq8", name: "DJI RS4 Pro", category: "acessorio", brand: "DJI", model: "RS4 Pro", serial: "DJ-2024-44210", condition: "excelente", purchaseDate: "2024-09-01", value: 4200, notes: "Estabilizador para câmera em eventos" },
  { id: "eq9", name: "Tripé Manfrotto 055", category: "acessorio", brand: "Manfrotto", model: "MT055CXPRO4", serial: "MF-2022-99101", condition: "bom", purchaseDate: "2022-11-20", value: 2900, notes: "Tripé principal — fibra de carbono" },
  { id: "eq10", name: "Softbox Godox 120cm", category: "iluminacao", brand: "Godox", model: "QR-P120", serial: "GD-2023-55012", condition: "regular", purchaseDate: "2023-07-15", value: 650, notes: "Softbox octagonal para retratos em estúdio" },
  { id: "eq11", name: "Rode Wireless ME", category: "audio", brand: "Rode", model: "Wireless ME", serial: "RD-2024-12098", condition: "excelente", purchaseDate: "2024-04-10", value: 1500, notes: "Microfone wireless para votos e discursos" },
  { id: "eq12", name: "Peak Design Sling", category: "acessorio", brand: "Peak Design", model: "Everyday Sling 10L", serial: "PD-2024-33001", condition: "bom", purchaseDate: "2024-01-15", value: 900, notes: "Bolsa lateral para equipamento de evento" },
];

const initialMaintenance: MaintenanceRecord[] = [
  { id: "mt1", equipmentId: "eq1", equipmentName: "Canon R5 Mark II", type: "revisao", date: "2025-12-10", cost: 450, provider: "Canon Assistência SP", notes: "Revisão geral — sensor limpo, firmware atualizado" },
  { id: "mt2", equipmentId: "eq3", equipmentName: "RF 28-70mm f/2L", type: "calibracao", date: "2025-09-01", cost: 350, provider: "Canon Assistência SP", notes: "Calibração AF microadjust via USB Dock" },
  { id: "mt3", equipmentId: "eq6", equipmentName: "Godox AD600 Pro", type: "limpeza", date: "2025-05-12", cost: 150, provider: "Studio Tech Lab", notes: "Limpeza e teste de potência — 100% operacional" },
  { id: "mt4", equipmentId: "eq7", equipmentName: "Godox V1 Canon", type: "reparo", date: "2025-08-20", cost: 280, provider: "Studio Tech Lab", notes: "Troca do sapata hot shoe — contato intermitente" },
  { id: "mt5", equipmentId: "eq9", equipmentName: "Tripé Manfrotto 055", type: "limpeza", date: "2025-03-15", cost: 80, provider: "Manutenção própria", notes: "Limpeza das travas e lubrificação dos segmentos" },
];

/* ═══════════════════════════════════════════════════ */
/*  CATEGORY ICON                                     */
/* ═══════════════════════════════════════════════════ */

function CategoryIcon({ category, size = 16 }: { category: EquipmentCategory; size?: number }) {
  const cfg = categoryConfig[category];
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: size + 12, height: size + 12, backgroundColor: cfg.bg }}
    >
      <Camera style={{ width: size, height: size, color: cfg.color }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  VIEW STATES                                       */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  return <WidgetSkeleton rows={6} delay={0.06} />;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <WidgetCard delay={0.06}>
      <WidgetEmptyState
        icon={<Camera className="w-5 h-5" />}
        message="Nenhum equipamento cadastrado — adicione câmeras, lentes e acessórios ao inventário"
        cta="Adicionar equipamento"
        onCta={onCreate}
      />
    </WidgetCard>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <WidgetCard delay={0.06}>
      <WidgetErrorState
        message="Erro ao carregar inventário"
        onRetry={onRetry}
      />
    </WidgetCard>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  ADD / EDIT EQUIPMENT MODAL                        */
/* ═══════════════════════════════════════════════════ */

function EquipmentFormModal({
  open,
  onClose,
  onSave,
  equipment,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: Equipment) => void;
  equipment?: Equipment | null;
}) {
  const isEdit = !!equipment;
  const [name, setName] = useState(equipment?.name ?? "");
  const [category, setCategory] = useState<EquipmentCategory>(equipment?.category ?? "camera");
  const [brand, setBrand] = useState(equipment?.brand ?? "");
  const [model, setModel] = useState(equipment?.model ?? "");
  const [serial, setSerial] = useState(equipment?.serial ?? "");
  const [condition, setCondition] = useState<EquipmentCondition>(equipment?.condition ?? "excelente");
  const [purchaseDate, setPurchaseDate] = useState(equipment?.purchaseDate ?? "");
  const [value, setValue] = useState(equipment?.value?.toString() ?? "");
  const [notes, setNotes] = useState(equipment?.notes ?? "");

  const handleSubmit = () => {
    if (!name.trim() || !brand.trim()) {
      toast.error("Campos obrigatórios", { description: "Nome e marca são obrigatórios" });
      return;
    }
    onSave({
      id: equipment?.id ?? "eq-" + Date.now(),
      name: name.trim(),
      category,
      brand: brand.trim(),
      model: model.trim(),
      serial: serial.trim(),
      condition,
      purchaseDate,
      value: parseFloat(value) || 0,
      notes: notes.trim(),
      nextMaintenance: equipment?.nextMaintenance,
      lastMaintenance: equipment?.lastMaintenance,
    });
    onClose();
  };

  const inputCls = "h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all";
  const labelCls = "text-[11px] text-[#C7C7CC]";
  const selectCls = "h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all cursor-pointer appearance-none";

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Equipamento" : "Adicionar Equipamento"}
      subtitle={isEdit ? "Atualize as informações do equipamento" : "Cadastre um novo item no inventário"}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Check className="w-3.5 h-3.5" />
            {isEdit ? "Salvar alterações" : "Adicionar"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Row 1: Name + Category */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Canon R5 Mark II" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as EquipmentCategory)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(categoryConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Brand + Model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Marca *</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Canon" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Modelo</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="EOS R5 Mark II" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>

        {/* Row 3: Serial + Condition */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nº de Série</label>
            <input type="text" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="CN-2024-00847" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Condição</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as EquipmentCondition)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(conditionConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Purchase date + Value */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Data de compra</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Valor (R$)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>

        {/* Row 5: Notes */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas sobre o equipamento..."
            rows={2}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all resize-none"
            style={{ fontWeight: 400 }}
          />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAINTENANCE FORM MODAL                            */
/* ═══════════════════════════════════════════════════ */

function MaintenanceFormModal({
  open,
  onClose,
  onSave,
  equipmentList,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (record: MaintenanceRecord) => void;
  equipmentList: Equipment[];
}) {
  const [equipmentId, setEquipmentId] = useState(equipmentList[0]?.id ?? "");
  const [type, setType] = useState<MaintenanceRecord["type"]>("revisao");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [cost, setCost] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!equipmentId || !provider.trim()) {
      toast.error("Campos obrigatórios", { description: "Equipamento e prestador são obrigatórios" });
      return;
    }
    const eq = equipmentList.find((e) => e.id === equipmentId);
    onSave({
      id: "mt-" + Date.now(),
      equipmentId,
      equipmentName: eq?.name ?? "—",
      type,
      date,
      cost: parseFloat(cost) || 0,
      provider: provider.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  const inputCls = "h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all";
  const labelCls = "text-[11px] text-[#C7C7CC]";
  const selectCls = "h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all cursor-pointer appearance-none";

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Registrar Manutenção"
      subtitle="Adicione um registro de revisão, calibração ou reparo"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Check className="w-3.5 h-3.5" />
            Registrar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Equipamento */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Equipamento *</label>
          <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className={selectCls} style={{ fontWeight: 400 }}>
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name} — {eq.serial}</option>
            ))}
          </select>
        </div>

        {/* Type + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as MaintenanceRecord["type"])} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(maintenanceTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>

        {/* Provider + Cost */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelCls} style={{ fontWeight: 500 }}>Prestador *</label>
            <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Canon Assistência SP" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Custo (R$)</label>
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhes do serviço realizado..."
            rows={2}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all resize-none"
            style={{ fontWeight: 400 }}
          />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  EQUIPMENT ROW                                     */
/* ═══════════════════════════════════════════════════ */

function EquipmentRow({
  item,
  index,
  onEdit,
  onDelete,
  onMaintenance,
}: {
  item: Equipment;
  index: number;
  onEdit: (item: Equipment) => void;
  onDelete: (id: string) => void;
  onMaintenance: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cond = conditionConfig[item.condition];
  const cat = categoryConfig[item.category];

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springStagger(index)}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
    >
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cat.bg }}
      >
        <Camera className="w-4 h-4" style={{ color: cat.color }} />
      </div>

      {/* Name + serial */}
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>
          {item.name}
        </span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>
          {item.serial} · {item.brand}
        </span>
      </div>

      {/* Category */}
      <TagPill variant="neutral" size="xs">{cat.label}</TagPill>

      {/* Condition */}
      <TagPill variant={cond.variant} size="xs">{cond.label}</TagPill>

      {/* Value */}
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-24 text-right shrink-0" style={{ fontWeight: 500 }}>
        {formatCurrency(item.value)}
      </span>

      {/* Next maintenance */}
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-24 text-right shrink-0" style={{ fontWeight: 400 }}>
        {item.nextMaintenance ? (
          <span className="flex items-center gap-1 justify-end">
            <Wrench className="w-3 h-3 text-[#D1D1D6]" />
            {new Date(item.nextMaintenance).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
          </span>
        ) : "—"}
      </span>

      {/* Actions */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            {createPortal(
              <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />,
              document.body
            )}
            <div
              className="absolute right-0 top-8 z-[9999] w-48 bg-white rounded-xl border border-[#E5E5EA] p-1"
              style={{ boxShadow: "0 4px 16px #E5E5EA" }}
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(item); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left"
                style={{ fontWeight: 400 }}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Editar
              </button>
              <button
                onClick={() => { setMenuOpen(false); onMaintenance(item.id); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left"
                style={{ fontWeight: 400 }}
              >
                <Wrench className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Registrar manutenção
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(item.id); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer text-left"
                style={{ fontWeight: 400 }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAINTENANCE ROW                                   */
/* ═══════════════════════════════════════════════════ */

function MaintenanceRow({ record, index }: { record: MaintenanceRecord; index: number }) {
  const typeConf = maintenanceTypeConfig[record.type] ?? maintenanceTypeConfig.revisao;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springStagger(index)}
      className="flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0"
    >
      <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
        <Wrench className="w-4 h-4 text-[#AEAEB2]" />
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>
          {record.equipmentName}
        </span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>
          {record.provider} · {record.notes}
        </span>
      </div>
      <TagPill variant={typeConf.variant} size="xs">{typeConf.label}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-20 text-right shrink-0" style={{ fontWeight: 500 }}>
        R$ {record.cost.toLocaleString("pt-BR")}
      </span>
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-24 text-right shrink-0" style={{ fontWeight: 400 }}>
        {new Date(record.date).toLocaleDateString("pt-BR")}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

type ActiveTab = "inventario" | "manutencao";

interface EquipamentosContentProps {
  onBack: () => void;
}

export function EquipamentosContent({ onBack }: EquipamentosContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inventario");
  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(initialMaintenance);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | "all">("all");

  /* ── Modal states ── */
  const [equipFormOpen, setEquipFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);

  /* ── Derived ── */
  const q = searchQuery.trim().toLowerCase();

  const filteredEquipment = useMemo(() => {
    let list = equipment;
    if (filterCategory !== "all") {
      list = list.filter((e) => e.category === filterCategory);
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.brand.toLowerCase().includes(q) ||
          e.serial.toLowerCase().includes(q) ||
          e.model.toLowerCase().includes(q)
      );
    }
    return list;
  }, [equipment, filterCategory, q]);

  const filteredMaintenance = useMemo(() => {
    if (!q) return maintenance;
    return maintenance.filter(
      (m) =>
        m.equipmentName.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q)
    );
  }, [maintenance, q]);

  const totalValue = equipment.reduce((s, e) => s + e.value, 0);
  const maintenanceCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const needsMaintenance = equipment.filter(
    (e) => e.nextMaintenance && new Date(e.nextMaintenance) <= new Date("2026-06-01")
  ).length;

  /* ── Handlers ── */
  const handleSaveEquipment = (item: Equipment) => {
    const exists = equipment.find((e) => e.id === item.id);
    if (exists) {
      setEquipment((prev) => prev.map((e) => (e.id === item.id ? item : e)));
      toast.success("Equipamento atualizado", { description: item.name + " foi atualizado", duration: 3000 });
    } else {
      setEquipment((prev) => [item, ...prev]);
      toast.success("Equipamento adicionado", { description: item.name + " foi adicionado ao inventário", duration: 3000 });
    }
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    const item = equipment.find((e) => e.id === id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    if (item) {
      toast("Equipamento removido", { description: item.name + " foi removido do inventário", duration: 3000 });
    }
  };

  const handleSaveMaintenance = (record: MaintenanceRecord) => {
    setMaintenance((prev) => [record, ...prev]);
    /* Update lastMaintenance on the equipment */
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === record.equipmentId ? { ...e, lastMaintenance: record.date } : e
      )
    );
    toast.success("Manutenção registrada", {
      description: record.equipmentName + " — " + maintenanceTypeConfig[record.type].label,
      duration: 3000,
    });
  };

  const openEditModal = (item: Equipment) => {
    setEditingEquipment(item);
    setEquipFormOpen(true);
  };

  const openNewModal = () => {
    setEditingEquipment(null);
    setEquipFormOpen(true);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  /* ── Category stats ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of equipment) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts;
  }, [equipment]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1
              className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]"
              style={{ fontWeight: 700 }}
            >
              Equipamentos
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* State toggles (dev) */}
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
              {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setViewState(s)}
                  className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (
                    viewState === s
                      ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]"
                      : "text-[#C7C7CC] hover:text-[#8E8E93]"
                  )}
                  style={{ fontWeight: 500 }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMaintenanceFormOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <Wrench className="w-3.5 h-3.5" />
              Registrar manutenção
            </button>

            <button
              onClick={openNewModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
              style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar equipamento
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-11">
          <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            Inventário e manutenção de equipamentos fotográficos
          </span>
          {viewState === "ready" && (
            <>
              <span className="w-px h-3 bg-[#E5E5EA]" />
              <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                {equipment.length} itens · {formatCurrency(totalValue)} em patrimônio
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <EmptyState onCreate={openNewModal} />
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <ErrorState onRetry={() => setViewState("ready")} />
          </motion.div>
        ) : (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="flex flex-col gap-4">
            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total de itens", value: String(equipment.length), sub: Object.keys(categoryCounts).length + " categorias" },
                { label: "Valor patrimonial", value: formatCurrency(totalValue), sub: "total investido" },
                { label: "Manutenções", value: String(maintenance.length), sub: formatCurrency(maintenanceCost) + " investidos" },
                { label: "Próx. manutenção", value: String(needsMaintenance), sub: needsMaintenance > 0 ? "itens até Jun/26" : "nenhum pendente" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springStagger(i)}
                  className="flex flex-col gap-1 px-4 py-3.5 bg-white rounded-2xl border border-[#E5E5EA]"
                  style={{ boxShadow: "0 1px 3px #F2F2F7" }}
                >
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{kpi.label}</span>
                  <span className="text-[18px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 700 }}>{kpi.value}</span>
                  <span className="text-[11px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>{kpi.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* ── Tab bar ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
                {([
                  { key: "inventario" as ActiveTab, label: "Inventário", count: equipment.length },
                  { key: "manutencao" as ActiveTab, label: "Manutenção", count: maintenance.length },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (
                      activeTab === tab.key
                        ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]"
                        : "text-[#C7C7CC] hover:text-[#8E8E93]"
                    )}
                    style={{ fontWeight: 500 }}
                  >
                    {tab.label}
                    <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Category filter (inventory only) */}
                {activeTab === "inventario" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilterCategory("all")}
                      className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (
                        filterCategory === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                      )}
                      style={{ fontWeight: 500 }}
                    >
                      Todos
                    </button>
                    {Object.entries(categoryConfig).map(([k, v]) => (
                      categoryCounts[k] ? (
                        <button
                          key={k}
                          onClick={() => setFilterCategory(k as EquipmentCategory)}
                          className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (
                            filterCategory === k ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                          )}
                          style={{ fontWeight: 500 }}
                        >
                          {v.label} ({categoryCounts[k]})
                        </button>
                      ) : null
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-[#C7C7CC] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "inventario" ? "Buscar equipamento..." : "Buscar manutenção..."}
                    className="w-[200px] h-[34px] pl-8 pr-3 text-[13px] text-[#636366] placeholder:text-[#C7C7CC] bg-[#F5F5F7] outline-none focus:w-[260px] focus:bg-[#EDEDF0] transition-all"
                    style={{ fontWeight: 400, borderRadius: 10 }}
                  />
                </div>
              </div>
            </div>

            {/* ── Table ── */}
            <div
              className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
              style={{ boxShadow: "0 1px 3px #F2F2F7" }}
            >
              {activeTab === "inventario" ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
                    <span className="w-9 shrink-0" />
                    <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                      Equipamento
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[72px] text-center" style={{ fontWeight: 600 }}>
                      Categoria
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>
                      Condição
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-24 text-right" style={{ fontWeight: 600 }}>
                      Valor
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-24 text-right" style={{ fontWeight: 600 }}>
                      Próx. manut.
                    </span>
                    <span className="w-7 shrink-0" />
                  </div>

                  {/* Rows */}
                  <AnimatePresence>
                    {filteredEquipment.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Camera className="w-5 h-5 text-[#D1D1D6]" />
                        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                          {q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum equipamento nesta categoria"}
                        </span>
                      </div>
                    ) : (
                      filteredEquipment.map((item, i) => (
                        <EquipmentRow
                          key={item.id}
                          item={item}
                          index={i}
                          onEdit={openEditModal}
                          onDelete={handleDeleteEquipment}
                          onMaintenance={(id) => {
                            setMaintenanceFormOpen(true);
                          }}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  {/* Maintenance header */}
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
                    <span className="w-9 shrink-0" />
                    <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
                      Equipamento / Prestador
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[72px] text-center" style={{ fontWeight: 600 }}>
                      Tipo
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-right" style={{ fontWeight: 600 }}>
                      Custo
                    </span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-24 text-right" style={{ fontWeight: 600 }}>
                      Data
                    </span>
                  </div>

                  {/* Maintenance rows */}
                  <AnimatePresence>
                    {filteredMaintenance.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Wrench className="w-5 h-5 text-[#D1D1D6]" />
                        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                          {q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum registro de manutenção"}
                        </span>
                      </div>
                    ) : (
                      filteredMaintenance.map((record, i) => (
                        <MaintenanceRow key={record.id} record={record} index={i} />
                      ))
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shrink-0" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
                  {activeTab === "inventario" ? filteredEquipment.length : filteredMaintenance.length}
                </span>{" "}
                {activeTab === "inventario" ? "equipamentos" : "registros"}
                {filterCategory !== "all" && activeTab === "inventario" && (
                  <span className="text-[#C7C7CC]"> · filtro: {categoryConfig[filterCategory].label}</span>
                )}
              </span>
              {activeTab === "inventario" && (
                <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  Patrimônio total:{" "}
                  <span className="text-[#8E8E93]" style={{ fontWeight: 500 }}>
                    {formatCurrency(totalValue)}
                  </span>
                </span>
              )}
              {activeTab === "manutencao" && (
                <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  Total investido:{" "}
                  <span className="text-[#8E8E93]" style={{ fontWeight: 500 }}>
                    {formatCurrency(maintenanceCost)}
                  </span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <EquipmentFormModal
        open={equipFormOpen}
        onClose={() => { setEquipFormOpen(false); setEditingEquipment(null); }}
        onSave={handleSaveEquipment}
        equipment={editingEquipment}
      />
      <MaintenanceFormModal
        open={maintenanceFormOpen}
        onClose={() => setMaintenanceFormOpen(false)}
        onSave={handleSaveMaintenance}
        equipmentList={equipment}
      />
    </div>
  );
}