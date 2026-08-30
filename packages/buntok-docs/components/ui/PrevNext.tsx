"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAdjacentRoutes } from "@/lib/doc-routes";

export function PrevNext() {
  const pathname = usePathname();
  const { prev, next } = getAdjacentRoutes(pathname);

  if (!prev && !next) return null;

  return (
    <div className="grid grid-cols-2 mt-8 pt-4 border-t border-border-primary gap-3">
      {prev ? (
        <Link
          href={prev.href}
          className="group px-3 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:border-accent/50 hover:bg-accent-muted/30 transition-all"
        >
          <span className="text-[11px] text-text-secondary flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Previous
          </span>
          <span className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group px-3 py-2 w-full rounded-lg border border-border-primary bg-bg-secondary hover:border-accent/50 hover:bg-accent-muted/30 transition-all text-right ml-auto"
        >
          <span className="text-[11px] text-text-secondary flex items-center justify-end gap-1">
            Next <ChevronRight className="w-3 h-3" />
          </span>
          <span className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
