import * as React from "react";
import { C, WIDGET_STYLE, ROW_HOVER } from "../../lib/apple-style";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  Apple Premium Table — Consistent data table components        */
/*  ─────────────────────────────────────────────────────────────  */
/*  Surface: white bg, radius 20, imperceptible shadow.           */
/*  Header: 11px uppercase #8E8E93, separator #F2F2F7.           */
/*  Rows: 13px #1D1D1F, hover #FAFAFA, hairline #F2F2F7.         */
/*  Cells: px-5 py-3, left-aligned, tabular-nums for numbers.    */
/*  Zero transparency. Focus ring on interactive rows.            */
/* ═══════════════════════════════════════════════════════════════ */

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Root table wrapper — provides card surface with Apple material */
export function AppleTable({
  className,
  children,
  flat = false,
  ...props
}: React.ComponentProps<"table"> & { flat?: boolean }) {
  const { isDark } = useDk();
  return (
    <div
      className={cn(isDark ? "overflow-hidden bg-[#141414]" : "overflow-hidden bg-white", flat ? "" : undefined)}
      style={flat ? undefined : {
        ...WIDGET_STYLE,
        background: isDark ? "#141414" : "#FFFFFF",
        borderColor: isDark ? "#2C2C2E" : undefined,
      }}
    >
      <div className="relative w-full overflow-x-auto">
        <table
          className={cn("w-full caption-bottom", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

/** Table header (thead) */
export function AppleTableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  const { isDark } = useDk();
  return (
    <thead
      className={cn(
        isDark ? "border-b border-[#2C2C2E]" : "border-b border-[#F2F2F7]",
        className,
      )}
      {...props}
    />
  );
}

/** Table body */
export function AppleTableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-b-0", className)}
      {...props}
    />
  );
}

/** Table footer */
export function AppleTableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  const { isDark } = useDk();
  return (
    <tfoot
      className={cn(
        isDark ? "border-t border-[#2C2C2E] bg-[#1C1C1E]" : "border-t border-[#F2F2F7] bg-[#FAFAFA]",
        className,
      )}
      {...props}
    />
  );
}

/** Table row — hairline separator, hover state */
export function AppleTableRow({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"tr"> & { interactive?: boolean }) {
  const { isDark } = useDk();
  const hoverCls = isDark
    ? "transition-colors duration-150 hover:bg-[#1C1C1E] active:bg-[#2C2C2E]"
    : ROW_HOVER;
  return (
    <tr
      className={cn(
        isDark ? "border-b border-[#2C2C2E]" : "border-b border-[#F2F2F7]",
        interactive ? hoverCls + " cursor-pointer" : "",
        className,
      )}
      {...props}
    />
  );
}

/** Table header cell — uppercase micro label */
export function AppleTableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 px-5 text-left align-middle text-[11px] uppercase tracking-[0.04em] text-[#8E8E93] whitespace-nowrap",
        className,
      )}
      style={{ fontWeight: 500 }}
      {...props}
    />
  );
}

/** Table data cell */
export function AppleTableCell({
  className,
  numeric = false,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  const { isDark } = useDk();
  return (
    <td
      className={cn(
        `px-5 py-3 align-middle text-[13px] whitespace-nowrap ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`,
        numeric ? "numeric" : "",
        className,
      )}
      style={{ fontWeight: 400 }}
      {...props}
    />
  );
}

/** Table caption */
export function AppleTableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn(
        "mt-3 text-[12px] text-[#8E8E93]",
        className,
      )}
      style={{ fontWeight: 400 }}
      {...props}
    />
  );
}