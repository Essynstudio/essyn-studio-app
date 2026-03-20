import React from 'react';

/**
 * Essyn Studio — Custom Icon System
 * 
 * 20 ícones stroke-only, linha fina editorial
 * Paleta: teal (#2C444D) + gold (#A58D66)
 * Todos usam currentColor — cor controlada via className ou style
 * 
 * Uso:
 *   <EssynIcon name="galeria" size={24} className="text-teal-700" />
 *   <EssynIcon name="iris" size={20} color="#A58D66" />
 */

const sw = 1.4;

const iconPaths = {
  'visao-geral': (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </>
  ),
  'producao': (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <line x1="8" y1="8" x2="12" y2="8"/>
      <line x1="8" y1="12" x2="14" y2="12"/>
      <line x1="8" y1="16" x2="11" y2="16"/>
      <polyline points="15 9 16.5 10.5 19 7.5"/>
    </>
  ),
  'financeiro': (
    <>
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </>
  ),
  'agenda': (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="18"/>
      <line x1="12" y1="14" x2="12" y2="18"/>
    </>
  ),
  'galeria': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </>
  ),
  'projetos': (
    <>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      <line x1="9" y1="14" x2="15" y2="14"/>
    </>
  ),
  'crm': (
    <>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="16" y1="11" x2="22" y2="11"/>
    </>
  ),
  'entregas': (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2"/>
      <polyline points="3 10 12 16 21 10"/>
      <rect x="8" y="2" width="8" height="10" rx="1"/>
      <path d="M10.5 5.5l1.5 1.5 2-2"/>
    </>
  ),
  'clientes': (
    <>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="19" cy="7" r="3"/>
      <path d="M21 21v-1.5a3 3 0 00-2-2.83"/>
    </>
  ),
  'portal-cliente': (
    <>
      <rect x="8" y="2" width="14" height="11" rx="2"/>
      <line x1="12" y1="17" x2="18" y2="17"/>
      <line x1="15" y1="13" x2="15" y2="17"/>
      <circle cx="5" cy="13" r="3"/>
      <path d="M1 21v-1a4 4 0 014-4h0a4 4 0 014 4v1"/>
    </>
  ),
  'loja': (
    <>
      <path d="M3 9l1-5h16l1 5"/>
      <path d="M3 9h18v12a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
      <path d="M9 9v0a3 3 0 006 0v0"/>
      <path d="M3 9v0a3 3 0 006 0v0"/>
      <path d="M15 9v0a3 3 0 006 0v0"/>
    </>
  ),
  'contratos': (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <path d="M9.5 17.5c.8.8 2 1 2.8.5s1.2-1.5 2.2-1.2"/>
    </>
  ),
  'mensagens': (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <line x1="8" y1="9" x2="16" y2="9"/>
      <line x1="8" y1="13" x2="13" y2="13"/>
    </>
  ),
  'whatsapp': (
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
  ),
  'time': (
    <>
      <circle cx="8" cy="8" r="4"/>
      <circle cx="16" cy="8" r="4"/>
      <path d="M2 20v-1a4 4 0 014-4h4a4 4 0 014 4v1"/>
      <path d="M16 15a4 4 0 014 4v1"/>
    </>
  ),
  'relatorios': (
    <>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </>
  ),
  'configuracoes': (
    <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </>
  ),
  'iris': (
    <>
      <polygon points="12,2 22,12 12,22 2,12"/>
      <polygon points="12,7 17,12 12,17 7,12" opacity="0.5"/>
    </>
  ),
  'buscar': (
    <>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </>
  ),
  'notificacoes': (
    <>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </>
  ),
};

export type EssynIconName = keyof typeof iconPaths;

interface EssynIconProps {
  name: EssynIconName;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const EssynIcon: React.FC<EssynIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  strokeWidth = sw,
}) => {
  const paths = iconPaths[name];

  if (!paths) {
    console.warn(`[EssynIcon] Ícone "${name}" não encontrado.`);
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths}
    </svg>
  );
};

/** Lista de todos os nomes disponíveis */
export const essynIconNames = Object.keys(iconPaths) as EssynIconName[];

export default EssynIcon;
