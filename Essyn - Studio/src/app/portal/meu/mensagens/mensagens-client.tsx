"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Send } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";
import { format, differenceInDays } from "date-fns";
import { usePortalSession } from "../portal-session-context";
import { toast } from "sonner";

interface Msg { id: string; sender_type: "client" | "studio"; message: string; read_at: string | null; created_at: string; }

const fg = "#2D2A26";
const muted = "#8E8880";
const subtle = "#B5AFA6";
const green = "#2D7A4F";
const greenBg = "rgba(45,122,79,0.12)";

function gc(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    ...extra,
  };
}

function mT(s: string) { const d = new Date(s), df = differenceInDays(new Date(), d), t = format(d, "HH:mm"); return df === 0 ? t : df === 1 ? `Ontem ${t}` : format(d, "dd/MM HH:mm"); }

export function MensagensClient() {
  const s = usePortalSession();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const sr = useRef<HTMLDivElement>(null);
  const ir = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/portal/messages"); if (r.ok) { const d = await r.json(); setMsgs(d.messages || []); } } catch { console.error("[Portal] Erro ao carregar mensagens"); } setOk(true);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { sr.current && (sr.current.scrollTop = sr.current.scrollHeight); }, [msgs]);

  // Poll for new messages every 15s
  useEffect(() => {
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  const send = async () => {
    const t = inp.trim(); if (!t || busy) return;
    setBusy(true); setInp("");
    const o: Msg = { id: `t-${Date.now()}`, sender_type: "client", message: t, read_at: null, created_at: new Date().toISOString() };
    setMsgs(p => [...p, o]);
    try {
      const r = await fetch("/api/portal/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: t }) });
      if (r.ok) { const d = await r.json(); setMsgs(p => p.map(m => m.id === o.id ? d.message : m)); }
      else { setMsgs(p => p.filter(m => m.id !== o.id)); toast.error("Erro ao enviar mensagem"); }
    } catch { setMsgs(p => p.filter(m => m.id !== o.id)); toast.error("Erro ao enviar mensagem"); }
    setBusy(false); ir.current?.focus();
  };

  const studio = s?.studio.name || "Fotografo";

  return (
    <div className="px-6 lg:px-10 py-8 flex flex-col" style={{ height: "calc(100dvh - 56px - 56px - 2rem)", minHeight: 0 }}>
      {/* 56px mobile header + 56px bottom nav; md: uses dvh naturally */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springDefault} className="mb-5">
        <h1 className="text-[28px] tracking-[-0.025em]"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: fg }}
        >Mensagens</h1>
        <p className="text-[12px] mt-1" style={{ color: muted }}>Conversa com {studio}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.03 }}
        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0" style={gc()}
      >
        {/* Messages area */}
        <div ref={sr} className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
          {ok && msgs.length === 0 && (
            <div className="flex flex-col items-center py-16">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.4)" }}
              >
                <MessageCircle size={20} style={{ color: subtle }} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: fg }}>Nenhuma mensagem ainda</p>
              <p className="text-[12px] mt-1" style={{ color: muted }}>
                Envie uma mensagem para {studio}
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {msgs.map(m => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={springDefault}
                className={`flex ${m.sender_type === "client" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] px-4 py-3 text-[13px] leading-relaxed ${m.sender_type === "client" ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
                  style={m.sender_type === "client"
                    ? { backgroundColor: green, color: "#fff", boxShadow: "0 2px 8px rgba(45,122,79,0.2)" }
                    : { backgroundColor: "rgba(255,255,255,0.5)", color: fg, border: "1px solid rgba(255,255,255,0.4)" }
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-[9px] mt-1.5 ${m.sender_type === "client" ? "opacity-60 text-right" : "opacity-40"}`}>{mT(m.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-end gap-3">
            <textarea ref={ir} value={inp} onChange={e => setInp(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escreva uma mensagem..." rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-[13px] outline-none transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.4)", color: fg, maxHeight: 80, border: "1px solid rgba(255,255,255,0.35)" }}
              onFocus={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
              onBlur={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
              onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }}
            />
            <button onClick={send} disabled={!inp.trim() || busy}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20"
              style={{ backgroundColor: inp.trim() ? green : "rgba(255,255,255,0.35)", color: inp.trim() ? "#fff" : subtle,
                boxShadow: inp.trim() ? "0 2px 8px rgba(45,122,79,0.25)" : "none" }}
            ><Send size={16} /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
