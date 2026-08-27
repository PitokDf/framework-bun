import type { Metadata } from "next";
import { DocsShell } from "@/components/layout/DocsShell";

export const metadata: Metadata = {
  title: {
    default: "Buntok Framework - Documentation",
    template: "%s | Buntok Framework",
  },
  alternates: {
    canonical: "https://buntok.pitok.my.id/docs",
  },
  description:
    "Complete documentation for Buntok - a fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
  openGraph: {
    title: "Buntok Framework Documentation",
    description:
      "Fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
    type: "website",
    siteName: "Buntok Framework",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework Documentation",
    description:
      "Fast, type-safe web framework for Bun with built-in auth, validation, caching, and more.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Documentation",
      },
    ],
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
