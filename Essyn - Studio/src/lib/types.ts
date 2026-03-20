// Shared types for the entire Essyn app

export type ProjectStatus = "rascunho" | "confirmado" | "producao" | "edicao" | "entregue" | "cancelado";
export type ProductionPhase = "agendado" | "captacao" | "selecao" | "edicao" | "revisao" | "entrega" | "concluido";
export type EventType = "casamento" | "ensaio" | "corporativo" | "aniversario" | "formatura" | "batizado" | "outro";
export type LeadStage = "novo" | "contato" | "reuniao" | "proposta" | "negociacao" | "ganho" | "perdido";
export type ClientStatus = "ativo" | "inativo" | "vip";
export type ContractStatus = "rascunho" | "enviado" | "assinado" | "expirado" | "cancelado";
export type FinancialStatus = "pendente" | "pago" | "vencido" | "cancelado";
export type PaymentMethod = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "transferencia" | "dinheiro";
export type FinancialType = "receita" | "despesa";
export type OrderStatus = "pendente" | "pago" | "producao" | "enviado" | "entregue" | "cancelado";
export type GalleryStatus = "rascunho" | "prova" | "final" | "entregue" | "arquivado" | "agendada";
export type WorkflowItemStatus = "pendente" | "em_andamento" | "concluido";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: ClientStatus;
  notes: string | null;
  tags: string[];
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  event_type: EventType;
  status: ProjectStatus;
  production_phase: ProductionPhase;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  value: number;
  paid: number;
  notes: string | null;
  tags: string[];
  pack_id: string | null;
  delivery_deadline_days: number | null;
  delivery_deadline_date: string | null;
  payment_method: PaymentMethod | null;
  payment_split: PaymentSplit[] | null;
  team_ids: string[];
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
}

export interface PaymentSplit {
  percent: number;
  label: string;
  due_date: string;
}

export interface Pack {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  event_type: EventType | null;
  base_value: number;
  includes: PackItem[];
  active: boolean;
  duration_hours: number | null;
  photographers_count: number | null;
  min_images: number | null;
  delivery_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackItem {
  label: string;
  qty: number;
}

export interface WorkflowModelStep {
  name: string;
  sort_order: number;
  sla_days: number;
}

export interface WizardWorkflow {
  id: string; // local UUID for keying
  name: string; // e.g. "Edição Casamento", "Edição Pré-Wedding"
  model_id: string; // template model id or "custom"
  steps: WorkflowModelStep[];
  editor_id: string; // team member assigned to edit
  editor_name: string; // for display when no id
  backup_location: string; // where files are stored
}

export interface WorkflowTemplate {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  default_days: number;
  active: boolean;
  sort_order: number;
  category: string;
  color: string;
  created_at: string;
}

export interface ProjectLocation {
  id?: string;
  name: string;
  address: string;
  event_time: string;
  sort_order: number;
}

export interface ProjectWorkflow {
  id: string;
  project_id: string;
  workflow_template_id: string | null;
  name: string;
  status: WorkflowItemStatus;
  deadline: string | null;
  assigned_to: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectProduct {
  id?: string;
  catalog_product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
}

export interface CatalogProduct {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  sizes: { size: string; price: number }[];
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Installment {
  id: string;
  project_id: string | null;
  client_id: string | null;
  type: FinancialType;
  description: string;
  amount: number;
  due_date: string;
  status: FinancialStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  paid_amount: number | null;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Wizard form state
export interface WizardFormData {
  // Step 1: Client
  client_mode: "existing" | "new";
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;

  // Step 2: Event
  project_name: string;
  event_type: EventType;
  event_date: string;
  event_time: string;
  locations: ProjectLocation[];

  // Step 3: Pack
  pack_id: string;
  pack_custom: boolean;

  // Step 4: Workflows
  workflows: WizardWorkflow[];
  delivery_deadline_days: number;

  // Step 4: Financial
  total_value: number;
  payment_method: PaymentMethod | "";
  payment_splits: PaymentSplit[];

  // Step 4: Team
  selected_team_ids: string[];

  // Step 5: Products
  selected_products: ProjectProduct[];

  // Gallery
  gallery_auto_create: boolean;
  gallery_delivery_days: number;
  gallery_privacy: "privado" | "senha" | "publico";
  gallery_download_enabled: boolean;

  // Contract
  contract_file: File | null;
  contract_name: string;

  // Notes
  notes: string;
}

export const INITIAL_WIZARD_DATA: WizardFormData = {
  client_mode: "new",
  client_id: "",
  client_name: "",
  client_email: "",
  client_phone: "",
  client_document: "",
  project_name: "",
  event_type: "casamento",
  event_date: "",
  event_time: "",
  locations: [{ name: "", address: "", event_time: "", sort_order: 0 }],
  pack_id: "",
  pack_custom: false,
  workflows: [],
  delivery_deadline_days: 60,
  total_value: 0,
  payment_method: "",
  payment_splits: [],
  selected_team_ids: [],
  selected_products: [],
  gallery_auto_create: true,
  gallery_delivery_days: 30,
  gallery_privacy: "privado",
  gallery_download_enabled: true,
  contract_file: null,
  contract_name: "",
  notes: "",
};

// ═══════════════════════════════════════════════
// Portal do Cliente — Types
// ═══════════════════════════════════════════════

export type InviteRole = "viewer" | "selector" | "commenter";
export type SelectionStatus = "aprovada" | "rejeitada" | "duvida";

export interface GalleryInvite {
  id: string;
  gallery_id: string;
  studio_id: string;
  client_id: string | null;
  role: InviteRole;
  token: string;
  email: string | null;
  name: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
}

export interface GallerySelection {
  id: string;
  gallery_id: string;
  photo_id: string;
  client_email: string;
  status: SelectionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryComment {
  id: string;
  gallery_id: string;
  photo_id: string | null;
  author_name: string;
  author_email: string;
  author_type: "client" | "studio";
  content: string;
  resolved: boolean;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  gallery_id: string;
  storage_path: string;
  filename: string;
  file_url: string | null;
  thumbnail_url: string | null;
  folder_id: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  favorited: boolean;
  selected: boolean;
  created_at: string;
}

export interface GalleryFolder {
  id: string;
  gallery_id: string;
  name: string;
  cover_photo_id: string | null;
  sort_order: number;
}

export interface PortalBranding {
  primaryColor: string;
  bgColor: string;
  welcomeMessage: string;
  logoUrl: string | null;
  portalBgUrl: string | null;
}
