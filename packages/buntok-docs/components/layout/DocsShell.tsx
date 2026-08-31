"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PrevNext } from "@/components/ui/PrevNext";
import { SearchDialog } from "@/components/ui/SearchDialog";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <SearchDialog />
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs />
            {children}
            <PrevNext />
          </div>
        </main>
        <TableOfContents />
      </div>
    </div>
  );
}
