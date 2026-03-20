"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface IrisAction {
  label: string;
  type: "navigate" | "execute" | "send_message";
  // navigate: go to a page
  route?: string;
  // execute: run a supabase action
  action?: string;
  actionData?: Record<string, any>;
  // send_message: send a follow-up message to Iris
  message?: string;
}

interface Props {
  actions: IrisAction[];
  studioId: string;
  onSendMessage?: (msg: string) => void;
}

export function IrisActionButtons({ actions, studioId, onSendMessage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: IrisAction) {
    if (action.type === "navigate" && action.route) {
      router.push(action.route);
      return;
    }

    if (action.type === "send_message" && action.message && onSendMessage) {
      onSendMessage(action.message);
      return;
    }

    if (action.type === "execute" && action.action) {
      setLoading(action.label);
      try {
        const supabase = createClient();

        if (action.action === "mark_paid" && action.actionData?.installmentId) {
          await supabase.from("installments")
            .update({ status: "pago" })
            .eq("id", action.actionData.installmentId)
            .eq("studio_id", studioId);
          toast.success("Parcela marcada como paga!");
        }

        if (action.action === "send_portal" && action.actionData?.clientId) {
          await fetch("/api/portal/send-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: action.actionData.clientId }),
          });
          toast.success("Acesso ao portal enviado!");
        }

        if (action.action === "advance_workflow" && action.actionData?.workflowId) {
          await supabase.from("project_workflows")
            .update({ status: "concluido" })
            .eq("id", action.actionData.workflowId)
            .eq("studio_id", studioId);
          toast.success("Etapa avançada!");
        }
      } catch {
        toast.error("Erro ao executar ação");
      } finally {
        setLoading(null);
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => handleAction(action)}
          disabled={loading === action.label}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--fg-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--fg)] border border-[var(--border)] transition-all active:scale-[0.97] disabled:opacity-40"
        >
          {loading === action.label && <Loader2 size={10} className="animate-spin" />}
          {action.label}
        </button>
      ))}
    </div>
  );
}
