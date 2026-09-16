"use client";

import React from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IncidentFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (val: string) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
  totalCount: number;
}

export function IncidentFilters({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityFilterChange,
  sortAsc,
  onToggleSort,
  totalCount,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/50">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter incidents by title, node, or sector..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-background/80 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSort}
          className="text-xs flex items-center gap-1 h-[34px]"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortAsc ? "Oldest" : "Newest"}</span>
        </Button>

        <span className="text-xs text-muted-foreground font-mono px-2">
          {totalCount} events
        </span>
      </div>
    </div>
  );
}
