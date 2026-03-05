import {
  Church,
  Camera,
  Users,
  Building2,
  Heart,
  Baby,
  GraduationCap,
  Cake,
  Droplet,
  Palmtree,
  FolderOpen,
} from "lucide-react";
import type { GalleryTypeOption, ColecaoTemplate } from "./types";

/* ═══════════════════════════════════════════════════ */
/*  GALLERY TYPES — Tipos de galeria disponíveis      */
/* ═══════════════════════════════════════════════════ */

export const GALLERY_TYPES: GalleryTypeOption[] = [
  {
    value: "wedding",
    label: "Casamento",
    icon: <Church className="w-4 h-4" />,
    description: "Cerimônia e festa",
    tooltip: "Ideal para casamentos, inclui configurações de download livre, favoritos e seleção de fotos",
  },
  {
    value: "portrait",
    label: "Ensaio",
    icon: <Camera className="w-4 h-4" />,
    description: "Retratos e ensaios",
    tooltip: "Para ensaios individuais ou casais, com opções de seleção limitada",
  },
  {
    value: "event",
    label: "Evento",
    icon: <Users className="w-4 h-4" />,
    description: "Eventos sociais",
    tooltip: "Eventos corporativos e sociais, com marca d'água ativa por padrão",
  },
  {
    value: "corporate",
    label: "Corporativo",
    icon: <Building2 className="w-4 h-4" />,
    description: "Empresarial",
    tooltip: "Fotos corporativas, com privacidade reforçada e marca d'água obrigatória",
  },
  {
    value: "family",
    label: "Família",
    icon: <Heart className="w-4 h-4" />,
    description: "Fotos de família",
    tooltip: "Ensaios familiares, download livre e sem marca d'água",
  },
  {
    value: "newborn",
    label: "Newborn",
    icon: <Baby className="w-4 h-4" />,
    description: "Recém-nascido",
    tooltip: "Ensaios de recém-nascidos, com seleção de fotos habilitada",
  },
  {
    value: "graduation",
    label: "Formatura",
    icon: <GraduationCap className="w-4 h-4" />,
    description: "Formaturas",
    tooltip: "Formaturas e cerimônias, marca d'água ativa e download controlado",
  },
  {
    value: "birthday",
    label: "Aniversário",
    icon: <Cake className="w-4 h-4" />,
    description: "Festas de aniversário",
    tooltip: "Festas de aniversário, download livre e compartilhamento público",
  },
  {
    value: "baptism",
    label: "Batizado",
    icon: <Droplet className="w-4 h-4" />,
    description: "Cerimônia religiosa",
    tooltip: "Batizados e cerimônias religiosas, configuração similar a casamentos",
  },
  {
    value: "travel",
    label: "Viagem",
    icon: <Palmtree className="w-4 h-4" />,
    description: "Fotografia de viagem",
    tooltip: "Ensaios de viagem, download livre e sem restrições",
  },
  {
    value: "other",
    label: "Outro",
    icon: <FolderOpen className="w-4 h-4" />,
    description: "Tipo personalizado",
    tooltip: "Configure manualmente todas as opções",
  },
];

/* ═══════════════════════════════════════════════════ */
/*  COLLECTION TEMPLATES — Presets de configuração    */
/* ═══════════════════════════════════════════════════ */

export const COLLECTION_TEMPLATES: ColecaoTemplate[] = [
  {
    id: "wedding-preset",
    nome: "Casamento Premium",
    descricao: "Configuração completa para casamentos com todas as permissões",
    tipo: "wedding",
    config: {
      tipoGaleria: "wedding",
      privacy: "senha",
      permitirIndexacao: false,
      permiteDownload: true,
      tipoDownload: "alta-res",
      permiteFavoritar: true,
      permiteComentarios: true,
      permiteSelecionar: true,
      limiteSelecoes: 150,
      permiteUploadCliente: true,
      marcaDagua: false,
      corTema: "#007AFF",
      notificarCliente: true,
      templateEmail: "elegante",
      status: "previa",
    },
  },
  {
    id: "portrait-preset",
    nome: "Ensaio com Seleção",
    descricao: "Para ensaios que exigem seleção limitada de fotos",
    tipo: "portrait",
    config: {
      tipoGaleria: "portrait",
      privacy: "senha",
      permitirIndexacao: false,
      permiteDownload: false,
      tipoDownload: "web-res",
      permiteFavoritar: true,
      permiteComentarios: false,
      permiteSelecionar: true,
      limiteSelecoes: 30,
      permiteUploadCliente: false,
      marcaDagua: true,
      posicaoMarcaDagua: "bottom-right",
      corTema: "#007AFF",
      notificarCliente: true,
      templateEmail: "elegante",
      status: "previa",
    },
  },
  {
    id: "event-preset",
    nome: "Evento Corporativo",
    descricao: "Marca d'água ativa e download controlado",
    tipo: "event",
    config: {
      tipoGaleria: "event",
      privacy: "privado",
      permitirIndexacao: false,
      permiteDownload: true,
      tipoDownload: "web-res",
      permiteFavoritar: false,
      permiteComentarios: false,
      permiteSelecionar: false,
      permiteUploadCliente: false,
      marcaDagua: true,
      posicaoMarcaDagua: "center",
      corTema: "#1D1D1F",
      notificarCliente: true,
      templateEmail: "padrao",
      status: "previa",
    },
  },
  {
    id: "family-preset",
    nome: "Ensaio Família",
    descricao: "Download livre e sem marca d'água",
    tipo: "family",
    config: {
      tipoGaleria: "family",
      privacy: "senha",
      permitirIndexacao: false,
      permiteDownload: true,
      tipoDownload: "original",
      permiteFavoritar: true,
      permiteComentarios: true,
      permiteSelecionar: false,
      permiteUploadCliente: false,
      marcaDagua: false,
      corTema: "#34C759",
      notificarCliente: true,
      templateEmail: "elegante",
      status: "previa",
    },
  },
];

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA — Clientes e Projetos                   */
/* ═══════════════════════════════════════════════════ */

export const MOCK_CLIENTES = [
  { id: "cl-1", nome: "Ana Oliveira", email: "ana@example.com", telefone: "(31) 99999-1111" },
  { id: "cl-2", nome: "Pedro Costa", email: "pedro@example.com", telefone: "(31) 99999-2222" },
  { id: "cl-3", nome: "Márcia Ferreira", email: "marcia@example.com", telefone: "(31) 99999-3333" },
  { id: "cl-4", nome: "João Silva", email: "joao@example.com", telefone: "(31) 99999-4444" },
  { id: "cl-5", nome: "Carla Mendes", email: "carla@example.com", telefone: "(31) 99999-5555" },
];

export const MOCK_PROJETOS = [
  { id: "pr-1", nome: "Casamento Oliveira & Santos", clienteId: "cl-1", dataInicio: "2026-02-15" },
  { id: "pr-2", nome: "Batizado Gabriel", clienteId: "cl-2", dataInicio: "2026-02-01" },
  { id: "pr-3", nome: "15 Anos Isabela", clienteId: "cl-3", dataInicio: "2026-02-05" },
  { id: "pr-4", nome: "Ensaio Gestante — Família Lima", clienteId: "cl-4", dataInicio: "2026-02-10" },
  { id: "pr-5", nome: "Formatura Direito UFMG", clienteId: "cl-5", dataInicio: "2026-01-18" },
];