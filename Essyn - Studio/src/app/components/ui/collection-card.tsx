/* ═══════════════════════════════════════════════════ */
/*  CollectionCard — Gallery collection card           */
/*  Cover + name + count + badges + actions            */
/*  States: default | hover | selected                 */
/*  CTA always black — colors only in badges           */
/* ═══════════════════════════════════════════════════ */

import { Images, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useDk } from "../../lib/useDarkColors";

export interface CollectionCardProps {
  /** Collection name */
  name: string;
  /** Cover image URL (placeholder if absent) */
  coverUrl?: string;
  /** Number of photos */
  photoCount: number;
  /** Number of sets/albums */
  setCount?: number;
  /** Status badge slot */
  statusBadge?: ReactNode;
  /** Privacy badge slot */
  privacyBadge?: ReactNode;
  /** Visual state */
  state?: "default" | "hover" | "selected";
  /** Click handler */
  onClick?: () => void;
  /** Actions handler (three-dot menu) */
  onActions?: (e: React.MouseEvent<HTMLElement>) => void;
}

export function CollectionCard({
  name,
  coverUrl,
  photoCount,
  setCount,
  statusBadge,
  privacyBadge,
  state = "default",
  onClick,
  onActions,
}: CollectionCardProps) {
  const { isDark } = useDk();
  const isSelected = state === "selected";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 ${
        isSelected
          ? isDark
            ? "border-[#3C3C43] bg-[#141414]"
            : "border-[#AEAEB2] bg-white"
          : isDark
          ? "border-[#2C2C2E] bg-[#141414] hover:border-[#3C3C43]"
          : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
      }`}
      style={{
        boxShadow: isSelected
          ? isDark
            ? "0 0 0 1px #3C3C43, 0 2px 8px #000000"
            : "0 0 0 1px #D1D1D6, 0 2px 8px #E5E5EA"
          : isDark
            ? "0 1px 3px #000000"
            : "0 1px 3px #F2F2F7",
      }}
    >
      {/* Cover area */}
      <div className={`relative aspect-[16/10] overflow-hidden ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Images className="w-8 h-8 text-[#EEEDEC]" />
          </div>
        )}

        {/* Selected check */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#1D1D1F] flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}

        {/* Actions button (hover) */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onActions?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onActions?.(e);
            }
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[#AEAEB2] hover:text-[#636366] shadow-[0_1px_3px_#E5E5EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5EA] focus-visible:ring-offset-1 focus-visible:opacity-100"
          aria-label={`Ações para ${name}`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </span>

        {/* Badges (bottom-left of cover) */}
        {(statusBadge || privacyBadge) && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {statusBadge}
            {privacyBadge}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 py-3 flex flex-col gap-1">
        <span
          className={`text-[13px] ${isDark ? "text-[#D1D1D6]" : "text-[#636366]"} truncate`}
          style={{ fontWeight: 500 }}
        >
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"} numeric`}
            style={{ fontWeight: 400 }}
          >
            {photoCount} foto{photoCount !== 1 && "s"}
          </span>
          {setCount !== undefined && setCount > 0 && (
            <>
              <span className={`w-px h-2.5 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
              <span
                className={`text-[11px] ${isDark ? "text-[#48484A]" : "text-[#D1D1D6]"} numeric`}
                style={{ fontWeight: 400 }}
              >
                {setCount} set{setCount !== 1 && "s"}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}