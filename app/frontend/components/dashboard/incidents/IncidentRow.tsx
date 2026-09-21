"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Incident } from "@/shared";
import { MakiIcon, getMakiIconNameForIncident } from "@/components/dashboard/map/MakiIcon";

export interface IncidentRowProps {
  incident: Incident;
  onSelect: (incident: Incident) => void;
  onEdit: (incident: Incident) => void;
  onDelete: (incident: Incident) => void;
}

export function IncidentRow({ incident, onSelect, onEdit, onDelete }: IncidentRowProps) {
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] gap-1 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Active
          </Badge>
        );
      case "investigating":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] gap-1 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Investigating
          </Badge>
        );
      case "mitigated":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] gap-1 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Mitigated
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] py-0.5">
            {status || "Active"}
          </Badge>
        );
    }
  };

  return (
    <TableRow
      onClick={() => onSelect(incident)}
      className="cursor-pointer hover:bg-muted/40 transition-colors group"
    >
      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {incident.timestamp}
      </TableCell>
      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MakiIcon name={getMakiIconNameForIncident(incident as any)} className="w-4 h-4 shrink-0 text-primary" />
          <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">
            {incident.title}
          </span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(incident.status)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{incident.category}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{incident.nodeId}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{incident.district || "Tallinn"}</TableCell>
      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(incident);
            }}
            title="Locate on Command Map"
            className="h-7 px-2 text-xs flex items-center gap-1 hover:text-primary hover:bg-primary/10"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Locate</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(incident);
            }}
            title="Edit Incident Details"
            className="h-7 px-2 text-xs flex items-center gap-1 hover:text-amber-400 hover:bg-amber-500/10 text-muted-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(incident);
            }}
            title="Delete Incident"
            className="h-7 px-2 text-xs flex items-center gap-1 hover:text-destructive hover:bg-destructive/10 text-muted-foreground"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
