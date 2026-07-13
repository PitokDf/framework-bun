import { useEffect, useState } from 'react';
import { Sun, Moon, ExternalLink } from 'lucide-react';
import { BenchmarkSection } from './Benchmark';
import { HomePage } from './pages/Home';
import { DocsPage } from './pages/Docs';
export default function App() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'benchmarks'>('home');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json`)
      .then(r => r.json()).then(setData).catch(console.error);
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle('dark');
    setIsDark(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-200">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-border-primary bg-bg-primary/80 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-5 h-full flex items-center justify-between gap-6">

          {/* Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.ico`}
              alt="Buntok"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-base tracking-tight">Buntok</span>
          </button>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {(['home', 'docs', 'benchmarks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-text-primary bg-bg-tertiary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {tab === 'benchmarks' ? 'Benchmarks' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/PitokDf/framework-bun"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <div className="w-px h-4 bg-border-primary hidden sm:block" />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile tabs */}
            <div className="flex sm:hidden items-center gap-1 ml-1">
              {(['docs', 'benchmarks'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-text-primary bg-bg-tertiary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab === 'benchmarks' ? 'Stats' : 'Docs'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="max-w-6xl mx-auto px-5 pt-14 pb-20 min-h-screen">
        {activeTab === 'home'       && <HomePage setActiveTab={setActiveTab} isDark={isDark} data={data} />}
        {activeTab === 'docs'       && <DocsPage isDark={isDark} />}
        {activeTab === 'benchmarks' && (
          <div className="animate-fade-up pt-10">
            <BenchmarkSection data={data} isDark={isDark} />
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border-primary bg-bg-primary transition-colors">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Buntok" className="w-5 h-5 opacity-70" />
            <span className="font-medium text-text-primary">Buntok</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>MIT License</span>
            <span>·</span>
            <a href="https://github.com/PitokDf/framework-bun" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

