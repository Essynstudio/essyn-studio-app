/**
 * ESSYN — Global App Store
 *
 * Single source of truth for cross-module state synchronization.
 * Enables end-to-end flows:
 *   CRM Lead → Project → Production → Financial → Gallery delivery
 *
 * Persists to sessionStorage so navigations don't lose state.
 * Zero transparency rule: fully compliant.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

export type LeadStage =
  | "novo"
  | "contato"
  | "reuniao"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export type ProjectStatus =
  | "ativo"
  | "pausado"
  | "concluido"
  | "cancelado";

export type ProductionPhase =
  | "agendado"
  | "captacao"
  | "selecao"
  | "edicao"
  | "revisao"
  | "entrega"
  | "finalizado";

export type FinancialStatus =
  | "pendente"
  | "pago"
  | "atrasado"
  | "cancelado";

export type GalleryStatus = "rascunho" | "publicada" | "expirada" | "arquivada";

export interface GalleryCollection {
  id: string;
  name: string;
  photoCount: number;
}

export interface AppGallery {
  id: string;
  projetoId: string;
  nome: string;
  cliente: string;
  status: GalleryStatus;
  photoCount: number;
  collections: GalleryCollection[];
  password?: string;
  expiresAt?: string;
  createdAt: string;
}

export type OrderStatus = "pendente" | "pago" | "producao" | "enviado" | "entregue" | "cancelado";

export interface OrderItem {
  photoId: string;
  product: string;
  size: string;
  qty: number;
  price: number;
}

export interface AppOrder {
  id: string;
  galleryId: string;
  cliente: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  desc: string;
  price: number;
  sizes: string[];
  category: string;
  enabled: boolean;
  /** Per-size pricing overrides */
  sizesPricing?: { size: string; price: number }[];
  /** Minimum order quantity */
  minOrder?: number;
  /** Product image URL */
  image?: string;
  /** Gallery IDs where this product is available (empty = all galleries) */
  galleryIds?: string[];
}

export interface AppLead {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
  stage: LeadStage;
  email: string;
  telefone: string;
  dataEvento?: string;
  origem: string;
  createdAt: string;
  /** Linked project ID after conversion */
  projetoId?: string;
}

export interface AppProject {
  id: string;
  nome: string;
  cliente: string;
  tipo: string;
  valor: number;
  status: ProjectStatus;
  dataEvento?: string;
  /** Source lead ID */
  leadId?: string;
  /** Production phase */
  producaoFase: ProductionPhase;
  /** Financial entries */
  parcelaIds: string[];
  createdAt: string;
}

export interface AppParcela {
  id: string;
  projetoId: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: FinancialStatus;
  paidAt?: string;
}

export interface AppNotification {
  id: string;
  type: "lead_converted" | "payment_received" | "production_advanced" | "delivery_ready" | "gallery_created" | "order_received";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  /** Route to navigate to */
  route?: string;
}

/* ═══════════════════════════════════════════════════ */
/*  STORE STATE                                        */
/* ═══════════════════════════════════════════════════ */

interface AppState {
  leads: AppLead[];
  projects: AppProject[];
  parcelas: AppParcela[];
  notifications: AppNotification[];
  galleries: AppGallery[];
  orders: AppOrder[];
  catalog: CatalogProduct[];
}

interface AppActions {
  /* Lead actions */
  updateLeadStage: (leadId: string, newStage: LeadStage) => void;
  convertLeadToProject: (leadId: string, modelo: string) => AppProject | null;

  /* Project actions */
  advanceProduction: (projectId: string) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;

  /* Financial actions */
  markParcelaPaid: (parcelaId: string) => void;
  createParcelas: (projectId: string, count: number) => void;

  /* Gallery actions */
  createGalleryFromProject: (projectId: string) => AppGallery | null;
  updateGalleryStatus: (galleryId: string, status: GalleryStatus) => void;

  /* Order actions */
  createOrder: (order: Omit<AppOrder, "id" | "createdAt">) => AppOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  /* Catalog actions */
  toggleCatalogProduct: (productId: string) => void;
  updateCatalogPrice: (productId: string, price: number) => void;
  addCatalogProduct: (product: Omit<CatalogProduct, "id">) => CatalogProduct;
  updateCatalogProduct: (productId: string, updates: Partial<Omit<CatalogProduct, "id">>) => void;
  deleteCatalogProduct: (productId: string) => void;

  /* Notification actions */
  addNotification: (notif: Omit<AppNotification, "id">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  /* Stats */
  getStats: () => AppStats;
}

export interface AppStats {
  totalLeads: number;
  leadsHoje: number;
  pipelineValor: number;
  projetosAtivos: number;
  receberPendente: number;
  receberAtrasado: number;
  producaoEmAndamento: number;
  entregasPendentes: number;
  taxaConversao: number;
}

type AppStore = AppState & AppActions;

/* ═══════════════════════════════════════════════════ */
/*  INITIAL MOCK DATA                                  */
/* ═══════════════════════════════════════════════════ */

const STORAGE_KEY = "essyn_app_store_v2";

const initialLeads: AppLead[] = [
  { id: "l1", nome: "Mariana & Rafael", tipo: "casamento", valor: 12500, stage: "negociacao", email: "mariana.r@email.com", telefone: "(31) 99876-5432", dataEvento: "2026-07-18", origem: "instagram", createdAt: "2026-02-10" },
  { id: "l2", nome: "Fernanda Alves", tipo: "ensaio", valor: 2800, stage: "proposta", email: "fer.alves@email.com", telefone: "(11) 98765-1234", dataEvento: "2026-03-15", origem: "indicacao", createdAt: "2026-02-15" },
  { id: "l3", nome: "Carla & Bruno", tipo: "casamento", valor: 9800, stage: "reuniao", email: "carla.b@email.com", telefone: "(21) 97654-3210", dataEvento: "2026-09-05", origem: "site", createdAt: "2026-02-12" },
  { id: "l4", nome: "Ricardo Souza", tipo: "corporativo", valor: 6500, stage: "contato", email: "ricardo.s@techco.com", telefone: "(11) 91234-5678", dataEvento: "2026-04-20", origem: "indicacao", createdAt: "2026-02-18" },
  { id: "l5", nome: "Amanda Torres", tipo: "aniversario", valor: 5200, stage: "contato", email: "amanda.t@email.com", telefone: "(31) 99111-2233", dataEvento: "2026-05-10", origem: "instagram", createdAt: "2026-02-19" },
  { id: "l6", nome: "Juliana Prado", tipo: "ensaio", valor: 1800, stage: "novo", email: "ju.prado@email.com", telefone: "(31) 98222-4455", origem: "anuncio", createdAt: "2026-02-21" },
  { id: "l7", nome: "Paulo & Leticia", tipo: "casamento", valor: 11000, stage: "novo", email: "paulo.let@email.com", telefone: "(11) 99333-7788", dataEvento: "2026-11-22", origem: "outros", createdAt: "2026-02-22" },
];

const initialProjects: AppProject[] = [
  { id: "p1", nome: "Casamento Ana & Diego", cliente: "Ana Clara & Diego", tipo: "casamento", valor: 15000, status: "ativo", dataEvento: "2026-08-12", leadId: "l10", producaoFase: "edicao", parcelaIds: ["par-1", "par-2", "par-3"], createdAt: "2026-01-15" },
  { id: "p2", nome: "Ensaio Gestante Luísa", cliente: "Luísa Carvalho", tipo: "ensaio", valor: 2400, status: "ativo", dataEvento: "2026-03-08", producaoFase: "selecao", parcelaIds: ["par-4", "par-5"], createdAt: "2026-02-01" },
  { id: "p3", nome: "Corp TechBrasil", cliente: "TechBrasil SA", tipo: "corporativo", valor: 8500, status: "ativo", dataEvento: "2026-04-15", producaoFase: "agendado", parcelaIds: ["par-6", "par-7"], createdAt: "2026-02-10" },
];

const initialParcelas: AppParcela[] = [
  { id: "par-1", projetoId: "p1", descricao: "Sinal — Casamento Ana & Diego", valor: 5000, vencimento: "2026-02-01", status: "pago", paidAt: "2026-01-28" },
  { id: "par-2", projetoId: "p1", descricao: "2a parcela — Casamento Ana & Diego", valor: 5000, vencimento: "2026-03-15", status: "pendente" },
  { id: "par-3", projetoId: "p1", descricao: "Final — Casamento Ana & Diego", valor: 5000, vencimento: "2026-08-30", status: "pendente" },
  { id: "par-4", projetoId: "p2", descricao: "Sinal — Ensaio Gestante Luísa", valor: 1200, vencimento: "2026-02-10", status: "pago", paidAt: "2026-02-08" },
  { id: "par-5", projetoId: "p2", descricao: "Final — Ensaio Gestante Luísa", valor: 1200, vencimento: "2026-03-20", status: "pendente" },
  { id: "par-6", projetoId: "p3", descricao: "Sinal — Corp TechBrasil", valor: 4250, vencimento: "2026-02-20", status: "atrasado" },
  { id: "par-7", projetoId: "p3", descricao: "Final — Corp TechBrasil", valor: 4250, vencimento: "2026-05-01", status: "pendente" },
];

const initialNotifications: AppNotification[] = [
  { id: "n6", type: "production_advanced", title: "Produção avançou", description: "Casamento Ana & Diego → Edição concluída", timestamp: "há 1 hora", read: false, route: "/producao" },
  { id: "n5", type: "payment_received", title: "Pagamento recebido", description: "2ª parcela R$ 1.200 — Ensaio Gestante Luísa via PIX", timestamp: "há 3 horas", read: false, route: "/financeiro" },
  { id: "n4", type: "lead_converted", title: "Novo lead qualificado", description: "Paulo & Letícia — Casamento Nov 2026 (R$ 11.000)", timestamp: "há 5 horas", read: false, route: "/crm" },
  { id: "n3", type: "delivery_ready", title: "Galeria pronta para entrega", description: "Ensaio Gestante Luísa — 30 fotos editadas", timestamp: "ontem", read: false, route: "/galeria" },
  { id: "n1", type: "payment_received", title: "Pagamento recebido", description: "Sinal de R$ 1.200 — Ensaio Gestante Luísa", timestamp: "2026-02-08", read: true, route: "/financeiro" },
  { id: "n2", type: "lead_converted", title: "Lead convertido", description: "Ana Clara & Diego → Projeto criado", timestamp: "2026-01-15", read: true, route: "/projetos" },
];

const initialGalleries: AppGallery[] = [
  { id: "g1", projetoId: "p1", nome: "Casamento Ana & Diego", cliente: "Ana Clara & Diego", status: "publicada", photoCount: 50, collections: [{ id: "c1", name: "Casamento", photoCount: 50 }], password: "123456", expiresAt: "2026-12-31", createdAt: "2026-08-12" },
  { id: "g2", projetoId: "p2", nome: "Ensaio Gestante Luísa", cliente: "Luísa Carvalho", status: "rascunho", photoCount: 30, collections: [{ id: "c2", name: "Ensaio", photoCount: 30 }], createdAt: "2026-03-08" },
];

const initialOrders: AppOrder[] = [
  { id: "o1", galleryId: "g1", cliente: "Ana Clara & Diego", items: [{ photoId: "ph1", product: "Impressão Fine Art", size: "30x40", qty: 2, price: 180 }, { photoId: "ph2", product: "Canvas Premium", size: "40x60", qty: 1, price: 420 }], total: 780, status: "pendente", createdAt: "2026-02-28" },
  { id: "o2", galleryId: "g1", cliente: "Ana Clara & Diego", items: [{ photoId: "ph5", product: "Álbum Fotográfico", size: "30x30", qty: 1, price: 720 }], total: 720, status: "pago", createdAt: "2026-02-20" },
  { id: "o3", galleryId: "g2", cliente: "Luísa Carvalho", items: [{ photoId: "ph3", product: "Download Digital HD", size: "Pack 25", qty: 1, price: 150 }, { photoId: "ph4", product: "Impressão Fine Art", size: "20x30", qty: 3, price: 120 }], total: 510, status: "producao", createdAt: "2026-02-15" },
  { id: "o4", galleryId: "g1", cliente: "Carlos Santos", items: [{ photoId: "ph6", product: "Quadro Flutuante", size: "60x90", qty: 1, price: 780 }], total: 780, status: "enviado", createdAt: "2026-02-10" },
  { id: "o5", galleryId: "g2", cliente: "Luísa Carvalho", items: [{ photoId: "ph7", product: "Download Digital HD", size: "Todas", qty: 1, price: 350 }], total: 350, status: "entregue", createdAt: "2026-01-25" },
];

const initialCatalog: CatalogProduct[] = [
  { id: "cat-1", name: "Impressão Fine Art", desc: "Papel algodão 300g, cores ricas e duradouras", price: 120, sizes: ["20x30", "30x40", "40x60"], category: "Impressões", enabled: true, image: "https://images.unsplash.com/photo-1758708536058-142d64336046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwYXJ0JTIwcGhvdG9ncmFwaHklMjBwcmludCUyMHBhcGVyfGVufDF8fHx8MTc3MjY3MjY5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", sizesPricing: [{ size: "20x30", price: 120 }, { size: "30x40", price: 180 }, { size: "40x60", price: 280 }], galleryIds: [] },
  { id: "cat-2", name: "Canvas Premium", desc: "Tela esticada em chassis de madeira maciça", price: 280, sizes: ["30x40", "40x60", "60x90"], category: "Impressões", enabled: true, image: "https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzcyNjcyNjk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", sizesPricing: [{ size: "30x40", price: 280 }, { size: "40x60", price: 420 }, { size: "60x90", price: 650 }], galleryIds: [] },
  { id: "cat-3", name: "Download Digital HD", desc: "Alta resolução sem marca d'água", price: 80, sizes: ["Pack 10", "Pack 25", "Todas"], category: "Digital", enabled: true, image: "https://images.unsplash.com/photo-1619943927316-5e1d83ecef0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcGhvdG8lMjBkb3dubG9hZCUyMGxhcHRvcHxlbnwxfHx8fDE3NzI2NzI2OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", sizesPricing: [{ size: "Pack 10", price: 80 }, { size: "Pack 25", price: 150 }, { size: "Todas", price: 350 }], galleryIds: [] },
  { id: "cat-4", name: "Álbum Fotográfico", desc: "Capa dura personalizada, 40 páginas", price: 450, sizes: ["20x20", "25x25", "30x30"], category: "Álbuns", enabled: true, image: "https://images.unsplash.com/photo-1571502188897-c8ab64714975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG8lMjBhbGJ1bSUyMGhhcmRjb3ZlcnxlbnwxfHx8fDE3NzI2NzI2OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", sizesPricing: [{ size: "20x20", price: 450 }, { size: "25x25", price: 580 }, { size: "30x30", price: 720 }], galleryIds: [] },
  { id: "cat-5", name: "Quadro Flutuante", desc: "Moldura com vidro museum glass", price: 350, sizes: ["30x40", "40x60", "60x90"], category: "Impressões", enabled: false, image: "https://images.unsplash.com/photo-1754638504964-880857928e64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9hdGluZyUyMGZyYW1lJTIwcGhvdG8lMjB3YWxsfGVufDF8fHx8MTc3MjY3MjcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", sizesPricing: [{ size: "30x40", price: 350 }, { size: "40x60", price: 520 }, { size: "60x90", price: 780 }], galleryIds: [] },
  { id: "cat-6", name: "Fotolivro Pocket", desc: "Formato 15x15 softcover compacto", price: 180, sizes: ["20pag", "40pag", "60pag"], category: "Álbuns", enabled: false, sizesPricing: [{ size: "20pag", price: 180 }, { size: "40pag", price: 260 }, { size: "60pag", price: 340 }], galleryIds: [] },
];

/* ═══════════════════════════════════════════════════ */
/*  PRODUCTION PHASE ORDER                             */
/* ═══════════════════════════════════════════════════ */

const phaseOrder: ProductionPhase[] = [
  "agendado", "captacao", "selecao", "edicao", "revisao", "entrega", "finalizado",
];

/* ═══════════════════════════════════════════════════ */
/*  CONTEXT                                            */
/* ═══════════════════════════════════════════════════ */

const AppStoreContext = createContext<AppStore | null>(null);

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

/* ═══════════════════════════════════════════════════ */
/*  PROVIDER                                           */
/* ═══════════════════════════════════════════════════ */

function loadState(): AppState {
  try {
    /* Clear legacy storage key to avoid stale data */
    try { sessionStorage.removeItem("essyn_app_store"); } catch { /* noop */ }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      /* Migration: ensure galleries & orders exist for older sessions */
      if (!parsed.galleries) parsed.galleries = initialGalleries;
      if (!parsed.orders) parsed.orders = initialOrders;
      if (!parsed.catalog) parsed.catalog = initialCatalog;
      return parsed;
    }
  } catch { /* noop */ }
  return {
    leads: initialLeads,
    projects: initialProjects,
    parcelas: initialParcelas,
    notifications: initialNotifications,
    galleries: initialGalleries,
    orders: initialOrders,
    catalog: initialCatalog,
  };
}

/* Cache loaded state so it's only read once per module load */
let _cachedInitial: AppState | null = null;
function getInitialState(): AppState {
  if (!_cachedInitial) _cachedInitial = loadState();
  return _cachedInitial;
}

function saveState(state: AppState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* noop */ }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<AppLead[]>(() => getInitialState().leads);
  const [projects, setProjects] = useState<AppProject[]>(() => getInitialState().projects);
  const [parcelas, setParcelas] = useState<AppParcela[]>(() => getInitialState().parcelas);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInitialState().notifications);
  const [galleries, setGalleries] = useState<AppGallery[]>(() => getInitialState().galleries);
  const [orders, setOrders] = useState<AppOrder[]>(() => getInitialState().orders);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => getInitialState().catalog);

  /* Persist on change */
  useEffect(() => {
    saveState({ leads, projects, parcelas, notifications, galleries, orders, catalog });
  }, [leads, projects, parcelas, notifications, galleries, orders, catalog]);

  /* ── Lead actions ── */
  const updateLeadStage = useCallback((leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );
    toast.success("Lead movido", { description: `Estágio atualizado para ${newStage}` });
  }, []);

  const convertLeadToProject = useCallback((leadId: string, modelo: string): AppProject | null => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const projectId = `p-${Date.now()}`;
    const now = new Date().toISOString().split("T")[0];

    const newProject: AppProject = {
      id: projectId,
      nome: `${modelo} — ${lead.nome}`,
      cliente: lead.nome,
      tipo: lead.tipo,
      valor: lead.valor,
      status: "ativo",
      dataEvento: lead.dataEvento,
      leadId: leadId,
      producaoFase: "agendado",
      parcelaIds: [],
      createdAt: now,
    };

    /* Auto-create 2 parcelas (sinal + final) */
    const sinalId = `par-${Date.now()}-1`;
    const finalId = `par-${Date.now()}-2`;
    const sinalParcela: AppParcela = {
      id: sinalId,
      projetoId: projectId,
      descricao: `Sinal — ${lead.nome}`,
      valor: Math.round(lead.valor * 0.4),
      vencimento: now,
      status: "pendente",
    };
    const finalParcela: AppParcela = {
      id: finalId,
      projetoId: projectId,
      descricao: `Final — ${lead.nome}`,
      valor: lead.valor - Math.round(lead.valor * 0.4),
      vencimento: lead.dataEvento || now,
      status: "pendente",
    };

    newProject.parcelaIds = [sinalId, finalId];

    setProjects((prev) => [...prev, newProject]);
    setParcelas((prev) => [...prev, sinalParcela, finalParcela]);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: "ganho", projetoId: projectId } : l))
    );

    /* Add notification */
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: "lead_converted",
      title: "Lead convertido em projeto",
      description: `${lead.nome} → ${newProject.nome}`,
      timestamp: now,
      read: false,
      route: "/projetos",
    };
    setNotifications((prev) => [notif, ...prev]);

    toast.success("Projeto criado!", {
      description: `${newProject.nome} — ${fmtCurrency(lead.valor)}`,
    });

    return newProject;
  }, [leads]);

  /* ── Project actions ── */
  const advanceProduction = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const idx = phaseOrder.indexOf(p.producaoFase);
        if (idx < 0 || idx >= phaseOrder.length - 1) return p;
        const nextPhase = phaseOrder[idx + 1];

        /* Notification */
        const notif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: nextPhase === "entrega" ? "delivery_ready" : "production_advanced",
          title: nextPhase === "entrega" ? "Pronto para entrega!" : "Produção avançada",
          description: `${p.nome} → ${nextPhase}`,
          timestamp: new Date().toISOString().split("T")[0],
          read: false,
          route: "/producao",
        };
        setNotifications((prev) => [notif, ...prev]);

        toast.success(`Produção avançada`, { description: `${p.nome} → ${nextPhase}` });
        return { ...p, producaoFase: nextPhase };
      })
    );
  }, []);

  const updateProjectStatus = useCallback((projectId: string, status: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
  }, []);

  /* ── Financial actions ── */
  const markParcelaPaid = useCallback((parcelaId: string) => {
    const now = new Date().toISOString().split("T")[0];
    let parcelaDesc = "";
    let parcelaValor = 0;

    setParcelas((prev) =>
      prev.map((par) => {
        if (par.id !== parcelaId) return par;
        parcelaDesc = par.descricao;
        parcelaValor = par.valor;
        return { ...par, status: "pago", paidAt: now };
      })
    );

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: "payment_received",
      title: "Pagamento recebido",
      description: `${parcelaDesc} — ${fmtCurrency(parcelaValor)}`,
      timestamp: now,
      read: false,
      route: "/financeiro",
    };
    setNotifications((prev) => [notif, ...prev]);

    toast.success("Pagamento registrado!", { description: fmtCurrency(parcelaValor) });
  }, []);

  const createParcelas = useCallback((projectId: string, count: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const valorParcela = Math.round(project.valor / count);
    const now = new Date();
    const newParcelas: AppParcela[] = [];
    const newIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const id = `par-${Date.now()}-${i}`;
      const venc = new Date(now);
      venc.setMonth(venc.getMonth() + i);
      newParcelas.push({
        id,
        projetoId: projectId,
        descricao: `Parcela ${i + 1}/${count} — ${project.nome}`,
        valor: valorParcela,
        vencimento: venc.toISOString().split("T")[0],
        status: "pendente",
      });
      newIds.push(id);
    }

    setParcelas((prev) => [...prev, ...newParcelas]);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, parcelaIds: [...p.parcelaIds, ...newIds] } : p))
    );
    toast.success(`${count} parcelas criadas`, { description: project.nome });
  }, [projects]);

  /* ── Gallery actions ── */
  const createGalleryFromProject = useCallback((projectId: string): AppGallery | null => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const galleryId = `g-${Date.now()}`;
    const now = new Date().toISOString().split("T")[0];

    const newGallery: AppGallery = {
      id: galleryId,
      projetoId: projectId,
      nome: project.nome,
      cliente: project.cliente,
      status: "rascunho",
      photoCount: 0,
      collections: [],
      createdAt: now,
    };

    setGalleries((prev) => [...prev, newGallery]);

    /* Add notification */
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: "gallery_created",
      title: "Galeria criada",
      description: `${project.nome} → Galeria ${newGallery.nome}`,
      timestamp: now,
      read: false,
      route: "/galeria",
    };
    setNotifications((prev) => [notif, ...prev]);

    toast.success("Galeria criada!", {
      description: `${newGallery.nome} — ${fmtCurrency(project.valor)}`,
    });

    return newGallery;
  }, [projects]);

  const updateGalleryStatus = useCallback((galleryId: string, status: GalleryStatus) => {
    setGalleries((prev) =>
      prev.map((g) => (g.id === galleryId ? { ...g, status } : g))
    );
  }, []);

  /* ── Order actions ── */
  const createOrder = useCallback((order: Omit<AppOrder, "id" | "createdAt">): AppOrder => {
    const orderId = `o-${Date.now()}`;
    const now = new Date().toISOString().split("T")[0];

    const newOrder: AppOrder = {
      id: orderId,
      ...order,
      createdAt: now,
    };

    setOrders((prev) => [...prev, newOrder]);

    /* Add notification */
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: "order_received",
      title: "Novo pedido recebido",
      description: `${order.cliente} → Pedido ${newOrder.id}`,
      timestamp: now,
      read: false,
      route: "/pedidos",
    };
    setNotifications((prev) => [notif, ...prev]);

    toast.success("Pedido criado!", {
      description: `${newOrder.id} — ${fmtCurrency(order.total)}`,
    });

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, []);

  /* ── Catalog actions ── */
  const toggleCatalogProduct = useCallback((productId: string) => {
    setCatalog((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, enabled: !p.enabled } : p))
    );
  }, []);

  const updateCatalogPrice = useCallback((productId: string, price: number) => {
    setCatalog((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price } : p))
    );
  }, []);

  const addCatalogProduct = useCallback((product: Omit<CatalogProduct, "id">): CatalogProduct => {
    const productId = `cat-${Date.now()}`;
    const newProduct: CatalogProduct = {
      id: productId,
      ...product,
    };
    setCatalog((prev) => [...prev, newProduct]);
    toast.success("Produto adicionado!", { description: newProduct.name });
    return newProduct;
  }, []);

  const updateCatalogProduct = useCallback((productId: string, updates: Partial<Omit<CatalogProduct, "id">>) => {
    setCatalog((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
    toast.success("Produto atualizado!", { description: updates.name });
  }, []);

  const deleteCatalogProduct = useCallback((productId: string) => {
    setCatalog((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Produto removido!");
  }, []);

  /* ── Notification actions ── */
  const addNotification = useCallback((notif: Omit<AppNotification, "id">) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /* ── Stats ── */
  const getStats = useCallback((): AppStats => {
    const activePipeline = leads.filter((l) => l.stage !== "ganho" && l.stage !== "perdido");
    const today = new Date().toISOString().split("T")[0];
    const activeProjects = projects.filter((p) => p.status === "ativo");
    const pendingParcelas = parcelas.filter((p) => p.status === "pendente");
    const overdueParcelas = parcelas.filter((p) => p.status === "atrasado");
    const productionActive = activeProjects.filter(
      (p) => p.producaoFase !== "finalizado" && p.producaoFase !== "agendado"
    );
    const deliveryPending = activeProjects.filter((p) => p.producaoFase === "entrega");
    const totalConverted = leads.filter((l) => l.stage === "ganho").length;

    return {
      totalLeads: leads.length,
      leadsHoje: leads.filter((l) => l.createdAt === today).length,
      pipelineValor: activePipeline.reduce((sum, l) => sum + l.valor, 0),
      projetosAtivos: activeProjects.length,
      receberPendente: pendingParcelas.reduce((sum, p) => sum + p.valor, 0),
      receberAtrasado: overdueParcelas.reduce((sum, p) => sum + p.valor, 0),
      producaoEmAndamento: productionActive.length,
      entregasPendentes: deliveryPending.length,
      taxaConversao: leads.length > 0 ? Math.round((totalConverted / leads.length) * 100) : 0,
    };
  }, [leads, projects, parcelas]);

  const store: AppStore = {
    leads,
    projects,
    parcelas,
    notifications,
    galleries,
    orders,
    catalog,
    updateLeadStage,
    convertLeadToProject,
    advanceProduction,
    updateProjectStatus,
    markParcelaPaid,
    createParcelas,
    createGalleryFromProject,
    updateGalleryStatus,
    createOrder,
    updateOrderStatus,
    toggleCatalogProduct,
    updateCatalogPrice,
    addCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
    addNotification,
    markNotificationRead,
    clearNotifications,
    getStats,
  };

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
}

/* ── Utility ── */
function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}