import {
  Instagram,
  Heart,
  Globe,
  Megaphone,
  MoreHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  LeadSourceTag — CRM lead origin indicator         */
/*  Variants: instagram | indicacao | site | anuncio  */
/*            | outros                                 */
/*  Shows icon + label                                 */
/*  Colors ONLY in tags — never in CTAs                */
/* ═══════════════════════════════════════════════════ */

export type LeadSource =
  | "instagram"
  | "indicacao"
  | "site"
  | "anuncio"
  | "outros";

const leadSourceConfig: Record<
  LeadSource,
  { label: string; icon: ReactNode; cls: string; clsDark: string }
> = {
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#8B5CF6] border-[#E5E5EA]",
    clsDark: "bg-[#2A1A3A] text-[#8B5CF6] border-[#3A2A4E]",
  },
  indicacao: {
    label: "Indicação",
    icon: <Heart className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#3D9A5E] border-[#E5E5EA]",
    clsDark: "bg-[#1A2E1C] text-[#3D9A5E] border-[#2A3E2C]",
  },
  site: {
    label: "Site",
    icon: <Globe className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#5B8AD6] border-[#E5E5EA]",
    clsDark: "bg-[#1A222E] text-[#5B8AD6] border-[#2C3A4E]",
  },
  anuncio: {
    label: "Anúncio",
    icon: <Megaphone className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#C48A06] border-[#E5E5EA]",
    clsDark: "bg-[#2E2A1A] text-[#C48A06] border-[#3E3A2A]",
  },
  outros: {
    label: "Outros",
    icon: <MoreHorizontal className="w-2.5 h-2.5" />,
    cls: "bg-[#F2F2F7] text-[#AEAEB2] border-[#E5E5EA]",
    clsDark: "bg-[#2C2C2E] text-[#AEAEB2] border-[#3C3C43]",
  },
};

interface LeadSourceTagProps {
  source: LeadSource;
  showIcon?: boolean;
}

export function LeadSourceTag({
  source,
  showIcon = true,
}: LeadSourceTagProps) {
  const { isDark } = useDk();
  const cfg = leadSourceConfig[source];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md border text-[9px] ${isDark ? cfg.clsDark : cfg.cls}`}
      style={{ fontWeight: 500 }}
    >
      {showIcon && (
        <span className="shrink-0 [&>svg]:w-2.5 [&>svg]:h-2.5">
          {cfg.icon}
        </span>
      )}
      {cfg.label}
    </span>
  );
}

export { leadSourceConfig };