import { Activity, Cpu, Server, Zap, Clock, Route, CheckCircle, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, CartesianGrid, LineChart, Line } from 'recharts';

export function BenchmarkSection({ data, isDark }: { data: any, isDark: boolean }) {
  if (!data) return <div className="text-text-secondary">Loading Benchmark Data...</div>;
  const { machine, frameworks } = data;
  const fwNames = Object.keys(frameworks);
  const overallData = fwNames.map(fw => {
    const routes = Object.keys(frameworks[fw]).filter(k => k !== 'startupTime');
    const totalRps = routes.reduce((acc, route) => acc + (frameworks[fw][route]?.reqPerSec || 0), 0);
    const avgLatency = routes.reduce((acc, route) => acc + (frameworks[fw][route]?.latencyAvg || 0), 0) / routes.length;
    return { name: fw, score: totalRps, avgRps: Math.round(totalRps / routes.length), avgLatency: avgLatency / 1000, startupTime: Math.round(frameworks[fw].startupTime) };
  }).sort((a, b) => b.score - a.score);
  const targetFrameworkIndex = overallData.findIndex(f => f.name === 'buntok');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border-primary p-3 rounded-lg shadow-xl text-sm transition-colors text-text-primary">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-mono">{entry.value.toLocaleString()} {entry.dataKey.includes('latency') ? 'ms' : 'req/s'}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <header className="mb-10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-text-primary mb-2 transition-colors">Performance Benchmarks</h2>
          <p className="text-text-secondary text-lg transition-colors">Real-world load testing on typical endpoints.</p>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-md p-5 mt-6 flex flex-wrap gap-6 text-sm text-text-secondary transition-colors">
          <div className="flex flex-col gap-1">
            <span className="uppercase text-xs font-semibold tracking-wider">Machine</span>
            <div className="flex items-center gap-2 text-text-primary"><Cpu className="w-4 h-4" /> {machine.cpu}</div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="uppercase text-xs font-semibold tracking-wider">Memory</span>
            <div className="flex items-center gap-2 text-text-primary"><Database className="w-4 h-4" /> {machine.memory}</div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="uppercase text-xs font-semibold tracking-wider">Runtime</span>
            <div className="flex items-center gap-2 text-text-primary"><Server className="w-4 h-4" /> {machine.runtime}</div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-bg-secondary to-bg-primary border border-border-primary rounded-md p-8 mb-6 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2 text-text-primary transition-colors">
              <span className="bg-emerald-500 text-white px-2 py-1 rounded text-sm uppercase tracking-bold">Philosophy</span>
              What is Buntok?
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4 transition-colors">
              Buntok is a decorator-first, high-performance web framework designed for the Bun runtime. It aims to bridge the gap between elegant Developer Experience (DX) heavily inspired by structured architectural patterns like NestJS and extreme raw throughput.
            </p>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-3 text-text-primary transition-colors">The Performance Context</h2>
            <p className="text-text-secondary leading-relaxed text-sm transition-colors">
              While <strong className="text-purple-500 dark:text-purple-400">Elysia</strong> achieves its top-tier speed by leveraging complex Ahead-Of-Time (AOT) type-string evaluation and stripping out standard object-oriented abstractions, <strong className="text-emerald-500 dark:text-emerald-400">Buntok</strong> uses a hybrid approach. We utilize an AOT-compiled router mapped via native <code>switch-case</code> alongside static context allocation and standard class-based decorators.
            </p>
            <div className="mt-4 p-3 bg-bg-tertiary border border-border-hover rounded-lg transition-colors">
              <p className="text-sm text-text-primary transition-colors">
                Buntok trades a tiny, microscopic margin of raw string-execution speed (compared to Elysia) in exchange for a beautifully structured, class-based developer experience. This is why Buntok sits comfortably <strong>ahead of Hono and Fastify</strong>, while remaining a formidable challenger to Elysia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-24 h-24 text-emerald-500" /></div>
          <h3 className="text-text-secondary text-sm font-medium mb-1 transition-colors">Buntok Avg Throughput</h3>
          <div className="text-4xl font-bold text-text-primary tracking-tight transition-colors">{overallData[targetFrameworkIndex]?.avgRps.toLocaleString()}</div>
          <div className="text-emerald-500 dark:text-emerald-400 text-sm mt-2 font-medium flex items-center gap-1">
             <span className="text-text-secondary line-through mr-1">{overallData.find(f => f.name === 'hono')?.avgRps.toLocaleString()} (Hono)</span> vs Buntok
          </div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-24 h-24 text-blue-500" /></div>
          <h3 className="text-text-secondary text-sm font-medium mb-1 transition-colors">Buntok Avg Latency</h3>
          <div className="text-4xl font-bold text-text-primary tracking-tight transition-colors">{overallData[targetFrameworkIndex]?.avgLatency.toFixed(2)}ms</div>
          <div className="text-blue-500 dark:text-blue-400 text-sm mt-2 font-medium">Blazing Fast Object-Oriented</div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors shadow-sm">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-24 h-24 text-orange-500" /></div>
          <h3 className="text-text-secondary text-sm font-medium mb-1 transition-colors">Buntok Startup Time</h3>
          <div className="text-4xl font-bold text-text-primary tracking-tight transition-colors">{overallData[targetFrameworkIndex]?.startupTime}ms</div>
          <div className="text-orange-500 dark:text-orange-400 text-sm mt-2 font-medium">Near-Instant Cold Start</div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors shadow-sm">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Route className="w-24 h-24 text-purple-500" /></div>
          <h3 className="text-text-secondary text-sm font-medium mb-1 transition-colors">Endpoints Tested</h3>
          <div className="text-4xl font-bold text-text-primary tracking-tight transition-colors">3</div>
          <div className="text-purple-500 dark:text-purple-400 text-sm mt-2 font-medium">Plaintext, JSON, Dynamic</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 flex flex-col transition-colors shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary transition-colors"><CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400"/> Framework Ranking</h2>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {overallData.map((fw, idx) => (
              <div key={fw.name} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${fw.name === 'buntok' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-bg-tertiary border-border-hover'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' : idx === 1 ? 'bg-gray-400/20 text-gray-500 dark:text-gray-300' : idx === 2 ? 'bg-orange-700/20 text-orange-600 dark:text-orange-500' : 'bg-bg-primary text-text-secondary'}`}>{idx + 1}</div>
                  <div>
                    <div className="font-semibold text-text-primary capitalize transition-colors">{fw.name}</div>
                    <div className="text-xs text-text-secondary transition-colors">{fw.startupTime}ms startup</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-text-primary transition-colors">{fw.avgRps.toLocaleString()} <span className="text-sm font-normal text-text-secondary">req/s</span></div>
                  <div className="text-xs text-text-secondary transition-colors">{fw.avgLatency.toFixed(2)}ms avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-md p-6 transition-colors shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-text-primary transition-colors">Performance Radar</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={overallData}>
                <PolarGrid stroke={isDark ? "#27272a" : "#e4e4e7"} />
                <PolarAngleAxis dataKey="name" tick={{ fill: isDark ? '#a1a1aa' : '#52525b', fontSize: 12 }} />
                <Radar name="Requests/Sec" dataKey="avgRps" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <RechartsTooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary border border-border-primary rounded-md p-6 mb-6 transition-colors shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-text-primary transition-colors">Route Performance Breakdown (Req/Sec)</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={['/plaintext', '/json', '/id/123'].map(route => ({ name: route, ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw][route]?.reqPerSec || 0])) }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} vertical={false} />
              <XAxis dataKey="name" stroke={isDark ? "#71717a" : "#52525b"} tickLine={false} axisLine={false} />
              <YAxis stroke={isDark ? "#71717a" : "#52525b"} tickLine={false} axisLine={false} tickFormatter={val => `${val / 1000}k`} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: isDark ? '#27272a' : '#e4e4e7', opacity: 0.4}} />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              {fwNames.map((fw, i) => <Bar key={fw} dataKey={fw} fill={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} radius={[4, 4, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {data.timeSeries && data.timeSeries['buntok'] && data.timeSeries['buntok'].length > 0 && (
        <section className="bg-bg-secondary border border-border-primary rounded-md p-6 transition-colors shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-text-primary transition-colors">Throughput Over Time (/plaintext)</h2>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeSeries['buntok'].map((_: any, idx: number) => {
                const row: any = { second: idx + 1 };
                fwNames.forEach(fw => { row[fw] = data.timeSeries[fw]?.[idx]?.reqPerSec || 0; });
                return row;
              })} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} vertical={false} />
                <XAxis dataKey="second" stroke={isDark ? "#71717a" : "#52525b"} tickLine={false} axisLine={false} tickFormatter={val => `${val}s`} />
                <YAxis stroke={isDark ? "#71717a" : "#52525b"} tickLine={false} axisLine={false} tickFormatter={val => `${val / 1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                {fwNames.map((fw, i) => <Line type="monotone" key={fw} dataKey={fw} stroke={fw === 'buntok' ? '#10b981' : `hsl(${i * 60}, 70%, 50%)`} strokeWidth={fw === 'buntok' ? 3 : 2} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
