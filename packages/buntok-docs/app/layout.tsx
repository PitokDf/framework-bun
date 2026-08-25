import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://buntok.dev";

export const metadata: Metadata = {
  title: {
    default: "Buntok Framework — Fast Web Framework for Bun",
    template: "%s | Buntok Framework",
  },
  description:
    "A fast, type-safe web framework for Bun with built-in auth, validation, caching, rate limiting, and zero dependencies. Decorator-first or functional API.",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Buntok Framework",
    description:
      "Fast, type-safe web framework for Bun. Built-in auth, validation, caching, rate limiting. Zero config.",
    url: baseUrl,
    siteName: "Buntok Framework",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework",
    description:
      "Fast, type-safe web framework for Bun. Built-in auth, validation, caching, rate limiting. Zero config.",
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
