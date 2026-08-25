"use client";

import dynamic from "next/dynamic";

const BenchmarkCharts = dynamic(
  () => import("@/components/landing/BenchmarkCharts").then((m) => m.BenchmarkCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-border-primary rounded-xl p-5 bg-bg-secondary"
          >
            <div className="h-6 w-48 bg-bg-tertiary rounded animate-pulse mb-4" />
            <div className="h-72 bg-bg-tertiary/50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    ),
  }
);

export function BenchmarkChartsLoader({ frameworks, timeSeries }: { frameworks: any; timeSeries?: any }) {
  return <BenchmarkCharts frameworks={frameworks} timeSeries={timeSeries} />;
}
