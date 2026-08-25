"use client";

import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const activeTab = "docs"; // This can be dynamic based on the current route
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-primary bg-bg-primary/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 mr-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}favicon.ico`}
            alt="Buntok"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-base tracking-tight">Buntok</span>
        </Link>
        <div className="hidden ml-3 sm:flex items-center gap-1 flex-1">
          {(["docs", "benchmarks"] as const).map((tab) => (
            <Link
              key={tab}
              href={tab}
              className={`px-3 py-1.5 text-primary rounded-md text-sm font-medium transition-colors capitalize 
                  ${
                    activeTab === tab
                      ? "bg-accent-muted text-accent font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                  }
                `}
            >
              {tab === "benchmarks"
                ? "Benchmarks"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="https://github.com/PitokDf/framework-bun"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="GitHub"
          >
            <svg
              className="w-5 h-5 text-text-secondary hover:text-accent"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
