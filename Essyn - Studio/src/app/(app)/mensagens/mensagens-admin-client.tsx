"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Send, ArrowLeft, Search, User,
} from "lucide-react";
import { springContentIn } from "@/lib/motion-tokens";
import { INPUT_CLS } from "@/lib/design-tokens";
import { toast } from "sonner";

interface Conversation {
  client_id: string;
  client_name: string;
  client_email: string | null;
  last_message: string;
  last_at: string;
  last_sender: string;
  unread: number;
}

interface Msg {
  id: string;
  sender_type: "client" | "studio";
  message: string;
  read_at: string | null;
  created_at: string;
}

function timeAgo(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatTime(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const t = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return t;
  if (diff === 1) return `Ontem ${t}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${t}`;
}

export function MensagensAdminClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClient, setActiveClient] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inp, setInp] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/messages");
      if (r.ok) {
        const d = await r.json();
        setConversations(d.conversations || []);
      }
    } catch {
      console.error("[Mensagens] Erro ao carregar conversas");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Poll conversations every 10s
  useEffect(() => {
    const i = setInterval(loadConversations, 10000);
    return () => clearInterval(i);
  }, [loadConversations]);

  // Load messages for active client
  const loadMessages = useCallback(async (clientId: string) => {
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/admin/messages?client_id=${clientId}`);
      if (r.ok) {
        const d = await r.json();
        setMsgs(d.messages || []);
      }
    } catch {
      console.error("[Mensagens] Erro ao carregar mensagens");
    }
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    if (activeClient) {
      loadMessages(activeClient.client_id);
      const i = setInterval(() => loadMessages(activeClient.client_id), 8000);
      return () => clearInterval(i);
    }
  }, [activeClient, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const openChat = (conv: Conversation) => {
    setActiveClient(conv);
    // Clear unread in local state
    setConversations(prev => prev.map(c => c.client_id === conv.client_id ? { ...c, unread: 0 } : c));
  };

  const sendMessage = async () => {
    const text = inp.trim();
    if (!text || sending || !activeClient) return;
    setSending(true);
    setInp("");

    // Optimistic
    const optimistic: Msg = { id: `t-${Date.now()}`, sender_type: "studio", message: text, read_at: null, created_at: new Date().toISOString() };
    setMsgs(prev => [...prev, optimistic]);

    try {
      const r = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: activeClient.client_id, message: text }),
      });
      if (r.ok) {
        const d = await r.json();
        setMsgs(prev => prev.map(m => m.id === optimistic.id ? d.message : m));
        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.client_id === activeClient.client_id
            ? { ...c, last_message: text, last_at: new Date().toISOString(), last_sender: "studio" }
            : c
        ));
      } else {
        // Rollback optimistic message
        setMsgs(prev => prev.filter(m => m.id !== optimistic.id));
        toast.error("Erro ao enviar mensagem");
      }
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== optimistic.id));
      toast.error("Erro ao enviar mensagem");
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const filtered = conversations.filter(c =>
    !search || c.client_name.toLowerCase().includes(search.toLowerCase()) || (c.client_email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springContentIn}
      className="h-[calc(100dvh-64px)] flex"
    >
      {/* ═══ Conversation List ═══ */}
      <div className={`md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg)] ${activeClient ? "hidden md:flex" : "flex w-full"}`}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
              Mensagens
              {totalUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--info)] text-white">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className={`${INPUT_CLS} !pl-9 !h-9 !text-[12px]`}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--info)] border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 px-5">
              <MessageCircle size={28} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-40" />
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhuma conversa</p>
              <p className="text-[11px] text-[var(--fg-placeholder)] mt-1">
                Quando seus clientes enviarem mensagens pelo portal, elas aparecerao aqui.
              </p>
            </div>
          )}

          {filtered.map(conv => (
            <button
              key={conv.client_id}
              onClick={() => openChat(conv)}
              className={`w-full text-left px-5 py-3.5 border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--card-hover)] ${
                activeClient?.client_id === conv.client_id ? "bg-[var(--bg-subtle)]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0 text-[11px] font-semibold text-[var(--fg-muted)]">
                  {conv.client_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate ${conv.unread > 0 ? "font-semibold text-[var(--fg)]" : "font-medium text-[var(--fg-secondary)]"}`}>
                      {conv.client_name}
                    </p>
                    <span className="text-[10px] text-[var(--fg-muted)] shrink-0 ml-2">{timeAgo(conv.last_at)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-[11px] truncate ${conv.unread > 0 ? "text-[var(--fg-secondary)] font-medium" : "text-[var(--fg-muted)]"}`}>
                      {conv.last_sender === "studio" && <span className="text-[var(--fg-placeholder)]">Você: </span>}
                      {conv.last_message}
                    </p>
                    {conv.unread > 0 && (
                      <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-[var(--info)] text-white text-[10px] font-semibold flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Chat Area ═══ */}
      <div className={`flex-1 flex flex-col bg-[var(--bg)] ${!activeClient ? "hidden md:flex" : "flex"}`}>
        {!activeClient ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3 text-[var(--fg-muted)] opacity-25" />
              <p className="text-[14px] text-[var(--fg-muted)]">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-3">
              <button onClick={() => setActiveClient(null)} className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
                <ArrowLeft size={18} className="text-[var(--fg-secondary)]" />
              </button>
              <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[11px] font-semibold text-[var(--fg-muted)]">
                {activeClient.client_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--fg)] truncate">{activeClient.client_name}</p>
                {activeClient.client_email && (
                  <p className="text-[11px] text-[var(--fg-muted)] truncate">{activeClient.client_email}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMsgs && (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--info)] border-t-transparent animate-spin" />
                </div>
              )}

              {!loadingMsgs && msgs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[13px] text-[var(--fg-muted)]">Nenhuma mensagem ainda</p>
                  <p className="text-[11px] text-[var(--fg-placeholder)] mt-1">Envie a primeira mensagem para {activeClient.client_name}</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {msgs.map(m => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={springContentIn}
                    className={`flex ${m.sender_type === "studio" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[65%] px-4 py-3 text-[13px] leading-relaxed ${
                      m.sender_type === "studio"
                        ? "rounded-2xl rounded-br-md bg-[var(--info)] text-white"
                        : "rounded-2xl rounded-bl-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)]"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[9px] mt-1.5 ${m.sender_type === "studio" ? "opacity-60 text-right" : "text-[var(--fg-muted)]"}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-[var(--border)]">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={inp}
                  onChange={e => setInp(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Mensagem para ${activeClient.client_name}...`}
                  rows={1}
                  className={`${INPUT_CLS} !h-auto !py-3 resize-none`}
                  style={{ maxHeight: 100 }}
                  onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inp.trim() || sending}
                  className="shrink-0 w-11 h-11 rounded-[10px] bg-[var(--info)] text-white flex items-center justify-center transition-all hover:opacity-90 active:scale-[0.96] disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
