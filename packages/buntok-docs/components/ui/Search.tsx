"use client";

import { Search as SearchIcon, FileText, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SearchResult {
  title: string;
  section: string;
  href: string;
  content?: string;
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      setIsOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  // Mock search results (in real app, this would call API)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Simple client-side search mock
    const mockResults: SearchResult[] = [
      { title: "Routing", section: "Core", href: "/docs/routing" },
      { title: "Controllers", section: "Core", href: "/docs/controllers" },
      { title: "Decorators", section: "Core", href: "/docs/decorators" },
      { title: "Context", section: "Core", href: "/docs/context" },
      { title: "Validation", section: "Core", href: "/docs/validation" },
      { title: "File Upload", section: "Features", href: "/docs/upload" },
      { title: "Middleware", section: "Features", href: "/docs/middleware" },
      { title: "Helpers", section: "Features", href: "/docs/helpers" },
      { title: "Error Handling", section: "Features", href: "/docs/error-handling" },
      { title: "Authentication", section: "Auth", href: "/docs/auth" },
      { title: "RBAC", section: "Auth", href: "/docs/rbac" },
      { title: "Event Emitter", section: "Integrations", href: "/docs/emitter" },
      { title: "Cache", section: "Integrations", href: "/docs/cache" },
      { title: "CLI", section: "Tools", href: "/docs/cli" },
    ];

    const filtered = mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.section.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-primary bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors text-sm"
      >
        <SearchIcon className="w-4 h-4" />
        <span>Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary text-xs text-text-secondary border border-border-primary">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      <dialog
        ref={dialogRef}
        open={isOpen}
        className="fixed inset-0 z-50 w-full max-w-2xl mx-auto mt-20 rounded-xl border border-border-primary bg-bg-primary shadow-2xl backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            setIsOpen(false);
            setQuery("");
          }
        }}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border-primary">
          <SearchIcon className="w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 py-4 bg-transparent text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <kbd
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="px-2 py-1 rounded bg-bg-tertiary text-xs text-text-secondary border border-border-primary cursor-pointer hover:bg-border-primary transition-colors"
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <Link
                  key={result.href}
                  href={result.href}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      index === selectedIndex
                        ? "bg-accent-muted text-accent"
                        : "hover:bg-bg-tertiary"
                    }
                  `}
                >
                  <FileText className="w-4 h-4 text-text-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-text-secondary">
                      {result.section}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-secondary shrink-0" />
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-text-secondary">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-8 text-center text-text-secondary">
              Start typing to search...
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
