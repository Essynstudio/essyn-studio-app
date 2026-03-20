"use client";

import { motion } from "motion/react";
import {
  HardDrive,
  Image,
  FileText,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/apple-kit";
import { springDefault } from "@/lib/motion-tokens";
import { toast } from "sonner";

interface BucketBreakdown {
  bucket: string;
  bytes: number;
  count: number;
}

interface Props {
  usedBytes: number;
  planStorageGb: number;
  plan: string;
  breakdown: BucketBreakdown[];
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

const BUCKET_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  "gallery-photos": { label: "Galerias",  color: "var(--info)",    bg: "var(--info-subtle)",    icon: Image },
  "contracts":      { label: "Contratos", color: "var(--warning)", bg: "var(--warning-subtle)", icon: FileText },
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const gb = bytes / (1024 ** 3);
  const mb = bytes / (1024 ** 2);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function ArmazenamentoClient({ usedBytes, planStorageGb, plan, breakdown }: Props) {
  const usedGb = usedBytes / (1024 ** 3);
  const usagePercent = planStorageGb > 0 ? Math.min((usedGb / planStorageGb) * 100, 100) : 0;
  const percentColor = usagePercent > 80 ? "var(--error)" : usagePercent > 60 ? "var(--warning)" : "var(--info)";

  return (
    <PageTransition>
      <HeaderWidget
        title="Armazenamento"
        subtitle={`${formatBytes(usedBytes)} de ${planStorageGb} GB usados · Plano ${PLAN_LABELS[plan] ?? plan}`}
      />

      {/* Usage bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.05 }}
      >
        <WidgetCard hover={false}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[var(--fg)]">
              {formatBytes(usedBytes)} / {planStorageGb} GB
            </p>
            <p className="text-[13px] font-semibold" style={{ color: percentColor }}>
              {usagePercent.toFixed(1)}%
            </p>
          </div>

          {/* Segmented progress bar */}
          <div className="w-full h-3 rounded-full bg-[var(--bg-subtle)] overflow-hidden flex">
            {breakdown.length > 0 ? (
              breakdown.map((b) => {
                const pct = planStorageGb > 0 ? (b.bytes / (planStorageGb * 1024 ** 3)) * 100 : 0;
                if (pct < 0.1) return null;
                const cfg = BUCKET_CONFIG[b.bucket];
                return (
                  <div
                    key={b.bucket}
                    className="h-full"
                    style={{ width: `${pct}%`, backgroundColor: cfg?.color ?? "var(--info)" }}
                  />
                );
              })
            ) : (
              <div className="h-full rounded-full bg-[var(--border)]" style={{ width: "100%" }} />
            )}
          </div>

          {/* Breakdown legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {breakdown.length > 0 ? (
              breakdown.map((b) => {
                const cfg = BUCKET_CONFIG[b.bucket];
                return (
                  <div key={b.bucket} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg?.color ?? "var(--info)" }} />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--fg)]">{formatBytes(b.bytes)}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{cfg?.label ?? b.bucket}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 text-[11px] text-[var(--fg-muted)]">Nenhum arquivo enviado ainda.</div>
            )}
          </div>
        </WidgetCard>
      </motion.div>

      {/* Files list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.12 }}
      >
        <SectionHeader
          title="Por categoria"
          action={<span className="text-[12px] text-[var(--fg-muted)]">{breakdown.length} buckets</span>}
        />

        {breakdown.length === 0 ? (
          <WidgetCard hover={false}>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive size={24} className="text-[var(--fg-muted)] mb-3" />
              <p className="text-[13px] font-medium text-[var(--fg-secondary)]">Nenhum arquivo ainda</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Quando você fizer upload de fotos nas galerias, elas aparecerão aqui.
              </p>
            </div>
          </WidgetCard>
        ) : (
          <WidgetCard hover={false} className="overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {breakdown.map((b, idx) => {
                const cfg = BUCKET_CONFIG[b.bucket];
                const Icon = cfg?.icon ?? HardDrive;
                return (
                  <motion.div
                    key={b.bucket}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springDefault, delay: 0.18 + idx * 0.04 }}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <Icon size={16} className="text-[var(--fg-secondary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-[var(--fg)]">{cfg?.label ?? b.bucket}</p>
                        <StatusBadge
                          label={`${b.count} arquivo${b.count !== 1 ? "s" : ""}`}
                          color={cfg?.color ?? "var(--info)"}
                          bg={cfg?.bg ?? "var(--info-subtle)"}
                        />
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--fg)] shrink-0">
                      {formatBytes(b.bytes)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </WidgetCard>
        )}
      </motion.div>

      {/* Coming soon features */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.2 }}
      >
        <SectionHeader title="Ferramentas de limpeza" />
        <WidgetCard hover={false} className="flex items-start gap-3 !bg-[var(--info-subtle)] border-[var(--info)]/20 mb-3">
          <Sparkles size={18} className="text-[var(--info)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">
            Análise de duplicados, limpeza de galerias expiradas e gerenciamento avançado chegam em breve.
          </p>
        </WidgetCard>
        <div className="space-y-3">
          {[
            { icon: Trash2,         title: "Galerias expiradas",  description: "Remova galerias de projetos concluídos há mais de 1 ano." },
            { icon: AlertTriangle,  title: "Arquivos duplicados",  description: "Identifique e remova arquivos duplicados no armazenamento." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <WidgetCard key={i} className="flex items-center gap-4 opacity-55" hover={false}>
                <Icon size={20} className="text-[var(--fg-secondary)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-medium text-[var(--fg)]">{s.title}</h3>
                  <p className="text-[11px] text-[var(--fg-muted)]">{s.description}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border-subtle)] shrink-0">
                  Em breve
                </span>
              </WidgetCard>
            );
          })}
        </div>
      </motion.div>

      {/* Upgrade CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springDefault, delay: 0.28 }}
      >
        <WidgetCard hover={false} className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--fg)]">Precisa de mais espaço?</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Faça upgrade do plano para expandir o armazenamento.</p>
          </div>
          <Link
            href="/configuracoes/assinatura"
            className="text-[12px] text-[var(--info)] hover:underline flex items-center gap-1"
          >
            Ver planos <ArrowRight size={12} />
          </Link>
        </WidgetCard>
      </motion.div>
    </PageTransition>
  );
}
