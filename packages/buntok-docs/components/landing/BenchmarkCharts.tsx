"use client";

import { Activity, Zap, Clock, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useTheme } from "next-themes";

const ACCENT = "#f97316";
const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
const FW_COLOR = (fw: string, idx: number) =>
  fw === "buntok" ? ACCENT : COLORS[idx % COLORS.length];

export function BenchmarkCharts({
  frameworks,
  timeSeries,
}: {
  frameworks: any;
  timeSeries?: any;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fwNames = Object.keys(frameworks);

  const overallData = fwNames
    .map((fw, i) => {
      const routes = Object.keys(frameworks[fw]).filter(
        (k) => k !== "startupTime",
      );
      const totalRps = routes.reduce(
        (acc, r) => acc + (frameworks[fw][r]?.reqPerSec || 0),
        0,
      );
      const p50Us =
        routes.reduce(
          (acc, r) => acc + (frameworks[fw][r]?.latencyP50 || 0),
          0,
        ) / routes.length;
      const p99Us =
        routes.reduce(
          (acc, r) => acc + (frameworks[fw][r]?.latencyP99 || 0),
          0,
        ) / routes.length;

      return {
        name: fw,
        score: totalRps,
        avgRps: Math.round(totalRps / routes.length),
        p50Ms: p50Us / 1000,
        p99Ms: p99Us / 1000,
        startupTime: Math.round(frameworks[fw].startupTime),
        color: FW_COLOR(fw, i),
      };
    })
    .sort((a, b) => b.score - a.score);

  const fastest = overallData[0];
  const gridColor = isDark ? "#1f1f1f" : "#e4e4e7";
  const tickColor = isDark ? "#52525b" : "#a1a1aa";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 text-xs shadow-lg">
        <p className="font-semibold text-text-primary mb-2">{label}</p>
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-text-secondary">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: e.color }}
            />
            <span className="capitalize">{e.name}:</span>
            <span className="font-mono text-text-primary">
              {e.value.toLocaleString()}{" "}
              {e.dataKey?.includes?.("latency") ? "ms" : "req/s"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ── Radar Chart ── */}
      <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#f97316]" />
          Performance Radar
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={overallData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <Radar
                name="Avg req/s"
                dataKey="avgRps"
                stroke={ACCENT}
                fill={ACCENT}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <RechartsTooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#f97316]" />
          <h2 className="font-semibold text-text-primary">
            Route Performance Breakdown (req/s)
          </h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={["/plaintext", "/json", "/id/123"].map((route) => ({
                name: route,
                ...Object.fromEntries(
                  fwNames.map((fw) => [
                    fw,
                    frameworks[fw][route]?.reqPerSec || 0,
                  ]),
                ),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: isDark ? "#1f1f1f" : "#f4f4f5",
                  opacity: 0.6,
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              {fwNames.map((fw, i) => (
                <Bar
                  key={fw}
                  dataKey={fw}
                  fill={FW_COLOR(fw, i)}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Latency Comparison (Bar) ── */}
      <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#27c93f]" />
          <h2 className="font-semibold text-text-primary">
            Latency Comparison (ms)
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={overallData.map((fw) => ({
                name: fw.name,
                P50: Number(fw.p50Ms.toFixed(1)),
                P99: Number(fw.p99Ms.toFixed(0)),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}ms`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              <Bar
                dataKey="P50"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="P99"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Line Chart (time series) ── */}
      {timeSeries &&
        timeSeries[fwNames[0]]?.some((t: any) => t.reqPerSec > 0) && (
          <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#f97316]" />
              <h2 className="font-semibold text-text-primary">
                Throughput Over Time — /plaintext
              </h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeries[fwNames[0]].map((_: any, idx: number) => {
                    const row: any = { second: idx + 1 };
                    fwNames.forEach((fw) => {
                      row[fw] = timeSeries[fw]?.[idx]?.reqPerSec || 0;
                    });
                    return row;
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="second"
                    stroke={tickColor}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}s`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke={tickColor}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  {fwNames.map((fw, i) => (
                    <Line
                      key={fw}
                      type="monotone"
                      dataKey={fw}
                      stroke={FW_COLOR(fw, i)}
                      strokeWidth={fw === "buntok" ? 2.5 : 1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
    </div>
  );
}
