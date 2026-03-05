/**
 * ClientePortalPage — Client Portal (public, standalone layout)
 *
 * Single page where a client can see everything related to their project:
 * - Contract status & signature
 * - Payment schedule & status
 * - Gallery access
 * - Orders & tracking
 *
 * Route: /portal/:projectId
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle,
  CreditCard, Image, ShoppingBag, ChevronRight,
  ExternalLink, Download, Eye, Lock,
  ArrowLeft, Camera, Calendar, User,
  Package, Star,
} from "lucide-react";
import { springDefault } from "../lib/motion-tokens";

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA (simulates what would come from backend) */
/* ═══════════════════════════════════════════════════ */

interface PortalProject {
  id: string;
  name: string;
  type: string;
  photographer: string;
  eventDate: string;
  status: string;
}

interface PortalContract {
  id: string;
  title: string;
  status: "pendente" | "assinado";
  value: number;
  signedAt?: string;
}

interface PortalParcela {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  status: "pendente" | "pago" | "atrasado";
  paidAt?: string;
}

interface PortalGallery {
  id: string;
  name: string;
  photoCount: number;
  status: "disponivel" | "expirada" | "preparando";
  hasPassword: boolean;
}

interface PortalOrder {
  id: string;
  items: number;
  total: number;
  status: "pendente" | "producao" | "enviado" | "entregue";
  createdAt: string;
}

const MOCK_PROJECTS: Record<string, {
  project: PortalProject;
  contract: PortalContract;
  parcelas: PortalParcela[];
  galleries: PortalGallery[];
  orders: PortalOrder[];
}> = {
  p1: {
    project: { id: "p1", name: "Casamento Ana & Diego", type: "Casamento", photographer: "Marina Rodrigues", eventDate: "12 Ago 2026", status: "Em produção" },
    contract: { id: "ctr-1", title: "Contrato de Cobertura — Casamento", status: "assinado", value: 15000, signedAt: "15 Jan 2026" },
    parcelas: [
      { id: "par-1", description: "Sinal (1/3)", value: 5000, dueDate: "01 Fev 2026", status: "pago", paidAt: "28 Jan 2026" },
      { id: "par-2", description: "2ª parcela (2/3)", value: 5000, dueDate: "15 Mar 2026", status: "pendente" },
      { id: "par-3", description: "Parcela final (3/3)", value: 5000, dueDate: "30 Ago 2026", status: "pendente" },
    ],
    galleries: [
      { id: "g1", name: "Ensaio Pré-Wedding", photoCount: 45, status: "disponivel", hasPassword: true },
      { id: "g2", name: "Cerimônia & Festa", photoCount: 0, status: "preparando", hasPassword: false },
    ],
    orders: [
      { id: "o1", items: 3, total: 890, status: "producao", createdAt: "20 Fev 2026" },
    ],
  },
  p2: {
    project: { id: "p2", name: "Ensaio Gestante Luísa", type: "Ensaio", photographer: "Marina Rodrigues", eventDate: "08 Mar 2026", status: "Seleção de fotos" },
    contract: { id: "ctr-2", title: "Contrato de Ensaio Fotográfico", status: "assinado", value: 2400, signedAt: "03 Fev 2026" },
    parcelas: [
      { id: "par-4", description: "Sinal (1/2)", value: 1200, dueDate: "10 Fev 2026", status: "pago", paidAt: "08 Fev 2026" },
      { id: "par-5", description: "Parcela final (2/2)", value: 1200, dueDate: "20 Mar 2026", status: "pendente" },
    ],
    galleries: [
      { id: "g3", name: "Ensaio Gestante", photoCount: 30, status: "disponivel", hasPassword: true },
    ],
    orders: [],
  },
};

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function ClientePortalPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const data = MOCK_PROJECTS[projectId || "p1"] || MOCK_PROJECTS.p1;
  const { project, contract, parcelas, galleries, orders } = data;

  const totalPago = parcelas.filter((p) => p.status === "pago").reduce((s, p) => s + p.value, 0);
  const totalPendente = parcelas.filter((p) => p.status !== "pago").reduce((s, p) => s + p.value, 0);
  const progressPct = contract.value > 0 ? Math.round((totalPago / contract.value) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5EA]">
        <div className="max-w-[720px] mx-auto px-5 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>ESSYN</h1>
              <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Portal do Cliente</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>{project.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                <User className="w-3 h-3" /> {project.photographer}
              </span>
              <span className="flex items-center gap-1 text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>
                <Calendar className="w-3 h-3" /> {project.eventDate}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[10px] text-[#007AFF]" style={{ fontWeight: 600 }}>
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[720px] mx-auto px-5 py-5 flex flex-col gap-4">
        {/* ── Contract Card ── */}
        <PortalCard
          icon={<FileText className="w-4 h-4" />}
          iconColor="#007AFF"
          iconBg="#E8F0FE"
          title="Contrato"
          delay={0}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{contract.title}</span>
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
                Valor total: {fmtCurrency(contract.value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {contract.status === "assinado" ? (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E8EFE5] text-[11px] text-[#34C759]" style={{ fontWeight: 600 }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Assinado
                </span>
              ) : (
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-[11px] hover:bg-[#0066D6] transition-colors cursor-pointer" style={{ fontWeight: 600 }}>
                  Assinar
                </button>
              )}
            </div>
          </div>
          {contract.signedAt && (
            <p className="text-[10px] text-[#AEAEB2] mt-2" style={{ fontWeight: 400 }}>
              Assinado em {contract.signedAt}
            </p>
          )}
        </PortalCard>

        {/* ── Payments Card ── */}
        <PortalCard
          icon={<CreditCard className="w-4 h-4" />}
          iconColor="#5856D6"
          iconBg="#F0F0FF"
          title="Pagamentos"
          subtitle={`${fmtCurrency(totalPago)} de ${fmtCurrency(contract.value)} pago`}
          delay={0.04}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Progresso</span>
              <span className="text-[12px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#34C759]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ ...springDefault, delay: 0.3 }}
              />
            </div>
          </div>

          {/* Parcelas */}
          <div className="flex flex-col gap-2">
            {parcelas.map((p) => {
              const statusCfg = {
                pago: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#34C759", bg: "#E8EFE5", label: "Pago" },
                pendente: { icon: <Clock className="w-3.5 h-3.5" />, color: "#FF9500", bg: "#FFF0DC", label: "Pendente" },
                atrasado: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "#FF3B30", bg: "#FDEDEF", label: "Atrasado" },
              }[p.status];
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA]">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{p.description}</p>
                    <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                      Vencimento: {p.dueDate}
                      {p.paidAt ? ` · Pago em ${p.paidAt}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[13px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>
                      {fmtCurrency(p.value)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 600, backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  {p.status === "pendente" && (
                    <button className="px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-[11px] hover:bg-[#0066D6] transition-colors cursor-pointer shrink-0" style={{ fontWeight: 600 }}>
                      Pagar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </PortalCard>

        {/* ── Galleries Card ── */}
        <PortalCard
          icon={<Image className="w-4 h-4" />}
          iconColor="#FF9500"
          iconBg="#FFF0DC"
          title="Galerias"
          subtitle={`${galleries.length} galeria${galleries.length !== 1 ? "s" : ""}`}
          delay={0.08}
        >
          <div className="flex flex-col gap-2">
            {galleries.map((g) => {
              const statusCfg = {
                disponivel: { label: "Disponível", color: "#34C759", bg: "#E8EFE5" },
                expirada: { label: "Expirada", color: "#FF3B30", bg: "#FDEDEF" },
                preparando: { label: "Em preparação", color: "#FF9500", bg: "#FFF0DC" },
              }[g.status];
              return (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA]">
                  <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5 text-[#C7C7CC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{g.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                        {g.photoCount > 0 ? `${g.photoCount} fotos` : "Aguardando fotos"}
                      </span>
                      {g.hasPassword && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#AEAEB2]">
                          <Lock className="w-2.5 h-2.5" /> Protegida
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0" style={{ fontWeight: 600, backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                  {g.status === "disponivel" && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1D1D1F] text-white text-[11px] hover:bg-[#636366] transition-colors cursor-pointer shrink-0" style={{ fontWeight: 600 }}>
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </PortalCard>

        {/* ── Orders Card ── */}
        <PortalCard
          icon={<ShoppingBag className="w-4 h-4" />}
          iconColor="#34C759"
          iconBg="#E8EFE5"
          title="Pedidos"
          subtitle={orders.length > 0 ? `${orders.length} pedido${orders.length !== 1 ? "s" : ""}` : "Nenhum pedido"}
          delay={0.12}
        >
          {orders.length > 0 ? (
            <div className="flex flex-col gap-2">
              {orders.map((o) => {
                const statusCfg = {
                  pendente: { label: "Pendente", color: "#FF9500", bg: "#FFF0DC", icon: <Clock className="w-3 h-3" /> },
                  producao: { label: "Em produção", color: "#007AFF", bg: "#E8F0FE", icon: <Package className="w-3 h-3" /> },
                  enviado: { label: "Enviado", color: "#5856D6", bg: "#F0F0FF", icon: <Package className="w-3 h-3" /> },
                  entregue: { label: "Entregue", color: "#34C759", bg: "#E8EFE5", icon: <CheckCircle2 className="w-3 h-3" /> },
                }[o.status];
                return (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                      {statusCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        Pedido #{o.id.toUpperCase()} · {o.items} ite{o.items !== 1 ? "ns" : "m"}
                      </p>
                      <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                        Criado em {o.createdAt}
                      </p>
                    </div>
                    <span className="text-[13px] text-[#1D1D1F] tabular-nums shrink-0" style={{ fontWeight: 600 }}>
                      {fmtCurrency(o.total)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0" style={{ fontWeight: 600, backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2">
              <ShoppingBag className="w-8 h-8 text-[#D1D1D6]" />
              <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Nenhum pedido ainda</p>
              <p className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Pedidos da galeria aparecerão aqui</p>
            </div>
          )}
        </PortalCard>

        {/* ── Footer ── */}
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[#C7C7CC]" />
            <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>
              Powered by ESSYN
            </span>
          </div>
          <p className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
            essyn.studio · Portal seguro do cliente
          </p>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  REUSABLE CARD                                      */
/* ═══════════════════════════════════════════════════ */

function PortalCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  delay = 0,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay }}
      className="bg-white rounded-2xl shadow-[0_1px_4px_#E5E5EA] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F2F2F7]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </motion.div>
  );
}
