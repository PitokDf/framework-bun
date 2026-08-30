"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  { title: "Getting Started", href: "/docs" },
  {
    title: "Fundamentals",
    items: [
      { title: "Routing", href: "/docs/routing" },
      { title: "Controllers", href: "/docs/controllers" },
      { title: "Decorators", href: "/docs/decorators" },
      { title: "Context", href: "/docs/context" },
      { title: "Validation", href: "/docs/validation" },
      { title: "Middleware", href: "/docs/middleware" },
      { title: "Error Handling", href: "/docs/error-handling" },
      { title: "File Upload", href: "/docs/upload" },
    ],
  },
  {
    title: "Authentication",
    items: [
      { title: "JWT Authentication", href: "/docs/auth" },
      { title: "OAuth Social Login", href: "/docs/oauth" },
      { title: "RBAC", href: "/docs/rbac" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { title: "App Configuration", href: "/docs/app-config" },
      { title: "IoC Container", href: "/docs/ioc" },
      { title: "Logger", href: "/docs/logger" },
      { title: "SSE", href: "/docs/sse" },
      { title: "WebSocket", href: "/docs/websocket" },
      { title: "Static Files", href: "/docs/static-files" },
      { title: "Event Emitter", href: "/docs/emitter" },
      { title: "Testing", href: "/docs/testing" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "Cache", href: "/docs/cache" },
      { title: "Mailer", href: "/docs/mailer" },
      { title: "Template Engine", href: "/docs/template" },
      { title: "Queue", href: "/docs/queue" },
      { title: "Scheduler", href: "/docs/scheduler" },
    ],
  },
  {
    title: "Utilities",
    items: [
      { title: "Helpers", href: "/docs/helpers" },
      { title: "Timezone", href: "/docs/timezone" },
      { title: "AI Module", href: "/docs/ai" },
      { title: "Vector Search", href: "/docs/vector-search" },
      { title: "API Docs", href: "/docs/api-docs" },
      { title: "Repository", href: "/docs/repository" },
      { title: "Audit Log", href: "/docs/audit-log" },
      { title: "Health Check", href: "/docs/health-check" },
      { title: "CLI", href: "/docs/cli" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-border-primary bg-bg-primary
          transition-transform duration-200 ease-in-out
          lg:sticky lg:translate-x-0 lg:block
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavItemComponent
                key={item.title}
                item={item}
                pathname={pathname}
                searchQuery={searchQuery}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

function NavItemComponent({
  item,
  pathname,
  searchQuery,
}: {
  item: NavItem;
  pathname: string;
  searchQuery: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = item.href === pathname;
  const hasChildren = item.items && item.items.length > 0;

  // Filter items based on search query
  if (searchQuery && hasChildren) {
    const filteredItems = item.items!.filter((child) =>
      child.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredItems.length === 0) return null;
  }

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={`
          block px-3 py-2 rounded-lg text-sm transition-colors
          ${
            isActive
              ? "bg-accent-muted text-accent font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          }
        `}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
      >
        {item.title}
        <ChevronRight
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>
      {isOpen && hasChildren && (
        <div className="ml-3 mt-1 space-y-1 border-l border-border-primary pl-3">
          {item.items!.map((child) => (
            <NavItemComponent
              key={child.title}
              item={child}
              pathname={pathname}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
