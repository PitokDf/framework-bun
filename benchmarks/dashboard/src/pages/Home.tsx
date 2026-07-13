import { useState, useEffect } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function HomePage({ setActiveTab, isDark }: { setActiveTab: (t: any) => void; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle interactive background effect tracking mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const copyCmd = () => {
    navigator.clipboard.writeText('npm create buntok@latest');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative animate-fade-up">
      {/* --- Full-width Background Container --- */}
      <div className="absolute top-0 left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] w-[100vw] h-full pointer-events-none z-0">
        
        {/* Subtle dynamic background glow */}
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${isDark ? 'rgba(249, 115, 22, 0.05)' : 'rgba(249, 115, 22, 0.08)'}, transparent 40%)`
          }}
        />

        {/* Grid Pattern with Moving Lines */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)]">
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:4rem_4rem]"
            style={{ backgroundPosition: 'center top' }}
          />
          {/* Animated Circuit Beams (Cornering) */}
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[1920px] h-[1000px] pointer-events-none">
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
              {/* Path 1: Top-left, down, right, down */}
              <path d="M 384 -64 V 256 H 704 V 800" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="6s" repeatCount="indefinite" />
              </path>
              
              {/* Path 2: Right, left, down, left */}
              <path d="M 1984 128 H 1280 V 384 H 896 V 900" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="8s" begin="1s" repeatCount="indefinite" />
              </path>

              {/* Path 3: Bottom-left, up, right, up */}
              <path d="M 192 1000 V 448 H 512 V -64" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="7s" begin="2s" repeatCount="indefinite" />
              </path>

              {/* Path 4: Top-right, down, left, down */}
              <path d="M 1600 -64 V 192 H 1408 V 800" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="150 3000">
                <animate attributeName="stroke-dashoffset" from="3000" to="-150" dur="5s" begin="0.5s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
        </div>
      </div>
      
      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center pt-24 pb-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-primary bg-bg-secondary/50 backdrop-blur-sm text-xs text-text-secondary mb-8 hover:border-[#f97316]/50 hover:bg-[#f97316]/5 transition-all cursor-default group">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse group-hover:scale-125 transition-transform" />
          <span>Buntok v0.2.0 is released —</span>
          <span className="text-text-primary font-medium group-hover:text-[#f97316] transition-colors">Read the changelog →</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.08] mb-6 max-w-4xl relative">
          The Decorator-First{' '}
          <br className="hidden sm:block" />
          <span className="relative inline-block text-[#f97316] hover:scale-105 transition-transform duration-300 cursor-default">
            Performance
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#f97316]/20 rounded-full blur-sm" />
          </span> Framework
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-xl mb-10 leading-relaxed">
          Buntok combines NestJS-style OOP architecture with the raw speed of the Bun runtime.
          AOT-compiled routing, zero overhead, full TypeScript.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('docs')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-text-primary text-bg-primary text-sm font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={copyCmd}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-tertiary text-sm font-mono text-text-secondary hover:border-[#f97316]/50 transition-all duration-300 active:scale-95 group"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0 text-[#f97316] group-hover:animate-bounce" />
            npm create buntok@latest
            <span className="ml-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity">{copied ? '✓' : '⌘C'}</span>
          </button>
        </div>

        {/* Divider stats bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-text-secondary">
          {[
            { val: '300k+', label: 'req/s on Bun' },
            { val: 'AOT', label: 'Compiled Router' },
            { val: '100%', label: 'TypeScript' },
            { val: 'MIT', label: 'Open Source' },
          ].map((s, i) => (
            <div 
              key={s.label} 
              className="flex items-center gap-2 hover:-translate-y-1 transition-transform duration-300 cursor-default"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="font-bold text-text-primary text-base">{s.val}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code preview ── */}
      <section className="relative z-10 border-t border-border-primary py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 hover:translate-x-2 transition-transform duration-500">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[#f97316]/50" />
              Why Buntok?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">Clean. Fast. Typed.</h2>
            <p className="text-text-secondary leading-relaxed mb-8 text-lg">
              Write your API the way it should be written — with classes, decorators,
              and automatic type inference. Buntok compiles everything ahead of time
              so the runtime has zero overhead.
            </p>
            <ul className="space-y-4 text-sm text-text-secondary">
              {[
                'Decorator-based Controllers with @Get, @Post, etc.',
                'RouteContext<Path, Body> for 100% type-safe handlers',
                'AOT router compilation — no dynamic lookup at runtime',
                'Built-in zValidator, CORS, Rate Limiter, SSE, WebSockets',
              ].map((item) => (
                <li 
                  key={item} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-secondary/50 border border-transparent hover:border-border-primary transition-all duration-300"
                >
                  <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#f97316]/10 text-[#f97316] text-xs shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.1)]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="order-1 lg:order-2 group perspective-1000">
            <div className="rounded-xl overflow-hidden border border-border-primary shadow-2xl shadow-black/20 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] group-hover:-translate-y-2 group-hover:rotate-1">
              <div className="bg-bg-secondary border-b border-border-primary px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-red-400 transition-colors" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-yellow-400 transition-colors" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-green-400 transition-colors" />
                </div>
                <span className="ml-3 text-xs font-mono text-text-secondary">user.controller.ts</span>
              </div>
              <SyntaxHighlighter
                language="typescript"
                style={isDark ? vscDarkPlus : vs}
                customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.85rem', lineHeight: '1.7' }}
              >{`import { Controller, Get, Post, Use, RouteContext } from 'buntok';
import { zValidator, z } from 'buntok';

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
  async create(ctx: RouteContext) {
    const data = ctx.valid('body'); // Fully typed!
    return ctx.json({ success: true, data });
  }
}`}</SyntaxHighlighter>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEO & GEO Optimized FAQ Section ── */}
      <section className="relative z-10 border-t border-border-primary py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary">Direct answers for modern developers.</p>
          </div>

          <div className="space-y-8">
            {/* FAQ Item 1 */}
            <div className="bg-bg-secondary/50 rounded-xl p-6 border border-border-primary hover:border-[#f97316]/30 transition-colors">
              <h3 className="text-xl font-semibold mb-3">What makes Buntok faster than Express or NestJS?</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Buntok achieves <strong>300,000+ requests per second</strong> by eliminating runtime overhead. Unlike Express or NestJS which resolve routes dynamically on every request, Buntok uses <strong>Ahead-of-Time (AOT) Compilation</strong>. At startup, it compiles your Decorators into a single, flat mapping function using Bun's native <code>Bun.serve()</code> API.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-bg-secondary/50 rounded-xl p-6 border border-border-primary hover:border-[#f97316]/30 transition-colors">
              <h3 className="text-xl font-semibold mb-3">Is Buntok enterprise-ready?</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Yes. Buntok provides a comprehensive suite of zero-dependency enterprise features built directly into the core framework:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-2">
                <li><strong>Telescope DevTools:</strong> Real-time network and error monitoring dashboard.</li>
                <li><strong>WebCrypto JWT:</strong> Native, high-performance JWT authentication.</li>
                <li><strong>Built-in Mailer:</strong> Zero-dependency HTTP email clients for Resend, SendGrid, and Mailgun.</li>
                <li><strong>Zod Environment Validation:</strong> Guarantees environment variables at boot (T3 Stack style).</li>
              </ul>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-bg-secondary/50 rounded-xl p-6 border border-border-primary hover:border-[#f97316]/30 transition-colors">
              <h3 className="text-xl font-semibold mb-3">How does Buntok support Generative AI?</h3>
              <p className="text-text-secondary leading-relaxed">
                Buntok natively supports the <strong>Vercel AI SDK Data Stream Protocol</strong> out of the box. By using our built-in <code>streamAI()</code> utility, you can effortlessly pipe OpenAI or Anthropic responses directly into React, Vue, or Svelte frontends without dealing with raw SSE buffers or ReadableStreams.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
