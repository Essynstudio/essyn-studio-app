import { useState, useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Brush,
  Camera,
  CreditCard,
  Crown,
  DollarSign,
  Eye,
  FileText,
  FolderTree,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Receipt,
  Repeat,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

/* ── Primitives (SET 14) ── */
import { SettingsCard } from "../ui/settings-card";
import { SettingsSectionHeader } from "../ui/settings-section-header";
import { PermissionRoleBadge, type PermissionRole } from "../ui/permission-role-badge";
import { TagPill } from "../ui/tag-pill";
import { SERIF } from "../ui/editorial";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import { useDk } from "../../lib/useDarkColors";

/* ── Quick Link Modals ── */
import {
  NotificacoesModal,
  DominioModal,
  ArmazenamentoModal,
  IntegracoesModal,
  CentralAjudaModal,
  SmtpModal,
} from "./QuickLinkModals";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  SECTION DEFINITIONS                               */
/* ═══════════════════════════════════════════════════ */

interface SettingItem {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  tag?: ReactNode;
  disabled?: boolean;
}

interface SettingSection {
  title: string;
  description?: string;
  items: SettingItem[];
}

const sections: SettingSection[] = [
  /* ─── 1. Conta & Assinatura ─── */
  {
    title: "Conta & Assinatura",
    description: "Dados do estúdio, plano, cobrança e faturas",
    items: [
      {
        id: "estudio",
        icon: <Settings />,
        title: "Dados do Estúdio",
        description: "Nome, CNPJ, endereço, logo e informações fiscais",
      },
      {
        id: "plano",
        icon: <Crown />,
        title: "Plano e Assinatura",
        description: "Gerencie plano atual, limites de uso e renovação",
        tag: <TagPill variant="info" size="xs">Studio Pro</TagPill>,
        ctaLabel: "Gerenciar",
      },
      {
        id: "cobranca",
        icon: <CreditCard />,
        title: "Cobrança e Pagamento",
        description: "Cartão cadastrado, histórico de faturas e NF",
        ctaLabel: "Gerenciar",
      },
      {
        id: "faturas",
        icon: <Receipt />,
        title: "Faturas",
        description: "Histórico de cobranças e download de NFs",
        tag: <TagPill variant="success" size="xs">Em dia</TagPill>,
      },
    ],
  },

  /* ─── 2. Usuários & Permissões ─── */
  {
    title: "Usuários & Permissões",
    description: "Equipe, convites e níveis de acesso",
    items: [
      {
        id: "equipe",
        icon: <Users />,
        title: "Membros da Equipe",
        description: "Convide, remova e gerencie acessos dos membros",
        tag: <TagPill variant="neutral" size="xs">3 membros</TagPill>,
        ctaLabel: "Gerenciar equipe",
      },
      {
        id: "permissoes",
        icon: <Shield />,
        title: "Papéis e Permissões",
        description: "Defina o que cada papel pode acessar no sistema",
        tag: (
          <div className="flex items-center gap-1">
            <PermissionRoleBadge role="admin" size="sm" />
            <PermissionRoleBadge role="producao" size="sm" />
            <PermissionRoleBadge role="financeiro" size="sm" />
          </div>
        ),
      },
      {
        id: "seguranca",
        icon: <Lock />,
        title: "Segurança e 2FA",
        description: "Autenticação em dois fatores, logs de acesso e sessões",
      },
    ],
  },

  /* ─── 3. Templates ─── */
  {
    title: "Templates",
    description: "Workflows, modelos de cobrança e mensagens reutilizáveis",
    items: [
      {
        id: "workflows",
        icon: <Zap />,
        title: "Workflows de Produção",
        description: "Fluxos reutilizáveis para edição, álbum e entrega",
        tag: <TagPill variant="purple" size="xs">5 templates</TagPill>,
        ctaLabel: "Editar templates",
      },
      {
        id: "templates-cobranca",
        icon: <DollarSign />,
        title: "Templates de Cobrança",
        description: "Modelos de parcelamento, descontos e lembretes automáticos",
        tag: <TagPill variant="neutral" size="xs">3 modelos</TagPill>,
      },
      {
        id: "templates-mensagem",
        icon: <MessageSquare />,
        title: "Templates de Mensagem",
        description: "Mensagens prontas para WhatsApp, e-mail e SMS",
        tag: <TagPill variant="neutral" size="xs">8 mensagens</TagPill>,
      },
    ],
  },

  /* ─── 4. Financeiro ─── */
  {
    title: "Financeiro",
    description: "Categorias, centros de custo, métodos e conciliação",
    items: [
      {
        id: "categorias",
        icon: <Tag />,
        title: "Categorias",
        description: "Receitas e despesas para classificação de lançamentos",
        tag: <TagPill variant="success" size="xs">14 categorias</TagPill>,
        ctaLabel: "Gerenciar",
      },
      {
        id: "centros-custo",
        icon: <FolderTree />,
        title: "Centros de Custo",
        description: "Agrupe lançamentos por projeto, equipe ou operação",
        tag: <TagPill variant="neutral" size="xs">4 centros</TagPill>,
        ctaLabel: "Gerenciar",
      },
      {
        id: "metodos-pagamento",
        icon: <CreditCard />,
        title: "Métodos de Pagamento",
        description: "PIX, boleto, cartão e transferência aceitos pelo estúdio",
        tag: <TagPill variant="neutral" size="xs">5 métodos</TagPill>,
        ctaLabel: "Configurar",
      },
      {
        id: "conciliacao",
        icon: <Repeat />,
        title: "Regras de Conciliação",
        description: "Automação de match entre extrato bancário e lançamentos",
        tag: <TagPill variant="warning" size="xs">Beta</TagPill>,
        ctaLabel: "Configurar",
      },
    ],
  },

  /* ─── 5. Galeria ─── */
  {
    title: "Galeria",
    description: "Branding, privacidade e watermark da galeria de clientes",
    items: [
      {
        id: "galeria-branding",
        icon: <Palette />,
        title: "Branding da Galeria",
        description: "Logo, cores, domínio personalizado e estilo visual",
        ctaLabel: "Personalizar",
      },
      {
        id: "galeria-privacidade",
        icon: <Eye />,
        title: "Privacidade Padrão",
        description: "Defina nível de acesso padrão para novas galerias",
        tag: <TagPill variant="warning" size="xs">Protegida</TagPill>,
        ctaLabel: "Configurar",
      },
      {
        id: "galeria-watermark",
        icon: <Brush />,
        title: "Watermark",
        description: "Marca d'água automática para proofing e download",
        tag: <TagPill variant="success" size="xs">Ativo</TagPill>,
        ctaLabel: "Configurar",
      },
    ],
  },

  /* ─── 6. Documentos ─── */
  {
    title: "Documentos",
    description: "Contratos, termos e modelos de documentos",
    items: [
      {
        id: "contratos",
        icon: <FileText />,
        title: "Contratos",
        description: "Modelos de contrato, cláusulas e assinatura digital",
        tag: <TagPill variant="neutral" size="xs">3 modelos</TagPill>,
        ctaLabel: "Editar modelos",
      },
      {
        id: "modelos-docs",
        icon: <Layers />,
        title: "Modelos de Documentos",
        description: "Orçamentos, recibos e termos de uso personalizáveis",
        tag: <TagPill variant="neutral" size="xs">6 modelos</TagPill>,
      },
    ],
  },

  /* ─── 7. Equipamentos ─── */
  {
    title: "Equipamentos",
    description: "Inventário de câmeras, lentes, iluminação e acessórios",
    items: [
      {
        id: "inventario",
        icon: <Camera />,
        title: "Inventário",
        description: "Cadastre e controle câmeras, lentes e acessórios",
        tag: <TagPill variant="neutral" size="xs">12 itens</TagPill>,
        ctaLabel: "Ver inventário",
      },
      {
        id: "manutencao",
        icon: <Wrench />,
        title: "Manutenção e Calibração",
        description: "Histórico de revisões e datas de calibração",
        tag: <TagPill variant="neutral" size="xs">5 registros</TagPill>,
        ctaLabel: "Ver histórico",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════ */
/*  QUICK LINKS                                       */
/* ═══════════════════════════════════════════════════ */

const quickLinks = [
  { icon: <Bell className="w-3.5 h-3.5" />, label: "Notificações", desc: "E-mail, push e lembretes" },
  { icon: <Globe className="w-3.5 h-3.5" />, label: "Domínio", desc: "galeria.seuestudio.com" },
  { icon: <HardDrive className="w-3.5 h-3.5" />, label: "Armazenamento", desc: "Uso e limites de disco" },
  { icon: <Package className="w-3.5 h-3.5" />, label: "Integrações", desc: "Apps e serviços conectados" },
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Central de ajuda", desc: "Documentação e tutoriais" },
  { icon: <Mail className="w-3.5 h-3.5" />, label: "E-mail SMTP", desc: "Remetente personalizado" },
];

/* ═══════════════════════════════════════════════════ */
/*  PLAN BANNER                                       */
/* ═══════════════════════════════════════════════════ */

function PlanBanner({ onNavigate }: { onNavigate?: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex items-center justify-between px-5 py-4 bg-[#FAFAFA] rounded-2xl border border-[#E5E5EA]"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shadow-[0_1px_3px_#E5E5EA]">
          <Crown className="w-5 h-5 text-[#007AFF]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#636366]" style={{ fontWeight: 600 }}>
              Studio Pro
            </span>
            <TagPill variant="success" size="xs">Ativo</TagPill>
          </div>
          <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            Projetos ilimitados · 100 GB armazenamento · Assinatura digital · Suporte prioritário
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
          Renova 15 Mar 2026
        </span>
        <button
          onClick={() => onNavigate ? onNavigate("plano") : toast("Gerenciar plano", { description: "Em breve", duration: 2000 })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[11px] text-[#8E8E93] border border-[#E5E5EA] hover:border-[#D1D1D6] hover:text-[#8E8E93] transition-all cursor-pointer shadow-[0_1px_2px_#F2F2F7]"
          style={{ fontWeight: 500 }}
        >
          Gerenciar
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TEAM PREVIEW (inline in Usuários section)         */
/* ═══════════════════════════════════════════════════ */

const teamMembers: { name: string; email: string; role: PermissionRole }[] = [
  { name: "Marina Reis", email: "marina@essyn.com", role: "admin" },
  { name: "Carlos Mendes", email: "carlos@essyn.com", role: "producao" },
  { name: "Julia Farias", email: "julia@essyn.com", role: "atendimento" },
];

function TeamPreview() {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex -space-x-1.5">
        {teamMembers.map((m) => (
          <div
            key={m.email}
            className="w-6 h-6 rounded-full bg-[#F2F2F7] border-2 border-white flex items-center justify-center"
            title={`${m.name} — ${m.role}`}
          >
            <span className="text-[7px] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
              {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
        ))}
      </div>
      <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
        3 membros ativos
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  QUICK LINKS ROW                                   */
/* ═══════════════════════════════════════════════════ */

function QuickLinksRow() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleQuickLink = (label: string) => {
    setActiveModal(label);
  };

  return (
    <>
      <div className="flex flex-col gap-3 mt-2">
        <SettingsSectionHeader title="Acesso Rápido" />
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {quickLinks.map((link, i) => (
            <motion.button
              key={link.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springStagger(sections.length * 3 + i)}
              onClick={() => handleQuickLink(link.label)}
              className="group flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_2px_#F2F2F7] hover:border-[#D1D1D6] hover:shadow-[0_3px_12px_#E5E5EA] transition-all cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F2F2F7] flex items-center justify-center shrink-0 text-[#D1D1D6] group-hover:text-[#AEAEB2] transition-colors">
                {link.icon}
              </div>
              <div className="flex flex-col gap-0 min-w-0 flex-1">
                <span className="text-[12px] text-[#8E8E93] group-hover:text-[#636366] transition-colors" style={{ fontWeight: 500 }}>
                  {link.label}
                </span>
                <span className="text-[10px] text-[#D1D1D6] truncate" style={{ fontWeight: 400 }}>
                  {link.desc}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Quick Link Modals ── */}
      <NotificacoesModal open={activeModal === "Notificações"} onClose={() => setActiveModal(null)} />
      <DominioModal open={activeModal === "Domínio"} onClose={() => setActiveModal(null)} />
      <ArmazenamentoModal open={activeModal === "Armazenamento"} onClose={() => setActiveModal(null)} />
      <IntegracoesModal open={activeModal === "Integrações"} onClose={() => setActiveModal(null)} />
      <CentralAjudaModal open={activeModal === "Central de ajuda"} onClose={() => setActiveModal(null)} />
      <SmtpModal open={activeModal === "E-mail SMTP"} onClose={() => setActiveModal(null)} />
    </>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  STATUS BAR FOOTER                                 */
/* ══════════════════════════════════════════════════ */

const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_#F2F2F7] shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
            {sections.length}
          </span>{" "}
          seções ·{" "}
          <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
            {totalItems}
          </span>{" "}
          itens de configuração
        </span>
        <span className="w-px h-3 bg-[#F2F2F7]" />
        <span className="text-[11px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
          Versão{" "}
          <span className="text-[#AEAEB2]" style={{ fontWeight: 500 }}>
            0.9.5-beta
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
          Armazenamento:{" "}
          <span className="text-[#AEAEB2]" style={{ fontWeight: 500 }}>
            42 / 100 GB
          </span>
        </span>
        <span className="w-px h-3 bg-[#E5E5EA]" />
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
            <div className="h-full rounded-full bg-[#007AFF]" style={{ width: "42%" }} />
          </div>
          <span className="text-[10px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
            42%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  READY STATE — SECTIONS GRID                       */
/* ═══════════════════════════════════════════════════ */

function ReadyState({ onNavigate, searchQuery }: { onNavigate?: (id: string) => void; searchQuery: string }) {
  const handleCardClick = (item: SettingItem) => {
    if (item.disabled) return;
    if (onNavigate) {
      onNavigate(item.id);
    } else {
      toast(item.title, {
        description: "Funcionalidade em desenvolvimento (WIP)",
        duration: 2500,
      });
    }
  };

  /* ── Filter sections by search query ── */
  const q = searchQuery.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            section.title.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [q]);

  const hasResults = filteredSections.length > 0;

  let globalIdx = 0;

  return (
    <div className="flex flex-col gap-8 flex-1 min-h-0">
      {/* ── Plan banner ── */}
      {!q && <PlanBanner onNavigate={onNavigate} />}

      {/* ── Search empty state ── */}
      {q && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Settings className="w-6 h-6 text-[#D1D1D6]" />
          <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            Nenhuma configuração encontrada para "<span className="text-[#8E8E93]" style={{ fontWeight: 500 }}>{searchQuery}</span>"
          </span>
        </div>
      )}

      {/* ── Sections ── */}
      {filteredSections.map((section) => {
        const isUsuarios = section.title === "Usuários & Permissões";
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="flex flex-col gap-3"
          >
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-0">
                <SettingsSectionHeader title={section.title} description={section.description} />
                {isUsuarios && <TeamPreview />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {section.items.map((item) => {
                const idx = globalIdx++;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springStagger(idx)}
                  >
                    <SettingsCard
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      ctaLabel={item.ctaLabel}
                      tag={item.tag}
                      disabled={item.disabled}
                      onClick={() => handleCardClick(item)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* ── Quick links ── */}
      {!q && <QuickLinksRow />}

      {/* ── Footer ── */}
      {!q && <StatusBar />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

interface ConfiguracoesContentProps {
  onNavigate?: (id: string) => void;
}

export function ConfiguracoesContent({ onNavigate }: ConfiguracoesContentProps) {
  const { isDark } = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [searchQuery, setSearchQuery] = useState("");

  const contextLine = `${sections.length} seções · ${totalItems} itens de configuração`;

  const quickActions = [
    { label: "Gerenciar plano", icon: <Crown className="w-4 h-4" />, onClick: () => onNavigate?.("plano") },
    { label: "Equipe", icon: <Users className="w-4 h-4" />, onClick: () => onNavigate?.("equipe") },
    { label: "Integrações", icon: <Package className="w-4 h-4" />, onClick: () => toast("Integrações", { description: "Em desenvolvimento" }) },
  ];

  const hairline = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          ════════════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Configurações"
        userName=""
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchPlaceholder="Buscar configurações..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── KPIs ─── */}
        <div className={`mx-5 h-px ${hairline}`} />
        <DashboardKpiGrid
          flat
          projetos={{
            label: "Seções",
            value: String(sections.length),
            sub: `${totalItems} itens`,
          }}
          aReceber={{
            label: "Membros",
            value: String(teamMembers.length),
            sub: "ativos",
          }}
          producao={{
            label: "Armazenamento",
            value: "42 GB",
            sub: "de 100 GB",
          }}
          compromissos={{
            label: "Plano",
            value: "Pro",
            sub: "Renova 15 Mar",
          }}
        />
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          CONTENT STATES
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <WidgetSkeleton key="config-sk" rows={5} delay={0.06} />
        ) : viewState === "empty" ? (
          <WidgetCard key="config-empty" delay={0.06}>
            <WidgetEmptyState
              icon={<Settings className="w-5 h-5" />}
              message="Nenhuma configuração disponível — as configurações estarão disponíveis após a ativação completa da sua conta"
            />
          </WidgetCard>
        ) : viewState === "error" ? (
          <WidgetCard key="config-error" delay={0.06}>
            <WidgetErrorState
              message="Erro ao carregar configurações"
              onRetry={() => setViewState("ready")}
            />
          </WidgetCard>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <ReadyState onNavigate={onNavigate} searchQuery={searchQuery} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}