import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  X,
  Image,
  Images,
  FolderPlus,
  Plus,
  LoaderCircle,
  Eye,
  Settings,
  Droplet,
  ExternalLink,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { Projeto } from "./projetosData";
import { DrawerCard, TabStateWrapper, TabEmpty, type TabState } from "./drawer-primitives";
import { useDk } from "../../lib/useDarkColors";
import { GalleryStatusBadge, type GalleryStatus } from "../ui/gallery-status-badge";
import { GalleryPrivacyBadge, type GalleryPrivacy } from "../ui/gallery-privacy-badge";
import { GalleryMetricPill } from "../ui/gallery-metric-pill";
import { ShareLinkBar } from "../ui/share-link-bar";
import { UploadDropzone } from "../ui/upload-dropzone";
import { getCollectionForProject } from "../../lib/navigation";

/* ── Gallery types ── */

interface GaleriaSet {
  id: string;
  nome: string;
  fotos: number;
  criadoEm: string;
  tipo: "set" | "album";
}

interface GaleriaMock {
  galleryStatus: GalleryStatus;
  galleryPrivacy: GalleryPrivacy;
  watermark: boolean;
  expiracao: string;
  totalFotos: number;
  favoritos: number;
  selecoes: number;
  views: number;
  downloads: number;
  sets: GaleriaSet[];
  linkSlug: string;
}

/* ── Build mock gallery from project ── */

function buildMockGaleria(projeto: Projeto): GaleriaMock {
  const { status, fotos, tipo, dataEvento, prazoEntrega, cliente } = projeto;

  let galleryStatus: GalleryStatus = "rascunho";
  if (status === "producao" || status === "edicao") galleryStatus = "previa";
  if (status === "entregue") galleryStatus = "final";

  let galleryPrivacy: GalleryPrivacy = "privado";
  if (status === "entregue") galleryPrivacy = "senha";
  if (status === "entregue" && tipo === "Corporativo") galleryPrivacy = "publico";

  const watermark = status !== "entregue";

  const expiracaoDate = new Date(prazoEntrega.replace(
    /(\d{2}) (\w{3}) (\d{4})/,
    (_m, d, month, y) => {
      const months: Record<string, string> = {
        Jan: "01", Fev: "02", Mar: "03", Abr: "04",
        Mai: "05", Jun: "06", Jul: "07", Ago: "08",
        Set: "09", Out: "10", Nov: "11", Dez: "12",
      };
      return `${y}-${months[month] || "01"}-${d}`;
    }
  ));
  expiracaoDate.setMonth(expiracaoDate.getMonth() + (status === "entregue" ? 12 : 6));
  const expiracao = expiracaoDate.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const sets: GaleriaSet[] = [];
  if (fotos > 0) {
    if (tipo === "Casamento") {
      const cer = Math.round(fotos * 0.35);
      const festa = Math.round(fotos * 0.45);
      const making = fotos - cer - festa;
      sets.push(
        { id: "set-1", nome: "Cerimônia", fotos: cer, criadoEm: dataEvento, tipo: "set" },
        { id: "set-2", nome: "Festa", fotos: festa, criadoEm: dataEvento, tipo: "set" },
        { id: "set-3", nome: "Making Of", fotos: making, criadoEm: dataEvento, tipo: "set" },
      );
    } else if (tipo === "Corporativo") {
      const palco = Math.round(fotos * 0.4);
      const retratos = Math.round(fotos * 0.35);
      const ambiente = fotos - palco - retratos;
      sets.push(
        { id: "set-1", nome: "Palestras & Palco", fotos: palco, criadoEm: dataEvento, tipo: "set" },
        { id: "set-2", nome: "Retratos Corporativos", fotos: retratos, criadoEm: dataEvento, tipo: "set" },
        { id: "set-3", nome: "Ambiente & Networking", fotos: ambiente, criadoEm: dataEvento, tipo: "set" },
      );
    } else if (tipo === "Formatura") {
      const baile = Math.round(fotos * 0.5);
      const grupo = Math.round(fotos * 0.3);
      const retratos = fotos - baile - grupo;
      sets.push(
        { id: "set-1", nome: "Baile", fotos: baile, criadoEm: dataEvento, tipo: "set" },
        { id: "set-2", nome: "Grupo & Mesa", fotos: grupo, criadoEm: dataEvento, tipo: "set" },
        { id: "set-3", nome: "Retratos Individuais", fotos: retratos, criadoEm: dataEvento, tipo: "set" },
      );
    } else if (tipo === "Ensaio") {
      sets.push(
        { id: "set-1", nome: "Seleção Final", fotos: Math.round(fotos * 0.35), criadoEm: dataEvento, tipo: "album" },
        { id: "set-2", nome: "Todas as Fotos", fotos: fotos, criadoEm: dataEvento, tipo: "set" },
      );
    } else {
      const sel = Math.round(fotos * 0.6);
      const complemento = fotos - sel;
      sets.push(
        { id: "set-1", nome: "Seleção Principal", fotos: sel, criadoEm: dataEvento, tipo: "album" },
        { id: "set-2", nome: "Complementares", fotos: complemento, criadoEm: dataEvento, tipo: "set" },
      );
    }
  }

  const favoritos = fotos > 0 ? Math.round(fotos * 0.12) : 0;
  const selecoes = fotos > 0 ? Math.round(fotos * 0.08) : 0;
  const views = fotos > 0 ? Math.round(fotos * 3.2 + 45) : 0;
  const downloads = fotos > 0 ? Math.round(fotos * 0.22) : 0;

  const slug = cliente.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const linkSlug = `galeria.essyn.com/${slug}`;

  return { galleryStatus, galleryPrivacy, watermark, expiracao, totalFotos: fotos, favoritos, selecoes, views, downloads, sets, linkSlug };
}

/* ── Criar Coleção modal ── */

function CriarColecaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"set" | "album">("set");
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (open) { setNome(""); setTipo("set"); setCreating(false); } }, [open]);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={creating ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[400px] mx-4 overflow-hidden" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1D1D1F] flex items-center justify-center"><FolderPlus className="w-3 h-3 text-white" /></div>
            <h3 className="text-[15px] text-[#3C3C43]" style={{ fontWeight: 600 }}>Criar coleção</h3>
          </div>
          <button onClick={onClose} disabled={creating} className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer disabled:opacity-30"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Nome da coleção</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cerimônia, Seleção Final..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#48484A] placeholder:text-[#D1D1D6] outline-none focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all" style={{ fontWeight: 400 }} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Tipo</label>
            <div className="flex gap-2">
              {(["set", "album"] as const).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] border transition-all cursor-pointer ${tipo === t ? "border-[#D1D1D6] bg-[#F2F2F7] text-[#636366]" : "border-[#E5E5EA] text-[#AEAEB2] hover:border-[#D1D1D6]"}`}
                  style={{ fontWeight: tipo === t ? 500 : 400 }}>
                  {t === "set" ? <Layers className="w-3 h-3" /> : <Images className="w-3 h-3" />}
                  {t === "set" ? "Set" : "Álbum"}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
              {tipo === "set" ? "Sets agrupam fotos por momento. O total é contado separadamente." : "Álbuns são coleções editáveis para entrega. Fotos podem vir de vários sets."}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} disabled={creating} className="px-4 py-2 rounded-xl text-[13px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer disabled:opacity-30" style={{ fontWeight: 500 }}>Cancelar</button>
          <button onClick={() => { if (!nome.trim()) return; setCreating(true); setTimeout(() => onClose(), 1000); }} disabled={creating || !nome.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#48484A] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40" style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}>
            {creating ? (<><LoaderCircle className="w-3.5 h-3.5 animate-spin" />Criando...</>) : (<><Plus className="w-3.5 h-3.5" />Criar coleção</>)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Gallery set row ── */

function GaleriaSetRow({ set, totalFotos }: { set: GaleriaSet; totalFotos: number }) {
  const dk = useDk();
  const pct = totalFotos > 0 ? Math.round((set.fotos / totalFotos) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 group/set" style={{ borderColor: dk.hairline }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
        {set.tipo === "album" ? <Images className="w-4 h-4" style={{ color: dk.textDisabled }} /> : <Image className="w-4 h-4" style={{ color: dk.textDisabled }} />}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] truncate" style={{ fontWeight: 450, color: dk.textSecondary }}>{set.nome}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ fontWeight: 500, color: dk.textDisabled, backgroundColor: dk.bgMuted }}>{set.tipo === "album" ? "Álbum" : "Set"}</span>
        </div>
        <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
          {set.fotos} fotos neste {set.tipo === "album" ? "álbum" : "set"}
          <span style={{ color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}> · {pct}% da coleção</span>
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[11px] numeric" style={{ fontWeight: 500, color: dk.textMuted }}>{set.fotos}</span>
        <div className="w-10 h-1 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: dk.textDisabled }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main TabGaleria ── */

export function TabGaleria({
  projeto,
  tabState,
}: {
  projeto: Projeto;
  tabState: TabState;
}) {
  const dk = useDk();
  const navigate = useNavigate();
  const hasPhotos = projeto.fotos > 0;
  const [showCriarModal, setShowCriarModal] = useState(false);
  const galeria = buildMockGaleria(projeto);

  return (
    <TabStateWrapper state={tabState}>
      {!hasPhotos ? (
        <TabEmpty
          icon={<Images className="w-6 h-6 text-[#E5E5EA]" />}
          title="Nenhuma coleção criada"
          description="Crie uma coleção para organizar e compartilhar as fotos deste evento com o cliente."
          ctaLabel="Criar coleção"
          ctaIcon={<FolderPlus className="w-3.5 h-3.5" />}
          onCta={() => setShowCriarModal(true)}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <DrawerCard title="Status da galeria">
            <div className="px-4 py-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <GalleryStatusBadge status={galeria.galleryStatus} size="md" showDot />
                <GalleryPrivacyBadge privacy={galeria.galleryPrivacy} size="md" />
                {galeria.watermark && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textMuted, borderColor: dk.border }}>
                    <Droplet className="w-3 h-3" />Watermark
                  </span>
                )}
              </div>
              {galeria.galleryStatus !== "rascunho" && <ShareLinkBar url={galeria.linkSlug} variant="compact" />}
              <div className="flex items-center gap-1.5 flex-wrap">
                <GalleryMetricPill metric="views" value={galeria.views} size="sm" />
                <GalleryMetricPill metric="downloads" value={galeria.downloads} size="sm" />
                <GalleryMetricPill metric="favoritos" value={galeria.favoritos} size="sm" />
                <GalleryMetricPill metric="selecoes" value={galeria.selecoes} size="sm" />
              </div>
              <div className="flex flex-col gap-0 pt-1 border-t" style={{ borderColor: dk.hairline }}>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Total da coleção</span>
                  <span className="text-[12px] numeric" style={{ fontWeight: 500, color: dk.textSecondary }}>{galeria.totalFotos} fotos</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Expira em</span>
                  <span className="text-[12px] numeric" style={{ fontWeight: 400, color: dk.textMuted }}>{galeria.expiracao}</span>
                </div>
              </div>
            </div>
          </DrawerCard>

          <DrawerCard title="Sets & Álbuns" count={galeria.sets.length}
            extra={<button onClick={() => setShowCriarModal(true)} className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textSubtle }}><Plus className="w-3 h-3" />Novo</button>}>
            {galeria.sets.map((s) => <GaleriaSetRow key={s.id} set={s} totalFotos={galeria.totalFotos} />)}
            <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: dk.hairline, backgroundColor: dk.bgSub }}>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Total da coleção</span>
              <span className="text-[12px] numeric" style={{ fontWeight: 600, color: dk.textTertiary }}>{galeria.totalFotos} fotos</span>
            </div>
          </DrawerCard>

          <DrawerCard title="Adicionar fotos">
            <div className="p-3"><UploadDropzone state="idle" /></div>
          </DrawerCard>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => toast.info("Configurar compartilhamento", { description: "Defina senha, expiração e marca d'água" })}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] border transition-all cursor-pointer" style={{ fontWeight: 500, borderColor: dk.border, color: dk.textTertiary }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgHover; e.currentTarget.style.borderColor = dk.isDark ? "#48484A" : "#D1D1D6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = dk.border; }}>
                <Settings className="w-3 h-3" />Configurar compartilhamento
              </button>
            </div>
            {(() => {
              const colId = getCollectionForProject(projeto.id);
              return colId ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/galeria/cliente/${colId}`)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] border transition-all cursor-pointer" style={{ fontWeight: 500, borderColor: dk.border, color: dk.textTertiary }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <Eye className="w-3 h-3" />Modo cliente
                  </button>
                  <button onClick={() => navigate(`/galeria?colecao=${colId}`)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}>
                    <ExternalLink className="w-3.5 h-3.5" />Abrir coleção
                  </button>
                </div>
              ) : (
                <button className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl text-[13px] cursor-not-allowed" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textMuted }} disabled>
                  <ExternalLink className="w-3.5 h-3.5" />Abrir coleção
                </button>
              );
            })()}
          </div>
        </div>
      )}
      <CriarColecaoModal open={showCriarModal} onClose={() => setShowCriarModal(false)} />
    </TabStateWrapper>
  );
}