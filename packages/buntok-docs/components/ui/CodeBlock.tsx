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
    <div className="relative group rounded-lg border border-border-primary overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary bg-bg-secondary">
          <div className="flex items-center gap-3">
            {/* macOS window dots */}
            {showWindowControls && (
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-red-400 transition-colors" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-yellow-400 transition-colors" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-green-400 transition-colors" />
              </div>
            )}
            {filename && (
              <span className="text-sm text-text-secondary font-mono">
                {filename}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
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
              padding: "1.25rem",
              fontSize: "0.85rem",
              lineHeight: "1.7",
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
          <pre className="p-5 text-sm leading-relaxed">
            <code>{code}</code>
          </pre>
        )}

        {/* Copy button (when no header) */}
        {!showHeader && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-lg bg-bg-secondary border border-border-primary text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
