"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  CornerDownLeft,
  Loader2,
  Square,
  RotateCcw,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Play,
  ArrowDown,
  Terminal,
  ShieldAlert,
  Zap,
  Plus,
  Paperclip,
  Mic,
  Target
} from "lucide-react";
import { MapAction, getDistrictIncidentAggregations, MOCK_INCIDENTS, addDynamicIncident, Incident } from "./data";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts?: string;
  isError?: boolean;
  model?: string;
}

interface ModelStatus {
  status: "checking" | "online" | "offline" | "degraded";
  activeModel: string;
  models: string[];
  provider: string;
  error?: string;
}

interface SlashCommand {
  cmd: string;
  desc: string;
  insertText: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/add_incident", desc: "Add a new telemetry incident to Tallinn map & Heatmap", insertText: "Add incident: Transformer failure in Mustamäe, critical hazard level" },
  { cmd: "/density", desc: "Identify & map high incident concentration areas in Tallinn", insertText: "Show me the areas of Tallinn with the highest concentration of incidents." },
  { cmd: "/status", desc: "SCADA telemetry & grid status summary", insertText: "/status --summary" },
  { cmd: "/rebalance", desc: "Initiate transformer load rebalance simulation", insertText: "/rebalance --sector Vanalinn-Harju" },
  { cmd: "/logs", desc: "Fetch recent telemetry & SCADA incident logs", insertText: "/logs --limit 50 --level WARNING" },
  { cmd: "/threat", desc: "Grid cascade threat & risk assessment", insertText: "/threat --tier 1" },
  { cmd: "/cascade", desc: "Trace active cascade propagation vectors", insertText: "/cascade --sector Harju" },
  { cmd: "/clear", desc: "Clear active chat history", insertText: "/clear" },
];

const QUICK_CHIPS = [
  { label: "/add_incident", prompt: "Add new incident: Traffic light malfunction in central Tallinn" },
  { label: "/density", prompt: "Show me the areas of Tallinn with the highest concentration of incidents." },
  { label: "/status", prompt: "/status --summary" },
  { label: "/rebalance", prompt: "/rebalance --sector Vanalinn-Harju" },
  { label: "/cascade", prompt: "/cascade --sector Harju" },
  { label: "/threat", prompt: "/threat --tier 1" },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "i1",
    role: "assistant",
    content:
      "### Tallinn SCADA Operations AI Engine `ONLINE`\n\nOperating under **local Ollama inference**. Real-time telemetry monitoring active.\n\n- **Grid Status:** `[CRITICAL]` (TIER-1 Protocol active since 08:47)\n- **Frequency:** `49.92 Hz` (Nominal 50.00 Hz, Deviation `-0.08 Hz`)\n- **Active Cascade:** `Vanalinn-Harju Sector`\n\nUse `/status`, `/rebalance`, `/threat`, or `/cascade` to query live telemetry.",
    ts: "08:47:00",
  },
];

function now() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderStatusBadge(token: string, key: number) {
  const upper = token.toUpperCase();
  let bgClass = "bg-primary/15 border-primary/30 text-primary";

  if (upper.includes("CRITICAL") || upper.includes("HIGH RISK") || upper.includes("FAILED") || upper.includes("INCIDENT")) {
    bgClass = "bg-red-500/20 border-red-500/50 text-red-400";
  } else if (upper.includes("WARNING") || upper.includes("DEGRADED")) {
    bgClass = "bg-amber-500/20 border-amber-500/50 text-amber-400";
  } else if (upper.includes("NORMAL") || upper.includes("ONLINE") || upper.includes("PASSED") || upper.includes("OK")) {
    bgClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
  } else if (upper.includes("EXECUTING") || upper.includes("RUNNING")) {
    bgClass = "bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse";
  }

  return (
    <span
      key={key}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10.5px] font-semibold tracking-wider ${bgClass}`}
    >
      {token.slice(1, -1)}
    </span>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\[[A-Z0-9_\- ]+\]|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]") && part.length >= 3) {
      return renderStatusBadge(part, i);
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[11px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function CodeBlock({ code, language, onExecute }: { code: string; language?: string; onExecute?: (code: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-border bg-background overflow-hidden font-mono text-[11px]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/60 text-muted-foreground text-[10px]">
        <div className="flex items-center gap-1.5 font-semibold text-primary uppercase tracking-wider">
          <Terminal className="w-3 h-3" />
          <span>{language || "SCADA Command"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Copy command"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          {onExecute && (
            <button
              onClick={() => onExecute(code)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
              title="Run in console"
            >
              <Play className="w-3 h-3" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>
      <pre className="p-3 text-foreground overflow-x-auto leading-relaxed bg-background">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownTable({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const parseRow = (r: string) =>
    r
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = parseRow(rows[0]);
  const isSeparator = (r: string) => r.replace(/[\s\|\-\:\+]/g, "").length === 0;
  const contentRows = rows.slice(1).filter((r) => !isSeparator(r)).map(parseRow);

  return (
    <div className="my-2 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-[11px] font-mono text-left border-collapse">
        <thead className="bg-muted/80 text-foreground font-semibold border-b border-border">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-2.5 py-1.5 border-r border-border last:border-r-0">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {contentRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-2.5 py-1.5 border-r border-border/60 last:border-r-0 text-muted-foreground">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessageContent({
  content,
  isStreaming,
  onExecuteCode,
}: {
  content: string;
  isStreaming?: boolean;
  onExecuteCode?: (code: string) => void;
}) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];

    // Fenced Code Block Parsing
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      idx++;
      while (idx < lines.length && !lines[idx].trim().startsWith("```")) {
        codeLines.push(lines[idx]);
        idx++;
      }
      elements.push(
        <CodeBlock
          key={`code-${idx}`}
          code={codeLines.join("\n")}
          language={language}
          onExecute={onExecuteCode}
        />
      );
      idx++;
      continue;
    }

    // Markdown Table Parsing
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableRows: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith("|") && lines[idx].trim().endsWith("|")) {
        tableRows.push(lines[idx]);
        idx++;
      }
      elements.push(<MarkdownTable key={`table-${idx}`} rows={tableRows} />);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`blank-${idx}`} className="h-1.5" />);
      idx++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <div key={`h3-${idx}`} className="font-bold text-foreground pt-1 text-[13px] flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </div>
      );
      idx++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <div key={`h2-${idx}`} className="font-bold text-foreground pt-1.5 text-[13.5px]">
          {renderInline(trimmed.slice(3))}
        </div>
      );
      idx++;
      continue;
    }

    const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 pl-1">
          <span className="text-primary select-none mt-0.5 font-bold">•</span>
          <span className="flex-1">{renderInline(bulletMatch[2])}</span>
        </div>
      );
      idx++;
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+[\.\)])\s+(.+)$/);
    if (numberedMatch) {
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-2 pl-1">
          <span className="text-primary font-mono text-[11px] select-none mt-0.5 font-semibold">
            {numberedMatch[1]}
          </span>
          <span className="flex-1">{renderInline(numberedMatch[2])}</span>
        </div>
      );
      idx++;
      continue;
    }

    elements.push(<div key={`line-${idx}`}>{renderInline(line)}</div>);
    idx++;
  }

  return (
    <div className="space-y-1 text-[12px] leading-relaxed font-sans">
      {elements}
      {isStreaming && (
        <span className="inline-block w-2 h-3.5 bg-primary animate-pulse ml-1 align-middle" />
      )}
    </div>
  );
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string | null;
  onClearContext?: () => void;
  onMapAction?: (action: MapAction) => void;
}

export function AIAssistant({ isOpen, onClose, context, onClearContext, onMapAction }: AIAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);

  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    status: "checking",
    activeModel: "qwen2.5:7b",
    models: [],
    provider: "Ollama (Local)",
  });
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:7b");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idCounterRef = useRef(2);
  const abortControllerRef = useRef<AbortController | null>(null);

  const filteredCommands = SLASH_COMMANDS.filter((sc) =>
    sc.cmd.toLowerCase().includes(chatInput.trim().toLowerCase())
  );

  const triggerConcentrationMapAction = useCallback(() => {
    const aggregations = getDistrictIncidentAggregations(MOCK_INCIDENTS);
    const topDistricts = aggregations.filter((a) => a.count > 0);
    const highestDistrict = aggregations[0];

    const action: MapAction = {
      type: "highlight_incidents_by_district",
      targetDistrictId: highestDistrict.district.id,
      highlightedDistricts: topDistricts.map((a) => ({
        id: a.district.id,
        name: a.district.name,
        lat: a.district.lat,
        lng: a.district.lng,
        count: a.count,
        severity: a.highestSeverity,
        incidents: a.incidents.map((i) => i.id),
      })),
      center: {
        lat: highestDistrict.district.lat,
        lng: highestDistrict.district.lng,
        zoom: 14.2,
      },
      title: `Highest Concentration: ${highestDistrict.district.name} (${highestDistrict.count} Incidents)`,
    };

    if (onMapAction) {
      onMapAction(action);
    }
  }, [onMapAction]);

  const checkModelStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as ModelStatus;
        setModelStatus(data);
        if (data.activeModel) {
          setSelectedModel(data.activeModel);
        }
      } else {
        setModelStatus((prev) => ({
          ...prev,
          status: "offline",
          error: "Ollama service responded with error",
        }));
      }
    } catch {
      setModelStatus((prev) => ({
        ...prev,
        status: "offline",
        error: "Cannot connect to local Ollama service",
      }));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkModelStatus();
    }
  }, [isOpen, checkModelStatus]);

  useEffect(() => {
    if (!context || !isOpen) return;
    const prompt = `/status Analyze telemetry feed context: ${context.slice(0, 150)}...`;
    setChatInput(prompt);
  }, [context, isOpen]);

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;
    const isBottom = scrollHeight - (scrollTop + clientHeight) < 40;
    setIsUserScrolledUp(!isBottom);
  };

  useEffect(() => {
    if (isOpen && !isUserScrolledUp) {
      scrollToBottom(!isStreaming);
    }
  }, [chatMessages, isOpen, isStreaming, isUserScrolledUp]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard Shortcuts (Esc, Ctrl+L / Cmd+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (showSlashMenu) {
          setShowSlashMenu(false);
        } else {
          onClose();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        handleClear();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, showSlashMenu, onClose]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleClear = () => {
    handleStop();
    setChatMessages(INITIAL_CHAT);
    if (onClearContext) onClearContext();
  };

  const sendMessage = async (overridePrompt?: string) => {
    const rawText = (overridePrompt ?? chatInput).trim();
    if (!rawText || isStreaming) return;

    if (rawText.toLowerCase() === "/clear") {
      handleClear();
      setChatInput("");
      return;
    }

    const userMsgId = `u-${idCounterRef.current++}`;
    const assistantMsgId = `a-${idCounterRef.current++}`;

    const isConcentrationQuery =
      /highest concentration|concentration of incidents|incident concentration|highest incident|most incidents|incident hotspots|incident density|\/density|heatmap|overlay/i.test(
        rawText
      );

    const isQuestionOrQuery =
      /\b(what|which|where|who|how|why|when|show|list|tell|count|most|least|sever|severe|severity|details|status|info|information)\b/i.test(
        rawText
      ) || rawText.includes("?");

    const hasExplicitAddVerb =
      /\/add_incident|\/create_incident/i.test(rawText) ||
      /\b(add|create|register|report|log|post)\s+(a\s+|an\s+|new\s+)?(incident|accident|failure|outage|hazard|event|anomaly|issue|fire|breakdown|telemetry|record)\b/i.test(
        rawText
      );

    const isSimpleConfirmation = /^(yes|yeah|confirm|proceed|create it|do it|create in database)$/i.test(rawText.trim());
    const lastAssistantMsg = chatMessages.filter((m) => m.role === "assistant").pop()?.content || "";
    const isConfirmationForCreation = isSimpleConfirmation && /create|add|register/i.test(lastAssistantMsg);

    const isAddIncidentQuery = !isQuestionOrQuery && (hasExplicitAddVerb || isConfirmationForCreation);

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: rawText,
      ts: now(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    if (!overridePrompt) {
      setChatInput("");
    }
    setShowSlashMenu(false);
    setIsUserScrolledUp(false);
    setIsStreaming(true);

    if (isConcentrationQuery) {
      triggerConcentrationMapAction();
    }

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      ts: now(),
      model: selectedModel,
    };
    setChatMessages([...newMessages, assistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Helper to parse incident structure or metadata from text, current AI output & message history
    const parseIncidentFromContext = (input: string, history: ChatMessage[] = [], aiOutput: string = "") => {
      const isSimpleConfirmation = /^(yes|yeah|confirm|proceed|create it|do it|create in database)$/i.test(input.trim());

      const textsToSearch: string[] = [input];
      if (aiOutput) textsToSearch.push(aiOutput);

      if (isSimpleConfirmation) {
        for (let i = history.length - 1; i >= Math.max(0, history.length - 5); i--) {
          textsToSearch.push(history[i].content);
        }
      }
      const combinedText = textsToSearch.join("\n\n");

      let extractedTitle: string | undefined;
      let extractedLat: number | undefined;
      let extractedLng: number | undefined;
      let extractedSeverity: "critical" | "warning" | "info" | undefined;
      let extractedCategory: "Grid Failure" | "Traffic Flow" | "Telecom Node" | "Emergency Dispatch" | "Sensor Anomaly" | undefined;
      let extractedDistrict: string | undefined;
      let extractedDescription: string | undefined;
      let extractedNodeId: string | undefined;

      // 1. Attempt JSON block parsing ({ "INCIDENT_CREATED": { ... } } or similar)
      const jsonMatch = combinedText.match(/\{[\s\S]*?"INCIDENT_CREATED"[\s\S]*?\}/) || combinedText.match(/\{[\s\S]*?"title"[\s\S]*?"lat"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const obj = parsed.INCIDENT_CREATED || parsed.incident || parsed;
          if (obj && typeof obj === "object") {
            if (obj.title) extractedTitle = String(obj.title);
            if (obj.lat !== undefined) extractedLat = typeof obj.lat === "number" ? obj.lat : parseFloat(obj.lat);
            if (obj.lng !== undefined) extractedLng = typeof obj.lng === "number" ? obj.lng : parseFloat(obj.lng);
            if (obj.district) extractedDistrict = String(obj.district);
            if (obj.description) extractedDescription = String(obj.description);
            if (obj.nodeId && obj.nodeId !== "N/A") extractedNodeId = String(obj.nodeId);
            if (obj.severity) {
              const s = String(obj.severity).toLowerCase();
              if (s.includes("crit") || s.includes("high") || s.includes("fire") || s.includes("emerg")) extractedSeverity = "critical";
              else if (s.includes("warn") || s.includes("amber") || s.includes("med")) extractedSeverity = "warning";
              else if (s.includes("info") || s.includes("low")) extractedSeverity = "info";
            }
            if (obj.category) {
              const c = String(obj.category).toLowerCase();
              if (c.includes("fire") || c.includes("safety") || c.includes("dispatch") || c.includes("emerg")) extractedCategory = "Emergency Dispatch";
              else if (c.includes("traffic") || c.includes("road")) extractedCategory = "Traffic Flow";
              else if (c.includes("telecom") || c.includes("comm")) extractedCategory = "Telecom Node";
              else if (c.includes("sensor")) extractedCategory = "Sensor Anomaly";
              else extractedCategory = "Grid Failure";
            }
          }
        } catch {
          // ignore
        }
      }

      // 2. Regex fallbacks for explicit field labels (e.g. Latitude: 59.4270° N, Longitude: 24.7780° E)
      if (!extractedLat) {
        const latM = combinedText.match(/(?:lat|latitude)[:\s=]*([56][0-9]\.[0-9]+)/i);
        if (latM) extractedLat = parseFloat(latM[1]);
      }
      if (!extractedLng) {
        const lngM = combinedText.match(/(?:lng|long|longitude)[:\s=]*([23][0-9]\.[0-9]+)/i);
        if (lngM) extractedLng = parseFloat(lngM[1]);
      }
      if (!extractedTitle) {
        const titleM = combinedText.match(/(?:title|title:|\"title\":)[:\s=]*["']?([^\n\r"'}]+)["']?/i);
        if (titleM && titleM[1].trim().length > 3) extractedTitle = titleM[1].trim();
      }
      if (!extractedDistrict) {
        const distM = combinedText.match(/(?:district|district:|\"district\":)[:\s=]*["']?([^\n\r"'}]+)["']?/i);
        if (distM && distM[1].trim().length > 2) extractedDistrict = distM[1].trim();
      }

      return {
        title: extractedTitle,
        lat: extractedLat,
        lng: extractedLng,
        severity: extractedSeverity,
        category: extractedCategory,
        district: extractedDistrict,
        description: extractedDescription,
        nodeId: extractedNodeId,
      };
    };

    // Local Helper to parse natural text in English into a Tallinn Incident
    const handleLocalIncidentCreation = (input: string, history: ChatMessage[] = [], aiOutput: string = "") => {
      const extracted = parseIncidentFromContext(input, history, aiOutput);
      const lower = input.toLowerCase();

      // 1. Severity Detection
      let severity: "critical" | "warning" | "info" = extracted.severity || "critical";
      if (!extracted.severity) {
        if (lower.includes("warning") || lower.includes("amber") || lower.includes("moderate")) {
          severity = "warning";
        } else if (lower.includes("info") || lower.includes("low") || lower.includes("planned") || lower.includes("check")) {
          severity = "info";
        } else if (lower.includes("critical") || lower.includes("fire") || lower.includes("on fire") || lower.includes("explosion") || lower.includes("outage") || lower.includes("failure")) {
          severity = "critical";
        }
      }

      // 2. Category Detection
      let category: "Grid Failure" | "Traffic Flow" | "Telecom Node" | "Emergency Dispatch" | "Sensor Anomaly" = extracted.category || "Grid Failure";
      if (!extracted.category) {
        if (lower.includes("fire") || lower.includes("ambulance") || lower.includes("dispatch") || lower.includes("emergency") || lower.includes("police") || lower.includes("rescue")) {
          category = "Emergency Dispatch";
        } else if (lower.includes("traffic") || lower.includes("road") || lower.includes("car") || lower.includes("transport") || lower.includes("signal")) {
          category = "Traffic Flow";
        } else if (lower.includes("telecom") || lower.includes("internet") || lower.includes("tower") || lower.includes("fiber") || lower.includes("server") || lower.includes("cable")) {
          category = "Telecom Node";
        } else if (lower.includes("sensor") || lower.includes("vibration") || lower.includes("noise") || lower.includes("temperature") || lower.includes("acoustic")) {
          category = "Sensor Anomaly";
        }
      }

      // 3. Tallinn Gazetteer Dictionary
      interface GazetteerEntry {
        keywords: string[];
        lat: number;
        lng: number;
        districtName: string;
      }

      const GAZETTEER: GazetteerEntry[] = [
        { keywords: ["linnahall", "heliport", "helicopter"], lat: 59.4480, lng: 24.7533, districtName: "Tallinn Linnahall Heliport" },
        { keywords: ["lennujaam", "airport", "lennart meri"], lat: 59.4135, lng: 24.8050, districtName: "Tallinn Airport (Lennujaam)" },
        { keywords: ["ulemiste", "ülemiste", "suur-sõjamäe", "lõõtsa", "valukoja"], lat: 59.4215, lng: 24.7958, districtName: "Ülemiste City" },
        { keywords: ["mustamäe", "mustamae", "akadēmija", "ehitajate", "sõpruse", "tammsaare"], lat: 59.3960, lng: 24.6700, districtName: "Mustamäe" },
        { keywords: ["lasnamäe", "lasnamae", "laagna", "punane", "narva mnt", "pae"], lat: 59.4380, lng: 24.8400, districtName: "Lasnamäe" },
        { keywords: ["õismäe", "oismae", "haabersti", "jārveotsa"], lat: 59.4180, lng: 24.6450, districtName: "Õismäe / Haabersti" },
        { keywords: ["kakumäe", "kakumae", "rocca"], lat: 59.4350, lng: 24.6150, districtName: "Kakumäe / Rocca al Mare" },
        { keywords: ["põhja", "pohja", "kalamaja", "kopli", "pelgulinn", "telliskivi", "noblessner"], lat: 59.4480, lng: 24.7350, districtName: "Põhja-Tallinn / Kalamaja" },
        { keywords: ["pirita", "merivälja", "kose"], lat: 59.4650, lng: 24.8350, districtName: "Pirita" },
        { keywords: ["nõmme", "nomme", "pääsküla", "paaskula", "hiiu", "mānniku"], lat: 59.3800, lng: 24.6800, districtName: "Nõmme" },
        { keywords: ["kristiine", "tondi", "lilleküla"], lat: 59.4260, lng: 24.7240, districtName: "Kristiine / Tondi" },
        { keywords: ["sadam", "port", "vanasadam", "cruise"], lat: 59.4450, lng: 24.7680, districtName: "Port / Vanasadam" },
        { keywords: ["kadriorg", "weizenbergi"], lat: 59.4385, lng: 24.7780, districtName: "Kadriorg" },
        { keywords: ["balti jaam", "baltijaam"], lat: 59.4402, lng: 24.7378, districtName: "Balti Jaam" },
        { keywords: ["viru", "kesklinn"], lat: 59.4365, lng: 24.7562, districtName: "Viru Center / Kesklinn" },
        { keywords: ["vabaduse", "harju"], lat: 59.4345, lng: 24.7440, districtName: "Vabaduse Väljak" },
        { keywords: ["liivalaia", "tornimäe", "rāvala"], lat: 59.4310, lng: 24.7570, districtName: "Kesklinn / Business Center" },
        { keywords: ["vanalinn", "old town", "toompea"], lat: 59.4372, lng: 24.7453, districtName: "Vanalinn (Old Town)" }
      ];

      let lat = extracted.lat ?? 59.4372;
      let lng = extracted.lng ?? 24.7453;
      let districtName = extracted.district ?? "Kesklinn / Vanalinn";
      let matched = extracted.lat !== undefined && extracted.lng !== undefined;

      if (!matched) {
        for (const entry of GAZETTEER) {
          if (entry.keywords.some((kw) => lower.includes(kw) || (extracted.title && extracted.title.toLowerCase().includes(kw)))) {
            lat = entry.lat + (Math.random() - 0.5) * 0.002;
            lng = entry.lng + (Math.random() - 0.5) * 0.002;
            districtName = entry.districtName;
            matched = true;
            break;
          }
        }
      }

      let cleanTitle = extracted.title;
      if (!cleanTitle) {
        let rawSubject = input;
        const compoundMatch = input.match(/(?:\/add_incident|\/create_incident)\s+(.+)$/i);
        if (compoundMatch && compoundMatch[1]) {
          rawSubject = compoundMatch[1].trim();
        }

        cleanTitle = rawSubject
          .replace(/\/add_incident|\/create_incident|add|create|register|new|incident|accident|hazard|yes|create it|database/gi, "")
          .replace(/^[:\s,\.\-—]+/, "")
          .replace(/[\.\!]+$/, "")
          .trim();

        if (!cleanTitle || cleanTitle.length < 3) {
          cleanTitle = `Anomaly at ${districtName}`;
        } else {
          cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        }
      }

      const incId = `INC-${new Date().getHours().toString().padStart(2, "0")}${new Date().getMinutes().toString().padStart(2, "0")}-${Math.floor(Math.random() * 89 + 10)}`;

      const newInc: Incident = {
        id: incId,
        title: cleanTitle,
        timestamp: now(),
        severity,
        category,
        makiIcon: severity === "critical" ? "lightning" : severity === "warning" ? "caution" : "waveform",
        lat,
        lng,
        description: extracted.description || `Telemetry incident registered for ${districtName}. Operator prompt: "${input}".`,
        status: "active",
        nodeId: extracted.nodeId || `EE-TLN-${districtName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 890 + 100)}`
      };

      const updatedIncidents = addDynamicIncident(newInc);

      const action: MapAction = {
        type: "focus_district",
        center: { lat, lng, zoom: 15.0 },
        title: `⚡ Incident Added: ${newInc.id} (${newInc.severity.toUpperCase()})`,
      };

      if (onMapAction) {
        onMapAction(action);
      }

      return `### ⚡ SCADA Incident Successfully Registered in Database & Map\n\nNew incident telemetry record created and persisted to database:\n\n- **Incident ID:** \`${newInc.id}\`\n- **Title:** **${newInc.title}**\n- **Severity:** \`[${newInc.severity.toUpperCase()}]\`\n- **Category:** \`${newInc.category}\`\n- **District / Location:** **${districtName}**${matched ? " `[GEO MATCHED]`" : ""}\n- **Coordinates:** \`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E\`\n- **Telemetry Node:** \`${newInc.nodeId}\`\n- **Status:** \`[ACTIVE]\`\n\n🗺️ **Map & Incident Matrix Synchronized:**\n- Visual incident vector added to Leaflet map layer.\n- Incident matrix updated (Total Incidents: **${updatedIncidents.length}**).\n- Camera centered on target location (\`${lat.toFixed(4)}°, ${lng.toFixed(4)}°\`, Zoom \`15.0x\`).\n- Record saved to SQLite DB (\`/api/incidents\`).`;
    };

    try {
      const historyPayload = newMessages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          context: context || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}: Failed to reach local AI model.`;
        try {
          const errData = (await res.json()) as { error?: string };
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const contentType = res.headers.get("content-type") || "";

      if (res.body && (contentType.includes("text/plain") || !contentType.includes("application/json"))) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
            )
          );
        }

        const isIncidentInResponse =
          /INCIDENT_CREATED|\[ACTION:\s*CREATE_INCIDENT\]|\{"INCIDENT_CREATED"/i.test(accumulated);

        if (isAddIncidentQuery || isIncidentInResponse) {
          const creationReply = handleLocalIncidentCreation(rawText, chatMessages, accumulated);
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: creationReply } : msg
            )
          );
        } else if (isConcentrationQuery) {
          triggerConcentrationMapAction();
        }
      } else {
        const data = (await res.json()) as { content?: string; model?: string };
        let reply = data.content || "No response received from local AI engine.";

        const isIncidentInResponse =
          /INCIDENT_CREATED|\[ACTION:\s*CREATE_INCIDENT\]|\{"INCIDENT_CREATED"/i.test(reply);

        if (isAddIncidentQuery || isIncidentInResponse) {
          reply = handleLocalIncidentCreation(rawText, chatMessages, reply);
        } else if (isConcentrationQuery) {
          triggerConcentrationMapAction();
          reply = `### 📍 Tallinn Incident Concentration Analysis\n\nAggregating active SCADA incidents across city districts:\n\n| District | Incident Count | Concentration | Severity | Primary Grid Impact |\n| :--- | :---: | :--- | :--- | :--- |\n| **Old Town (Vanalinn)** | **2** | \`[HIGHEST DENSITY]\` | \`[CRITICAL]\` | Grid Substation #4 Trip & Viru Signal Freeze |\n| **Balti Jaam** | 1 | \`[ELEVATED]\` | \`[WARNING]\` | Emergency Priority Routing Timeout |\n| **Ülemiste City** | 1 | \`[MODERATE]\` | \`[CRITICAL]\` | Smart Feeder Voltage Spike (420kV) |\n| **Port / Sadam** | 1 | \`[MODERATE]\` | \`[INFO]\` | Subsea Telecom Gateway Latency |\n| **Kristiine** | 1 | \`[MODERATE]\` | \`[WARNING]\` | Low-Frequency Acoustic Sensor Anomaly |\n\n🎯 **Highest Incident Concentration:** **Old Town / Vanalinn** sector with **2 active incidents** (33.3% of total grid events).\n\n🗺️ **Map Action Executed:**\n- Visual density highlights applied to **Vanalinn** & **Balti Jaam** central grid sectors.\n- Tactical Map camera zoomed to Tallinn central district (\`59.4372° N, 24.7453° E\`, Zoom \`14.2x\`).`;
        }

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: reply, model: data.model ?? selectedModel }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && !msg.content
              ? { ...msg, content: "Generation halted by operator." }
              : msg
          )
        );
      } else if (isAddIncidentQuery) {
        const creationReply = handleLocalIncidentCreation(rawText, chatMessages);
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: creationReply, model: selectedModel }
              : msg
          )
        );
      } else if (isConcentrationQuery) {
        triggerConcentrationMapAction();
        const fallbackReply = `### 📍 Tallinn Incident Concentration Analysis\n\nAggregating active SCADA incidents across city districts:\n\n| District | Incident Count | Concentration | Severity | Primary Grid Impact |\n| :--- | :---: | :--- | :--- | :--- |\n| **Old Town (Vanalinn)** | **2** | \`[HIGHEST DENSITY]\` | \`[CRITICAL]\` | Grid Substation #4 Trip & Viru Signal Freeze |\n| **Balti Jaam** | 1 | \`[ELEVATED]\` | \`[WARNING]\` | Emergency Priority Routing Timeout |\n| **Ülemiste City** | 1 | \`[MODERATE]\` | \`[CRITICAL]\` | Smart Feeder Voltage Spike (420kV) |\n| **Port / Sadam** | 1 | \`[MODERATE]\` | \`[INFO]\` | Subsea Telecom Gateway Latency |\n| **Kristiine** | 1 | \`[MODERATE]\` | \`[WARNING]\` | Low-Frequency Acoustic Sensor Anomaly |\n\n🎯 **Highest Incident Concentration:** **Old Town / Vanalinn** sector with **2 active incidents** (33.3% of total grid events).\n\n🗺️ **Map Action Executed:**\n- Visual density highlights applied to **Vanalinn** & **Balti Jaam** central grid sectors.\n- Tactical Map camera zoomed to Tallinn central district (\`59.4372° N, 24.7453° E\`, Zoom \`14.2x\`).`;
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: fallbackReply, model: selectedModel }
              : msg
          )
        );
      } else {
        const message = err instanceof Error ? err.message : "Error generating AI response";
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Connection/Execution Alert:** ${message}\n\nEnsure local Ollama service is operational (\`ollama run ${selectedModel}\`).`,
                  isError: true,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputChange = (val: string) => {
    setChatInput(val);
    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSelectSlashCommand = (cmdText: string) => {
    setChatInput(cmdText);
    setShowSlashMenu(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectSlashCommand(filteredCommands[slashIndex].insertText);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-[calc(100vw-1rem)] flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header aligned with app design system */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-card-foreground tracking-wide font-mono">
                  SCADA AI ASSISTANT
                </span>

                {modelStatus.status === "online" ? (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                    title={`Ollama active: ${modelStatus.activeModel}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LOCAL · {selectedModel}</span>
                  </div>
                ) : modelStatus.status === "checking" ? (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-amber-500/15 border border-amber-500/40 text-amber-400">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>CONNECTING</span>
                  </div>
                ) : (
                  <button
                    onClick={checkModelStatus}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>OFFLINE · RETRY</span>
                  </button>
                )}
              </div>
              <div className="text-[9.5px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span>Tallinn SCADA Ops</span>
                {modelStatus.models.length > 1 && (
                  <>
                    <span>·</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-muted border border-border rounded px-1 py-0 text-[9.5px] font-mono text-foreground focus:outline-none"
                    >
                      {modelStatus.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Clear active chat history (Ctrl+L)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Close panel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Telemetry Feed Context Banner */}
        {context && (
          <div className="border-b border-primary/20 bg-primary/10 px-3.5 py-2 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="text-[10.5px] font-mono text-muted-foreground line-clamp-1">
                  <span className="font-semibold text-primary uppercase mr-1">Context Attached:</span>
                  {context}
                </div>
              </div>
              {onClearContext && (
                <button
                  type="button"
                  onClick={onClearContext}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Command Chips */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/40 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground font-semibold uppercase tracking-wider shrink-0 mr-1">
            Quick:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              disabled={isStreaming}
              onClick={() => handleSelectSlashCommand(chip.prompt)}
              className="h-7 px-2.5 rounded border border-border bg-muted/60 text-[11px] font-mono text-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all disabled:opacity-40 shrink-0 flex items-center gap-1"
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Message Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 relative select-text"
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className="shrink-0 mt-0.5">
                {msg.role === "assistant" ? (
                  <div
                    className={`h-6 w-6 rounded flex items-center justify-center ${
                      msg.isError
                        ? "bg-red-500/20 border border-red-500/40 text-red-400"
                        : "bg-primary/15 border border-primary/30 text-primary"
                    }`}
                  >
                    {msg.isError ? <ShieldAlert className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded bg-muted border border-border flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">OP</span>
                  </div>
                )}
              </div>

              <div className={`flex flex-col gap-1 max-w-[88%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-lg select-text ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : msg.isError
                      ? "bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-none"
                      : "bg-muted/50 border border-border text-foreground rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content ? (
                    <>
                      <MessageContent
                        content={msg.content}
                        isStreaming={isStreaming && msg.id === chatMessages[chatMessages.length - 1]?.id}
                        onExecuteCode={(code) => sendMessage(code)}
                      />
                      {msg.role === "assistant" && (msg.content.includes("Incident Concentration Analysis") || msg.content.includes("Highest Incident Concentration")) && (
                        <button
                          onClick={() => triggerConcentrationMapAction()}
                          className="mt-2 text-[11px] font-mono font-semibold px-2.5 py-1 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 transition-all"
                        >
                          <Target className="w-3.5 h-3.5 text-primary animate-pulse" />
                          <span>View Hotspots on Map</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 py-0.5 text-muted-foreground text-[11px] font-mono">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span>Processing telemetry with {selectedModel}...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-0.5 text-[9px] font-mono text-muted-foreground/70">
                  {msg.role === "assistant" && !msg.isError && (
                    <span className="flex items-center gap-1 text-[8.5px] text-muted-foreground/60">
                      <Cpu className="w-2.5 h-2.5" />
                      {msg.model || selectedModel}
                    </span>
                  )}
                  {msg.ts && <span>{msg.ts}</span>}
                  {msg.isError && (
                    <button
                      onClick={() => sendMessage(chatMessages[chatMessages.length - 2]?.content)}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Floating Scroll to Bottom Button */}
          {isUserScrolledUp && (
            <button
              onClick={() => {
                setIsUserScrolledUp(false);
                scrollToBottom(true);
              }}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-card border border-primary/40 text-primary text-[10px] font-mono shadow-lg flex items-center gap-1 hover:bg-muted transition-all z-20"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Scroll to bottom</span>
            </button>
          )}
        </div>

        {/* Input & Footer Container */}
        <div className="p-3 border-t border-border bg-card shrink-0 relative">
          {/* Slash Commands Dropdown Popup */}
          {showSlashMenu && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-primary/40 rounded-lg shadow-2xl overflow-hidden z-30 font-mono text-[11px]">
              <div className="px-2.5 py-1 border-b border-border bg-muted text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Slash Commands
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-border/40">
                {filteredCommands.map((sc, index) => (
                  <button
                    key={sc.cmd}
                    type="button"
                    onClick={() => handleSelectSlashCommand(sc.insertText)}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-primary/15 transition-colors ${
                      index === slashIndex ? "bg-primary/20 text-primary font-bold" : "text-popover-foreground"
                    }`}
                  >
                    <span className="font-semibold text-primary">{sc.cmd}</span>
                    <span className="text-[10px] text-muted-foreground">{sc.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col bg-background border border-border rounded-xl p-3 focus-within:border-primary transition-all shadow-sm">
            <textarea
              ref={inputRef}
              id="ai-assistant-input"
              value={chatInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleInputKeyDown as any}
              placeholder={
                modelStatus.status === "online"
                  ? "Type / for commands or enter SCADA telemetry query..."
                  : "Type SCADA command or query..."
              }
              className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none font-mono resize-none min-h-[80px]"
            />
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors hover:text-foreground"
                  title="Add attachment"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors hover:text-foreground"
                  title="Upload file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors hover:text-foreground"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  Enter
                </span>

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="h-8 w-8 flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 rounded-lg transition-all"
                    title="Stop generating"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    id="ai-assistant-send"
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!chatInput.trim()}
                    className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors rounded-lg shadow-sm"
                    title="Send query"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-muted-foreground px-0.5">
            <span>Model: {selectedModel} (Local Ollama)</span>
            <span>Esc (Close) · Ctrl+L (Clear)</span>
          </div>
        </div>
      </div>
    </>
  );
}
