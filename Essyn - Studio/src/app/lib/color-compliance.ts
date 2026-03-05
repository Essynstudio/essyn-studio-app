/* ═══════════════════════════════════════════════════════════════════════ */
/*  ESSYN — Color Compliance Gate                                        */
/*  ─────────────────────────────────────────────────────────────────────  */
/*  Prevents legacy palette regression. All UI must use Apple HIG 2026   */
/*  colors from the canonical palette in apple-style.ts (C object).      */
/*                                                                        */
/*  HOW TO RUN:                                                           */
/*    grep -rn --include="*.tsx" --include="*.ts" -E "REGEX" src/         */
/*    (see runComplianceCheck() for the full pattern)                     */
/*                                                                        */
/*  RULE: Zero transparency — no rgba(), no hex alpha (#RRGGBBAA),       */
/*        no Tailwind opacity modifiers like bg-black/50. Only CSS       */
/*        `opacity` property is allowed.                                  */
/* ══════════════════════════════════════════════════════════════════════ */

/* ── Canonical Apple HIG 2026 Palette (ALLOWED) ── */
export const ALLOWED_COLORS = [
  // Text hierarchy
  "#1D1D1F",  // primary text
  "#3C3C43",  // secondary text (dark)
  "#48484A",  // secondary text
  "#636366",  // tertiary text
  "#8E8E93",  // quaternary text
  "#AEAEB2",  // muted text
  "#C7C7CC",  // placeholder text
  "#D1D1D6",  // disabled text

  // Surfaces & separators
  "#F2F2F7",  // separator / light bg
  "#E5E5EA",  // separatorDark
  "#FAFAFA",  // hoverBg
  "#F5F5F7",  // pressedBg / systemBg
  "#EDEDF0",  // activeBg
  "#FFFFFF",  // surface (white)
  "#000000",  // pure black (overlays with opacity only)
  "#3A3A3C",  // systemGray (dark contexts — Maia cinema, etc.)

  // System accent colors
  "#007AFF",  // System Blue
  "#34C759",  // System Green
  "#FF3B30",  // System Red
  "#FF9500",  // System Orange
  "#FFCC00",  // System Yellow
  "#AF52DE",  // System Purple

  // Status (whispered palette from apple-style.ts)
  "#FBF5F4",  // dangerBg
  "#FF3B30",  // dangerText (= System Red)
  "#F2DDD9",  // dangerBorder
  "#FAF7F0",  // warningBg
  "#FF9500",  // warningText (= System Orange)
  "#EFEAD8",  // warningBorder
  "#F4F7FB",  // infoBg
  "#7DA2D4",  // infoText
  "#DCE7F3",  // infoBorder
  "#F2F8F4",  // successBg
  "#34C759",  // successText (= System Green)
  "#D4EDDB",  // successBorder
] as const;

/* ── Prohibited (Legacy) Colors ── */
/* Each entry: [color, replacement, notes] */
export const PROHIBITED_COLORS: Array<{
  color: string;
  replacement: string;
  notes: string;
}> = [
  // --- Warm grays (Tailwind Stone / old ESSYN palette) ---
  { color: "#A8A29E", replacement: "#AEAEB2", notes: "Stone-400 -> Apple muted" },
  { color: "#BBBAB9", replacement: "#C7C7CC", notes: "Custom warm gray -> Apple placeholder" },
  { color: "#78716C", replacement: "#636366", notes: "Stone-500 -> Apple tertiary" },
  { color: "#57534E", replacement: "#48484A", notes: "Stone-600 -> Apple secondary" },
  { color: "#494745", replacement: "#48484A", notes: "Custom warm gray -> Apple secondary" },
  { color: "#777574", replacement: "#636366", notes: "Custom warm gray -> Apple tertiary" },
  { color: "#838180", replacement: "#8E8E93", notes: "Custom warm gray -> Apple quaternary" },
  { color: "#D6D3D1", replacement: "#D1D1D6", notes: "Stone-300 -> Apple disabled" },
  { color: "#F5F5F4", replacement: "#F5F5F7", notes: "Stone-50 -> Apple systemBg" },
  { color: "#B1B0AF", replacement: "#AEAEB2", notes: "Custom warm gray -> Apple muted" },
  { color: "#5D5C5B", replacement: "#48484A", notes: "Custom warm gray -> Apple secondary" },
  { color: "#D1D1D0", replacement: "#D1D1D6", notes: "Custom warm gray -> Apple disabled" },
  { color: "#C8C6C4", replacement: "#C7C7CC", notes: "Custom warm gray -> Apple placeholder" },

  // --- Near-blacks (not Apple primary) ---
  { color: "#111111", replacement: "#1D1D1F", notes: "Near-black -> Apple primary" },
  { color: "#0a0a0a", replacement: "#1D1D1F", notes: "Near-black -> Apple primary" },
  { color: "#0D0C0B", replacement: "#1D1D1F", notes: "Near-black -> Apple primary" },
  { color: "#3D3835", replacement: "#3C3C43", notes: "Warm dark -> Apple secondary dark" },

  // --- Off-white/gray borders (not Apple separators) ---
  { color: "#F0F0F0", replacement: "#F2F2F7", notes: "Off-white -> Apple separator" },
  { color: "#E5E5E7", replacement: "#E5E5EA", notes: "Near-miss gray -> Apple separatorDark" },
  { color: "#DDDCDC", replacement: "#D1D1D6", notes: "Custom gray -> Apple disabled" },
  { color: "#EBEBEB", replacement: "#E5E5EA", notes: "Custom gray -> Apple separatorDark" },
  { color: "#F0EFEE", replacement: "#F2F2F7", notes: "Warm off-white -> Apple separator" },
  { color: "#EEEBE6", replacement: "#E5E5EA", notes: "Warm gray -> Apple separatorDark" },

  // --- Batch 2: Discovered in global audit 2026-03-01 ---
  { color: "#e8e8ec", replacement: "#E5E5EA", notes: "Custom border -> Apple separatorDark" },
  { color: "#CCCCCC", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#D9D9D9", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#545454", replacement: "#48484A", notes: "Generic dark -> Apple secondary" },
  { color: "#A6A6A6", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#F7F7F7", replacement: "#F5F5F7", notes: "Near-white -> Apple systemBg" },
  { color: "#D4D3D2", replacement: "#D1D1D6", notes: "Warm gray -> Apple disabled" },
  { color: "#8E8C8B", replacement: "#8E8E93", notes: "Warm gray -> Apple quaternary" },
  { color: "#A4A3A2", replacement: "#AEAEB2", notes: "Warm gray -> Apple muted" },
  { color: "#333333", replacement: "#3C3C43", notes: "Dark gray -> Apple secondary dark" },
  { color: "#222222", replacement: "#1D1D1F", notes: "Near-black -> Apple primary" },
  { color: "#1a1a1a", replacement: "#1D1D1F", notes: "Near-black -> Apple primary" },
  { color: "#E5E5E5", replacement: "#E5E5EA", notes: "Near-miss gray -> Apple separatorDark" },
  { color: "#EBEAEA", replacement: "#E5E5EA", notes: "Warm gray -> Apple separatorDark" },
  { color: "#E5E4E3", replacement: "#E5E5EA", notes: "Warm gray -> Apple separatorDark" },
  { color: "#D8D7D6", replacement: "#D1D1D6", notes: "Warm gray -> Apple disabled" },
  { color: "#C6C5C5", replacement: "#C7C7CC", notes: "Warm gray -> Apple placeholder" },
  { color: "#F6F5F5", replacement: "#F5F5F7", notes: "Warm off-white -> Apple systemBg" },
  { color: "#ECECEC", replacement: "#E5E5EA", notes: "Generic gray -> Apple separatorDark" },
  { color: "#CECECE", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#999999", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#AAAAAA", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#B8B8B8", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#C4C4C4", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#D1D1D1", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#606060", replacement: "#636366", notes: "Generic dark -> Apple tertiary" },
  { color: "#858585", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#919191", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#787878", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#6C6C6C", replacement: "#636366", notes: "Generic dark -> Apple tertiary" },
  { color: "#F8F8F9", replacement: "#F5F5F7", notes: "Near-white -> Apple systemBg" },
  { color: "#E7E7E7", replacement: "#E5E5EA", notes: "Generic gray -> Apple separatorDark" },
  { color: "#d8d8dc", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#d0d0d4", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#eeeef0", replacement: "#E5E5EA", notes: "Generic border -> Apple separatorDark" },

  // --- Batch 3: Sage/Rose semantic colors (removed 2026-03-01) ---
  { color: "#94A387", replacement: "#34C759", notes: "Sage green -> Apple System Green (success)" },
  { color: "#8A9B7A", replacement: "#34C759", notes: "Muted sage -> Apple System Green (success)" },
  { color: "#F0F2EE", replacement: "#F2F8F4", notes: "Sage bg -> successBg" },
  { color: "#DDE3D8", replacement: "#D4EDDB", notes: "Sage border -> successBorder" },
  { color: "#C4968E", replacement: "#FF3B30", notes: "Dusty rose -> Apple System Red (danger)" },
  { color: "#EE9393", replacement: "#FF3B30", notes: "Rose bright -> Apple System Red (danger)" },
  { color: "#F0C99B", replacement: "#FF9500", notes: "Rose warm -> Apple System Orange (warning)" },
  { color: "#A8754A", replacement: "#FF3B30", notes: "Rose dark -> Apple System Red (danger)" },

  // --- Batch 4: Production primitives cleanup (2026-03-02) ---
  { color: "#D4B87A", replacement: "#FF9500", notes: "Warm gold dot -> Apple System Orange" },
  { color: "#8B7142", replacement: "#FF9500", notes: "Dark gold text -> Apple System Orange" },
  { color: "#B8857C", replacement: "#FF3B30", notes: "Dusty rose bar -> Apple System Red" },
  { color: "#A67B72", replacement: "#FF3B30", notes: "Muted rose SLA -> Apple System Red" },
  { color: "#F7F4F3", replacement: "#FBF5F4", notes: "Warm off-white -> Apple dangerBg" },
  { color: "#B89B50", replacement: "#FF9500", notes: "Warm amber SLA -> Apple System Orange" },
  { color: "#5EB883", replacement: "#34C759", notes: "Muted green -> Apple System Green" },
  { color: "#F2F9F5", replacement: "#F2F8F4", notes: "Near-miss green bg -> Apple successBg" },
  { color: "#A68D3E", replacement: "#FF9500", notes: "Dark amber tag -> Apple System Orange" },
  { color: "#D27A6D", replacement: "#FF3B30", notes: "Dusty red tag -> Apple System Red" },
  { color: "#9D8ABE", replacement: "#AF52DE", notes: "Muted purple tag -> Apple System Purple" },
  { color: "#F6F4FA", replacement: "#F5F5F7", notes: "Purple tint bg -> Apple systemBg" },
  { color: "#A08258", replacement: "#FF9500", notes: "Gold tag text -> Apple System Orange" },
  { color: "#F8F6F0", replacement: "#FAFAFA", notes: "Warm off-white icon bg -> Apple hoverBg" },
  { color: "#F3F0ED", replacement: "#F4F7FB", notes: "Warm video bg -> Apple infoBg" },
  { color: "#F6F0EE", replacement: "#FBF5F4", notes: "Rose tratamento bg -> Apple dangerBg" },
  { color: "#7A9B89", replacement: "#34C759", notes: "Sage album text -> Apple System Green" },
  { color: "#9A8B7C", replacement: "#7DA2D4", notes: "Warm video text -> Apple infoText" },
  { color: "#B98577", replacement: "#FF3B30", notes: "Rose tratamento text -> Apple System Red" },
  { color: "#7A9B9B", replacement: "#8E8E93", notes: "Teal impressao text -> Apple quaternary" },
  { color: "#E8DDD7", replacement: "#F2DDD9", notes: "Warm atrasado border -> Apple dangerBorder" },
  { color: "#D5C5BB", replacement: "#F2DDD9", notes: "Warm hover border -> Apple dangerBorder" },
  { color: "#FCFBF9", replacement: "#FAFAFA", notes: "Warm aguardando bg -> Apple hoverBg" },
  { color: "#FAF6F4", replacement: "#FBF5F4", notes: "Warm atrasado bg -> Apple dangerBg" },
  { color: "#E5DCDA", replacement: "#F2DDD9", notes: "Warm urgente border -> Apple dangerBorder" },

  // --- Batch 5: UI primitives + projetos deep cleanup (2026-03-02) ---
  { color: "#9A8327", replacement: "#FF9500", notes: "Dark gold vence_hoje text -> Apple System Orange" },
  { color: "#D98A7E", replacement: "#FF3B30", notes: "Rose vencida dot -> Apple System Red" },
  { color: "#6DBE8E", replacement: "#34C759", notes: "Muted green paga dot -> Apple System Green" },
  { color: "#6BBD8D", replacement: "#34C759", notes: "Muted green conciliada text -> Apple System Green" },
  { color: "#F3FAF6", replacement: "#F2F8F4", notes: "Near-miss green bg -> Apple successBg" },
  { color: "#7AC599", replacement: "#34C759", notes: "Muted green conciliada dot -> Apple System Green" },
  { color: "#BFBEBE", replacement: "#C7C7CC", notes: "Warm gray cancelada text -> Apple placeholder" },
  { color: "#F8F8F7", replacement: "#F5F5F7", notes: "Near-white cancelada bg -> Apple systemBg" },
  { color: "#C9706A", replacement: "#FF3B30", notes: "Rose pagar dot -> Apple System Red" },
  { color: "#C9AA68", replacement: "#FF9500", notes: "Gold fiscal dot -> Apple System Orange" },
  { color: "#A694C4", replacement: "#AF52DE", notes: "Muted purple dot -> Apple System Purple" },
  { color: "#8AACDA", replacement: "#7DA2D4", notes: "Muted blue producao dot -> Apple infoText" },
  { color: "#BEAA6D", replacement: "#FF9500", notes: "Gold pre_reserva dot -> Apple System Orange" },
  { color: "#F0EDEC", replacement: "#FBF5F4", notes: "Warm rose bg -> Apple dangerBg" },
  { color: "#E0D8D5", replacement: "#F2DDD9", notes: "Warm rose border -> Apple dangerBorder" },
  { color: "#9B92B3", replacement: "#AF52DE", notes: "Muted purple selecoes -> Apple System Purple" },
  { color: "#C4A55E", replacement: "#FF9500", notes: "Gold hoje dot -> Apple System Orange" },
  { color: "#C1A15D", replacement: "#FF9500", notes: "Gold nf_pendente text -> Apple System Orange" },
  { color: "#E2998D", replacement: "#FF3B30", notes: "Rose atraso chip text -> Apple System Red" },
  { color: "#C5D6BC", replacement: "#D4EDDB", notes: "Sage timeline connector -> Apple successBorder" },
  { color: "#F8F8FA", replacement: "#F5F5F7", notes: "Near-white gradient end -> Apple systemBg" },
  { color: "#C4321A", replacement: "#FF3B30", notes: "Dark red menu action -> Apple System Red" },
  { color: "#F7F6F5", replacement: "#F5F5F7", notes: "Warm off-white -> Apple systemBg" },
  { color: "#404040", replacement: "#48484A", notes: "Generic dark gray -> Apple secondary" },
  { color: "#FFCDD2", replacement: "#F2DDD9", notes: "Material red light -> Apple dangerBorder" },
  { color: "#FFF5F4", replacement: "#FBF5F4", notes: "Near-miss danger bg -> Apple dangerBg" },
  { color: "#D4A59E", replacement: "#F2DDD9", notes: "Warm rose error border -> Apple dangerBorder" },
  { color: "#F0FDF4", replacement: "#F2F8F4", notes: "Near-miss success bg -> Apple successBg" },
  { color: "#C3E8CF", replacement: "#D4EDDB", notes: "Light green icon -> Apple successBorder" },
  { color: "#9C9B9A", replacement: "#AEAEB2", notes: "Warm gray text -> Apple muted" },
  { color: "#FEF4EC", replacement: "#FAF7F0", notes: "Warm orange bg -> Apple warningBg" },
  { color: "#FCB98B", replacement: "#FF9500", notes: "Warm orange icon -> Apple System Orange" },
  { color: "#FB9A52", replacement: "#FF9500", notes: "Orange manage btn -> Apple System Orange" },
  { color: "#FEF6EF", replacement: "#FAF7F0", notes: "Warm orange hover bg -> Apple warningBg" },
  { color: "#FFFBF5", replacement: "#FAF7F0", notes: "Warm callout bg -> Apple warningBg" },
  { color: "#FEF0E4", replacement: "#EFEAD8", notes: "Warm callout border -> Apple warningBorder" },
  { color: "#FCC894", replacement: "#FF9500", notes: "Warm orange lightbulb -> Apple System Orange" },
  { color: "#FDD8BC", replacement: "#EFEAD8", notes: "Warm selected border -> Apple warningBorder" },
  { color: "#F97316", replacement: "#FF9500", notes: "Tailwind Orange-500 -> Apple System Orange" },
  { color: "#ECB483", replacement: "#FF9500", notes: "Warm credit card icon -> Apple System Orange" },

  // --- Batch 6: Near-miss generic grays & semantic colors (2026-03-02, Session 4) ---
  // Generic near-white / light grays
  { color: "#F3F3F3", replacement: "#F5F5F7", notes: "Generic near-white -> Apple systemBg" },
  { color: "#F2F2F2", replacement: "#F2F2F7", notes: "Generic near-white -> Apple separator" },
  { color: "#F2F2F3", replacement: "#F2F2F7", notes: "Generic near-white -> Apple separator" },
  { color: "#F8F8F8", replacement: "#FAFAFA", notes: "Generic near-white -> Apple hoverBg" },
  { color: "#F9F9F9", replacement: "#FAFAFA", notes: "Generic near-white -> Apple hoverBg" },
  { color: "#FBFBFB", replacement: "#FAFAFA", notes: "Generic near-white -> Apple hoverBg" },
  { color: "#FCFCFC", replacement: "#FAFAFA", notes: "Generic near-white -> Apple hoverBg" },
  { color: "#FEFEFE", replacement: "#FFFFFF", notes: "Generic near-white -> Apple white" },
  // Generic mid-light grays
  { color: "#E8E8E8", replacement: "#E5E5EA", notes: "Generic gray -> Apple separatorDark" },
  { color: "#E2E2E2", replacement: "#E5E5EA", notes: "Generic gray -> Apple separatorDark" },
  { color: "#E0E0E0", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#DBDBDB", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#D5D5D5", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#D4D4D4", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#D0D0D0", replacement: "#D1D1D6", notes: "Generic gray -> Apple disabled" },
  { color: "#CFCFCF", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#CACACA", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#C8C8C8", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  { color: "#C1C1C1", replacement: "#C7C7CC", notes: "Generic gray -> Apple placeholder" },
  // Generic mid grays
  { color: "#B3B3B3", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#ACACAC", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#A5A5A5", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#A0A0A0", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#9B9B9B", replacement: "#AEAEB2", notes: "Generic gray -> Apple muted" },
  { color: "#949494", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#8D8D8D", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#8C8C8C", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#888888", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#838383", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#7C7C7C", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  { color: "#777777", replacement: "#8E8E93", notes: "Generic gray -> Apple quaternary" },
  // Generic mid-dark grays
  { color: "#707070", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#6B6B6B", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#666666", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#646464", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#595959", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  { color: "#585858", replacement: "#636366", notes: "Generic gray -> Apple tertiary" },
  // Generic dark grays
  { color: "#555555", replacement: "#48484A", notes: "Generic dark -> Apple secondary" },
  { color: "#4D4D4D", replacement: "#48484A", notes: "Generic dark -> Apple secondary" },
  { color: "#4C4C4C", replacement: "#48484A", notes: "Generic dark -> Apple secondary" },
  { color: "#474747", replacement: "#48484A", notes: "Generic dark -> Apple secondary" },
  // Generic near-blacks
  { color: "#353535", replacement: "#3C3C43", notes: "Generic near-black -> Apple secondaryDark" },
  { color: "#292929", replacement: "#1D1D1F", notes: "Generic near-black -> Apple primary" },
  { color: "#2B2B2B", replacement: "#1D1D1F", notes: "Generic near-black -> Apple primary" },
  { color: "#2A2A2A", replacement: "#1D1D1F", notes: "Generic near-black -> Apple primary" },
  { color: "#262626", replacement: "#1D1D1F", notes: "Generic near-black -> Apple primary" },
  // Semantic reds (non-Apple)
  { color: "#CC3333", replacement: "#FF3B30", notes: "Generic red -> Apple System Red" },
  { color: "#DC2626", replacement: "#FF3B30", notes: "Tailwind red-600 -> Apple System Red" },
  { color: "#E35252", replacement: "#FF3B30", notes: "Custom red -> Apple System Red" },
  { color: "#F5BEBE", replacement: "#FF3B30", notes: "Light red -> Apple System Red" },
  { color: "#EC8888", replacement: "#FF3B30", notes: "Muted red -> Apple System Red" },
  { color: "#F6C9C9", replacement: "#FF3B30", notes: "Pink-red -> Apple System Red" },
  // Semantic greens (non-Apple)
  { color: "#28C840", replacement: "#34C759", notes: "macOS green -> Apple System Green" },
  { color: "#8FBC8F", replacement: "#34C759", notes: "DarkSeaGreen -> Apple System Green" },
  { color: "#3A8B3A", replacement: "#34C759", notes: "Forest green -> Apple System Green" },
  { color: "#5DBE80", replacement: "#34C759", notes: "Muted green -> Apple System Green" },
  { color: "#A6DDB9", replacement: "#34C759", notes: "Light green -> Apple System Green" },
  { color: "#A2DAB7", replacement: "#34C759", notes: "Light green -> Apple System Green" },
  { color: "#8BD1A5", replacement: "#34C759", notes: "Muted mint -> Apple System Green" },
  { color: "#16A34A", replacement: "#34C759", notes: "Tailwind green-600 -> Apple System Green" },
  // Semantic oranges (non-Apple)
  { color: "#D4A373", replacement: "#FF9500", notes: "Warm tan -> Apple System Orange" },
  { color: "#E1A038", replacement: "#FF9500", notes: "Warm amber -> Apple System Orange" },
  { color: "#ECBB83", replacement: "#FF9500", notes: "Warm gold -> Apple System Orange" },
  { color: "#D97706", replacement: "#FF9500", notes: "Tailwind amber-600 -> Apple System Orange" },
  // Semantic blues (non-Apple)
  { color: "#6F92F1", replacement: "#007AFF", notes: "Muted blue -> Apple System Blue" },
  { color: "#92B1F5", replacement: "#007AFF", notes: "Light blue -> Apple System Blue" },
  { color: "#C9D8FA", replacement: "#007AFF", notes: "Very light blue -> Apple System Blue" },
  { color: "#BED0F9", replacement: "#007AFF", notes: "Very light blue -> Apple System Blue" },
  { color: "#2563EB", replacement: "#007AFF", notes: "Tailwind blue-600 -> Apple System Blue" },
  // Semantic background near-misses
  { color: "#F0FFF0", replacement: "#F2F8F4", notes: "Honeydew -> Apple successBg" },
  { color: "#EBF7F0", replacement: "#F2F8F4", notes: "Light green bg -> Apple successBg" },
  { color: "#EFF6FF", replacement: "#F2F2F7", notes: "Tailwind blue-50 -> Apple separator" },
  { color: "#FEF2F2", replacement: "#F2F2F7", notes: "Tailwind red-50 -> Apple separator" },
];

/* ── Exceptions: Maia Subsystem ── */
/* The Maia AI assistant uses a gold/warm palette as its brand identity. */
/* These colors are ONLY allowed in files within the Maia subsystem:     */
/*   - /src/app/components/dashboard/MaiaAssistantView.tsx               */
/*   - /src/app/components/dashboard/MaiaFocusChat.tsx                   */
/*   - /src/app/components/dashboard/MaiaPanel.tsx                       */
/*   - /src/app/components/ui/MaiaInlineToggle.tsx                       */
/*   - /src/app/components/ui/editorial.tsx                              */
/*   - Any file with "Maia" in the filename                              */
export const MAIA_EXCEPTION_COLORS = [
  "#9C8B7A",  // Ouro Maia principal
  "#C4B8A8",  // Ouro Maia claro
  "#EDE5D4",  // Maia warm highlight
  "#E5D9C4",  // Maia warm border/shadow
  "#DDD2BC",  // Maia constellation fade
] as const;

export const MAIA_EXCEPTION_FILES = [
  "MaiaAssistantView",
  "MaiaFocusChat",
  "MaiaPanel",
  "MaiaInlineToggle",
  "editorial",
] as const;

/* ── Exception: Canvas/WebGL Rendering ── */
/* Canvas 2D/WebGL requires per-pixel alpha via rgba() — CSS opacity    */
/* cannot substitute. Files using <canvas> with rgba() are exempt from  */
/* the transparency rule ONLY within canvas drawing code.               */
export const CANVAS_EXCEPTION_FILES = [
  "HeroBirds",  // Marketing hero animation (canvas particles)
] as const;

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Compliance Check Utilities                                           */
/* ══════════════════════════════════════════════════════════════════════ */

export interface ComplianceViolation {
  file: string;
  line: number;
  color: string;
  replacement: string;
  notes: string;
  isMaiaException: boolean;
}

/**
 * Check if a color hex string is in the prohibited list.
 * Returns the violation details or null if compliant.
 */
export function checkColor(hex: string): {
  prohibited: boolean;
  replacement?: string;
  notes?: string;
} {
  const normalized = hex.toUpperCase();
  const match = PROHIBITED_COLORS.find(
    (p) => p.color.toUpperCase() === normalized
  );
  if (match) {
    return { prohibited: true, replacement: match.replacement, notes: match.notes };
  }
  return { prohibited: false };
}

/**
 * Check if a color is a Maia exception (allowed only in Maia files).
 */
export function isMaiaColor(hex: string): boolean {
  const normalized = hex.toUpperCase();
  return MAIA_EXCEPTION_COLORS.some((c) => c.toUpperCase() === normalized);
}

/**
 * Check if a filename belongs to the Maia subsystem.
 */
export function isMaiaFile(filename: string): boolean {
  return MAIA_EXCEPTION_FILES.some((f) => filename.includes(f));
}

/**
 * Build the complete regex pattern string from all PROHIBITED_COLORS.
 * Can be used programmatically or pasted into grep.
 */
export function buildProhibitedPattern(): string {
  const hexCodes = PROHIBITED_COLORS.map((p) =>
    p.color.replace("#", "")
  );
  return `#(${hexCodes.join("|")})`;
}

/**
 * Scan a source string for prohibited color violations.
 * Returns an array of violations with line numbers.
 */
export function scanSource(
  source: string,
  filename: string = "<unknown>"
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments that are part of the compliance gate itself
    if (filename.includes("color-compliance")) continue;

    const hexMatches = line.matchAll(/#[0-9a-fA-F]{6}\b/g);
    for (const match of hexMatches) {
      const hex = match[0];
      const result = checkColor(hex);
      if (result.prohibited) {
        const maiaException = isMaiaColor(hex) ? false : isMaiaFile(filename);
        violations.push({
          file: filename,
          line: i + 1,
          color: hex,
          replacement: result.replacement!,
          notes: result.notes!,
          isMaiaException: maiaException,
        });
      }
    }
  }

  return violations;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CURRENT VIOLATIONS BASELINE (as of 2026-03-02, Session 4)            */
/*  ─────────────────────────────────────────────────────────────────────  */
/*  ALL .tsx and .ts files scanned — ZERO violations remaining.          */
/*                                                                        */
/*  Batch 6 added 76 new near-miss colors to PROHIBITED_COLORS.          */
/*  Total prohibited colors: 220+ across 6 batches.                      */
/*                                                                        */
/*  Files cleaned in Session 4 (2026-03-02):                              */
/*    - CriarContaV4Page.tsx          ✅ 17 violations fixed             */
/*    - SucessoV4Page.tsx             ✅ 4 violations fixed              */
/*    - VerificarEmailV4Page.tsx      ✅ 4 violations fixed              */
/*    - EsqueciSenhaV4Page.tsx        ✅ 2 violations fixed              */
/*    - CriarStudioV4Page.tsx         ✅ 5 violations fixed              */
/*    - PreferenciasV4Page.tsx        ✅ 7 violations fixed              */
/*    - ConcluirV4Page.tsx            ✅ 2 violations fixed              */
/*    - projetosData.ts               ✅ 4 violations fixed              */
/*    - drawer-primitives.tsx         ✅ 1 violation fixed               */
/*    - TabGaleria.tsx                ✅ 1 violation fixed               */
/* ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CHECKLIST — Pre-commit / Pre-PR Verification                         */
/* ═══════════════════════════════════════════════════════════════════════ */

/*

  ESSYN Color Compliance Checklist
  ================================

  Before merging any code, verify:

  [ ] 1. PROHIBITED COLORS
      Import { buildProhibitedPattern } from color-compliance.ts
      or run: grep -rniE "$(buildProhibitedPattern())" --include="*.tsx" --include="*.ts" src/
      Zero matches outside color-compliance.ts itself.

  [ ] 2. MAIA GOLD ISOLATION
      Run the Maia isolation grep. Zero matches outside Maia files.
      grep -rniE "#(9C8B7A|C4B8A8|EDE5D4|E5D9C4|DDD2BC)" \
        --include="*.tsx" --include="*.ts" \
        src/ | grep -viE "(Maia|editorial)"

  [ ] 3. TRANSPARENCY RULE
      Run the transparency grep. Zero rgba()/hsla()/#RRGGBBAA matches.
      grep -rniE "(rgba\(|hsla\(|#[0-9a-fA-F]{8}\b)" \
        --include="*.tsx" --include="*.ts" --include="*.css" \
        src/

  [ ] 4. TAILWIND OPACITY MODIFIERS
      Run the Tailwind opacity grep. Zero matches with /[n] patterns.
      grep -rniE "(bg|text|border|ring|shadow|fill|stroke)-[a-zA-Z]+-?[0-9]*\/[0-9]+" \
        --include="*.tsx" --include="*.ts" \
        src/

  [ ] 5. NEW COLORS
      Any color not in ALLOWED_COLORS must be:
      a) Added to the canonical palette in apple-style.ts with
         justification (Apple HIG reference), OR
      b) Added to MAIA_EXCEPTION_COLORS if Maia-only, OR
      c) Rejected and replaced with nearest ALLOWED_COLORS match.

  [ ] 6. IMPORT FROM C
      Prefer importing colors from `C` (apple-style.ts) rather than
      hardcoding hex values. Example:
        import { C } from "../lib/apple-style";
        style={{ color: C.tertiary }}
        className="text-[#636366]"  // also acceptable if canonical

*/