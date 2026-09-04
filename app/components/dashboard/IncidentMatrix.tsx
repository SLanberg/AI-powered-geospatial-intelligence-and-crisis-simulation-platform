"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, MapPin, Search } from "lucide-react";
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

interface IncidentMatrixProps {
  onSelectIncident: (incident: Incident) => void;
}

export function IncidentMatrix({ onSelectIncident }: IncidentMatrixProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredIncidents = useMemo(() => {
    return MOCK_INCIDENTS.filter((inc) => {
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
  }, [severityFilter, searchQuery]);

  return (
    <div className="w-full bg-[#080B14] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl p-5 font-sans text-slate-200 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-100 font-sans">
                Tallinn Incident Log Matrix
              </h3>
              <Badge
                variant="outline"
                className="font-mono text-[10px] bg-rose-950/60 text-rose-300 border-rose-900"
              >
                {filteredIncidents.length} EVENTS
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Active telemetry anomalies captured during the 08:47 grid event window
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {["all", "critical", "warning", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-[11px] capitalize transition-colors ${
                  severityFilter === sev
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search nodes, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Incident Table */}
      <div className="rounded-lg border border-slate-800/80 overflow-hidden bg-[#05070D]">
        <Table>
          <TableHeader className="bg-slate-900/90 border-b border-slate-800">
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead className="font-mono text-[11px] text-slate-400">
                INCIDENT ID
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400">
                TIMESTAMP
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400">
                SEVERITY
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400">
                INCIDENT SUMMARY
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400">
                CATEGORY
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400">
                TALLINN NODE
              </TableHead>
              <TableHead className="font-mono text-[11px] text-slate-400 text-right">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-mono text-xs">
                  NO INCIDENTS MATCHING FILTER CRITERIA
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((inc) => (
                <TableRow
                  key={inc.id}
                  className="border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-blue-400 font-semibold">
                    {inc.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {inc.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inc.severity === "critical"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[9px] px-1.5 py-0.5 font-mono uppercase"
                    >
                      {inc.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-slate-200">
                      {inc.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {inc.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {inc.category}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {inc.nodeId}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectIncident(inc)}
                      className="h-7 px-2 text-xs text-blue-400 hover:text-blue-200 hover:bg-blue-950/50 font-mono"
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      Locate Map
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
