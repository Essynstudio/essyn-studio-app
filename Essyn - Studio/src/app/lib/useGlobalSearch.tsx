import { useState, useEffect, useMemo } from "react";
import { projetos } from "../components/projetos/projetosData";

/* ─── Search Result Types ─── */

export type SearchResultType = "projeto" | "cliente" | "evento" | "financeiro" | "galeria";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  metadata?: string;
  url: string;
  matchScore: number;
}

/* ─── Search Index Builder ─── */

function buildSearchIndex(): SearchResult[] {
  const index: SearchResult[] = [];

  // Index projetos
  projetos.forEach((projeto) => {
    index.push({
      id: projeto.id,
      type: "projeto",
      title: projeto.nome,
      subtitle: projeto.cliente,
      metadata: `${projeto.tipo} · ${projeto.status}`,
      url: `/projetos?id=${projeto.id}`,
      matchScore: 0,
    });
  });

  // Mock clientes (derived from projetos)
  const uniqueClientes = Array.from(new Set(projetos.map((p) => p.cliente)));
  uniqueClientes.forEach((cliente, idx) => {
    index.push({
      id: `cliente-${idx}`,
      type: "cliente",
      title: cliente,
      subtitle: "Cliente",
      metadata: `${projetos.filter((p) => p.cliente === cliente).length} projeto(s)`,
      url: `/crm?cliente=${encodeURIComponent(cliente)}`,
      matchScore: 0,
    });
  });

  // Mock eventos (próximos)
  const mockEventos = [
    {
      id: "evt-1",
      title: "Casamento Fernandes",
      date: "15/03/2026",
      local: "Villa Bisutti",
      url: "/agenda?id=evt-1",
    },
    {
      id: "evt-2",
      title: "Ensaio Família Costa",
      date: "18/03/2026",
      local: "Parque Ibirapuera",
      url: "/agenda?id=evt-2",
    },
    {
      id: "evt-3",
      title: "Aniversário 15 anos - Julia",
      date: "22/03/2026",
      local: "Buffet Festa Kids",
      url: "/agenda?id=evt-3",
    },
  ];

  mockEventos.forEach((evento) => {
    index.push({
      id: evento.id,
      type: "evento",
      title: evento.title,
      subtitle: evento.local,
      metadata: evento.date,
      url: evento.url,
      matchScore: 0,
    });
  });

  // Mock lançamentos financeiros
  const mockFinanceiro = [
    {
      id: "fin-1",
      title: "Recebimento - Casamento Silva",
      value: "R$ 2.500",
      date: "10/03/2026",
      url: "/financeiro?id=fin-1",
    },
    {
      id: "fin-2",
      title: "Nota Fiscal - Formatura Oliveira",
      value: "R$ 4.200",
      date: "12/03/2026",
      url: "/financeiro?id=fin-2",
    },
    {
      id: "fin-3",
      title: "Pagamento - Aluguel Equipamento",
      value: "R$ 800",
      date: "05/03/2026",
      url: "/financeiro?id=fin-3",
    },
  ];

  mockFinanceiro.forEach((lancamento) => {
    index.push({
      id: lancamento.id,
      type: "financeiro",
      title: lancamento.title,
      subtitle: lancamento.value,
      metadata: lancamento.date,
      url: lancamento.url,
      matchScore: 0,
    });
  });

  // Mock galerias
  const mockGalerias = [
    {
      id: "gal-1",
      title: "Casamento Silva - Galeria Final",
      cliente: "Maria Silva",
      fotos: 120,
      url: "/galeria?id=gal-1",
    },
    {
      id: "gal-2",
      title: "Ensaio Gestante - Ana Costa",
      cliente: "Ana Costa",
      fotos: 45,
      url: "/galeria?id=gal-2",
    },
    {
      id: "gal-3",
      title: "Aniversário 50 anos - João Martins",
      cliente: "João Martins",
      fotos: 80,
      url: "/galeria?id=gal-3",
    },
  ];

  mockGalerias.forEach((galeria) => {
    index.push({
      id: galeria.id,
      type: "galeria",
      title: galeria.title,
      subtitle: galeria.cliente,
      metadata: `${galeria.fotos} fotos`,
      url: galeria.url,
      matchScore: 0,
    });
  });

  return index;
}

/* ─── Search Algorithm ─── */

function calculateMatchScore(item: SearchResult, query: string): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle || "").toLowerCase();
  const metadata = (item.metadata || "").toLowerCase();

  let score = 0;

  // Exact match (highest priority)
  if (title === q) score += 100;
  if (subtitle === q) score += 80;

  // Starts with query
  if (title.startsWith(q)) score += 50;
  if (subtitle.startsWith(q)) score += 40;

  // Contains query
  if (title.includes(q)) score += 30;
  if (subtitle.includes(q)) score += 20;
  if (metadata.includes(q)) score += 10;

  // Word match (split by space)
  const titleWords = title.split(" ");
  const queryWords = q.split(" ");
  queryWords.forEach((word) => {
    if (titleWords.some((w) => w.startsWith(word))) score += 15;
  });

  return score;
}

function searchIndex(index: SearchResult[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  return index
    .map((item) => ({
      ...item,
      matchScore: calculateMatchScore(item, query),
    }))
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15); // Max 15 results
}

/* ─── Hook ─── */

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Build search index (memoized)
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  // Debounce query (300ms)
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search results (memoized)
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchIndex(searchIndex, debouncedQuery);
  }, [searchIndex, debouncedQuery]);

  // Group by type
  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      projeto: [],
      cliente: [],
      evento: [],
      financeiro: [],
      galeria: [],
    };

    results.forEach((result) => {
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  return {
    query,
    setQuery,
    isSearching,
    results,
    groupedResults,
    hasResults: results.length > 0,
  };
}
