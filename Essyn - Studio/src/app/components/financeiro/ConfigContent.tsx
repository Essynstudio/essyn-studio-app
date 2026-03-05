import { useState } from "react";
import {
  Settings2,
  AlertCircle,
  CircleCheck,
  LoaderCircle,
  RefreshCw,
  Plus,
  Building2,
  ChevronRight,
  Zap,
  Tag,
  Users,
  Shield,
  CreditCard,
  Download,
  Search,
  X,
} from "lucide-react";
import { TagPill } from "../ui/tag-pill";
import { QuickActionsBar, type QuickAction } from "../ui/quick-actions-bar";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Config — Rules, automations, categories, accounts  */
/*  Ref: Omie Configurações + Xero Settings            */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";

interface ContaBancaria {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: "corrente" | "poupanca";
  saldo: number;
  principal: boolean;
}

interface CategoriaCusto {
  id: string;
  nome: string;
  cor: string;
  count: number;
}

interface Automacao {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
}

const contas: ContaBancaria[] = [
  { id: "c1", banco: "Nubank", agencia: "0001", conta: "1234567-8", tipo: "corrente", saldo: 18750, principal: true },
  { id: "c2", banco: "Itaú", agencia: "0456", conta: "98765-4", tipo: "corrente", saldo: 3200, principal: false },
];

const categorias: CategoriaCusto[] = [
  { id: "cat1", nome: "Equipamento", cor: "#1D1D1F", count: 12 },
  { id: "cat2", nome: "Equipe / 2º fotógrafo", cor: "#007AFF", count: 8 },
  { id: "cat3", nome: "Locação", cor: "#7C3AED", count: 5 },
  { id: "cat4", nome: "Impressão / Fine Art", cor: "#FF9500", count: 4 },
  { id: "cat5", nome: "Software / Assinaturas", cor: "#34C759", count: 3 },
  { id: "cat6", nome: "Transporte", cor: "#FF3B30", count: 6 },
  { id: "cat7", nome: "Marketing", cor: "#0891B2", count: 2 },
];

const automacoes: Automacao[] = [
  { id: "auto1", nome: "Parcela vencida → Cobrar via WhatsApp", descricao: "Envia cobrança automática quando parcela vence sem pagamento", ativa: true },
  { id: "auto2", nome: "Pagamento recebido → Marcar paga", descricao: "Ao confirmar PIX/depósito, parcela muda para status 'Paga'", ativa: true },
  { id: "auto3", nome: "Paga + sem NF → Alerta NF pendente", descricao: "Gera alerta se parcela foi paga mas NF não emitida", ativa: true },
  { id: "auto4", nome: "Lembrete 3d antes do vencimento", descricao: "Envia lembrete amigável 3 dias antes da data de vencimento", ativa: true },
  { id: "auto5", nome: "Inadimplência 15d → Notificar gestor", descricao: "Notifica o gestor quando inadimplência passa de 15 dias", ativa: false },
];

const permissoes = [
  { perfil: "Admin", financeiro: true, fiscal: true, config: true },
  { perfil: "Fotógrafo", financeiro: false, fiscal: false, config: false },
  { perfil: "Contador", financeiro: true, fiscal: true, config: false },
  { perfil: "Assistente", financeiro: true, fiscal: false, config: false },
];

/* ── QuickActions (P05 Header pattern) ── */
const quickActionsConfig: QuickAction[] = [
  { label: "Nova automação", icon: <Zap className="w-3 h-3" /> },
  { label: "Adicionar conta", icon: <Building2 className="w-3 h-3" /> },
  { label: "Nova categoria", icon: <Tag className="w-3 h-3" /> },
  { label: "Exportar regras", icon: <Download className="w-3 h-3" /> },
];

function StateSwitcher({ active, onChange }: { active: ViewState; onChange: (v: ViewState) => void }) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ backgroundColor: dk.bgMuted }}>
      {(["ready","loading","empty","error"] as ViewState[]).map((s) => (
        <button key={s} onClick={() => onChange(s)} className="px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer" style={{ fontWeight: active === s ? 500 : 400, backgroundColor: active === s ? dk.bg : "transparent", color: active === s ? dk.textSecondary : dk.textMuted, boxShadow: active === s ? dk.shadowCard : "none" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
      ))}
    </div>
  );
}

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function ConfigContent() {
  const dk = useDk();
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeAutos, setActiveAutos] = useState<Set<string>>(new Set(automacoes.filter(a => a.ativa).map(a => a.id)));

  function toggleAuto(id: string) {
    setActiveAutos(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ═══ P05: Header Financeiro ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] tracking-tight" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>Financeiro</h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Configurações</span>
            <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
            <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Automações, categorias, contas bancárias e permissões</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}>
            <Settings2 className="w-3.5 h-3.5" />Salvar
          </button>
          <span className="w-px h-6" style={{ backgroundColor: dk.border }} />
          <StateSwitcher active={viewState} onChange={setViewState} />
        </div>
      </div>

      {/* ═══ P05: QuickActionsBar ═══ */}
      <QuickActionsBar actions={quickActionsConfig} onAction={() => {}} />

      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="rounded-2xl p-6 h-48 animate-pulse" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }} />))}
          <div className="flex items-center justify-center py-4 gap-2"><LoaderCircle className="w-4 h-4 animate-spin" style={{ color: dk.textDisabled }} /><span className="text-[12px]" style={{ color: dk.textMuted }}>Carregando configurações…</span></div>
        </div>
      )}
      {viewState === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.dangerBg }}><AlertCircle className="w-7 h-7 text-[#FF3B30]" /></div>
          <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Erro ao carregar configurações</span>
          <button onClick={() => setViewState("ready")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF" }}><RefreshCw className="w-3.5 h-3.5" />Tentar novamente</button>
        </div>
      )}
      {viewState === "empty" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}><Settings2 className="w-7 h-7" style={{ color: dk.textDisabled }} /></div>
          <span className="text-[14px]" style={{ fontWeight: 500, color: dk.textSecondary }}>Configurações padrão ativas</span>
          <span className="text-[12px] text-center max-w-[300px]" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>Nenhuma personalização realizada ainda. As configurações padrão estão em uso.</span>
        </div>
      )}

      {viewState === "ready" && (
        <>
          {/* Automações */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
                <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Automações</span>
              </div>
              <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{activeAutos.size} ativas de {automacoes.length}</span>
            </div>
            <div className="flex flex-col">
              {automacoes.map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors" style={{ borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] block" style={{ fontWeight: 500, color: dk.textSecondary }}>{a.nome}</span>
                    <span className="text-[11px] block mt-0.5" style={{ fontWeight: 400, color: dk.textSubtle }}>{a.descricao}</span>
                  </div>
                  <button
                    onClick={() => toggleAuto(a.id)}
                    className="w-9 h-5 rounded-full transition-colors cursor-pointer relative shrink-0"
                    style={{ backgroundColor: activeAutos.has(a.id) ? (dk.isDark ? "#F5F5F7" : "#1D1D1F") : dk.border }}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${activeAutos.has(a.id) ? "left-[18px]" : "left-0.5"}`} style={{ boxShadow: "0 1px 2px #1D1D1F" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contas bancárias */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
                  <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Contas Bancárias</span>
                </div>
                <button className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textMuted }}>
                  <Plus className="w-3 h-3" />Adicionar
                </button>
              </div>
              <div className="flex flex-col">
                {contas.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors group" style={{ borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted }}>
                      <CreditCard className="w-4 h-4" style={{ color: dk.textDisabled }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{c.banco}</span>
                        {c.principal && <TagPill>Principal</TagPill>}
                      </div>
                      <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Ag {c.agencia} · Cc {c.conta}</span>
                    </div>
                    <span className="text-[13px] tabular-nums shrink-0" style={{ fontWeight: 600, color: dk.textSecondary }}>{fmtCurrency(c.saldo)}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: dk.textDisabled }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias de custo */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
                  <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Categorias de Custo</span>
                </div>
                <button className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textMuted }}>
                  <Plus className="w-3 h-3" />Adicionar
                </button>
              </div>
              <div className="flex flex-col">
                {categorias.map((cat, i) => (
                  <div key={cat.id} className="flex items-center gap-3 px-5 py-2.5 transition-colors group" style={{ borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                    <span className="text-[12px] flex-1" style={{ fontWeight: 400, color: dk.textSecondary }}>{cat.nome}</span>
                    <span className="text-[11px] tabular-nums" style={{ fontWeight: 400, color: dk.textDisabled }}>{cat.count} lançamentos</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: dk.border }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadowCard }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.hairline}` }}>
              <Shield className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
              <span className="text-[11px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Permissões por Perfil</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    {["Perfil", "Financeiro", "Fiscal", "Configurações"].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle, backgroundColor: dk.bgSub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissoes.map((p, i) => (
                    <tr key={p.perfil} className="transition-colors" style={{ borderTop: i > 0 ? `1px solid ${dk.hairline}` : "none" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
                          <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{p.perfil}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5"><TagPill variant={p.financeiro ? "success" : "neutral"}>{p.financeiro ? "Acesso" : "Bloqueado"}</TagPill></td>
                      <td className="px-5 py-2.5"><TagPill variant={p.fiscal ? "success" : "neutral"}>{p.fiscal ? "Acesso" : "Bloqueado"}</TagPill></td>
                      <td className="px-5 py-2.5"><TagPill variant={p.config ? "success" : "neutral"}>{p.config ? "Acesso" : "Bloqueado"}</TagPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}