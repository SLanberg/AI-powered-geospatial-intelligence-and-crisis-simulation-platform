"use client";

import React, { useState, useEffect } from "react";
import { Incident, CreateIncidentPayload, Severity, MakiIconName } from "@/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MakiIcon } from "@/components/dashboard/map/MakiIcon";
import {
  AlertTriangle,
  Radio,
  MapPin,
  Sparkles,
  X,
  CheckCircle2,
  RefreshCw,
  Server,
  FileText,
} from "lucide-react";

export interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident?: Incident | null;
  onSave: (data: CreateIncidentPayload) => Promise<boolean>;
}

const CATEGORIES = [
  "Grid Failure",
  "Traffic Flow",
  "Telecom Node",
  "Emergency Dispatch",
  "Sensor Anomaly",
  "Cyber Security",
  "Water Infrastructure",
];

const SEVERITIES: { label: string; value: Severity; color: string; border: string }[] = [
  { label: "Critical", value: "critical", color: "text-red-400 bg-red-500/10", border: "border-red-500/40" },
  { label: "Warning", value: "warning", color: "text-amber-400 bg-amber-500/10", border: "border-amber-500/40" },
  { label: "Info", value: "info", color: "text-blue-400 bg-blue-500/10", border: "border-blue-500/40" },
];

const STATUSES: { label: string; value: "active" | "investigating" | "mitigated" | "resolved" }[] = [
  { label: "Active", value: "active" },
  { label: "Investigating", value: "investigating" },
  { label: "Mitigated", value: "mitigated" },
  { label: "Resolved", value: "resolved" },
];

const MAKI_ICONS: MakiIconName[] = [
  "lightning",
  "caution",
  "traffic-light",
  "emergency-phone",
  "communications-tower",
  "waveform",
  "fire-station",
  "police",
  "hospital",
  "water",
  "car",
  "bus",
  "rail",
  "drone",
];

const TALLINN_PRESETS = [
  { name: "Vanalinn / Old Town", lat: 59.4372, lng: 24.7453, district: "Vanalinn" },
  { name: "Ülemiste City", lat: 59.4215, lng: 24.7958, district: "Ülemiste" },
  { name: "Viru Junction", lat: 59.4365, lng: 24.7562, district: "Viru" },
  { name: "Balti Jaam", lat: 59.4402, lng: 24.7378, district: "Balti Jaam" },
  { name: "Port of Tallinn", lat: 59.445, lng: 24.768, district: "Port" },
  { name: "Kristiine Sector", lat: 59.426, lng: 24.724, district: "Kristiine" },
];

export function IncidentModal({ isOpen, onClose, incident, onSave }: IncidentModalProps) {
  const isEditing = Boolean(incident);

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("critical");
  const [category, setCategory] = useState("Grid Failure");
  const [status, setStatus] = useState<"active" | "investigating" | "mitigated" | "resolved">("active");
  const [district, setDistrict] = useState("Vanalinn");
  const [nodeId, setNodeId] = useState("");
  const [lat, setLat] = useState<number>(59.4372);
  const [lng, setLng] = useState<number>(24.7453);
  const [makiIcon, setMakiIcon] = useState<string>("lightning");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (incident) {
      setTitle(incident.title || "");
      setSeverity(incident.severity || "critical");
      setCategory(incident.category || "Grid Failure");
      setStatus(incident.status as any || "active");
      setDistrict(incident.district || "Vanalinn");
      setNodeId(incident.nodeId || "");
      setLat(incident.lat || 59.4372);
      setLng(incident.lng || 24.7453);
      setMakiIcon(incident.makiIcon || "caution");
      setDescription(incident.description || "");
    } else {
      // Reset for creation
      setTitle("");
      setSeverity("critical");
      setCategory("Grid Failure");
      setStatus("active");
      setDistrict("Vanalinn");
      setNodeId(`EE-TLN-SUB-${Math.floor(Math.random() * 89 + 10)}`);
      setLat(59.4372);
      setLng(24.7453);
      setMakiIcon("lightning");
      setDescription("");
    }
    setFormError(null);
  }, [incident, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    // Auto suggest icon based on category
    if (newCat === "Grid Failure") setMakiIcon("lightning");
    else if (newCat === "Traffic Flow") setMakiIcon("traffic-light");
    else if (newCat === "Telecom Node") setMakiIcon("communications-tower");
    else if (newCat === "Emergency Dispatch") setMakiIcon("emergency-phone");
    else if (newCat === "Sensor Anomaly") setMakiIcon("waveform");
    else if (newCat === "Water Infrastructure") setMakiIcon("water");
    else if (newCat === "Cyber Security") setMakiIcon("caution");
  };

  const generateNodeId = () => {
    const prefixes = ["SUB", "TRF", "GW", "SNS", "DISP", "PWR", "NET"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 900 + 100);
    setNodeId(`EE-TLN-${prefix}-${num}`);
  };

  const applyPreset = (preset: (typeof TALLINN_PRESETS)[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setDistrict(preset.district);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || title.trim().length < 2) {
      setFormError("Incident summary / title must be at least 2 characters.");
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setFormError("Detailed description must be at least 5 characters.");
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Latitude and Longitude must be valid numerical coordinates.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateIncidentPayload = {
        title: title.trim(),
        severity,
        category,
        status,
        district: district.trim() || null,
        nodeId: nodeId.trim() || `EE-TLN-NODE-${Math.floor(Math.random() * 890 + 100)}`,
        lat: Number(lat),
        lng: Number(lng),
        makiIcon: makiIcon || "caution",
        description: description.trim(),
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setFormError("Failed to save incident. Please verify the fields.");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card/95 border border-border/70 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                {isEditing ? `Edit Incident: ${incident?.id}` : "Register New SCADA Incident"}
                {isEditing && (
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    {incident?.id}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update telemetry anomaly parameters & operational status"
                  : "Dispatch a new infrastructure event into Tallinn SCADA database"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 custom-scrollbar">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Incident Title / Summary <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vanalinn Substation #4 Tripped"
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
          </div>

          {/* Severity & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Severity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                      severity === s.value
                        ? `${s.color} ${s.border} ring-1 ring-primary/40`
                        : "bg-background/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        s.value === "critical"
                          ? "bg-red-500"
                          : s.value === "warning"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                    />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Operational Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Maki Icon selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Map Vector Icon</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  Preview: <MakiIcon name={makiIcon} className="w-3.5 h-3.5 text-primary ml-1" />
                </span>
              </label>
              <select
                value={makiIcon}
                onChange={(e) => setMakiIcon(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                {MAKI_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SCADA Node & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SCADA Node ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-primary" />
                  SCADA Node ID
                </label>
                <button
                  type="button"
                  onClick={generateNodeId}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Auto-gen
                </button>
              </div>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                placeholder="EE-TLN-SUB-04"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background/80 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* District / Sector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                District / Sector
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Vanalinn, Ülemiste"
                className="w-full px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Coordinates & Location Presets */}
          <div className="space-y-2 p-3.5 rounded-xl bg-background/40 border border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary" />
                Geo Coordinates (Tallinn Bounding Box)
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Lat: {Number(lat).toFixed(4)}, Lng: {Number(lng).toFixed(4)}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 py-1">
              {TALLINN_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 text-[10px] rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground">Latitude (59.0 - 60.0)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Longitude (24.0 - 25.5)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Detailed Anomaly Description <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe failure conditions, telemetry readings, affected substations or traffic flow disruption..."
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-background/80 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Registering..."}</span>
                </>
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Incident</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Incident</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
