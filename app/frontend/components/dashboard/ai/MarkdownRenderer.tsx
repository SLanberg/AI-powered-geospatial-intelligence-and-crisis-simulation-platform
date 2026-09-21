"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal, Target, Video } from "lucide-react";
import type { MapAction } from "@/components/dashboard/data";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
  onMapAction?: (action: MapAction) => void;
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Convert Slack mrkdwn link format <url|text> or <url> to standard Markdown [text](url),
// and smartly format inline bullets (•, ⁃, ◦) and SCADA telemetry labels into structured list items.
function formatSlackToMarkdown(text: string): string {
  if (!text) return "";
  
  // Replace <http://url|label> with [label](http://url)
  let formatted = text.replace(/<((?:https?|ftp):\/\/[^|>\s]+)\|([^>]+)>/g, "[$2]($1)");
  
  // Replace <http://url> with [http://url](http://url)
  formatted = formatted.replace(/<((?:https?|ftp):\/\/[^>\s]+)>/g, "[$1]($1)");

  // Normalize bullet points:
  // 1) Handle inline bullet separators like "text • Status: ... • Casualties: ..."
  formatted = formatted.replace(/(?:\s+|\s*\|\s*)[•⁃◦·]\s+/g, "\n  - ");

  // 2) Handle beginning-of-line unicode bullets like "• Status:" or "  • Status:"
  formatted = formatted.replace(/^(\s*)[•⁃◦·]\s+/gm, "$1- ");

  // 3) Auto-format key operational labels (e.g. "Status:", "Casualties & Impact:", "Recommendation:") if not already bolded
  formatted = formatted.replace(
    /(?:^|\n)(\s*-\s*)(Status|Casualties\s*(?:&|and)\s*Impact|Impact\s*(?:&|and)\s*Casualties|Casualties|Recommendation|Impact|Resolution|Action|Node|District|Telemetry|Unit|Severity):\s*/gi,
    (match, p1, p2) => {
      const leadingNewline = match.startsWith("\n") ? "\n" : "";
      return `${leadingNewline}${p1}**${p2}:** `;
    }
  );

  return formatted;
}

function PieChartBlock({ dataJson }: { dataJson: string }) {
  try {
    const parsed = JSON.parse(dataJson);
    const items: Array<{ name: string; value: number; color?: string }> = parsed.data || [];
    const total = items.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const title = parsed.title || "Category Distribution";

    const defaultColors = ["#ef4444", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899", "#3b82f6"];

    // Compute SVG arcs
    let accumulatedAngle = 0;
    const size = 150;
    const center = size / 2;
    const radius = 60;
    const innerRadius = 38; // Donut chart

    const slices = items.map((item, idx) => {
      const value = item.value || 0;
      const angle = total > 0 ? (value / total) * 360 : 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const color = item.color || defaultColors[idx % defaultColors.length];

      // Convert angles to radians (0 is at 12 o'clock)
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const ix1 = center + innerRadius * Math.cos(endRad);
      const iy1 = center + innerRadius * Math.sin(endRad);
      const ix2 = center + innerRadius * Math.cos(startRad);
      const iy2 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      let pathData = "";
      if (items.length === 1 || angle >= 359.9) {
        pathData = `M ${center} ${center - radius} A ${radius} ${radius} 0 1 0 ${center} ${center + radius} A ${radius} ${radius} 0 1 0 ${center} ${center - radius} M ${center} ${center - innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center + innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center - innerRadius} Z`;
      } else {
        pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
      }

      const percent = total > 0 ? Math.round((value / total) * 100) : 0;

      return {
        ...item,
        color,
        pathData,
        percent,
      };
    });

    return (
      <div className="my-2.5 rounded-xl border border-border/70 bg-zinc-950/85 p-3.5 shadow-md backdrop-blur-sm">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground/90">
              {title}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/40">
            Total: {parsed.total ?? total}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform drop-shadow-sm">
              {slices.map((slice, i) => (
                <path
                  key={i}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                  stroke="#09090b"
                  strokeWidth="2"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold font-mono text-foreground leading-none">
                {parsed.total ?? total}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                Total
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5 min-w-0">
            {slices.map((slice, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] font-mono"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate text-zinc-200">{slice.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-zinc-100">{slice.value}</span>
                  <span className="text-[10px] text-zinc-400 w-8 text-right font-medium">
                    {slice.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
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

  // Intercept chart:pie or pie languages
  if (language === "chart:pie" || language === "pie" || language === "chart" || (codeString.startsWith("{") && codeString.includes('"type": "pie"'))) {
    const pieElem = <PieChartBlock dataJson={codeString} />;
    if (pieElem) return pieElem;
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
      <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export const YouTubeEmbedBlock = React.memo(function YouTubeEmbedBlock({
  videoId,
  label,
  href,
}: {
  videoId: string;
  label: string;
  href?: string;
}) {
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/70 bg-zinc-950/95 shadow-lg select-none">
      <div className="relative w-full aspect-video bg-black">
        <iframe
          key={`yt-${videoId}`}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&enablejsapi=1`}
          title={label}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="px-3 py-2 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium truncate no-underline"
        >
          <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{label}</span>
        </a>
        <span className="text-[10px] font-mono text-zinc-400 shrink-0">YouTube 1080p</span>
      </div>
    </div>
  );
});

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isUser = false,
  onMapAction,
}: MarkdownRendererProps) {
  const processedContent = React.useMemo(() => formatSlackToMarkdown(content), [content]);

  const components = React.useMemo(
    () => ({
      h1: ({ children }: any) => (
        <h1 className="text-sm font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/40 flex items-center gap-1.5 tracking-tight">
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 className="text-xs font-bold text-foreground mt-2.5 mb-1 flex items-center gap-1.5">
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary/95 mt-2.5 mb-1.5 flex items-center gap-1.5 pb-1 border-b border-border/40 font-mono">
          {children}
        </h3>
      ),
      h4: ({ children }: any) => (
        <h4 className="text-xs font-semibold text-foreground/85 mt-1.5 mb-0.5">
          {children}
        </h4>
      ),
      p: ({ children }: any) => (
        <div className="mb-2 last:mb-0 leading-relaxed">{children}</div>
      ),
      ul: ({ children }: any) => (
        <ul className="list-disc pl-4 my-2 space-y-1.5 [&_ul]:list-[circle] [&_ul]:pl-3.5 [&_ul]:border-l [&_ul]:border-primary/20 [&_ul]:ml-1 [&_ul]:my-1.5 [&_ul]:space-y-1">
          {children}
        </ul>
      ),
      ol: ({ children }: any) => (
        <ol className="list-decimal pl-5 my-2 space-y-1.5">{children}</ol>
      ),
      li: ({ children }: any) => (
        <li className="leading-relaxed text-[12px] marker:text-primary/70 pl-0.5">
          {children}
        </li>
      ),
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-[3px] border-primary/70 bg-primary/5 pl-3 py-1 my-2 rounded-r text-foreground/80 italic">
          {children}
        </blockquote>
      ),
      strong: ({ children }: any) => {
        const rawText = String(children).trim();
        // Render specific operational and triage keywords as sleek cyber badges
        if (
          /^(Status|Casualties\s*(?:&|and)\s*Impact|Impact\s*(?:&|and)\s*Casualties|Casualties|Recommendation|Impact|Resolution|Action|Node|District|Telemetry|Unit|Severity|Details):?$/i.test(
            rawText
          )
        ) {
          return (
            <span className="inline-flex items-center px-1.5 py-0.2 mr-1 rounded bg-primary/15 text-primary border border-primary/30 text-[11px] font-mono font-medium tracking-tight shadow-2xs">
              {children}
            </span>
          );
        }
        if (/^(Critical\s*Priority|Active\s*Warnings|Monitored\s*\/\s*Mitigated|System\s*Status):?$/i.test(rawText)) {
          return (
            <strong className="font-semibold text-foreground tracking-wide underline underline-offset-4 decoration-primary/40">
              {children}
            </strong>
          );
        }
        return <strong className="font-semibold text-foreground">{children}</strong>;
      },
      em: ({ children }: any) => <em className="italic">{children}</em>,
      del: ({ children }: any) => <del className="line-through opacity-70">{children}</del>,
      a: ({ href, children }: any) => {
        const videoId = href ? extractYouTubeVideoId(href) : null;
        if (videoId) {
          const label = typeof children === "string" && !children.startsWith("http") ? children : "FRANCE 24: Nepal flood disaster reconstructed minute by minute";
          return <YouTubeEmbedBlock videoId={videoId} label={label} href={href} />;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
          >
            {children}
          </a>
        );
      },
      table: ({ children }: any) => (
        <div className="overflow-x-auto my-2 rounded-md border border-border/60">
          <table className="w-full text-left text-xs border-collapse">{children}</table>
        </div>
      ),
      thead: ({ children }: any) => (
        <thead className="bg-muted/70 text-foreground font-semibold border-b border-border/60">
          {children}
        </thead>
      ),
      tbody: ({ children }: any) => (
        <tbody className="divide-y divide-border/30">{children}</tbody>
      ),
      tr: ({ children }: any) => (
        <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
      ),
      th: ({ children }: any) => (
        <th className="px-2.5 py-1.5 text-xs font-semibold">{children}</th>
      ),
      td: ({ children }: any) => (
        <td className="px-2.5 py-1.5 text-xs text-foreground/90">{children}</td>
      ),
      hr: () => <hr className="border-t border-border/50 my-2.5" />,
      code: ({ node, inline, className, children, ...props }: any) => {
        const isInline = inline ?? (!className && !String(children).includes("\n"));
        if (isInline) {
          const text = String(children).trim();
          const nodeMatch = text.match(/^\[?(EE-[A-Z0-9_-]+|TLN-[A-Z0-9_-]+|SUB-\d+)\]?$/i);
          
          if (nodeMatch && onMapAction) {
            const nodeId = nodeMatch[1];
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("scada-focus-incident-node", { detail: { nodeId } }));

              let lat = 59.4370;
              let lng = 24.7453;
              if (/SUB-97|VANALINN/i.test(nodeId)) {
                lat = 59.4370; lng = 24.7453;
              } else if (/ULE|ULEMISTE/i.test(nodeId)) {
                lat = 59.4180; lng = 24.7990;
              } else if (/MUSTAMAE/i.test(nodeId)) {
                lat = 59.4030; lng = 24.6730;
              } else if (/KRISTIINE/i.test(nodeId)) {
                lat = 59.4180; lng = 24.7180;
              }

              onMapAction({
                type: "fly_to",
                center: { lat, lng, zoom: 16.5 },
                title: `Substation Node ${nodeId}`,
              });
            };

            return (
              <button
                type="button"
                onClick={handleClick}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 shadow-xs cursor-pointer transition-all group/node align-baseline"
                title={`Click to navigate to ${text} on map`}
              >
                <Target className="w-3 h-3 text-cyan-400 group-hover/node:animate-spin shrink-0" />
                <span>{text}</span>
              </button>
            );
          }

          return (
            <code
              className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900/90 text-cyan-400 border border-cyan-500/25 shadow-2xs"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <CodeBlock inline={false} className={className} {...props}>
            {children}
          </CodeBlock>
        );
      },
    }),
    [onMapAction]
  );

  return (
    <div
      className={`slack-markdown text-xs leading-relaxed break-words space-y-2 ${
        isUser ? "text-primary-foreground font-normal" : "text-foreground"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});
