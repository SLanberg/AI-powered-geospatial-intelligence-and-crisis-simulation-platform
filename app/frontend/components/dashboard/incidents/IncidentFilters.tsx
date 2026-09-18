"use client";

import React from "react";
import { Search, ArrowUpDown, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IncidentFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
  totalCount: number;
  onCreateClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const CATEGORIES = [
  "all",
  "Grid Failure",
  "Traffic Flow",
  "Telecom Node",
  "Emergency Dispatch",
  "Sensor Anomaly",
  "Cyber Security",
  "Water Infrastructure",
];

export function IncidentFilters({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityFilterChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortAsc,
  onToggleSort,
  totalCount,
  onCreateClick,
  onRefresh,
  loading = false,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/50">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter incidents by title, node, category, or district..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-background/80 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Severity Filter */}
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="investigating">Investigating</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg bg-background/80 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.filter((c) => c !== "all").map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sort Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSort}
          title="Toggle Chronological Sort"
          className="text-xs flex items-center gap-1 h-[34px]"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{sortAsc ? "Oldest" : "Newest"}</span>
        </Button>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            title="Reload Incidents"
            className="text-xs flex items-center gap-1 h-[34px] px-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        )}

        {/* Create Incident Button */}
        <Button
          onClick={onCreateClick}
          size="sm"
          className="text-xs flex items-center gap-1.5 h-[34px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 font-medium px-3.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident</span>
        </Button>

        <span className="text-xs text-muted-foreground font-mono px-1">
          {totalCount} events
        </span>
      </div>
    </div>
  );
}
