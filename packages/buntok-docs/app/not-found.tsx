import Link from "next/link";
import { ArrowLeft, BookOpen, Home } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/10 bg-accent/[0.03]" />
        <div className="relative mx-auto w-full max-w-3xl text-center">
          <div className="mb-8 font-mono text-[clamp(7rem,24vw,15rem)] font-bold leading-none tracking-[-0.08em] text-accent/20 select-none">
            404
          </div>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Route not found
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
            This path is not registered.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
            The page may have moved, or the URL may contain a typo. Choose a
            known route to continue exploring Buntok.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-border-hover hover:bg-bg-tertiary"
            >
              <BookOpen className="h-4 w-4 text-accent" />
              Browse docs
            </Link>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to a known route
          </Link>
        </div>
      </main>
    </div>
  );
}
