"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Incident } from "@/shared";
import { useIncidents } from "@/frontend/hooks/useIncidents";
import { IncidentFilters } from "./IncidentFilters";
import { IncidentRow } from "./IncidentRow";

export interface IncidentMatrixProps {
  onSelectIncident: (incident: Incident) => void;
  initialIncidents?: Incident[];
}

export function IncidentMatrix({ onSelectIncident, initialIncidents }: IncidentMatrixProps) {
  const { incidents, loading } = useIncidents(initialIncidents);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredIncidents = useMemo(() => {
    const list = incidents.filter((inc) => {
      const matchesSeverity = severityFilter === "all" || inc.severity === severityFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.nodeId.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q);
      return matchesSeverity && matchesQuery;
    });

    return list.sort((a, b) => {
      if (sortAsc) return a.timestamp.localeCompare(b.timestamp);
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [incidents, severityFilter, searchQuery, sortAsc]);

  return (
    <div className="flex flex-col gap-4">
      <IncidentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(!sortAsc)}
        totalCount={filteredIncidents.length}
      />

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead className="w-[110px]">Severity</TableHead>
              <TableHead>Incident / Anomaly</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[160px]">SCADA Node</TableHead>
              <TableHead className="w-[130px]">Sector</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && incidents.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  Synchronizing active incidents with SQLite DB...
                </td>
              </TableRow>
            ) : filteredIncidents.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No active incidents matching the selected filter criteria.
                </td>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onSelect={onSelectIncident}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default IncidentMatrix;
