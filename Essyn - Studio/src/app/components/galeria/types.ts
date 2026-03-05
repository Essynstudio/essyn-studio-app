/* ═══════════════════════════════════════════════════ */
/*  SHARED TYPES — Galeria Module                     */
/* ═══════════════════════════════════════════════════ */

import type { GalleryStatus } from "../ui/gallery-status-badge";
import type { GalleryPrivacy } from "../ui/gallery-privacy-badge";

export type GalleryType =
  | "wedding"
  | "portrait"
  | "event"
  | "corporate"
  | "family"
  | "newborn"
  | "graduation"
  | "birthday"
  | "baptism"
  | "travel"
  | "other";

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
}

export interface Projeto {
  id: string;
  nome: string;
  clienteId: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface ColecaoFormData {
  // Step 1: Informações básicas
  nome: string;
  cliente: string;
  clienteId?: string;
  projeto?: string;
  projetoId?: string;
  tipoGaleria: GalleryType;
  dataEvento?: string;

  // Step 2: Privacidade
  privacy: GalleryPrivacy;
  senha?: string;
  dataExpiracao?: string;
  permitirIndexacao: boolean;

  // Step 3: Permissões do cliente
  permiteDownload: boolean;
  tipoDownload: "original" | "alta-res" | "web-res";
  permiteFavoritar: boolean;
  permiteComentarios: boolean;
  permiteSelecionar: boolean;
  limiteSelecoes?: number;
  permiteUploadCliente: boolean;

  // Step 4: Marca d'água & Branding
  marcaDagua: boolean;
  posicaoMarcaDagua: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  logoPersonalizado?: string;
  corTema: string;

  // Step 5: Notificações & Entrega
  notificarCliente: boolean;
  templateEmail: "padrao" | "minimalista" | "elegante";
  mensagemPersonalizada?: string;
  dataEntregaPrevista?: string;

  // Meta
  status: GalleryStatus;
}

export interface GalleryTypeOption {
  value: GalleryType;
  label: string;
  icon: React.ReactNode;
  description: string;
  tooltip?: string;
}

export interface ColecaoTemplate {
  id: string;
  nome: string;
  descricao: string;
  tipo: GalleryType;
  config: Partial<ColecaoFormData>;
}
