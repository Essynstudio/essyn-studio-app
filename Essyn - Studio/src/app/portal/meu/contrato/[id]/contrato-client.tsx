"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FileSignature, Download, Check, Clock, ShieldCheck, Loader2, PenLine, ExternalLink } from "lucide-react";
import { springDefault } from "@/lib/motion-tokens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  title: string;
  status: string;
  file_url: string | null;
  signed_at: string | null;
  accepted_at: string | null;
  viewed_at: string | null;
  autentique_signing_url: string | null;
  created_at: string;
  projects: { id: string; name: string; event_type: string } | null;
}

interface Props { contract: Contract; }

const T = { fg: "#2D2A26", muted: "#8E8880", subtle: "#B5AFA6", green: "#2D7A4F", greenSoft: "rgba(45,122,79,0.12)", warning: "#C87A20" };
const GS = { bg: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.55)", shadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(255,255,255,0.4) inset" };

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return format(d, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function PortalContratoClient({ contract: initial }: Props) {
  const [contract, setContract] = useState(initial);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSigned = contract.status === "assinado";
  const isAccepted = contract.status === "aceito";
  const canAccept = ["enviado", "visualizado"].includes(contract.status);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/contract-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: contract.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao aceitar contrato");
        return;
      }
      setContract((prev) => ({ ...prev, status: "aceito", accepted_at: data.accepted_at }));
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setAccepting(false);
    }
  }

  // Status badge config
  function getStatusInfo() {
    if (isSigned) return { label: "Contrato assinado digitalmente", icon: <ShieldCheck size={18} style={{ color: T.green }} />, bgColor: T.greenSoft };
    if (isAccepted) return { label: "Contrato aceito", icon: <Check size={18} style={{ color: T.green }} />, bgColor: T.greenSoft };
    return { label: "Aguardando aceite", icon: <Clock size={18} style={{ color: T.warning }} />, bgColor: "rgba(200,122,32,0.1)" };
  }

  function getStatusSubtext() {
    if (isSigned && contract.signed_at) return `Assinado em ${format(new Date(contract.signed_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    if (isAccepted && contract.accepted_at) return `Aceito em ${format(new Date(contract.accepted_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    return `Enviado em ${format(new Date(contract.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="px-6 lg:px-10 py-8 space-y-5">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springDefault}>
        <h1 className="text-[24px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontStyle: "italic", color: T.fg }}>
          {contract.title || "Contrato"}
        </h1>
        {contract.projects && <p className="text-[13px] mt-1" style={{ color: T.muted }}>{contract.projects.name}</p>}
      </motion.div>

      {/* Status badge */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.05 }}
        className="rounded-2xl p-5 backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: statusInfo.bgColor }}
          >
            {statusInfo.icon}
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: T.fg }}>{statusInfo.label}</p>
            <p className="text-[11px]" style={{ color: T.muted }}>{getStatusSubtext()}</p>
          </div>
        </div>
      </motion.div>

      {/* PDF viewer + download */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.1 }}>
        {contract.file_url ? (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}>
              <iframe src={contract.file_url} className="w-full border-0" style={{ height: "60vh" }} title="Contrato" />
            </div>
            <a href={contract.file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] font-medium backdrop-blur-xl transition-colors"
              style={{ backgroundColor: T.greenSoft, color: T.green }}
            >
              <Download size={14} /> Baixar contrato
            </a>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}>
            <FileSignature size={32} className="mx-auto mb-3" style={{ color: T.subtle }} />
            <p className="text-[13px]" style={{ color: T.muted }}>O contrato sera disponibilizado em breve.</p>
          </div>
        )}
      </motion.div>

      {/* Acceptance section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springDefault, delay: 0.15 }}>
        {canAccept && (
          <div className="rounded-2xl p-6 backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}>
            {contract.autentique_signing_url ? (
              // Assinatura eletrônica via Autentique
              <>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.fg }}>
                  Este contrato requer <strong>assinatura eletrônica</strong>. Clique abaixo para assinar digitalmente com validade jurídica.
                </p>
                <a
                  href={contract.autentique_signing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-semibold transition-all"
                  style={{ backgroundColor: T.green, color: "#fff" }}
                >
                  <PenLine size={16} />
                  Assinar contrato digitalmente
                  <ExternalLink size={13} style={{ opacity: 0.7 }} />
                </a>
                <p className="text-[11px] mt-3" style={{ color: T.muted }}>
                  Powered by Autentique · Assinatura com validade jurídica
                </p>
              </>
            ) : (
              // Aceite simples (sem Autentique)
              <>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.fg }}>
                  Ao clicar abaixo, voce declara que leu e concorda com todos os termos deste contrato.
                </p>
                {error && (
                  <p className="text-[12px] mb-3" style={{ color: "#B84233" }}>{error}</p>
                )}
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[14px] font-semibold transition-all"
                  style={{
                    backgroundColor: accepting ? "rgba(45,122,79,0.5)" : T.green,
                    color: "#fff",
                    cursor: accepting ? "wait" : "pointer",
                  }}
                >
                  {accepting ? (
                    <><Loader2 size={16} className="animate-spin" /> Registrando aceite...</>
                  ) : (
                    <><Check size={16} /> Li e aceito os termos deste contrato</>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {isAccepted && contract.accepted_at && (
          <div className="rounded-2xl p-6 backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: T.greenSoft }}>
                <Check size={18} style={{ color: T.green }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: T.green }}>Contrato aceito</p>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Voce aceitou este contrato em {formatDatetime(contract.accepted_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSigned && (
          <div className="rounded-2xl p-6 backdrop-blur-2xl" style={{ backgroundColor: GS.bg, border: GS.border, boxShadow: GS.shadow }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: T.greenSoft }}>
                <ShieldCheck size={18} style={{ color: T.green }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: T.green }}>Contrato assinado digitalmente</p>
                {contract.signed_at && (
                  <p className="text-[11px]" style={{ color: T.muted }}>
                    Assinado em {formatDatetime(contract.signed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
