"use client";

import { motion } from "motion/react";
import { Camera, CalendarClock, Heart } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  galleryName: string;
  eventDate: string | null;
  deliveryDate: string | null;
  studioName: string;
  primaryColor: string;
}

const T = { fg: "#2D2A26", fgSoft: "#5C5650", muted: "#8E8880", subtle: "#B5AFA6", green: "#7D8B6E" };
const GS = { bg: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.55)", shadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(255,255,255,0.4) inset" };

export function GaleriaEmBreve({ galleryName, eventDate, deliveryDate, studioName }: Props) {
  const deliveryDateObj = deliveryDate ? new Date(deliveryDate + "T00:00:00") : null;
  const daysUntilDelivery = deliveryDateObj ? differenceInDays(deliveryDateObj, new Date()) : null;

  return (
    <div className="px-6 lg:px-10 py-8 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springDefault}>
        <h1 className="text-[24px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: T.fg }}>
          {galleryName}
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.05 }}
        className="rounded-2xl overflow-hidden backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}
      >
        <div className="h-44 flex items-center justify-center relative" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...springDefault, delay: 0.15 }}>
            <Camera size={48} style={{ color: T.green }} className="opacity-25" />
          </motion.div>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...springDefault, delay: 0.3 }} className="absolute top-4 right-4">
            <Heart size={16} style={{ color: T.green }} className="opacity-15" />
          </motion.div>
        </div>

        <div className="p-7 text-center">
          <h2 className="text-[18px] font-semibold tracking-[-0.014em]" style={{ color: T.fg }}>Suas fotos estão a caminho</h2>
          <p className="text-[13px] mt-2 leading-relaxed max-w-xs mx-auto" style={{ color: T.muted }}>
            {studioName} está cuidando de cada detalhe para entregar algo especial.
          </p>

          {deliveryDateObj && daysUntilDelivery !== null && daysUntilDelivery > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...springDefault, delay: 0.2 }} className="mt-7">
              <p className="text-[10px] uppercase tracking-[0.08em] mb-1.5" style={{ color: T.muted }}>Previsao de entrega</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[36px] font-light tabular-nums leading-none" style={{ color: T.green }}>{daysUntilDelivery}</span>
                <span className="text-[13px]" style={{ color: T.muted }}>{daysUntilDelivery === 1 ? "dia" : "dias"}</span>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: T.subtle }}>{format(deliveryDateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </motion.div>
          )}

          {!deliveryDateObj && eventDate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...springDefault, delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.5)" }}
            >
              <CalendarClock size={14} style={{ color: T.muted }} />
              <span className="text-[12px]" style={{ color: T.fgSoft }}>
                Evento: <strong>{format(new Date(eventDate + "T00:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
