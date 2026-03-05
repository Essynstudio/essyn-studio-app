import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderKanban,
  Users,
  Calendar,
  DollarSign,
  Images,
  Search,
  Loader2,
} from "lucide-react";
import { type SearchResult, type SearchResultType } from "../../lib/useGlobalSearch";

/* ─── Category Config ─── */

const categoryConfig: Record<
  SearchResultType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  projeto: {
    label: "Projetos",
    icon: <FolderKanban className="w-3.5 h-3.5" />,
    color: "#007AFF",
  },
  cliente: {
    label: "Clientes",
    icon: <Users className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  evento: {
    label: "Eventos",
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  financeiro: {
    label: "Financeiro",
    icon: <DollarSign className="w-3.5 h-3.5" />,
    color: "#636366",
  },
  galeria: {
    label: "Galerias",
    icon: <Images className="w-3.5 h-3.5" />,
    color: "#007AFF",
  },
};

/* ─── Result Item ─── */

function ResultItem({
  result,
  isSelected,
  onClick,
  query,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  query: string;
}) {
  const config = categoryConfig[result.type];
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  // Highlight matching text
  function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[#FEF3C7] text-[#1D1D1F] rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
        isSelected ? "bg-[#F5F1EA]" : "bg-white hover:bg-[#FAFAFA]"
      }`}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{
          backgroundColor: isSelected ? "#FFFFFF" : "#F5F5F7",
          color: config.color,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] text-[#1D1D1F] truncate"
          style={{ fontWeight: 500 }}
        >
          {highlightText(result.title, query)}
        </p>
        {result.subtitle && (
          <p
            className="text-[12px] text-[#636366] truncate"
            style={{ fontWeight: 400 }}
          >
            {highlightText(result.subtitle, query)}
          </p>
        )}
      </div>

      {/* Metadata */}
      {result.metadata && (
        <span
          className="text-[11px] text-[#8E8E93] shrink-0"
          style={{ fontWeight: 400 }}
        >
          {result.metadata}
        </span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  groupedResults: Record<SearchResultType, SearchResult[]>;
  isSearching: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchResults({
  query,
  results,
  groupedResults,
  isSearching,
  isOpen,
  onClose,
}: SearchResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Ignore clicks on search input
      if (target.closest('input[type="text"]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleNavigate(results[selectedIndex].url);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  function handleNavigate(url: string) {
    navigate(url);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {(query.trim() || isSearching) && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden z-50"
          style={{ 
            maxHeight: "480px",
            boxShadow: "0 8px 32px #E5E5EA"
          }}
        >
          {/* Loading state */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#8E8E93] animate-spin" />
            </div>
          )}

          {/* No results */}
          {!isSearching && query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-[#8E8E93]" />
              </div>
              <p
                className="text-[14px] text-[#636366] text-center"
                style={{ fontWeight: 500 }}
              >
                Nenhum resultado encontrado
              </p>
              <p
                className="text-[12px] text-[#8E8E93] text-center mt-1"
                style={{ fontWeight: 400 }}
              >
                Tente buscar por outro termo
              </p>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
              {/* Group by category */}
              {(Object.keys(groupedResults) as SearchResultType[]).map((type) => {
                const items = groupedResults[type];
                if (items.length === 0) return null;

                const config = categoryConfig[type];
                const startIndex = results.findIndex((r) => r.type === type);

                return (
                  <div key={type} className="border-b border-[#F2F2F7] last:border-b-0">
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border-b border-[#F2F2F7]">
                      <span style={{ color: config.color }}>{config.icon}</span>
                      <span
                        className="text-[11px] text-[#636366] uppercase tracking-wider"
                        style={{ fontWeight: 600 }}
                      >
                        {config.label}
                      </span>
                      <span
                        className="text-[11px] text-[#8E8E93]"
                        style={{ fontWeight: 400 }}
                      >
                        ({items.length})
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((result, idx) => (
                      <ResultItem
                        key={result.id}
                        result={result}
                        isSelected={selectedIndex === startIndex + idx}
                        onClick={() => handleNavigate(result.url)}
                        query={query}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#F2F2F7] bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <kbd
                    className="text-[10px] text-[#8E8E93] bg-white border border-[#E5E5EA] rounded px-1.5 py-0.5"
                    style={{ fontWeight: 500 }}
                  >
                    ↑
                  </kbd>
                  <kbd
                    className="text-[10px] text-[#8E8E93] bg-white border border-[#E5E5EA] rounded px-1.5 py-0.5"
                    style={{ fontWeight: 500 }}
                  >
                    ↓
                  </kbd>
                  <span
                    className="text-[11px] text-[#8E8E93] ml-1"
                    style={{ fontWeight: 400 }}
                  >
                    navegar
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd
                    className="text-[10px] text-[#8E8E93] bg-white border border-[#E5E5EA] rounded px-1.5 py-0.5"
                    style={{ fontWeight: 500 }}
                  >
                    ↵
                  </kbd>
                  <span
                    className="text-[11px] text-[#8E8E93] ml-1"
                    style={{ fontWeight: 400 }}
                  >
                    abrir
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd
                    className="text-[10px] text-[#8E8E93] bg-white border border-[#E5E5EA] rounded px-1.5 py-0.5"
                    style={{ fontWeight: 500 }}
                  >
                    esc
                  </kbd>
                  <span
                    className="text-[11px] text-[#8E8E93] ml-1"
                    style={{ fontWeight: 400 }}
                  >
                    fechar
                  </span>
                </div>
              </div>
              <span
                className="text-[11px] text-[#8E8E93]"
                style={{ fontWeight: 400 }}
              >
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}