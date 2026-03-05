/**
 * WhatsAppPage — Full-page WhatsApp Business integration.
 *
 * Renders as a regular page inside the app shell (section: OPERAÇÃO).
 * Two states:
 *   1. Not connected → QR code login flow
 *   2. Connected → Dual-pane chat interface
 */
import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Send,
  Check,
  CheckCheck,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  MessageCircle,
  QrCode,
  Smartphone,
  Shield,
  Wifi,
  RefreshCw,
  MoreVertical,
  Users,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useShellConfig } from "../components/ui/ShellContext";

/* ═══════════════════════════════════════════════════ */
/*  CONSTANTS & HELPERS                                */
/* ═══════════════════════════════════════════════════ */

const WA_GREEN = "#25D366";
const WA_TEAL = "#128C7E";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white overflow-hidden ${className}`}
      style={{ borderRadius: 20, boxShadow: "0 0.5px 1px #E5E5EA, 0 2px 8px #F2F2F7" }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TYPES & MOCK DATA                                  */
/* ═══════════════════════════════════════════════════ */

interface WaContact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  lastSeen: string;
  projectName?: string;
}

interface WaMessage {
  id: string;
  contactId: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
  status?: "sent" | "delivered" | "read";
}

interface WaConversation {
  contact: WaContact;
  messages: WaMessage[];
  unread: number;
  lastMessage: string;
  lastTime: string;
  pinned?: boolean;
}

const CONTACTS: WaContact[] = [
  { id: "c1", name: "Ana Clara", phone: "+55 11 99876-5432", initials: "AC", lastSeen: "online", projectName: "Casamento Ana & Diego" },
  { id: "c2", name: "Luísa Carvalho", phone: "+55 21 98765-4321", initials: "LC", lastSeen: "há 5 min", projectName: "Ensaio Gestante Luísa" },
  { id: "c3", name: "Carlos Santos", phone: "+55 11 91234-5678", initials: "CS", lastSeen: "há 2h", projectName: "Ensaio Família Santos" },
  { id: "c4", name: "TechBrasil (Joana)", phone: "+55 11 93456-7890", initials: "TB", lastSeen: "ontem", projectName: "Corp TechBrasil" },
  { id: "c5", name: "Mariana Silva", phone: "+55 31 99887-6543", initials: "MS", lastSeen: "há 3h" },
  { id: "c6", name: "Rafael Costa", phone: "+55 11 92345-6789", initials: "RC", lastSeen: "há 1h", projectName: "Casamento Mariana & Rafael" },
];

function buildConversations(): WaConversation[] {
  return [
    {
      contact: CONTACTS[0], unread: 2, pinned: true,
      lastMessage: "Oi! Gostaria de saber quando as fotos ficam prontas",
      lastTime: "10:32",
      messages: [
        { id: "m1", contactId: "c1", text: "Bom dia! Tudo bem?", timestamp: "09:15", fromMe: false },
        { id: "m2", contactId: "c1", text: "Bom dia Ana! Tudo ótimo, e contigo?", timestamp: "09:20", fromMe: true, status: "read" },
        { id: "m3", contactId: "c1", text: "Queria saber sobre o álbum que encomendei", timestamp: "09:45", fromMe: false },
        { id: "m4", contactId: "c1", text: "Claro! O álbum está na fase de revisão, deve ficar pronto até sexta-feira.", timestamp: "09:50", fromMe: true, status: "read" },
        { id: "m5", contactId: "c1", text: "Que ótimo! Mal posso esperar!", timestamp: "10:30", fromMe: false },
        { id: "m6", contactId: "c1", text: "Oi! Gostaria de saber quando as fotos ficam prontas", timestamp: "10:32", fromMe: false },
      ],
    },
    {
      contact: CONTACTS[1], unread: 0, pinned: true,
      lastMessage: "Perfeito, confirmado para sábado às 9h!",
      lastTime: "ontem",
      messages: [
        { id: "m7", contactId: "c2", text: "Oi Luísa! Confirmamos o ensaio para sábado?", timestamp: "14:00", fromMe: true, status: "read" },
        { id: "m8", contactId: "c2", text: "Sim! Pode ser às 9h da manhã?", timestamp: "14:15", fromMe: false },
        { id: "m9", contactId: "c2", text: "Perfeito, confirmado para sábado às 9h!", timestamp: "14:20", fromMe: true, status: "read" },
      ],
    },
    {
      contact: CONTACTS[2], unread: 1,
      lastMessage: "As fotos da família ficaram incríveis! Obrigado!",
      lastTime: "seg",
      messages: [
        { id: "m10", contactId: "c3", text: "Carlos, sua galeria já está publicada!", timestamp: "10:00", fromMe: true, status: "delivered" },
        { id: "m11", contactId: "c3", text: "As fotos da família ficaram incríveis! Obrigado!", timestamp: "11:30", fromMe: false },
      ],
    },
    {
      contact: CONTACTS[3], unread: 0,
      lastMessage: "Enviei a proposta atualizada por email.",
      lastTime: "ter",
      messages: [
        { id: "m12", contactId: "c4", text: "Boa tarde Joana! Sobre o evento corporativo...", timestamp: "15:00", fromMe: true, status: "read" },
        { id: "m13", contactId: "c4", text: "Pode enviar a proposta atualizada?", timestamp: "15:30", fromMe: false },
        { id: "m14", contactId: "c4", text: "Enviei a proposta atualizada por email.", timestamp: "16:00", fromMe: true, status: "read" },
      ],
    },
    {
      contact: CONTACTS[4], unread: 0,
      lastMessage: "Vou pensar e te retorno!",
      lastTime: "12/02",
      messages: [
        { id: "m15", contactId: "c5", text: "Oi Mariana! Posso ajudar com o orçamento?", timestamp: "11:00", fromMe: true, status: "read" },
        { id: "m16", contactId: "c5", text: "Sim! Quero orçamento para um ensaio de casal", timestamp: "11:45", fromMe: false },
        { id: "m17", contactId: "c5", text: "Vou pensar e te retorno!", timestamp: "12:00", fromMe: false },
      ],
    },
    {
      contact: CONTACTS[5], unread: 3,
      lastMessage: "Estamos muito animados com o casamento!",
      lastTime: "11:45",
      messages: [
        { id: "m18", contactId: "c6", text: "Rafael, segue o briefing do casamento.", timestamp: "10:00", fromMe: true, status: "read" },
        { id: "m19", contactId: "c6", text: "Recebido! Vou revisar com a Mariana.", timestamp: "10:30", fromMe: false },
        { id: "m20", contactId: "c6", text: "A Mariana adorou a proposta!", timestamp: "11:00", fromMe: false },
        { id: "m21", contactId: "c6", text: "Podemos fechar o contrato?", timestamp: "11:15", fromMe: false },
        { id: "m22", contactId: "c6", text: "Estamos muito animados com o casamento!", timestamp: "11:45", fromMe: false },
      ],
    },
  ];
}

const QUICK_REPLIES = [
  "Olá! Obrigado pelo contato. Como posso ajudar?",
  "Sua galeria está pronta! Enviei o link por email.",
  "Confirmado! Até lá!",
  "Vou verificar e te retorno em breve.",
  "O contrato foi enviado por email para assinatura.",
  "Lembrete: seu ensaio é amanhã!",
];

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(false);

  useShellConfig({
    breadcrumb: { section: "Operação", page: "WhatsApp" },
  });

  return isConnected
    ? <ConnectedView onDisconnect={() => setIsConnected(false)} />
    : <LoginView onConnect={() => setIsConnected(true)} />;
}

/* ═══════════════════════════════════════════════════ */
/*  LOGIN VIEW                                         */
/* ═══════════════════════════════════════════════════ */

function LoginView({ onConnect }: { onConnect: () => void }) {
  const [step, setStep] = useState<"intro" | "qr" | "connecting">("intro");

  const startConnect = () => {
    setStep("connecting");
    setTimeout(() => {
      onConnect();
      toast.success("WhatsApp Business conectado!", { description: "Suas conversas estão sincronizadas." });
    }, 2500);
  };

  if (step === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <RefreshCw className="w-10 h-10" style={{ color: WA_GREEN }} />
        </motion.div>
        <h2 className="text-[18px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Conectando...</h2>
        <p className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Sincronizando suas conversas</p>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-[420px]">
          <div className="flex flex-col items-center gap-6 px-8 py-10">
            <div className="text-center">
              <h2 className="text-[18px] text-[#1D1D1F] mb-1" style={{ fontWeight: 600 }}>Escaneie o QR Code</h2>
              <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Aponte a câmera do celular para conectar</p>
            </div>

            {/* QR Code mock */}
            <div
              className="w-[220px] h-[220px] rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "#FFFFFF", border: "3px solid #25D366", boxShadow: "0 8px 32px #D4EDDB" }}
            >
              <QrCodeGrid />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: WA_GREEN }}>
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-[#D1D1D6]" />
              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>QR Code atualiza em 45s</span>
            </div>

            <button
              onClick={startConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] text-white cursor-pointer active:scale-[0.98]"
              style={{ fontWeight: 600, background: WA_GREEN }}
            >
              Simular Conexão
            </button>

            <button onClick={() => setStep("intro")} className="text-[12px] text-[#8E8E93] cursor-pointer" style={{ fontWeight: 500 }}>
              ← Voltar
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // step === "intro"
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1440px]">
      {/* Page header */}
      <Card>
        <div className="px-5 pt-5 pb-4">
          <p className="text-[13px] text-[#8E8E93] capitalize" style={{ fontWeight: 400 }}>Operação</p>
          <h1 className="text-[28px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>WhatsApp Business</h1>
          <p className="text-[13px] text-[#8E8E93] mt-1" style={{ fontWeight: 400 }}>Conecte sua conta para enviar mensagens aos clientes</p>
        </div>
      </Card>

      <div className="flex items-center justify-center py-4">
        <Card className="w-full max-w-[480px]">
          <div className="flex flex-col items-center gap-6 px-8 py-10">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <MessageCircle className="w-12 h-12" style={{ color: WA_GREEN }} />
            </div>

            <div className="text-center">
              <h2 className="text-[20px] text-[#1D1D1F] mb-2" style={{ fontWeight: 600 }}>Conectar WhatsApp Business</h2>
              <p className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: "1.6" }}>
                Envie mensagens, confirmações e lembretes para seus clientes directamente pelo ESSYN.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {[
                { icon: <Smartphone className="w-4 h-4" />, title: "Abra o WhatsApp Business", desc: "No seu celular" },
                { icon: <QrCode className="w-4 h-4" />, title: "Dispositivos Vinculados", desc: "Toque em Vincular Dispositivo" },
                { icon: <Wifi className="w-4 h-4" />, title: "Escaneie o QR Code", desc: "Aponte a câmera para a tela" },
              ].map((item, idx) => (
                <div key={item.title} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: "#F2F8F4", border: "1px solid #D4EDDB" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#D4EDDB", color: WA_GREEN }}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                      <span style={{ color: WA_GREEN }}>{idx + 1}.</span> {item.title}
                    </span>
                    <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("qr")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[14px] text-white cursor-pointer active:scale-[0.98]"
              style={{ fontWeight: 600, background: WA_GREEN }}
            >
              <QrCode className="w-4 h-4" />
              Mostrar QR Code
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F2F2F7]">
              <Shield className="w-3.5 h-3.5 shrink-0 text-[#D1D1D6]" />
              <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.4" }}>
                Criptografia ponta a ponta. Suas mensagens permanecem privadas e seguras.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Features row */}
      <Card>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid #F2F2F7" }}>
          <span className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>O que você pode fazer</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-5 py-4">
          {[
            { icon: <MessageCircle className="w-5 h-5" />, title: "Conversas", desc: "Atenda clientes em tempo real" },
            { icon: <Zap className="w-5 h-5" />, title: "Respostas Rápidas", desc: "Templates prontos para usar" },
            { icon: <Users className="w-5 h-5" />, title: "Vinculado ao CRM", desc: "Contactos sincronizados" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E8F5E9]" style={{ color: WA_GREEN }}>
                {f.icon}
              </div>
              <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{f.title}</span>
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── QR grid (deterministic, no Math.random) ── */
function QrCodeGrid() {
  const pattern = [
    1,1,1,0,1,0,1,0,1,1,1,
    1,0,1,1,0,1,0,1,1,0,1,
    1,1,1,0,1,1,0,0,1,1,1,
    0,0,0,1,0,0,1,1,0,0,0,
    1,0,1,0,1,0,1,0,0,1,0,
    0,1,0,0,1,1,0,1,0,1,1,
    1,0,0,1,0,1,1,0,1,0,0,
    0,0,0,1,1,0,0,1,0,0,0,
    1,1,1,0,0,1,0,0,1,1,1,
    1,0,1,0,1,0,1,1,1,0,1,
    1,1,1,1,0,1,0,0,1,1,1,
  ];

  return (
    <div className="grid gap-[3px] p-5" style={{ gridTemplateColumns: "repeat(11, 12px)" }}>
      {pattern.map((filled, i) => (
        <div key={i} className="rounded-sm" style={{ width: 12, height: 12, background: filled ? "#1D1D1F" : "#F5F5F7" }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CONNECTED VIEW                                     */
/* ═══════════════════════════════════════════════════ */

function ConnectedView({ onDisconnect }: { onDisconnect: () => void }) {
  const [conversations, setConversations] = useState<WaConversation[]>(() => buildConversations());
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const activeConversation = conversations.find((c) => c.contact.id === activeChat) || null;

  const filtered = useMemo(() => {
    let result = [...conversations];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.contact.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return result;
  }, [conversations, search]);

  const handleSend = useCallback((contactId: string, text: string) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.contact.id !== contactId) return conv;
        const newMsg: WaMessage = { id: `m-${Date.now()}`, contactId, text, timestamp: now, fromMe: true, status: "sent" };
        return { ...conv, messages: [...conv.messages, newMsg], lastMessage: text, lastTime: "agora" };
      })
    );
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.contact.id !== contactId) return conv;
          const msgs = [...conv.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.fromMe && last.status === "sent") {
            msgs[msgs.length - 1] = { ...last, status: "delivered" };
          }
          return { ...conv, messages: msgs };
        })
      );
    }, 1200);
  }, []);

  const handleSelectChat = (contactId: string) => {
    setActiveChat(contactId);
    setConversations((prev) => prev.map((c) => (c.contact.id === contactId ? { ...c, unread: 0 } : c)));
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* Header */}
      <Card>
        <div className="px-5 pt-5 pb-4">
          <p className="text-[13px] text-[#8E8E93] capitalize" style={{ fontWeight: 400 }}>Operação</p>
          <h1 className="text-[28px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>WhatsApp Business</h1>
          <p className="text-[13px] text-[#8E8E93] mt-1" style={{ fontWeight: 400 }}>
            Conectado · {conversations.length} conversas · {totalUnread} não lidas
          </p>
        </div>
      </Card>

      {/* KPIs */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: "Conversas", value: String(conversations.length), icon: <MessageCircle className="w-4 h-4" />, color: WA_GREEN, bg: "#E8F5E9" },
            { label: "Não lidas", value: String(totalUnread), icon: <Clock className="w-4 h-4" />, color: "#FF9500", bg: "#FFF0DC" },
            { label: "Contactos", value: String(CONTACTS.length), icon: <Users className="w-4 h-4" />, color: "#007AFF", bg: "#E8F0FE" },
            { label: "Enviadas hoje", value: "12", icon: <Send className="w-4 h-4" />, color: "#5856D6", bg: "#F0F0FF" },
          ].map((kpi, idx) => (
            <div key={kpi.label} className="flex items-center gap-3 px-5 py-4" style={{ borderLeft: idx > 0 ? "1px solid #F2F2F7" : undefined }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>{kpi.value}</span>
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{kpi.label}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Dual-pane chat */}
      <Card>
        <div className="flex" style={{ height: "calc(100vh - 320px)", minHeight: 500 }}>
          {/* Left — conversation list */}
          <div className="shrink-0 flex flex-col" style={{ width: 340, borderRight: "1px solid #F2F2F7" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #F2F2F7" }}>
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA]" style={{ border: "1px solid #E5E5EA" }}>
                <Search className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar conversa..."
                  className="flex-1 text-[12px] text-[#1D1D1F] bg-transparent outline-none"
                  style={{ fontWeight: 400 }}
                />
              </div>
              <button
                onClick={() => { onDisconnect(); toast("WhatsApp desconectado"); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C7C7CC] cursor-pointer shrink-0"
                title="Desconectar"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv, idx) => (
                <ConversationRow
                  key={conv.contact.id}
                  conv={conv}
                  isActive={activeChat === conv.contact.id}
                  showDivider={idx > 0}
                  onSelect={() => handleSelectChat(conv.contact.id)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Search className="w-6 h-6 text-[#D1D1D6]" />
                  <p className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — chat or empty */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeConversation ? (
              <ChatPane conversation={activeConversation} onSend={(t) => handleSend(activeConversation.contact.id, t)} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-[#E8F5E9]">
                  <MessageCircle className="w-10 h-10" style={{ color: WA_GREEN }} />
                </div>
                <h3 className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>WhatsApp Business</h3>
                <p className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Selecione uma conversa para começar</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Conversation Row ── */
function ConversationRow({
  conv, isActive, showDivider, onSelect,
}: {
  conv: WaConversation; isActive: boolean; showDivider: boolean; onSelect: () => void;
}) {
  return (
    <div>
      {showDivider && <div style={{ marginLeft: 68, height: 1, background: "#F2F2F7" }} />}
      <button
        onClick={onSelect}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
        style={{ background: isActive ? "#F2F2F7" : "transparent" }}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 relative" style={{ background: "#E8F5E9" }}>
          <span className="text-[13px]" style={{ fontWeight: 600, color: WA_TEAL }}>{conv.contact.initials}</span>
          {conv.contact.lastSeen === "online" && (
            <div className="absolute rounded-full" style={{ bottom: 0, right: 0, width: 12, height: 12, background: WA_GREEN, border: "2px solid white" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[13px] truncate" style={{ fontWeight: conv.unread > 0 ? 600 : 400, color: "#1D1D1F" }}>
              {conv.contact.name}
            </span>
            <span className="text-[10px] shrink-0 ml-2" style={{ fontWeight: 400, color: conv.unread > 0 ? WA_GREEN : "#AEAEB2" }}>
              {conv.lastTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] truncate" style={{ fontWeight: conv.unread > 0 ? 500 : 400, color: conv.unread > 0 ? "#636366" : "#AEAEB2" }}>
              {conv.lastMessage}
            </p>
            {conv.unread > 0 && (
              <span className="ml-2 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ fontWeight: 700, background: WA_GREEN, width: 18, height: 18 }}>
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

/* ── Chat Pane ── */
function ChatPane({ conversation, onSend }: { conversation: WaConversation; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const c = conversation.contact;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation.messages.length]);

  const doSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setShowQuick(false);
    inputRef.current?.focus();
  }, [text, onSend]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0 bg-white" style={{ borderBottom: "1px solid #F2F2F7" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F5E9" }}>
          <span className="text-[13px]" style={{ fontWeight: 600, color: WA_TEAL }}>{c.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#1D1D1F] truncate" style={{ fontWeight: 600 }}>{c.name}</p>
          <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            {c.lastSeen === "online" ? <span style={{ color: WA_GREEN }}>online</span> : c.lastSeen}
            {c.projectName ? ` · ${c.projectName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, Search].map((Icon, i) => (
            <button key={i} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#C7C7CC] cursor-pointer">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1.5" style={{ background: "#F0EDE8" }}>
        <div className="flex justify-center mb-3">
          <span className="px-3 py-1 rounded-lg text-[11px] bg-white text-[#636366]" style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}>
            Hoje
          </span>
        </div>
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
            <div className="rounded-xl px-3.5 py-2" style={{ maxWidth: "75%", background: msg.fromMe ? "#D9FDD3" : "#FFFFFF", boxShadow: "0 1px 2px #E5E5EA" }}>
              <p className="text-[13px] whitespace-pre-wrap text-[#1D1D1F]" style={{ fontWeight: 400, lineHeight: "1.45" }}>{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{msg.timestamp}</span>
                {msg.fromMe && <MsgStatus status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="overflow-hidden bg-white"
            style={{ borderTop: "1px solid #F2F2F7" }}
          >
            <div className="px-4 py-2">
              <p className="text-[10px] text-[#8E8E93] mb-2" style={{ fontWeight: 600 }}>RESPOSTAS RÁPIDAS</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setText(r); setShowQuick(false); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-lg bg-[#F2F2F7] text-[11px] text-[#636366] cursor-pointer"
                    style={{ fontWeight: 400 }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white shrink-0" style={{ borderTop: "1px solid #F2F2F7" }}>
        <button
          onClick={() => setShowQuick(!showQuick)}
          className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 cursor-pointer"
          style={{ color: showQuick ? WA_GREEN : "#C7C7CC", background: showQuick ? "#E8F5E9" : "transparent" }}
        >
          <Zap className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 cursor-pointer text-[#C7C7CC]">
          <Paperclip className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center rounded-xl px-4 py-2.5 bg-[#FAFAFA]" style={{ border: "1px solid #E5E5EA" }}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }}
            placeholder="Escreva uma mensagem..."
            className="flex-1 text-[13px] text-[#1D1D1F] bg-transparent outline-none"
            style={{ fontWeight: 400 }}
          />
          <button className="ml-2 shrink-0 cursor-pointer text-[#C7C7CC]">
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={text.trim() ? doSend : undefined}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.95]"
          style={{ background: WA_GREEN }}
        >
          {text.trim() ? <Send className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}

function MsgStatus({ status }: { status?: string }) {
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5" style={{ color: "#53BDEB" }} />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5" style={{ color: "#8696A0" }} />;
  return <Check className="w-3.5 h-3.5" style={{ color: "#8696A0" }} />;
}
