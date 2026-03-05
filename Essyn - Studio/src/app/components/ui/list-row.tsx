import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  ListRow — Apple Premium List Item                             */
/*  Consistent row with left slot, content, right slot.           */
/*  Hover: bg #FAFAFA. Separator: external WidgetHairline.        */
/* ═══════════════════════════════════════════════════════════════ */

export interface ListRowProps {
  /** Left slot: icon, avatar, time badge */
  left?: ReactNode;
  /** Primary text line */
  title: string;
  /** Secondary text line */
  subtitle?: string;
  /** Right slot: badge, chevron, action */
  right?: ReactNode;
  /** Show disclosure chevron on the right */
  chevron?: boolean;
  /** Click handler (makes the row interactive) */
  onClick?: () => void;
  /** Extra className */
  className?: string;
  /** Horizontal padding (default: "px-5") */
  px?: string;
  /** Vertical padding (default: "py-3") */
  py?: string;
  children?: ReactNode;
}

export function ListRow({
  left,
  title,
  subtitle,
  right,
  chevron = false,
  onClick,
  className = "",
  px = "px-5",
  py = "py-3",
  children,
}: ListRowProps) {
  const { isDark } = useDk();
  const interactive = !!onClick;
  const Tag = interactive ? "button" : "div";

  const hoverCls = isDark
    ? "transition-colors duration-150 hover:bg-[#1C1C1E] active:bg-[#2C2C2E]"
    : "transition-colors duration-150 hover:bg-[#FAFAFA] active:bg-[#F5F5F7]";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={`group flex items-center gap-3 w-full text-left ${px} ${py} ${hoverCls} ${
        interactive
          ? isDark
            ? "cursor-pointer focus-visible:outline-none focus-visible:bg-[#1C1C1E]"
            : "cursor-pointer focus-visible:outline-none focus-visible:bg-[#FAFAFA]"
          : ""
      } ${className}`}
    >
      {left && <div className="shrink-0">{left}</div>}

      {children ? (
        <div className="flex-1 min-w-0">{children}</div>
      ) : (
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          <span
            className={`text-[13px] truncate ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
            style={{ fontWeight: 500 }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className={`text-[12px] truncate ${isDark ? "text-[#636366]" : "text-[#8E8E93]"}`}
              style={{ fontWeight: 400 }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}

      {right && <div className="shrink-0">{right}</div>}

      {chevron && (
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? "text-[#3C3C43] group-hover:text-[#636366]" : "text-[#D1D1D6] group-hover:text-[#8E8E93]"}`} />
      )}
    </Tag>
  );
}