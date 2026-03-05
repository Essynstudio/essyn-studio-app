#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════ */
/*  ESSYN — Color Compliance CLI Runner                                  */
/*  ─────────────────────────────────────────────────────────────────────  */
/*  Scans all .tsx/.ts files under src/ for prohibited legacy colors,     */
/*  transparency violations, and Tailwind opacity modifiers.              */
/*                                                                        */
/*  Usage:                                                                */
/*    npx tsx scripts/lint-colors.ts                                      */
/*    pnpm lint:colors                                                    */
/*                                                                        */
/*  Exit codes:                                                           */
/*    0 = all clean                                                       */
/*    1 = violations found                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

import * as fs from "node:fs";
import * as path from "node:path";
import { lintColors, formatReport } from "../src/app/lib/color-lint";

/* ── Config ── */
const SRC_DIR = path.resolve(import.meta.dirname ?? __dirname, "..", "src");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", ".next"]);

/* ── Collect all source files ── */
function collectFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        results.push(...collectFiles(fullPath));
      }
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

/* ── Main ── */
function main() {
  const startTime = performance.now();

  console.log("");
  console.log("  ESSYN Color Compliance Lint");
  console.log("  ──────────────────────────");
  console.log(`  Scanning: ${SRC_DIR}`);
  console.log("");

  // Collect files
  const filePaths = collectFiles(SRC_DIR);
  console.log(`  Found ${filePaths.length} source files`);
  console.log("");

  // Read all files into a map
  const filesMap: Record<string, string> = {};
  for (const filePath of filePaths) {
    const relativePath = path.relative(path.resolve(SRC_DIR, ".."), filePath);
    filesMap[relativePath] = fs.readFileSync(filePath, "utf-8");
  }

  // Run lint
  const report = lintColors(filesMap);

  // Output report
  console.log(formatReport(report));
  console.log("");

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`  Completed in ${elapsed}s`);
  console.log("");

  // Exit code
  if (!report.clean) {
    console.log("  ❌ Color compliance check FAILED.");
    console.log("  Fix all violations before committing.");
    console.log("");
    process.exit(1);
  } else {
    console.log("  ✅ Color compliance check PASSED.");
    console.log("");
    process.exit(0);
  }
}

main();
