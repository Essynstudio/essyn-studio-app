import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  SettingsSectionHeader — Settings section header    */
/*  Title + short description                          */
/*  Purely typographic — no color, no border           */
/*  Primitivo: /ui/settings-section-header.tsx          */
/* ═══════════════════════════════════════════════════ */

export interface SettingsSectionHeaderProps {
  /** Section title */
  title: string;
  /** Short description */
  description?: string;
}

export function SettingsSectionHeader({
  title,
  description,
}: SettingsSectionHeaderProps) {
  const { isDark } = useDk();
  return (
    <div className="flex flex-col gap-0.5">
      <h3
        className={`text-[13px] uppercase tracking-[0.06em] ${isDark ? "text-[#8E8E93]" : "text-[#636366]"}`}
        style={{ fontWeight: 600 }}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-[12px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
          style={{ fontWeight: 400 }}
        >
          {description}
        </p>
      )}
    </div>
  );
}