"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, CornerDownLeft } from "lucide-react";
import { searchDocs, type SearchResult } from "@/lib/search-index";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setResults(searchDocs(query));
    setSelectedIdx(0);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-bg-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary">
          <Search className="w-4 h-4 text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-text-secondary bg-bg-tertiary border border-border-primary rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(r.href)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    i === selectedIdx
                      ? "bg-accent-muted/50"
                      : "hover:bg-bg-tertiary"
                  }`}
                >
                  <FileText className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {r.title}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {r.section}
                    </div>
                    {r.snippet && (
                      <div className="text-xs text-text-secondary/70 mt-1 line-clamp-2">
                        {r.snippet}
                      </div>
                    )}
                  </div>
                  {i === selectedIdx && (
                    <CornerDownLeft className="w-3 h-3 text-text-secondary mt-1 shrink-0 ml-auto" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">
            No results found for &quot;{query}&quot;
          </div>
        )}

        {!query && (
          <div className="px-4 py-6 text-center text-sm text-text-secondary">
            Start typing to search...
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-primary flex items-center gap-4 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border-primary rounded font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border-primary rounded font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border-primary rounded font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
