/* ─── Types ─── */

export type ProjetoStatus =
  | "confirmado"
  | "producao"
  | "edicao"
  | "entregue"
  | "rascunho"
  | "atrasado";

export type ProjetoTipo =
  | "Casamento"
  | "Corporativo"
  | "Aniversário"
  | "Ensaio"
  | "Batizado"
  | "Formatura";

export interface Membro {
  nome: string;
  funcao: string;
  iniciais: string;
}

export interface Contato {
  nome: string;
  telefone: string;
  email: string;
  relacao: string;
}

export interface LocalEvento {
  nome: string;
  endereco: string;
  horario?: string;
}

export interface ProducaoInfo {
  etapasConcluidas: number;
  etapasTotal: number;
}

export interface FinanceiroInfo {
  parcelas: number;
  pagas: number;
  vencidas: number;
}

export type FormaPagamento = "pix" | "cartao" | "boleto" | "transferencia" | "dinheiro";

export interface PaymentPlanInfo {
  valorTotal: number;
  entradaPercent: number;
  entradaData: string;
  formaPagamento: FormaPagamento;
  numeroParcelas: number;
  primeiraParcelaData: string;
  intervaloMeses: number;
  status?: "rascunho" | "ativo";
}

export interface Projeto {
  id: string;
  nome: string;
  cliente: string;
  tipo: ProjetoTipo;
  dataEvento: string;
  /** ISO date for sorting/filtering (YYYY-MM-DD) */
  dataISO: string;
  diaSemana: string;
  horario: string;
  local: string;
  equipe: Membro[];
  status: ProjetoStatus;
  producao: ProducaoInfo;
  financeiro: FinanceiroInfo;
  pacote: string;
  itensPacote: string[];
  prazoEntrega: string;
  contatos: Contato[];
  locais: LocalEvento[];
  valor: string;
  fotos: number;
  ano: number;
  /** Optional payment plan — syncs to Financeiro */
  paymentPlan?: PaymentPlanInfo;
}

/* ─── Status config ─── */

export const statusConfig: Record<
  ProjetoStatus,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  confirmado: {
    bg: "bg-[#F0F0F0]",
    text: "text-[#7A7876]",
    border: "border-[#E5E5E7]",
    dot: "bg-[#8E8C8B]",
    label: "Confirmado",
  },
  producao: {
    bg: "bg-[#F0EDEB]",
    text: "text-[#9C8B7A]",
    border: "border-[#E0DCD7]",
    dot: "bg-[#9C8B7A]",
    label: "Produção",
  },
  edicao: {
    bg: "bg-[#F2F0F5]",
    text: "text-[#9B92B3]",
    border: "border-[#E0DCE8]",
    dot: "bg-[#9B92B3]",
    label: "Edição",
  },
  entregue: {
    bg: "bg-[#F0FAF4]",
    text: "text-[#34C759]",
    border: "border-[#D1F0D9]",
    dot: "bg-[#34C759]",
    label: "Entregue",
  },
  rascunho: {
    bg: "bg-[#F0F0F0]",
    text: "text-[#A4A2A1]",
    border: "border-[#E5E5E7]",
    dot: "bg-[#C6C5C5]",
    label: "Rascunho",
  },
  atrasado: {
    bg: "bg-[#F0EDEC]",
    text: "text-[#B8857C]",
    border: "border-[#E0D8D5]",
    dot: "bg-[#B8857C]",
    label: "Atrasado",
  },
};

/* ─── Mock data ─── */

export const projetos: Projeto[] = [
  {
    id: "proj-001",
    nome: "Casamento Oliveira & Santos",
    cliente: "Ana Oliveira",
    tipo: "Casamento",
    dataEvento: "15 Mar 2026",
    dataISO: "2026-03-15",
    diaSemana: "Dom",
    horario: "16:00 — 23:00",
    local: "Espaço Villa Real, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
      { nome: "Carlos Mendes", funcao: "Segundo fotógrafo", iniciais: "CM" },
      { nome: "Julia Farias", funcao: "Assistente", iniciais: "JF" },
    ],
    status: "edicao",
    producao: { etapasConcluidas: 3, etapasTotal: 5 },
    financeiro: { parcelas: 4, pagas: 3, vencidas: 0 },
    pacote: "Premium Completo",
    itensPacote: [
      "Cobertura integral (cerimônia + festa)",
      "Ensaio pré-wedding",
      "Álbum 30×30 com 60 páginas",
      "Pendrive personalizado",
      "Galeria online por 12 meses",
    ],
    prazoEntrega: "15 Abr 2026",
    contatos: [
      { nome: "Ana Oliveira", telefone: "(11) 99234-5678", email: "ana@email.com", relacao: "Noiva" },
      { nome: "Pedro Santos", telefone: "(11) 98765-4321", email: "pedro@email.com", relacao: "Noivo" },
      { nome: "Rosa Oliveira", telefone: "(11) 97654-3210", email: "rosa@email.com", relacao: "Mãe da noiva" },
    ],
    locais: [
      { nome: "Igreja São José", endereco: "R. Augusta, 1200 — SP", horario: "16:00" },
      { nome: "Espaço Villa Real", endereco: "Av. Paulista, 900 — SP", horario: "18:00" },
    ],
    valor: "R$ 8.500",
    fotos: 342,
    ano: 2026,
  },
  {
    id: "proj-002",
    nome: "Corporativo TechCo Annual",
    cliente: "TechCo Brasil",
    tipo: "Corporativo",
    dataEvento: "22 Mar 2026",
    dataISO: "2026-03-22",
    diaSemana: "Dom",
    horario: "09:00 — 18:00",
    local: "WTC Events, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
      { nome: "Lucas Prado", funcao: "Videógrafo", iniciais: "LP" },
    ],
    status: "producao",
    producao: { etapasConcluidas: 1, etapasTotal: 4 },
    financeiro: { parcelas: 2, pagas: 1, vencidas: 0 },
    pacote: "Corporativo Standard",
    itensPacote: [
      "Cobertura do evento completo",
      "Fotos de palco e plateia",
      "Retratos corporativos (até 30 pessoas)",
      "Entrega digital em alta resolução",
    ],
    prazoEntrega: "05 Abr 2026",
    contatos: [
      { nome: "João Silva", telefone: "(11) 91234-0000", email: "joao@techco.com.br", relacao: "Gerente de eventos" },
    ],
    locais: [
      { nome: "WTC Events Center", endereco: "Av. das Nações Unidas, 12.551 — SP", horario: "09:00" },
    ],
    valor: "R$ 4.200",
    fotos: 128,
    ano: 2026,
  },
  {
    id: "proj-003",
    nome: "Aniversário 15 Anos — Sofia",
    cliente: "Maria Santos",
    tipo: "Aniversário",
    dataEvento: "28 Mar 2026",
    dataISO: "2026-03-28",
    diaSemana: "Sáb",
    horario: "19:00 — 02:00",
    local: "Buffet Encanto, SP",
    equipe: [
      { nome: "Carlos Mendes", funcao: "Fotógrafo principal", iniciais: "CM" },
      { nome: "Julia Farias", funcao: "Assistente", iniciais: "JF" },
    ],
    status: "confirmado",
    producao: { etapasConcluidas: 0, etapasTotal: 0 },
    financeiro: { parcelas: 3, pagas: 2, vencidas: 0 },
    pacote: "Festa Completa",
    itensPacote: [
      "Cobertura completa da festa",
      "Making of da aniversariante",
      "Álbum 25×25 com 40 páginas",
      "Galeria online por 6 meses",
    ],
    prazoEntrega: "28 Abr 2026",
    contatos: [
      { nome: "Maria Santos", telefone: "(11) 99876-5432", email: "maria@email.com", relacao: "Mãe" },
      { nome: "Sofia Santos", telefone: "(11) 99876-5433", email: "sofia@email.com", relacao: "Aniversariante" },
    ],
    locais: [
      { nome: "Buffet Encanto", endereco: "R. Oscar Freire, 450 — SP", horario: "19:00" },
    ],
    valor: "R$ 3.800",
    fotos: 0,
    ano: 2026,
  },
  {
    id: "proj-004",
    nome: "Batizado Gabriel Costa",
    cliente: "Pedro Costa",
    tipo: "Batizado",
    dataEvento: "05 Abr 2026",
    dataISO: "2026-04-05",
    diaSemana: "Dom",
    horario: "10:00 — 14:00",
    local: "Paróquia N. Sra. Aparecida",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
    ],
    status: "atrasado",
    producao: { etapasConcluidas: 2, etapasTotal: 3 },
    financeiro: { parcelas: 2, pagas: 1, vencidas: 1 },
    pacote: "Essencial",
    itensPacote: [
      "Cobertura da cerimônia",
      "Fotos com a família",
      "Entrega digital (galeria online 3 meses)",
    ],
    prazoEntrega: "20 Abr 2026",
    contatos: [
      { nome: "Pedro Costa", telefone: "(11) 98765-1111", email: "pedro.c@email.com", relacao: "Pai" },
      { nome: "Camila Costa", telefone: "(11) 98765-2222", email: "camila.c@email.com", relacao: "Mãe" },
    ],
    locais: [
      { nome: "Paróquia N. Sra. Aparecida", endereco: "R. Cardeal Arcoverde, 100 — SP", horario: "10:00" },
      { nome: "Restaurante Famiglia", endereco: "R. Bela Cintra, 300 — SP", horario: "12:00" },
    ],
    valor: "R$ 1.800",
    fotos: 64,
    ano: 2026,
  },
  {
    id: "proj-005",
    nome: "Ensaio Gestante — Família Lima",
    cliente: "Fernanda Lima",
    tipo: "Ensaio",
    dataEvento: "10 Abr 2026",
    dataISO: "2026-04-10",
    diaSemana: "Sex",
    horario: "07:00 — 09:00",
    local: "Parque Ibirapuera, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
    ],
    status: "entregue",
    producao: { etapasConcluidas: 4, etapasTotal: 4 },
    financeiro: { parcelas: 1, pagas: 1, vencidas: 0 },
    pacote: "Ensaio Premium",
    itensPacote: [
      "Ensaio externo (até 2h)",
      "Tratamento profissional (30 fotos)",
      "Entrega digital",
      "Mini álbum 20×20",
    ],
    prazoEntrega: "24 Abr 2026",
    contatos: [
      { nome: "Fernanda Lima", telefone: "(11) 99111-2233", email: "fe.lima@email.com", relacao: "Cliente" },
      { nome: "Lucas Lima", telefone: "(11) 99111-3344", email: "lucas.lima@email.com", relacao: "Marido" },
    ],
    locais: [
      { nome: "Parque Ibirapuera", endereco: "Av. Pedro Álvares Cabral — SP", horario: "07:00" },
    ],
    valor: "R$ 1.200",
    fotos: 86,
    ano: 2026,
  },
  {
    id: "proj-006",
    nome: "Formatura Direito UFMG",
    cliente: "Carla Dias",
    tipo: "Formatura",
    dataEvento: "12 Abr 2026",
    dataISO: "2026-04-12",
    diaSemana: "Dom",
    horario: "18:00 — 01:00",
    local: "Chevrolet Hall, BH",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
      { nome: "Carlos Mendes", funcao: "Segundo fotógrafo", iniciais: "CM" },
      { nome: "Lucas Prado", funcao: "Videógrafo", iniciais: "LP" },
    ],
    status: "producao",
    producao: { etapasConcluidas: 2, etapasTotal: 6 },
    financeiro: { parcelas: 5, pagas: 2, vencidas: 1 },
    pacote: "Formatura Premium",
    itensPacote: [
      "Cobertura integral do baile",
      "Retratos individuais e de grupo",
      "Galeria online por 12 meses",
    ],
    prazoEntrega: "12 Mai 2026",
    contatos: [
      { nome: "Carla Dias", telefone: "(31) 99876-0000", email: "carla.dias@email.com", relacao: "Formanda / Comissão" },
    ],
    locais: [
      { nome: "Chevrolet Hall", endereco: "Av. Nossa Senhora do Carmo, 230 — BH", horario: "18:00" },
    ],
    valor: "R$ 6.500",
    fotos: 210,
    ano: 2026,
  },
  {
    id: "proj-007",
    nome: "Casamento Pereira & Alves",
    cliente: "Beatriz Pereira",
    tipo: "Casamento",
    dataEvento: "18 Abr 2026",
    dataISO: "2026-04-18",
    diaSemana: "Sáb",
    horario: "15:00 — 22:00",
    local: "Fazenda Santa Clara, Campinas",
    equipe: [
      { nome: "Carlos Mendes", funcao: "Fotógrafo principal", iniciais: "CM" },
      { nome: "Julia Farias", funcao: "Assistente", iniciais: "JF" },
    ],
    status: "rascunho",
    producao: { etapasConcluidas: 0, etapasTotal: 0 },
    financeiro: { parcelas: 0, pagas: 0, vencidas: 0 },
    pacote: "Standard",
    itensPacote: [
      "Cobertura cerimônia + recepção",
      "Entrega digital",
      "Galeria online por 6 meses",
    ],
    prazoEntrega: "18 Mai 2026",
    contatos: [
      { nome: "Beatriz Pereira", telefone: "(19) 99888-7766", email: "bia.pereira@email.com", relacao: "Noiva" },
    ],
    locais: [
      { nome: "Fazenda Santa Clara", endereco: "Rod. D. Pedro I, km 138 — Campinas", horario: "15:00" },
    ],
    valor: "R$ 5.200",
    fotos: 0,
    ano: 2026,
  },
  {
    id: "proj-008",
    nome: "Ensaio Newborn — Baby Theo",
    cliente: "Amanda Rocha",
    tipo: "Ensaio",
    dataEvento: "02 Fev 2026",
    dataISO: "2026-02-02",
    diaSemana: "Seg",
    horario: "09:00 — 12:00",
    local: "Studio ESSYN, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
    ],
    status: "entregue",
    producao: { etapasConcluidas: 3, etapasTotal: 3 },
    financeiro: { parcelas: 1, pagas: 1, vencidas: 0 },
    pacote: "Newborn Completo",
    itensPacote: [
      "Ensaio em studio (até 3h)",
      "Tratamento profissional (40 fotos)",
      "Álbum 20×20",
      "Quadro 30×40",
    ],
    prazoEntrega: "16 Fev 2026",
    contatos: [
      { nome: "Amanda Rocha", telefone: "(11) 99222-4455", email: "amanda.r@email.com", relacao: "Mãe" },
    ],
    locais: [
      { nome: "Studio ESSYN", endereco: "R. Haddock Lobo, 595 — SP", horario: "09:00" },
    ],
    valor: "R$ 2.400",
    fotos: 156,
    ano: 2026,
  },
  {
    id: "proj-009",
    nome: "Casamento Fernandes & Lopes",
    cliente: "Juliana Fernandes",
    tipo: "Casamento",
    dataEvento: "21 Fev 2026",
    dataISO: "2026-02-21",
    diaSemana: "Sáb",
    horario: "17:00 — 00:00",
    local: "Espaço Jardim, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
      { nome: "Carlos Mendes", funcao: "Segundo fotógrafo", iniciais: "CM" },
      { nome: "Julia Farias", funcao: "Assistente", iniciais: "JF" },
      { nome: "Lucas Prado", funcao: "Videógrafo", iniciais: "LP" },
    ],
    status: "producao",
    producao: { etapasConcluidas: 1, etapasTotal: 5 },
    financeiro: { parcelas: 4, pagas: 2, vencidas: 1 },
    pacote: "Premium Gold",
    itensPacote: [
      "Cobertura integral",
      "Ensaio pré-wedding",
      "Álbum premium",
      "Drone",
    ],
    prazoEntrega: "21 Mar 2026",
    contatos: [
      { nome: "Juliana Fernandes", telefone: "(11) 99333-4455", email: "ju.fernandes@email.com", relacao: "Noiva" },
    ],
    locais: [
      { nome: "Espaço Jardim", endereco: "Av. Morumbi, 1500 — SP", horario: "17:00" },
    ],
    valor: "R$ 12.000",
    fotos: 0,
    ano: 2026,
  },
  {
    id: "proj-010",
    nome: "Corporativo Fintech Summit",
    cliente: "NuBank Events",
    tipo: "Corporativo",
    dataEvento: "25 Fev 2026",
    dataISO: "2026-02-25",
    diaSemana: "Qua",
    horario: "08:00 — 20:00",
    local: "Pro Magno, SP",
    equipe: [
      { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
      { nome: "Lucas Prado", funcao: "Videógrafo", iniciais: "LP" },
    ],
    status: "confirmado",
    producao: { etapasConcluidas: 0, etapasTotal: 3 },
    financeiro: { parcelas: 2, pagas: 2, vencidas: 0 },
    pacote: "Corporativo Premium",
    itensPacote: [
      "Cobertura full day",
      "Retratos corporativos",
    ],
    prazoEntrega: "10 Mar 2026",
    contatos: [
      { nome: "Renata Alves", telefone: "(11) 91000-2233", email: "renata@nubank.com", relacao: "Head of Events" },
    ],
    locais: [
      { nome: "Pro Magno", endereco: "Av. Profa. Ida Kolb, 513 — SP", horario: "08:00" },
    ],
    valor: "R$ 7.800",
    fotos: 0,
    ano: 2026,
  },
];