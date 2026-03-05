import { useState, forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springContentIn, springPopoverIn } from "../../lib/motion-tokens";
import { TagPill, type TagVariant } from "./tag-pill";
import {
  ProductionStageBadge,
  type ProductionStage,
  type ProductionStageState,
} from "./production-stage-badge";
import {
  WorkflowProgressPill,
  type WorkflowProgressVariant,
} from "./workflow-progress-pill";
import { RowSelectCheckbox } from "./row-select-checkbox";
import { TypeBadge } from "./type-badge";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  ProductionActionRowItem — Production work row     */
/*  Separate from ActionRowItem (financial)           */
/*                                                     */
/*  Structure:                                         */
/*  [Checkbox] [TypeBadge] [TipoIcon] [Info block]    */
/*  [StageBadge] [WorkflowPill] [Tags×4] [CTA] […]   */
/*                                                     */
/*  Variants by item type:                             */
/*    servico | aguardando_cliente | atrasado           */
/*                                                     */
/*  Reuses exclusively 02_Components primitives:       */
/*  TypeBadge, ProductionStageBadge,                   */
/*  WorkflowProgressPill, TagPill,                     */
/*  RowSelectCheckbox                                  */
/*                                                     */
/*  CTA always black (system primary)                  */
/*  Ref: Asana task row + QuickBooks line items         */
/* ═══════════════════════════════════════════════════ */

/* ── Types ── */

export type ProductionItemType =
  | "edicao"
  | "album"
  | "tratamento"
  | "impressao";

export type ProductionRowVariant =
  | "servico"
  | "aguardando_cliente"
  | "atrasado";

export interface ProductionTag {
  label: string;
  variant: TagVariant;
}

export interface ProductionRowData {
  id: string;
  /** Project name */
  projeto: string;
  projetoId: string;
  /** Client name */
  cliente: string;
  /** Work item title */
  titulo: string;
  /** Type of work */
  tipo: ProductionItemType;
  /** Row variant drives visual treatment */
  rowVariant: ProductionRowVariant;
  /** Current workflow stage */
  stage: ProductionStage;
  /** State of the current stage */
  stageState: ProductionStageState;
  /** Current step (1-based) */
  currentStep: number;
  /** Total steps in workflow */
  totalSteps: number;
  /** SLA days remaining */
  slaDays: number;
  /** Overall progress 0-100 */
  progress: number;
  /** Assignee initials */
  responsavel: string;
  /** Tags (max 4) */
  tags?: ProductionTag[];
  /** Priority */
  priority?: "urgente" | "normal" | "baixa";
}

/* ── Config maps ── */

const tipoConfig: Record<
  ProductionItemType,
  { label: string; text: string; bg: string; bgDark: string }
> = {
  edicao: {
    label: "Edição",
    text: "text-[#FF9500]",
    bg: "#FAF7F0",
    bgDark: "#2E2A1A",
  },
  album: {
    label: "Álbum",
    text: "text-[#34C759]",
    bg: "#F2F8F4",
    bgDark: "#1A2E1C",
  },
  tratamento: {
    label: "Tratamento",
    text: "text-[#FF3B30]",
    bg: "#FBF5F4",
    bgDark: "#3A1A18",
  },
  impressao: {
    label: "Impressão",
    text: "text-[#8E8E93]",
    bg: "#F2F2F7",
    bgDark: "#2C2C2E",
  },
};

/* ── Row variant styling ── */

const variantBorder: Record<ProductionRowVariant, string> = {
  servico: "border-[#E5E5EA] hover:border-[#D1D1D6]",
  aguardando_cliente: "border-[#E5E5EA] hover:border-[#D1D1D6]",
  atrasado: "border-[#F2DDD9] hover:border-[#F2DDD9]",
};

const variantBorderDark: Record<ProductionRowVariant, string> = {
  servico: "border-[#2C2C2E] hover:border-[#3C3C43]",
  aguardando_cliente: "border-[#2C2C2E] hover:border-[#3C3C43]",
  atrasado: "border-[#3A1A18] hover:border-[#3A1A18]",
};

const variantAccentBg: Record<ProductionRowVariant, string> = {
  servico: "",
  aguardando_cliente: "bg-[#FAFAFA]",
  atrasado: "bg-[#FBF5F4]",
};

const variantAccentBgDark: Record<ProductionRowVariant, string> = {
  servico: "",
  aguardando_cliente: "bg-[#1C1C1E]",
  atrasado: "bg-[#1A1010]",
};

/* ── Default menu items ── */

const defaultMenuItems = [
  "Ver projeto",
  "Avançar etapa",
  "Reatribuir",
  "Alterar prazo",
  "Marcar finalizado",
];

/* ═══════════════════════════════════════════════════ */
/*  Component                                          */
/* ═══════════════════════════════════════════════════ */

export const ProductionActionRowItem = forwardRef<
  HTMLDivElement,
  {
    item: ProductionRowData;
    onViewProject?: (projetoId: string) => void;
    onAdvanceStage?: (id: string) => void;
    onAction?: (id: string, action: string) => void;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    menuItems?: string[];
    /** Use compact WorkflowProgressPill (drawer mode) */
    compactProgress?: boolean;
    /** Flat row mode — no border/shadow/radius, flush inside parent card */
    flat?: boolean;
  }
>(function ProductionActionRowItem(
  {
    item,
    onViewProject,
    onAdvanceStage,
    onAction,
    selected,
    onToggleSelect,
    menuItems = defaultMenuItems,
    compactProgress = false,
    flat = false,
  },
  ref
) {
  const { isDark } = useDk();
  const tipo = tipoConfig[item.tipo] ?? tipoConfig.edicao;
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = (item.tags || []).slice(0, 4);
  const progressVariant: WorkflowProgressVariant = compactProgress
    ? "compact"
    : "default";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: springPopoverIn }}
      transition={springContentIn}
      className={`group transition-all ${
        flat
          ? `${isDark ? "hover:bg-[#1C1C1E]" : "hover:bg-[#FAFAFA]"} ${
              selected
                ? isDark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]"
                : ""
            } ${item.rowVariant === "atrasado"
              ? isDark ? "bg-[#1A1010]" : "bg-[#FBF5F4]"
              : ""
            } ${item.rowVariant === "aguardando_cliente"
              ? isDark ? "bg-[#1C1C1E]" : "bg-[#FAFAFA]"
              : ""
            }`
          : `border ${
              selected
                ? isDark
                  ? "border-[#636366] ring-1 ring-[#3C3C43]"
                  : "border-[#D1D1D6] ring-1 ring-[#E5E5EA]"
                : isDark
                ? variantBorderDark[item.rowVariant]
                : variantBorder[item.rowVariant]
            } ${isDark ? variantAccentBgDark[item.rowVariant] : variantAccentBg[item.rowVariant]} ${isDark ? "bg-[#141414]" : "bg-white"}`
      }`}
      style={
        flat
          ? undefined
          : { borderRadius: 16, boxShadow: isDark ? "0 1px 3px #000000" : "0 1px 3px #E5E5EA" }
      }
    >
      <div className={`flex items-center gap-3 ${flat ? "px-5 py-3.5" : "px-4 py-3"}`}>
        {/* Checkbox */}
        <RowSelectCheckbox
          state={selected ? "checked" : "unchecked"}
          onChange={() => onToggleSelect(item.id)}
        />

        {/* Center content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Line 1: TypeBadge + Title + StageBadge */}
          <div className="flex items-center gap-2 min-w-0">
            <TypeBadge variant="producao" />
            <button
              onClick={() => onViewProject?.(item.projetoId)}
              className={`text-[13px] truncate hover:underline underline-offset-2 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] rounded-sm ${isDark ? "text-[#AEAEB2] hover:text-[#F5F5F7]" : "text-[#48484A] hover:text-[#1D1D1F]"}`}
              style={{ fontWeight: 500 }}
            >
              {item.titulo}
            </button>

            {/* Type chip */}
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md text-[9px] ${tipo.text}`}
              style={{ fontWeight: 500, background: isDark ? tipo.bgDark : tipo.bg }}
            >
              {tipo.label}
            </span>

            {/* Priority badge */}
            {item.priority === "urgente" && (
              <span
                className={`shrink-0 text-[9px] text-[#FF3B30] px-1.5 py-[1px] rounded-md border ${isDark ? "border-[#3A1A18]" : "border-[#F2DDD9]"}`}
                style={{ fontWeight: 500, background: isDark ? "#3A1A18" : "#FBF5F4" }}
              >
                Urgente
              </span>
            )}
          </div>

          {/* Line 2: Project + Client + Assignee */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] truncate ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 400 }}
            >
              {item.projeto}
            </span>
            <span className={`w-px h-2 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
            <span
              className={`text-[10px] ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`}
              style={{ fontWeight: 400 }}
            >
              {item.cliente}
            </span>
            <span className={`w-px h-2 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
            <span className={`inline-flex items-center gap-0.5 text-[10px] ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`}>
              <User className="w-2.5 h-2.5" />
              {item.responsavel}
            </span>
          </div>

          {/* Line 3: StageBadge + WorkflowPill + Tags */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <ProductionStageBadge
              stage={item.stage}
              state={item.stageState}
              size="sm"
              showIcon
              showDot
            />
            <WorkflowProgressPill
              current={item.currentStep}
              total={item.totalSteps}
              slaDays={item.slaDays}
              variant={progressVariant}
              isLate={item.rowVariant === "atrasado"}
            />
            {tags.length > 0 && (
              <>
                <span className={`w-px h-3 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`} />
                {tags.map((tag) => (
                  <TagPill
                    key={tag.label}
                    variant={tag.variant}
                    size="xs"
                  >
                    {tag.label}
                  </TagPill>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: CTA + menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onAdvanceStage?.(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-all cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-2 ${isDark ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]" : "bg-[#1D1D1F] text-white hover:bg-[#48484A]"}`}
            style={{ fontWeight: 500 }}
          >
            Avançar
          </button>

          {/* Overflow menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-offset-1 focus-visible:opacity-100 ${isDark ? "text-[#3C3C43] hover:text-[#636366] hover:bg-[#2C2C2E]" : "text-[#D1D1D6] hover:text-[#AEAEB2] hover:bg-[#F2F2F7]"}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="prod-action-menu"
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={springPopoverIn}
                  className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border py-1 overflow-hidden ${isDark ? "border-[#3C3C43] bg-[#1C1C1E]" : "border-[#E5E5EA] bg-white"}`}
                  style={{ boxShadow: isDark ? "0 4px 16px #000000" : "0 4px 16px #E5E5EA" }}
                >
                  {menuItems.map((mi) => (
                    <button
                      key={mi}
                      onClick={() => {
                        if (mi === "Ver projeto" && onViewProject)
                          onViewProject(item.projetoId);
                        if (mi === "Avançar etapa" && onAdvanceStage)
                          onAdvanceStage(item.id);
                        onAction?.(item.id, mi);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] focus-visible:ring-inset ${isDark ? "text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#8E8E93] hover:bg-[#F2F2F7]"}`}
                      style={{ fontWeight: 400 }}
                    >
                      {mi}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {menuOpen && (
              createPortal(
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setMenuOpen(false)}
                />,
                document.body
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductionActionRowItem.displayName = "ProductionActionRowItem";