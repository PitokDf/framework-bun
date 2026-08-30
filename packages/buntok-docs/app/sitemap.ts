import type { MetadataRoute } from "next";
import { DOC_ROUTES } from "@/lib/doc-routes";

const baseUrl = "https://buntok.pitok.my.id";

// Static lastModified to avoid churn on each build (vs new Date() every build)
const lastModified = new Date("2026-08-31");

export default function sitemap(): MetadataRoute.Sitemap {
  // Exclude "/docs" itself from docsEntries (handled separately) to avoid duplicate
  const docsEntries: MetadataRoute.Sitemap = DOC_ROUTES.filter(
    (r) => r.href !== "/docs" && r.href.startsWith("/docs/")
  ).map((route) => ({
    url: `${baseUrl}${route.href}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/benchmarks`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...docsEntries,
  ];
}
