/* ═══════════════════════════════════════════════════════════════════════ */
/*  ESSYN — Automated Color Lint Script                                  */
/*  ─────────────────────────────────────────────────────────────────────  */
/*  Programmatic color compliance checker. Import and call lintColors()   */
/*  to scan all source files against the prohibited colors list.          */
/*                                                                        */
/*  Usage in code:                                                        */
/*    import { lintColors, formatReport } from "./color-lint";            */
/*    const report = lintColors(filesMap);                                */
/*    console.log(formatReport(report));                                  */
/*                                                                        */
/*  Usage via grep (terminal):                                            */
/*    Copy the pattern from getGrepCommand() and run in project root.     */
/* ═══════════════════════════════════════════════════════════════════════ */

import {
  PROHIBITED_COLORS,
  ALLOWED_COLORS,
  MAIA_EXCEPTION_COLORS,
  MAIA_EXCEPTION_FILES,
  CANVAS_EXCEPTION_FILES,
  scanSource,
  buildProhibitedPattern,
  type ComplianceViolation,
} from "./color-compliance";

/* ── Types ── */

export interface LintReport {
  totalFiles: number;
  totalViolations: number;
  violations: ComplianceViolation[];
  transparencyViolations: TransparencyViolation[];
  opacityModifierViolations: OpacityModifierViolation[];
  clean: boolean;
  summary: string;
}

export interface TransparencyViolation {
  file: string;
  line: number;
  match: string;
  isCanvasException: boolean;
}

export interface OpacityModifierViolation {
  file: string;
  line: number;
  match: string;
}

/* ── Core Lint Functions ── */

/**
 * Scan a map of filename -> source code for all compliance violations.
 * Returns a complete LintReport.
 */
export function lintColors(
  files: Record<string, string>
): LintReport {
  const allViolations: ComplianceViolation[] = [];
  const transparencyViolations: TransparencyViolation[] = [];
  const opacityModifierViolations: OpacityModifierViolation[] = [];

  const fileEntries = Object.entries(files);

  for (const [filename, source] of fileEntries) {
    // Skip the compliance gate files themselves
    if (filename.includes("color-compliance") || filename.includes("color-lint")) {
      continue;
    }

    // 1. Prohibited colors check
    const violations = scanSource(source, filename);
    allViolations.push(...violations);

    // 2. Transparency check (rgba, hsla, hex-alpha)
    const lines = source.split("\n");
    const isCanvasFile = CANVAS_EXCEPTION_FILES.some((f) =>
      filename.includes(f)
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check rgba() / hsla()
      const rgbaMatches = line.matchAll(/rgba\([^)]+\)|hsla\([^)]+\)/gi);
      for (const match of rgbaMatches) {
        transparencyViolations.push({
          file: filename,
          line: i + 1,
          match: match[0],
          isCanvasException: isCanvasFile,
        });
      }

      // Check hex-alpha (#RRGGBBAA)
      const hexAlphaMatches = line.matchAll(/#[0-9a-fA-F]{8}\b/g);
      for (const match of hexAlphaMatches) {
        transparencyViolations.push({
          file: filename,
          line: i + 1,
          match: match[0],
          isCanvasException: isCanvasFile,
        });
      }

      // 3. Tailwind opacity modifiers (e.g. bg-black/50, text-white/30)
      const twOpacityMatches = line.matchAll(
        /(bg|text|border|ring|shadow|fill|stroke)-[a-zA-Z]+-?[0-9]*\/[0-9]+/g
      );
      for (const match of twOpacityMatches) {
        opacityModifierViolations.push({
          file: filename,
          line: i + 1,
          match: match[0],
        });
      }
    }
  }

  // Filter out Maia exceptions from violations count
  const realViolations = allViolations.filter((v) => !v.isMaiaException);
  const realTransparency = transparencyViolations.filter(
    (v) => !v.isCanvasException
  );

  const totalViolations =
    realViolations.length +
    realTransparency.length +
    opacityModifierViolations.length;

  const clean = totalViolations === 0;

  const summary = clean
    ? `PASS: ${fileEntries.length} files scanned, zero violations. All colors Apple HIG compliant.`
    : `FAIL: ${totalViolations} violation(s) found across ${fileEntries.length} files.\n` +
      `  - ${realViolations.length} prohibited color(s)\n` +
      `  - ${realTransparency.length} transparency violation(s)\n` +
      `  - ${opacityModifierViolations.length} Tailwind opacity modifier(s)`;

  return {
    totalFiles: fileEntries.length,
    totalViolations,
    violations: allViolations,
    transparencyViolations,
    opacityModifierViolations,
    clean,
    summary,
  };
}

/**
 * Format a LintReport into a human-readable string.
 */
export function formatReport(report: LintReport): string {
  const lines: string[] = [
    "═══════════════════════════════════════════",
    "  ESSYN Color Compliance Report",
    "═══════════════════════════════════════════",
    "",
    report.summary,
    "",
  ];

  if (report.violations.length > 0) {
    lines.push("── Prohibited Colors ──");
    for (const v of report.violations) {
      const tag = v.isMaiaException ? " [MAIA EXCEPTION]" : "";
      lines.push(
        `  ${v.file}:${v.line} — ${v.color} -> ${v.replacement} (${v.notes})${tag}`
      );
    }
    lines.push("");
  }

  if (report.transparencyViolations.length > 0) {
    lines.push("── Transparency Violations ──");
    for (const v of report.transparencyViolations) {
      const tag = v.isCanvasException ? " [CANVAS EXCEPTION]" : "";
      lines.push(`  ${v.file}:${v.line} — ${v.match}${tag}`);
    }
    lines.push("");
  }

  if (report.opacityModifierViolations.length > 0) {
    lines.push("── Tailwind Opacity Modifiers ──");
    for (const v of report.opacityModifierViolations) {
      lines.push(`  ${v.file}:${v.line} — ${v.match}`);
    }
    lines.push("");
  }

  lines.push("═══════════════════════════════════════════");
  lines.push(
    `  Total: ${PROHIBITED_COLORS.length} prohibited colors tracked`
  );
  lines.push(`  Palette: ${ALLOWED_COLORS.length} allowed Apple HIG colors`);
  lines.push(
    `  Exceptions: ${MAIA_EXCEPTION_COLORS.length} Maia colors, ${CANVAS_EXCEPTION_FILES.length} canvas file(s)`
  );
  lines.push("═══════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Get the full grep command to run in terminal.
 * Includes all prohibited colors from all 6 batches.
 */
export function getGrepCommand(): string {
  const pattern = buildProhibitedPattern();
  return [
    `grep -rniE '${pattern}' \\`,
    `  --include="*.tsx" --include="*.ts" --include="*.css" \\`,
    `  src/ | grep -v "color-compliance" | grep -v "color-lint"`,
    ``,
    `# Expected: ZERO results.`,
    `# Any match is a prohibited color that must be replaced.`,
  ].join("\n");
}

/**
 * Quick check: is a single hex color compliant?
 * Returns { ok, replacement?, notes? }
 */
export function isCompliant(hex: string): {
  ok: boolean;
  replacement?: string;
  notes?: string;
} {
  const normalized = hex.toUpperCase().replace(/^#/, "");
  const withHash = `#${normalized}`;

  // Check if it's in the allowed palette
  const isAllowed = ALLOWED_COLORS.some(
    (c) => c.toUpperCase() === withHash
  );
  if (isAllowed) return { ok: true };

  // Check if it's a Maia exception
  const isMaia = MAIA_EXCEPTION_COLORS.some(
    (c) => c.toUpperCase() === withHash
  );
  if (isMaia) return { ok: true, notes: "Maia exception — only in Maia files" };

  // Check if it's prohibited
  const prohibited = PROHIBITED_COLORS.find(
    (p) => p.color.toUpperCase() === withHash
  );
  if (prohibited) {
    return {
      ok: false,
      replacement: prohibited.replacement,
      notes: prohibited.notes,
    };
  }

  // Unknown color — not in any list
  return { ok: false, notes: "Unknown color — not in ALLOWED or PROHIBITED lists. Verify manually." };
}
