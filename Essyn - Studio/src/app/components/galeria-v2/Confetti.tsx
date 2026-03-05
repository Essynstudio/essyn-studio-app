import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const colors = ["#007AFF", "#34C759", "#FF9500", "#F2F2F7", "#E5E5EA"];
    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      delay: Math.random() * 0.2,
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotation,
            scale: piece.scale,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: piece.rotation + 720,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: piece.color }}
        />
      ))}
    </div>,
    document.body
  );
}

// Success celebration
export function SuccessCelebration({ message, show }: { message: string; show: boolean }) {
  return (
    <>
      {show && <Confetti trigger={show} />}
      {show && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl bg-[#007AFF] text-white"
          style={{ boxShadow: "0 20px 60px #E5E5EA" }}
        >
          <div className="flex items-center gap-3">
            <div className="text-[24px]">🎉</div>
            <span className="text-[15px]" style={{ fontWeight: 700 }}>
              {message}
            </span>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}