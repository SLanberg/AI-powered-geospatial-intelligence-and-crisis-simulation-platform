"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Layers,
  Box,
  Crosshair,
  Map as MapIcon,
  Eye,
  EyeOff,
  Plane,
  Anchor,
  Siren,
  AlertTriangle,
  Satellite,
  Bus,
  Flame,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type MapTheme = "dark" | "voyager" | "satellite";

export interface LayerConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  count: number | string;
  onToggle: () => void;
}

export interface MapToolbarProps {
  /* Viewport controls */
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  is3D: boolean;
  toggle3D: () => void;
  resetView: () => void;

  /* Layer visibility */
  showFlights?: boolean;
  setShowFlights?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showVehicles?: boolean;
  setShowVehicles?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showEmergencyServices?: boolean;
  setShowEmergencyServices?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showTransportHubs?: boolean;
  setShowTransportHubs?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showIncidents?: boolean;
  setShowIncidents?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showHeatmap?: boolean;
  setShowHeatmap?: (show: boolean | ((prev: boolean) => boolean)) => void;

  /* Custom layers extension */
  customLayers?: LayerConfig[];

  /* Counts */
  flightCount?: number;
  vehicleCount?: number;
  emergencyCount?: number;
  transportHubCount?: number;
  incidentCount?: number;
}

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

const C = {
  bg: "#1E1E1E",
  bgHover: "#2A2D2E",
  bgActive: "#37373D",
  border: "#333333",
  accent: "#007ACC",
  text: "#CCCCCC",
  textMuted: "#858585",
  textBright: "#E8E8E8",
} as const;

/* -------------------------------------------------------------------------- */
/* ToolButton – 36×36 icon button with right-side tooltip                     */
/* -------------------------------------------------------------------------- */

function ToolButton({
  icon,
  label,
  active = false,
  showDot = false,
  onClick,
  tooltipSide = "right",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  showDot?: boolean;
  onClick?: () => void;
  tooltipSide?: "right" | "left";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative flex items-center justify-center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 4,
        background: active ? C.bgActive : "transparent",
        color: active ? C.textBright : C.text,
        border: "none",
        cursor: "pointer",
        transition: "background 120ms, color 120ms",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = C.bgHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? C.bgActive : "transparent";
      }}
    >
      {icon}

      {/* Active dot indicator */}
      {showDot && (
        <span
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: C.accent,
          }}
        />
      )}

      {/* Tooltip */}
      <span
        className="pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          position: "absolute",
          [tooltipSide === "right" ? "left" : "right"]: "calc(100% + 8px)",
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          background: "#252526",
          color: C.textBright,
          fontSize: 11,
          fontWeight: 500,
          padding: "4px 8px",
          borderRadius: 4,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,.4)",
          zIndex: 100,
          transition: "opacity 100ms",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Separator line                                                             */
/* -------------------------------------------------------------------------- */

function ToolSep() {
  return (
    <div
      style={{
        width: 24,
        height: 1,
        background: C.border,
        margin: "2px auto",
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Layers Popover                                                             */
/* -------------------------------------------------------------------------- */

function LayersPopover({
  layers,
  open,
  onClose,
  anchorRef,
}: {
  layers: LayerConfig[];
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const allVisible = layers.every((l) => l.visible);
  const noneVisible = layers.every((l) => !l.visible);

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: "calc(100% + 8px)",
        top: 0,
        width: 220,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,.5)",
        zIndex: 60,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 10px 6px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: C.textMuted,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        Layers
      </div>

      {/* Layer list */}
      <div style={{ padding: "4px 0" }}>
        {layers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={layer.onToggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: layer.visible ? C.textBright : C.textMuted,
              fontSize: 12,
              fontWeight: 500,
              transition: "background 100ms, color 100ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = C.bgHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {/* Eye toggle */}
            <span
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: layer.visible ? C.text : C.textMuted,
                opacity: layer.visible ? 1 : 0.4,
              }}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>

            {/* Layer icon */}
            <span style={{ flexShrink: 0, display: "flex" }}>{layer.icon}</span>

            {/* Label */}
            <span
              style={{
                flex: 1,
                textAlign: "left",
                opacity: layer.visible ? 1 : 0.5,
              }}
            >
              {layer.label}
            </span>

            {/* Count badge */}
            <span
              style={{
                flexShrink: 0,
                minWidth: 20,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                background: layer.visible ? "#2A2D2E" : "transparent",
                color: layer.visible ? C.text : C.textMuted,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "SF Mono, Menlo, Consolas, monospace",
                padding: "0 5px",
                opacity: layer.visible ? 1 : 0.4,
              }}
            >
              {layer.count}
            </span>
          </button>
        ))}
      </div>

      {/* Footer actions */}
      <div
        style={{
          display: "flex",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            layers.forEach((l) => {
              if (l.visible) l.onToggle();
            });
          }}
          disabled={noneVisible}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            borderRight: `1px solid ${C.border}`,
            cursor: noneVisible ? "default" : "pointer",
            color: noneVisible ? C.textMuted : C.text,
            fontSize: 11,
            fontWeight: 500,
            opacity: noneVisible ? 0.4 : 1,
            fontFamily: "inherit",
            transition: "background 100ms",
          }}
          onMouseEnter={(e) => {
            if (!noneVisible) (e.currentTarget as HTMLButtonElement).style.background = C.bgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Hide All
        </button>

        <button
          type="button"
          onClick={() => {
            layers.forEach((l) => {
              if (!l.visible) l.onToggle();
            });
          }}
          disabled={allVisible}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            cursor: allVisible ? "default" : "pointer",
            color: allVisible ? C.textMuted : C.text,
            fontSize: 11,
            fontWeight: 500,
            opacity: allVisible ? 0.4 : 1,
            fontFamily: "inherit",
            transition: "background 100ms",
          }}
          onMouseEnter={(e) => {
            if (!allVisible) (e.currentTarget as HTMLButtonElement).style.background = C.bgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Show All
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Basemap Dropdown                                                           */
/* -------------------------------------------------------------------------- */

function BasemapDropdown({
  mapTheme,
  setMapTheme,
  open,
  onClose,
  anchorRef,
}: {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const options: { key: MapTheme; label: string }[] = [
    { key: "dark", label: "Tactical" },
    { key: "voyager", label: "Street" },
    { key: "satellite", label: "Satellite" },
  ];

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        right: "calc(100% + 8px)",
        top: 0,
        width: 140,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,.5)",
        zIndex: 60,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "hidden",
        padding: "4px 0",
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => {
            setMapTheme(opt.key);
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "6px 10px",
            background: mapTheme === opt.key ? C.bgActive : "transparent",
            border: "none",
            cursor: "pointer",
            color: mapTheme === opt.key ? C.textBright : C.text,
            fontSize: 12,
            fontWeight: mapTheme === opt.key ? 600 : 400,
            transition: "background 100ms",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (mapTheme !== opt.key)
              (e.currentTarget as HTMLButtonElement).style.background = C.bgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              mapTheme === opt.key ? C.bgActive : "transparent";
          }}
        >
          {mapTheme === opt.key && (
            <span style={{ color: C.accent, fontSize: 14, lineHeight: 1 }}>✓</span>
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MapToolbar (exported)                                                       */
/* -------------------------------------------------------------------------- */

export const MapToolbar = React.memo(function MapToolbar({
  mapTheme,
  setMapTheme,
  is3D,
  toggle3D,
  resetView,
  showFlights = true,
  setShowFlights,
  showVehicles = true,
  setShowVehicles,
  showEmergencyServices = true,
  setShowEmergencyServices,
  showTransportHubs = true,
  setShowTransportHubs,
  showIncidents = true,
  setShowIncidents,
  showHeatmap = false,
  setShowHeatmap,
  customLayers = [],
  flightCount = 0,
  vehicleCount = 0,
  emergencyCount = 0,
  transportHubCount = 0,
  incidentCount = 0,
}: MapToolbarProps) {

  const [layersOpen, setLayersOpen] = useState(false);
  const [basemapOpen, setBasemapOpen] = useState(false);

  const layersBtnRef = useRef<HTMLButtonElement | null>(null);
  const basemapBtnRef = useRef<HTMLButtonElement | null>(null);

  /* Close basemap when layers opens and vice-versa */
  const handleLayersToggle = useCallback(() => {
    setLayersOpen((p) => !p);
    setBasemapOpen(false);
  }, []);

  const handleBasemapToggle = useCallback(() => {
    setBasemapOpen((p) => !p);
    setLayersOpen(false);
  }, []);

  /* Build layer config */
  const layers: LayerConfig[] = [
    ...(setShowFlights
      ? [
          {
            id: "air",
            label: "Air",
            icon: <Plane size={14} />,
            visible: showFlights,
            count: flightCount,
            onToggle: () => setShowFlights((p: boolean) => !p),
          },
        ]
      : []),
    ...(setShowVehicles
      ? [
          {
            id: "maritime",
            label: "Maritime",
            icon: <Anchor size={14} />,
            visible: showVehicles,
            count: vehicleCount,
            onToggle: () => setShowVehicles((p: boolean) => !p),
          },
        ]
      : []),
    ...(setShowEmergencyServices
      ? [
          {
            id: "emergency",
            label: "Emergency Services",
            icon: <Siren size={14} />,
            visible: showEmergencyServices,
            count: emergencyCount,
            onToggle: () => setShowEmergencyServices((p: boolean) => !p),
          },
        ]
      : []),
    ...(setShowTransportHubs
      ? [
          {
            id: "transport_hubs",
            label: "Transport Hubs",
            icon: <Bus size={14} />,
            visible: showTransportHubs,
            count: transportHubCount,
            onToggle: () => setShowTransportHubs((p: boolean) => !p),
          },
        ]
      : []),
    ...(setShowIncidents
      ? [
          {
            id: "incidents",
            label: "Incidents",
            icon: <AlertTriangle size={14} />,
            visible: showIncidents,
            count: incidentCount,
            onToggle: () => setShowIncidents((p: boolean) => !p),
          },
        ]
      : []),
    ...(setShowHeatmap
      ? [
          {
            id: "heatmap",
            label: "Incident Heatmap",
            icon: <Flame size={14} />,
            visible: showHeatmap,
            count: incidentCount,
            onToggle: () => setShowHeatmap((p: boolean) => !p),
          },
        ]
      : []),
    ...customLayers,
  ];

  const anyLayerVisible = layers.some((l) => l.visible);

  /* ---- Toolbar bar style ---- */
  const barStyle: React.CSSProperties = {
    position: "absolute",
    top: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "4px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    zIndex: 50,
    boxShadow: "0 2px 10px rgba(0,0,0,.35)",
  };

  return (
    <>
      {/* ============================================================= */}
      {/* LEFT TOOLBAR – Tools & Layers                                  */}
      {/* ============================================================= */}
      <div style={{ ...barStyle, left: 12 }}>

        {/* Layers toggle – has popover */}
        <div style={{ position: "relative" }}>
          <ToolButton
            icon={<Layers size={18} />}
            label="Layers"
            active={layersOpen}
            showDot={anyLayerVisible}
            onClick={handleLayersToggle}
          />

          {/* We need to capture a ref on the actual button for click-outside.
              Wrap the ToolButton's onClick so the ref is on a wrapper. */}
          {/* Invisible ref anchor */}
          <button
            ref={layersBtnRef}
            type="button"
            aria-hidden
            tabIndex={-1}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          <LayersPopover
            layers={layers}
            open={layersOpen}
            onClose={() => setLayersOpen(false)}
            anchorRef={layersBtnRef}
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/* RIGHT TOOLBAR – Viewport & Basemap                             */}
      {/* ============================================================= */}
      <div style={{ ...barStyle, right: 12 }}>
        <ToolButton
          icon={<Box size={18} />}
          label={is3D ? "Disable 3D" : "Enable 3D"}
          active={is3D}
          onClick={toggle3D}
          tooltipSide="left"
        />

        <ToolButton
          icon={<Crosshair size={18} />}
          label="Center View"
          onClick={resetView}
          tooltipSide="left"
        />

        <ToolSep />

        {/* Basemap selector */}
        <div style={{ position: "relative" }}>
          <ToolButton
            icon={
              mapTheme === "satellite" ? (
                <Satellite size={18} />
              ) : (
                <MapIcon size={18} />
              )
            }
            label="Basemap"
            active={basemapOpen}
            onClick={handleBasemapToggle}
            tooltipSide="left"
          />

          <button
            ref={basemapBtnRef}
            type="button"
            aria-hidden
            tabIndex={-1}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          <BasemapDropdown
            mapTheme={mapTheme}
            setMapTheme={setMapTheme}
            open={basemapOpen}
            onClose={() => setBasemapOpen(false)}
            anchorRef={basemapBtnRef}
          />
        </div>
      </div>
    </>
  );
});


