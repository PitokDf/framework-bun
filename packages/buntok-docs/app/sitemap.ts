import type { MetadataRoute } from "next";

const BASE_URL = "https://buntok.pitok.my.id";

const docPages = [
  "",
  "routing",
  "controllers",
  "decorators",
  "context",
  "validation",
  "middleware",
  "error-handling",
  "auth",
  "oauth",
  "rbac",
  "upload",
  "static-files",
  "cache",
  "queue",
  "scheduler",
  "mailer",
  "emitter",
  "audit-log",
  "health-check",
  "ai",
  "timezone",
  "ioc",
  "repository",
  "api-docs",
  "sse",
  "websocket",
  "helpers",
  "cli",
  "app-config",
  "testing",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = docPages.map((page) => ({
    url: `${BASE_URL}/docs${page ? `/${page}` : ""}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page === "" ? 1 : 0.8,
  }));

  const home = {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  };

  const benchmarks = {
    url: `${BASE_URL}/benchmarks`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  };

  return [home, ...docs, benchmarks];
}
