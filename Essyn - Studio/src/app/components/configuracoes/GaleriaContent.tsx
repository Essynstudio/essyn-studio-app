import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Image,
  Layers,
  Lock,
  Palette,
  RefreshCw,
  Shield,
  Type,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { TagPill } from "../ui/tag-pill";
import { AppleModal } from "../ui/apple-modal";
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from "../ui/apple-kit";

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type PrivacyLevel = "publica" | "protegida" | "privada";
type WatermarkPosition = "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "tile";
type WatermarkType = "text" | "image";
type GalleryLayout = "grid" | "masonry" | "slideshow" | "horizontal";

interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string;
  domainVerified: boolean;
  layout: GalleryLayout;
  showLogo: boolean;
  showFooter: boolean;
  footerText: string;
  coverStyle: "blur" | "gradient" | "solid" | "none";
  fontFamily: string;
}

interface PrivacyConfig {
  defaultLevel: PrivacyLevel;
  requirePassword: boolean;
  defaultPassword: string;
  allowDownload: boolean;
  downloadQuality: "original" | "high" | "medium" | "web";
  allowShare: boolean;
  expirationDays: number;
  showExif: boolean;
  rightClickProtection: boolean;
  pinProtection: boolean;
}

interface WatermarkConfig {
  enabled: boolean;
  type: WatermarkType;
  text: string;
  imageUrl: string;
  position: WatermarkPosition;
  opacity: number;
  size: number;
  applyOnProofing: boolean;
  applyOnDownload: boolean;
  color: string;
  fontFamily: string;
}

/* ═══════════════════════════════════════════════════ */
/*  INITIAL STATE                                     */
/* ═══════════════════════════════════════════════════ */

const initialBranding: BrandingConfig = {
  logoUrl: "",
  primaryColor: "#1D1D1F",
  secondaryColor: "#F5F5F7",
  accentColor: "#007AFF",
  customDomain: "galeria.meuestudio.com.br",
  domainVerified: true,
  layout: "masonry",
  showLogo: true,
  showFooter: true,
  footerText: "© 2026 Meu Estúdio — Todos os direitos reservados",
  coverStyle: "blur",
  fontFamily: "Inter",
};

const initialPrivacy: PrivacyConfig = {
  defaultLevel: "protegida",
  requirePassword: true,
  defaultPassword: "",
  allowDownload: true,
  downloadQuality: "high",
  allowShare: false,
  expirationDays: 90,
  showExif: false,
  rightClickProtection: true,
  pinProtection: false,
};

const initialWatermark: WatermarkConfig = {
  enabled: true,
  type: "text",
  text: "Meu Estúdio Fotografia",
  imageUrl: "",
  position: "bottom-right",
  opacity: 30,
  size: 18,
  applyOnProofing: true,
  applyOnDownload: false,
  color: "#FFFFFF",
  fontFamily: "Inter",
};

/* ═══════════════════════════════════════════════════ */
/*  CONFIG MAPS                                       */
/* ═══════════════════════════════════════════════════ */

const privacyLevelConfig: Record<PrivacyLevel, { label: string; desc: string; icon: ReactNode; color: string; bg: string }> = {
  publica: { label: "Pública", desc: "Qualquer pessoa com o link pode visualizar", icon: <Globe className="w-4 h-4" />, color: "#34C759", bg: "#E8F8ED" },
  protegida: { label: "Protegida", desc: "Acesso com senha ou link seguro", icon: <Shield className="w-4 h-4" />, color: "#FF9500", bg: "#FFF4E6" },
  privada: { label: "Privada", desc: "Somente usuários autorizados podem ver", icon: <Lock className="w-4 h-4" />, color: "#FF3B30", bg: "#FFEBEF" },
};

const layoutConfig: Record<GalleryLayout, { label: string; desc: string }> = {
  grid: { label: "Grid", desc: "Grade uniforme" },
  masonry: { label: "Masonry", desc: "Alvenaria dinâmica" },
  slideshow: { label: "Slideshow", desc: "Apresentação de slides" },
  horizontal: { label: "Horizontal", desc: "Rolagem lateral" },
};

const positionConfig: Record<WatermarkPosition, string> = {
  "center": "Centro",
  "bottom-right": "Inferior direito",
  "bottom-left": "Inferior esquerdo",
  "top-right": "Superior direito",
  "top-left": "Superior esquerdo",
  "tile": "Mosaico (repetido)",
};

const downloadQualityConfig: Record<string, string> = {
  original: "Original (RAW/Full)",
  high: "Alta (4K, 300dpi)",
  medium: "Média (2K, 150dpi)",
  web: "Web (1080p, 72dpi)",
};

const coverStyleConfig: Record<string, string> = {
  blur: "Desfoque (blur)",
  gradient: "Gradiente",
  solid: "Cor sólida",
  none: "Sem capa",
};

const fontOptions = ["Inter", "Playfair Display", "Montserrat", "Lora", "Cormorant Garamond", "Raleway"];

/* ═══════════════════════════════════════════════════ */
/*  SHARED FORM PRIMITIVES                            */
/* ═══════════════════════════════════════════════════ */

const inputCls = "h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all";
const labelCls = "text-[11px] text-[#C7C7CC]";
const selectCls = "h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all cursor-pointer appearance-none";

/* ═══════════════════════════════════════════════════ */
/*  TOGGLE ROW                                        */
/* ═══════════════════════════════════════════════════ */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F5F5F7] last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
        <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{label}</span>
        {description && (
          <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{description}</span>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={"relative w-[44px] h-[26px] rounded-full transition-all cursor-pointer shrink-0 " + (
          checked ? "bg-[#34C759]" : "bg-[#E5E5EA]"
        )}
      >
        <span
          className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
          style={{
            left: checked ? 21 : 3,
            boxShadow: "0 1px 3px #C7C7CC",
          }}
        />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  COLOR SWATCH INPUT                                */
/* ═══════════════════════════════════════════════════ */

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls} style={{ fontWeight: 500 }}>{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-[#E5E5EA] shrink-0 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer"
            style={{ opacity: 0 }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={"flex-1 " + inputCls}
          style={{ fontWeight: 400, fontFamily: "monospace" }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  BRANDING MODAL                                    */
/* ═══════════════════════════════════════════════════ */

function BrandingModal({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: BrandingConfig;
  onSave: (c: BrandingConfig) => void;
}) {
  const [form, setForm] = useState<BrandingConfig>({ ...config });
  const upd = (patch: Partial<BrandingConfig>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    onSave(form);
    toast.success("Branding atualizado", { description: "As configurações visuais da galeria foram salvas", duration: 3000 });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Branding da Galeria"
      subtitle="Logo, cores, layout e estilo visual para suas galerias"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            <Check className="w-3.5 h-3.5" />
            Salvar configurações
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Logo upload */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Logotipo</label>
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#E5E5EA] flex items-center justify-center cursor-pointer hover:border-[#C7C7CC] transition-all bg-[#FAFAFA]"
              onClick={() => toast("Upload de logo", { description: "Selecione um arquivo PNG ou SVG (recomendado: 200×60px)", duration: 3000 })}
            >
              {form.logoUrl ? (
                <span className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Logo</span>
              ) : (
                <Upload className="w-5 h-5 text-[#D1D1D6]" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>PNG, SVG ou JPG · Máx. 2 MB</span>
              <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Recomendado: 200×60px, fundo transparente</span>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-3 gap-3">
          <ColorInput label="Cor principal" value={form.primaryColor} onChange={(v) => upd({ primaryColor: v })} />
          <ColorInput label="Cor de fundo" value={form.secondaryColor} onChange={(v) => upd({ secondaryColor: v })} />
          <ColorInput label="Cor de destaque" value={form.accentColor} onChange={(v) => upd({ accentColor: v })} />
        </div>

        {/* Layout + Cover + Font */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Layout padrão</label>
            <select value={form.layout} onChange={(e) => upd({ layout: e.target.value as GalleryLayout })} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(layoutConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label} — {v.desc}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Estilo de capa</label>
            <select value={form.coverStyle} onChange={(e) => upd({ coverStyle: e.target.value as BrandingConfig["coverStyle"] })} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(coverStyleConfig).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipografia</label>
            <select value={form.fontFamily} onChange={(e) => upd({ fontFamily: e.target.value })} className={selectCls} style={{ fontWeight: 400 }}>
              {fontOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Domain */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Domínio personalizado</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.customDomain}
              onChange={(e) => upd({ customDomain: e.target.value })}
              placeholder="galeria.meuestudio.com.br"
              className={"flex-1 " + inputCls}
              style={{ fontWeight: 400 }}
            />
            <div className="flex items-center gap-1.5 px-3 rounded-xl border" style={{ borderColor: form.domainVerified ? "#34C759" : "#E5E5EA", backgroundColor: form.domainVerified ? "#E8F8ED" : "white" }}>
              {form.domainVerified ? (
                <Check className="w-3.5 h-3.5" style={{ color: "#34C759" }} />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#C7C7CC]" />
              )}
              <span className="text-[11px]" style={{ fontWeight: 500, color: form.domainVerified ? "#34C759" : "#C7C7CC" }}>
                {form.domainVerified ? "Verificado" : "Pendente"}
              </span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col px-1">
          <ToggleRow label="Exibir logotipo" description="Mostra o logo no topo da galeria" checked={form.showLogo} onChange={(v) => upd({ showLogo: v })} />
          <ToggleRow label="Exibir rodapé" description="Mostra texto de rodapé com copyright" checked={form.showFooter} onChange={(v) => upd({ showFooter: v })} />
        </div>

        {/* Footer text */}
        {form.showFooter && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Texto do rodapé</label>
            <input type="text" value={form.footerText} onChange={(e) => upd({ footerText: e.target.value })} placeholder="© 2026 Meu Estúdio" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        )}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PRIVACY MODAL                                     */
/* ═══════════════════════════════════════════════════ */

function PrivacyModal({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: PrivacyConfig;
  onSave: (c: PrivacyConfig) => void;
}) {
  const [form, setForm] = useState<PrivacyConfig>({ ...config });
  const upd = (patch: Partial<PrivacyConfig>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    onSave(form);
    toast.success("Privacidade atualizada", { description: "As configurações de acesso padrão foram salvas", duration: 3000 });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Privacidade Padrão"
      subtitle="Defina o nível de acesso padrão para novas galerias"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            <Check className="w-3.5 h-3.5" />
            Salvar configurações
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Privacy level selector */}
        <div className="flex flex-col gap-2">
          <label className={labelCls} style={{ fontWeight: 500 }}>Nível de acesso padrão</label>
          <div className="flex flex-col gap-2">
            {(Object.entries(privacyLevelConfig) as [PrivacyLevel, typeof privacyLevelConfig.publica][]).map(([key, conf]) => (
              <button
                key={key}
                onClick={() => upd({ defaultLevel: key })}
                className={"flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer " + (
                  form.defaultLevel === key
                    ? "border-[#007AFF] bg-[#EDF4FF]"
                    : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                )}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: conf.bg, color: conf.color }}
                >
                  {conf.icon}
                </div>
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{conf.label}</span>
                  <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{conf.desc}</span>
                </div>
                {form.defaultLevel === key && (
                  <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Download settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Qualidade de download</label>
            <select value={form.downloadQuality} onChange={(e) => upd({ downloadQuality: e.target.value as PrivacyConfig["downloadQuality"] })} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(downloadQualityConfig).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Expiração (dias)</label>
            <input type="number" value={form.expirationDays} onChange={(e) => upd({ expirationDays: parseInt(e.target.value) || 0 })} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col px-1">
          <ToggleRow label="Exigir senha" description="Novas galerias exigem senha para visualização" checked={form.requirePassword} onChange={(v) => upd({ requirePassword: v })} />
          <ToggleRow label="Permitir download" description="Clientes podem baixar fotos da galeria" checked={form.allowDownload} onChange={(v) => upd({ allowDownload: v })} />
          <ToggleRow label="Permitir compartilhamento" description="Clientes podem compartilhar links de fotos individuais" checked={form.allowShare} onChange={(v) => upd({ allowShare: v })} />
          <ToggleRow label="Exibir dados EXIF" description="Mostra câmera, lente, ISO e abertura nas fotos" checked={form.showExif} onChange={(v) => upd({ showExif: v })} />
          <ToggleRow label="Proteção de clique direito" description="Bloqueia menu de contexto e arrastar imagens" checked={form.rightClickProtection} onChange={(v) => upd({ rightClickProtection: v })} />
          <ToggleRow label="Proteção por PIN" description="Adiciona camada extra de autenticação com PIN numérico" checked={form.pinProtection} onChange={(v) => upd({ pinProtection: v })} />
        </div>

        {/* Password field (conditional) */}
        {form.requirePassword && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Senha padrão (opcional)</label>
            <input
              type="text"
              value={form.defaultPassword}
              onChange={(e) => upd({ defaultPassword: e.target.value })}
              placeholder="Deixe vazio para gerar automaticamente"
              className={inputCls}
              style={{ fontWeight: 400 }}
            />
            <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
              Se vazio, cada nova galeria recebe uma senha única gerada automaticamente
            </span>
          </div>
        )}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  WATERMARK MODAL                                   */
/* ═══════════════════════════════════════════════════ */

function WatermarkModal({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: WatermarkConfig;
  onSave: (c: WatermarkConfig) => void;
}) {
  const [form, setForm] = useState<WatermarkConfig>({ ...config });
  const upd = (patch: Partial<WatermarkConfig>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    onSave(form);
    toast.success("Watermark atualizado", { description: "As configurações de marca d'água foram salvas", duration: 3000 });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Watermark"
      subtitle="Configure a marca d'água automática para proofing e download"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            <Check className="w-3.5 h-3.5" />
            Salvar configurações
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Enable toggle */}
        <div className="px-1">
          <ToggleRow label="Marca d'água ativa" description="Aplica automaticamente em fotos da galeria" checked={form.enabled} onChange={(v) => upd({ enabled: v })} />
        </div>

        {form.enabled && (
          <>
            {/* Type selector */}
            <div className="flex flex-col gap-2">
              <label className={labelCls} style={{ fontWeight: 500 }}>Tipo de marca d'água</label>
              <div className="flex gap-2">
                {([
                  { key: "text" as WatermarkType, label: "Texto", icon: <Type className="w-4 h-4" /> },
                  { key: "image" as WatermarkType, label: "Imagem / Logo", icon: <Image className="w-4 h-4" /> },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => upd({ type: opt.key })}
                    className={"flex items-center gap-2 flex-1 px-3.5 py-3 rounded-xl border transition-all cursor-pointer " + (
                      form.type === opt.key
                        ? "border-[#007AFF] bg-[#EDF4FF]"
                        : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                    )}
                  >
                    <span style={{ color: form.type === opt.key ? "#007AFF" : "#C7C7CC" }}>
                      {opt.icon}
                    </span>
                    <span className="text-[13px]" style={{ fontWeight: 500, color: form.type === opt.key ? "#007AFF" : "#8E8E93" }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text or Image config */}
            {form.type === "text" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls} style={{ fontWeight: 500 }}>Texto</label>
                  <input
                    type="text"
                    value={form.text}
                    onChange={(e) => upd({ text: e.target.value })}
                    placeholder="Meu Estúdio Fotografia"
                    className={inputCls}
                    style={{ fontWeight: 400 }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls} style={{ fontWeight: 500 }}>Tipografia</label>
                  <select value={form.fontFamily} onChange={(e) => upd({ fontFamily: e.target.value })} className={selectCls} style={{ fontWeight: 400 }}>
                    {fontOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} style={{ fontWeight: 500 }}>Imagem do watermark</label>
                <div
                  className="h-20 rounded-xl border-2 border-dashed border-[#E5E5EA] flex items-center justify-center cursor-pointer hover:border-[#C7C7CC] transition-all bg-[#FAFAFA]"
                  onClick={() => toast("Upload de watermark", { description: "Selecione um PNG com fundo transparente", duration: 3000 })}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-[#D1D1D6]" />
                    <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>PNG transparente · Máx. 1 MB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Position + Size + Opacity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} style={{ fontWeight: 500 }}>Posição</label>
                <select value={form.position} onChange={(e) => upd({ position: e.target.value as WatermarkPosition })} className={selectCls} style={{ fontWeight: 400 }}>
                  {Object.entries(positionConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} style={{ fontWeight: 500 }}>Tamanho (px)</label>
                <input type="number" value={form.size} onChange={(e) => upd({ size: parseInt(e.target.value) || 12 })} min={8} max={72} className={inputCls} style={{ fontWeight: 400 }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} style={{ fontWeight: 500 }}>Opacidade (%)</label>
                <input type="number" value={form.opacity} onChange={(e) => upd({ opacity: parseInt(e.target.value) || 0 })} min={5} max={100} className={inputCls} style={{ fontWeight: 400 }} />
              </div>
            </div>

            {/* Color (text only) */}
            {form.type === "text" && (
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Cor do texto" value={form.color} onChange={(v) => upd({ color: v })} />
              </div>
            )}

            {/* Preview */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontWeight: 500 }}>Pré-visualização</label>
              <div className="relative h-[140px] rounded-xl bg-[#E5E5EA] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[200px] h-[130px] bg-[#8E8E93] rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-[#AEAEB2]" />
                  </div>
                </div>
                {/* Watermark overlay */}
                <div className={"absolute flex items-center justify-center " + (
                  form.position === "center" ? "inset-0" :
                  form.position === "bottom-right" ? "bottom-3 right-4" :
                  form.position === "bottom-left" ? "bottom-3 left-4" :
                  form.position === "top-right" ? "top-3 right-4" :
                  form.position === "top-left" ? "top-3 left-4" :
                  "inset-0"
                )}>
                  <span
                    className="select-none"
                    style={{
                      fontSize: Math.max(10, Math.min(form.size * 0.7, 28)),
                      fontFamily: form.fontFamily,
                      color: form.color,
                      opacity: form.opacity / 100,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {form.type === "text" ? (form.text || "Watermark") : "🖼️ Logo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Application toggles */}
            <div className="flex flex-col px-1">
              <ToggleRow label="Aplicar no proofing" description="Mostra watermark na visualização da galeria" checked={form.applyOnProofing} onChange={(v) => upd({ applyOnProofing: v })} />
              <ToggleRow label="Aplicar no download" description="Inclui watermark nas fotos baixadas" checked={form.applyOnDownload} onChange={(v) => upd({ applyOnDownload: v })} />
            </div>
          </>
        )}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  VIEW STATES                                       */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  return <WidgetSkeleton rows={4} delay={0.06} />;
}

/* ═══════════════════════════════════════════════════ */
/*  SETTING CARD (local)                              */
/* ═══════════════════════════════════════════════════ */

function GallerySettingCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  tag,
  cta,
  onClick,
  index,
  children,
}: {
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tag?: ReactNode;
  cta: string;
  onClick: () => void;
  index: number;
  children?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springStagger(index)}
      className="flex flex-col bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden"
      style={{ boxShadow: "0 1px 3px #F2F2F7" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 p-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{title}</span>
            {tag}
          </div>
          <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{description}</span>
        </div>
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          style={{ fontWeight: 500 }}
        >
          {cta}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content preview */}
      {children && (
        <div className="border-t border-[#F5F5F7] px-5 py-4">
          {children}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

interface GaleriaContentProps {
  onBack: () => void;
}

export function GaleriaContent({ onBack }: GaleriaContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [branding, setBranding] = useState<BrandingConfig>(initialBranding);
  const [privacy, setPrivacy] = useState<PrivacyConfig>(initialPrivacy);
  const [watermark, setWatermark] = useState<WatermarkConfig>(initialWatermark);

  /* ── Modal states ── */
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [watermarkOpen, setWatermarkOpen] = useState(false);

  const privConf = privacyLevelConfig[privacy.defaultLevel];

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]" style={{ fontWeight: 700 }}>
              Galeria
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Dev state toggles */}
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
              {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setViewState(s)}
                  className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (
                    viewState === s ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                  )}
                  style={{ fontWeight: 500 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-11">
          <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            Branding, privacidade e watermark da galeria de clientes
          </span>
          {viewState === "ready" && (
            <>
              <span className="w-px h-3 bg-[#E5E5EA]" />
              <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                3 seções configuráveis
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}>
              <WidgetEmptyState
                icon={<Palette className="w-5 h-5" />}
                message="Configure a identidade visual e regras de privacidade da sua galeria"
                cta="Configurar branding"
                onCta={() => { setViewState("ready"); setBrandingOpen(true); }}
              />
            </WidgetCard>
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}>
              <WidgetErrorState message="Erro ao carregar configurações da galeria" onRetry={() => setViewState("ready")} />
            </WidgetCard>
          </motion.div>
        ) : (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="flex flex-col gap-4">
            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Layout", value: layoutConfig[branding.layout].label, sub: layoutConfig[branding.layout].desc },
                { label: "Privacidade", value: privConf.label, sub: privacy.expirationDays + " dias de expiração" },
                { label: "Download", value: privacy.allowDownload ? "Ativado" : "Bloqueado", sub: downloadQualityConfig[privacy.downloadQuality] },
                { label: "Watermark", value: watermark.enabled ? "Ativo" : "Desativado", sub: watermark.enabled ? positionConfig[watermark.position] : "Sem marca d'água" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springStagger(i)}
                  className="flex flex-col gap-1 px-4 py-3.5 bg-white rounded-2xl border border-[#E5E5EA]"
                  style={{ boxShadow: "0 1px 3px #F2F2F7" }}
                >
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{kpi.label}</span>
                  <span className="text-[18px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>{kpi.value}</span>
                  <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{kpi.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* ── Branding Card ── */}
            <GallerySettingCard
              icon={<Palette className="w-5 h-5" />}
              iconColor="#007AFF"
              iconBg="#EDF4FF"
              title="Branding da Galeria"
              description="Logo, cores, domínio personalizado e estilo visual"
              cta="Personalizar"
              onClick={() => setBrandingOpen(true)}
              index={0}
            >
              <div className="flex flex-wrap gap-3">
                {/* Color swatches */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Cores:</span>
                  {[branding.primaryColor, branding.secondaryColor, branding.accentColor].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-md border border-[#E5E5EA]" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="w-px h-5 bg-[#F2F2F7]" />
                {/* Layout */}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{layoutConfig[branding.layout].label}</span>
                </div>
                <span className="w-px h-5 bg-[#F2F2F7]" />
                {/* Font */}
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{branding.fontFamily}</span>
                </div>
                <span className="w-px h-5 bg-[#F2F2F7]" />
                {/* Domain */}
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{branding.customDomain}</span>
                  {branding.domainVerified && <Check className="w-3 h-3 text-[#34C759]" />}
                </div>
              </div>
            </GallerySettingCard>

            {/* ── Privacy Card ── */}
            <GallerySettingCard
              icon={<Eye className="w-5 h-5" />}
              iconColor="#FF9500"
              iconBg="#FFF4E6"
              title="Privacidade Padrão"
              description="Defina nível de acesso padrão para novas galerias"
              tag={<TagPill variant={privacy.defaultLevel === "publica" ? "success" : privacy.defaultLevel === "protegida" ? "warning" : "danger"} size="xs">{privConf.label}</TagPill>}
              cta="Configurar"
              onClick={() => setPrivacyOpen(true)}
              index={1}
            >
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(privacyLevelConfig) as [PrivacyLevel, typeof privacyLevelConfig.publica][]).map(([key, conf]) => (
                  <div
                    key={key}
                    className={"flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all " + (
                      privacy.defaultLevel === key ? "border-[#007AFF] bg-[#EDF4FF]" : "border-[#F2F2F7] bg-[#FAFAFA]"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: conf.bg, color: conf.color }}>
                      {conf.icon}
                    </div>
                    <div className="flex flex-col gap-0">
                      <span className="text-[12px] text-[#636366]" style={{ fontWeight: 500 }}>{conf.label}</span>
                      <span className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{conf.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Quick features row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F5F5F7]">
                {[
                  { label: "Senha", active: privacy.requirePassword },
                  { label: "Download", active: privacy.allowDownload },
                  { label: "Compartilhar", active: privacy.allowShare },
                  { label: "EXIF", active: privacy.showExif },
                  { label: "Anti-clique", active: privacy.rightClickProtection },
                  { label: "PIN", active: privacy.pinProtection },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-center gap-1.5">
                    <div className={"w-2 h-2 rounded-full shrink-0 " + (feat.active ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
                    <span className="text-[10px]" style={{ fontWeight: 400, color: feat.active ? "#636366" : "#C7C7CC" }}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </GallerySettingCard>

            {/* ── Watermark Card ── */}
            <GallerySettingCard
              icon={<Image className="w-5 h-5" />}
              iconColor="#AF52DE"
              iconBg="#F5EDFA"
              title="Watermark"
              description="Marca d'água automática para proofing e download"
              tag={
                watermark.enabled
                  ? <TagPill variant="success" size="xs">Ativo</TagPill>
                  : <TagPill variant="neutral" size="xs">Desativado</TagPill>
              }
              cta="Configurar"
              onClick={() => setWatermarkOpen(true)}
              index={2}
            >
              {watermark.enabled ? (
                <div className="flex items-center gap-4">
                  {/* Mini preview */}
                  <div className="relative w-[120px] h-[80px] rounded-lg bg-[#E5E5EA] overflow-hidden flex items-center justify-center shrink-0">
                    <div className="w-[90px] h-[65px] bg-[#8E8E93] rounded flex items-center justify-center">
                      <Image className="w-5 h-5 text-[#AEAEB2]" />
                    </div>
                    <div className={"absolute flex items-center justify-center " + (
                      watermark.position === "center" ? "inset-0" :
                      watermark.position === "bottom-right" ? "bottom-1 right-2" :
                      watermark.position === "bottom-left" ? "bottom-1 left-2" :
                      watermark.position === "top-right" ? "top-1 right-2" :
                      watermark.position === "top-left" ? "top-1 left-2" :
                      "inset-0"
                    )}>
                      <span
                        className="select-none"
                        style={{
                          fontSize: Math.max(7, watermark.size * 0.4),
                          fontFamily: watermark.fontFamily,
                          color: watermark.color,
                          opacity: watermark.opacity / 100,
                          fontWeight: 600,
                        }}
                      >
                        {watermark.type === "text" ? (watermark.text || "Watermark") : "Logo"}
                      </span>
                    </div>
                  </div>

                  {/* Config summary */}
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0">
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Tipo</span>
                        <span className="text-[12px] text-[#636366]" style={{ fontWeight: 500 }}>{watermark.type === "text" ? "Texto" : "Imagem"}</span>
                      </div>
                      <div className="flex flex-col gap-0">
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Posição</span>
                        <span className="text-[12px] text-[#636366]" style={{ fontWeight: 500 }}>{positionConfig[watermark.position]}</span>
                      </div>
                      <div className="flex flex-col gap-0">
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Opacidade</span>
                        <span className="text-[12px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>{watermark.opacity}%</span>
                      </div>
                      <div className="flex flex-col gap-0">
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Tamanho</span>
                        <span className="text-[12px] text-[#636366] tabular-nums" style={{ fontWeight: 500 }}>{watermark.size}px</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className={"w-2 h-2 rounded-full shrink-0 " + (watermark.applyOnProofing ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
                        <span className="text-[10px]" style={{ fontWeight: 400, color: watermark.applyOnProofing ? "#636366" : "#C7C7CC" }}>Proofing</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={"w-2 h-2 rounded-full shrink-0 " + (watermark.applyOnDownload ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
                        <span className="text-[10px]" style={{ fontWeight: 400, color: watermark.applyOnDownload ? "#636366" : "#C7C7CC" }}>Download</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <EyeOff className="w-4 h-4 text-[#D1D1D6]" />
                  <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
                    Marca d'água desativada — clique em "Configurar" para ativar
                  </span>
                </div>
              )}
            </GallerySettingCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <BrandingModal open={brandingOpen} onClose={() => setBrandingOpen(false)} config={branding} onSave={setBranding} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} config={privacy} onSave={setPrivacy} />
      <WatermarkModal open={watermarkOpen} onClose={() => setWatermarkOpen(false)} config={watermark} onSave={setWatermark} />
    </div>
  );
}