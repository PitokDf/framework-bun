"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { DOC_ROUTES } from "@/lib/doc-routes";

interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

function buildNavigation(): NavItem[] {
  const groups: NavItem[] = [];
  let currentSection: string | null = null;
  let currentGroup: NavItem | null = null;

  for (const route of DOC_ROUTES) {
    if (route.section === "Getting Started") {
      groups.push({ title: route.title, href: route.href });
      continue;
    }

    if (route.section !== currentSection) {
      currentSection = route.section;
      currentGroup = { title: route.section, items: [] };
      groups.push(currentGroup);
    }

    currentGroup!.items!.push({ title: route.title, href: route.href });
  }

  return groups;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useMemo(() => buildNavigation(), []);

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
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 overflow-y-auto border-r border-border-primary bg-bg-primary
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
              className="w-full pl-9 pr-4 py-2 rounded-full border border-border-primary bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/30 focus:bg-accent-muted transition-colors text-sm"
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
          block px-3 py-2 text-sm transition-colors border-l-2 -ml-px
          ${
            isActive
              ? "border-accent bg-accent-muted text-accent font-medium"
              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
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
        className="sidebar-section flex items-center justify-between w-full px-3 py-2 text-text-primary hover:bg-bg-tertiary transition-colors rounded-lg"
      >
        {item.title}
        <ChevronRight
          className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>
      {isOpen && hasChildren && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-border-primary pl-3">
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
