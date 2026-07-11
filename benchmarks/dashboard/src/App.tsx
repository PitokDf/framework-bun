import { useEffect, useState } from 'react';
import { Terminal, Code, Zap, FileText, ArrowRight, Github, BookOpen, LayoutDashboard, Layers, Box, Webhook } from 'lucide-react';
import { BenchmarkSection } from './Benchmark';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'benchmarks'>('home');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-[#333]">
      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-lg cursor-pointer" onClick={() => setActiveTab('home')}>
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Buntok Logo" className="w-6 h-6 object-contain" />
            <span className="tracking-tight">Buntok</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#888]">
            <button onClick={() => setActiveTab('home')} className={`transition-colors hover:text-[#ededed] ${activeTab === 'home' && 'text-[#ededed]'}`}>Home</button>
            <button onClick={() => setActiveTab('docs')} className={`transition-colors hover:text-[#ededed] ${activeTab === 'docs' && 'text-[#ededed]'}`}>Docs</button>
            <button onClick={() => setActiveTab('benchmarks')} className={`transition-colors hover:text-[#ededed] ${activeTab === 'benchmarks' && 'text-[#ededed]'}`}>Benchmarks</button>
            <div className="w-[1px] h-4 bg-[#333] mx-2"></div>
            <a href="https://github.com/PitokDf/framework-bun" target="_blank" rel="noreferrer" className="text-[#888] hover:text-[#ededed] transition-colors flex items-center gap-2">
              GitHub
            </a>
          </div>
          
          {/* Mobile Menu simple toggle could be here, for now tab buttons */}
          <div className="flex sm:hidden items-center gap-4 text-xs font-medium text-[#888]">
            <button onClick={() => setActiveTab('docs')} className={activeTab === 'docs' ? 'text-white' : ''}>Docs</button>
            <button onClick={() => setActiveTab('benchmarks')} className={activeTab === 'benchmarks' ? 'text-white' : ''}>Stats</button>
          </div>
        </div>
      </nav>

      {/* Main Layout Area */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20 min-h-[90vh]">
        {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
        {activeTab === 'docs' && <DocsPage />}
        {activeTab === 'benchmarks' && <BenchmarkSection data={data} />}
      </main>

      {/* Footer */}
      <footer className="text-center text-[#666] text-sm py-8 border-t border-[#222]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Buntok Logo" className="w-4 h-4 grayscale opacity-50" />
            <span>Buntok Framework © {new Date().getFullYear()}</span>
          </div>
          <p>MIT Licensed. Built with Bun.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingPage({ setActiveTab }: { setActiveTab: any }) {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Minimal Hero Section */}
      <section className="py-24 flex flex-col items-start lg:items-center lg:text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111] border border-[#333] text-[#a3a3a3] text-xs font-mono mb-8">
          <Zap className="w-3 h-3 text-emerald-500" /> Buntok v0.2.0 Released
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-[#ededed] max-w-4xl leading-[1.1]">
          The Decorator-First <br className="hidden md:block"/> Performance Framework
        </h1>
        
        <p className="text-lg text-[#888] max-w-2xl lg:mx-auto mb-10 leading-relaxed">
          Buntok bridges the gap between NestJS-like elegant developer experience and extreme raw throughput. Built for Bun, completely written in TypeScript.
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <button onClick={() => setActiveTab('docs')} className="px-6 py-3 rounded-md bg-[#ededed] hover:bg-white text-black font-semibold text-sm transition-colors flex justify-center items-center gap-2">
            Read the Docs <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-md bg-[#111] border border-[#333] text-[#a3a3a3] font-mono text-sm shadow-inner">
            <Terminal className="w-4 h-4 text-[#666]" />
            npm create buntok@latest
          </div>
        </div>
      </section>

      {/* Clean Feature Grid */}
      <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded-md hover:border-[#444] transition-colors">
          <Code className="w-6 h-6 text-[#ededed] mb-4" />
          <h3 className="text-base font-semibold mb-2">Class-Based Routing</h3>
          <p className="text-[#888] text-sm leading-relaxed">Embrace a structured, object-oriented architecture. Decorators allow you to define routes, middleware, and dependency injection seamlessly.</p>
        </div>
        <div className="bg-[#111] border border-[#222] p-6 rounded-md hover:border-[#444] transition-colors">
          <Zap className="w-6 h-6 text-[#ededed] mb-4" />
          <h3 className="text-base font-semibold mb-2">AOT-Compiled Speed</h3>
          <p className="text-[#888] text-sm leading-relaxed">Buntok translates your decorator trees into flat, extremely fast native switch-case structures behind the scenes. Zero overhead abstraction.</p>
        </div>
        <div className="bg-[#111] border border-[#222] p-6 rounded-md hover:border-[#444] transition-colors">
          <Box className="w-6 h-6 text-[#ededed] mb-4" />
          <h3 className="text-base font-semibold mb-2">Batteries Included</h3>
          <p className="text-[#888] text-sm leading-relaxed">Includes Body Parsing, Query serialization, Server-Sent Events (SSE), and powerful standard middlewares without hunting for external packages.</p>
        </div>
      </section>
    </div>
  );
}

function DocsPage() {
  const [activeMenu, setActiveMenu] = useState('quick-start');

  const menuItems = [
    { id: 'quick-start', label: 'Quick Start', icon: <Terminal className="w-4 h-4" /> },
    { id: 'controllers', label: 'Controllers & Routing', icon: <Code className="w-4 h-4" /> },
    { id: 'context', label: 'Context Object', icon: <Layers className="w-4 h-4" /> },
    { id: 'middlewares', label: 'Middlewares', icon: <Webhook className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-in fade-in duration-300 flex flex-col md:flex-row gap-10 items-start">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 bg-[#111] border border-[#222] p-2 rounded-md">
        <nav className="flex flex-col space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#666]">Getting Started</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={\`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left \${activeMenu === item.id ? 'bg-[#222] text-white' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}\`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Documentation Content */}
      <div className="flex-1 max-w-3xl space-y-16 pb-20">
        
        {/* Intro */}
        <div className="border-b border-[#222] pb-6">
          <h1 className="text-3xl font-bold mb-4">Documentation</h1>
          <p className="text-[#888] text-lg leading-relaxed">
            Everything you need to build incredibly fast applications with Buntok. From scaffolding your first project to advanced decorators.
          </p>
        </div>

        {/* Sections */}
        <section id="quick-start" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold text-[#ededed]">Quick Start</h2>
          <p className="text-[#888] leading-relaxed">The fastest way to start is using our official scaffolding tool. It sets up TypeScript, Biome for linting, and a basic controller instantly.</p>
          <div className="bg-[#111] border border-[#222] p-4 rounded-md font-mono text-sm text-[#ccc] overflow-x-auto leading-loose">
            <span className="text-emerald-500">npm</span> create buntok@latest my-app<br />
            <span className="text-blue-500">cd</span> my-app<br />
            <span className="text-emerald-500">bun</span> install<br />
            <span className="text-emerald-500">bun</span> run dev
          </div>
          <p className="text-[#888] leading-relaxed mt-4">By default, the server will launch on <code>http://localhost:3000</code>.</p>
        </section>

        <section id="controllers" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold text-[#ededed]">Controllers & Routing</h2>
          <p className="text-[#888] leading-relaxed">Buntok uses decorators for routing. A Controller handles incoming HTTP requests and returns responses. Decorators bind methods to specific HTTP methods and paths.</p>
          <div className="bg-[#111] border border-[#222] p-5 rounded-md font-mono text-sm text-[#ccc] overflow-x-auto">
<pre><code><span className="text-purple-400">import</span> { '{' } Controller, Get, Post, Context { '}' } <span className="text-purple-400">from</span> <span className="text-green-400">'buntok'</span>;

<span className="text-blue-400">@Controller</span>(<span className="text-green-400">'/users'</span>)
<span className="text-purple-400">export class</span> <span className="text-yellow-200">UserController</span> { '{' }
  
  <span className="text-blue-400">@Get</span>(<span className="text-green-400">'/'</span>)
  <span className="text-blue-300">getAll</span>(ctx: Context) { '{' }
    <span className="text-purple-400">return</span> ctx.<span className="text-blue-300">json</span>({ '{' } users: [<span className="text-green-400">'Alice'</span>, <span className="text-green-400">'Bob'</span>] { '}' });
  { '}' }

  <span className="text-blue-400">@Get</span>(<span className="text-green-400">'/:id'</span>)
  <span className="text-blue-300">getOne</span>(ctx: Context) { '{' }
    <span className="text-purple-400">const</span> { '{' } id { '}' } = ctx.params;
    <span className="text-purple-400">return</span> ctx.<span className="text-blue-300">text</span>(<span className="text-green-400">\`User ID: \${id}\`</span>);
  { '}' }

  <span className="text-blue-400">@Post</span>(<span className="text-green-400">'/'</span>)
  <span className="text-purple-400">async</span> <span className="text-blue-300">create</span>(ctx: Context) { '{' }
    <span className="text-purple-400">const</span> body = <span className="text-purple-400">await</span> ctx.<span className="text-blue-300">json</span>();
    <span className="text-purple-400">return</span> ctx.<span className="text-blue-300">json</span>({ '{' } created: true, data: body { '}' }, <span className="text-orange-400">201</span>);
  { '}' }
{ '}' }</code></pre>
          </div>
          <p className="text-[#888] leading-relaxed mt-4">
            After defining a controller, register it in your main application file using <code>app.registerController(new UserController())</code>.
          </p>
        </section>

        <section id="context" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold text-[#ededed]">The Context Object</h2>
          <p className="text-[#888] leading-relaxed">Every route handler receives a <code>Context</code> object. It encapsulates the request, parsed params, query strings, and provides utility methods for responding.</p>
          <ul className="list-disc pl-5 space-y-2 text-[#888] mb-4">
            <li><code>ctx.req</code>: The native Bun Request object.</li>
            <li><code>ctx.params</code>: Path parameters (e.g., <code>/:id</code> becomes <code>ctx.params.id</code>).</li>
            <li><code>ctx.query</code>: Parsed query string dictionary.</li>
            <li><code>ctx.json(data, status?)</code>: Fast JSON response helper.</li>
            <li><code>ctx.text(text, status?)</code>: Fast plaintext response helper.</li>
            <li><code>ctx.html(html, status?)</code>: HTML response helper.</li>
            <li><code>ctx.sse()</code>: Returns an SSE streaming interface.</li>
          </ul>
        </section>

        <section id="middlewares" className="space-y-4 pt-4 border-b-0">
          <h2 className="text-2xl font-semibold text-[#ededed]">Middlewares</h2>
          <p className="text-[#888] leading-relaxed">Buntok supports global middlewares. Middlewares are standard functions that receive the <code>Context</code> and a <code>next</code> function.</p>
          <div className="bg-[#111] border border-[#222] p-5 rounded-md font-mono text-sm text-[#ccc] overflow-x-auto">
<pre><code><span className="text-purple-400">import</span> { '{' } App { '}' } <span className="text-purple-400">from</span> <span className="text-green-400">'buntok'</span>;

<span className="text-purple-400">const</span> app = <span className="text-purple-400">new</span> <span className="text-yellow-200">App</span>();

<span className="text-gray-500">// Global Logger Middleware</span>
app.<span className="text-blue-300">use</span>(<span className="text-purple-400">async</span> (ctx, next) =&gt; { '{' }
  <span className="text-purple-400">const</span> start = Date.now();
  <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-blue-300">next</span>();
  <span className="text-purple-400">const</span> ms = Date.now() - start;
  
  console.<span className="text-blue-300">log</span>(<span className="text-green-400">\`\${ctx.req.method} \${ctx.req.url} - \${ms}ms\`</span>);
  <span className="text-purple-400">return</span> response;
{ '}' });</code></pre>
          </div>
        </section>

      </div>
    </div>
  );
}
