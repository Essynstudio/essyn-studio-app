import { useState, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  User,
  Star,
  UserPlus,
  Download,
  Filter,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { springStiff } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";

const spring = springStiff;

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  totalProjetos: number;
  totalGasto: number;
  ultimoProjeto: string;
  ultimaInteracao: string;
  status: "ativo" | "inativo" | "vip";
  tipo: string;
}

const mockClientes: Cliente[] = [
  { id: "cli-1", nome: "Ana Oliveira", email: "ana@email.com", telefone: "(31) 99999-1111", cidade: "Belo Horizonte", totalProjetos: 3, totalGasto: 18500, ultimoProjeto: "Casamento Oliveira & Santos", ultimaInteracao: "há 2 dias", status: "vip", tipo: "Casamento" },
  { id: "cli-2", nome: "Mariana Costa", email: "mariana@email.com", telefone: "(31) 99999-2222", cidade: "Belo Horizonte", totalProjetos: 2, totalGasto: 5200, ultimoProjeto: "Ensaio Newborn — Sofia", ultimaInteracao: "há 5 dias", status: "ativo", tipo: "Newborn" },
  { id: "cli-3", nome: "TechCorp Brasil", email: "eventos@techcorp.com", telefone: "(11) 3333-4444", cidade: "São Paulo", totalProjetos: 4, totalGasto: 42000, ultimoProjeto: "Corporativo TechCo Annual", ultimaInteracao: "há 1 dia", status: "vip", tipo: "Corporativo" },
  { id: "cli-4", nome: "Carolina Mendes", email: "carolina@email.com", telefone: "(31) 99999-3333", cidade: "Contagem", totalProjetos: 1, totalGasto: 2800, ultimoProjeto: "Ensaio Gestante", ultimaInteracao: "há 10 dias", status: "ativo", tipo: "Gestante" },
  { id: "cli-5", nome: "Família Rodrigues", email: "rodrigues@email.com", telefone: "(31) 99999-4444", cidade: "Nova Lima", totalProjetos: 1, totalGasto: 3500, ultimoProjeto: "Festa 15 Anos — Júlia", ultimaInteracao: "há 3 sem", status: "ativo", tipo: "Festa" },
  { id: "cli-6", nome: "Lucas Silva", email: "lucas@email.com", telefone: "(31) 99999-5555", cidade: "Belo Horizonte", totalProjetos: 2, totalGasto: 4200, ultimoProjeto: "Ensaio de Casal", ultimaInteracao: "há 1 sem", status: "ativo", tipo: "Ensaio" },
  { id: "cli-7", nome: "Vogue Brasil", email: "editorial@vogue.com.br", telefone: "(11) 3333-5555", cidade: "São Paulo", totalProjetos: 5, totalGasto: 65000, ultimoProjeto: "Fashion Week SP", ultimaInteracao: "há 3 dias", status: "vip", tipo: "Editorial" },
  { id: "cli-8", nome: "Fernanda Lima", email: "fernanda@email.com", telefone: "(31) 99999-6666", cidade: "Belo Horizonte", totalProjetos: 1, totalGasto: 8900, ultimoProjeto: "Casamento Fernanda & Pedro", ultimaInteracao: "há 2 sem", status: "ativo", tipo: "Casamento" },
  { id: "cli-9", nome: "Pedro Santos", email: "pedro@email.com", telefone: "(31) 99999-7777", cidade: "Betim", totalProjetos: 1, totalGasto: 1800, ultimoProjeto: "Batizado Gabriel", ultimaInteracao: "há 1 mês", status: "inativo", tipo: "Batizado" },
  { id: "cli-10", nome: "Coord. Direito UFMG", email: "coord@direito.ufmg.br", telefone: "(31) 3333-6666", cidade: "Belo Horizonte", totalProjetos: 2, totalGasto: 12000, ultimoProjeto: "Formatura Direito UFMG", ultimaInteracao: "há 4 dias", status: "ativo", tipo: "Formatura" },
];

const STATUS_COLORS: Record<string, string> = {
  vip: "#FF9500",
  ativo: "#34C759",
  inativo: "#8E8E93",
};

/* Solid badge backgrounds — zero transparency (no hex alpha) */
const STATUS_BG_LIGHT: Record<string, string> = {
  vip: "#FFF5E6",
  ativo: "#F0FAF2",
  inativo: "#F2F2F7",
};
const STATUS_BG_DARK: Record<string, string> = {
  vip: "#2C2410",
  ativo: "#1A2C1E",
  inativo: "#2C2C2E",
};

const STATUS_LABELS: Record<string, string> = {
  vip: "VIP",
  ativo: "Ativo",
  inativo: "Inativo",
};

function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN                                               */
/* ═══════════════════════════════════════════════════ */

const INITIAL_VISIBLE = 6;

export function ClientesContent() {
  const dk = useDk();
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const clientes = mockClientes;
  const totalClientes = clientes.length;
  const vipCount = clientes.filter((c) => c.status === "vip").length;
  const ativoCount = clientes.filter((c) => c.status === "ativo").length;
  const inativoCount = clientes.filter((c) => c.status === "inativo").length;
  const totalReceita = clientes.reduce((s, c) => s + c.totalGasto, 0);

  const filtered = useMemo(() => {
    if (!searchQuery) return clientes;
    const q = searchQuery.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cidade.toLowerCase().includes(q) ||
        c.tipo.toLowerCase().includes(q)
    );
  }, [clientes, searchQuery]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - INITIAL_VISIBLE;

  const contextLine = useMemo(() => {
    return `${totalClientes} clientes · ${vipCount} VIP · ${formatCurrency(totalReceita)} faturado`;
  }, [totalClientes, vipCount, totalReceita]);

  const quickActions = useMemo(() => [
    { label: "Novo cliente", icon: <UserPlus className="w-4 h-4" />, onClick: () => toast("Novo cliente", { description: "Em desenvolvimento" }) },
    { label: "Exportar", icon: <Download className="w-4 h-4" />, onClick: () => toast("Exportar CSV", { description: "Em desenvolvimento" }) },
    { label: "Filtros", icon: <Filter className="w-4 h-4" />, onClick: () => toast("Filtros avançados", { description: "Em desenvolvimento" }) },
  ], []);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          ════════════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Clientes"
        userName=""
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchPlaceholder="Buscar clientes, cidades, tipos..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── Alerts ─── */}
        {inativoCount > 0 && (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <div className="flex flex-col px-2 py-1">
              <InlineBanner
                variant="info"
                title={`${inativoCount} cliente${inativoCount !== 1 ? "s" : ""} inativo${inativoCount !== 1 ? "s" : ""}`}
                desc="Considere uma campanha de reativação"
                compact
              />
            </div>
          </>
        )}

        {/* ─── KPIs ─── */}
        {isLoading ? (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <MetricsSkeleton />
          </>
        ) : (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <DashboardKpiGrid
              flat
              projetos={{
                label: "Total Clientes",
                value: String(totalClientes),
                sub: `${vipCount} VIP`,
              }}
              aReceber={{
                label: "Ativos",
                value: String(ativoCount),
                sub: `${inativoCount} inativo${inativoCount !== 1 ? "s" : ""}`,
              }}
              producao={{
                label: "Receita Total",
                value: formatCurrency(totalReceita),
                sub: `${clientes.reduce((s, c) => s + c.totalProjetos, 0)} projetos`,
              }}
              compromissos={{
                label: "Ticket Médio",
                value: formatCurrency(Math.round(totalReceita / totalClientes)),
                sub: "por cliente",
              }}
            />
          </>
        )}
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          WIDGET 2 — LISTA DE CLIENTES
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <WidgetSkeleton key="clientes-sk" rows={5} delay={0.06} />
        ) : filtered.length === 0 ? (
          <WidgetCard key="clientes-empty" delay={0.06}>
            <WidgetEmptyState
              icon={<Inbox className="w-5 h-5" />}
              message={searchQuery ? "Nenhum cliente encontrado — tente ajustar a busca" : "Nenhum cliente ainda — adicione o primeiro cliente ao sistema"}
            />
          </WidgetCard>
        ) : (
          <WidgetCard
            key="clientes-list"
            title="Todos os Clientes"
            count={filtered.length}
            action="Exportar"
            onAction={() => toast("Exportar", { description: "Em desenvolvimento" })}
            delay={0.06}
            footer={
              <div
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                  <span className="numeric" style={{ fontWeight: 500, color: dk.textTertiary }}>{filtered.length}</span> clientes
                </span>
                <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                  Ordenados por interação recente
                </span>
              </div>
            }
          >
            <AnimatePresence initial={false}>
              {visible.map((cliente, i) => {
                const badgeBg = dk.isDark
                  ? (STATUS_BG_DARK[cliente.status] || dk.bgMuted)
                  : (STATUS_BG_LIGHT[cliente.status] || dk.bgMuted);
                return (
                  <motion.div
                    key={cliente.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                  >
                    {i > 0 && <WidgetHairline />}
                    <button
                      onClick={() => toast(cliente.nome, { description: `${cliente.totalProjetos} projetos · ${cliente.ultimoProjeto}` })}
                      className="w-full flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer text-left group"
                      style={{
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = dk.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.backgroundColor = dk.bgActive;
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.backgroundColor = dk.bgHover;
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: dk.bgMuted }}
                      >
                        {cliente.status === "vip" ? (
                          <Star className="w-3.5 h-3.5 text-[#FF9500]" />
                        ) : (
                          <User className="w-3.5 h-3.5" style={{ color: dk.textSubtle }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-0 flex-1 min-w-0">
                        <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>
                          {cliente.nome}
                        </span>
                        <span className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
                          {cliente.tipo} · {cliente.cidade}
                        </span>
                      </div>

                      {/* Meta / badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: badgeBg }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[cliente.status] }}
                          />
                          <span
                            className="text-[10px]"
                            style={{ fontWeight: 500, color: STATUS_COLORS[cliente.status] }}
                          >
                            {STATUS_LABELS[cliente.status]}
                          </span>
                        </div>
                        <span className="text-[11px] numeric" style={{ fontWeight: 500, color: dk.textMuted }}>
                          {cliente.totalProjetos} proj.
                        </span>
                      </div>

                      {/* Chevron on hover */}
                      <ChevronRight
                        className="w-3.5 h-3.5 shrink-0 transition-colors"
                        style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}
                      />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Expand / collapse toggle */}
            {hiddenCount > 0 && (
              <>
                <WidgetHairline />
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] transition-all cursor-pointer"
                  style={{
                    fontWeight: 500,
                    color: dk.textTertiary,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = dk.bgHover;
                    e.currentTarget.style.color = dk.textSecondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = dk.textTertiary;
                  }}
                >
                  {expanded ? "Mostrar menos" : `Mais ${hiddenCount} clientes`}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </button>
              </>
            )}
          </WidgetCard>
        )}
      </AnimatePresence>
    </div>
  );
}
