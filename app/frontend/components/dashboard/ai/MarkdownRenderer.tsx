"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

// Convert Slack mrkdwn link format <url|text> or <url> to standard Markdown [text](url)
function formatSlackToMarkdown(text: string): string {
  if (!text) return "";
  
  // Replace <http://url|label> with [label](http://url)
  let formatted = text.replace(/<((?:https?|ftp):\/\/[^|>\s]+)\|([^>]+)>/g, "[$2]($1)");
  
  // Replace <http://url> with [http://url](http://url)
  formatted = formatted.replace(/<((?:https?|ftp):\/\/[^>\s]+)>/g, "[$1]($1)");

  return formatted;
}

function CodeBlock({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-muted/80 text-primary border border-border/50"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="my-2.5 rounded-lg border border-border/60 bg-zinc-950/90 text-zinc-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed selection:bg-primary/30">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content, isUser = false }: MarkdownRendererProps) {
  const processedContent = formatSlackToMarkdown(content);

  return (
    <div
      className={`slack-markdown text-xs leading-relaxed break-words space-y-2 ${
        isUser ? "text-primary-foreground font-normal" : "text-foreground"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/40 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-foreground mt-2.5 mb-1 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-foreground/90 mt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-foreground/80 mt-1.5 mb-0.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed marker:text-muted-foreground/80 pl-0.5">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-primary/70 bg-primary/5 pl-3 py-1 my-2 rounded-r text-foreground/80 italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-md border border-border/60">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70 text-foreground font-semibold border-b border-border/60">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/30">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-xs font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-xs text-foreground/90">{children}</td>
          ),
          hr: () => <hr className="border-t border-border/50 my-2.5" />,
          code: ({ node, inline, className, children, ...props }: any) => {
            return (
              <CodeBlock inline={inline} className={className} {...props}>
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
