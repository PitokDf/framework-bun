export interface DocRoute {
  href: string;
  title: string;
  section: string;
}

export const DOC_ROUTES: DocRoute[] = [
  { href: "/docs", title: "Getting Started", section: "Getting Started" },

  { href: "/docs/routing", title: "Routing", section: "Fundamentals" },
  { href: "/docs/controllers", title: "Controllers", section: "Fundamentals" },
  { href: "/docs/decorators", title: "Decorators", section: "Fundamentals" },
  { href: "/docs/context", title: "Context", section: "Fundamentals" },
  { href: "/docs/validation", title: "Validation", section: "Fundamentals" },
  { href: "/docs/middleware", title: "Middleware", section: "Fundamentals" },
  { href: "/docs/error-handling", title: "Error Handling", section: "Fundamentals" },
  { href: "/docs/upload", title: "File Upload", section: "Fundamentals" },

  { href: "/docs/auth", title: "JWT Authentication", section: "Authentication" },
  { href: "/docs/oauth", title: "OAuth Social Login", section: "Authentication" },
  { href: "/docs/rbac", title: "RBAC", section: "Authentication" },

  { href: "/docs/app-config", title: "App Configuration", section: "Advanced" },
  { href: "/docs/ioc", title: "IoC Container", section: "Advanced" },
  { href: "/docs/logger", title: "Logger", section: "Advanced" },
  { href: "/docs/sse", title: "SSE", section: "Advanced" },
  { href: "/docs/websocket", title: "WebSocket", section: "Advanced" },
  { href: "/docs/static-files", title: "Static Files", section: "Advanced" },
  { href: "/docs/emitter", title: "Event Emitter", section: "Advanced" },
  { href: "/docs/testing", title: "Testing", section: "Advanced" },

  { href: "/docs/cache", title: "Cache", section: "Integrations" },
  { href: "/docs/mailer", title: "Mailer", section: "Integrations" },
  { href: "/docs/template", title: "Template Engine", section: "Integrations" },
  { href: "/docs/queue", title: "Queue", section: "Integrations" },
  { href: "/docs/scheduler", title: "Scheduler", section: "Integrations" },

  { href: "/docs/helpers", title: "Helpers", section: "Utilities" },
  { href: "/docs/timezone", title: "Timezone", section: "Utilities" },
  { href: "/docs/ai", title: "AI Module", section: "Utilities" },
  { href: "/docs/vector-search", title: "Vector Search", section: "Utilities" },
  { href: "/docs/api-docs", title: "API Docs", section: "Utilities" },
  { href: "/docs/repository", title: "Repository", section: "Utilities" },
  { href: "/docs/audit-log", title: "Audit Log", section: "Utilities" },
  { href: "/docs/health-check", title: "Health Check", section: "Utilities" },
  { href: "/docs/cli", title: "CLI", section: "Utilities" },
];

export function getAdjacentRoutes(pathname: string) {
  const idx = DOC_ROUTES.findIndex((r) => r.href === pathname);
  const prev = idx > 0 ? DOC_ROUTES[idx - 1] : null;
  const next = idx >= 0 && idx < DOC_ROUTES.length - 1 ? DOC_ROUTES[idx + 1] : null;
  return { prev, next };
}

export function getBreadcrumbs(pathname: string) {
  const route = DOC_ROUTES.find((r) => r.href === pathname);
  if (!route) return [];

  const crumbs: { label: string; href?: string }[] = [
    { label: "Docs", href: "/docs" },
  ];

  if (route.href !== "/docs") {
    if (route.section !== "Getting Started") {
      crumbs.push({ label: route.section });
    }
    crumbs.push({ label: route.title });
  }

  return crumbs;
}
