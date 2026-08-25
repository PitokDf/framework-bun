"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // Wait for DOM to update after navigation
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll("h1, h2, h3, h4");
      const items: TocItem[] = Array.from(elements).map((el) => ({
        id: el.id || el.textContent?.toLowerCase().replace(/\s+/g, "-") || "",
        text: el.textContent || "",
        level: parseInt(el.tagName.charAt(1)),
      }));
      setHeadings(items);
      setActiveId("");
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    // Small delay to ensure DOM elements exist
    const timer = setTimeout(() => {
      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24">
        <h4 className="font-semibold text-sm text-text-primary mb-3">
          On this page
        </h4>
        <ul className="space-y-2 text-sm">
          {headings.map((heading, index) => (
            <li
              key={`${heading.id}-${index}`}
              style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className={`
                  block py-1 transition-colors
                  ${
                    activeId === heading.id
                      ? "text-accent font-medium"
                      : "text-text-secondary hover:text-text-primary"
                  }
                `}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
