/* ═══════════════════════════════════════════════════ */
/*  ShareLinkBar — Gallery share link display          */
/*  Shows: link + "Copiar" + "Configurar" buttons      */
/*  Variant: default | compact (for drawer)            */
/*  CTA always black — actions ghost/secondary         */
/* ═══════════════════════════════════════════════════ */

import { Copy, Settings, ExternalLink } from "lucide-react";

export type ShareLinkBarVariant = "default" | "compact";

interface ShareLinkBarProps {
  /** URL to display */
  url: string;
  /** Visual variant */
  variant?: ShareLinkBarVariant;
  /** Copy handler */
  onCopy?: () => void;
  /** Settings handler */
  onConfigure?: () => void;
}

export function ShareLinkBar({
  url,
  variant = "default",
  onCopy,
  onConfigure,
}: ShareLinkBarProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={`flex items-center border border-[#E5E5EA] bg-white overflow-hidden ${
        isCompact
          ? "rounded-xl gap-0"
          : "rounded-2xl gap-0"
      }`}
    >
      {/* Link display */}
      <div className={`flex-1 min-w-0 flex items-center gap-2 ${isCompact ? "px-3 py-2" : "px-4 py-2.5"}`}>
        <ExternalLink className={`shrink-0 text-[#D1D1D6] ${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        <span
          className={`truncate text-[#AEAEB2] ${isCompact ? "text-[11px]" : "text-[12px]"}`}
          style={{ fontWeight: 400 }}
        >
          {url}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center border-l border-[#E5E5EA]">
        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 border-r border-[#E5E5EA] text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-[-1px] ${
            isCompact ? "px-2.5 py-2 text-[10px]" : "px-3 py-2.5 text-[11px]"
          }`}
          style={{ fontWeight: 500 }}
        >
          <Copy className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Copiar
        </button>
        <button
          onClick={onConfigure}
          className={`flex items-center gap-1.5 text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-[-1px] ${
            isCompact ? "px-2.5 py-2 text-[10px]" : "px-3 py-2.5 text-[11px]"
          }`}
          style={{ fontWeight: 500 }}
        >
          <Settings className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Configurar
        </button>
      </div>
    </div>
  );
}