/**
 * ProjetoDrawer — Main drawer hub for project details.
 * 
 * Modular architecture:
 * - drawer-primitives.tsx   → DrawerCard, DrawerCardRow, TabEmpty, TabError, etc.
 * - TabCadastro.tsx         → Registration tab
 * - TabProducao.tsx         → Production tab
 * - TabFinanceiro.tsx       → Financial tab
 * - financeiro-modals.tsx   → Financial modals & sub-components
 * - TabGaleria.tsx          → Gallery tab
 * - TabDocs.tsx             → Docs/Notes tab
 * - ProjectTimeline.tsx     → Project Timeline tab
 */
import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  Camera,
  DollarSign,
  Image,
  StickyNote,
  ExternalLink,
  Clock,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springDefault, springFadeIn, springOverlay } from "../../lib/motion-tokens";
import type { Projeto } from "./projetosData";
import { statusConfig } from "./projetosData";
import { useDk } from "../../lib/useDarkColors";

/* ── Modular tab imports ── */
import {
  TabStatePicker,
  ActionsMenu,
  DeleteConfirmation,
  type TabState,
  type TabId,
} from "./drawer-primitives";
import { TabCadastro } from "./TabCadastro";
import { TabProducao } from "./TabProducao";
import { TabFinanceiro } from "./TabFinanceiro";
import { TabGaleria } from "./TabGaleria";
import { TabDocs } from "./TabDocs";
import { ProjectTimeline } from "./ProjectTimeline";

/* ══════════════════════════════════════════════════ */
/*  MAIN DRAWER — ProjetoDrawer (Hub)                 */
/* ═══════════════════════════════════════════════════ */

const tabs = [
  { id: "cadastro" as TabId, label: "Cadastro", icon: <FileText className="w-3 h-3" /> },
  { id: "producao" as TabId, label: "Produção", icon: <Camera className="w-3 h-3" /> },
  { id: "financeiro" as TabId, label: "Financeiro", icon: <DollarSign className="w-3 h-3" /> },
  { id: "galeria" as TabId, label: "Galeria", icon: <Image className="w-3 h-3" /> },
  { id: "docs" as TabId, label: "Docs/Notas", icon: <StickyNote className="w-3 h-3" /> },
  { id: "timeline" as TabId, label: "Timeline", icon: <Clock className="w-3 h-3" /> },
  { id: "portal" as TabId, label: "Portal", icon: <Globe className="w-3 h-3" /> },
];

export function ProjetoDrawer({
  projeto,
  open,
  onClose,
  initialTab,
}: {
  projeto: Projeto | null;
  open: boolean;
  onClose: () => void;
  initialTab?: TabId;
}) {
  const dk = useDk();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab || "cadastro");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [tabStates, setTabStates] = useState<Record<TabId, TabState>>({
    cadastro: "ready", producao: "ready", financeiro: "ready", galeria: "ready", docs: "ready", timeline: "ready", portal: "ready",
  });

  useEffect(() => {
    if (open) { setActiveTab(initialTab || "cadastro"); setMenuOpen(false); setShowDelete(false); }
  }, [open, projeto?.id, initialTab]);

  if (!projeto) return null;

  const sc = statusConfig[projeto.status];

  function setCurrentTabState(s: TabState) {
    setTabStates((prev) => ({ ...prev, [activeTab]: s }));
  }

  function getTabBadge(id: TabId): ReactNode {
    switch (id) {
      case "producao": return projeto!.producao.etapasTotal > 0 ? <span className="text-[9px] numeric ml-0.5" style={{ color: dk.textDisabled }}>{projeto!.producao.etapasConcluidas}/{projeto!.producao.etapasTotal}</span> : null;
      case "financeiro": return projeto!.financeiro.vencidas > 0 ? <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] ml-1 shrink-0" /> : null;
      case "galeria": return projeto!.fotos > 0 ? <span className="text-[9px] numeric ml-0.5" style={{ color: dk.textDisabled }}>{projeto!.fotos}</span> : null;
      default: return null;
    }
  }

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[9998] flex">
              <motion.div className="absolute inset-0 bg-[#1D1D1F]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={springOverlay} />
              <motion.div
                className="relative ml-auto w-full max-w-[520px] flex flex-col h-full"
                style={{
                  backgroundColor: dk.isDark ? "#141414" : "#FFFFFF",
                  boxShadow: dk.isDark ? "0 8px 24px #000000,0 2px 8px #000000" : "0 8px 24px #D1D1D6,0 2px 8px #E5E5EA",
                }}
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={springDefault}
              >
                {/* HEADER */}
                <div className="shrink-0 border-b" style={{ borderColor: dk.hairline }}>
                  <div className="flex items-start justify-between px-6 pt-5 pb-2.5">
                    <div className="flex flex-col gap-2 min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3
                          className="text-[17px] tracking-[-0.01em] truncate"
                          style={{ fontWeight: 600, color: dk.isDark ? "#E5E5EA" : "#3C3C43" }}
                        >
                          {projeto.nome}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${sc.bg} ${sc.border} ${sc.text} text-[10px] border shrink-0`} style={{ fontWeight: 500 }}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}</span>
                      </div>
                      <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textMuted }}>{projeto.tipo} · {projeto.diaSemana}, {projeto.dataEvento} · {projeto.cliente}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TabStatePicker state={tabStates[activeTab]} onChange={setCurrentTabState} />
                      <span className="w-px h-4 mx-0.5" style={{ backgroundColor: dk.hairline }} />
                      <ActionsMenu open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} onDelete={() => setShowDelete(true)} />
                      <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ color: dk.textSubtle }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = dk.textTertiary; e.currentTarget.style.backgroundColor = dk.bgMuted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = dk.textSubtle; e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-0 px-6 -mb-px">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const badge = getTabBadge(tab.id);
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] border-b-2 transition-all cursor-pointer"
                          style={{
                            fontWeight: isActive ? 500 : 400,
                            borderColor: isActive
                              ? (dk.isDark ? "#F5F5F7" : "#1D1D1F")
                              : "transparent",
                            color: isActive
                              ? (dk.isDark ? "#D1D1D6" : "#48484A")
                              : dk.textDisabled,
                          }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = dk.textTertiary; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = dk.textDisabled; }}
                        >
                          {tab.label}{badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springFadeIn}>
                      {activeTab === "cadastro" && <TabCadastro projeto={projeto} tabState={tabStates.cadastro} />}
                      {activeTab === "producao" && <TabProducao projeto={projeto} tabState={tabStates.producao} />}
                      {activeTab === "financeiro" && <TabFinanceiro projeto={projeto} tabState={tabStates.financeiro} />}
                      {activeTab === "galeria" && <TabGaleria projeto={projeto} tabState={tabStates.galeria} />}
                      {activeTab === "docs" && <TabDocs tabState={tabStates.docs} />}
                      {activeTab === "timeline" && <ProjectTimeline projeto={projeto} />}
                      {activeTab === "portal" && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
                                Preview do Portal do Cliente
                              </span>
                              <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                                Visualize o que o cliente verá ao acessar o portal
                              </span>
                            </div>
                            <a
                              href={`/portal/${projeto.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#007AFF] text-white text-[11px] hover:bg-[#0066D6] transition-colors cursor-pointer"
                              style={{ fontWeight: 500 }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir em nova aba
                            </a>
                          </div>
                          <div
                            className="rounded-xl border overflow-hidden"
                            style={{ height: 480, borderColor: dk.border, backgroundColor: dk.bg }}
                          >
                            <iframe
                              src={`/portal/${projeto.id}`}
                              className="w-full h-full border-0"
                              title={`Portal — ${projeto.nome}`}
                              style={{ pointerEvents: "auto" }}
                            />
                          </div>
                          <span className="text-[10px] text-center" style={{ fontWeight: 400, color: dk.textDisabled }}>
                            URL pública: {window.location.origin}/portal/{projeto.id}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div
                  className="shrink-0 px-6 py-3 border-t flex items-center justify-between"
                  style={{
                    borderColor: dk.hairline,
                    backgroundColor: dk.isDark ? "#141414" : "#FFFFFF",
                  }}
                >
                  <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>ID: {projeto.id}</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/portal/${projeto.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-[#007AFF] hover:text-[#0066D6] transition-colors cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver Portal
                    </a>
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{projeto.prazoEntrega}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {showDelete && (
        <DeleteConfirmation projeto={projeto} onClose={() => setShowDelete(false)} onConfirm={() => { setShowDelete(false); onClose(); }} />
      )}
    </>
  );
}