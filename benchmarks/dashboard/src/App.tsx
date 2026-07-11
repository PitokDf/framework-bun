import { useEffect, useState } from 'react';
import { Terminal, Code, Zap, FileText, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black">
              B
            </div>
            Buntok
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <button onClick={() => setActiveTab('home')} className={`hover:text-white transition-colors ${activeTab === 'home' && 'text-emerald-400'}`}>Home</button>
            <button onClick={() => setActiveTab('docs')} className={`hover:text-white transition-colors ${activeTab === 'docs' && 'text-emerald-400'}`}>Documentation</button>
            <button onClick={() => setActiveTab('benchmarks')} className={`hover:text-white transition-colors ${activeTab === 'benchmarks' && 'text-emerald-400'}`}>Benchmarks</button>
            <a href="https://github.com/PitokDf/framework-bun" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
        {activeTab === 'docs' && <DocsPage />}
        {activeTab === 'benchmarks' && <BenchmarkSection data={data} />}
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-sm py-8 border-t border-gray-800">
        <p>Built with ❤️ by Pitok & AI • Powered by Bun</p>
      </footer>
    </div>
  );
}

function LandingPage({ setActiveTab }: { setActiveTab: any }) {
  return (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Hero Section */}
      <section className="py-20 flex flex-col items-center text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8 border border-emerald-500/20">
          <Zap className="w-4 h-4" /> Buntok v0.2.0 is out!
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          The Decorator-First <br /> Bun Framework
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Blazing fast performance meets elegant developer experience. Build robust, scalable backends with TypeScript decorators, dependency injection, and pure speed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button onClick={() => setActiveTab('docs')} className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg transition-all flex items-center gap-2 hover:gap-4">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 px-6 py-4 rounded-full bg-[#18181b] border border-gray-800 text-gray-300 font-mono text-sm">
            <Terminal className="w-4 h-4 text-gray-500" />
            npm create buntok@latest
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#18181b] border border-gray-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
          <Code className="w-10 h-10 text-emerald-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">NestJS-like DX</h3>
          <p className="text-gray-400 leading-relaxed">Use familiar class-based controllers and decorators (@Get, @Post) to structure your application predictably and cleanly.</p>
        </div>
        <div className="bg-[#18181b] border border-gray-800 p-8 rounded-3xl hover:border-blue-500/30 transition-colors">
          <Zap className="w-10 h-10 text-blue-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">Insanely Fast</h3>
          <p className="text-gray-400 leading-relaxed">AOT-compiled switch-case routers and optimized Context reuse allows Buntok to beat Fastify and Hono in raw throughput.</p>
        </div>
        <div className="bg-[#18181b] border border-gray-800 p-8 rounded-3xl hover:border-purple-500/30 transition-colors">
          <FileText className="w-10 h-10 text-purple-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">Batteries Included</h3>
          <p className="text-gray-400 leading-relaxed">Built-in body parsing, SSE, static file serving, query parsing, and an intuitive Middleware system out of the box.</p>
        </div>
      </section>
    </div>
  );
}

function DocsPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-8 h-8 text-emerald-400" />
        <h1 className="text-4xl font-bold">Documentation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-gray-800 pb-2">Quick Start</h2>
            <p className="text-gray-400">Initialize a new Buntok project instantly using our scaffolding tool.</p>
            <div className="bg-[#18181b] border border-gray-800 p-4 rounded-xl font-mono text-sm text-gray-300">
              <span className="text-emerald-400">bun</span> create buntok@latest my-app<br />
              <span className="text-blue-400">cd</span> my-app<br />
              <span className="text-emerald-400">bun</span> install<br />
              <span className="text-emerald-400">bun</span> run dev
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-gray-800 pb-2">Basic Controller</h2>
            <p className="text-gray-400">Controllers are responsible for handling incoming requests and returning responses to the client.</p>
            <div className="bg-[#18181b] border border-gray-800 p-4 rounded-xl font-mono text-sm text-gray-300 overflow-x-auto">
              <pre><code>
{`import { Controller, Get, Context } from 'buntok';

@Controller('/users')
export class UserController {
  
  @Get('/')
  async getAll(ctx: Context) {
    return ctx.json({ users: ['Alice', 'Bob'] });
  }

  @Get('/:id')
  async getOne(ctx: Context) {
    const { id } = ctx.params;
    return ctx.text(\`User ID: \${id}\`);
  }
}`}
              </code></pre>
            </div>
          </section>

        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 bg-[#18181b] border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-gray-500">On this page</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-emerald-400 cursor-pointer">Quick Start</li>
              <li className="hover:text-emerald-400 cursor-pointer">Basic Controller</li>
              <li className="hover:text-emerald-400 cursor-pointer">Context & Response</li>
              <li className="hover:text-emerald-400 cursor-pointer">Middlewares</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
