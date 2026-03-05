// ModuleShowcase — ContainerScroll cinematic reveal + full sidebar tabs
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, DollarSign, Image, Clock, Send, LayoutDashboard,
  CheckCircle2, TrendingUp, FolderKanban, Camera, Users,
  ChevronRight, MessageCircle, CheckCheck,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { SERIF } from "../ui/editorial";

const serif = SERIF;
const GOLD = "#9C8B7A";

/* ── All sidebar modules ── */
const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projetos", label: "Projetos", icon: FolderKanban },
  { id: "producao", label: "Produção", icon: Camera },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "galeria", label: "Galeria", icon: Image },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "crm", label: "CRM", icon: Users },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
] as const;

type ModuleId = (typeof modules)[number]["id"];

/* ═══════════════════════════════════════
   Module content panels
   ═══════════════════════════════════════ */

function DashboardContent() {
  const kpis = [
    { label: "Receita do mês", value: "R$ 18.400", change: "+12%", positive: true },
    { label: "Projetos ativos", value: "7", change: "+2", positive: true },
    { label: "Taxa de conversão", value: "68%", change: "+5pp", positive: true },
    { label: "Galerias entregues", value: "12", change: "+3", positive: true },
  ];
  const bars = [35, 48, 42, 55, 50, 62, 58, 70, 65, 78, 72, 85];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Dashboard</span>
        <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Fev 2026</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E5E5EA] p-4">
            <span className="text-[11px] text-[#8E8E93] block mb-1.5" style={{ fontWeight: 400 }}>{k.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] tracking-[-0.02em] text-[#1D1D1F]" style={{ fontWeight: 700, fontFeatureSettings: "'tnum'" }}>{k.value}</span>
              <span className="text-[11px] text-emerald-600" style={{ fontWeight: 500 }}>{k.change}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#E5E5EA] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Receita mensal</span>
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>2026</span>
        </div>
        <div className="h-[120px] flex items-end gap-[6px]">
          {bars.map((h, ci) => (
            <div key={ci} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: ci === 11 ? "#C9B8A8" : "#E5E5EA" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjetosContent() {
  const tagColors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
  };
  const projects = [
    { name: "Casamento Oliveira & Santos", status: "Em produção", tag: "emerald", prog: 65 },
    { name: "Corporativo TechBR Summit", status: "Entregue", tag: "blue", prog: 100 },
    { name: "Ensaio Família Rocha", status: "Briefing", tag: "amber", prog: 20 },
    { name: "Formatura Direito UFMG", status: "Contrato", tag: "purple", prog: 10 },
    { name: "Newborn Helena", status: "Edição", tag: "blue", prog: 55 },
  ];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Projetos</span>
        <span className="text-[12px] px-4 py-2 rounded-lg bg-[#1D1D1F] text-white cursor-pointer" style={{ fontWeight: 500 }}>+ Novo projeto</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {projects.map((row) => (
          <div key={row.name} className="px-4 py-4 rounded-xl hover:bg-[#F5F5F7] transition-colors">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[14px] text-[#636366]" style={{ fontWeight: 400 }}>{row.name}</span>
              <span className={`text-[11px] px-2.5 py-1 rounded-full ${tagColors[row.tag]}`} style={{ fontWeight: 500 }}>{row.status}</span>
            </div>
            <div className="h-[4px] rounded-full bg-[#E5E5EA] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.prog}%`, background: row.tag === "emerald" ? "#52C98D" : row.tag === "blue" ? "#6CA8E8" : row.tag === "amber" ? "#F2B45C" : "#B687F0" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProducaoContent() {
  const cols = [
    { title: "Seleção", color: "bg-amber-400", items: ["Maria & João — 324 fotos", "Ensaio Ana — 96 fotos"] },
    { title: "Edição", color: "bg-blue-400", items: ["TechBR Summit — 180 fotos"] },
    { title: "Entrega", color: "bg-emerald-400", items: ["Família Rocha — 142 fotos", "Álbum #14 — Diagramação"] },
  ];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Produção</span>
        <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Kanban</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cols.map((col) => (
          <div key={col.title} className="rounded-xl bg-[#F5F5F7] p-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{col.title}</span>
              <span className="text-[11px] text-[#C7C7CC] ml-auto" style={{ fontWeight: 400 }}>{col.items.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {col.items.map((item) => (
                <div key={item} className="bg-white rounded-lg px-4 py-3.5 border border-[#E5E5EA] shadow-[0_1px_3px_#F2F2F7]">
                  <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceiroContent() {
  const bars = [28, 42, 35, 58, 45, 52, 68, 55, 72, 48, 80, 65];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Financeiro</span>
        <span className="text-[12px] text-emerald-600 px-3 py-1.5 rounded-full bg-emerald-50" style={{ fontWeight: 500 }}>
          <TrendingUp className="w-3.5 h-3.5 inline mr-1" />+12% vs mês ant.
        </span>
      </div>
      <span className="text-[38px] tracking-[-0.03em] text-[#1D1D1F] block mb-6" style={{ fontWeight: 700, fontFeatureSettings: "'tnum'" }}>R$ 18.400</span>
      <div className="h-[100px] flex items-end gap-[6px] mb-6">
        {bars.map((h, ci) => (
          <div key={ci} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: ci >= 10 ? "#BBA995" : "#E5E5EA" }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5 pt-6 border-t border-[#E5E5EA]">
        {[
          { label: "A receber", value: "R$ 5.800", color: "text-[#636366]" },
          { label: "Pagos", value: "R$ 12.600", color: "text-emerald-600" },
          { label: "Pendentes", value: "R$ 2.400", color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label}>
            <span className="text-[12px] text-[#C7C7CC] block mb-1.5" style={{ fontWeight: 400 }}>{s.label}</span>
            <span className={`text-[17px] ${s.color}`} style={{ fontWeight: 600, fontFeatureSettings: "'tnum'" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const galeriaPhotos = [
  "https://images.unsplash.com/photo-1761574044344-394d47e1a96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1598812300657-a24f1941c693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1766113483984-bb624356a1c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1766113482587-4e232669fa2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1658869163471-81665d648612?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
  "https://images.unsplash.com/photo-1608021812235-f63e9d4951eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400",
];

function GaleriaContent() {
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[16px] text-[#1D1D1F] block" style={{ fontFamily: serif, fontWeight: 500 }}>Maria & Joao</span>
          <span className="text-[13px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>324 fotos  ·  Casamento  ·  Dez 2025</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 text-[12px] text-emerald-600" style={{ fontWeight: 500 }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Pronta
          </span>
          <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1D1D1F] text-white text-[12px]" style={{ fontWeight: 600 }}>
            <Send className="w-3.5 h-3.5" /> Entregar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {galeriaPhotos.map((src, idx) => (
          <div key={idx} className={`rounded-lg overflow-hidden group cursor-pointer ${idx === 0 ? "col-span-2 row-span-2" : ""}`}>
            <ImageWithFallback
              src={src}
              alt={`Foto ${idx + 1}`}
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${idx === 0 ? "h-[240px]" : "h-[115px]"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaContent() {
  const today = [
    { time: "09:00", title: "Ensaio Gestante — Parque Ibirapuera", status: "confirmed", tag: "bg-emerald-400" },
    { time: "14:00", title: "Casamento Oliveira & Santos — Igreja São José", status: "confirmed", tag: "bg-blue-400" },
    { time: "18:30", title: "Briefing — Evento TechBR Summit", status: "pending", tag: "bg-amber-400" },
  ];
  const upcoming = [
    { date: "Seg, 02 Mar", title: "Formatura Medicina UFMG", tag: "bg-purple-400" },
    { date: "Qua, 04 Mar", title: "Ensaio Família Rocha", tag: "bg-emerald-400" },
    { date: "Sex, 06 Mar", title: "Corporativo — Lançamento TechNova", tag: "bg-blue-400" },
  ];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Hoje</span>
          <span className="text-[13px] text-[#C7C7CC] px-3 py-1.5 rounded-full bg-[#F5F5F7]" style={{ fontWeight: 500, fontFeatureSettings: "'tnum'" }}>28 Fev</span>
        </div>
        <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>3 eventos</span>
      </div>
      <div className="flex flex-col gap-1.5 mb-8">
        {today.map((e) => (
          <div key={e.time} className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-[#F5F5F7] transition-colors">
            <span className="text-[14px] text-[#AEAEB2] w-[50px] flex-shrink-0" style={{ fontWeight: 500, fontFeatureSettings: "'tnum'" }}>{e.time}</span>
            <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${e.tag}`} />
            <span className="text-[14px] text-[#636366] flex-1 truncate" style={{ fontWeight: 400 }}>{e.title}</span>
            {e.status === "confirmed"
              ? <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400 flex-shrink-0" style={{ opacity: 0.5 }} />
              : <Clock className="w-[18px] h-[18px] text-amber-400 flex-shrink-0" style={{ opacity: 0.5 }} />
            }
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E5EA] pt-6">
        <span className="text-[11px] tracking-[0.08em] uppercase text-[#C7C7CC] mb-4 block" style={{ fontWeight: 600 }}>Proximos</span>
        <div className="flex flex-col gap-1.5">
          {upcoming.map((e) => (
            <div key={e.date} className="flex items-center gap-4 px-4 py-3">
              <span className="text-[13px] text-[#C7C7CC] w-[100px] flex-shrink-0" style={{ fontWeight: 400 }}>{e.date}</span>
              <div className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${e.tag}`} />
              <span className="text-[14px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>{e.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CRMContent() {
  const stages = [
    { label: "Leads", count: 12, w: "100%" },
    { label: "Propostas", count: 8, w: "67%" },
    { label: "Negociação", count: 5, w: "42%" },
    { label: "Fechados", count: 3, w: "25%" },
  ];
  const recentLeads = [
    { name: "Carolina Ferreira", event: "Casamento — Abr 2026", value: "R$ 4.800" },
    { name: "Ricardo Mendes", event: "Corporativo — Mar 2026", value: "R$ 3.200" },
    { name: "Patrícia Alves", event: "Ensaio Família", value: "R$ 1.800" },
  ];
  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Pipeline</span>
        <span className="text-[12px] text-[#9C8B7A]" style={{ fontWeight: 500 }}>R$ 42.600 em aberto</span>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        {stages.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <span className="text-[12px] text-[#AEAEB2] w-[80px] text-right flex-shrink-0" style={{ fontWeight: 500 }}>{s.label}</span>
            <div className="flex-1 h-[30px] rounded-lg overflow-hidden bg-[#F5F5F7]">
              <div className="h-full rounded-lg flex items-center px-4 transition-all" style={{ width: s.w, background: "linear-gradient(90deg, #C9B8A8, #D9CFC5)" }}>
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{s.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E5EA] pt-6">
        <span className="text-[11px] tracking-[0.08em] uppercase text-[#C7C7CC] mb-4 block" style={{ fontWeight: 600 }}>Leads recentes</span>
        {recentLeads.map((lead) => (
          <div key={lead.name} className="flex items-center justify-between py-3.5 border-b border-[#F5F5F7] last:border-0">
            <div>
              <span className="text-[14px] text-[#8E8E93] block" style={{ fontWeight: 500 }}>{lead.name}</span>
              <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{lead.event}</span>
            </div>
            <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 600, fontFeatureSettings: "'tnum'" }}>{lead.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatsAppContent() {
  const conversations = [
    {
      id: 1,
      name: "Carolina Ferreira",
      avatar: "CF",
      lastMsg: "Oi! Vi o link da galeria, ficou MARAVILHOSO!",
      time: "14:32",
      unread: 2,
      online: true,
      tag: "Casamento",
    },
    {
      id: 2,
      name: "Ricardo Mendes",
      avatar: "RM",
      lastMsg: "Confirmado para sexta às 15h no escritório.",
      time: "13:10",
      unread: 0,
      online: false,
      tag: "Corporativo",
    },
    {
      id: 3,
      name: "Patrícia Alves",
      avatar: "PA",
      lastMsg: "Pode me enviar o contrato atualizado?",
      time: "11:45",
      unread: 1,
      online: true,
      tag: "Ensaio",
    },
    {
      id: 4,
      name: "João Oliveira",
      avatar: "JO",
      lastMsg: "Galeria entregue! Obrigado pelo trabalho incrível.",
      time: "Ontem",
      unread: 0,
      online: false,
      tag: "Casamento",
    },
  ];

  const messages = [
    { id: 1, from: "client", text: "Oi! Vi o link da galeria, ficou MARAVILHOSO! 😍", time: "14:30" },
    { id: 2, from: "client", text: "As fotos da cerimônia estão perfeitas, chorei de novo vendo", time: "14:31" },
    { id: 3, from: "me", text: "Que bom que gostou, Carol! Foi um casamento lindo mesmo 🤍", time: "14:33", status: "read" },
    { id: 4, from: "me", text: "O álbum já está em diagramação, semana que vem envio a prévia pra vocês aprovarem", time: "14:34", status: "delivered" },
    { id: 5, from: "client", text: "Mal posso esperar!! Vou avisar o Lucas", time: "14:35" },
  ];

  const templates = [
    { label: "Galeria pronta", icon: "📸" },
    { label: "Lembrete sessão", icon: "📅" },
    { label: "Contrato enviado", icon: "📄" },
  ];

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-[240px] md:w-[280px] border-r border-[#E5E5EA] flex flex-col bg-[#FAFAFA]" style={{ opacity: 0.3 }}>
        <div className="px-5 py-4 border-b border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Conversas</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600" style={{ fontWeight: 600 }}>
              3 online
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F5F7]">
            <svg className="w-3.5 h-3.5 text-[#C7C7CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Buscar conversa...</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, idx) => (
            <div
              key={c.id}
              className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                idx === 0 ? "bg-[#F5F5F7]" : "hover:bg-[#F5F5F7]"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[11px] text-white"
                  style={{ fontWeight: 600, background: idx === 0 ? GOLD : "#D1D1D6" }}
                >
                  <span style={{ color: idx === 0 ? "white" : "#8E8E93" }}>{c.avatar}</span>
                </div>
                {c.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-emerald-400 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{c.name}</span>
                  <span className="text-[10px] text-[#C7C7CC] flex-shrink-0 ml-2" style={{ fontWeight: 400, fontFeatureSettings: "'tnum'" }}>{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#AEAEB2] truncate block" style={{ fontWeight: 400 }}>{c.lastMsg}</span>
                  {c.unread > 0 && (
                    <span
                      className="flex-shrink-0 ml-2 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] text-white"
                      style={{ fontWeight: 600, background: GOLD }}
                    >
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick templates */}
        <div className="px-4 py-3 border-t border-[#E5E5EA]">
          <span className="text-[10px] tracking-[0.06em] uppercase text-[#C7C7CC] mb-2 block" style={{ fontWeight: 600 }}>Templates rápidos</span>
          <div className="flex gap-1.5">
            {templates.map((t) => (
              <span
                key={t.label}
                className="text-[10px] px-2.5 py-1.5 rounded-md bg-[#F5F5F7] text-[#AEAEB2] cursor-pointer hover:bg-[#E5E5EA] transition-colors"
                style={{ fontWeight: 400 }}
              >
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] text-white"
                style={{ fontWeight: 600, background: GOLD }}
              >
                CF
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-[8px] h-[8px] rounded-full bg-emerald-400 border-[1.5px] border-white" />
            </div>
            <div>
              <span className="text-[13px] text-[#636366] block" style={{ fontWeight: 500 }}>Carolina Ferreira</span>
              <span className="text-[10px] text-emerald-500" style={{ fontWeight: 400 }}>online agora</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-600" style={{ fontWeight: 500 }}>Casamento</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#E5E5EA] text-[#AEAEB2] cursor-pointer" style={{ fontWeight: 400 }}>Ver projeto →</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3" style={{ background: "#F7F5F0", opacity: 0.3 }}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#E5E5EA]" />
            <span className="text-[10px] text-[#C7C7CC] px-3" style={{ fontWeight: 400 }}>Hoje</span>
            <div className="flex-1 h-px bg-[#E5E5EA]" />
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  msg.from === "me"
                    ? "rounded-br-md bg-[#1D1D1F]"
                    : "rounded-bl-md bg-white border border-[#E5E5EA]"
                }`}
              >
                <span className={`text-[12px] block ${msg.from === "me" ? "text-white" : "text-[#636366]"}`} style={{ fontWeight: 400, lineHeight: 1.55, opacity: msg.from === "me" ? 0.9 : 1 }}>{msg.text}</span>
                <div className={`flex items-center justify-end gap-1.5 mt-1 ${msg.from === "me" ? "text-white" : "text-[#C7C7CC]"}`} style={{ opacity: msg.from === "me" ? 0.3 : 1 }}>
                  <span className="text-[9px]" style={{ fontWeight: 400, fontFeatureSettings: "'tnum'" }}>{msg.time}</span>
                  {msg.from === "me" && (
                    msg.status === "read"
                      ? <CheckCheck className="w-3 h-3 text-blue-400" style={{ opacity: 0.7 }} />
                      : <CheckCheck className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#E5E5EA]">
              <div className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full bg-[#D1D1D6] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-[5px] h-[5px] rounded-full bg-[#D1D1D6] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-[5px] h-[5px] rounded-full bg-[#D1D1D6] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Message input */}
        <div className="px-5 py-3.5 border-t border-[#E5E5EA] flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F5F5F7]">
            <span className="text-[12px] text-[#C7C7CC] flex-1" style={{ fontWeight: 400 }}>Escrever mensagem...</span>
          </div>
          <button
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
            style={{ background: GOLD }}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

const contentMap: Record<ModuleId, () => JSX.Element> = {
  dashboard: DashboardContent,
  projetos: ProjetosContent,
  producao: ProducaoContent,
  financeiro: FinanceiroContent,
  galeria: GaleriaContent,
  agenda: AgendaContent,
  crm: CRMContent,
  whatsapp: WhatsAppContent,
};

/* ═══════════════════════════════════════
   ModuleShowcase — static editorial layout
   ═══════════════════════════════════════ */

export function ModuleShowcase() {
  const [active, setActive] = useState<ModuleId>("dashboard");
  const [userInteracted, setUserInteracted] = useState(false);

  /* ── Auto-cycle tabs every 5s unless user has clicked ── */
  useEffect(() => {
    if (userInteracted) return;
    const timer = setInterval(() => {
      setActive((prev) => {
        const idx = modules.findIndex((m) => m.id === prev);
        return modules[(idx + 1) % modules.length].id;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [userInteracted]);

  const handleTabClick = (id: ModuleId) => {
    setUserInteracted(true);
    setActive(id);
  };

  const ActiveContent = contentMap[active];

  return (
    <div className="relative px-4 md:px-10 py-24 md:py-32">
      {/* ── Header — static ── */}
      <div className="max-w-5xl mx-auto text-center mb-12 md:mb-16">
        <span
          className="text-[11px] tracking-[0.14em] uppercase mb-4 block"
          style={{ fontWeight: 600, color: "#BBA995" }}
        >
          Plataforma completa
        </span>
        <h2
          className="text-[clamp(28px,4vw,52px)] tracking-[-0.035em] text-[#1D1D1F]"
          style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}
        >
          Oito módulos, um<br />
          <span className="italic" style={{ color: "#ADA293" }}>
            único sistema.
          </span>
        </h2>
        <p
          className="text-[15px] text-[#8E8E93] max-w-[480px] mx-auto mt-5"
          style={{ fontWeight: 400, lineHeight: 1.7 }}
        >
          Do primeiro contato à entrega final — cada etapa do seu estúdio tem um módulo dedicado.
        </p>
      </div>

      {/* ── Card — static with subtle shadow ── */}
      <div className="max-w-7xl mx-auto w-full relative">
        {/* Shadow layer */}
        <div
          className="absolute -bottom-4 left-[6%] right-[6%] h-12 rounded-[50%] -z-10"
          style={{
            opacity: 0.2,
            background: "radial-gradient(ellipse at center, #3C3C43 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          aria-hidden="true"
        />

        {/* Card frame — dark bezel */}
        <div
          className="border border-[#48484A] p-[3px] md:p-1 rounded-[18px] md:rounded-[22px] relative overflow-hidden"
          style={{ background: "#1D1D1F" }}
        >
          {/* Subtle border glow */}
          <div
            className="absolute inset-0 rounded-[18px] md:rounded-[22px] pointer-events-none z-20"
            style={{
              background: "linear-gradient(135deg, #B5A79A 0%, transparent 30%, transparent 70%, #C4BAB0 100%)",
              opacity: 0.08,
            }}
            aria-hidden="true"
          />

          <div className="h-full w-full overflow-hidden rounded-[15px] md:rounded-[18px] bg-white relative z-10">
            {/* Browser chrome */}
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#E5E5EA] bg-[#FAFAFA]">
              <div className="flex gap-1.5">
                <span className="w-[11px] h-[11px] rounded-full bg-[#D1D1D6]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#E5E5EA]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#E5E5EA]" />
              </div>
              <div className="flex-1 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                    className="text-[11px] text-[#C7C7CC] px-5 py-1.5 rounded-md bg-[#F5F5F7]"
                    style={{ fontWeight: 400 }}
                  >
                    app.essyn.com/{active}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="w-[60px]" />
            </div>

            {/* App layout: sidebar + content */}
            <div className="flex flex-col sm:flex-row min-h-[520px] sm:min-h-[640px] md:min-h-[720px]">
              {/* Sidebar — desktop */}
              <div className="hidden sm:flex flex-col w-[200px] md:w-[240px] flex-shrink-0 border-r border-[#E5E5EA] bg-[#FAFAFA] py-5 px-4" style={{ opacity: 0.5 }}>
                {/* Logo */}
                <div className="flex items-center gap-2 px-3 mb-8">
                  <span className="text-[15px] tracking-[-0.04em] text-[#1D1D1F]" style={{ fontWeight: 700 }}>ESSYN</span>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: GOLD }} />
                </div>

                {/* Nav items with animated pill */}
                <div className="flex flex-col gap-1 relative">
                  {modules.map((mod) => {
                    const isActive = active === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleTabClick(mod.id)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-left transition-colors duration-200 cursor-pointer relative"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 rounded-lg bg-[#E5E5EA]"
                            style={{ zIndex: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                              mass: 0.8,
                            }}
                          />
                        )}
                        <mod.icon
                          className="w-[18px] h-[18px] flex-shrink-0 relative z-10 transition-all duration-300"
                          style={{
                            opacity: isActive ? 0.7 : 0.3,
                            color: isActive ? GOLD : "#1D1D1F",
                          }}
                        />
                        <span
                          className="text-[13px] relative z-10 transition-colors duration-200"
                          style={{
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "#1D1D1F" : "#AEAEB2",
                          }}
                        >
                          {mod.label}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 0.3, x: 0 }}
                            className="ml-auto relative z-10"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Version indicator */}
                <div className="mt-auto pt-5 px-3 border-t border-[#F5F5F7]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: GOLD }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: GOLD }} />
                    </span>
                    <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>v2.4.0 — Online</span>
                  </div>
                </div>
              </div>

              {/* Mobile tabs */}
              <div className="sm:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-[#E5E5EA] bg-[#FAFAFA] flex-shrink-0 w-full" style={{ opacity: 0.5 }}>
                {modules.map((mod) => {
                  const isActive = active === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleTabClick(mod.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] flex-shrink-0 transition-all cursor-pointer relative"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileTabPill"
                          className="absolute inset-0 rounded-full bg-[#1D1D1F]"
                          style={{ zIndex: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                      <mod.icon className={`w-3 h-3 relative z-10 ${isActive ? "text-white" : "text-[#AEAEB2]"}`} />
                      <span
                        className="relative z-10"
                        style={{
                          fontWeight: isActive ? 500 : 400,
                          color: isActive ? "white" : "#AEAEB2",
                        }}
                      >
                        {mod.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content area — staggered entry */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 16, filter: "blur(8px)", scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)", scale: 0.99 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 0.61, 0.36, 1],
                      scale: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
                    }}
                    className="h-full"
                  >
                    <ActiveContent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}