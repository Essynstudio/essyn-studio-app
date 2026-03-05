import { useState, type ReactNode } from "react";
import {
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  HardDrive,
  Layers,
  Link2,
  Mail,
  Package,
  RefreshCw,
  Send,
  Smartphone,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppleModal } from "../ui/apple-modal";
import { TagPill } from "../ui/tag-pill";

/* ═══════════════════════════════════════════════════ */
/*  SHARED — Toggle Row                               */
/* ═══════════════════════════════════════════════════ */

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F5F5F7] last:border-b-0">
      <span className="text-[#AEAEB2] shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{label}</span>
        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{description}</span>
      </div>
      <button
        onClick={onToggle}
        className="relative w-[42px] h-[25px] rounded-full transition-colors cursor-pointer shrink-0"
        style={{ backgroundColor: enabled ? "#34C759" : "#E5E5EA" }}
      >
        <span
          className="absolute top-[2px] w-[21px] h-[21px] rounded-full bg-white transition-all"
          style={{
            left: enabled ? "19px" : "2px",
            boxShadow: "0 1px 3px #D1D1D6",
          }}
        />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  1. NOTIFICAÇÕES                                    */
/* ═══════════════════════════════════════════════════ */

export function NotificacoesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [lembretePagamento, setLembretePagamento] = useState(true);
  const [lembreteEvento, setLembreteEvento] = useState(true);
  const [resumoSemanal, setResumoSemanal] = useState(false);

  const handleSave = () => {
    toast.success("Notificações atualizadas", {
      description: "Suas preferências de notificação foram salvas",
      duration: 3000,
    });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Notificações"
      subtitle="Canais de comunicação e lembretes"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Check className="w-3.5 h-3.5" />
            Salvar preferências
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Canais */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Canais
          </span>
          <div className="flex flex-col">
            <ToggleRow icon={<Mail />} label="E-mail" description="Receba alertas por e-mail" enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            <ToggleRow icon={<Smartphone />} label="Push" description="Notificações no navegador" enabled={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
            <ToggleRow icon={<Bell />} label="SMS" description="Alertas por mensagem de texto" enabled={smsNotif} onToggle={() => setSmsNotif(!smsNotif)} />
          </div>
        </div>

        {/* Lembretes */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Lembretes automáticos
          </span>
          <div className="flex flex-col">
            <ToggleRow icon={<Bell />} label="Pagamentos pendentes" description="Lembrar clientes sobre parcelas em atraso" enabled={lembretePagamento} onToggle={() => setLembretePagamento(!lembretePagamento)} />
            <ToggleRow icon={<Bell />} label="Eventos próximos" description="Alerta 48h antes de eventos agendados" enabled={lembreteEvento} onToggle={() => setLembreteEvento(!lembreteEvento)} />
            <ToggleRow icon={<Mail />} label="Resumo semanal" description="Relatório semanal por e-mail toda segunda" enabled={resumoSemanal} onToggle={() => setResumoSemanal(!resumoSemanal)} />
          </div>
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  2. DOMÍNIO                                         */
/* ═══════════════════════════════════════════════════ */

export function DominioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [customDomain, setCustomDomain] = useState("galeria.seuestudio.com");
  const [verified, setVerified] = useState(true);

  const handleVerify = () => {
    setVerified(true);
    toast.success("Domínio verificado", {
      description: customDomain + " está ativo e apontando para o ESSYN",
      duration: 3000,
    });
  };

  const handleSave = () => {
    toast.success("Domínio atualizado", {
      description: "Suas configurações de domínio foram salvas",
      duration: 3000,
    });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Domínio Personalizado"
      subtitle="Personalize o endereço da sua galeria de clientes"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Check className="w-3.5 h-3.5" />
            Salvar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Status atual */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
          <Globe className="w-5 h-5 text-[#AEAEB2] shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>
              Domínio ativo
            </span>
            <span className="text-[12px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
              {customDomain}
            </span>
          </div>
          <TagPill variant={verified ? "success" : "warning"} size="xs">
            {verified ? "Verificado" : "Pendente"}
          </TagPill>
        </div>

        {/* Input domínio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Domínio personalizado
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => { setCustomDomain(e.target.value); setVerified(false); }}
              className="flex-1 h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
              style={{ fontWeight: 400 }}
            />
            <button
              onClick={handleVerify}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer shrink-0"
              style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Verificar
            </button>
          </div>
        </div>

        {/* DNS records */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Registros DNS necessários
          </span>
          {[
            { type: "CNAME", name: "galeria", value: "cdn.essyn.com" },
            { type: "TXT", name: "@", value: "essyn-verify=abc123" },
          ].map((r) => (
            <div
              key={r.type + r.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]"
            >
              <TagPill variant="neutral" size="xs">{r.type}</TagPill>
              <span className="text-[11px] text-[#8E8E93] tabular-nums flex-1" style={{ fontWeight: 400 }}>
                {r.name} → {r.value}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(r.value);
                  toast("Copiado", { description: r.type + " copiado para a área de transferência", duration: 2000 });
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  3. ARMAZENAMENTO                                   */
/* ═══════════════════════════════════════════════════ */

const storageBreakdown = [
  { label: "Galerias", size: "28.3 GB", pct: 42, color: "#007AFF" },
  { label: "Projetos", size: "8.7 GB", pct: 13, color: "#34C759" },
  { label: "Contratos & Docs", size: "2.1 GB", pct: 3, color: "#FF9500" },
  { label: "Backups", size: "3.3 GB", pct: 5, color: "#AF52DE" },
  { label: "Livre", size: "57.6 GB", pct: 37, color: "#E5E5EA" },
];

export function ArmazenamentoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Armazenamento"
      subtitle="Uso detalhado do espaço em disco — 42.4 / 100 GB"
      size="md"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Fechar
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 rounded-full bg-[#F2F2F7] overflow-hidden flex">
            {storageBreakdown.filter((s) => s.label !== "Livre").map((s) => (
              <div
                key={s.label}
                className="h-full first:rounded-l-full"
                style={{ width: s.pct + "%", backgroundColor: s.color }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
              42.4 GB usados
            </span>
            <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
              100 GB total
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col gap-0">
          {storageBreakdown.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 py-3 border-b border-[#F5F5F7] last:border-b-0"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[13px] text-[#636366] flex-1" style={{ fontWeight: 500 }}>
                {s.label}
              </span>
              <span className="text-[12px] text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
                {s.size}
              </span>
              <span className="text-[11px] text-[#AEAEB2] tabular-nums w-10 text-right" style={{ fontWeight: 400 }}>
                {s.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Dica */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
          <HardDrive className="w-4 h-4 text-[#AEAEB2] shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
            Para liberar espaço, arquive galerias antigas ou remova backups expirados. Você pode expandir o armazenamento com o add-on Storage Extra (+50 GB).
          </span>
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  4. INTEGRAÇÕES                                     */
/* ═══════════════════════════════════════════════════ */

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  connected: boolean;
  category: string;
}

const integrationsList: Integration[] = [
  { id: "gcal", name: "Google Calendar", description: "Sincronize eventos e sessões", icon: <Layers className="w-4 h-4" />, connected: true, category: "Agenda" },
  { id: "whatsapp", name: "WhatsApp Business", description: "Mensagens automáticas para clientes", icon: <Send className="w-4 h-4" />, connected: true, category: "Comunicação" },
  { id: "stripe", name: "Stripe", description: "Gateway de pagamento online", icon: <Package className="w-4 h-4" />, connected: false, category: "Pagamentos" },
  { id: "gdrive", name: "Google Drive", description: "Backup automático de galerias", icon: <HardDrive className="w-4 h-4" />, connected: false, category: "Armazenamento" },
  { id: "zapier", name: "Zapier", description: "Automatize fluxos com 5000+ apps", icon: <Wifi className="w-4 h-4" />, connected: false, category: "Automação" },
  { id: "mailchimp", name: "Mailchimp", description: "E-mail marketing para clientes", icon: <Mail className="w-4 h-4" />, connected: false, category: "Marketing" },
];

export function IntegracoesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [integrations, setIntegrations] = useState(integrationsList);

  const handleToggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
    const item = integrations.find((i) => i.id === id);
    if (item) {
      toast.success(item.connected ? "Desconectado" : "Conectado", {
        description: item.name + (item.connected ? " foi desconectado" : " foi conectado ao ESSYN"),
        duration: 3000,
      });
    }
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Integrações"
      subtitle={connectedCount + " de " + integrations.length + " conectadas"}
      size="md"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Fechar
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] hover:border-[#D1D1D6] transition-all"
          >
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (item.connected ? "bg-[#E5E5EA]" : "bg-[#F5F5F7]")}>
              <span className={item.connected ? "text-[#8E8E93]" : "text-[#D1D1D6]"}>{item.icon}</span>
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.name}</span>
                <TagPill variant={item.connected ? "success" : "neutral"} size="xs">
                  {item.connected ? "Ativo" : item.category}
                </TagPill>
              </div>
              <span className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>{item.description}</span>
            </div>
            <button
              onClick={() => handleToggle(item.id)}
              className={"flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer " + (
                item.connected
                  ? "border border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#FF3B30] hover:text-[#FF3B30]"
                  : "bg-[#007AFF] text-white hover:bg-[#0066D6] active:scale-[0.98]"
              )}
              style={{ fontWeight: 500 }}
            >
              {item.connected ? (
                <>
                  <X className="w-3 h-3" />
                  Desconectar
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3" />
                  Conectar
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  5. CENTRAL DE AJUDA                                */
/* ═══════════════════════════════════════════════════ */

const helpLinks = [
  { title: "Primeiros Passos", description: "Como configurar seu estúdio no ESSYN", category: "Tutorial" },
  { title: "Gerenciar Projetos", description: "Criar, editar e arquivar projetos fotográficos", category: "Tutorial" },
  { title: "Financeiro", description: "Receitas, despesas, parcelas e fluxo de caixa", category: "Guia" },
  { title: "Galeria de Clientes", description: "Criar galerias, proofing e download", category: "Tutorial" },
  { title: "Produção & Workflow", description: "Kanban, cronograma e etapas de produção", category: "Guia" },
  { title: "Configurar Equipe", description: "Convidar membros e definir permissões", category: "Tutorial" },
  { title: "API & Webhooks", description: "Documentação técnica para integrações", category: "API" },
  { title: "Fale com o Suporte", description: "Atendimento prioritário via chat", category: "Suporte" },
];

export function CentralAjudaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Central de Ajuda"
      subtitle="Documentação, tutoriais e suporte"
      size="md"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Fechar
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {helpLinks.map((link) => (
          <button
            key={link.title}
            onClick={() => {
              toast(link.title, {
                description: "Redirecionando para docs.essyn.com/" + link.title.toLowerCase().replace(/\s+/g, "-"),
                duration: 2500,
              });
            }}
            className="group flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F2F2F7] flex items-center justify-center shrink-0 group-hover:bg-[#E5E5EA] transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-[#C7C7CC] group-hover:text-[#8E8E93] transition-colors" />
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
              <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{link.title}</span>
              <span className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>{link.description}</span>
            </div>
            <TagPill variant="neutral" size="xs">{link.category}</TagPill>
            <ChevronRight className="w-3.5 h-3.5 text-[#D1D1D6] group-hover:text-[#AEAEB2] transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  6. E-MAIL SMTP                                     */
/* ═══════════════════════════════════════════════════ */

export function SmtpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [smtpHost, setSmtpHost] = useState("smtp.seuestudio.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("noreply@seuestudio.com");
  const [smtpPass, setSmtpPass] = useState("••••••••••");
  const [senderName, setSenderName] = useState("Estúdio Reis Fotografia");
  const [senderEmail, setSenderEmail] = useState("contato@seuestudio.com");
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success("E-mail de teste enviado", {
        description: "Verifique sua caixa de entrada em " + senderEmail,
        duration: 3000,
      });
    }, 1500);
  };

  const handleSave = () => {
    toast.success("Configurações SMTP salvas", {
      description: "O remetente " + senderEmail + " será usado nos próximos envios",
      duration: 3000,
    });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="E-mail SMTP"
      subtitle="Configure o remetente personalizado para e-mails do sistema"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Send className="w-3.5 h-3.5" />
            {testing ? "Enviando..." : "Testar"}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Check className="w-3.5 h-3.5" />
            Salvar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Remetente */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Remetente
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>Nome</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>E-mail</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
        </div>

        {/* Servidor */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>
            Servidor SMTP
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>Porta</label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>Usuário</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>Senha</label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
          <Mail className="w-4 h-4 text-[#AEAEB2] shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
            Sem configuração SMTP, o sistema usará o remetente padrão noreply@essyn.com. Configure um remetente personalizado para melhorar a entregabilidade.
          </span>
        </div>
      </div>
    </AppleModal>
  );
}
