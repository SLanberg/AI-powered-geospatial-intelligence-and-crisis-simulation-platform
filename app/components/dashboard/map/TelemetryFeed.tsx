import React, { useEffect, useRef, useState } from "react";
import { LayoutGrid, Pin, X, GripVertical } from "lucide-react";

import type { Incident } from "../data";

interface TelemetryFeedProps {
  filteredIncidents: Incident[];
  setSelectedIncident: (incident: Incident | null) => void;
  flyTo: (latitude: number, longitude: number, zoom: number) => void;
  onClose: () => void;
  onSelectIncident?: (incident: Incident) => void;
}

const severityConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  critical: {
    label: "critical",
    bg: "rgba(239,68,68,0.15)",
    text: "#f87171",
    dot: "#ef4444",
  },
  warning: {
    label: "warning",
    bg: "rgba(234,179,8,0.15)",
    text: "#facc15",
    dot: "#eab308",
  },
  info: {
    label: "info",
    bg: "rgba(148,163,184,0.12)",
    text: "#94a3b8",
    dot: "#64748b",
  },
};

export function TelemetryFeed({
  filteredIncidents,
  setSelectedIncident,
  flyTo,
  onClose,
  onSelectIncident,
}: TelemetryFeedProps) {
  const [pinned, setPinned] = useState(false);

  /* ── Drag logic ── */
  const [position, setPosition] = useState<{ right: number; top: number }>({
    right: 12,
    top: 12,
  });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originRight: number;
    originTop: number;
  } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setPosition({
        right: d.originRight - (e.clientX - d.startX),
        top: d.originTop + (e.clientY - d.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originRight: position.right,
      originTop: position.top,
    };
  };

  return (
    <div
      style={{
        ...s.panel,
        right: position.right,
        top: position.top,
      }}
    >
      {/* ── Header ── */}
      <div style={s.header} onPointerDown={onPointerDown}>
        <div style={s.headerLeft}>
          <GripVertical style={{ width: 12, height: 12, color: "#334155", flexShrink: 0 }} />
          <LayoutGrid style={{ width: 12, height: 12, color: "#64748b", flexShrink: 0 }} />
          <span style={s.headerTitle}>TELEMETRY FEED</span>
        </div>

        <div style={s.headerActions}>
          <button
            type="button"
            aria-label="Pin panel"
            onClick={() => setPinned((v) => !v)}
            style={{
              ...s.headerBtn,
              color: pinned ? "#60a5fa" : "#475569",
            }}
          >
            <Pin style={{ width: 11, height: 11 }} />
          </button>
          <button
            type="button"
            aria-label="Close feed"
            onClick={onClose}
            style={s.headerBtn}
          >
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>

      {/* ── Card List ── */}
      <div style={s.cardList}>
        {filteredIncidents.map((incident) => {
          const sev = severityConfig[incident.severity] ?? severityConfig.info;
          return (
            <button
              key={incident.id}
              type="button"
              onClick={() => {
                onSelectIncident?.(incident);
                setSelectedIncident(incident);
                flyTo(incident.lat, incident.lng, 14.8);
              }}
              style={s.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2a3444";
                e.currentTarget.style.background = "#1a2230";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e2734";
                e.currentTarget.style.background = "#161c24";
              }}
            >
              {/* Top: ID + Severity */}
              <div style={s.cardTopRow}>
                <span style={s.incidentId}>{incident.id}</span>
                <span
                  style={{
                    ...s.severityBadge,
                    background: sev.bg,
                    color: sev.text,
                  }}
                >
                  <span style={{ ...s.severityDot, background: sev.dot }} />
                  {sev.label}
                </span>
              </div>

              {/* Middle: Event title */}
              <div style={s.cardTitle}>{incident.title}</div>

              {/* Bottom: Timestamp + Asset Code */}
              <div style={s.cardBottomRow}>
                <span style={s.timestamp}>{incident.timestamp}</span>
                <span style={s.nodeId}>{incident.nodeId}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Inline styles — compact dark tactical palette
   ──────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  panel: {
    position: "absolute",
    zIndex: 20,
    width: 272,
    maxHeight: "calc(100% - 24px)",
    display: "flex",
    flexDirection: "column",
    borderRadius: 10,
    border: "1px solid #1e2734",
    background: "#11161d",
    boxShadow: "0 6px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
    overflow: "hidden",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 10px",
    borderBottom: "1px solid #1e2734",
    background: "#11161d",
    flexShrink: 0,
    cursor: "grab",
    userSelect: "none" as const,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#cbd5e1",
    lineHeight: 1,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  headerBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: 5,
    border: "none",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    transition: "color 0.15s",
    padding: 0,
  },

  cardList: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  card: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
    padding: "7px 9px",
    borderRadius: 6,
    border: "1px solid #1e2734",
    background: "#161c24",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.15s, background 0.15s",
  },

  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  incidentId: {
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    color: "#60a5fa",
    letterSpacing: "0.03em",
  },
  severityBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 8.5,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    padding: "1px 6px",
    borderRadius: 3,
    lineHeight: "14px",
  },
  severityDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "#e2e8f0",
    lineHeight: 1.35,
  },

  cardBottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestamp: {
    fontSize: 9,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    color: "#475569",
    fontWeight: 500,
  },
  nodeId: {
    fontSize: 9,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    color: "#475569",
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
};
