import { useEffect, useState } from 'react';
import { Terminal, Code, Zap, ArrowRight, Layers, Box, Webhook, ShieldAlert, Cpu, Database, Sun, Moon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BenchmarkSection } from './Benchmark';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'benchmarks'>('home');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark'); // Default to dark if not set
    }
    
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const toggleTheme = () => {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    setIsDark(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 dark:opacity-40 transition-opacity overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/70 backdrop-blur-xl border-b border-border-primary transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-xl cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('home')}>
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Buntok Logo" className="w-7 h-7 object-contain drop-shadow-sm" />
            <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">Buntok</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <button onClick={() => setActiveTab('home')} className={`transition-all hover:text-text-primary ${activeTab === 'home' && 'text-text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>Home</button>
            <button onClick={() => setActiveTab('docs')} className={`transition-all hover:text-text-primary ${activeTab === 'docs' && 'text-text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>Docs</button>
            <button onClick={() => setActiveTab('benchmarks')} className={`transition-all hover:text-text-primary ${activeTab === 'benchmarks' && 'text-text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>Benchmarks</button>
            <div className="w-[1px] h-5 bg-border-primary mx-2 transition-colors"></div>
            <a href="https://github.com/PitokDf/framework-bun" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
              GitHub
            </a>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex sm:hidden items-center gap-4 text-xs font-medium text-text-secondary">
            <button onClick={() => setActiveTab('docs')} className={activeTab === 'docs' ? 'text-text-primary' : ''}>Docs</button>
            <button onClick={() => setActiveTab('benchmarks')} className={activeTab === 'benchmarks' ? 'text-text-primary' : ''}>Stats</button>
            <button onClick={toggleTheme} className="p-1.5 rounded-full hover:bg-bg-tertiary">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 min-h-[90vh]">
        {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
        {activeTab === 'docs' && <DocsPage isDark={isDark} />}
        {activeTab === 'benchmarks' && <div className="animate-in fade-in duration-500 slide-in-from-bottom-4"><BenchmarkSection data={data} isDark={isDark} /></div>}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-text-secondary text-sm py-10 border-t border-border-primary bg-bg-primary transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Buntok Logo" className="w-5 h-5 grayscale opacity-50 hover:grayscale-0 transition-all cursor-pointer" />
            <span>Buntok Framework © {new Date().getFullYear()}</span>
          </div>
          <p>MIT Licensed. Open Source. Built for the Bun Ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingPage({ setActiveTab }: { setActiveTab: any }) {
  return (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-8">
      {/* Hero Section */}
      <section className="py-24 flex flex-col items-center text-center relative min-h-[75vh] justify-center">
        {/* Abstract Blur Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full -z-20 pointer-events-none transition-opacity"></div>
        
        {/* 3D Floating Isometric Blocks (Hidden on mobile) */}
        <div className="hidden lg:block absolute top-1/4 left-16 -z-10 animate-float opacity-70">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)]" 
               style={{ transform: 'perspective(1000px) rotateX(50deg) rotateY(10deg) rotateZ(-40deg)' }}>
          </div>
          <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-tr from-purple-500/40 to-emerald-500/40 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.3)]" 
               style={{ transform: 'perspective(1000px) rotateX(50deg) rotateY(10deg) rotateZ(-40deg) translateZ(40px)' }}>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-1/4 right-16 -z-10 animate-float-delayed opacity-70">
          <div className="w-40 h-40 bg-gradient-to-bl from-blue-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_0_60px_rgba(59,130,246,0.2)]" 
               style={{ transform: 'perspective(1000px) rotateX(-40deg) rotateY(30deg) rotateZ(20deg)' }}>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs font-mono mb-10 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all cursor-pointer z-10">
          <Zap className="w-4 h-4 animate-pulse" /> Buntok v0.2.0 is officially released!
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 text-text-primary max-w-5xl leading-[1.05] drop-shadow-2xl transition-colors">
          The Decorator-First <br className="hidden md:block"/> Performance Engine
        </h1>
        
        <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed transition-colors">
          Buntok marries the elegance of NestJS-like object-oriented architecture with the extreme, face-melting speed of the Bun runtime. Say goodbye to boilerplate.
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full sm:w-auto">
          <button onClick={() => setActiveTab('docs')} className="px-8 py-4 rounded-lg bg-text-primary hover:bg-text-secondary text-bg-primary font-bold text-base transition-all flex justify-center items-center gap-3 hover:gap-5 shadow-lg dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Read the Docs <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between sm:justify-center gap-4 px-6 py-4 rounded-lg bg-bg-primary/80 backdrop-blur-md border border-border-hover text-text-secondary font-mono text-sm shadow-xl hover:border-text-secondary transition-colors cursor-copy group">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-text-secondary group-hover:text-emerald-500 transition-colors" />
              <span>npm create buntok@latest</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Code className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />}
          title="Class-Based Routing"
          desc="Embrace a structured, object-oriented architecture. Decorators allow you to define routes seamlessly without messy closures."
          delay="0"
        />
        <FeatureCard 
          icon={<Zap className="w-8 h-8 text-blue-500 dark:text-blue-400" />}
          title="AOT-Compiled Speed"
          desc="Buntok translates your decorator trees into flat, extremely fast native switch-case structures behind the scenes. Zero router overhead."
          delay="100"
        />
        <FeatureCard 
          icon={<Box className="w-8 h-8 text-purple-500 dark:text-purple-400" />}
          title="Batteries Included"
          desc="Includes Body Parsing, Query serialization, Server-Sent Events (SSE), and powerful standard middlewares out of the box."
          delay="200"
        />
        <FeatureCard 
          icon={<ShieldAlert className="w-8 h-8 text-red-500 dark:text-red-400" />}
          title="Type-Safe First"
          desc="Written entirely in TypeScript. Build robust APIs with predictable type definitions from controllers all the way to middlewares."
          delay="300"
        />
        <FeatureCard 
          icon={<Database className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />}
          title="Extensible Architecture"
          desc="Easily integrate your favorite ORMs, DI containers, and external loggers cleanly via Buntok's modular initialization."
          delay="400"
        />
        <FeatureCard 
          icon={<Cpu className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />}
          title="Optimized Context"
          desc="Memory allocation is minimized through reusable Context objects per request, dramatically reducing GC pauses under extreme load."
          delay="500"
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: string }) {
  return (
    <div 
      className="bg-bg-primary/50 backdrop-blur-md border border-border-primary p-8 rounded-xl hover:bg-bg-secondary hover:border-border-hover transition-all hover:-translate-y-1 hover:shadow-2xl group shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-6 p-4 rounded-lg bg-bg-secondary border border-border-primary inline-block group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-text-primary tracking-tight transition-colors">{title}</h3>
      <p className="text-text-secondary leading-relaxed text-sm transition-colors">{desc}</p>
    </div>
  );
}

function DocsPage({ isDark }: { isDark: boolean }) {
  const [activeMenu, setActiveMenu] = useState('quick-start');

  const menuItems = [
    { id: 'quick-start', label: 'Quick Start', icon: <Terminal className="w-4 h-4" /> },
    { id: 'initialization', label: 'Server Initialization', icon: <Cpu className="w-4 h-4" /> },
    { id: 'controllers', label: 'Controllers & Routing', icon: <Code className="w-4 h-4" /> },
    { id: 'groups', label: 'Route Groups', icon: <Layers className="w-4 h-4" /> },
    { id: 'context', label: 'Context Object', icon: <Box className="w-4 h-4" /> },
    { id: 'body-query', label: 'Body & Query Params', icon: <Database className="w-4 h-4" /> },
    { id: 'di', label: 'Dependency Injection', icon: <Zap className="w-4 h-4" /> },
    { id: 'middlewares', label: 'Middlewares', icon: <Webhook className="w-4 h-4" /> },
    { id: 'built-in', label: 'Built-in Middlewares', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'websockets', label: 'WebSockets', icon: <Cpu className="w-4 h-4" /> },
    { id: 'sse', label: 'Server-Sent Events', icon: <Zap className="w-4 h-4" /> },
    { id: 'advanced-methods', label: 'Advanced Methods', icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'static-files', label: 'Static Files', icon: <Box className="w-4 h-4" /> },
    { id: 'cookies', label: 'Cookie Helpers', icon: <Box className="w-4 h-4" /> },
    { id: 'health', label: 'Health Check', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'enterprise', label: 'Enterprise Features', icon: <Layers className="w-4 h-4" /> },
    { id: 'cli', label: 'Code Generation', icon: <Terminal className="w-4 h-4" /> },
    { id: 'api-docs', label: 'OpenAPI Documentation', icon: <Box className="w-4 h-4" /> },
    { id: 'examples', label: 'Examples: CRUD API', icon: <Database className="w-4 h-4" /> },
    { id: 'error-handling', label: 'Error Handling', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveMenu(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -75% 0px' }
    );

    menuItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 flex flex-col md:flex-row gap-8 lg:gap-12 items-start relative">
      
      {/* Mobile Navigation Dropdown */}
      <div className="w-full md:hidden mb-4 bg-bg-secondary/50 border border-border-primary p-2 rounded-lg">
        <div className="flex items-center gap-2 mb-1.5 text-text-secondary text-xs font-bold uppercase tracking-widest px-1">
          <Layers className="w-3 h-3" /> Jump to section
        </div>
        <select 
          className="w-full bg-bg-primary text-text-primary border border-border-primary rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
          value={activeMenu}
          onChange={(e) => {
            setActiveMenu(e.target.value);
            document.getElementById(e.target.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {menuItems.map(item => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-24 bg-bg-primary/80 backdrop-blur-md border border-border-primary p-3 rounded-xl shadow-lg z-20 transition-colors max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col space-y-1">
          <div className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 transition-colors">Documentation</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left ${activeMenu === item.id ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
            >
              <div className={`${activeMenu === item.id ? 'text-emerald-500' : 'text-text-secondary'}`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Documentation Content */}
      <div className="flex-1 w-full max-w-3xl space-y-20 pb-32 min-w-0">
        
        <div className="border-b border-border-primary pb-8 transition-colors">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Buntok Reference</h1>
          <p className="text-text-secondary text-lg leading-relaxed transition-colors">
            Master the art of building blazing fast APIs. Explore the comprehensive guide to Buntok's architecture, decorators, and advanced features.
          </p>
        </div>

        {/* Section: Quick Start */}
        <DocSection id="quick-start" title="Quick Start">
          <p className="text-text-secondary leading-relaxed mb-4">The fastest way to scaffold a Buntok application is using our official CLI tool. It automatically sets up TypeScript, Biome for linting, and standard configuration files.</p>
          <CodeBlock language="bash" isDark={isDark}>{
`bun create buntok@latest my-app
cd my-app
bun install
bun run dev`
          }</CodeBlock>
          <p className="text-text-secondary leading-relaxed mt-6">By default, the development server will launch on <code>http://localhost:1212</code> with hot-reloading enabled.</p>
        </DocSection>

        {/* Section: Server Initialization */}
        <DocSection id="initialization" title="Server Initialization">
          <p className="text-text-secondary leading-relaxed mb-4">Starting the server is incredibly flexible. Buntok uses port <code>1212</code> by default or reads from the <code>PORT</code> environment variable.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { App } from "buntok";

const app = new App();

// Explicit port and callback
app.listen(1212, () => {
  console.log("Server is running on port 1212!");
});

// Or use environment variable
// PORT=8080 bun run src/index.ts`
          }</CodeBlock>
        </DocSection>

        {/* Section: Controllers */}
        <DocSection id="controllers" title="Controllers & Routing">
          <p className="text-text-secondary leading-relaxed mb-4">Controllers group related route handlers together using standard ES classes and decorators. Buntok uses an AOT (Ahead-of-Time) compiler at startup to resolve these decorators into a highly optimized switch-case router, meaning routing has virtually zero overhead.</p>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Defining a Controller</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Use the <code>@Controller(prefix)</code> decorator on your class, and HTTP decorators like <code>@Get</code>, <code>@Post</code>, <code>@Put</code>, <code>@Delete</code>, and <code>@Patch</code> on your methods.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { Controller, Get, Post, Context } from 'buntok';

@Controller('/users')
export class UserController {
  
  @Get('/')
  getAll(ctx: Context) {
    return ctx.json({ users: ['Alice', 'Bob'] });
  }

  @Post('/')
  async create(ctx: Context) {
    const body = await ctx.body();
    return ctx.json({ created: true, data: body }, 201);
  }
}`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Registering Controllers</h3>
          <p className="text-text-secondary leading-relaxed mb-4">After defining your controller, instantiate and register it in your main application instance using <code>app.registerController()</code>.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { App } from 'buntok';
import { UserController } from './controllers/user';

const app = new App();

// Register the controller
app.registerController(new UserController());

app.listen(1212);`
          }</CodeBlock>
        </DocSection>

        {/* Section: Route Groups */}
        <DocSection id="groups" title="Route Groups">
          <p className="text-text-secondary leading-relaxed mb-4">Create modular route groups with shared prefixes and nested middlewares natively.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`const api = app.group("/api");

// Parent middleware applied to all /api routes
api.use(loggerMiddleware);

// Nested groups
const v1 = api.group("/v1");
v1.get("/users", handler); // Accessible at GET /api/v1/users

const admin = api.group("/admin");
admin.use(adminAuthMiddleware); // Specific to /api/admin/*
admin.get("/dashboard", dashboardHandler);`
          }</CodeBlock>
        </DocSection>

        {/* Section: Context */}
        <DocSection id="context" title="The Context Object">
          <p className="text-text-secondary leading-relaxed mb-4">Every route handler receives a lightweight <code>Context</code> object. It provides zero-overhead wrappers around the native Bun Request object and heavily optimized response formatters.</p>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">ctx.request</h3>
          <p className="text-text-secondary leading-relaxed mb-4">The raw Web <code>Request</code> object.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`app.get("/headers", (ctx) => {
  const userAgent = ctx.request.headers.get("User-Agent");
  return ctx.json({ userAgent });
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">ctx.params</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Route parameters as key-value pairs. <strong>Note: All values are strings.</strong> You must convert them manually if you need numbers.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Route: /users/:userId/posts/:postId
app.get("/users/:userId/posts/:postId", (ctx) => {
  const { userId, postId } = ctx.params;
  return ctx.json({ userId, postId });
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">ctx.store</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Shared data object between middleware and handlers. Useful for passing data down the pipeline (e.g., authenticated user).</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Set data in middleware
app.use(async (ctx, next) => {
  ctx.store.user = { id: 1, name: "Pito" };
  return next();
});

// Access in handler
app.get("/profile", (ctx) => {
  return ctx.json({ user: ctx.store.user });
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Response Formatters</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Buntok provides fast response formatters: <code>ctx.json(data, status)</code>, <code>ctx.text(text, status)</code>, and <code>ctx.status(code)</code>.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// JSON response
return ctx.json({ error: "Invalid input" }, 400);

// Plain text response
return ctx.text("Hello, World!", 200);

// Empty response with just a status code (e.g. DELETE success)
return ctx.status(204);`
          }</CodeBlock>
        </DocSection>

        {/* Section: Body & Query */}
        <DocSection id="body-query" title="Body & Query Parsing">
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Query Parameters (ctx.query)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Buntok parses Query strings automatically into <code>ctx.query</code>. Note that all parsed values are strings.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Request: GET /search?q=apple&sort=desc&limit=10
app.get('/search', (ctx: Context) => {
  const { q, sort, limit } = ctx.query;
  
  // limit is a string "10", convert if necessary!
  return ctx.json({ q, sort, limit: Number(limit) });
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">JSON Body Parsing (ctx.body())</h3>
          <p className="text-text-secondary leading-relaxed mb-4">For JSON request bodies, utilize the native wrapper <code>ctx.body&lt;T&gt;()</code>. It automatically parses the JSON and throws a 400 Bad Request error if the payload is malformed.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`@Post('/create')
async create(ctx: Context) {
  // Parse incoming JSON body with explicit generic type
  const body = await ctx.body<{ name: string; email: string }>();
  
  return ctx.json({ 
    status: 'Success', 
    name: body.name,
    email: body.email 
  });
}`
          }</CodeBlock>
        </DocSection>

        {/* Section: Dependency Injection */}
        <DocSection id="di" title="Dependency Injection">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok provides type-safe dependency injection via generics and proxies. Access your database or services effortlessly anywhere.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// 1. Define your container type
type Container = {
  db: Database;
  config: { port: number };
};

// 2. Initialize App with Container type
const app = new App<Container>();

// 3. Register dependencies
app.set("db", new Database());
app.set("config", { port: 1212 });

// 4. Access in routes safely (fully autocompleted!)
app.get("/users", (ctx) => {
  const users = ctx.di.db.getUsers();
  const { config } = ctx.di;
  return ctx.json({ db_port: config.port, data: users });
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Middlewares */}
        <DocSection id="middlewares" title="Global Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok supports an asynchronous onion-style middleware architecture using the <code>next()</code> function.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Global Request Logger
app.use(async (ctx, next) => {
  const start = performance.now();
  
  // Await the downstream handlers
  const response = await next();
  
  const ms = performance.now() - start;
  console.log(\`[\${ctx.req.method}] \${ctx.req.url} - \${ms.toFixed(2)}ms\`);
  
  return response; // Must return the response back up the chain
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Built-in Middlewares */}
        <DocSection id="built-in" title="Built-in Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok ships with powerful standard middlewares built directly into the framework.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-bg-primary border border-border-primary p-5 rounded-xl shadow-sm transition-colors">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" /> CORS</h3>
              <p className="text-sm text-text-secondary">Handles Cross-Origin Resource Sharing effortlessly with highly customizable origins, headers, and credentials.</p>
              <code className="text-xs text-blue-500 dark:text-blue-400 mt-3 block">import {"{ cors }"} from "buntok/middlewares/cors";</code>
            </div>
            <div className="bg-bg-primary border border-border-primary p-5 rounded-xl shadow-sm transition-colors">
              <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> Validator</h3>
              <p className="text-sm text-text-secondary">Schema-agnostic validation (works with Zod, Valibot, Yup) for Body and Params.</p>
              <code className="text-xs text-blue-500 dark:text-blue-400 mt-3 block">import {"{ validate }"} from "buntok/middlewares/validator";</code>
            </div>
            <div className="bg-bg-primary border border-border-primary p-5 rounded-xl shadow-sm transition-colors">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Database className="w-4 h-4 text-yellow-500" /> Rate Limiter</h3>
              <p className="text-sm text-text-secondary">In-memory rate limiter with sliding window support, custom keys, and automatic retry-after headers.</p>
              <code className="text-xs text-blue-500 dark:text-blue-400 mt-3 block">import {"{ rateLimiter }"} from "buntok/middlewares/rate-limiter";</code>
            </div>
            <div className="bg-bg-primary border border-border-primary p-5 rounded-xl shadow-sm transition-colors">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> Request ID</h3>
              <p className="text-sm text-text-secondary">Automatically generate and attach unique UUIDs to trace requests across logs.</p>
              <code className="text-xs text-blue-500 dark:text-blue-400 mt-3 block">import {"{ requestId }"} from "buntok/middlewares/request-id";</code>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">CORS Example</h3>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { cors } from "buntok/middlewares/cors";

app.use(cors({
  origin: ["https://example.com"],
  methods: ["GET", "POST", "PUT"],
  credentials: true,
}));`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Validator Example</h3>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { validateBody, validateParams } from "buntok/middlewares/validator";
import { z } from "zod";

const UserSchema = z.object({ name: z.string() });

app.post("/users", validateBody(UserSchema), (ctx) => {
  const data = ctx.store.validatedBody; // Fully typed!
  return ctx.json({ created: true, data });
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Rate Limiter & Request ID</h3>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { rateLimiter } from "buntok/middlewares/rate-limiter";
import { requestId } from "buntok/middlewares/request-id";

// Sliding window rate limiting: 50 requests per minute
app.use(rateLimiter({ max: 50, windowMs: 60000 }));

// Attach x-request-id to all requests
app.use(requestId());`
          }</CodeBlock>
        </DocSection>

        {/* Section: WebSockets */}
        <DocSection id="websockets" title="WebSockets (Raw)">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok leverages Bun's native WebSocket server for extreme performance. It uses Raw WebSockets (RFC 6455) instead of proprietary protocols like Socket.IO.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`app.ws("/ws", {
  open: (ws) => {
    // Treat the user's ID as their own private "room"
    const userId = "user-123";
    ws.subscribe(\`user_\${userId}\`);
    console.log("Client connected!");
  },
  message: (ws, msg) => {
    const payload = JSON.parse(String(msg));
    if (payload.event === "typing") {
      // Handle event
    }
  }
});`
          }</CodeBlock>
          <p className="text-text-secondary leading-relaxed mt-4">You can publish events to specific users natively from any route or background job:</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`app.post("/api/checkout", (ctx) => {
  const userId = "user-123";
  const payload = JSON.stringify({ event: "order_completed", data: { id: 456 } });
  
  // Broadcast only to this specific user's socket
  app.server?.publish(\`user_\${userId}\`, payload);
  
  return ctx.json({ success: true });
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: SSE */}
        <DocSection id="sse" title="Server-Sent Events (SSE)">
          <p className="text-text-secondary leading-relaxed mb-4">Real-time data streaming to clients is incredibly simple using the native <code>SSE</code> class.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { SSE } from "buntok";

// Basic SSE endpoint
app.get("/events", (ctx) => {
  const sse = new SSE(ctx.request);
  
  // Send various types of events
  sse.sendEvent("message", { text: "Hello from Buntok!" });
  sse.sendData("Simple data string");
  sse.sendWithId(1, { id: 1, data: "Event with ID" });
  
  // Connect and hold the stream open
  return sse.connect();
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Advanced Options</h3>
          <CodeBlock language="typescript" isDark={isDark}>{
`// With connection options
app.get("/stream", (ctx) => {
  const sse = new SSE(ctx.request, {
    sendInitial: true,
    initialEvent: "connected",
    retry: 5000, // Client will reconnect after 5 seconds if disconnected
  });
  
  return sse.connect();
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Advanced Methods */}
        <DocSection id="advanced-methods" title="Advanced Routing (QUERY)">
          <p className="text-text-secondary leading-relaxed mb-4">Have you ever needed to send a massive JSON body for a search filter, but felt dirty using <code>POST</code> for a read-only operation? Buntok natively supports the upcoming <code>QUERY</code> HTTP method (RFC 10008), allowing you to safely execute complex, idempotent read queries while sending a JSON body.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Complex query with filters safely inside the body!
app.query("/orders", async (ctx) => {
  // Parse the massive JSON filter body
  const filters = await ctx.body<{
    select: string[];
    where: Record<string, unknown>;
    limit: number;
    sort: { field: string; order: "asc" | "desc" }[];
  }>();
  
  const results = await db.query(filters);
  return ctx.json({ data: results });
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Static Files */}
        <DocSection id="static-files" title="Serving Static Files & SPA">
          <p className="text-text-secondary leading-relaxed mb-4">Serve static assets effortlessly with automatic MIME-type resolution, and easily support Single Page Applications (SPA) like React or Vue.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { App } from "buntok";

const app = new App();

// Serve the ./public directory at /assets
app.static("/assets", "./public");

// Set a custom favicon
app.icon("./assets/custom-favicon.ico");

// SPA fallback - serve index.html for all unrecognized routes!
app.get("*", (ctx) => {
  return new Response(Bun.file("./public/index.html"));
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Cookie Helpers */}
        <DocSection id="cookies" title="Cookie Helpers">
          <p className="text-text-secondary leading-relaxed mb-4">Read, set, and delete cookies natively without needing external libraries. Buntok provides fully-typed configuration options.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { setCookie, deleteCookie, parseCookies } from "buntok/helpers/cookie";

// Set a cookie securely on a Response
app.post("/login", async (ctx) => {
  const response = ctx.json({ success: true });
  return setCookie(response, "auth_token", "xyz123", {
    httpOnly: true, 
    secure: true, 
    sameSite: "lax",
    maxAge: 86400 // 1 day
  });
});

// Read a specific cookie
app.get("/profile", (ctx) => {
  const token = ctx.getCookie("auth_token");
  return ctx.json({ token });
});

// Parse all cookies
app.get("/cookies", (ctx) => {
  // Returns a Record<string, string> of all cookies
  const cookies = ctx.getCookies(); 
  return ctx.json({ cookies });
});

// Delete a cookie
app.post("/logout", (ctx) => {
  const response = ctx.json({ success: true });
  return deleteCookie(response, "auth_token");
});`
          }</CodeBlock>
        </DocSection>

        {/* Section: Health Check */}
        <DocSection id="health" title="Health Check">
          <p className="text-text-secondary leading-relaxed mb-4">Critical for Kubernetes/Docker orchestration. Automatically register health checks including custom database and Redis pings.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { healthCheck, createDatabaseCheck, createHealthCheck } from "buntok/middlewares/health-check";

// Basic health check
healthCheck(app, { path: "/health" });

// Advanced health check with database validation
healthCheck(app, {
  path: "/api/health",
  check: createDatabaseCheck(async () => {
    await db.query("SELECT 1");
    return true; // Return true if healthy
  }),
});

// Multiple checks (e.g. DB + Redis)
healthCheck(app, {
  check: createHealthCheck([
    { name: "database", check: async () => true },
    { name: "redis", check: async () => true },
  ]),
});`
          }</CodeBlock>
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Expected JSON Payload</h3>
          <CodeBlock language="json" isDark={isDark}>{
`{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "up", "duration": 5 },
    "redis": { "status": "up", "duration": 1 }
  }
}`
          }</CodeBlock>
        </DocSection>

        {/* Section: Enterprise Features */}
        <DocSection id="enterprise" title="Enterprise Features">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok is built to scale with massive enterprise-ready features out of the box.</p>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6 text-emerald-500">Caching</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Buntok includes a robust caching system using a Driver pattern. By default, it uses <code>MemoryCacheDriver</code>.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { Cache, MemoryCacheDriver } from "buntok";

// Initialize the Cache
const cache = new Cache(new MemoryCacheDriver());

// Set a value with a 60-second TTL
await cache.set("user:1", { name: "John" }, 60);

// Retrieve a value
const user = await cache.get("user:1");`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6 text-blue-500">Background Queues</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Handle long-running tasks asynchronously using the built-in Queue system.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { Queue, MemoryQueueDriver } from "buntok";

// Initialize the Queue
const emailQueue = new Queue(new MemoryQueueDriver());

// Define a worker
emailQueue.process(async (job) => {
  console.log("Sending email to:", job.data.to);
});

// Add jobs to the queue
await emailQueue.add({ to: "admin@example.com", subject: "Hello" });`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6 text-purple-500">Task Scheduler</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Run recurring background jobs using standard cron syntax and the <code>@CronJob()</code> decorator.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { Controller, CronJob } from "buntok";

@Controller("/tasks")
export class TaskController {
  
  // Runs every minute
  @CronJob("* * * * *")
  async performCleanup() {
    console.log("Cleaning up expired sessions...");
  }
}`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6 text-red-500">Auth Guards</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Protect your endpoints using granular Auth Guards and the <code>@UseGuard()</code> decorator.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { Controller, Get, UseGuard, type GuardFn } from "buntok";

const IsAdmin: GuardFn = async (ctx) => {
  const user = await ctx.di.get("user");
  return user?.role === "admin";
};

@Controller("/admin")
export class AdminController {
  
  @Get("/dashboard")
  @UseGuard(IsAdmin)
  async dashboard(ctx) {
    return ctx.json({ message: "Welcome Admin" });
  }
}`
          }</CodeBlock>
        </DocSection>

        {/* Section: Code Generation */}
        <DocSection id="cli" title="Code Generation (CLI)">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok ships with an advanced CLI to automatically generate Drizzle schemas, repositories, services, and controllers in seconds.</p>
          <CodeBlock language="bash" isDark={isDark}>{
`# Generate all files for the "user" entity
bunx buntok create user

# Generate specific layers
bunx buntok create order --schema --repo`
          }</CodeBlock>
        </DocSection>

        {/* Section: OpenAPI Documentation */}
        <DocSection id="api-docs" title="OpenAPI Documentation (Swagger/Scalar)">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok provides a native command to magically generate a full <strong>OpenAPI 3.0</strong> spec (`swagger.json`) and a beautiful <strong>Scalar UI</strong> dashboard directly from your Zod validation schemas!</p>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Generating Docs</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Run the following command in your terminal. It will scan your application's routes and schemas, then output the static files into your <code>/public</code> directory.</p>
          <CodeBlock language="bash" isDark={isDark}>{
`# Generate OpenAPI docs and Scalar UI
bunx buntok make:docs`
          }</CodeBlock>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Serving the UI</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Make sure you have registered your application instance properly in <code>src/index.ts</code> so the CLI can read it:</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { App } from "buntok";

// Export is REQUIRED for make:docs to work!
export const app = new App();

// Serve the generated docs folder
app.static("/", "./public");

app.listen(1212);`
          }</CodeBlock>
          <p className="text-emerald-500 text-sm italic mt-4">✓ After running the command, visit <code>http://localhost:1212/docs.html</code> to view your API Reference!</p>
        </DocSection>

        {/* Section: Examples: CRUD API */}
        <DocSection id="examples" title="Full Example: CRUD API">
          <p className="text-text-secondary leading-relaxed mb-4">Here is a fully functional, complete example of building a RESTful CRUD API with Buntok in a single file.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`import { App } from "buntok";

const app = new App();

// In-memory storage for demonstration
const users: Array<{ id: string; name: string; email: string }> = [];

// [READ] List all users
app.get("/users", (ctx) => {
  return ctx.json({ data: users });
});

// [READ] Get user by ID
app.get("/users/:id", (ctx) => {
  const user = users.find((u) => u.id === ctx.params.id);
  if (!user) return ctx.json({ error: "User not found" }, 404);
  return ctx.json({ data: user });
});

// [CREATE] Create new user
app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string; email: string }>();
  const user = { id: crypto.randomUUID(), ...body };
  users.push(user);
  return ctx.json({ data: user }, 201);
});

// [UPDATE] Update existing user
app.put("/users/:id", async (ctx) => {
  const index = users.findIndex((u) => u.id === ctx.params.id);
  if (index === -1) return ctx.json({ error: "User not found" }, 404);
  
  const body = await ctx.body<{ name: string; email: string }>();
  users[index] = { ...users[index], ...body };
  return ctx.json({ data: users[index] });
});

// [DELETE] Remove user
app.delete("/users/:id", (ctx) => {
  const index = users.findIndex((u) => u.id === ctx.params.id);
  if (index === -1) return ctx.json({ error: "User not found" }, 404);
  
  users.splice(index, 1);
  return ctx.status(204); // No Content
});

app.listen(1212, () => console.log("Server running..."));`
          }</CodeBlock>
        </DocSection>

        {/* Section: Error Handling */}
        <DocSection id="error-handling" title="Custom Error Handling">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok provides two global handlers to intercept errors and missing routes, ensuring your application always returns consistent JSON responses instead of crashing or exposing raw stack traces.</p>
          
          <h3 className="font-bold text-lg mb-2 text-white mt-6">Global Exception Handler (app.onError)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">If any route handler or middleware throws an uncaught error, Buntok will automatically catch it and forward it to this handler.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Custom global error handler
app.onError((err, ctx) => {
  // Log it to your APM or logger
  console.error("Unhandled Exception:", err.message);
  
  // Return a graceful JSON response
  return ctx.json({ 
    success: false, 
    message: "Internal Server Error" 
  }, 500);
});`
          }</CodeBlock>

          <h3 className="font-bold text-lg mb-2 text-white mt-6">Not Found Handler (app.notFound)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Triggered when a client requests a route that does not exist in your application.</p>
          <CodeBlock language="typescript" isDark={isDark}>{
`// Custom 404 handler
app.notFound((ctx) => {
  return ctx.json({ 
    success: false,
    error: \`Route \${ctx.req.url} not found on this server.\`,
    path: new URL(ctx.request.url).pathname
  }, 404);
});`
          }</CodeBlock>
        </DocSection>

      </div>
    </div>
  );
}

function DocSection({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="text-3xl font-bold text-text-primary mb-6 inline-block relative transition-colors">
        {title}
        <div className="absolute -bottom-2 left-0 w-12 h-1 bg-emerald-500 rounded-full"></div>
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function CodeBlock({ language, children, isDark }: { language: string, children: string, isDark: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border-primary my-6 shadow-md transition-colors w-full max-w-full">
      <div className="bg-bg-secondary px-4 py-2 flex items-center gap-2 border-b border-border-primary transition-colors">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        <div className="ml-4 text-xs font-mono text-text-secondary">{language}</div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          customStyle={{ margin: 0, padding: '1.5rem', background: isDark ? '#060606' : '#ffffff', fontSize: '0.875rem', lineHeight: '1.6' }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
