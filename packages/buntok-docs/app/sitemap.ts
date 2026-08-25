import type { MetadataRoute } from "next";

const baseUrl = "https://buntok.pitok.my.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const docsPages = [
    "routing",
    "controllers",
    "context",
    "validation",
    "decorators",
    "auth",
    "middleware",
    "ioc",
    "cache",
    "error-handling",
    "helpers",
    "static-files",
    "upload",
    "sse",
    "websocket",
    "rbac",
    "oauth",
    "api-docs",
    "testing",
    "cli",
    "repository",
    "app-config",
    "health-check",
    "scheduler",
    "queue",
    "mailer",
    "audit-log",
    "timezone",
    "ai",
  ];

  const docsEntries: MetadataRoute.Sitemap = docsPages.map((page) => ({
    url: `${baseUrl}/docs/${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/benchmarks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...docsEntries,
  ];
}
