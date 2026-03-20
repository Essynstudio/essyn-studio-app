/**
 * Helper centralizado para criar notificações no banco.
 * Usar em API routes (server-side) com service role.
 */

import { SupabaseClient } from "@supabase/supabase-js";

type NotificationType =
  | "lead_novo"
  | "lead_convertido"
  | "pagamento_recebido"
  | "pagamento_vencido"
  | "producao_avancou"
  | "entrega_pronta"
  | "galeria_criada"
  | "galeria_visualizada"
  | "pedido_recebido"
  | "contrato_assinado"
  | "sistema";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  description?: string;
  route?: string;
}

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  description,
  route,
}: CreateNotificationParams): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    description: description || null,
    read: false,
    route: route || null,
  });
}

/** Busca o owner_id de um studio */
export async function getStudioOwnerId(
  supabase: SupabaseClient,
  studioId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("studios")
    .select("owner_id")
    .eq("id", studioId)
    .single();
  return data?.owner_id || null;
}
