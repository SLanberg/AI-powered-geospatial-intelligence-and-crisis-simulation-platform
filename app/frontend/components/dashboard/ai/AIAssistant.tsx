"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, ShieldAlert } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatPromptSuggestions } from "./ChatPromptSuggestions";
import { ChatInputArea } from "./ChatInputArea";
import { RealTimeAnalysisPanel } from "./RealTimeAnalysisPanel";
import {
  DashboardChatMessage,
  ModelStatus,
  AIAssistantProps,
} from "./schemas";
import { MOCK_INCIDENTS, MapAction } from "@/components/dashboard/data";
import type { NepalTimelineEvent } from "@/frontend/data/nepalIncidentData";
import { RIVER_STATIONS } from "@/frontend/data/nepalIncidentData";
import { NEPAL_EMERGENCY_SERVICES } from "@/frontend/data/nepalEmergencyServicesData";
import { NEPAL_TRANSPORT_HUBS } from "@/frontend/data/nepalTransportHubsData";
import type { Incident } from "@/shared";
import { TALLINN_EMERGENCY_SERVICES } from "../emergencyServicesData";
import { TALLINN_TRANSPORT_HUBS } from "../transportHubsData";
import { DISTRICT_CENTERS } from "../districtBoundaries";

export function resolveClientMapAction(text: string): MapAction | null {
  if (!text || text.trim().length === 0) return null;

  // 1. Direct coordinates pattern: "59.4132, 24.8326"
  const coordMatch = text.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        type: "fly_to",
        center: { lat, lng, zoom: 16 },
        title: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Fast exclusion for conversational / briefing / chart / disaster queries
  if (
    isOperationalIncidentBriefingQuery(text) ||
    isNepalQuery(text) ||
    isIncidentChartQuery(text)
  ) {
    return null;
  }

  // Normalize string: strip punctuation (including ?, !, ., ,, ", ', etc.)
  const clean = text
    .toLowerCase()
    .replace(/[?!.,;:'"()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If text contains general analytical / question / briefing words without explicit navigation verbs, ignore map action
  const hasAnalyticalIntent =
    /\b(briefing|summary|status|report|overview|telemetry|protocol|analysis|analyze|assess|check|what|how|why|who|tell\s+me|give\s+me|review|explain|сводка|доклад|отчет|статус|анализ|покажи\s+статистику)\b/i.test(
      clean
    );

  const navPrefixRegex =
    /^(fly(\s+me)?\s+to|navigate(\s+to|\s+the\s+map\s+to)?|move(\s+the)?\s+map\s+to|take\s+me\s+to|go\s+to|center\s+on|zoom\s+(in\s+on|to)|focus(\s+on|\s+map\s+on|\s+district)?|where\s+is\s+the|where\s+is|show\s+me\s+(where\s+is\s+)?|show\s+on\s+(the\s+)?map|show\s+|locate|find)\s+/i;
  
  const navSuffixRegex = /\s+(on\s+(the\s+)?map|on\s+gis|where\s+(it|this)\s+is)$/i;

  const isExplicitNav = navPrefixRegex.test(clean) || navSuffixRegex.test(clean);

  // If analytical intent is present and user did NOT use explicit navigation command, do not resolve client map action
  if (hasAnalyticalIntent && !isExplicitNav) {
    return null;
  }

  const stripped = clean
    .replace(navPrefixRegex, "")
    .replace(navSuffixRegex, "")
    .trim();

  const targetStr = stripped || clean;
  if (!targetStr || targetStr.length < 2) return null;

  // If not an explicit navigation command and input is a longer sentence (> 5 words or > 35 chars), do not resolve client map action
  const wordCount = clean.split(/\s+/).length;
  if (!isExplicitNav && (wordCount > 5 || clean.length > 35)) {
    return null;
  }

  // Stop words that must never trigger a match on their own
  const STOP_WORDS = new Set([
    "tallinn", "tallinna", "estonia", "eesti", "harjumaa", "linn", "city",
    "keskus", "district", "sector", "sectors", "active", "scada", "incident",
    "incidents", "substation", "all", "the", "and", "varjumiskoht", "station",
    "centre", "center", "gümnaasium", "kool", "tankla", "area", "feeders", "feeder"
  ]);

  // 2. High-priority Transport Hubs & Airport alias matching (e.g., TLL, Balti Jaam, Ports)
  const allTransportHubs = [...TALLINN_TRANSPORT_HUBS, ...NEPAL_TRANSPORT_HUBS];
  const isAirportQuery =
    /\b(tll|airport|tallinn airport|lennart meri|lennujaam|lennujaama|tallinna lennujaam)\b/i.test(targetStr);
  if (isAirportQuery) {
    const airport = TALLINN_TRANSPORT_HUBS.find((h) => h.id === "hub-tll-airport");
    if (airport) {
      return {
        type: "fly_to",
        center: { lat: airport.lat, lng: airport.lng, zoom: 16 },
        title: "Tallinn Lennart Meri Airport (TLL)",
        address: airport.address,
        targetDistrictId: airport.district,
      };
    }
  }

  for (const hub of allTransportHubs) {
    const hubName = hub.name.toLowerCase();
    const hubShort = hub.shortName.toLowerCase();
    const hubEn = (hub.nameEn || "").toLowerCase();

    if (
      targetStr === hubShort ||
      targetStr === hubName ||
      (isExplicitNav && (hubName.includes(targetStr) || (hubEn && hubEn.includes(targetStr))))
    ) {
      return {
        type: "fly_to",
        center: { lat: hub.lat, lng: hub.lng, zoom: 16 },
        title: hub.name,
        address: hub.address,
        targetDistrictId: hub.district,
      };
    }
  }

  // 3. District centers matching (e.g., Kristiine, Vanalinn, Mustamäe, Lasnamäe)
  for (const [key, center] of Object.entries(DISTRICT_CENTERS)) {
    const normKey = key.replace(/-/g, " ");
    const centerNameClean = center.name.toLowerCase().replace(/[\/\-_]/g, " ");

    const isExactDistrict =
      targetStr === key ||
      targetStr === normKey ||
      targetStr === centerNameClean ||
      (isExplicitNav && new RegExp(`^${normKey}$|\\b${normKey}\\b|^${centerNameClean}$|\\b${centerNameClean}\\b`, "i").test(targetStr));

    if (isExactDistrict) {
      return {
        type: "focus_district",
        targetDistrictId: key,
        center: { lat: center.lat, lng: center.lng, zoom: 14.5 },
        title: center.name,
      };
    }
  }

  // 4. Official Emergency & Industrial Hazard Services
  const allEmergencyServices = [...TALLINN_EMERGENCY_SERVICES, ...NEPAL_EMERGENCY_SERVICES];
  const searchTerms = targetStr.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (searchTerms.length > 0) {
    for (const fac of allEmergencyServices) {
      const facName = fac.name.toLowerCase();
      const facShort = fac.shortName.toLowerCase();

      if (
        facName === targetStr ||
        facShort === targetStr ||
        (isExplicitNav && (facName.includes(targetStr) || facShort.includes(targetStr)))
      ) {
        return {
          type: "fly_to",
          center: { lat: fac.lat, lng: fac.lng, zoom: 16 },
          title: fac.name,
          address: fac.address,
          targetDistrictId: fac.district,
        };
      }
    }

    if (isExplicitNav) {
      let bestFacility: (typeof allEmergencyServices)[0] | null = null;
      let maxScore = 0;
      for (const fac of allEmergencyServices) {
        const facName = fac.name.toLowerCase();
        const facAddr = (fac.address || "").toLowerCase();
        let score = 0;
        for (const term of searchTerms) {
          if (facName.includes(term)) score += 3;
          if (facAddr.includes(term)) score += 2;
        }
        if (score > maxScore) {
          maxScore = score;
          bestFacility = fac;
        }
      }

      if (bestFacility && maxScore >= 5) {
        return {
          type: "fly_to",
          center: { lat: bestFacility.lat, lng: bestFacility.lng, zoom: 16 },
          title: bestFacility.name,
          address: bestFacility.address,
          targetDistrictId: bestFacility.district,
        };
      }
    }
  }

  // 5. SCADA Incidents & Telemetry Nodes
  for (const inc of MOCK_INCIDENTS) {
    const incTitle = inc.title.toLowerCase();
    const incNode = (inc.nodeId || "").toLowerCase();

    if (
      (incNode && targetStr === incNode) ||
      (incNode && isExplicitNav && incNode.includes(targetStr)) ||
      (isExplicitNav && targetStr.length > 4 && incTitle.includes(targetStr))
    ) {
      return {
        type: "fly_to",
        center: { lat: inc.lat, lng: inc.lng, zoom: 16 },
        title: `${inc.title} (${inc.nodeId})`,
        address: `${(inc as { district?: string }).district || "Tallinn"} District`,
        targetDistrictId: (inc as { district?: string }).district || undefined,
      };
    }
  }

  // 6. Nepal River Gauge Stations
  for (const station of RIVER_STATIONS) {
    const stName = station.name.toLowerCase();
    if (targetStr === stName || (isExplicitNav && stName.includes(targetStr))) {
      return {
        type: "fly_to",
        center: { lat: station.coordinates[1], lng: station.coordinates[0], zoom: 15 },
        title: `Station: ${station.name} (${station.sector}, Km ${station.distanceKm})`,
      };
    }
  }

  return null;
}

export function isOperationalIncidentBriefingQuery(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

  if (
    clean === "give me an operational briefing on all active scada incidents across tallinn sectors" ||
    clean.includes("operational briefing on all active scada incidents") ||
    clean.includes("briefing on all active scada incidents") ||
    clean.includes("active incidents briefing") ||
    clean.includes("operational briefing on active incidents") ||
    clean.includes("briefing on current incidents") ||
    clean.includes("short briefing on the current incidents") ||
    clean.includes("operational briefing on incidents")
  ) {
    return true;
  }

  const hasBriefing = /\b(briefing|brief|summary|status\s+report|сводка|доклад)\b/i.test(clean);
  const hasIncidents = /\b(incident|incidents|scada|outage|anomalies|аварии|инцидент|инциденты)\b/i.test(clean);
  const hasScope = /\b(tallinn|sectors|sector|active|current|all|всех|сектор|таллин)\b/i.test(clean);

  return hasBriefing && hasIncidents && hasScope;
}

export function isIncidentChartQuery(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return (
    /\b(pie\s*chart|piechart|chart|график|диаграмм|диаграмма|распределен|кругов)\b/i.test(clean) &&
    /\b(incident|incidents|categor|проблем|аварий|категори|scada|sector|все|pie)\b/i.test(clean)
  );
}

export function generateIncidentCategoryPieChart(activeIncidents?: Incident[]): string {
  const list = activeIncidents && activeIncidents.length > 0 ? activeIncidents : [];

  const categoryCounts: Record<string, number> = {};
  list.forEach((inc) => {
    const cat = inc.category || "Power & Grid Infrastructure";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const palette = ["#ef4444", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899"];
  const categories = Object.keys(categoryCounts);

  const chartData =
    categories.length > 0
      ? categories.map((cat, i) => ({
          name: cat,
          value: categoryCounts[cat],
          color: palette[i % palette.length],
        }))
      : [{ name: "Grid Nominal (0 Incidents)", value: 1, color: "#10b981" }];

  const chartJson = JSON.stringify(
    {
      type: "pie",
      title: "SCADA Incidents by Category",
      total: list.length,
      data: chartData,
    },
    null,
    2
  );

  return `### TALLINN SCADA • INCIDENT CATEGORY BREAKDOWN

**Telemetry Status:** **${list.length} Total Incident(s)** logged in live registry.

${
  categories.length > 0
    ? categories
        .map(
          (cat) =>
            `- **${cat}:** ${categoryCounts[cat]} active event(s) across Tallinn sectors.`
        )
        .join("\n")
    : "- **Grid Telemetry:** All Tallinn sectors operating nominally at 50.0 Hz with 0 tripped transformers."
}

\`\`\`chart:pie
${chartJson}
\`\`\``;
}

export function generateFastIncidentBriefing(activeIncidents?: Incident[]): string {
  const list = activeIncidents && activeIncidents.length > 0 ? activeIncidents : [];
  if (list.length === 0) {
    return `### TALLINN SCADA OPERATIONAL BRIEFING • ALL NOMINAL

**System Status:** **0 Active Incidents** across all Tallinn sectors.

- **Electrical Grid:** Substations (Vanalinn, Ülemiste, Mustamäe, Kristiine) operating stably. Bus voltages within 110 kV / 10 kV limits.
- **Urban Transport & Telecom:** Signal controllers, traffic telemetry, and dispatch gateways nominal.
- **Summary:** All municipal infrastructure is operating within standard tolerances. Zero tripped relays or emergency alerts logged in live SCADA database.`;
  }

  const critical = list.filter((i) => i.severity === "critical");
  const warning = list.filter((i) => i.severity === "warning");
  const info = list.filter((i) => i.severity !== "critical" && i.severity !== "warning");

  // Calculate category distribution for live PieChart
  const categoryCounts: Record<string, number> = {};
  list.forEach((inc) => {
    const cat = inc.category || "Power & Grid Infrastructure";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const palette = ["#ef4444", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899"];
  const categories = Object.keys(categoryCounts);
  const chartData = categories.map((cat, i) => ({
    name: cat,
    value: categoryCounts[cat],
    color: palette[i % palette.length],
  }));

  const chartJson = JSON.stringify(
    {
      type: "pie",
      title: "SCADA Incidents by Category",
      total: list.length,
      data: chartData,
    },
    null,
    2
  );

  const lines: string[] = [
    `### TALLINN SCADA OPERATIONAL BRIEFING`,
    `**Active Incidents:** **${list.length} Total** (${critical.length} Critical, ${warning.length} Warning, ${info.length} Info/Mitigated)`,
    "",
  ];

  if (critical.length > 0) {
    lines.push(`**Critical Priority:**`);
    critical.forEach((inc) => {
      const sector = inc.district ? ` (${inc.district} Sector)` : "";
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`${sector}`);
      lines.push(`  - **Details:** ${inc.description}`);
      lines.push(`  - **Status:** Failover routing engaged for impacted nodes.`);
      lines.push(`  - **Casualties & Impact:** 0 direct casualties. ~2,500 residents affected; critical facilities switched to backup power.`);
      lines.push(`  - **Recommendation:** Dispatch repair unit with mobile generator to ${targetId}; verify telemetry before breaker reset.`);
    });
    lines.push("");
  }

  if (warning.length > 0) {
    lines.push(`**Active Warnings:**`);
    warning.forEach((inc) => {
      const sector = inc.district ? ` (${inc.district} Sector)` : "";
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`${sector}`);
      lines.push(`  - **Details:** ${inc.description}`);
      lines.push(`  - **Status:** Active monitoring.`);
      lines.push(`  - **Casualties & Impact:** 0 casualties. Minor service disruption isolated.`);
      lines.push(`  - **Recommendation:** Monitor telemetry drift and schedule preventative inspection for ${targetId}.`);
    });
    lines.push("");
  }

  if (info.length > 0) {
    lines.push(`**Monitored / Mitigated:**`);
    info.forEach((inc) => {
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`: ${inc.description}`);
    });
    lines.push("");
  }

  lines.push(`**Operational Summary:** Failover routing engaged for impacted nodes.`);
  lines.push("");
  lines.push("```chart:pie");
  lines.push(chartJson);
  lines.push("```");

  return lines.join("\n");
}

export function isNepalQuery(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.toLowerCase().trim();
  return (
    clean.includes("nepal") ||
    clean.includes("непал") ||
    clean.includes("langtang") ||
    clean.includes("лангтанг") ||
    clean.includes("trishuli") ||
    clean.includes("тришули")
  );
}

export function formatFastNepalBriefing(): string {
  return `### NEPAL CRYOSPHERE-HYDRO CASCADE • DISASTER ASSESSMENT

**Incident:** Langtang Lirung Glacier Collapse & High-Velocity Debris Flood  
**Date & Trigger Time:** August 26, 2026 • 08:37:10 NPT  
**Trigger Mechanism:** Catastrophic rock-ice avalanche collapse (~6.8 million m³) from the north flank of Langtang Lirung (7,234 m). Seismic signature equivalent to **M5.2**.

---

### CASUALTIES & HUMAN IMPACT
- **Confirmed Fatalities (Killed):** **1,453** confirmed dead across impacted river sectors in Nepal (plus additional cross-border casualties in Tibet Autonomous Region).
- **Missing Persons (Unaccounted For):** **5,000 – 6,600+** individuals unaccounted for / swept away by hyper-concentrated debris torrents.
- **Population at Risk & Warning SMS:** **679,295** emergency mass alerts broadcast down the Trishuli and Narayani river corridors.
- **Workforce Impact:** Substantial casualties among hydropower plant operators and highway infrastructure crews trapped in narrow gorge segments.

---

### CRITICAL INFRASTRUCTURE DAMAGE
- **Hydrological Surge:** River stage surged by **+9.0 m within 30 minutes** at Galchhi (stage 11.1 m; danger threshold 9.0 m) and crested at **12.3 m** in the Kalikhola gorge.
- **Key Transport Corridors:**
  - **Pasang Lhamu Highway (NH09):** Completely severed; Miteri Friendship Bridge destroyed at Rasuwagadhi border.
  - **Prithvi Highway (H04) & Muglin–Narayangarh (H05):** Inundated and washed out; relief freight diverted via BP Highway (H06).
- **Telemetry & Energy:** 5 hydrometric river stations destroyed; multiple run-of-the-river hydropower facilities compromised.

---

### VIDEO REFERENCE
[FRANCE 24: Nepal flood disaster reconstructed minute by minute](https://www.youtube.com/watch?v=ORPDEvHJZpA)`;
}

const DEFAULT_GREETING: DashboardChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Cassandra SCADA Agent online. Connected to Tallinn Central Command Center. All telemetry pipelines active. How can I assist?",
  ts: "08:47:00",
};

export interface ExtendedAIAssistantProps extends AIAssistantProps {
  onMapAction?: (action: MapAction) => void;
  activeTab?: string;
  activeNepalEvent?: NepalTimelineEvent | null;
  currentReplaySeconds?: number;
  onSeekReplay?: (seconds: number) => void;
  onSelectNepalEvent?: (event: NepalTimelineEvent) => void;
  selectedIncident?: Incident | null;
  incidents?: Incident[];
  defaultMode?: "chat" | "analysis";
  width?: number;
  onWidthChange?: (width: number) => void;
  isDragging?: boolean;
  onDraggingChange?: (isDragging: boolean) => void;
}

export function AIAssistant({
  isOpen,
  onClose,
  context,
  onClearContext,
  onMapAction,
  activeTab,
  activeNepalEvent,
  currentReplaySeconds,
  onSeekReplay,
  onSelectNepalEvent,
  selectedIncident,
  incidents,
  defaultMode,
  width: controlledWidth,
  onWidthChange,
  isDragging: controlledIsDragging,
  onDraggingChange,
}: ExtendedAIAssistantProps) {
  const [messages, setMessages] = useState<DashboardChatMessage[]>([DEFAULT_GREETING]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [mode, setMode] = useState<"chat" | "analysis">("chat");

  const DEFAULT_WIDTH = 446;
  const MIN_WIDTH = 446;
  const [internalWidth, setInternalWidth] = useState<number>(DEFAULT_WIDTH);
  const [internalIsDragging, setInternalIsDragging] = useState<boolean>(false);

  const width = controlledWidth !== undefined ? controlledWidth : internalWidth;
  const isDragging = controlledIsDragging !== undefined ? controlledIsDragging : internalIsDragging;

  const setWidth = (w: number) => {
    if (onWidthChange) onWidthChange(w);
    else setInternalWidth(w);
  };

  const setIsDragging = (d: boolean) => {
    if (onDraggingChange) onDraggingChange(d);
    else setInternalIsDragging(d);
  };

  // Restore saved width from localStorage if not controlled
  useEffect(() => {
    if (controlledWidth === undefined) {
      try {
        const savedWidth = localStorage.getItem("nc_copilot_drawer_width");
        if (savedWidth) {
          const parsed = parseInt(savedWidth, 10);
          if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
            const maxWidth = Math.min(window.innerWidth - 40, 1400);
            setWidth(Math.min(parsed, maxWidth));
          }
        }
      } catch {}
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const maxWidth = Math.min(window.innerWidth - 40, 1400);
    const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, window.innerWidth - e.clientX));
    setWidth(newWidth);
    window.dispatchEvent(new Event("resize"));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      try {
        localStorage.setItem("nc_copilot_drawer_width", width.toString());
      } catch {}
      window.dispatchEvent(new Event("resize"));
    }
  };

  const handleDoubleClickReset = () => {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem("nc_copilot_drawer_width", DEFAULT_WIDTH.toString());
    } catch {}
    setTimeout(() => window.dispatchEvent(new Event("resize")), 220);
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "map") {
        setMode("chat");
      } else if (defaultMode) {
        setMode(defaultMode);
      }
    }
  }, [defaultMode, isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === "map") {
      setMode("chat");
    }
  }, [activeTab]);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    status: "online",
    activeModel: "qwen2.5:latest",
    models: ["qwen2.5:latest"],
    provider: "Neural City Harness",
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or chunk
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Load model health status
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data: ModelStatus) => {
        if (data.status) {
          setModelStatus(data);
        }
      })
      .catch(() => {
        setModelStatus((prev) => ({ ...prev, status: "degraded" }));
      });
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (isStreaming) return;

    // Direct client-side spatial resolution for instant zero-latency map flights
    let clientAction = resolveClientMapAction(text);
    if (!clientAction) {
      const lower = text.trim().toLowerCase();
      // If user specifically said "fly there", "take me there", "move map there", "show it on map"
      if (/^(fly|navigate|move\s+(the\s+)?map|take\s+me)\s+(there|to\s+it)\b/i.test(lower) || /^(show|locate)\s+(it|this)\s+on\s+(the\s+)?map\b/i.test(lower)) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const pastAction = resolveClientMapAction(messages[i].content);
          if (pastAction) {
            clientAction = pastAction;
            break;
          }
        }
      }
    }

    if (clientAction) {
      if (onMapAction) {
        onMapAction(clientAction);
      }

      const userMsg: DashboardChatMessage = {
        id: `usr_${Date.now()}`,
        role: "user",
        content: text,
        ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };

      const assistantMsgId = `ast_${Date.now()}`;
      const actionMsg: DashboardChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        mapAction: clientAction,
        ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg, actionMsg]);
      return;
    }

    const userMsg: DashboardChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    const assistantMsgId = `ast_${Date.now()}`;
    const placeholderMsg: DashboardChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      mapAction: undefined,
      ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...newMessages, placeholderMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Fast-path execution for operational incident briefings (instant streaming without LLM delay)
    if (isOperationalIncidentBriefingQuery(text)) {
      const briefing = generateFastIncidentBriefing(incidents);
      const words = briefing.split(" ");
      let accumulated = "";

      try {
        const chunkSize = 7;
        for (let i = 0; i < words.length; i += chunkSize) {
          if (abortController.signal.aborted) break;
          const chunk = words.slice(i, i + chunkSize).join(" ");
          accumulated += (accumulated ? " " : "") + chunk;
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
            )
          );
          await new Promise((r) => setTimeout(r, 4));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // Fast-path execution for Incident Category PieChart queries
    if (isIncidentChartQuery(text)) {
      const chartResponse = generateIncidentCategoryPieChart(incidents);
      const words = chartResponse.split(" ");
      let accumulated = "";

      try {
        const chunkSize = 8;
        for (let i = 0; i < words.length; i += chunkSize) {
          if (abortController.signal.aborted) break;
          const chunk = words.slice(i, i + chunkSize).join(" ");
          accumulated += (accumulated ? " " : "") + chunk;
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
            )
          );
          await new Promise((r) => setTimeout(r, 4));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // Fast-path execution for Nepal Cascade / Disaster queries
    if (isNepalQuery(text)) {
      const nepalBriefing = formatFastNepalBriefing();
      const words = nepalBriefing.split(" ");
      let accumulated = "";

      try {
        const chunkSize = 8;
        for (let i = 0; i < words.length; i += chunkSize) {
          if (abortController.signal.aborted) break;
          const chunk = words.slice(i, i + chunkSize).join(" ");
          accumulated += (accumulated ? " " : "") + chunk;
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
            )
          );
          await new Promise((r) => setTimeout(r, 4));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
      return;
    }

    let effectiveContext = context || "";
    if (activeTab === "nepal" && activeNepalEvent) {
      const nepalInfo = `[ACTIVE NEPAL CASCADE REPLAY CONTEXT]
- Current Replay Time: ${activeNepalEvent.timeNpt} NPT (${activeNepalEvent.timeDisplay})
- Replay Phase: ${activeNepalEvent.phase}
- Active Event (${activeNepalEvent.eventId}): ${activeNepalEvent.eventType} - ${activeNepalEvent.eventDescription}
- Location: ${activeNepalEvent.location} (Distance from trigger: ${activeNepalEvent.distanceFromTriggerKm} km, Elevation: ${activeNepalEvent.elevationMeters ?? "N/A"} m)
- Severity: ${activeNepalEvent.severity.toUpperCase()} | Confidence: ${activeNepalEvent.confidence}
- Affected Highway / Corridor: ${activeNepalEvent.affectedRoute || "N/A"}
${activeNepalEvent.gaugeReading ? `- Gauge Reading: ${activeNepalEvent.gaugeReading.levelMeters}m (${activeNepalEvent.gaugeReading.description})` : ""}
${activeNepalEvent.warningCount ? `- Emergency Warnings: ${activeNepalEvent.warningCount.toLocaleString()} SMS alerts sent` : ""}
- AI Interpretation: ${activeNepalEvent.aiInterpretation}
- Recommended Action: ${activeNepalEvent.recommendedAiTask}`;

      effectiveContext = effectiveContext ? `${nepalInfo}\n\n${effectiveContext}` : nepalInfo;
    } else if (activeTab === "map" || !activeTab) {
      const activeIncidents = incidents && incidents.length > 0 ? incidents : [];
      const criticalCount = activeIncidents.filter((i) => i.severity === "critical").length;
      const warningCount = activeIncidents.filter((i) => i.severity === "warning").length;
      const otherCount = activeIncidents.length - criticalCount - warningCount;

      const incidentListText = activeIncidents
        .map(
          (inc, idx) =>
            `${idx + 1}. [${inc.severity.toUpperCase()}] "${inc.title}" (ID: ${inc.id}, Category: ${inc.category}, District: ${inc.district || "Tallinn"}, SCADA Node: ${inc.nodeId}, Status: ${inc.status}, Time: ${inc.timestamp})\n   Details: ${inc.description}`
        )
        .join("\n");

      let incidentRegistrySection = "";
      if (activeIncidents.length === 0) {
        incidentRegistrySection = `[DATABASE INCIDENT REGISTRY - STRICT GROUND TRUTH]
- Database Status: ALL SYSTEMS NOMINAL (0 Active Incidents in DB)
- Total Active Incidents in Database: 0
- Tripped Transformers: NONE (0)
- Grid Voltage Surges: NONE (0)
- Traffic Controller Faults: NONE (0)
- Water/Hydraulic Anomalies: NONE (0)
- All municipal power grids, transformers, substations (including Vanalinn, Ülemiste, Mustamäe, Kristiine, Kadriorg, etc.), and traffic corridors are operating normally within standard operational tolerances (50.0 Hz nominal, 0 faults).
- DIRECTIVE: When asked about active incidents, power outages, tripped transformers, or voltage surges (e.g. on Vanalinn or Ülemiste feeders), you MUST state that according to the live SCADA database, there are NO active incidents or tripped transformers, and all grid telemetry is nominal. Do NOT hallucinate or assume any outages.`;
      } else {
        incidentRegistrySection = `[DATABASE INCIDENT REGISTRY - STRICT GROUND TRUTH]
- Total Active Incidents in DB: ${activeIncidents.length} (${criticalCount} Critical, ${warningCount} Warning, ${otherCount} Normal/Info)
${selectedIncident ? `- Currently Selected/Inspected Incident: "${selectedIncident.title}" [${selectedIncident.id}] (${selectedIncident.severity.toUpperCase()}) in ${selectedIncident.district || "Tallinn"} (Node: ${selectedIncident.nodeId})` : ""}
- Active Incident Records from Database:
${incidentListText}
- DIRECTIVE: Base all incident briefings strictly on the ${activeIncidents.length} records above. Any substation, feeder, or district not listed in this registry has zero incidents and is operating nominally.`;
      }

      const mapInfo = `[CURRENT OPERATIONAL PICTURE CONTEXT - TALLINN SCADA COMMAND CENTER]
- Current View: Operational Picture (Real-time City GIS Map, Electrical Grid & Urban Telemetry)
${incidentRegistrySection}
- Operational Picture Directives:
  * When asked about the Operational Picture, explain the live C2 map layers (SCADA electrical grid, traffic, transit, maritime AIS, aviation TMA, emergency services).
  * When asked about incidents, outages, or anomalies, provide a structured executive briefing based strictly on the verified database registry above.`;

      effectiveContext = effectiveContext ? `${mapInfo}\n\n${effectiveContext}` : mapInfo;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => {
            if ((!m.content || m.content.trim().length === 0) && m.mapAction) {
              const act = m.mapAction as MapAction;
              return {
                role: m.role,
                content: `Focus Map: ${act.title || "Target Coordinates"}`,
              };
            }
            return { role: m.role, content: m.content || " " };
          }),
          context: effectiveContext || undefined,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let errDetail = "Failed to communicate with AI model.";
        try {
          const errData = await res.json();
          if (errData?.error) errDetail = errData.error;
        } catch {}
        throw new Error(errDetail);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
          throw new Error(data.error);
        }
        const textContent =
          typeof data === "object" && data !== null && "content" in data
            ? String(data.content)
            : JSON.stringify(data);
        const mapAct = data.mapAction || clientAction;
        if (mapAct && onMapAction) {
          onMapAction(mapAct);
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: textContent, mapAction: mapAct }
              : msg
          )
        );
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let triggeredAction = false;
        let rafId: number | null = null;
        let lastRenderedText = "";

        const flushRender = (finalText: string, finalAction: MapAction | null | undefined) => {
          if (finalText === lastRenderedText) return;
          lastRenderedText = finalText;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: finalText, mapAction: finalAction || msg.mapAction }
                : msg
            )
          );
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });

            let displayContent = accumulated;
            let activeMapAction = clientAction;

            // Check for embedded MAP_ACTION comment in stream
            const actionMatch = accumulated.match(/<!--\s*MAP_ACTION:\s*(\{.*?\})\s*-->/);
            if (actionMatch) {
              try {
                const parsed = JSON.parse(actionMatch[1]);
                activeMapAction = parsed;
                if (!triggeredAction && onMapAction) {
                  onMapAction(parsed);
                  triggeredAction = true;
                }
              } catch {}
            }

            if (accumulated.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(accumulated.trim());
                if (parsed && typeof parsed.error === "string") {
                  throw new Error(parsed.error);
                }
                if (parsed && typeof parsed.content === "string") {
                  displayContent = parsed.content;
                  if (parsed.mapAction) {
                    activeMapAction = parsed.mapAction;
                    if (!triggeredAction && onMapAction) {
                      onMapAction(parsed.mapAction);
                      triggeredAction = true;
                    }
                  }
                }
              } catch (jsonErr) {
                if (jsonErr instanceof Error && jsonErr.message && !jsonErr.message.includes("JSON")) {
                  throw jsonErr;
                }
              }
            }

            if (!rafId) {
              const currentContent = displayContent;
              const currentAct = activeMapAction;
              rafId = requestAnimationFrame(() => {
                rafId = null;
                flushRender(currentContent, currentAct);
              });
            }
          }
        } finally {
          if (rafId) cancelAnimationFrame(rafId);
          flushRender(accumulated, clientAction);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errorMsg = (err as Error).message || "An error occurred while generating the response.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: errorMsg,
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
  }, [
    isStreaming,
    messages,
    onMapAction,
    incidents,
    activeTab,
    selectedIncident,
    currentReplaySeconds,
    activeNepalEvent,
  ]);

  const handleRetry = useCallback((failedMsgId?: string) => {
    if (isStreaming) return;

    let userPromptToRetry = "";
    if (failedMsgId) {
      const idx = messages.findIndex((m) => m.id === failedMsgId);
      if (idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            userPromptToRetry = messages[i].content;
            setMessages(messages.slice(0, i));
            break;
          }
        }
      }
    }

    if (!userPromptToRetry) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userPromptToRetry = messages[i].content;
          setMessages(messages.slice(0, i));
          break;
        }
      }
    }

    if (userPromptToRetry) {
      handleSendMessage(userPromptToRetry);
    }
  }, [isStreaming, messages, handleSendMessage]);

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    handleStopStreaming();
    setMessages([DEFAULT_GREETING]);
    if (onClearContext) onClearContext();
  }, [handleStopStreaming, onClearContext]);

  if (!isOpen) return null;

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`fixed top-0 right-0 z-40 max-w-[calc(100vw-32px)] h-screen bg-card border-l border-border flex flex-col shadow-lg ${
        isDragging ? "select-none" : "transition-[width] duration-150 ease-out"
      }`}
    >
      {/* Draggable Resize Handle on Left Border */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClickReset}
        title="Drag left/right to resize • Double-click to reset"
        className="absolute top-0 bottom-0 -left-2 w-4 cursor-col-resize z-50 flex items-center justify-center group touch-none select-none"
      >
        {/* Active/Hover line */}
        <div
          className={`absolute inset-y-0 right-2 w-[2px] transition-colors duration-150 ${
            isDragging
              ? "bg-primary"
              : "bg-transparent group-hover:bg-primary/70"
          }`}
        />

        {/* Grab Handle Pill Indicator */}
        <div
          className={`relative z-10 w-1.5 h-12 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
            isDragging
              ? "bg-primary scale-110 opacity-100 shadow-sm"
              : "bg-muted-foreground/30 group-hover:bg-primary/90 group-hover:scale-105 group-hover:opacity-100 opacity-60"
          }`}
        >
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
        </div>

        {/* Live Width Badge when dragging */}
        {isDragging && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-popover border border-primary/50 text-primary text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap animate-in fade-in">
            {Math.round(width)}px
          </div>
        )}
      </div>

      <ChatHeader
        modelStatus={modelStatus}
        onReset={handleReset}
        onClose={onClose}
        isStreaming={isStreaming}
      />

      {/* Copilot Option Switcher: Chat vs Real time analysis */}
      <div className="flex items-center px-4 py-2 border-b border-border/60 bg-muted/30 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
            mode === "chat"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cassandra Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("analysis")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
            mode === "analysis"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real time analysis</span>
        </button>
      </div>

      {/* Real Time Analysis Panel - kept mounted */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${mode === "analysis" ? "flex" : "hidden"}`}>
        <RealTimeAnalysisPanel
          activeTab={activeTab}
          activeNepalEvent={activeNepalEvent}
          currentReplaySeconds={currentReplaySeconds}
          onSeekReplay={onSeekReplay}
          onSelectNepalEvent={onSelectNepalEvent}
          selectedIncident={selectedIncident}
        />
      </div>

      {/* Copilot Chat Panel - kept mounted to never interrupt playing video or reset scroll */}
      <div className={`flex-1 flex flex-col min-h-0 ${mode === "chat" ? "flex" : "hidden"}`}>
        <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              <ChatMessageItem
                message={msg}
                onMapAction={onMapAction}
                isStreaming={isStreaming && index === messages.length - 1}
                onRetry={handleRetry}
                onNewChat={handleReset}
              />
              {index === 0 && messages.length === 1 && !isStreaming && (
                <ChatPromptSuggestions
                  onSelectPrompt={handleSendMessage}
                  disabled={isStreaming}
                  activeTab={activeTab}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <ChatInputArea
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          context={context}
          onClearContext={onClearContext}
        />
      </div>
    </aside>
  );
}

export default AIAssistant;
