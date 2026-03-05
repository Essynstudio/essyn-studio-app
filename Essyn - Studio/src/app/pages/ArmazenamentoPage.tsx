/**
 * ArmazenamentoPage — Storage Management
 *
 * Shows storage usage by project, galleries, backups.
 * Progress bar, breakdown, cleanup actions.
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState } from "react";
import { motion } from "motion/react";
import {
  HardDrive, Image, FolderOpen, Archive,
  Trash2, Download, AlertTriangle, CheckCircle2,
  ChevronRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { springDefault } from "../lib/motion-tokens";
import { WidgetCard, HeaderWidget } from "../components/ui/apple-kit";
import { useShellConfig } from "../components/ui/ShellContext";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";

/* ═══════════════════════════════════════════════════ */
/*  DATA                                               */
/* ═══════════════════════════════════════════════════ */

interface StorageItem {
  id: string;
  name: string;
  type: "galeria" | "projeto" | "backup" | "temp";
  size: number; // MB
  files: number;
  lastModified: string;
}

const PLAN_LIMIT_GB = 50;
const USED_GB = 32.4;

const STORAGE_ITEMS: StorageItem[] = [
  { id: "s1", name: "Casamento Ana & Diego", type: "galeria", size: 8200, files: 1240, lastModified: "há 2 dias" },
  { id: "s2", name: "Ensaio Gestante Luísa", type: "galeria", size: 3400, files: 180, lastModified: "há 1 semana" },
  { id: "s3", name: "Corp TechBrasil", type: "projeto", size: 5600, files: 450, lastModified: "há 3 dias" },
  { id: "s4", name: "Ensaio Família Santos", type: "galeria", size: 4100, files: 320, lastModified: "há 2 semanas" },
  { id: "s5", name: "Backup — Jan 2026", type: "backup", size: 6200, files: 2800, lastModified: "01 Fev 2026" },
  { id: "s6", name: "Backup — Fev 2026", type: "backup", size: 3800, files: 1600, lastModified: "01 Mar 2026" },
  { id: "s7", name: "Cache de thumbnails", type: "temp", size: 1100, files: 8400, lastModified: "hoje" },
];

function fmtSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb} MB`;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  galeria: { icon: <Image className="w-3.5 h-3.5" />, color: "#007AFF", bg: "#E8F0FE", label: "Galeria" },
  projeto: { icon: <FolderOpen className="w-3.5 h-3.5" />, color: "#FF9500", bg: "#FFF0DC", label: "Projeto" },
  backup: { icon: <Archive className="w-3.5 h-3.5" />, color: "#5856D6", bg: "#F0F0FF", label: "Backup" },
  temp: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: "#8E8E93", bg: "#F2F2F7", label: "Temporário" },
};

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function ArmazenamentoPage() {
  const [items, setItems] = useState(STORAGE_ITEMS);

  useShellConfig({
    breadcrumb: { section: "Sistema", page: "Armazenamento" },
  });

  const totalMB = items.reduce((s, i) => s + i.size, 0);
  const usedPct = Math.round((USED_GB / PLAN_LIMIT_GB) * 100);
  const galeriasMB = items.filter((i) => i.type === "galeria").reduce((s, i) => s + i.size, 0);
  const backupsMB = items.filter((i) => i.type === "backup").reduce((s, i) => s + i.size, 0);
  const tempMB = items.filter((i) => i.type === "temp").reduce((s, i) => s + i.size, 0);

  const handleCleanup = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Espaço liberado!", { description: `${item?.name} — ${fmtSize(item?.size || 0)}` });
  };

  const handleCleanTemp = () => {
    const tempItems = items.filter((i) => i.type === "temp");
    const freed = tempItems.reduce((s, i) => s + i.size, 0);
    setItems((prev) => prev.filter((i) => i.type !== "temp"));
    toast.success("Cache limpo!", { description: `${fmtSize(freed)} liberados` });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      <OnboardingBanner
        id="armazenamento-intro"
        title="Gestão de Armazenamento"
        message="Monitore o uso de espaço por projeto, galeria e backups. Libere espaço removendo ficheiros temporários."
      />

      <HeaderWidget
        greeting="Armazenamento"
        userName=""
        contextLine={`${USED_GB} GB de ${PLAN_LIMIT_GB} GB usados · Plano Studio Pro`}
        delay={0}
      />

      {/* Usage overview */}
      <WidgetCard delay={0.02}>
        <div className="px-5 py-5">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
              {USED_GB} GB / {PLAN_LIMIT_GB} GB
            </span>
            <span className={`text-[12px] tabular-nums ${usedPct > 80 ? "text-[#FF9500]" : "text-[#34C759]"}`} style={{ fontWeight: 600 }}>
              {usedPct}%
            </span>
          </div>
          <div className="h-3 bg-[#F2F2F7] rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full rounded-full ${usedPct > 80 ? "bg-[#FF9500]" : "bg-[#007AFF]"}`}
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ ...springDefault, delay: 0.2 }}
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Galerias", size: galeriasMB, color: "#007AFF", bg: "#E8F0FE" },
              { label: "Projetos", size: items.filter((i) => i.type === "projeto").reduce((s, i) => s + i.size, 0), color: "#FF9500", bg: "#FFF0DC" },
              { label: "Backups", size: backupsMB, color: "#5856D6", bg: "#F0F0FF" },
              { label: "Temporários", size: tempMB, color: "#8E8E93", bg: "#F2F2F7" },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAFAFA]">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>{fmtSize(cat.size)}</span>
                  <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{cat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </WidgetCard>

      {/* Quick actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={handleCleanTemp}
          disabled={tempMB === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[12px] transition-colors cursor-pointer ${
            tempMB > 0 ? "text-[#FF9500] hover:bg-[#FFF0DC]" : "text-[#D1D1D6] cursor-not-allowed"
          }`}
          style={{ fontWeight: 500 }}
        >
          <Trash2 className="w-3 h-3" />
          Limpar Cache ({fmtSize(tempMB)})
        </button>
      </div>

      {/* Storage items */}
      <WidgetCard title="Itens" count={items.length} delay={0.04}>
        <div className="flex flex-col">
          {items.map((item, idx) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springDefault, delay: idx * 0.02 }}
              >
                {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>{item.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] shrink-0" style={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                      {item.files.toLocaleString()} arquivos · {item.lastModified}
                    </span>
                  </div>
                  <span className="text-[14px] text-[#1D1D1F] tabular-nums shrink-0" style={{ fontWeight: 600 }}>
                    {fmtSize(item.size)}
                  </span>
                  <button
                    onClick={() => handleCleanup(item.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FDEDEF] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </WidgetCard>
    </div>
  );
}