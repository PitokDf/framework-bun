"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showWindowControls?: boolean;
}

function normalizeTheme(theme: Record<string, any>) {
  const normalized = { ...theme };
  for (const key of Object.keys(normalized)) {
    if (normalized[key]?.backgroundColor) {
      normalized[key] = { ...normalized[key], background: normalized[key].backgroundColor };
      delete normalized[key].backgroundColor;
    }
  }
  return normalized;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  showWindowControls = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  const darkStyle = useMemo(() => normalizeTheme(vscDarkPlus), []);
  const lightStyle = useMemo(() => normalizeTheme(vs), []);

  useEffect(() => setMounted(true), []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showHeader = filename || showWindowControls;

  return (
    <div className="relative group rounded-xl border border-border-primary overflow-hidden bg-bg-tertiary">
      {/* Header - Elysia style: lang label + copy, no traffic lights */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-primary bg-bg-secondary">
          <div className="flex items-center gap-2">
            {filename ? (
              <span className="text-xs text-text-secondary font-mono">{filename}</span>
            ) : (
              <span className="text-xs text-text-secondary font-mono">{language}</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:text-accent hover:bg-accent-muted transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Code */}
      <div className="relative">
        {mounted ? (
          <SyntaxHighlighter
            language={language}
            style={theme === "dark" ? darkStyle : lightStyle}
            showLineNumbers={showLineNumbers}
            customStyle={{
              margin: 0,
              padding: "0.75rem 1rem",
              fontSize: "0.8125rem",
              lineHeight: "1.55",
              background: "transparent",
            }}
            codeTagProps={{
              style: {
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className="px-4 py-3 text-[0.8125rem] leading-[1.55]">
            <code>{code}</code>
          </pre>
        )}

        {/* Copy button (when no header) - keep header for lang, so this rarely shows */}
        {!showHeader && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-text-secondary bg-bg-secondary border border-border-primary px-1.5 py-0.5 rounded">{language}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md bg-bg-secondary border border-border-primary text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
