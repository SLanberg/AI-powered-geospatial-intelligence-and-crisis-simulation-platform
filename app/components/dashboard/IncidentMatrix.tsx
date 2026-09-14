"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, MapPin, Search, ShieldAlert, ArrowUpDown, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_INCIDENTS, Incident } from "./data";
import { MakiIcon, getMakiIconNameForIncident } from "./map/MakiIcon";

interface IncidentMatrixProps {
  onSelectIncident: (incident: Incident) => void;
}

export function IncidentMatrix({ onSelectIncident }: IncidentMatrixProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredIncidents = useMemo(() => {
    let result = MOCK_INCIDENTS.filter((inc) => {
      const matchesSeverity =
        severityFilter === "all" || inc.severity === severityFilter;
      const matchesQuery =
        searchQuery === "" ||
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesQuery;
    });

    return result.sort((a, b) => {
      if (sortAsc) return a.timestamp.localeCompare(b.timestamp);
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [severityFilter, searchQuery, sortAsc]);

  const getThreatBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
      case "emergency":
        return "bg-teal-500/20 text-teal-400 border-teal-500/50 font-mono font-semibold text-xs tracking-wider uppercase";
      case "warning":
      case "attention":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50 font-mono font-semibold text-xs tracking-wider uppercase";
      case "normal":
      case "safe":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-mono font-semibold text-xs tracking-wider uppercase";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono font-semibold text-xs tracking-wider uppercase";
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-2xl p-5 font-sans text-card-foreground space-y-4">
      {/* Header & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-lg bg-teal-500/20 border-teal-500/30 shadow-lg text-red-400">
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <AlertTriangle className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-wider uppercase text-foreground font-sans">
                High-Density Incident Matrix
              </h3>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50 font-mono text-xs font-semibold px-2.5 py-0.5">
                {filteredIncidents.length} CRITICAL TELEMETRY EVENTS
              </Badge>
            </div>
            <p className="text-xs font-semibold text-foreground/90">
              Live anomaly feeds and tactical dispatch control matrix
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center bg-muted/90 border border-border rounded-lg p-1 gap-1">
            <Filter className="w-5 h-5 ml-2 mr-1 text-foreground/70" />
            {["all", "critical", "warning", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`min-h-[44px] px-3.5 py-2 rounded-md font-semibold text-xs capitalize transition-all min-w-[64px] flex items-center justify-center ${
                  severityFilter === sev
                    ? "bg-teal-600 text-white shadow-sm ring-1 ring-blue-400/50"
                    : "text-teal-400 hover:text-white hover:bg-teal-600"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70" />
            <input
              type="text"
              placeholder="Search nodes, IDs, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/90 border border-border rounded-lg pl-10 pr-3 min-h-[44px] text-xs font-semibold text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
          </div>
        </div>
      </div>

      {/* Dense Incident Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/90 border-b border-border">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
                THREAT LEVEL
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
                INCIDENT ID
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortAsc(!sortAsc)}>
                <div className="flex items-center gap-1">
                  TIMESTAMP
                  <ArrowUpDown className="w-5 h-5 text-foreground/70" />
                </div>
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
                INCIDENT TELEMETRY & DESCRIPTION
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
                CATEGORY
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider">
                NODE LOCATION
              </TableHead>
              <TableHead className="font-mono font-bold text-xs text-foreground uppercase tracking-wider text-right">
                TACTICAL ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-foreground font-mono font-semibold text-xs">
                  NO CRITICAL INCIDENTS MATCHING FILTER CRITERIA
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((inc) => {
                const isCritical = inc.severity.toLowerCase() === "critical" || inc.severity.toLowerCase() === "emergency";
                return (
                  <TableRow
                    key={inc.id}
                    className="border-border/60 hover:bg-muted/60 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isCritical && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        )}
                        <Badge className={getThreatBadgeClass(inc.severity)}>
                          {inc.severity}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-400 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted border border-border flex items-center justify-center shrink-0">
                          <MakiIcon name={getMakiIconNameForIncident(inc)} size={14} className="text-teal-400" />
                        </div>
                        <span>{inc.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {inc.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span>{inc.title}</span>
                      </div>
                      <div className="text-xs font-semibold text-foreground/80 line-clamp-1">
                        {inc.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {inc.category}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {inc.nodeId}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="default"
                        variant="ghost"
                        onClick={() => onSelectIncident(inc)}
                        className="min-h-[44px] px-3.5 text-xs text-teal-400 hover:text-white hover:bg-teal-600 font-mono font-bold flex items-center justify-center ml-auto border border-teal-500/30 hover:border-teal-500 rounded-md"
                      >
                        <MapPin className="w-5 h-5 mr-1.5" />
                        Locate Map
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


