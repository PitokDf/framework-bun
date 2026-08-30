import MiniSearch from "minisearch";
import { DOC_ROUTES } from "./doc-routes";

export interface SearchResult {
  id: string;
  title: string;
  section: string;
  href: string;
  snippet: string;
}

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/docs": "Installation, quick start, project structure, and first controller.",
  "/docs/routing": "Route decorators @Get, @Post, @Put, @Delete, dynamic routes, route groups.",
  "/docs/controllers": "Controller class pattern, base controller, CRUD operations, lifecycle hooks.",
  "/docs/decorators": "Available decorators: @Controller, @Get, @Post, @Put, @Delete, @Patch, @Use, @RateLimit.",
  "/docs/context": "Request context, accessing body, params, query, headers, response helpers.",
  "/docs/validation": "Zod validation with zValidator, schema definitions, request body validation.",
  "/docs/middleware": "Middleware pattern, before/after hooks, global vs route-level middleware.",
  "/docs/error-handling": "Error handling, custom error classes, global error handler, HTTP exceptions.",
  "/docs/upload": "File upload with Bun.file, multipart form data, image processing with Bun.Image.",
  "/docs/auth": "JWT authentication, token generation, login/register flow, AuthStore, cookie mode.",
  "/docs/oauth": "OAuth social login, Google/GitHub providers, authorization URL, token exchange.",
  "/docs/rbac": "Role-based access control, permission system, admin routes, middleware guards.",
  "/docs/app-config": "App configuration, environment variables, validateEnv, CORS, helmet, rate limiting.",
  "/docs/ioc": "Inversion of Control container, dependency injection, service registration.",
  "/docs/logger": "Logger, LogLevel, text/json formats, LOG_DIR file output, flushSync.",
  "/docs/sse": "Server-Sent Events, real-time streaming, event emitter integration.",
  "/docs/websocket": "WebSocket support, real-time bidirectional communication, connection handling.",
  "/docs/static-files": "Static file serving, public directory, asset configuration.",
  "/docs/emitter": "Event emitter pattern, publish/subscribe, decoupled architecture.",
  "/docs/testing": "Unit testing, integration testing, test utilities, mocking.",
  "/docs/cache": "Caching layer, MemoryCacheDriver, Redis driver, cache strategies, TTL.",
  "/docs/mailer": "Email sending, SMTP configuration, templates, attachments.",
  "/docs/template": "Template engine integration, HTML rendering, dynamic content.",
  "/docs/queue": "Background job processing, MemoryQueueDriver, BullMQ driver, job scheduling.",
  "/docs/scheduler": "Task scheduling, cron jobs, interval tasks, MemorySchedulerDriver, Bun cron.",
  "/docs/helpers": "Utility functions: hash, compare, slug, random, formatDate, paginate.",
  "/docs/timezone": "Timezone utilities, date conversion, Temporal API integration.",
  "/docs/ai": "AI module integration, streaming responses, LLM providers, embeddings.",
  "/docs/vector-search": "Semantic search with pgvector, AI embeddings, cosine similarity, hybrid search.",
  "/docs/api-docs": "Auto-generated API documentation, Swagger/OpenAPI integration.",
  "/docs/repository": "BaseRepository pattern, CRUD operations, $hidden/$visible field sanitization.",
  "/docs/audit-log": "Audit logging, tracking changes, who-did-what-when.",
  "/docs/health-check": "Health check endpoints, readiness probes, liveness checks.",
  "/docs/cli": "CLI commands, project scaffolding, init command, generators.",
};

let searchIndex: MiniSearch | null = null;

function getSearchIndex(): MiniSearch {
  if (searchIndex) return searchIndex;

  searchIndex = new MiniSearch({
    fields: ["title", "section", "snippet"],
    storeFields: ["title", "section", "href", "snippet"],
    searchOptions: {
      boost: { title: 3, section: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  const docs = DOC_ROUTES.map((route) => ({
    id: route.href,
    title: route.title,
    section: route.section,
    href: route.href,
    snippet: PAGE_DESCRIPTIONS[route.href] || "",
  }));

  searchIndex.addAll(docs);
  return searchIndex;
}

export function searchDocs(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const index = getSearchIndex();
  return index.search(query).slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    section: r.section,
    href: r.href,
    snippet: r.snippet,
  }));
}
