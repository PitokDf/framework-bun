import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeBlock({ language, children, isDark }: { language: string; children: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border-primary my-4 shadow-sm group">
      <div className="bg-bg-secondary border-b border-border-primary px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-xs font-mono text-text-secondary">{language}</span>
        </div>
        <button
          onClick={copy}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-0.5 rounded border border-transparent hover:border-border-primary opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          customStyle={{
            margin: 0, padding: '1.1rem 1.25rem',
            background: isDark ? '#0a0a0a' : '#fafafa',
            fontSize: '0.82rem', lineHeight: '1.65',
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
