"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Incident } from "@/shared";
import { MakiIcon, getMakiIconNameForIncident } from "@/components/dashboard/map/MakiIcon";

export interface IncidentRowProps {
  incident: Incident;
  onSelect: (incident: Incident) => void;
}

export function IncidentRow({ incident, onSelect }: IncidentRowProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">CRITICAL</Badge>;
      case "warning":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">WARNING</Badge>;
      default:
        return <Badge variant="secondary">INFO</Badge>;
    }
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/40 transition-colors">
      <TableCell className="font-mono text-xs text-muted-foreground">{incident.timestamp}</TableCell>
      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MakiIcon name={getMakiIconNameForIncident(incident as any)} className="w-4 h-4 shrink-0 text-primary" />
          <span className="font-medium text-xs text-foreground">{incident.title}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{incident.category}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{incident.nodeId}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{incident.district || "Tallinn"}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(incident);
          }}
          className="h-7 text-xs flex items-center gap-1 hover:text-primary"
        >
          <MapPin className="w-3 h-3" />
          <span>Locate</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}
