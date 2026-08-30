"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowRight, Terminal, Zap, Clock, Code2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const EMPTY_DATA = {
  frameworks: {
    buntok: {
      "/plaintext": { reqPerSec: 0, latencyP50: 0 },
    },
  },
};

export function HomeSection() {
  const [data, setData] = useState(EMPTY_DATA);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    fetch(`${base}/dashboard-data.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.frameworks?.buntok) setData(d);
      })
      .catch(() => {});
  }, []);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const copyCmd = () => {
    navigator.clipboard.writeText("bun add @buntok/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative animate-fade-up overflow-x-hidden">
      {/* Background effects — full-bleed beyond max-w-6xl parent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full pointer-events-none z-0" style={{ marginLeft: "calc(-50vw + 50%)" }}>
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, 0.04), transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 w-full mask-[linear-gradient(to_bottom,white_10%,transparent_90%)]">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-size-[4rem_4rem]"
            style={{ backgroundPosition: "center top" }}
          />
          <svg className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[250px] pointer-events-none">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#glow)">
              <path d="M 384 -64 V 256 H 704 V 800" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="6s" repeatCount="indefinite" />
              </path>
              <path d="M 1984 128 H 1280 V 384 H 896 V 900" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="8s" begin="1s" repeatCount="indefinite" />
              </path>
              <path d="M 192 1000 V 448 H 512 V -64" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="7s" begin="2s" repeatCount="indefinite" />
              </path>
              <path d="M 1600 -64 V 192 H 1408 V 800" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="5s" begin="0.5s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center pt-28 pb-16 sm:pb-24 px-4 sm:px-0">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f97316]/20 bg-[#f97316]/5 backdrop-blur-sm text-xs text-text-secondary mb-8 hover:border-[#f97316]/40 hover:bg-[#f97316]/10 transition-all cursor-default group">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse group-hover:scale-125 transition-transform" />
          <img src="https://img.shields.io/npm/v/@buntok/core" alt="npm version" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[1.08] mb-6 max-w-4xl relative px-2 sm:px-0">
          Decorator-Powered, Zero-Config <br className="hidden sm:block" />
          <span className="relative inline-block bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#f97316] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 cursor-default">
            API Framework
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#f97316]/40 to-[#f97316]/10 rounded-full blur-sm" />
          </span>{" "}
          for Bun
        </h1>

        <p className="text-sm sm:text-lg text-text-secondary max-w-xl mb-10 sm:mb-12 leading-relaxed px-2 sm:px-0">
          Zero-config, zero overhead. Built for developers who want
          decorator-powered architecture without the complexity.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/docs"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#f97316] text-white text-sm font-semibold hover:bg-[#ea580c] hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={copyCmd}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-tertiary text-sm font-mono text-text-secondary hover:border-[#f97316]/40 transition-all duration-300 active:scale-95 group"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0 text-[#f97316] group-hover:animate-bounce" />
            bun add @buntok/core
            <span className="ml-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity">
              {copied ? "✓" : "⌘C"}
            </span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3 text-xs sm:text-sm text-text-secondary">
          {[
            {
              val: data?.frameworks?.buntok
                ? `${Math.round(data.frameworks.buntok["/plaintext"].reqPerSec / 1000)}k+`
                : "30k+",
              label: "req/s on Bun",
            },
            { val: "AOT", label: "Compiled Router" },
            { val: "100%", label: "TypeScript" },
            { val: "MIT", label: "Open Source" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-300 cursor-default"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="font-bold text-text-primary">{s.val}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code preview ── */}
      <section className="relative z-10 border-t border-border-primary py-16 sm:py-24 px-4 sm:px-0">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[#f97316]/50" />
              Why Buntok?
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-5">
              Clean. Fast. Typed.
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6 sm:mb-8 text-base sm:text-lg">
              Write your API the way it should be written - with classes,
              decorators, and automatic type inference. Buntok compiles
              everything ahead of time so the runtime has zero overhead.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              {[
                "Decorator-based Controllers with @Get, @Post, @Put, @Delete, etc.",
                "ZodCtx for 100% type-safe validation with auto-inferred types",
                "AOT router compilation - static routes O(1), dynamic via trie",
                "Built-in zValidator, CORS, Rate Limiter, SSE, WebSockets",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-secondary/50 border border-transparent hover:border-border-primary transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 text-[#f97316] mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 lg:order-2 group max-w-full">
            <div className="rounded-xl overflow-hidden border border-border-primary shadow-2xl shadow-black/20 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.12)] group-hover:-translate-y-1">
              <div className="bg-bg-secondary border-b border-border-primary px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-3 text-[11px] font-mono text-text-secondary">
                  user.controller.ts
                </span>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="typescript"
                  style={mounted && theme === "dark" ? vscDarkPlus : vs}
                  customStyle={{
                    margin: 0,
                    padding: "1.25rem",
                    fontSize: "0.7rem",
                    lineHeight: "1.7",
                    minWidth: "300px",
                  }}
                >{`import { Controller, Get, Post, Use, zValidator, ZodCtx, z } from '@buntok/core';

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

@Controller('/users')
export class UserController {

  @Get('/')
  async list() {
    return [{ id: 1, name: 'Alice' }];
  }

  @Post('/')
  @Use(zValidator('body', UserSchema))
  async create(ctx: ZodCtx<{ body: typeof UserSchema }>) {
    const data = ctx.valid('body'); // Fully typed!
    return ctx.json({ success: true, data });
  }
}`}</SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Performance Highlight ── */}
      <section className="relative z-10 border-t border-border-primary py-16 sm:py-24 bg-bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-3 flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#f97316]/50" />
            Raw Performance
            <span className="w-8 h-px bg-[#f97316]/50" />
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-5">
            Faster than Hono. <br className="sm:hidden" /> Neck-and-neck with Elysia.
          </h2>
          <p className="text-text-secondary leading-relaxed mb-10 sm:mb-14 text-base sm:text-lg max-w-2xl mx-auto">
            Buntok wasn&apos;t just built for developer experience - it was built for
            raw throughput. By compiling your decorators Ahead-of-Time (AOT),
            Buntok bypasses the heavy runtime routing overhead found in Express and NestJS.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#f97316]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Zap className="w-5 h-5 text-[#f97316] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">
                {data?.frameworks?.buntok
                  ? `${Math.round(data.frameworks.buntok["/plaintext"].reqPerSec).toLocaleString()}`
                  : "30k+"}
              </h3>
              <p className="text-xs text-text-secondary">Requests per second</p>
            </div>
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#27c93f]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Clock className="w-5 h-5 text-[#27c93f] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">
                {data?.frameworks?.buntok
                  ? `< ${(data.frameworks.buntok["/plaintext"].latencyP50 / 1000).toFixed(1)}ms`
                  : "< 0.1ms"}
              </h3>
              <p className="text-xs text-text-secondary">P50 Latency</p>
            </div>
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#3b82f6]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Code2 className="w-5 h-5 text-[#3b82f6] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">Full</h3>
              <p className="text-xs text-text-secondary">TypeScript</p>
            </div>
          </div>

          <div className="mt-10 sm:mt-14 text-xs sm:text-sm text-text-secondary px-2 sm:px-0">
            <p>
              In our independent benchmarks, Buntok consistently outperforms{" "}
              <strong className="text-text-primary">Hono</strong> and stays highly competitive with{" "}
              <strong className="text-text-primary">Elysia</strong>, while providing a clean decorator-powered API.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border-primary py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">Buntok</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-accent transition-colors">Docs</Link>
            <Link href="/benchmarks" className="hover:text-accent transition-colors">Benchmarks</Link>
            <a href="https://github.com/PitokDf/framework-bun" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
