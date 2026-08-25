import type { Metadata } from "next";
import {
  Activity,
  Cpu,
  Server,
  Zap,
  Clock,
  CheckCircle,
  Database,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { BenchmarkChartsLoader } from "@/components/landing/BenchmarkChartsLoader";
import { Header } from "@/components/landing/header";

export const metadata: Metadata = {
  title: "Benchmarks | Buntok Framework Performance",
  description:
    "Hasil benchmark real-time Buntok vs Express vs Hono vs Elysia vs Fastify: throughput, latency, cold startup time.",
  openGraph: {
    title: "Buntok Framework Benchmarks",
    description:
      "Performance comparison: Buntok, Hono, Elysia, Express, Fastify on Bun runtime.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Benchmarks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework Benchmarks",
    description:
      "Performance comparison: Buntok, Hono, Elysia, Express, Fastify on Bun runtime.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Benchmarks",
      },
    ],
  },
};

const ACCENT = "#f97316";
const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
const FW_COLOR = (fw: string, idx: number) =>
  fw === "buntok" ? ACCENT : COLORS[idx % COLORS.length];

const EMPTY_DATA = {
  machine: {
    cpu: "",
    cores: 0,
    memory: "",
    os: "",
    runtime: "",
    date: new Date().toISOString(),
  },
  frameworks: {},
  timeSeries: {},
};

async function getBenchmarkData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  try {
    const res = await fetch(`${base}/dashboard-data.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return EMPTY_DATA;
    return res.json();
  } catch {
    return EMPTY_DATA;
  }
}

type BenchmarkData =
  ReturnType<typeof getBenchmarkData> extends Promise<infer T> ? T : never;

function BenchmarkPage({ data }: { data: BenchmarkData }) {
  const { machine, frameworks, timeSeries } = data;
  const fwNames = Object.keys(frameworks) as string[];
  const routes = ["/plaintext", "/json", "/id/123"] as const;

  const overallData = fwNames
    .map((fw, i) => {
      const fwData = frameworks[fw];
      const totalRps = routes.reduce(
        (acc, r) => acc + (fwData[r]?.reqPerSec || 0),
        0,
      );
      const avgLatencyUs =
        routes.reduce((acc, r) => acc + (fwData[r]?.latencyAvg || 0), 0) /
        routes.length;
      const maxLatencyUs = Math.max(
        ...routes.map((r) => fwData[r]?.latencyMax || 0),
      );
      const p50Us =
        routes.reduce((acc, r) => acc + (fwData[r]?.latencyP50 || 0), 0) /
        routes.length;
      const p99Us =
        routes.reduce((acc, r) => acc + (fwData[r]?.latencyP99 || 0), 0) /
        routes.length;

      return {
        name: fw as string,
        score: totalRps,
        avgRps: Math.round(totalRps / routes.length),
        avgLatencyMs: avgLatencyUs / 1000,
        maxLatencyMs: maxLatencyUs / 1000,
        p50Ms: p50Us / 1000,
        p99Ms: p99Us / 1000,
        startupTimeMs: Math.round(fwData.startupTime),
        color: FW_COLOR(fw as string, i),
      };
    })
    .sort((a, b) => b.score - a.score);

  const buntok = overallData.find((f) => f.name === "buntok");
  const fastest = overallData[0];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header />
      <div className="max-w-6xl space-y-4 mx-auto px-4 pt-24 pb-12">
        {/* ── SEO Structured Data ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Buntok",
              applicationCategory: "WebFramework",
              operatingSystem: "Cross-platform",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />

        {/* ── Header ── */}
        <header className="border-b border-border-primary pb-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-2">
            Benchmarks
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Performance Report
          </h1>
          <p className="text-text-secondary text-sm">
            Real-world load testing on <code>/plaintext</code>,{" "}
            <code>/json</code>, and <code>/id/:id</code> endpoints via{" "}
            <strong>bombardir</strong>.
          </p>
          <p className="text-text-secondary text-xs mt-2">
            Test date:{" "}
            {new Date(machine.date).toLocaleDateString("id-ID", {
              dateStyle: "full",
            })}{" "}
            • {machine.cores} cores • {machine.memory} RAM
          </p>
        </header>

        {/* ── Machine Info ── */}
        <section
          aria-label="Test environment"
          className="flex flex-wrap gap-6 p-4 rounded-xl bg-bg-secondary border border-border-primary text-sm mb-8"
        >
          {[
            {
              icon: <Cpu className="w-4 h-4" />,
              label: "CPU",
              val: machine.cpu,
            },
            {
              icon: <Database className="w-4 h-4" />,
              label: "Memory",
              val: machine.memory,
            },
            {
              icon: <Server className="w-4 h-4" />,
              label: "Runtime",
              val: machine.runtime,
            },
            {
              icon: <Activity className="w-4 h-4" />,
              label: "OS",
              val: machine.os,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 text-text-secondary"
            >
              <span className="text-text-secondary">{s.icon}</span>
              <span className="text-text-secondary">{s.label}:</span>
              <span className="font-medium text-text-primary">{s.val}</span>
            </div>
          ))}
        </section>

        {/* ── Stat Cards ── */}
        <section
          aria-label="Summary statistics"
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* RPS Card */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#f97316]/30 transition-all duration-300">
            <h3 className="text-sm text-text-secondary font-medium mb-1 flex items-center justify-between">
              Requests Per Sec (Avg) <Zap className="w-4 h-4 text-[#f97316]" />
            </h3>
            <div className="text-3xl font-bold text-text-primary mb-6">
              {buntok?.avgRps.toLocaleString()}{" "}
              <span className="text-sm font-normal text-text-secondary">
                req/s
              </span>
            </div>

            <div className="space-y-4">
              {overallData.map((fw) => (
                <div key={fw.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span
                      className={`font-medium ${fw.name === "buntok" ? "text-[#f97316]" : "text-text-secondary capitalize"}`}
                    >
                      {fw.name}
                    </span>
                    <span
                      className={
                        fw.name === "buntok"
                          ? "text-[#f97316] font-bold"
                          : "text-text-secondary"
                      }
                    >
                      {(fw.avgRps / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border-primary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fw.name === "buntok" ? "bg-linear-to-r from-[#f97316]/50 to-[#f97316]" : "bg-text-secondary/50"}`}
                      style={{
                        width: `${(fw.avgRps / fastest.avgRps) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latency Card */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#27c93f]/30 transition-all duration-300">
            <h3 className="text-sm text-text-secondary font-medium mb-1 flex items-center justify-between">
              Avg Latency <Clock className="w-4 h-4 text-[#27c93f]" />
            </h3>
            <div className="text-3xl font-bold text-text-primary mb-4">
              {buntok?.avgLatencyMs.toFixed(1)}{" "}
              <span className="text-sm font-normal text-text-secondary">
                ms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="pb-1.5 font-medium text-text-primary">FW</th>
                    <th className="pb-1.5 font-medium text-right">P50 (ms)</th>
                    <th className="pb-1.5 font-medium text-right text-[#27c93f]">
                      P99 (ms)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary/50">
                  {[...overallData]
                    .sort((a, b) => a.p50Ms - b.p50Ms)
                    .map((fw) => (
                      <tr
                        key={fw.name}
                        className="group/row hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <td
                          className={`py-2 font-medium capitalize ${fw.name === "buntok" ? "text-[#27c93f]" : "text-text-primary"}`}
                        >
                          {fw.name}
                        </td>
                        <td
                          className={`py-2 text-right ${fw.name === "buntok" ? "text-text-primary font-medium" : ""}`}
                        >
                          {fw.p50Ms.toFixed(1)}
                        </td>
                        <td
                          className={`py-2 text-right ${fw.name === "buntok" ? "text-[#27c93f] font-bold" : "font-medium text-text-primary"}`}
                        >
                          {fw.p99Ms.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Startup Time Card */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#3b82f6]/30 transition-all duration-300">
            <h3 className="text-sm text-text-secondary font-medium mb-1 flex items-center justify-between">
              Cold Startup Time <Activity className="w-4 h-4 text-[#3b82f6]" />
            </h3>
            <div className="text-3xl font-bold text-text-primary mb-6">
              {buntok?.startupTimeMs}{" "}
              <span className="text-sm font-normal text-text-secondary">
                ms
              </span>
            </div>

            <div className="space-y-4">
              {[...overallData]
                .sort((a, b) => a.startupTimeMs - b.startupTimeMs)
                .slice(0, 5)
                .map((fw) => (
                  <div key={fw.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span
                        className={`font-medium ${fw.name === "buntok" ? "text-[#3b82f6]" : "text-text-secondary capitalize"}`}
                      >
                        {fw.name}
                      </span>
                      <span
                        className={
                          fw.name === "buntok"
                            ? "text-[#3b82f6] font-bold"
                            : "text-text-secondary"
                        }
                      >
                        {fw.startupTimeMs} ms
                      </span>
                    </div>
                    <div className="h-2 w-full bg-border-primary rounded-full overflow-hidden flex justify-start">
                      <div
                        className={`h-full rounded-full ${fw.name === "buntok" ? "bg-linear-to-r from-[#3b82f6]/50 to-[#3b82f6]" : "bg-text-secondary/50"}`}
                        style={{
                          width: `${(fw.startupTimeMs / Math.max(...overallData.map((f) => f.startupTimeMs))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* ── About Buntok ── */}
        <section
          aria-label="About Buntok"
          className="grid lg:grid-cols-2 gap-4"
        >
          <article className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-bg-tertiary text-[#f97316] border border-border-primary">
                Philosophy
              </span>
              <h2 className="font-semibold text-text-primary">
                What is Buntok?
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Buntok is a decorator-powered, zero-config API framework for Bun.
              It brings class-based controllers, IoC container, and
              AOT-compiled routing to the Bun ecosystem.
            </p>
          </article>
          <article className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h2 className="font-semibold text-text-primary">
                About These Results
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              These benchmarks were run on a{" "}
              <strong className="text-text-primary">{machine.cpu}</strong> with{" "}
              <strong className="text-text-primary">{machine.memory}</strong>{" "}
              RAM. Each framework is tested on <code>/plaintext</code>,{" "}
              <code>/json</code>, and <code>/id/:id</code> endpoints using{" "}
              <a
                href="https://github.com/codesenberg/bombardier"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f97316] hover:underline"
              >
                bombardier
              </a>
              , a load testing tool. Buntok is still in active development — the
              AOT router and middleware pipeline are being optimized. Results
              may vary across different hardware and configurations.
            </p>
            <p className="text-xs text-text-secondary mt-3">
              Source code:{" "}
              <a
                href="https://github.com/PitokDf/framework-bun/blob/master/benchmarks/runner.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f97316] hover:underline font-mono"
              >
                benchmarks/runner.ts
              </a>
            </p>
          </article>
        </section>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {/* ── Ranking ── */}
          <section
            aria-label="Framework ranking"
            className="border border-border-primary rounded-xl p-5 bg-bg-secondary"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-[#f97316]" />
              <h2 className="font-semibold text-text-primary">
                Framework Ranking
              </h2>
            </div>
            <div className="space-y-2">
              {overallData.map((fw, idx) => {
                const pct = (fw.avgRps / fastest.avgRps) * 100;
                return (
                  <div
                    key={fw.name}
                    className={`rounded-xl p-3 flex items-center gap-3 border transition-colors ${
                      fw.name === "buntok"
                        ? "border-[#f97316]/40 bg-[#f97316]/5"
                        : "border-border-primary bg-bg-primary hover:border-border-hover"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : idx === 1
                            ? "bg-zinc-400/20 text-zinc-400"
                            : idx === 2
                              ? "bg-orange-700/20 text-orange-600"
                              : "bg-bg-tertiary text-text-secondary"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm capitalize text-text-primary">
                          {fw.name}
                        </span>
                        <span className="text-xs font-mono text-text-secondary">
                          {fw.avgRps.toLocaleString()} req/s
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: fw.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Route Performance Table (Static / SEO-friendly) ── */}
          <section
            aria-label="Route performance breakdown"
            className="border border-border-primary rounded-xl p-5 bg-bg-secondary mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#f97316]" />
              <h2 className="font-semibold text-text-primary">
                Route Performance Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-text-secondary">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left pb-3 font-medium text-text-primary">
                      Route
                    </th>
                    {fwNames
                      .sort((a, b) => {
                        const aRps =
                          frameworks[a]?.["/plaintext"]?.reqPerSec || 0;
                        const bRps =
                          frameworks[b]?.["/plaintext"]?.reqPerSec || 0;
                        return bRps - aRps;
                      })
                      .map((fw) => (
                        <th
                          key={fw}
                          className="text-right pb-3 font-medium text-text-primary capitalize"
                        >
                          {fw}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {["/plaintext", "/json", "/id/123"].map((route) => (
                    <tr
                      key={route}
                      className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
                    >
                      <td className="py-3 font-mono text-text-primary">
                        {route}
                      </td>
                      {fwNames.map((fw) => {
                        const fwData = frameworks[fw] as any;
                        const routeData = fwData[route];
                        return (
                          <td key={fw} className="py-3 text-right font-mono">
                            <span
                              className={
                                fw === "buntok"
                                  ? "text-[#f97316] font-semibold"
                                  : ""
                              }
                            >
                              {routeData?.reqPerSec
                                ? Math.round(
                                    routeData.reqPerSec,
                                  ).toLocaleString()
                                : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-3 text-text-primary">Average</td>
                    {fwNames.map((fw) => {
                      const fwData = frameworks[fw] as any;
                      const avg = Math.round(
                        routes.reduce(
                          (acc, r) => acc + (fwData[r]?.reqPerSec || 0),
                          0,
                        ) / routes.length,
                      );
                      return (
                        <td
                          key={fw}
                          className="py-3 text-right font-mono text-text-primary"
                        >
                          {avg.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Interactive Charts (Client-side / Recharts) ── */}
        <section aria-label="Interactive charts">
          <BenchmarkChartsLoader
            frameworks={frameworks}
            timeSeries={timeSeries}
          />
        </section>

        {/* ── CTA ── */}
        <div className="mt-12 text-center">
          <a
            href="/docs/routing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] transition-colors"
          >
            Mulai pakai Buntok sekarang <TrendingUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function BenchmarksPage() {
  const data = await getBenchmarkData();
  return <BenchmarkPage data={data} />;
}
