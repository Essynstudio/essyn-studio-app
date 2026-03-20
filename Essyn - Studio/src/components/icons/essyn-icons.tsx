/**
 * Essyn Studio — Icon Set v8
 * Custom SVG icons for modules (sidebar, hub, command palette)
 * Lucide icons only for UI chrome (chevrons, loader, check, etc.)
 */

import { EssynIcon } from "./EssynIcon";
import {
  // UI chrome icons (Lucide)
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  UserPlus,
  PlusCircle,
  LogOut,
  Bell,
  Moon,
  Sun,
  Menu,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  X,
  // Notification icons (Lucide — small utility)
  UserRoundSearch,
  AlertCircle,
  Package,
  Image,
  ShoppingCart,
} from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; className?: string };

// Lucide stroke weight for UI chrome
const S = 2;

// ═══════════════════════════════════════════════
// SIDEBAR MODULE ICONS (18px) — Custom Essyn SVGs
// ═══════════════════════════════════════════════

export function IconIris({ size = 18, className }: IconProps) {
  return <EssynIcon name="iris" size={size} className={className} />;
}

export function IconProjetos({ size = 18, className }: IconProps) {
  return <EssynIcon name="projetos" size={size} className={className} />;
}

export function IconProducao({ size = 18, className }: IconProps) {
  return <EssynIcon name="producao" size={size} className={className} />;
}

export function IconAgenda({ size = 18, className }: IconProps) {
  return <EssynIcon name="agenda" size={size} className={className} />;
}

export function IconCRM({ size = 18, className }: IconProps) {
  return <EssynIcon name="crm" size={size} className={className} />;
}

export function IconClientes({ size = 18, className }: IconProps) {
  return <EssynIcon name="clientes" size={size} className={className} />;
}

export function IconPortal({ size = 18, className }: IconProps) {
  return <EssynIcon name="portal-cliente" size={size} className={className} />;
}

export function IconGaleria({ size = 18, className }: IconProps) {
  return <EssynIcon name="galeria" size={size} className={className} />;
}

export function IconFinanceiro({ size = 18, className }: IconProps) {
  return <EssynIcon name="financeiro" size={size} className={className} />;
}

export function IconLoja({ size = 18, className }: IconProps) {
  return <EssynIcon name="loja" size={size} className={className} />;
}

export function IconContratos({ size = 18, className }: IconProps) {
  return <EssynIcon name="contratos" size={size} className={className} />;
}

export function IconMensagens({ size = 18, className }: IconProps) {
  return <EssynIcon name="mensagens" size={size} className={className} />;
}

export function IconWhatsApp({ size = 18, className }: IconProps) {
  return <EssynIcon name="whatsapp" size={size} className={className} />;
}

export function IconTime({ size = 18, className }: IconProps) {
  return <EssynIcon name="time" size={size} className={className} />;
}

export function IconRelatorios({ size = 18, className }: IconProps) {
  return <EssynIcon name="relatorios" size={size} className={className} />;
}

export function IconConfiguracoes({ size = 18, className }: IconProps) {
  return <EssynIcon name="configuracoes" size={size} className={className} />;
}

export function IconEntregas({ size = 18, className }: IconProps) {
  return <EssynIcon name="entregas" size={size} className={className} />;
}

// ═══════════════════════════════════════════════
// IRIS HUB AREA (22px) — Same custom icons, larger
// ═══════════════════════════════════════════════

export function IconAreaVisaoGeral({ size = 22, className }: IconProps) {
  return <EssynIcon name="visao-geral" size={size} className={className} />;
}

export function IconAreaProducao({ size = 22, className }: IconProps) {
  return <EssynIcon name="producao" size={size} className={className} />;
}

export function IconAreaFinanceiro({ size = 22, className }: IconProps) {
  return <EssynIcon name="financeiro" size={size} className={className} />;
}

export function IconAreaAgenda({ size = 22, className }: IconProps) {
  return <EssynIcon name="agenda" size={size} className={className} />;
}

export function IconAreaGaleria({ size = 22, className }: IconProps) {
  return <EssynIcon name="galeria" size={size} className={className} />;
}

export function IconAreaProjetos({ size = 22, className }: IconProps) {
  return <EssynIcon name="projetos" size={size} className={className} />;
}

export function IconAreaCRM({ size = 22, className }: IconProps) {
  return <EssynIcon name="crm" size={size} className={className} />;
}

export function IconAreaEntregas({ size = 22, className }: IconProps) {
  return <EssynIcon name="entregas" size={size} className={className} />;
}

// ═══════════════════════════════════════════════
// TOPBAR CHROME (Lucide — UI utility)
// ═══════════════════════════════════════════════

export function IconSearch({ size = 17, className }: IconProps) {
  return <EssynIcon name="buscar" size={size} className={className} />;
}

export function IconBell({ size = 17, className }: IconProps) {
  return <EssynIcon name="notificacoes" size={size} className={className} />;
}

export function IconMoon({ size = 17 }: IconProps) {
  return <Moon size={size} strokeWidth={S} />;
}

export function IconSun({ size = 17 }: IconProps) {
  return <Sun size={size} strokeWidth={S} />;
}

export function IconMenu({ size = 20 }: IconProps) {
  return <Menu size={size} strokeWidth={S} />;
}

export function IconLogOut({ size = 15 }: IconProps) {
  return <LogOut size={size} strokeWidth={S} />;
}

export function IconUser({ size = 15, className }: IconProps) {
  return <EssynIcon name="clientes" size={size} className={className} />;
}

export function IconChevronRight({ size = 12, className }: IconProps) {
  return <ChevronRight size={size} strokeWidth={S} className={className} />;
}

export function IconChevronDown({ size = 12 }: IconProps) {
  return <ChevronDown size={size} strokeWidth={S} />;
}

export function IconChevronLeft({ size = 16 }: IconProps) {
  return <ChevronLeft size={size} strokeWidth={S} />;
}

export function IconX({ size = 14 }: IconProps) {
  return <X size={size} strokeWidth={S} />;
}

// ═══════════════════════════════════════════════
// ACTIONS (Lucide — CRUD & common operations)
// ═══════════════════════════════════════════════

export function IconAdd({ size = 16 }: IconProps) {
  return <Plus size={size} strokeWidth={S} />;
}

export function IconAddCircle({ size = 16 }: IconProps) {
  return <PlusCircle size={size} strokeWidth={S} />;
}

export function IconDelete({ size = 16 }: IconProps) {
  return <Trash2 size={size} strokeWidth={S} />;
}

export function IconView({ size = 16 }: IconProps) {
  return <Eye size={size} strokeWidth={S} />;
}

export function IconHide({ size = 16 }: IconProps) {
  return <EyeOff size={size} strokeWidth={S} />;
}

export function IconCheck({ size = 16 }: IconProps) {
  return <Check size={size} strokeWidth={S} />;
}

export function IconLoading({ size = 16, className = "" }: IconProps) {
  return <Loader2 size={size} strokeWidth={S} className={`animate-spin ${className}`} />;
}

export function IconUserAdd({ size = 16 }: IconProps) {
  return <UserPlus size={size} strokeWidth={S} />;
}

// ═══════════════════════════════════════════════
// NOTIFICATION TYPE ICONS (13px) — Custom where possible
// ═══════════════════════════════════════════════

export function IconNotifLeadNovo({ size = 13, className }: IconProps) {
  return <EssynIcon name="crm" size={size} className={className} />;
}

export function IconNotifLeadConvertido({ size = 13 }: IconProps) {
  return <Check size={size} strokeWidth={S} />;
}

export function IconNotifPagamento({ size = 13, className }: IconProps) {
  return <EssynIcon name="financeiro" size={size} className={className} />;
}

export function IconNotifPagamentoVencido({ size = 13 }: IconProps) {
  return <AlertCircle size={size} strokeWidth={S} />;
}

export function IconNotifProducao({ size = 13, className }: IconProps) {
  return <EssynIcon name="producao" size={size} className={className} />;
}

export function IconNotifEntrega({ size = 13, className }: IconProps) {
  return <EssynIcon name="entregas" size={size} className={className} />;
}

export function IconNotifGaleriaCriada({ size = 13, className }: IconProps) {
  return <EssynIcon name="galeria" size={size} className={className} />;
}

export function IconNotifGaleriaView({ size = 13 }: IconProps) {
  return <Eye size={size} strokeWidth={S} />;
}

export function IconNotifPedido({ size = 13, className }: IconProps) {
  return <EssynIcon name="loja" size={size} className={className} />;
}

export function IconNotifContrato({ size = 13, className }: IconProps) {
  return <EssynIcon name="contratos" size={size} className={className} />;
}

export function IconNotifSistema({ size = 13, className }: IconProps) {
  return <EssynIcon name="notificacoes" size={size} className={className} />;
}

// ═══════════════════════════════════════════════
// COMMAND PALETTE — search result icons
// ═══════════════════════════════════════════════

export function IconSearchResult({ size = 16, className }: IconProps) {
  return <EssynIcon name="buscar" size={size} className={className} />;
}

export function IconLeads({ size = 16, className }: IconProps) {
  return <EssynIcon name="crm" size={size} className={className} />;
}

export function IconPedidos({ size = 16, className }: IconProps) {
  return <EssynIcon name="loja" size={size} className={className} />;
}
