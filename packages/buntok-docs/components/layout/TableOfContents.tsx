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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24">
        <h4 className="font-semibold text-sm text-text-primary mb-3">
          On this page
        </h4>
        <ul className="space-y-1 text-sm">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;

            return (
              <li key={`${heading.id}-${index}`}>
                <button
                  onClick={() => scrollTo(heading.id)}
                  className={`
                    w-full text-left block py-1 px-2 rounded transition-colors border-l-2
                    ${
                      isActive
                        ? "border-accent text-accent font-medium bg-accent-muted"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                    }
                  `}
                >
                  {heading.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
