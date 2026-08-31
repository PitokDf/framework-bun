"use client";

import { createElement, ReactNode } from "react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface HeadingProps {
  level: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

export function Heading({ level, children, className }: HeadingProps) {
  const tag = `h${level}` as const;
  const text = typeof children === "string" ? children : "";
  const id = slugify(text);

  return createElement(
    tag,
    { id, className: className ? `${className} group/heading scroll-mt-24` : "group/heading scroll-mt-24" },
    <>
      {children}
      {id && (
        <a
          href={`#${id}`}
          className="ml-2 opacity-0 group-hover/heading:opacity-100 text-accent font-normal no-underline transition-opacity"
          aria-label="Permalink"
        >
          #
        </a>
      )}
    </>
  );
}
