"use client";

import React, { useState } from "react";
import { Incident } from "@/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, X, RefreshCw } from "lucide-react";

export interface IncidentDeleteDialogProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export function IncidentDeleteDialog({
  isOpen,
  incident,
  onClose,
  onConfirm,
}: IncidentDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      const success = await onConfirm(incident.id);
      if (success) {
        onClose();
      } else {
        setError("Failed to delete incident. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card/95 border border-destructive/40 rounded-2xl shadow-2xl shadow-destructive/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-destructive/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/20 border border-destructive/30 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Decommission Incident
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {incident.id}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground line-clamp-1">
                {incident.title}
              </span>
              <Badge
                variant={
                  incident.severity === "critical"
                    ? "destructive"
                    : incident.severity === "warning"
                    ? "outline"
                    : "secondary"
                }
                className="text-[10px] uppercase font-mono shrink-0"
              >
                {incident.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Category: <strong className="text-foreground">{incident.category}</strong></span>
              <span>•</span>
              <span>District: <strong className="text-foreground">{incident.district || "Tallinn"}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 italic">
              &quot;{incident.description}&quot;
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Are you sure you want to permanently delete this incident record from the SCADA grid telemetry database? This action cannot be reversed.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={deleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs flex items-center gap-1.5 shadow-md shadow-destructive/20"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
