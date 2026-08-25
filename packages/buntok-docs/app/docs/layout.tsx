import type { Metadata } from "next";
import { DocsShell } from "@/components/layout/DocsShell";

export const metadata: Metadata = {
  title: {
    default: "Buntok Framework — Documentation",
    template: "%s | Buntok Framework",
  },
  description:
    "Complete documentation for Buntok — a fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
  openGraph: {
    title: "Buntok Framework Documentation",
    description:
      "Fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
    type: "website",
    siteName: "Buntok Framework",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework Documentation",
    description:
      "Fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
