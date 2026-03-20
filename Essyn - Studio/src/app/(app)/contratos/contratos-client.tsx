"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  SearchX,
  FileText,
  Send,
  Loader2,
  Pencil,
  Eye,
  AlertTriangle,
  X,
  Upload,
  PenLine,
  ExternalLink,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  StatusBadge,
  WidgetEmptyState,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  GHOST_BTN,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";

// --- Types ---

type ContractStatus = "rascunho" | "enviado" | "visualizado" | "aceito" | "assinado" | "expirado" | "cancelado";

interface Contract {
  id: string;
  title: string;
  content: string | null;
  value: number | null;
  status: ContractStatus;
  file_url: string | null;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  autentique_document_id: string | null;
  autentique_signing_url: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string } | null;
  clients: { id: string; name: string; email?: string } | null;
}

interface ProjectRef {
  id: string;
  name: string;
  client_id: string | null;
}

interface SimpleRef {
  id: string;
  name: string;
}

// --- Config ---

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const statusConfig: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  enviado: { label: "Enviado", color: "var(--info)", bg: "var(--info-subtle)" },
  visualizado: { label: "Visualizado", color: "var(--accent)", bg: "var(--accent-subtle)" },
  aceito: { label: "Aceito", color: "var(--success)", bg: "var(--success-subtle)" },
  assinado: { label: "Assinado", color: "var(--success)", bg: "var(--success-subtle)" },
  expirado: { label: "Expirado", color: "var(--warning)", bg: "var(--warning-subtle)" },
  cancelado: { label: "Cancelado", color: "var(--error)", bg: "var(--error-subtle)" },
};

const filterPills: { value: ContractStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Enviado" },
  { value: "visualizado", label: "Visualizado" },
  { value: "aceito", label: "Aceito" },
  { value: "expirado", label: "Expirado" },
  { value: "cancelado", label: "Cancelado" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

/** Parse Brazilian currency input "1.500,00" or "1500,50" to number */
function parseBRLValue(raw: string): number | null {
  if (!raw.trim()) return null;
  // Remove dots (thousands), replace comma with dot (decimal)
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/** Format a number to Brazilian comma format for the input */
function toBRLInput(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toFixed(2).replace(".", ",");
}

// --- Main Component ---

export function ContratosClient({
  contracts: initial,
  projects,
  clients,
  studioId,
  studioName,
}: {
  contracts: Contract[];
  projects: ProjectRef[];
  clients: SimpleRef[];
  studioId: string;
  studioName: string;
}) {
  const router = useRouter();
  const [contracts, setContracts] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "todos">("todos");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.projects?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clients?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalContratos = contracts.length;
  const totalAceitos = contracts.filter((c) => c.status === "aceito" || c.status === "assinado").length;
  const valorTotal = contracts
    .filter((c) => c.status === "aceito" || c.status === "assinado")
    .reduce((sum, c) => sum + Number(c.value || 0), 0);

  // Contratos expirando em 7 dias
  const expiringContracts = contracts.filter((c) => {
    if (!c.expires_at || c.status === "aceito" || c.status === "assinado" || c.status === "cancelado" || c.status === "expirado") return false;
    const daysLeft = Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  });

  async function handleSend(id: string) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("contracts")
      .update({
        status: "enviado",
        sent_at: now,
      })
      .eq("id", id)
      .eq("studio_id", studioId);

    if (error) {
      toast.error("Erro ao enviar contrato");
      return;
    }

    setContracts(
      contracts.map((c) =>
        c.id === id
          ? { ...c, status: "enviado" as ContractStatus, sent_at: now }
          : c
      )
    );
    toast.success("Contrato enviado!");
    router.refresh();
  }

  const [signingLoading, setSigningLoading] = useState<string | null>(null);

  async function handleSendForSignature(contract: Contract) {
    if (!contract.file_url) {
      toast.error("Anexe um PDF antes de enviar para assinatura.");
      return;
    }
    if (!(contract.clients as { email?: string } | null)?.email) {
      toast.error("O cliente não tem e-mail cadastrado.");
      return;
    }

    setSigningLoading(contract.id);
    try {
      const res = await fetch("/api/contracts/send-for-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_id: contract.id }),
      });
      const json = await res.json() as { success?: boolean; error?: string; signingUrl?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error || "Erro ao enviar para assinatura");
        return;
      }
      toast.success("Contrato enviado para assinatura! O cliente receberá um e-mail.");
      setContracts(
        contracts.map((c) =>
          c.id === contract.id
            ? {
                ...c,
                status: "enviado" as ContractStatus,
                sent_at: new Date().toISOString(),
                autentique_signing_url: json.signingUrl || null,
              }
            : c
        )
      );
      router.refresh();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSigningLoading(null);
    }
  }

  return (
    <PageTransition>
      {/* --- Unified Panel --- */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.017em]">
                Cofre de Contratos
              </h1>
              <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
                {totalContratos} contratos &middot; {totalAceitos} aceitos
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className={PRIMARY_CTA}
            >
              <Plus size={16} />
              Novo contrato
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Buscar contratos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
            />
          </div>
        </div>

        {/* Alert */}
        <AnimatePresence>
          {expiringContracts.length > 0 && !alertDismissed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--warning-subtle)]"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg)]">
                  {expiringContracts.length === 1
                    ? "1 contrato expira nos proximos 7 dias"
                    : `${expiringContracts.length} contratos expiram nos proximos 7 dias`}
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {expiringContracts.map((c) => c.title).join(", ")}
                </p>
              </div>
              <button
                onClick={() => setAlertDismissed(true)}
                className="shrink-0 p-1 rounded-lg hover:bg-[var(--warning)]/10 transition-colors"
              >
                <X size={14} className="text-[var(--fg-muted)]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats grid */}
        <div className="grid grid-cols-3 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setFilterStatus("todos")}
            className="px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors"
          >
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">
              {totalContratos}
            </p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Total contratos</p>
          </button>
          <button
            onClick={() => setFilterStatus("aceito")}
            className="px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors"
          >
            <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">
              {totalAceitos}
            </p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Aceitos</p>
          </button>
          <button
            onClick={() => setFilterStatus("aceito")}
            className="px-5 py-4 text-left hover:bg-[var(--card-hover)] transition-colors"
          >
            <p className="text-[18px] font-bold text-[var(--success)] tracking-[-0.02em] leading-none tabular-nums">
              {formatCurrency(valorTotal)}
            </p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Valor total (aceitos)</p>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            {filterPills.map((pill) => (
              <ActionPill
                key={pill.value}
                label={pill.label}
                active={filterStatus === pill.value}
                onClick={() => setFilterStatus(pill.value)}
                count={
                  pill.value === "todos"
                    ? totalContratos
                    : contracts.filter((c) => c.status === pill.value).length
                }
              />
            ))}
          </div>
        </div>

        {/* Empty state (inside card) */}
        {contracts.length === 0 && (
          <div className="border-t border-[var(--border-subtle)] px-6 py-16">
            <WidgetEmptyState
              icon={FileText}
              title="Nenhum contrato ainda."
              description="Envie contratos em PDF para seus clientes visualizarem e aceitarem online."
              action={
                <button
                  onClick={() => setShowNewModal(true)}
                  className={PRIMARY_CTA}
                >
                  <Plus size={16} />
                  Criar primeiro contrato
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* --- Contract Table (separate card) --- */}
      {contracts.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden mt-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          {filtered.length === 0 ? (
            <div className="px-6 py-16">
              <WidgetEmptyState
                icon={SearchX}
                title="Nenhum contrato encontrado com esses filtros."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-6 py-3">
                      Contrato / Cliente
                    </th>
                    <th className="text-left text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                      Projeto
                    </th>
                    <th className="text-left text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                      Valor
                    </th>
                    <th className="text-left text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Visualizado
                    </th>
                    <th className="text-left text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Aceito
                    </th>
                    <th className="text-right text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-right text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider px-6 py-3">

                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contract, index) => {
                    const status = statusConfig[contract.status];

                    return (
                      <motion.tr
                        key={contract.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          ...springContentIn.transition,
                          delay: index * 0.015,
                        }}
                        className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            {contract.file_url && (
                              <FileText size={14} className="shrink-0 text-[var(--info)]" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[var(--fg)] truncate max-w-[240px]">
                                {contract.title}
                              </p>
                              {contract.clients && (
                                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate max-w-[240px]">
                                  {contract.clients.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-[12px] text-[var(--fg-secondary)] truncate max-w-[160px]">
                            {contract.projects?.name || "--"}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-[12px] font-medium text-[var(--fg)] tabular-nums">
                            {contract.value != null
                              ? formatCurrency(Number(contract.value))
                              : "--"}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-[11px] text-[var(--fg-muted)] tabular-nums">
                            {contract.viewed_at
                              ? format(new Date(contract.viewed_at), "d MMM yyyy HH:mm", { locale: ptBR })
                              : "--"}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-[11px] text-[var(--fg-muted)] tabular-nums">
                            {contract.accepted_at
                              ? format(new Date(contract.accepted_at), "d MMM yyyy HH:mm", { locale: ptBR })
                              : "--"}
                          </p>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <StatusBadge
                            label={status.label}
                            color={status.color}
                            bg={status.bg}
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingContract(contract)}
                              className={SECONDARY_CTA}
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">Ver</span>
                            </button>
                            {contract.status === "rascunho" && (
                              <>
                                <button
                                  onClick={() => setEditingContract(contract)}
                                  className={SECONDARY_CTA}
                                >
                                  <Pencil size={13} />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                                <button
                                  onClick={() => handleSendForSignature(contract)}
                                  disabled={signingLoading === contract.id}
                                  className={PRIMARY_CTA}
                                  title="Enviar para assinatura eletrônica via Autentique"
                                >
                                  {signingLoading === contract.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <PenLine size={13} />
                                  )}
                                  <span className="hidden sm:inline">Assinar</span>
                                </button>
                              </>
                            )}
                            {contract.status === "enviado" && contract.autentique_signing_url && (
                              <a
                                href={contract.autentique_signing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={SECONDARY_CTA}
                                title="Abrir link de assinatura"
                              >
                                <ExternalLink size={13} />
                                <span className="hidden sm:inline">Link</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AppleModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Novo contrato"
      >
        <NewContractForm
          studioId={studioId}
          studioName={studioName}
          projects={projects}
          clients={clients}
          onClose={() => setShowNewModal(false)}
          onCreated={(contract) => {
            setContracts([contract, ...contracts]);
            setShowNewModal(false);
            toast.success("Contrato criado!");
            router.refresh();
          }}
        />
      </AppleModal>

      <AppleModal
        open={!!editingContract}
        onClose={() => setEditingContract(null)}
        title="Editar contrato"
      >
        {editingContract && (
          <EditContractForm
            contract={editingContract}
            studioId={studioId}
            projects={projects}
            clients={clients}
            onClose={() => setEditingContract(null)}
            onUpdated={(updated) => {
              setContracts(contracts.map((c) => (c.id === updated.id ? updated : c)));
              setEditingContract(null);
              toast.success("Contrato atualizado!");
              router.refresh();
            }}
          />
        )}
      </AppleModal>

      <AppleModal
        open={!!viewingContract}
        onClose={() => setViewingContract(null)}
        title={viewingContract?.title || "Contrato"}
      >
        {viewingContract && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge
                label={statusConfig[viewingContract.status].label}
                color={statusConfig[viewingContract.status].color}
                bg={statusConfig[viewingContract.status].bg}
              />
              {viewingContract.value != null && (
                <span className="text-[13px] font-semibold text-[var(--fg)]">
                  {formatCurrency(Number(viewingContract.value))}
                </span>
              )}
            </div>

            {viewingContract.projects && (
              <p className="text-[12px] text-[var(--fg-secondary)]">
                Projeto: {viewingContract.projects.name}
              </p>
            )}
            {viewingContract.clients && (
              <p className="text-[12px] text-[var(--fg-secondary)]">
                Cliente: {viewingContract.clients.name}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-[11px] text-[var(--fg-muted)]">
              <span>Criado: {format(new Date(viewingContract.created_at), "d MMM yyyy", { locale: ptBR })}</span>
              {viewingContract.sent_at && <span>Enviado: {format(new Date(viewingContract.sent_at), "d MMM yyyy HH:mm", { locale: ptBR })}</span>}
              {viewingContract.viewed_at && <span>Visualizado: {format(new Date(viewingContract.viewed_at), "d MMM yyyy HH:mm", { locale: ptBR })}</span>}
              {viewingContract.accepted_at && <span>Aceito: {format(new Date(viewingContract.accepted_at), "d MMM yyyy HH:mm", { locale: ptBR })}</span>}
              {viewingContract.signed_at && <span>Assinado: {format(new Date(viewingContract.signed_at), "d MMM yyyy HH:mm", { locale: ptBR })}</span>}
              {viewingContract.expires_at && <span>Expira: {format(new Date(viewingContract.expires_at), "d MMM yyyy", { locale: ptBR })}</span>}
            </div>

            {viewingContract.file_url ? (
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] overflow-hidden">
                <a
                  href={viewingContract.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--info-subtle)] flex items-center justify-center flex-shrink-0">
                    <FileText size={22} className="text-[var(--info)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)]">Abrir PDF do contrato</p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Abre em nova aba</p>
                  </div>
                </a>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--fg-muted)] italic mt-4">Nenhum PDF anexado.</p>
            )}

            {viewingContract.autentique_signing_url && (
              <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] overflow-hidden">
                <a
                  href={viewingContract.autentique_signing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--success-subtle)] flex items-center justify-center flex-shrink-0">
                    <PenLine size={22} className="text-[var(--success)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)]">Link de assinatura eletrônica</p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Via Autentique · Abre em nova aba</p>
                  </div>
                  <ExternalLink size={15} className="text-[var(--fg-muted)] shrink-0" />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingContract(null)} className={SECONDARY_CTA}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </AppleModal>
    </PageTransition>
  );
}

// --- PDF Upload Hook ---

function usePdfUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (f && f.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF sao aceitos.");
      return;
    }
    if (f && f.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. O limite e 10 MB.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const remove = useCallback(() => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return { file, setFile, inputRef, dragOver, handleFile, handleDrop, handleDragOver, handleDragLeave, remove };
}

// --- PDF Upload Zone Component ---

function PdfUploadZone({
  hook,
  required,
  existingUrl,
}: {
  hook: ReturnType<typeof usePdfUpload>;
  required?: boolean;
  existingUrl?: string | null;
}) {
  const { file, inputRef, dragOver, handleDrop, handleDragOver, handleDragLeave, handleFile, remove } = hook;

  if (file) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--info-subtle)] flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-[var(--info)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{file.name}</p>
            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
              {file.size > 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${(file.size / 1024).toFixed(0)} KB`} &middot; PDF
            </p>
          </div>
          <button type="button" onClick={remove} className={`${GHOST_BTN} !p-2`} title="Remover PDF">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {existingUrl && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <FileText size={13} className="text-[var(--info)]" />
          <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--info)] hover:underline">
            PDF atual anexado
          </a>
        </div>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 py-8 px-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? "border-[var(--info)] bg-[var(--info-subtle)]"
            : "border-[var(--border)] hover:border-[var(--info)] hover:bg-[var(--info-subtle)]"
        }`}
      >
        <div className="w-11 h-11 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center">
          <Upload size={20} className="text-[var(--fg-muted)]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-[var(--fg)]">
            Arraste o PDF aqui{!required && <span className="text-[var(--fg-muted)] font-normal"> (opcional)</span>}
          </p>
          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
            ou <span className="text-[var(--info)] font-medium">clique para selecionar</span>
          </p>
        </div>
        <p className="text-[10px] text-[var(--fg-muted)]">Apenas PDF, maximo 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

// --- Contract Variables Helper ---

const CONTRACT_VARS = [
  { var: "{nome}", desc: "Nome do cliente" },
  { var: "{estudio}", desc: "Nome do estúdio" },
  { var: "{evento}", desc: "Tipo do evento" },
  { var: "{data}", desc: "Data do evento" },
  { var: "{local}", desc: "Local do evento" },
  { var: "{valor}", desc: "Valor do contrato" },
  { var: "{parcelas}", desc: "Forma de pagamento" },
  { var: "{entrega}", desc: "Prazo de entrega" },
];

const CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS

As partes abaixo identificadas celebram o presente contrato nas seguintes condições:

CONTRATANTE: {nome}
CONTRATADO: {estudio}

CLÁUSULA 1 — OBJETO DO CONTRATO
O presente contrato tem por objeto a prestação de serviços de fotografia para {evento}, a realizar-se no dia {data}, no local: {local}.

CLÁUSULA 2 — VALOR E PAGAMENTO
O valor total dos serviços é de {valor}, a ser pago da seguinte forma: {parcelas}.

CLÁUSULA 3 — ENTREGA DO MATERIAL
O material fotográfico será entregue ao CONTRATANTE em até {entrega} dias após a realização do evento, através de galeria digital.

CLÁUSULA 4 — DIREITOS DE IMAGEM
O CONTRATANTE autoriza o CONTRATADO a utilizar as imagens produzidas para fins de divulgação e portfólio, desde que sem fins comerciais diretos.

CLÁUSULA 5 — CANCELAMENTO
Em caso de cancelamento pelo CONTRATANTE com antecedência inferior a 30 dias, o sinal pago não será devolvido. Caso o cancelamento ocorra por parte do CONTRATADO, o valor integral será ressarcido.

CLÁUSULA 6 — FORO
As partes elegem o foro da Comarca de domicílio do CONTRATADO para dirimir quaisquer dúvidas oriundas do presente instrumento.

E por estarem assim justos e contratados, assinam o presente em duas vias de igual teor.`;

// --- New Contract Form ---

function NewContractForm({
  studioId,
  projects,
  clients,
  studioName,
  onClose,
  onCreated,
}: {
  studioId: string;
  projects: ProjectRef[];
  clients: SimpleRef[];
  studioName: string;
  onClose: () => void;
  onCreated: (contract: Contract) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"write" | "upload">("write");
  const [content, setContent] = useState(CONTRACT_TEMPLATE);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [form, setForm] = useState({
    title: "",
    value: "",
    project_id: "",
    client_id: "",
    expires_at: "",
  });
  const pdfHook = usePdfUpload();

  function handleProjectChange(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    setForm({ ...form, project_id: projectId, client_id: project?.client_id || form.client_id });
  }

  async function handleGeneratePdf() {
    if (!content.trim()) { toast.error("Escreva o conteúdo do contrato."); return; }
    setGeneratingPdf(true);
    try {
      const { generateContractPdf } = await import("@/lib/contract-pdf");
      const clientName = clients.find(c => c.id === form.client_id)?.name;
      const parsedValue = parseBRLValue(form.value);
      const file = generateContractPdf({
        title: form.title || "Contrato",
        content,
        studioName,
        clientName,
        value: parsedValue,
        date: form.expires_at ? new Date(form.expires_at).toLocaleDateString("pt-BR") : undefined,
      });
      pdfHook.setFile(file);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF.");
      console.error(e);
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!pdfHook.file) {
      toast.error(mode === "write" ? "Clique em 'Gerar PDF' antes de salvar." : "Anexe o PDF do contrato.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const parsedValue = parseBRLValue(form.value);
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        studio_id: studioId,
        title: form.title.trim(),
        content: mode === "write" ? content.trim() : null,
        value: parsedValue,
        project_id: form.project_id || null,
        client_id: form.client_id || null,
        expires_at: form.expires_at || null,
      })
      .select(`
        id, title, content, value, status, file_url,
        sent_at, signed_at, expires_at, viewed_at, accepted_at,
        created_at, updated_at,
        projects (id, name),
        clients (id, name)
      `)
      .single();

    if (error) { toast.error("Erro: " + error.message); setLoading(false); return; }

    const filePath = `${studioId}/${data.id}/contrato.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, pdfHook.file, { contentType: "application/pdf", upsert: true });

    if (uploadError) { toast.error("Erro ao enviar PDF: " + uploadError.message); setLoading(false); return; }

    const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filePath);
    await supabase.from("contracts").update({ file_url: urlData.publicUrl }).eq("id", data.id);

    onCreated({ ...(data as unknown as Contract), file_url: urlData.publicUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Title */}
      <div>
        <label className={LABEL_CLS}>Título *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Contrato de cobertura fotográfica - Casamento"
          required
          className={INPUT_CLS}
        />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)]">
        <button
          type="button"
          onClick={() => setMode("write")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors ${
            mode === "write"
              ? "bg-[var(--card)] text-[var(--fg)] shadow-sm"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }`}
        >
          <Sparkles size={13} />
          Escrever contrato
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors ${
            mode === "upload"
              ? "bg-[var(--card)] text-[var(--fg)] shadow-sm"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }`}
        >
          <Upload size={13} />
          Upload PDF
        </button>
      </div>

      {/* Content editor */}
      {mode === "write" && (
        <div className="space-y-2">
          {/* Variables dropdown */}
          <div className="flex items-center justify-between">
            <label className={LABEL_CLS}>Conteúdo do contrato</label>
            <button
              type="button"
              onClick={() => setShowVars(!showVars)}
              className="flex items-center gap-1 text-[11px] text-[var(--accent)] font-medium hover:opacity-80"
            >
              Variáveis <ChevronDown size={11} className={`transition-transform ${showVars ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showVars && (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              {CONTRACT_VARS.map(v => (
                <button
                  key={v.var}
                  type="button"
                  title={v.desc}
                  onClick={() => setContent(prev => prev + v.var)}
                  className="px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-mono font-medium hover:opacity-80 transition-opacity"
                >
                  {v.var}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className={`${INPUT_CLS} font-mono text-[11px] leading-relaxed resize-y`}
            placeholder="Escreva o texto do contrato..."
          />
          {/* Generate PDF button */}
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={generatingPdf || !content.trim()}
            className={`w-full ${pdfHook.file ? SECONDARY_CTA : PRIMARY_CTA}`}
          >
            {generatingPdf ? (
              <><Loader2 size={14} className="animate-spin" /> Gerando PDF...</>
            ) : pdfHook.file ? (
              <><Sparkles size={14} /> Regenerar PDF</>
            ) : (
              <><Sparkles size={14} /> Gerar PDF</>
            )}
          </button>
          {pdfHook.file && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--success-subtle)] border border-[var(--success)]/20">
              <FileText size={14} className="text-[var(--success)]" />
              <span className="text-[12px] text-[var(--success)] font-medium">PDF gerado — pronto para salvar</span>
            </div>
          )}
        </div>
      )}

      {/* PDF upload */}
      {mode === "upload" && (
        <div>
          <label className={LABEL_CLS}>Upload PDF *</label>
          <PdfUploadZone hook={pdfHook} required />
        </div>
      )}

      {/* Value + expiry */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Valor R$</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Ex: 5.000,00"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Expiração</label>
          <input
            type="date"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Project + client */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Projeto</label>
          <select value={form.project_id} onChange={(e) => handleProjectChange(e.target.value)} className={`${SELECT_CLS} w-full`}>
            <option value="">Nenhum</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Cliente</label>
          <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className={`${SELECT_CLS} w-full`}>
            <option value="">Nenhum</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>Cancelar</button>
        <button
          type="submit"
          disabled={loading || !form.title.trim() || !pdfHook.file}
          className={PRIMARY_CTA}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : "Criar contrato"}
        </button>
      </div>
    </form>
  );
}

// --- Edit Contract Form ---

function EditContractForm({
  contract,
  studioId,
  projects,
  clients,
  onClose,
  onUpdated,
}: {
  contract: Contract;
  studioId: string;
  projects: ProjectRef[];
  clients: SimpleRef[];
  onClose: () => void;
  onUpdated: (contract: Contract) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: contract.title,
    value: toBRLInput(contract.value),
    project_id: contract.projects?.id || "",
    client_id: contract.clients?.id || "",
    expires_at: contract.expires_at ? contract.expires_at.split("T")[0] : "",
  });
  const pdfHook = usePdfUpload();

  function handleProjectChange(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    setForm({
      ...form,
      project_id: projectId,
      client_id: project?.client_id || form.client_id,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const parsedValue = parseBRLValue(form.value);
    let fileUrl = contract.file_url;

    // Upload new PDF if provided
    if (pdfHook.file) {
      const filePath = `${studioId}/${contract.id}/contrato.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, pdfHook.file, { contentType: "application/pdf", upsert: true });

      if (uploadError) {
        toast.error("Erro ao enviar PDF: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("contracts")
      .update({
        title: form.title.trim(),
        value: parsedValue,
        project_id: form.project_id || null,
        client_id: form.client_id || null,
        expires_at: form.expires_at || null,
        file_url: fileUrl,
      })
      .eq("id", contract.id)
      .eq("studio_id", studioId)
      .select(`
        id, title, content, value, status, file_url,
        sent_at, signed_at, expires_at, viewed_at, accepted_at,
        created_at, updated_at,
        projects (id, name),
        clients (id, name)
      `)
      .single();

    if (error) {
      toast.error("Erro: " + error.message);
      setLoading(false);
      return;
    }

    onUpdated(data as unknown as Contract);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={LABEL_CLS}>Titulo *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Contrato de cobertura fotografica - Casamento"
          required
          className={INPUT_CLS}
        />
      </div>

      <div>
        <label className={LABEL_CLS}>Upload PDF</label>
        <PdfUploadZone hook={pdfHook} existingUrl={contract.file_url} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Valor R$</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="Ex: 5.000,00"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Data de expiracao</label>
          <input
            type="date"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Projeto</label>
          <select
            value={form.project_id}
            onChange={(e) => handleProjectChange(e.target.value)}
            className={`${SELECT_CLS} w-full`}
          >
            <option value="">Nenhum</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Cliente</label>
          <select
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            className={`${SELECT_CLS} w-full`}
          >
            <option value="">Nenhum</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={SECONDARY_CTA}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          className={PRIMARY_CTA}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar alteracoes"
          )}
        </button>
      </div>
    </form>
  );
}
