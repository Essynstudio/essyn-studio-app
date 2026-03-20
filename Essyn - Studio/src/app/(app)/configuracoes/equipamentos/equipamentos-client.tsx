"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Search,
  Wrench,
  Package,
  DollarSign,
  Calendar,
  Camera,
  Aperture,
  Zap,
  Mic,
  Briefcase,
  Trash2,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  ActionPill,
  WidgetEmptyState,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
  PILL_CLS,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { toast } from "sonner";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

type EquipmentCategory = "camera" | "lente" | "iluminacao" | "acessorio" | "audio";
type EquipmentCondition = "excelente" | "bom" | "regular" | "ruim";
type MaintenanceType = "revisao" | "calibracao" | "reparo";

interface Equipment {
  id: string;
  name: string;
  serial: string;
  brand: string;
  category: EquipmentCategory;
  condition: EquipmentCondition;
  value: number;
  nextMaint: string | null;
  color: string;
}

interface Maintenance {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: MaintenanceType;
  date: string;
  cost: number;
  description: string;
}

// ═══════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════

const CATEGORY_CONFIG: Record<EquipmentCategory, { label: string; color: string }> = {
  camera: { label: "Câmera", color: "var(--info)" },
  lente: { label: "Lente", color: "var(--success)" },
  iluminacao: { label: "Iluminação", color: "var(--warning)" },
  acessorio: { label: "Acessório", color: "var(--accent)" },
  audio: { label: "Áudio", color: "var(--fg-muted)" },
};

const CONDITION_CONFIG: Record<EquipmentCondition, { label: string; color: string }> = {
  excelente: { label: "Excelente", color: "var(--success)" },
  bom: { label: "Bom", color: "var(--info)" },
  regular: { label: "Regular", color: "var(--warning)" },
  ruim: { label: "Ruim", color: "var(--error)" },
};

const MAINTENANCE_TYPE_CONFIG: Record<MaintenanceType, { label: string }> = {
  revisao: { label: "Revisão" },
  calibracao: { label: "Calibração" },
  reparo: { label: "Reparo" },
};

const CATEGORY_ICON: Record<EquipmentCategory, typeof Camera> = {
  camera: Camera,
  lente: Aperture,
  iluminacao: Zap,
  acessorio: Briefcase,
  audio: Mic,
};

const INITIAL_EQUIPMENT: Equipment[] = [
  { id: "1", name: "Canon R5 Mark II", serial: "CN-2024-00847", brand: "Canon", category: "camera", condition: "excelente", value: 28500, nextMaint: "2026-06-15", color: "var(--info)" },
  { id: "2", name: "Canon R6 Mark III", serial: "CN-2025-01293", brand: "Canon", category: "camera", condition: "excelente", value: 18900, nextMaint: null, color: "var(--info)" },
  { id: "3", name: "RF 28-70mm f/2L", serial: "CN-L-2024-05521", brand: "Canon", category: "lente", condition: "bom", value: 19500, nextMaint: "2026-08-01", color: "var(--success)" },
  { id: "4", name: "RF 85mm f/1.2L", serial: "CN-L-2023-03281", brand: "Canon", category: "lente", condition: "excelente", value: 16800, nextMaint: null, color: "var(--success)" },
  { id: "5", name: "RF 70-200mm f/2.8L", serial: "CN-L-2024-07012", brand: "Canon", category: "lente", condition: "bom", value: 17200, nextMaint: null, color: "var(--success)" },
  { id: "6", name: "Godox AD600 Pro", serial: "GD-2023-11420", brand: "Godox", category: "iluminacao", condition: "bom", value: 4800, nextMaint: "2026-05-15", color: "var(--warning)" },
  { id: "7", name: "Godox V1 Canon", serial: "GD-2024-08832", brand: "Godox", category: "iluminacao", condition: "regular", value: 1800, nextMaint: "2026-03-15", color: "var(--warning)" },
  { id: "8", name: "DJI RS4 Pro", serial: "DJ-2024-44210", brand: "DJI", category: "acessorio", condition: "excelente", value: 4200, nextMaint: null, color: "var(--error)" },
  { id: "9", name: "Tripe Manfrotto 055", serial: "MF-2022-99101", brand: "Manfrotto", category: "acessorio", condition: "bom", value: 2900, nextMaint: null, color: "var(--error)" },
  { id: "10", name: "Softbox Godox 120cm", serial: "GD-2023-55012", brand: "Godox", category: "iluminacao", condition: "regular", value: 650, nextMaint: null, color: "var(--warning)" },
  { id: "11", name: "Rode Wireless ME", serial: "RD-2024-12098", brand: "Rode", category: "audio", condition: "excelente", value: 1500, nextMaint: null, color: "var(--error)" },
  { id: "12", name: "Peak Design Sling", serial: "PD-2024-33001", brand: "Peak Design", category: "acessorio", condition: "bom", value: 900, nextMaint: null, color: "var(--error)" },
];

const INITIAL_MAINTENANCE: Maintenance[] = [
  { id: "m1", equipmentId: "1", equipmentName: "Canon R5 Mark II", type: "revisao", date: "2025-12-10", cost: 450, description: "Revisao geral do corpo e sensor" },
  { id: "m2", equipmentId: "3", equipmentName: "RF 28-70mm f/2L", type: "calibracao", date: "2025-11-20", cost: 280, description: "Calibração de foco e estabilizador" },
  { id: "m3", equipmentId: "6", equipmentName: "Godox AD600 Pro", type: "reparo", date: "2025-10-05", cost: 180, description: "Troca do capacitor do flash" },
  { id: "m4", equipmentId: "7", equipmentName: "Godox V1 Canon", type: "revisao", date: "2026-01-15", cost: 120, description: "Revisao do sistema de recarga" },
  { id: "m5", equipmentId: "9", equipmentName: "Tripe Manfrotto 055", type: "reparo", date: "2026-02-20", cost: 280, description: "Troca das travas de perna" },
];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export function EquipamentosClient({ studioId }: { studioId: string }) {
  const router = useRouter();

  // State
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [maintenance, setMaintenance] = useState<Maintenance[]>(INITIAL_MAINTENANCE);
  const [activeTab, setActiveTab] = useState<"inventario" | "manutencao">("inventario");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | "todos">("todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);

  // Form state — add equipment
  const [newName, setNewName] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState<EquipmentCategory>("camera");
  const [newCondition, setNewCondition] = useState<EquipmentCondition>("excelente");
  const [newValue, setNewValue] = useState("");
  const [newNextMaint, setNewNextMaint] = useState("");

  // Form state — maintenance
  const [maintEquipId, setMaintEquipId] = useState("");
  const [maintType, setMaintType] = useState<MaintenanceType>("revisao");
  const [maintDate, setMaintDate] = useState("");
  const [maintCost, setMaintCost] = useState("");
  const [maintDesc, setMaintDesc] = useState("");

  // Computed
  const totalValue = useMemo(() => equipment.reduce((sum, e) => sum + e.value, 0), [equipment]);
  const totalMaintCost = useMemo(() => maintenance.reduce((sum, m) => sum + m.cost, 0), [maintenance]);
  const uniqueCategories = useMemo(() => {
    const cats = new Set(equipment.map((e) => e.category));
    return Array.from(cats);
  }, [equipment]);

  const upcomingMaint = useMemo(() => {
    const cutoff = new Date("2026-07-01");
    return equipment.filter((e) => e.nextMaint && new Date(e.nextMaint) <= cutoff).length;
  }, [equipment]);

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    equipment.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [equipment]);

  const filtered = useMemo(() => {
    let list = equipment;
    if (categoryFilter !== "todos") {
      list = list.filter((e) => e.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.serial.toLowerCase().includes(q) ||
          e.brand.toLowerCase().includes(q)
      );
    }
    return list;
  }, [equipment, categoryFilter, search]);

  // Handlers
  function resetAddForm() {
    setNewName("");
    setNewSerial("");
    setNewBrand("");
    setNewCategory("camera");
    setNewCondition("excelente");
    setNewValue("");
    setNewNextMaint("");
  }

  function resetMaintForm() {
    setMaintEquipId("");
    setMaintType("revisao");
    setMaintDate("");
    setMaintCost("");
    setMaintDesc("");
  }

  function handleAddEquipment() {
    if (!newName || !newSerial || !newBrand || !newValue) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    const item: Equipment = {
      id: generateId(),
      name: newName,
      serial: newSerial,
      brand: newBrand,
      category: newCategory,
      condition: newCondition,
      value: parseFloat(newValue),
      nextMaint: newNextMaint || null,
      color: CATEGORY_CONFIG[newCategory].color,
    };

    setEquipment((prev) => [...prev, item]);
    toast.success(`${item.name} adicionado ao inventario`);
    setShowAddModal(false);
    resetAddForm();
  }

  function handleAddMaintenance() {
    if (!maintEquipId || !maintDate || !maintCost) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    const equip = equipment.find((e) => e.id === maintEquipId);
    if (!equip) return;

    const record: Maintenance = {
      id: generateId(),
      equipmentId: maintEquipId,
      equipmentName: equip.name,
      type: maintType,
      date: maintDate,
      cost: parseFloat(maintCost),
      description: maintDesc,
    };

    setMaintenance((prev) => [...prev, record]);
    toast.success(`Manutencao registrada para ${equip.name}`);
    setShowMaintModal(false);
    resetMaintForm();
  }

  function handleDeleteEquipment(id: string) {
    const item = equipment.find((e) => e.id === id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    toast.success(`${item?.name} removido do inventario`);
  }

  // Tab pills config
  const categoryPills: { key: EquipmentCategory | "todos"; label: string }[] = [
    { key: "todos", label: "Todos" },
    ...Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
      key: key as EquipmentCategory,
      label: `${cfg.label} (${categoryCount[key] || 0})`,
    })),
  ];

  return (
    <PageTransition>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => router.push("/configuracoes")}
          className={GHOST_BTN}
          aria-label="Voltar"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-[12px] text-[var(--fg-muted)]">
          Configuracoes &gt; Equipamentos
        </span>
      </div>

      <div className="space-y-5">
        {/* ═══ Unified Panel — header, search, stats, filters all in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Equipamentos</h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {equipment.length} itens &middot; {formatCurrency(totalValue)} em patrimonio
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMaintModal(true)}
                  className={SECONDARY_CTA}
                >
                  <Wrench size={16} />
                  Registrar manutencao
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className={PRIMARY_CTA}
                >
                  <Plus size={16} />
                  Adicionar equipamento
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar equipamentos, serial, marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Stats — bottom of unified card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Total de itens</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{equipment.length}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{uniqueCategories.length} categorias</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Valor patrimonial</p>
              <p className="text-[18px] font-bold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">{formatCurrency(totalValue)}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">total investido</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Manutenções</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{maintenance.length}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{formatCurrency(totalMaintCost)} investidos</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Próx. manutenção</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{upcomingMaint}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">itens até Jun/26</p>
            </div>
          </div>

          {/* Tabs + Category filters */}
          <div className="px-6 py-4 space-y-2.5 border-t border-[var(--border-subtle)]">
            {/* Row 1: Main tabs */}
            <div className="flex items-center gap-1.5">
              {([
                { key: "inventario" as const, label: "Inventário", count: equipment.length },
                { key: "manutencao" as const, label: "Manutenção", count: maintenance.length },
              ]).map((tab) => (
                <ActionPill
                  key={tab.key}
                  label={tab.label}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  count={tab.count}
                />
              ))}
            </div>

            {/* Row 2: Category pills (only for inventario tab) */}
            {activeTab === "inventario" && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {categoryPills.map((pill) => (
                  <ActionPill
                    key={pill.key}
                    label={pill.label}
                    active={categoryFilter === pill.key}
                    onClick={() => setCategoryFilter(pill.key)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Data Table — separate card ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === "inventario" ? (
            <motion.div key="inventario" {...springContentIn}>
              {filtered.length === 0 ? (
                <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <WidgetEmptyState
                    icon={Package}
                    title="Nenhum equipamento encontrado"
                    description="Tente ajustar a busca ou os filtros."
                  />
                </div>
              ) : (
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left px-5 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                            Equipamento
                          </th>
                          <th className="text-left px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                            Categoria
                          </th>
                          <th className="text-left px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                            Condicao
                          </th>
                          <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                            Valor
                          </th>
                          <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                            Prox. manut.
                          </th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((item, idx) => {
                          const catCfg = CATEGORY_CONFIG[item.category];
                          const condCfg = CONDITION_CONFIG[item.condition];
                          const Icon = CATEGORY_ICON[item.category];

                          return (
                            <motion.tr
                              key={item.id}
                              custom={idx}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 26,
                                delay: idx * 0.015,
                              }}
                              className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                            >
                              {/* Equipment info */}
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <Icon size={18} className="text-[var(--fg-secondary)] shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--fg-muted)]">
                                      {item.serial} &middot; {item.brand}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Category badge */}
                              <td className="px-3 py-3">
                                <span
                                  className={PILL_CLS}
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${catCfg.color} 15%, transparent)`,
                                    color: catCfg.color,
                                  }}
                                >
                                  {catCfg.label}
                                </span>
                              </td>

                              {/* Condition badge */}
                              <td className="px-3 py-3">
                                <span
                                  className={PILL_CLS}
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${condCfg.color} 15%, transparent)`,
                                    color: condCfg.color,
                                  }}
                                >
                                  {condCfg.label}
                                </span>
                              </td>

                              {/* Value */}
                              <td className="px-3 py-3 text-right text-[13px] font-medium text-[var(--fg)]">
                                {formatCurrency(item.value)}
                              </td>

                              {/* Next maintenance */}
                              <td className="px-3 py-3 text-right text-[13px] text-[var(--fg-secondary)]">
                                {formatDate(item.nextMaint)}
                              </td>

                              {/* Delete */}
                              <td className="px-2 py-3">
                                <button
                                  onClick={() => handleDeleteEquipment(item.id)}
                                  className={GHOST_BTN}
                                  aria-label={`Remover ${item.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                    <p className="text-[12px] text-[var(--fg-muted)]">
                      {filtered.length} equipamento{filtered.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="manutencao" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th className="text-left px-5 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                          Equipamento
                        </th>
                        <th className="text-left px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                          Tipo
                        </th>
                        <th className="text-left px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                          Data
                        </th>
                        <th className="text-right px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                          Custo
                        </th>
                        <th className="text-left px-3 py-3 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em]">
                          Descricao
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenance.map((m, idx) => (
                        <motion.tr
                          key={m.id}
                          custom={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 26,
                            delay: idx * 0.015,
                          }}
                          className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors"
                        >
                          <td className="px-5 py-3 text-[13px] font-medium text-[var(--fg)]">
                            {m.equipmentName}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={PILL_CLS}
                              style={{
                                backgroundColor: "var(--bg-elevated)",
                                color: "var(--fg-secondary)",
                              }}
                            >
                              {MAINTENANCE_TYPE_CONFIG[m.type].label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[13px] text-[var(--fg-secondary)]">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-3 py-3 text-right text-[13px] font-medium text-[var(--fg)]">
                            {formatCurrency(m.cost)}
                          </td>
                          <td className="px-3 py-3 text-[13px] text-[var(--fg-secondary)] max-w-[300px] truncate">
                            {m.description}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                  <p className="text-[12px] text-[var(--fg-muted)]">
                    {maintenance.length} registro{maintenance.length !== 1 ? "s" : ""} &middot;{" "}
                    {formatCurrency(totalMaintCost)} total
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* Modal: Adicionar Equipamento                   */}
      {/* ═══════════════════════════════════════════════ */}
      <AppleModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetAddForm();
        }}
        title="Adicionar equipamento"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className={LABEL_CLS}>Nome *</label>
            <input
              type="text"
              placeholder="Ex: Canon R5 Mark II"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Numero de serie *</label>
              <input
                type="text"
                placeholder="Ex: CN-2024-00847"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Marca *</label>
              <input
                type="text"
                placeholder="Ex: Canon"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EquipmentCategory)}
                className={`${SELECT_CLS} w-full`}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Condicao</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as EquipmentCondition)}
                className={`${SELECT_CLS} w-full`}
              >
                {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Valor (R$) *</label>
              <input
                type="number"
                placeholder="0"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className={INPUT_CLS}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Prox. manutencao</label>
              <input
                type="date"
                value={newNextMaint}
                onChange={(e) => setNewNextMaint(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={() => {
              setShowAddModal(false);
              resetAddForm();
            }}
            className={SECONDARY_CTA}
          >
            Cancelar
          </button>
          <button onClick={handleAddEquipment} className={PRIMARY_CTA}>
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </AppleModal>

      {/* ═══════════════════════════════════════════════ */}
      {/* Modal: Registrar Manutencao                    */}
      {/* ═══════════════════════════════════════════════ */}
      <AppleModal
        open={showMaintModal}
        onClose={() => {
          setShowMaintModal(false);
          resetMaintForm();
        }}
        title="Registrar manutencao"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className={LABEL_CLS}>Equipamento *</label>
            <select
              value={maintEquipId}
              onChange={(e) => setMaintEquipId(e.target.value)}
              className={`${SELECT_CLS} w-full`}
            >
              <option value="">Selecione um equipamento</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.serial})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Tipo</label>
              <select
                value={maintType}
                onChange={(e) => setMaintType(e.target.value as MaintenanceType)}
                className={`${SELECT_CLS} w-full`}
              >
                {Object.entries(MAINTENANCE_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Data *</label>
              <input
                type="date"
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Custo (R$) *</label>
            <input
              type="number"
              placeholder="0"
              value={maintCost}
              onChange={(e) => setMaintCost(e.target.value)}
              className={INPUT_CLS}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Descricao</label>
            <input
              type="text"
              placeholder="Descreva o servico realizado"
              value={maintDesc}
              onChange={(e) => setMaintDesc(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={() => {
              setShowMaintModal(false);
              resetMaintForm();
            }}
            className={SECONDARY_CTA}
          >
            Cancelar
          </button>
          <button onClick={handleAddMaintenance} className={PRIMARY_CTA}>
            <Wrench size={16} />
            Registrar
          </button>
        </div>
      </AppleModal>
    </PageTransition>
  );
}
