"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Image,
  DollarSign,
  CheckCircle2,
  Check,
  Package,
  Truck,
  AlertTriangle,
  ChevronDown,
  Plus,
  Edit,
  ArrowRight,
  ChevronRight,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  Pencil,
  Save,
  Play,
  GitBranch,
  Copy,
  Lock,
  Globe,
  KeyRound,
  Download,
  Eye,
  Send,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { springContentIn } from "@/lib/motion-tokens";
import {
  INPUT_CLS,
  SELECT_CLS,
  PRIMARY_CTA,
  SECONDARY_CTA,
} from "@/lib/design-tokens";
import {
  AppleDrawer,
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  StatusBadge,
  ListRow,
  ActionPill,
  SectionHeader,
} from "@/components/ui/apple-kit";
import type {
  Project,
  Client,
  ProjectLocation,
  ProjectWorkflow,
  ProjectProduct,
  Installment,
  Pack,
  FinancialStatus,
  WorkflowItemStatus,
  ProjectStatus,
  EventType,
  GalleryStatus,
} from "@/lib/types";
import type { DrawerTab } from "./drawer-provider";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface ProjectDrawerProps {
  projectId: string | null;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onClose: () => void;
  onEditProject?: (data: DrawerData, targetStep?: number) => void;
}

interface Gallery {
  id: string;
  name: string;
  slug: string;
  status: GalleryStatus;
  privacy: "publico" | "privado" | "senha" | "expira";
  photo_count: number;
  download_enabled: boolean;
  cover_url: string | null;
  views: number;
  downloads: number;
  delivery_deadline_date?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface ActivityLogEntry {
  id: string;
  studio_id: string;
  user_id: string | null;
  project_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: { message?: string; old_status?: string; new_status?: string; [key: string]: unknown } | null;
  created_at: string;
}

export interface DrawerData {
  project: (Project & { clients: Client | { id: string; name: string } | null }) | null;
  pack: Pack | null;
  locations: ProjectLocation[];
  installments: Installment[];
  workflows: ProjectWorkflow[];
  products: ProjectProduct[];
  galleries: Gallery[];
  teamMembers: TeamMember[];
  activityLog: ActivityLogEntry[];
}

// ═══════════════════════════════════════════════
// Status helpers
// ═══════════════════════════════════════════════

const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--bg)" },
  confirmado: { label: "Confirmado", color: "var(--info)", bg: "var(--info-subtle)" },
  producao: { label: "Produção", color: "var(--warning)", bg: "var(--warning-subtle)" },
  edicao: { label: "Edição", color: "var(--warning)", bg: "var(--warning-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error-subtle)" },
};

const EVENT_TYPE_MAP: Record<EventType, string> = {
  casamento: "Casamento",
  ensaio: "Ensaio",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  batizado: "Batizado",
  outro: "Outro",
};

const FINANCIAL_STATUS_MAP: Record<FinancialStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "var(--warning)", bg: "var(--warning-subtle)" },
  pago: { label: "Pago", color: "var(--success)", bg: "var(--success-subtle)" },
  vencido: { label: "Vencido", color: "var(--error)", bg: "var(--error-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--fg-muted)", bg: "var(--bg)" },
};

const WORKFLOW_STATUS_MAP: Record<WorkflowItemStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "var(--fg-muted)", bg: "var(--bg)" },
  em_andamento: { label: "Em andamento", color: "var(--warning)", bg: "var(--warning-subtle)" },
  concluido: { label: "Concluído", color: "var(--success)", bg: "var(--success-subtle)" },
};

const GALLERY_STATUS_MAP: Record<GalleryStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--bg)" },
  prova: { label: "Prova", color: "var(--warning)", bg: "var(--warning-subtle)" },
  final: { label: "Final", color: "var(--info)", bg: "var(--info-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  arquivado: { label: "Arquivado", color: "var(--fg-muted)", bg: "var(--bg)" },
  agendada: { label: "Agendada", color: "var(--info)", bg: "var(--info-subtle)" },
};

const TEAM_ROLE_MAP: Record<string, string> = {
  fotografo: "Fotógrafo",
  videomaker: "Videomaker",
  editor: "Editor",
  assistente: "Assistente",
  admin: "Admin",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

// ═══════════════════════════════════════════════
// Tab definitions
// ═══════════════════════════════════════════════

const TABS: { key: DrawerTab; label: string }[] = [
  { key: "dados", label: "Dados" },
  { key: "galeria", label: "Galeria" },
  { key: "financeiro", label: "Financeiro" },
  { key: "producao", label: "Produção" },
  { key: "pedidos", label: "Pedidos" },
  { key: "briefing", label: "Briefing" },
  { key: "servicos", label: "Serviços" },
  { key: "timeline", label: "Timeline" },
];

// ═══════════════════════════════════════════════
// Pendencias helpers
// ═══════════════════════════════════════════════

type EditableSection = "evento" | "locais" | "equipe" | "pacote" | "entrega" | "contatos" | "notas" | null;

interface Pendencia {
  id: string;
  message: string;
  action: "scroll" | "tab";
  target: string; // section id or tab key
  tab?: DrawerTab;
}

function computePendencias(data: DrawerData): Pendencia[] {
  const { project, pack, locations, installments, teamMembers } = data;
  if (!project) return [];

  const pendencias: Pendencia[] = [];
  const client = project.clients as Client | null;

  if (!project.event_date) {
    pendencias.push({
      id: "event_date",
      message: "Defina a data do evento",
      action: "scroll",
      target: "section-evento",
    });
  }

  if (!project.event_time) {
    pendencias.push({
      id: "event_time",
      message: "Defina o horário do evento",
      action: "scroll",
      target: "section-evento",
    });
  }

  if (locations.length === 0) {
    pendencias.push({
      id: "locations",
      message: "Adicione pelo menos um local do evento",
      action: "scroll",
      target: "section-locais",
    });
  }

  if (!project.team_ids || project.team_ids.length === 0) {
    pendencias.push({
      id: "team",
      message: "Defina a equipe do projeto",
      action: "scroll",
      target: "section-equipe",
    });
  }

  if (!client || (!client.email && !client.phone)) {
    pendencias.push({
      id: "contacts",
      message: "Adicione os contatos do cliente",
      action: "scroll",
      target: "section-contatos",
    });
  }

  if (!project.pack_id) {
    pendencias.push({
      id: "pack",
      message: "Selecione ou crie um pacote",
      action: "scroll",
      target: "section-pacote",
    });
  }

  if (project.delivery_deadline_days == null && !project.delivery_deadline_date) {
    pendencias.push({
      id: "deadline",
      message: "Defina o prazo de entrega",
      action: "scroll",
      target: "section-entrega",
    });
  }

  if (installments.length === 0) {
    pendencias.push({
      id: "financial",
      message: "Configure o financeiro do projeto",
      action: "tab",
      target: "financeiro",
      tab: "financeiro",
    });
  }

  return pendencias;
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function ProjectDrawer({ projectId, activeTab, onTabChange, onClose, onEditProject }: ProjectDrawerProps) {
  const [data, setData] = useState<DrawerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const [
        { data: project, error: projErr },
        { data: locations },
        { data: installments },
        { data: workflows },
        { data: products },
        { data: galleries },
        { data: activityLog },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*, clients(id, name, email, phone, document, address, city, state, status)")
          .eq("id", id)
          .single(),
        supabase
          .from("project_locations")
          .select("*")
          .eq("project_id", id)
          .order("sort_order"),
        supabase
          .from("installments")
          .select("*")
          .eq("project_id", id)
          .order("due_date"),
        supabase
          .from("project_workflows")
          .select("*")
          .eq("project_id", id)
          .order("sort_order"),
        supabase
          .from("project_products")
          .select("*")
          .eq("project_id", id),
        supabase
          .from("galleries")
          .select("id, name, slug, status, privacy, photo_count, download_enabled, cover_url, views, downloads, delivery_deadline_date")
          .eq("project_id", id),
        supabase
          .from("activity_log")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (projErr) throw projErr;

      // Fetch pack if project has one
      let pack: Pack | null = null;
      if (project?.pack_id) {
        const { data: packData } = await supabase
          .from("packs")
          .select("*")
          .eq("id", project.pack_id)
          .single();
        pack = packData;
      }

      // Fetch team members if project has team_ids
      let teamMembers: TeamMember[] = [];
      if (project?.team_ids && project.team_ids.length > 0) {
        const { data: teamData } = await supabase
          .from("team_members")
          .select("id, name, role, avatar_url")
          .in("id", project.team_ids);
        teamMembers = (teamData || []) as TeamMember[];
      }

      setData({
        project: project as DrawerData["project"],
        pack,
        locations: (locations || []) as ProjectLocation[],
        installments: (installments || []) as Installment[],
        workflows: (workflows || []) as ProjectWorkflow[],
        products: (products || []) as ProjectProduct[],
        galleries: (galleries || []) as Gallery[],
        teamMembers,
        activityLog: (activityLog || []) as ActivityLogEntry[],
      });
    } catch (err) {
      console.error("Drawer fetch error:", err);
      setError("Erro ao carregar dados do projeto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    } else {
      setData(null);
    }
  }, [projectId, fetchData]);

  const project = data?.project;
  const statusInfo = project ? PROJECT_STATUS_MAP[project.status] : null;
  const eventLabel = project ? EVENT_TYPE_MAP[project.event_type] : "";

  // Clean title — remove event type prefix since badge already shows it
  const cleanTitle = (() => {
    if (!project) return "Carregando...";
    const prefix = eventLabel.toLowerCase();
    const name = project.name;
    return name.toLowerCase().startsWith(prefix + " ")
      ? name.slice(prefix.length + 1).trim()
      : name;
  })();

  return (
    <AppleDrawer
      open={!!projectId}
      onClose={onClose}
      title={cleanTitle}
      width="max-w-lg"
    >
      {loading ? (
        <div className="p-6">
          <WidgetSkeleton lines={5} />
        </div>
      ) : error ? (
        <div className="p-6">
          <WidgetErrorState message={error} onRetry={() => projectId && fetchData(projectId)} />
        </div>
      ) : project ? (
        <div className="flex flex-col">
          {/* Header badges + client summary */}
          <div className="px-6 pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge label={eventLabel} color="var(--info)" bg="var(--info-subtle)" />
                {statusInfo && <StatusBadge {...statusInfo} />}
              </div>
              {onEditProject && data && (
                <button
                  onClick={() => onEditProject(data)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
                >
                  <Pencil size={11} />
                  Editar cadastro
                </button>
              )}
            </div>
            {project.clients && (
              <div className="flex items-center gap-4 text-[11px] text-[var(--fg-secondary)]">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {(project.clients as { name: string }).name}
                </span>
                {(project.clients as { phone?: string | null }).phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {(project.clients as { phone: string }).phone}
                  </span>
                )}
                {(project.clients as { email?: string | null }).email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {(project.clients as { email: string }).email}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="px-6 py-2 border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <ActionPill
                key={t.key}
                label={t.label}
                active={activeTab === t.key}
                onClick={() => onTabChange(t.key)}
              />
            ))}
          </div>

          {/* Tab content */}
          <div className="px-6 py-4 space-y-4">
            {activeTab === "dados" && <DadosTab data={data!} onTabChange={onTabChange} onRefresh={() => projectId && fetchData(projectId)} />}
            {activeTab === "galeria" && <GaleriaTab galleries={data!.galleries} eventType={project.event_type} onEdit={onEditProject && data ? () => onEditProject(data, 3) : undefined} />}
            {activeTab === "financeiro" && <FinanceiroTab project={project} installments={data!.installments} onEdit={onEditProject && data ? () => onEditProject(data, 5) : undefined} />}
            {activeTab === "producao" && <ProducaoTab project={project} workflows={data!.workflows} onRefresh={() => projectId && fetchData(projectId)} onEdit={onEditProject && data ? () => onEditProject(data, 3) : undefined} />}
            {activeTab === "pedidos" && <PedidosTab products={data!.products} onEdit={onEditProject && data ? () => onEditProject(data, 7) : undefined} />}
            {activeTab === "briefing" && <BriefingTab projectId={project.id} eventType={project.event_type} />}
            {activeTab === "servicos" && <ServicosTab projectId={project.id} clientId={(project.clients as { id: string } | null)?.id || null} />}
            {activeTab === "timeline" && <TimelineTab activityLog={data!.activityLog} />}
          </div>
        </div>
      ) : null}
    </AppleDrawer>
  );
}

// ═══════════════════════════════════════════════
// PENDENCIAS SECTION
// ═══════════════════════════════════════════════

const SECTION_TARGET_TO_EDIT: Record<string, EditableSection> = {
  "section-evento": "evento",
  "section-pacote": "pacote",
  "section-entrega": "entrega",
  "section-contatos": "contatos",
};

function PendenciasSection({
  data,
  onTabChange,
  onEditSection,
}: {
  data: DrawerData;
  onTabChange: (tab: DrawerTab) => void;
  onEditSection?: (section: EditableSection) => void;
}) {
  const pendencias = computePendencias(data);
  const [expanded, setExpanded] = useState(pendencias.length > 0);

  const handleResolve = (p: Pendencia) => {
    if (p.action === "tab" && p.tab) {
      onTabChange(p.tab);
    } else {
      // Activate edit mode for the target section if applicable
      const editSection = SECTION_TARGET_TO_EDIT[p.target];
      if (editSection && onEditSection) {
        onEditSection(editSection);
      }
      // Scroll to the section
      const el = document.getElementById(p.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Brief highlight
        el.classList.add("ring-2", "ring-[var(--warning)]/40", "rounded-xl");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-[var(--warning)]/40", "rounded-xl");
        }, 2000);
      }
    }
  };

  // No pendencias = show success
  if (pendencias.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--success-subtle)] border border-[var(--success)]/20"
      >
        <CheckCircle2 size={14} className="text-[var(--success)] shrink-0" />
        <span className="text-[12px] font-medium text-[var(--success)]">Cadastro completo</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning)]/20 overflow-hidden"
    >
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--warning)]/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--warning)] shrink-0" />
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--warning)]">
            Pendências de cadastro
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--warning)]/15 text-[var(--warning)]">
            {pendencias.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <ChevronDown size={14} className="text-[var(--warning)]" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-0">
              {pendencias.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 26,
                    delay: i * 0.04,
                  }}
                  className="flex items-center justify-between py-2 border-b border-[var(--warning)]/10 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle size={12} className="text-[var(--warning)] shrink-0" />
                    <span className="text-[12px] text-[var(--fg-secondary)] truncate">
                      {p.message}
                    </span>
                  </div>
                  <button
                    onClick={() => handleResolve(p)}
                    className="text-[11px] font-medium text-[var(--info)] hover:underline shrink-0 ml-3"
                  >
                    Resolver
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// DADOS TAB
// ═══════════════════════════════════════════════

function DadosTab({ data, onTabChange, onRefresh }: { data: DrawerData; onTabChange: (tab: DrawerTab) => void; onRefresh: () => void }) {
  const { project, pack, locations, teamMembers } = data;
  if (!project) return null;
  const client = project.clients as Client | null;
  const studioId = (project as unknown as { studio_id: string }).studio_id;

  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [saving, setSaving] = useState(false);
  const [sendingPortalAccess, setSendingPortalAccess] = useState(false);

  // ── Evento edit state ──
  const [editEventDate, setEditEventDate] = useState(project.event_date || "");
  const [editEventTime, setEditEventTime] = useState(project.event_time || "");

  // ── Pack edit state ──
  const [availablePacks, setAvailablePacks] = useState<{ id: string; name: string; base_value: number }[]>([]);
  const [selectedPackId, setSelectedPackId] = useState(project.pack_id || "");
  const [loadingPacks, setLoadingPacks] = useState(false);

  // ── Entrega edit state ──
  const [editDeadlineDays, setEditDeadlineDays] = useState<string>(
    project.delivery_deadline_days?.toString() || ""
  );

  // ── Locais edit state ──
  const [editLocations, setEditLocations] = useState<{ id?: string; name: string; address: string; event_time: string }[]>([]);

  // ── Equipe edit state ──
  const [availableMembers, setAvailableMembers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // ── Contatos edit state ──
  const [editClientName, setEditClientName] = useState(client?.name || "");
  const [editEmail, setEditEmail] = useState(client?.email || "");
  const [editPhone, setEditPhone] = useState(client?.phone || "");
  const [editDocument, setEditDocument] = useState(client?.document || "");
  const [editAddress, setEditAddress] = useState(client?.address || "");
  const [editCity, setEditCity] = useState(client?.city || "");
  const [editState, setEditState] = useState(client?.state || "");

  // ── Notas edit state ──
  const [editNotes, setEditNotes] = useState(project.notes || "");

  // Reset form values when entering edit mode
  const startEditing = useCallback(async (section: EditableSection) => {
    if (section === "evento") {
      setEditEventDate(project.event_date || "");
      setEditEventTime(project.event_time || "");
    } else if (section === "locais") {
      setEditLocations(
        locations.length > 0
          ? locations.map((l) => ({ id: l.id, name: l.name, address: l.address || "", event_time: l.event_time || "" }))
          : [{ name: "", address: "", event_time: "" }]
      );
    } else if (section === "equipe") {
      setSelectedTeamIds(project.team_ids || []);
      setLoadingMembers(true);
      const supabase = createClient();
      const { data: membersData } = await supabase
        .from("team_members")
        .select("id, name, role")
        .eq("studio_id", studioId)
        .eq("active", true)
        .order("name");
      setAvailableMembers(membersData || []);
      setLoadingMembers(false);
    } else if (section === "pacote") {
      setSelectedPackId(project.pack_id || "");
      setLoadingPacks(true);
      const supabase = createClient();
      const { data: packsData } = await supabase
        .from("packs")
        .select("id, name, base_value")
        .eq("studio_id", studioId)
        .order("name");
      setAvailablePacks(packsData || []);
      setLoadingPacks(false);
    } else if (section === "entrega") {
      setEditDeadlineDays(project.delivery_deadline_days?.toString() || "");
    } else if (section === "contatos") {
      setEditClientName(client?.name || "");
      setEditEmail(client?.email || "");
      setEditPhone(client?.phone || "");
      setEditDocument(client?.document || "");
      setEditAddress(client?.address || "");
      setEditCity(client?.city || "");
      setEditState(client?.state || "");
    } else if (section === "notas") {
      setEditNotes(project.notes || "");
    }
    setEditingSection(section);
  }, [project, client, studioId, locations]);

  const cancelEditing = () => setEditingSection(null);

  // ── Save handlers ──

  const saveEvento = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .update({
          event_date: editEventDate || null,
          event_time: editEventTime || null,
        })
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Evento atualizado!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  const savePacote = async () => {
    if (!selectedPackId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const selectedPack = availablePacks.find((p) => p.id === selectedPackId);
      const updateData: Record<string, unknown> = { pack_id: selectedPackId };
      if (selectedPack && selectedPack.base_value > 0) {
        updateData.value = selectedPack.base_value;
      }
      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Pacote atualizado!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar pacote");
    } finally {
      setSaving(false);
    }
  };

  const saveEntrega = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const days = editDeadlineDays ? parseInt(editDeadlineDays, 10) : null;
      let deadlineDate: string | null = null;
      if (days && project.event_date) {
        const d = new Date(project.event_date + "T00:00:00");
        d.setDate(d.getDate() + days);
        deadlineDate = d.toISOString().split("T")[0];
      }
      const { error } = await supabase
        .from("projects")
        .update({
          delivery_deadline_days: days,
          delivery_deadline_date: deadlineDate,
        })
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Prazo de entrega atualizado!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar prazo de entrega");
    } finally {
      setSaving(false);
    }
  };

  const saveLocais = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const validLocations = editLocations.filter((l) => l.name.trim());
      // Delete existing locations
      await supabase.from("project_locations").delete().eq("project_id", project.id);
      // Insert new ones
      if (validLocations.length > 0) {
        const { error } = await supabase.from("project_locations").insert(
          validLocations.map((l, i) => ({
            project_id: project.id,
            studio_id: studioId,
            name: l.name.trim(),
            address: l.address.trim() || null,
            event_time: l.event_time || null,
            sort_order: i,
          }))
        );
        if (error) throw error;
      }
      toast.success("Locais atualizados!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar locais");
    } finally {
      setSaving(false);
    }
  };

  const saveEquipe = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .update({ team_ids: selectedTeamIds })
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Equipe atualizada!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar equipe");
    } finally {
      setSaving(false);
    }
  };

  const saveContatos = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({
          name: editClientName.trim() || client.name,
          email: editEmail || null,
          phone: editPhone || null,
          document: editDocument || null,
          address: editAddress || null,
          city: editCity || null,
          state: editState || null,
        })
        .eq("id", client.id);
      if (error) throw error;
      toast.success("Cliente atualizado!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar cliente");
    } finally {
      setSaving(false);
    }
  };

  const saveNotas = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .update({ notes: editNotes.trim() || null })
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Observações atualizadas!");
      setEditingSection(null);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar observações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 1. Pendências */}
      <PendenciasSection data={data} onTabChange={onTabChange} onEditSection={startEditing} />

      {/* 2. Evento */}
      <div id="section-evento">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Evento"
            editing={editingSection === "evento"}
            onEdit={() => startEditing("evento")}
            onCancel={cancelEditing}
            onSave={saveEvento}
            saving={saving}
          />
          {editingSection === "evento" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Data do evento</label>
                <input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Horário</label>
                <input
                  type="time"
                  value={editEventTime}
                  onChange={(e) => setEditEventTime(e.target.value)}
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2 text-[13px]">
              <InfoRow icon={Calendar} label="Data" value={formatDate(project.event_date)} />
              {project.event_time && (
                <InfoRow icon={Clock} label="Horário" value={formatTime(project.event_time)} />
              )}
              {!project.event_time && (
                <InfoRow icon={Clock} label="Horário" value="A definir" muted />
              )}
            </div>
          )}
        </WidgetCard>
      </div>

      {/* 3. Locais do Evento */}
      <div id="section-locais">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Locais do Evento"
            editing={editingSection === "locais"}
            onEdit={() => startEditing("locais")}
            onCancel={cancelEditing}
            onSave={saveLocais}
            saving={saving}
            saveDisabled={editLocations.every((l) => !l.name.trim())}
          />
          {editingSection === "locais" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-3"
            >
              {editLocations.map((loc, i) => (
                <div key={i} className="space-y-2 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[var(--fg-muted)]">Local {i + 1}</span>
                    {editLocations.length > 1 && (
                      <button
                        onClick={() => setEditLocations((prev) => prev.filter((_, j) => j !== i))}
                        className="text-[10px] text-[var(--error)] hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => {
                      const updated = [...editLocations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setEditLocations(updated);
                    }}
                    placeholder="Nome do local"
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                  <input
                    type="text"
                    value={loc.address}
                    onChange={(e) => {
                      const updated = [...editLocations];
                      updated[i] = { ...updated[i], address: e.target.value };
                      setEditLocations(updated);
                    }}
                    placeholder="Endereço"
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                  <input
                    type="time"
                    value={loc.event_time}
                    onChange={(e) => {
                      const updated = [...editLocations];
                      updated[i] = { ...updated[i], event_time: e.target.value };
                      setEditLocations(updated);
                    }}
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                </div>
              ))}
              <button
                onClick={() => setEditLocations((prev) => [...prev, { name: "", address: "", event_time: "" }])}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--info)] hover:underline"
              >
                <Plus size={12} />
                Adicionar local
              </button>
            </motion.div>
          ) : locations.length > 0 ? (
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <motion.div
                  key={loc.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
                  className="pl-1"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-[var(--fg-muted)] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-[var(--fg)] block">{loc.name}</span>
                      {loc.address && (
                        <span className="text-[11px] text-[var(--fg-secondary)] block">{loc.address}</span>
                      )}
                      {loc.event_time && (
                        <span className="text-[10px] text-[var(--fg-muted)]">{formatTime(loc.event_time)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhum local adicionado</p>
          )}
        </WidgetCard>
      </div>

      {/* 4. Equipe */}
      <div id="section-equipe">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Equipe"
            editing={editingSection === "equipe"}
            onEdit={() => startEditing("equipe")}
            onCancel={cancelEditing}
            onSave={saveEquipe}
            saving={saving}
          />
          {editingSection === "equipe" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-2"
            >
              {loadingMembers ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin text-[var(--fg-muted)]" />
                  <span className="text-[12px] text-[var(--fg-muted)]">Carregando membros...</span>
                </div>
              ) : availableMembers.length > 0 ? (
                <div className="space-y-1">
                  {availableMembers.map((m) => {
                    const isSelected = selectedTeamIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() =>
                          setSelectedTeamIds((prev) =>
                            isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-[var(--info)]/40 bg-[var(--info-subtle)]"
                            : "border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-[var(--info)] bg-[var(--info)]"
                              : "border-[var(--border)]"
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[13px] font-medium text-[var(--fg)] truncate">{m.name}</p>
                          <p className="text-[10px] text-[var(--fg-muted)]">
                            {TEAM_ROLE_MAP[m.role] || m.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)] italic">
                  Nenhum membro ativo cadastrado. Adicione membros em Time.
                </p>
              )}
            </motion.div>
          ) : teamMembers.length > 0 ? (
            <div className="space-y-0">
              {teamMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
                >
                  <div className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                    <div className="w-7 h-7 rounded-full bg-[var(--bg)] flex items-center justify-center shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <User size={13} className="text-[var(--fg-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--fg)] truncate">{member.name}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">
                        {TEAM_ROLE_MAP[member.role] || member.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhum membro definido</p>
          )}
        </WidgetCard>
      </div>

      {/* 5. Pacote Contratado */}
      <div id="section-pacote">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Pacote Contratado"
            editing={editingSection === "pacote"}
            onEdit={() => startEditing("pacote")}
            onCancel={cancelEditing}
            onSave={savePacote}
            saving={saving}
            saveDisabled={!selectedPackId}
          />
          {editingSection === "pacote" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-3"
            >
              {loadingPacks ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin text-[var(--fg-muted)]" />
                  <span className="text-[12px] text-[var(--fg-muted)]">Carregando pacotes...</span>
                </div>
              ) : availablePacks.length > 0 ? (
                <div>
                  <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Selecione um pacote</label>
                  <select
                    value={selectedPackId}
                    onChange={(e) => setSelectedPackId(e.target.value)}
                    className={SELECT_CLS + " w-full !h-9 !text-[13px]"}
                  >
                    <option value="">Escolha...</option>
                    {availablePacks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.base_value > 0 ? ` — ${formatCurrency(p.base_value)}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPackId && (() => {
                    const sel = availablePacks.find((p) => p.id === selectedPackId);
                    return sel && sel.base_value > 0 ? (
                      <p className="text-[11px] text-[var(--fg-secondary)] mt-2">
                        O valor do projeto será atualizado para <strong>{formatCurrency(sel.base_value)}</strong>
                      </p>
                    ) : null;
                  })()}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)] italic">
                  Nenhum pacote cadastrado. Crie um em Configurações.
                </p>
              )}
            </motion.div>
          ) : (
            <>
              {pack ? (
                <>
                  <p className="text-[13px] font-medium text-[var(--fg)] mb-2">{pack.name}</p>
                  {pack.includes && pack.includes.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {pack.includes.map((item, i) => (
                        <li key={i} className="text-[12px] text-[var(--fg-secondary)] flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[var(--success)] shrink-0" />
                          {item.qty > 1 ? `${item.qty}x ` : ""}
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {project.value > 0 && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--fg-muted)]">Valor total</span>
                      <span className="text-[13px] font-semibold text-[var(--fg)]">
                        {formatCurrency(project.value)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhum pacote definido</p>
              )}
            </>
          )}
        </WidgetCard>
      </div>

      {/* 6. Prazo de Entrega */}
      <div id="section-entrega">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Prazo de Entrega"
            editing={editingSection === "entrega"}
            onEdit={() => startEditing("entrega")}
            onCancel={cancelEditing}
            onSave={saveEntrega}
            saving={saving}
          />
          {editingSection === "entrega" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Dias após o evento</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={editDeadlineDays}
                  onChange={(e) => setEditDeadlineDays(e.target.value)}
                  placeholder="Ex: 30"
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
              {editDeadlineDays && project.event_date && (
                <p className="text-[11px] text-[var(--fg-secondary)]">
                  Entrega prevista: {(() => {
                    const d = new Date(project.event_date + "T00:00:00");
                    d.setDate(d.getDate() + parseInt(editDeadlineDays, 10));
                    return formatDate(d.toISOString().split("T")[0]);
                  })()}
                </p>
              )}
              {editDeadlineDays && !project.event_date && (
                <p className="text-[11px] text-[var(--warning)] italic">
                  A data do evento precisa ser definida para calcular a data de entrega.
                </p>
              )}
            </motion.div>
          ) : (
            <>
              {project.delivery_deadline_date ? (
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[var(--fg-muted)]" />
                  <span className="text-[13px] text-[var(--fg)]">
                    {formatDate(project.delivery_deadline_date)}
                  </span>
                  {project.delivery_deadline_days && (
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      ({project.delivery_deadline_days} dias)
                    </span>
                  )}
                </div>
              ) : project.delivery_deadline_days ? (
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[var(--fg-muted)]" />
                  <span className="text-[13px] text-[var(--fg)]">
                    {project.delivery_deadline_days} dias após o evento
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)] italic">A definir</p>
              )}
            </>
          )}
        </WidgetCard>
      </div>

      {/* 7. Contatos do Cliente */}
      <div id="section-contatos">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Dados do Cliente"
            editing={editingSection === "contatos"}
            onEdit={client ? () => startEditing("contatos") : undefined}
            onCancel={cancelEditing}
            onSave={saveContatos}
            saving={saving}
          />
          {editingSection === "contatos" && client ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Nome</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--fg-muted)] block mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Endereço</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={INPUT_CLS + " !h-9 !text-[13px]"}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Cidade"
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Estado</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className={INPUT_CLS + " !h-9 !text-[13px]"}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {client ? (
                <div className="space-y-2 text-[13px]">
                  <InfoRow icon={User} label="Nome" value={client.name} />
                  {client.phone && <InfoRow icon={Phone} label="Telefone" value={client.phone} />}
                  {client.email && <InfoRow icon={Mail} label="Email" value={client.email} />}
                  {client.document && <InfoRow icon={FileText} label="CPF" value={client.document} />}
                  {(client.address || client.city) && (
                    <InfoRow
                      icon={MapPin}
                      label="Endereço"
                      value={[client.address, client.city, client.state].filter(Boolean).join(", ")}
                    />
                  )}
                  {!client.phone && !client.email && (
                    <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhum contato registrado</p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhum cliente vinculado</p>
              )}
            </>
          )}
        </WidgetCard>
      </div>

      {/* 7b. Enviar acesso ao portal */}
      {client?.email && (
        <div className="px-1">
          <button
            onClick={async () => {
              if (sendingPortalAccess) return;
              setSendingPortalAccess(true);
              try {
                const res = await fetch("/api/portal/send-access", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ clientId: client.id, studioId }),
                });
                const result = await res.json();
                if (res.ok) {
                  toast.success(`Acesso ao portal enviado para ${result.email}`);
                } else {
                  toast.error(result.error || "Erro ao enviar acesso");
                }
              } catch {
                toast.error("Erro ao enviar acesso ao portal");
              } finally {
                setSendingPortalAccess(false);
              }
            }}
            disabled={sendingPortalAccess}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[12px] font-medium text-[var(--accent)] bg-[var(--accent-subtle)] hover:opacity-80 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            {sendingPortalAccess ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Enviar acesso ao portal
          </button>
        </div>
      )}

      {/* 8. Notas */}
      <div id="section-notas">
        <WidgetCard className="p-4" hover={false}>
          <EditableSectionHeader
            title="Observações"
            editing={editingSection === "notas"}
            onEdit={() => startEditing("notas")}
            onCancel={cancelEditing}
            onSave={saveNotas}
            saving={saving}
          />
          {editingSection === "notas" ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Adicione observações sobre o projeto..."
                rows={4}
                className={INPUT_CLS + " !text-[13px] resize-none"}
              />
            </motion.div>
          ) : project.notes ? (
            <p className="text-[12px] text-[var(--fg-secondary)] whitespace-pre-wrap leading-relaxed">
              {project.notes}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--fg-muted)] italic">Nenhuma observação</p>
          )}
        </WidgetCard>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Drawer Section Header (10px uppercase)
// ═══════════════════════════════════════════════

function DrawerSectionHeader({ title }: { title: string }) {
  return (
    <h4 className="text-[10px] font-semibold tracking-wider uppercase text-[var(--fg-muted)] mb-3">
      {title}
    </h4>
  );
}

function EditableSectionHeader({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  saveDisabled,
}: {
  title: string;
  editing: boolean;
  onEdit?: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-[10px] font-semibold tracking-wider uppercase text-[var(--fg-muted)]">
        {title}
      </h4>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--fg-muted)] hover:bg-[var(--sidebar-hover)] transition-colors"
          >
            <X size={11} />
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || saveDisabled}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-[var(--bg-ink)] text-[var(--fg-light)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Salvar
          </button>
        </div>
      ) : onEdit ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <Pencil size={10} />
          Editar
        </button>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════
// InfoRow
// ═══════════════════════════════════════════════

function InfoRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: typeof User;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-[var(--fg-muted)] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] text-[var(--fg-muted)] block leading-none mb-0.5">{label}</span>
        <span className={`text-[13px] ${muted ? "text-[var(--fg-muted)] italic" : "text-[var(--fg)]"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// GALERIA TAB
// ═══════════════════════════════════════════════

function getDeadlineStatus(deadlineStr: string): { color: string; label: string } {
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { color: "var(--error, #B84233)", label: `${Math.abs(diffDays)}d atrasado` };
  if (diffDays < 7) return { color: "var(--warning, #C87A20)", label: `${diffDays}d restante${diffDays !== 1 ? "s" : ""}` };
  return { color: "var(--success, #2D7A4F)", label: `${diffDays}d restante${diffDays !== 1 ? "s" : ""}` };
}

function GaleriaTab({ galleries, eventType, onEdit }: { galleries: Gallery[]; eventType: EventType; onEdit?: () => void }) {
  const eventPrefix = EVENT_TYPE_MAP[eventType]?.toLowerCase() || "";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (gallery: Gallery) => {
    const url = `${window.location.origin}/g/${gallery.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(gallery.id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const privacyInfo: Record<string, { icon: typeof Lock; label: string }> = {
    privado: { icon: Lock, label: "Privada" },
    publico: { icon: Globe, label: "Pública" },
    senha: { icon: KeyRound, label: "Com senha" },
    expira: { icon: Clock, label: "Expira" },
  };

  if (galleries.length === 0) {
    return (
      <WidgetEmptyState
        icon={Image}
        title="Nenhuma galeria"
        description="Adicione uma galeria editando o cadastro do projeto."
        action={onEdit && (
          <button onClick={onEdit} className={PRIMARY_CTA}>
            <Pencil size={14} />
            Editar cadastro
          </button>
        )}
      />
    );
  }

  return (
    <div className="space-y-3">
      {galleries.map((g, i) => {
        const status = GALLERY_STATUS_MAP[g.status];
        const deadlineInfo = g.delivery_deadline_date ? getDeadlineStatus(g.delivery_deadline_date) : null;
        const displayName = g.name.toLowerCase().startsWith(eventPrefix + " ") ? g.name.slice(eventPrefix.length + 1).trim() : g.name;
        const privacy = privacyInfo[g.privacy] || privacyInfo.privado;
        const PrivacyIcon = privacy.icon;

        return (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
          >
            <WidgetCard className="p-4" hover={false}>
              {/* Header: name + status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {g.cover_url ? (
                    <img
                      src={g.cover_url}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center flex-shrink-0">
                      <Image size={16} className="text-[var(--fg-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">{displayName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--fg-muted)]">
                        {g.photo_count} foto{g.photo_count !== 1 ? "s" : ""}
                      </span>
                      {deadlineInfo && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: deadlineInfo.color }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deadlineInfo.color }} />
                          {deadlineInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge {...status} />
              </div>

              {/* Meta row: privacy, download, views */}
              <div className="flex items-center gap-3 mb-3 text-[10px] text-[var(--fg-muted)]">
                <span className="flex items-center gap-1">
                  <PrivacyIcon size={11} />
                  {privacy.label}
                </span>
                <span className="flex items-center gap-1">
                  <Download size={11} />
                  {g.download_enabled ? "Download on" : "Download off"}
                </span>
                {g.views > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {g.views} view{g.views !== 1 ? "s" : ""}
                  </span>
                )}
                {g.downloads > 0 && (
                  <span className="flex items-center gap-1">
                    <Download size={11} />
                    {g.downloads} download{g.downloads !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/galeria/${g.id}`}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] hover:underline"
                >
                  <ExternalLink size={12} />
                  Abrir galeria
                </Link>
                <span className="text-[var(--border)]">·</span>
                <button
                  type="button"
                  onClick={() => copyLink(g)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
                >
                  {copiedId === g.id ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                  {copiedId === g.id ? "Copiado!" : "Copiar link"}
                </button>
              </div>
            </WidgetCard>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// FINANCEIRO TAB
// ═══════════════════════════════════════════════

function FinanceiroTab({
  project,
  installments: initialInstallments,
  onEdit,
}: {
  project: Project;
  installments: Installment[];
  onEdit?: () => void;
}) {
  const router = useRouter();
  const [installments, setInstallments] = useState(initialInstallments);

  // Recalculate paid from installments
  const paidFromInstallments = installments
    .filter((i) => i.status === "pago")
    .reduce((s, i) => s + Number(i.paid_amount || i.amount), 0);
  const total = project.value;
  const paid = paidFromInstallments || project.paid;
  const remaining = total - paid;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Auto-detect overdue
  const processedInstallments = installments.map((inst) => {
    if (inst.status === "pendente") {
      const dueDate = new Date(inst.due_date + "T23:59:59");
      const now = new Date();
      if (dueDate < now && dueDate.toDateString() !== now.toDateString()) {
        return { ...inst, status: "vencido" as FinancialStatus };
      }
    }
    return inst;
  });

  const overdueCount = processedInstallments.filter((i) => i.status === "vencido").length;

  // Next due: first unpaid installment sorted by due_date
  const nextDue = processedInstallments
    .filter((i) => i.status === "pendente" || i.status === "vencido")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] || null;

  // Relative date label for next due
  const getRelativeDateLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays <= 7) return `Em ${diffDays}d`;
    return formatDate(dateStr);
  };

  // Group: unpaid first, then paid
  const unpaidInstallments = processedInstallments.filter((i) => i.status !== "pago" && i.status !== "cancelado");
  const paidInstallments = processedInstallments.filter((i) => i.status === "pago");
  const cancelledInstallments = processedInstallments.filter((i) => i.status === "cancelado");

  // Payment method display
  const paymentMethodLabel = (method: string | null) => {
    if (!method) return null;
    const map: Record<string, string> = {
      pix: "PIX",
      boleto: "Boleto",
      cartao_credito: "Cartão",
      cartao_debito: "Débito",
      dinheiro: "Dinheiro",
      transferencia: "Transferência",
    };
    return map[method] || method;
  };

  async function markAsPaid(id: string) {
    const supabase = createClient();
    const inst = installments.find((i) => i.id === id);
    if (!inst) return;

    const { error } = await supabase
      .from("installments")
      .update({ status: "pago", paid_at: new Date().toISOString(), paid_amount: inst.amount })
      .eq("id", id);

    if (error) { toast.error("Erro ao marcar como pago"); return; }

    setInstallments((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "pago" as FinancialStatus, paid_at: new Date().toISOString(), paid_amount: i.amount } : i
      )
    );
    toast.success("Parcela marcada como paga!");
    router.refresh();
  }

  const renderInstallment = (inst: Installment & { status: FinancialStatus }, i: number) => {
    const status = FINANCIAL_STATUS_MAP[inst.status];
    const canMarkPaid = inst.status === "pendente" || inst.status === "vencido";
    const isPaid = inst.status === "pago";
    const pm = paymentMethodLabel(inst.payment_method);

    return (
      <motion.div
        key={inst.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
      >
        <ListRow>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`text-[13px] font-medium ${isPaid ? "text-[var(--fg-muted)]" : "text-[var(--fg)]"}`}>
                {inst.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPaid && inst.paid_at ? (
                <span className="text-[10px] text-[var(--success)]">
                  Pago em {formatDate(inst.paid_at.split("T")[0])}
                </span>
              ) : (
                <span className={`text-[10px] ${inst.status === "vencido" ? "text-[var(--error)]" : "text-[var(--fg-muted)]"}`}>
                  Venc. {formatDate(inst.due_date)}
                </span>
              )}
              {pm && (
                <span className="text-[10px] text-[var(--fg-muted)]">
                  · {pm}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-semibold ${isPaid ? "text-[var(--fg-muted)] line-through" : "text-[var(--fg)]"}`}>
              {formatCurrency(inst.amount)}
            </span>
            <StatusBadge {...status} />
            {canMarkPaid && (
              <button
                onClick={() => markAsPaid(inst.id)}
                className="px-2 py-1 rounded-md text-[10px] font-medium text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success-subtle)] transition-colors whitespace-nowrap"
              >
                Marcar pago
              </button>
            )}
          </div>
        </ListRow>
      </motion.div>
    );
  };

  return (
    <>
      {/* Summary */}
      <WidgetCard className="p-4" hover={false}>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Resumo Financeiro" />
          <Link
            href="/financeiro"
            className="text-[11px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            Ver financeiro
            <ExternalLink size={10} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-[var(--fg-muted)]">Total</p>
            <p className="text-[15px] font-semibold text-[var(--fg)]">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--fg-muted)]">Pago</p>
            <p className="text-[15px] font-semibold text-[var(--success)]">{formatCurrency(paid)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--fg-muted)]">Restante</p>
            <p className={`text-[15px] font-semibold ${remaining > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[var(--bg)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--success)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
          />
        </div>
        <p className="text-[10px] text-[var(--fg-muted)] mt-1 text-right">{pct}% pago</p>

        {/* Next due highlight */}
        {nextDue && (
          <div className={`mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Calendar size={12} className={nextDue.status === "vencido" ? "text-[var(--error)]" : "text-[var(--fg-muted)]"} />
              <div>
                <p className="text-[10px] text-[var(--fg-muted)]">Próximo vencimento</p>
                <p className={`text-[12px] font-medium ${nextDue.status === "vencido" ? "text-[var(--error)]" : "text-[var(--fg)]"}`}>
                  {nextDue.description} — {formatCurrency(nextDue.amount)}
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              nextDue.status === "vencido"
                ? "bg-[var(--error-subtle)] text-[var(--error)]"
                : "bg-[var(--bg-subtle)] text-[var(--fg-secondary)]"
            }`}>
              {getRelativeDateLabel(nextDue.due_date)}
            </span>
          </div>
        )}
      </WidgetCard>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <WidgetCard className="p-3 border-l-2 border-l-[var(--error)]" hover={false}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--error)] shrink-0" />
            <p className="text-[12px] text-[var(--error)] font-medium">
              {overdueCount} {overdueCount === 1 ? "parcela vencida" : "parcelas vencidas"} — atenção!
            </p>
          </div>
        </WidgetCard>
      )}

      {/* Unpaid installments */}
      {unpaidInstallments.length > 0 && (
        <WidgetCard className="p-4" hover={false}>
          <SectionHeader title={`Pendentes (${unpaidInstallments.length})`} />
          <div className="space-y-0">
            {unpaidInstallments.map((inst, i) => renderInstallment(inst, i))}
          </div>
        </WidgetCard>
      )}

      {/* Paid installments */}
      {paidInstallments.length > 0 && (
        <WidgetCard className="p-4" hover={false}>
          <SectionHeader title={`Pagas (${paidInstallments.length})`} />
          <div className="space-y-0">
            {paidInstallments.map((inst, i) => renderInstallment(inst, i))}
          </div>
        </WidgetCard>
      )}

      {/* Cancelled */}
      {cancelledInstallments.length > 0 && (
        <WidgetCard className="p-4" hover={false}>
          <SectionHeader title={`Canceladas (${cancelledInstallments.length})`} />
          <div className="space-y-0">
            {cancelledInstallments.map((inst, i) => renderInstallment(inst, i))}
          </div>
        </WidgetCard>
      )}

      {processedInstallments.length === 0 && (
        <WidgetEmptyState
          icon={DollarSign}
          title="Nenhuma parcela"
          description="Defina valores e parcelas editando o cadastro do projeto."
          action={onEdit && (
            <button onClick={onEdit} className={PRIMARY_CTA}>
              <Pencil size={14} />
              Editar cadastro
            </button>
          )}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// PRODUCAO TAB
// ═══════════════════════════════════════════════

function ProducaoTab({
  project,
  workflows,
  onRefresh,
  onEdit,
}: {
  project: Project;
  workflows: ProjectWorkflow[];
  onRefresh: () => void;
  onEdit?: () => void;
}) {
  const [advancing, setAdvancing] = useState<string | null>(null);
  const completed = workflows.filter((w) => w.status === "concluido").length;
  const inProgress = workflows.filter((w) => w.status === "em_andamento").length;
  const total = workflows.length;
  const overdue = workflows.filter((wf) => {
    if (wf.status === "concluido" || !wf.deadline) return false;
    return new Date(wf.deadline) < new Date();
  }).length;

  async function handleAdvance(workflow: ProjectWorkflow) {
    const newStatus = workflow.status === "pendente" ? "em_andamento" : "concluido";
    setAdvancing(workflow.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_workflows")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", workflow.id);
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      toast.success(newStatus === "em_andamento" ? "Etapa iniciada!" : "Etapa concluída!");
      onRefresh();
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setAdvancing(null);
    }
  }

  function getDurationText(wf: ProjectWorkflow): string {
    const created = new Date(wf.created_at);
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    if (wf.deadline) {
      const deadline = new Date(wf.deadline);
      const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline < 0) return `${Math.abs(daysUntilDeadline)}d atrasado`;
      if (daysUntilDeadline === 0) return "Vence hoje";
      return `${daysUntilDeadline}d restantes`;
    }
    return `${daysSinceCreated}d desde criação`;
  }

  function getProgressPercent(status: string): number {
    if (status === "concluido") return 100;
    if (status === "em_andamento") return 50;
    return 0;
  }

  return (
    <>
      {/* Resumo da Produção */}
      {total > 0 && (
        <WidgetCard className="p-4" hover={false}>
          <SectionHeader title="Resumo da Produção" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-xl bg-[var(--bg)]">
              <p className="text-[10px] text-[var(--fg-muted)]">Etapas ativas</p>
              <p className="text-[18px] font-bold text-[var(--fg)]">{inProgress + workflows.filter((w) => w.status === "pendente").length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)]">
              <p className="text-[10px] text-[var(--fg-muted)]">Prazo de entrega</p>
              <p className="text-[13px] font-semibold text-[var(--fg)]">
                {project.delivery_deadline_date ? formatDate(project.delivery_deadline_date) : "—"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)]">
              <p className="text-[10px] text-[var(--fg-muted)]">Atrasados</p>
              <p className="text-[18px] font-bold" style={{ color: overdue > 0 ? "var(--error)" : "var(--fg)" }}>{overdue}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg)]">
              <p className="text-[10px] text-[var(--fg-muted)]">Progresso</p>
              <p className="text-[18px] font-bold text-[var(--fg)]">
                <span style={{ color: "var(--success)" }}>{completed}</span>/{total}
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-[var(--bg)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--success)]"
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
              />
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1 text-right">
              {total > 0 ? Math.round((completed / total) * 100) : 0}% concluído
            </p>
          </div>
        </WidgetCard>
      )}

      {/* Service cards */}
      {total > 0 ? (
        <div className="space-y-3">
          <SectionHeader title="Etapas de Produção" />
          {workflows.map((wf, i) => {
            const statusInfo = WORKFLOW_STATUS_MAP[wf.status];
            const canAdvance = wf.status === "pendente" || wf.status === "em_andamento";
            const advanceLabel = wf.status === "pendente" ? "Iniciar" : "Concluir";
            const isOverdue = wf.deadline && wf.status !== "concluido" && new Date(wf.deadline) < new Date();
            const progress = getProgressPercent(wf.status);

            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
              >
                <WidgetCard className="p-4" hover={false}>
                  <div className="flex items-start gap-3">
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: wf.status === "concluido" ? "var(--success)" : wf.status === "em_andamento" ? "var(--warning)" : "var(--fg-muted)" }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Name + badge row */}
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-medium text-[var(--fg)] truncate">{wf.name}</p>
                        <StatusBadge {...statusInfo} />
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden mb-1.5">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: statusInfo.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 + i * 0.04 }}
                        />
                      </div>

                      {/* Duration info */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${isOverdue ? "text-[var(--error)] font-medium" : "text-[var(--fg-muted)]"}`}>
                          {isOverdue && <AlertTriangle size={10} className="inline mr-1" />}
                          {getDurationText(wf)}
                        </span>
                        {wf.deadline && (
                          <span className="text-[10px] text-[var(--fg-muted)]">
                            Prazo: {formatDate(wf.deadline)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Advance button */}
                    {canAdvance && (
                      <button
                        onClick={() => handleAdvance(wf)}
                        disabled={advancing === wf.id}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          wf.status === "pendente"
                            ? "bg-[var(--info-subtle)] text-[var(--info)] hover:bg-[var(--info)]  hover:text-white"
                            : "bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white"
                        }`}
                      >
                        {advancing === wf.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : wf.status === "pendente" ? (
                          <Play size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                        {advanceLabel}
                      </button>
                    )}
                  </div>
                </WidgetCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <WidgetEmptyState
          icon={GitBranch}
          title="Nenhum serviço de produção"
          description="Adicione etapas de produção editando o cadastro do projeto."
          action={onEdit && (
            <button onClick={onEdit} className={PRIMARY_CTA}>
              <Pencil size={14} />
              Editar cadastro
            </button>
          )}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// PEDIDOS TAB
// ═══════════════════════════════════════════════

function PedidosTab({ products, onEdit }: { products: ProjectProduct[]; onEdit?: () => void }) {
  if (products.length === 0) {
    return (
      <WidgetEmptyState
        icon={Package}
        title="Nenhum produto"
        description="Adicione produtos editando o cadastro do projeto."
        action={onEdit && (
          <button onClick={onEdit} className={PRIMARY_CTA}>
            <Pencil size={14} />
            Editar cadastro
          </button>
        )}
      />
    );
  }

  const totalValue = products.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);

  return (
    <>
      {/* Total */}
      <WidgetCard className="p-4" hover={false}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--fg-secondary)]">Total em produtos</span>
          <span className="text-[15px] font-semibold text-[var(--fg)]">{formatCurrency(totalValue)}</span>
        </div>
      </WidgetCard>

      {/* Product list */}
      <WidgetCard className="p-4" hover={false}>
        <SectionHeader title="Produtos" />
        <div className="space-y-0">
          {products.map((prod, i) => (
            <motion.div
              key={prod.id || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.04 }}
            >
              <ListRow>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--fg)]">{prod.name}</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">
                    {prod.quantity}x {formatCurrency(prod.unit_price)}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-[var(--fg)]">
                  {formatCurrency(prod.quantity * prod.unit_price)}
                </span>
              </ListRow>
            </motion.div>
          ))}
        </div>
      </WidgetCard>
    </>
  );
}

// ═══════════════════════════════════════════════
// TIMELINE TAB
// ═══════════════════════════════════════════════

const ENTITY_TYPE_LABELS: Record<string, string> = {
  project: "Projeto",
  lead: "Lead",
  contract: "Contrato",
  installment: "Parcela",
  gallery: "Galeria",
  order: "Pedido",
};

const ACTION_CONFIG: Record<
  string,
  {
    icon: typeof Plus;
    color: string;
    getLabel: (entityType: string, details: ActivityLogEntry["details"]) => string;
  }
> = {
  created: {
    icon: Plus,
    color: "var(--info)",
    getLabel: (entityType) => `${ENTITY_TYPE_LABELS[entityType] || entityType} criado`,
  },
  updated: {
    icon: Edit,
    color: "var(--fg-muted)",
    getLabel: (entityType) => `${ENTITY_TYPE_LABELS[entityType] || entityType} atualizado`,
  },
  status_changed: {
    icon: ArrowRight,
    color: "var(--info)",
    getLabel: (entityType, details) => {
      const entity = ENTITY_TYPE_LABELS[entityType] || entityType;
      if (details?.old_status && details?.new_status) {
        return `${entity} — ${details.old_status} → ${details.new_status}`;
      }
      return `${entity} — status alterado`;
    },
  },
  payment_received: {
    icon: DollarSign,
    color: "var(--success)",
    getLabel: (_entityType, details) => {
      if (details?.message) return details.message;
      return "Pagamento recebido";
    },
  },
  phase_advanced: {
    icon: ChevronRight,
    color: "var(--warning)",
    getLabel: (_entityType, details) => {
      if (details?.message) return details.message;
      return "Produção avançou";
    },
  },
  deleted: {
    icon: Trash2,
    color: "var(--error)",
    getLabel: (_entityType, details) => {
      if (details?.message) return details.message;
      return "Removido";
    },
  },
};

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(entries: ActivityLogEntry[]): { date: string; entries: ActivityLogEntry[] }[] {
  const groups: Map<string, ActivityLogEntry[]> = new Map();

  for (const entry of entries) {
    const dateKey = new Date(entry.created_at).toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(entry);
  }

  return Array.from(groups.entries()).map(([date, entries]) => ({ date, entries }));
}

function TimelineTab({ activityLog }: { activityLog: ActivityLogEntry[] }) {
  if (activityLog.length === 0) {
    return (
      <WidgetEmptyState
        icon={Clock}
        title="Nenhuma atividade registrada"
        description="O histórico aparecerá conforme você trabalhar neste projeto."
      />
    );
  }

  const groups = groupByDate(activityLog);
  let globalIndex = 0;

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--fg-muted)] mb-3">
            {formatDateHeader(group.entries[0].created_at)}
          </p>

          {/* Timeline entries */}
          <div className="relative">
            {group.entries.map((entry, i) => {
              const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;
              const Icon = config.icon;
              const isLast = i === group.entries.length - 1;
              const staggerIndex = globalIndex++;
              const detailText =
                entry.details?.message ||
                config.getLabel(entry.entity_type, entry.details);
              const titleText = config.getLabel(entry.entity_type, entry.details);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 26,
                    delay: staggerIndex * 0.04,
                  }}
                  className="relative flex gap-3 pb-4"
                >
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    {!isLast && (
                      <div
                        className="w-[2px] flex-1 mt-1"
                        style={{ backgroundColor: "var(--border)" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} style={{ color: config.color }} className="shrink-0" />
                        <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                          {titleText}
                        </p>
                      </div>
                      {entry.details?.message && entry.details.message !== titleText && (
                        <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">
                          {entry.details.message}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--fg-muted)] shrink-0 mt-0.5">
                      {formatTimestamp(entry.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// BRIEFING TAB
// ═══════════════════════════════════════════════

const BRIEFING_SECTION_LABELS: Record<string, string> = {
  info: "Informações do Casal",
  making_noiva: "Making Of da Noiva",
  making_noivo: "Making Of do Noivo",
  cerimonia: "Sobre a Cerimônia",
  festa: "Sobre a Festa",
  detalhes: "Detalhes Importantes",
  preferencias: "Preferências do Casal",
  fornecedores: "Lista de Fornecedores",
};

function BriefingTab({ projectId, eventType }: { projectId: string; eventType: string }) {
  const [briefing, setBriefing] = useState<{ sections: Record<string, Record<string, string>>; status: string; markdown_output: string | null; completed_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/briefings?project_id=${projectId}`)
      .then(r => r.json())
      .then(d => setBriefing(d.briefing || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-[var(--info)] border-t-transparent animate-spin" /></div>;

  if (eventType !== "casamento") {
    return (
      <WidgetEmptyState
        icon={FileText}
        title="Briefing não disponível"
        description="O briefing interativo está disponível apenas para casamentos por enquanto."
      />
    );
  }

  if (!briefing) {
    return (
      <WidgetEmptyState
        icon={FileText}
        title="Briefing não preenchido"
        description="O cliente ainda não acessou o briefing no portal."
      />
    );
  }

  const sections = briefing.sections || {};
  const totalQ = Object.values(sections).reduce((a, s) => a + Object.values(s).filter(v => v?.trim()).length, 0);
  const isComplete = briefing.status === "preenchido";

  return (
    <div className="space-y-4">
      <WidgetCard>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Status do Briefing" />
          <StatusBadge
            label={isComplete ? "Preenchido" : "Rascunho"}
            color={isComplete ? "var(--success)" : "var(--warning)"}
            bg={isComplete ? "var(--success-subtle)" : "var(--warning-subtle)"}
          />
        </div>
        <p className="text-[12px] text-[var(--fg-muted)]">
          {totalQ} campos preenchidos{briefing.completed_at ? ` · Finalizado em ${new Date(briefing.completed_at).toLocaleDateString("pt-BR")}` : ""}
        </p>
      </WidgetCard>

      {Object.entries(sections).map(([sectionKey, fields]) => {
        const filledFields = Object.entries(fields as Record<string, string>).filter(([, v]) => v?.trim());
        if (filledFields.length === 0) return null;
        return (
          <WidgetCard key={sectionKey}>
            <SectionHeader title={BRIEFING_SECTION_LABELS[sectionKey] || sectionKey} />
            <div className="mt-3 space-y-2.5">
              {filledFields.map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.03em] mb-0.5">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed whitespace-pre-wrap">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </WidgetCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// SERVICOS TAB
// ═══════════════════════════════════════════════

const ITEM_CATEGORY_LABELS: Record<string, string> = {
  servico: "Serviço",
  album: "Álbum",
  impressao: "Impressão",
  produto: "Produto",
  extra: "Extra",
};

const ITEM_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  contratado: { label: "Contratado", color: "var(--info)", bg: "var(--info-subtle)" },
  em_producao: { label: "Em Produção", color: "var(--warning)", bg: "var(--warning-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error-subtle)" },
};

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit_price: number;
  status: string;
  delivered_at: string | null;
  created_at: string;
}

function ServicosTab({ projectId, clientId }: { projectId: string; clientId: string | null }) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "servico", quantity: 1, unit_price: 0 });

  const loadItems = useCallback(() => {
    const supabase = createClient();
    supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [projectId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const addItem = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/project-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, client_id: clientId, ...form }),
      });
      if (r.ok) {
        const d = await r.json();
        setItems(prev => [...prev, d.item]);
        setForm({ name: "", description: "", category: "servico", quantity: 1, unit_price: 0 });
        setShowForm(false);
        toast.success("Item adicionado");
      }
    } catch {}
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const r = await fetch("/api/admin/project-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) {
      const d = await r.json();
      setItems(prev => prev.map(i => i.id === id ? d.item : i));
      toast.success(`Status: ${ITEM_STATUS_MAP[status]?.label || status}`);
    }
  };

  const removeItem = async (id: string) => {
    const r = await fetch(`/api/admin/project-items?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Item removido");
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-[var(--info)] border-t-transparent animate-spin" /></div>;

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      {/* Summary + Add button */}
      <WidgetCard>
        <div className="flex items-center justify-between">
          <SectionHeader title="Serviços Contratados" />
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <span className="text-[13px] font-semibold tabular-nums text-[var(--fg)]">{fmt(total)}</span>
            )}
            <button onClick={() => setShowForm(!showForm)}
              className="w-7 h-7 rounded-lg bg-[var(--info)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            ><Plus size={14} /></button>
          </div>
        </div>
        {items.length > 0 && (
          <p className="text-[11px] text-[var(--fg-muted)] mt-1">{items.length} {items.length === 1 ? "item" : "itens"}</p>
        )}
      </WidgetCard>

      {/* Add form */}
      {showForm && (
        <WidgetCard>
          <SectionHeader title="Novo Item" />
          <div className="mt-3 space-y-2.5">
            <input type="text" placeholder="Nome do item *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={INPUT_CLS + " !h-9 !text-[12px]"} />
            <input type="text" placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={INPUT_CLS + " !h-9 !text-[12px]"} />
            <div className="flex gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={SELECT_CLS + " !h-9 !text-[12px] flex-1"}>
                <option value="servico">Serviço</option>
                <option value="album">Álbum</option>
                <option value="impressao">Impressão</option>
                <option value="produto">Produto</option>
                <option value="extra">Extra</option>
              </select>
              <input type="number" placeholder="Qtd" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className={INPUT_CLS + " !h-9 !text-[12px] !w-16"} min={1} />
              <input type="number" placeholder="Valor" value={form.unit_price || ""} onChange={e => setForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))}
                className={INPUT_CLS + " !h-9 !text-[12px] !w-24"} step="0.01" min={0} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addItem} disabled={!form.name.trim() || saving}
                className={PRIMARY_CTA + " !h-8 !text-[11px] !px-3 flex-1"}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <><Plus size={12} /> Adicionar</>}
              </button>
              <button onClick={() => setShowForm(false)} className={SECONDARY_CTA + " !h-8 !text-[11px] !px-3"}>Cancelar</button>
            </div>
          </div>
        </WidgetCard>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <WidgetEmptyState
          icon={Package}
          title="Nenhum serviço contratado"
          description="Clique no + para adicionar itens."
        />
      )}

      {/* Items list */}
      {items.map(item => {
        const st = ITEM_STATUS_MAP[item.status] || ITEM_STATUS_MAP.contratado;
        const nextStatuses = item.status === "contratado" ? ["em_producao", "entregue", "cancelado"]
          : item.status === "em_producao" ? ["entregue", "cancelado"]
          : item.status === "entregue" ? ["contratado"]
          : ["contratado"];

        return (
          <WidgetCard key={item.id}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg)]">{item.name}</p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {ITEM_CATEGORY_LABELS[item.category] || item.category}
                  {item.quantity > 1 ? ` · ${item.quantity}x` : ""}
                </p>
                {item.description && <p className="text-[11px] text-[var(--fg-placeholder)] mt-1">{item.description}</p>}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[13px] font-semibold tabular-nums text-[var(--fg)]">{fmt(item.quantity * item.unit_price)}</p>
                <StatusBadge label={st.label} color={st.color} bg={st.bg} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
              {nextStatuses.map(ns => {
                const nst = ITEM_STATUS_MAP[ns];
                return (
                  <button key={ns} onClick={() => updateStatus(item.id, ns)}
                    className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors hover:opacity-80"
                    style={{ backgroundColor: nst.bg, color: nst.color }}
                  >{nst.label}</button>
                );
              })}
              <button onClick={() => removeItem(item.id)}
                className="ml-auto p-1 rounded-md text-[var(--fg-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
              ><Trash2 size={12} /></button>
            </div>
          </WidgetCard>
        );
      })}
    </div>
  );
}
