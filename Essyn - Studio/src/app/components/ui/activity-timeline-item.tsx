import {
  StickyNote,
  Phone,
  MessageSquare,
  Mail,
  CheckSquare,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  ActivityTimelineItem — CRM lead activity entry    */
/*  Timeline-style item with connector line, icon,    */
/*  text and timestamp                                 */
/*  Variants: note | call | message | email | task    */
/*  Self-contained: no external deps besides icons     */
/*  Ref: HubSpot activity timeline + Pipedrive feed   */
/* ═══════════════════════════════════════════════════ */

export type CrmActivityType =
  | "note"
  | "call"
  | "message"
  | "email"
  | "task";

export interface CrmActivityData {
  id: string;
  type: CrmActivityType;
  /** Primary text line */
  text: string;
  /** Relative or absolute timestamp */
  timestamp: string;
  /** Optional secondary detail */
  detail?: string;
}

const activityTypeConfig: Record<
  CrmActivityType,
  { label: string; icon: ReactNode; bg: string; iconCls: string }
> = {
  note: {
    label: "Nota",
    icon: <StickyNote className="w-3 h-3" />,
    bg: "bg-[#F2F2F7]",
    iconCls: "text-[#C48A06]",
  },
  call: {
    label: "Ligação",
    icon: <Phone className="w-3 h-3" />,
    bg: "bg-[#F2F2F7]",
    iconCls: "text-[#3D9A5E]",
  },
  message: {
    label: "Mensagem",
    icon: <MessageSquare className="w-3 h-3" />,
    bg: "bg-[#F2F2F7]",
    iconCls: "text-[#8B5CF6]",
  },
  email: {
    label: "E-mail",
    icon: <Mail className="w-3 h-3" />,
    bg: "bg-[#F2F2F7]",
    iconCls: "text-[#5B8AD6]",
  },
  task: {
    label: "Tarefa",
    icon: <CheckSquare className="w-3 h-3" />,
    bg: "bg-[#F2F2F7]",
    iconCls: "text-[#AEAEB2]",
  },
};

interface ActivityTimelineItemProps {
  activity: CrmActivityData;
  /** Show left connector line (for items that are not last) */
  showLine?: boolean;
  /** Compact mode */
  compact?: boolean;
  onClick?: (id: string) => void;
}

export function ActivityTimelineItem({
  activity,
  showLine = true,
  compact = false,
  onClick,
}: ActivityTimelineItemProps) {
  const { isDark } = useDk();
  const cfg = activityTypeConfig[activity.type];

  return (
    <div
      className={`flex gap-3 relative ${
        onClick
          ? isDark
            ? "cursor-pointer hover:bg-[#1C1C1E] transition-colors"
            : "cursor-pointer hover:bg-[#FAFAFA] transition-colors"
          : ""
      } ${compact ? "px-3 py-2" : "px-4 py-3"}`}
      onClick={() => onClick?.(activity.id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* ── Timeline connector ── */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`${
            compact ? "w-5 h-5 rounded" : "w-6 h-6 rounded-md"
          } ${isDark ? "bg-[#1C1C1E]" : cfg.bg} flex items-center justify-center z-[1]`}
        >
          <span className={cfg.iconCls}>{cfg.icon}</span>
        </div>
        {showLine && (
          <div className={`w-px flex-1 mt-1 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`${
              compact ? "text-[11px]" : "text-[12px]"
            } ${isDark ? "text-[#AEAEB2]" : "text-[#636366]"} leading-[1.4]`}
            style={{ fontWeight: 400 }}
          >
            {activity.text}
          </p>
          <span
            className={`${
              compact ? "text-[8px]" : "text-[10px]"
            } ${isDark ? "text-[#48484A]" : "text-[#C7C7CC]"} numeric shrink-0 mt-0.5`}
            style={{ fontWeight: 400 }}
          >
            {activity.timestamp}
          </span>
        </div>
        {activity.detail && (
          <p
            className={`${
              compact ? "text-[10px]" : "text-[11px]"
            } ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"} leading-[1.4]`}
            style={{ fontWeight: 400 }}
          >
            {activity.detail}
          </p>
        )}
      </div>
    </div>
  );
}

export { activityTypeConfig };