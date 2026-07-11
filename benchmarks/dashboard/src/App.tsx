import { useEffect, useState } from 'react';
import { Activity, Cpu, Server, Zap, Clock, Route, CheckCircle, Database } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, CartesianGrid,
  LineChart, Line
} from 'recharts';

export default function App() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="animate-pulse text-xl text-gray-400">Loading Benchmark Data...</div>
    </div>
  );

  const { machine, frameworks } = data;
  const fwNames = Object.keys(frameworks);
  
  // Compute Overall Stats
  const overallData = fwNames.map(fw => {
    const routes = Object.keys(frameworks[fw]).filter(k => k !== 'startupTime');
    const totalRps = routes.reduce((acc, route) => acc + (frameworks[fw][route]?.reqPerSec || 0), 0);
    const avgLatency = routes.reduce((acc, route) => acc + (frameworks[fw][route]?.latencyAvg || 0), 0) / routes.length;
    return {
      name: fw,
      score: totalRps,
      avgRps: Math.round(totalRps / routes.length),
      avgLatency: avgLatency / 1000, // convert us to ms
      startupTime: Math.round(frameworks[fw].startupTime),
    };
  }).sort((a, b) => b.score - a.score);

  const bestRps = overallData[0].avgRps;
  const targetFrameworkIndex = overallData.findIndex(f => f.name === 'buntok');
  
  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181b] border border-gray-800 p-3 rounded-lg shadow-xl text-sm">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400">{entry.name}:</span>
              <span className="font-mono">{entry.value.toLocaleString()} {entry.dataKey.includes('latency') ? 'ms' : 'req/s'}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans p-6 md:p-10 selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-xl">
                <Activity className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Benchmark Dashboard</h1>
            </div>
            <p className="text-gray-400 text-lg">High-performance web framework analysis</p>
          </div>

          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-5 flex flex-wrap gap-6 text-sm text-gray-400 min-w-fit shadow-lg shadow-black/50">
            <div className="flex flex-col gap-1">
              <span className="uppercase text-xs font-semibold text-gray-500 tracking-wider">Machine</span>
              <div className="flex items-center gap-2 text-gray-200"><Cpu className="w-4 h-4" /> {machine.cpu}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="uppercase text-xs font-semibold text-gray-500 tracking-wider">Memory</span>
              <div className="flex items-center gap-2 text-gray-200"><Database className="w-4 h-4" /> {machine.memory}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="uppercase text-xs font-semibold text-gray-500 tracking-wider">Runtime</span>
              <div className="flex items-center gap-2 text-gray-200"><Server className="w-4 h-4" /> {machine.runtime}</div>
            </div>
          </div>
        </header>

        {/* About Buntok & Architectural Philosophy */}
        <section className="bg-gradient-to-br from-[#18181b] to-[#0f0f11] border border-gray-800 rounded-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <span className="bg-emerald-500 text-black px-2 py-1 rounded text-sm uppercase tracking-bold">Philosophy</span>
                What is Buntok?
              </h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Buntok is a decorator-first, high-performance web framework designed for the Bun runtime. It aims to bridge the gap between elegant Developer Experience (DX) — heavily inspired by structured architectural patterns like NestJS — and extreme raw throughput.
              </p>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-3 text-gray-200">The Performance Context</h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                While <strong className="text-purple-400">Elysia</strong> achieves its top-tier speed by leveraging complex Ahead-Of-Time (AOT) type-string evaluation and stripping out standard object-oriented abstractions, <strong className="text-emerald-400">Buntok</strong> uses a hybrid approach. We utilize an AOT-compiled router mapped via native <code>switch-case</code> alongside static context allocation and standard class-based decorators.
              </p>
              <div className="mt-4 p-3 bg-black/40 border border-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="text-orange-400 font-semibold">TL;DR:</span> Buntok trades a tiny, microscopic margin of raw string-execution speed (compared to Elysia) in exchange for a beautifully structured, class-based developer experience. This is why Buntok sits comfortably <strong>ahead of Hono and Fastify</strong>, while remaining a formidable challenger to Elysia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-emerald-500" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Buntok Avg Throughput</h3>
            <div className="text-4xl font-bold text-white tracking-tight">{overallData[targetFrameworkIndex]?.avgRps.toLocaleString()}</div>
            <div className="text-emerald-400 text-sm mt-2 font-medium flex items-center gap-1">
               <span className="text-gray-500 line-through mr-1">{overallData.find(f => f.name === 'hono')?.avgRps.toLocaleString()} (Hono)</span> vs Buntok
            </div>
          </div>
          
          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-24 h-24 text-blue-500" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Buntok Avg Latency</h3>
            <div className="text-4xl font-bold text-white tracking-tight">{overallData[targetFrameworkIndex]?.avgLatency.toFixed(2)}ms</div>
            <div className="text-blue-400 text-sm mt-2 font-medium">Blazing Fast Object-Oriented</div>
          </div>

          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-24 h-24 text-orange-500" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Buntok Startup Time</h3>
            <div className="text-4xl font-bold text-white tracking-tight">{overallData[targetFrameworkIndex]?.startupTime}ms</div>
            <div className="text-orange-400 text-sm mt-2 font-medium">Near-Instant Cold Start</div>
          </div>

          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Route className="w-24 h-24 text-purple-500" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Endpoints Tested</h3>
            <div className="text-4xl font-bold text-white tracking-tight">3</div>
            <div className="text-purple-400 text-sm mt-2 font-medium">Plaintext, JSON, Dynamic</div>
          </div>
        </section>

        {/* Ranking & Relative Performance */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400"/> Framework Ranking</h2>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {overallData.map((fw, idx) => (
                <div key={fw.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-gray-800 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="w-24 font-medium capitalize">{fw.name}</div>
                  <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${fw.name === 'buntok' ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                      style={{ width: `${(fw.avgRps / bestRps) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right font-mono text-sm text-gray-400">{fw.avgRps.toLocaleString()} rps</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#18181b] border border-gray-800 rounded-2xl p-6">
             <h2 className="text-xl font-bold mb-6">Radar Analysis</h2>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { subject: 'Plaintext', ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw]['/plaintext']?.reqPerSec || 0])) },
                  { subject: 'JSON', ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw]['/json']?.reqPerSec || 0])) },
                  { subject: 'Params', ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw]['/id/123']?.reqPerSec || 0])) },
                ]}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  {fwNames.map((fw, i) => (
                    <Radar key={fw} name={fw} dataKey={fw} stroke={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} fill={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} fillOpacity={fw === 'buntok' ? 0.3 : 0.1} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
             </div>
          </div>
        </section>

        {/* Detailed Route Comparison */}
        <section className="bg-[#18181b] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Route Performance Breakdown (Req/Sec)</h2>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={['/plaintext', '/json', '/id/123'].map(route => ({
                  name: route,
                  ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw][route]?.reqPerSec || 0]))
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} tickFormatter={val => `${val / 1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#27272a', opacity: 0.4}} />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                {fwNames.map((fw, i) => (
                  <Bar key={fw} dataKey={fw} fill={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Time-Series Line Chart */}
        {data.timeSeries && data.timeSeries['buntok'] && data.timeSeries['buntok'].length > 0 && (
          <section className="bg-[#18181b] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Throughput Over Time (/plaintext)</h2>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.timeSeries['buntok'].map((_: any, idx: number) => {
                    const row: any = { second: idx + 1 };
                    fwNames.forEach(fw => {
                       row[fw] = data.timeSeries[fw]?.[idx]?.reqPerSec || 0;
                    });
                    return row;
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="second" stroke="#71717a" tickLine={false} axisLine={false} tickFormatter={val => `${val}s`} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} tickFormatter={val => `${val / 1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  {fwNames.map((fw, i) => (
                    <Line type="monotone" key={fw} dataKey={fw} stroke={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} strokeWidth={fw === 'buntok' ? 3 : 2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        
        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm py-6 border-t border-gray-800">
           <p>Generated dynamically by Buntok Benchmark Suite.</p>
           <p className="mt-1">Date: {new Date(machine.date).toLocaleString()}</p>
        </footer>

      </div>
    </div>
  );
}
