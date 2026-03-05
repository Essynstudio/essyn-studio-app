/* ═══════════════════════════════════════════════════════
   ActivityLogItem — Apple Premium List Cell (Polished)
   ─────────────────────────────────────────────────────
   Unified hover/focus/pressed pattern:
     hover:  bg-[#FAFAFA]
     active: bg-[#F5F5F7]
     focus:  ring-1 ring-[#D1D1D6]
   Color tokens:
     Primary:    #1D1D1F (user name, target)
     Secondary:  #48484A (boosted — action verb)
     Tertiary:   #636366 (not used here)
     Muted:      #AEAEB2 (timestamp)
   ═══════════════════════════════════════════════════════ */

import { useDk } from "../../lib/useDarkColors";

export type ActivityType =
  | "upload"
  | "financeiro"
  | "edicao"
  | "comentario"
  | "status"
  | "notificacao"
  | "documento"
  | "novo_cliente"
  | "concluido";

export interface ActivityLogItemData {
  id: string;
  usuario: string;
  iniciais: string;
  acao: string;
  alvo: string;
  tempo: string;
  tipo: ActivityType;
}

interface ActivityLogItemProps {
  activity: ActivityLogItemData;
  compact?: boolean;
  onClick?: (id: string) => void;
}

export function ActivityLogItem({
  activity,
  compact = false,
  onClick,
}: ActivityLogItemProps) {
  const { isDark } = useDk();

  return (
    <div
      className={`flex items-start gap-2.5 group transition-colors duration-150 ${
        compact ? "px-3.5 py-2.5" : "px-5 py-3"
      } ${onClick
        ? `cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#D1D1D6] ${
            isDark ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"
          }`
        : ""}`}
      onClick={() => onClick?.(activity.id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(activity.id);
              }
            }
          : undefined
      }
    >
      {/* Avatar */}
      <div
        className={`${
          compact ? "w-6 h-6" : "w-7 h-7"
        } rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"
        }`}
      >
        <span
          className={`${
            compact ? "text-[8px]" : "text-[10px]"
          } text-[#8E8E93] tracking-[0.02em]`}
          style={{ fontWeight: 600 }}
        >
          {activity.iniciais}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p
          className={`${compact ? "text-[12px]" : "text-[13px]"} ${isDark ? "text-[#8E8E93]" : "text-[#48484A]"}`}
          style={{ fontWeight: 400, lineHeight: 1.45 }}
        >
          <span style={{ fontWeight: 500 }} className={isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}>
            {activity.usuario}
          </span>{" "}
          {activity.acao}{" "}
          <span style={{ fontWeight: 500 }} className={isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}>
            {activity.alvo}
          </span>
        </p>
        <span
          className={`${compact ? "text-[10px]" : "text-[11px]"} text-[#AEAEB2] numeric`}
          style={{ fontWeight: 400, lineHeight: 1.3 }}
        >
          {activity.tempo}
        </span>
      </div>
    </div>
  );
}

/* Legacy export */
export const activityIconMap = {} as Record<ActivityType, unknown>;