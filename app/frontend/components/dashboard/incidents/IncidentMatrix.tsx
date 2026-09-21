"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Incident, CreateIncidentPayload } from "@/shared";
import { useIncidents } from "@/frontend/hooks/useIncidents";
import { IncidentFilters } from "./IncidentFilters";
import { IncidentRow } from "./IncidentRow";
import { IncidentModal } from "./IncidentModal";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface IncidentMatrixProps {
  onSelectIncident: (incident: Incident) => void;
  initialIncidents?: Incident[];
}

export function IncidentMatrix({ onSelectIncident, initialIncidents }: IncidentMatrixProps) {
  const {
    incidents,
    loading,
    error,
    refresh,
    createIncident,
    updateIncident,
    deleteIncident,
  } = useIncidents(initialIncidents);

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Modal / Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  // Snack Bar state
  const [snackbar, setSnackbar] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const showSnackbar = (type: "success" | "error", title: string, message: string) => {
    setSnackbar({ type, title, message });
    setTimeout(() => {
      setSnackbar((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const filteredIncidents = useMemo(() => {
    const list = incidents.filter((inc) => {
      const matchesSeverity = severityFilter === "all" || inc.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || inc.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.nodeId.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q) ||
        (inc.district && inc.district.toLowerCase().includes(q));

      return matchesSeverity && matchesStatus && matchesCategory && matchesQuery;
    });

    return list.sort((a, b) => {
      if (sortAsc) return a.timestamp.localeCompare(b.timestamp);
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [incidents, severityFilter, statusFilter, categoryFilter, searchQuery, sortAsc]);

  const handleSaveModal = async (payload: CreateIncidentPayload): Promise<boolean> => {
    if (editingIncident) {
      const ok = await updateIncident(editingIncident.id, payload);
      if (ok) {
        showSnackbar("success", "Incident Updated", `Incident #${editingIncident.id.slice(0, 8)} updated successfully in database.`);
      } else {
        showSnackbar("error", "Update Failed", "Could not update incident details.");
      }
      return ok;
    } else {
      const ok = await createIncident(payload);
      if (ok) {
        showSnackbar("success", "Incident Created", "New SCADA incident registered and persisted to database.");
      } else {
        showSnackbar("error", "Creation Failed", "Could not register new incident.");
      }
      return ok;
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const ok = await deleteIncident(id);
      if (ok) {
        showSnackbar(
          "success",
          "Incident Deleted",
          `Incident #${id.slice(0, 8)} was decommissioned and permanently removed from database.`
        );
      } else {
        showSnackbar(
          "error",
          "Deletion Failed",
          `Failed to delete incident #${id.slice(0, 8)}. Please try again.`
        );
      }
      return ok;
    } catch (err) {
      showSnackbar(
        "error",
        "Deletion Error",
        err instanceof Error ? err.message : `Failed to delete incident #${id.slice(0, 8)}.`
      );
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border bg-destructive/15 border-destructive/30 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => refresh()} className="underline hover:no-underline text-xs">
            Retry
          </button>
        </div>
      )}

      <IncidentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(!sortAsc)}
        totalCount={filteredIncidents.length}
        onCreateClick={() => {
          setEditingIncident(null);
          setIsCreateOpen(true);
        }}
        onRefresh={refresh}
        loading={loading}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Time</TableHead>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead>Incident / Anomaly</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead className="w-[150px]">SCADA Node</TableHead>
              <TableHead className="w-[120px]">Sector</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && incidents.length === 0 ? (
              <TableRow>
                <td colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  Synchronizing active incidents with SQLite DB...
                </td>
              </TableRow>
            ) : filteredIncidents.length === 0 ? (
              <TableRow>
                <td colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  No incidents matching the selected filter criteria.
                </td>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onSelect={onSelectIncident}
                  onEdit={(inc) => {
                    setEditingIncident(inc);
                    setIsCreateOpen(true);
                  }}
                  onDelete={(inc) => {
                    handleDelete(inc.id);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal */}
      <IncidentModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingIncident(null);
        }}
        incident={editingIncident}
        onSave={handleSaveModal}
      />

      {/* Bottom-right Corner Snack Bar */}
      {snackbar && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto"
        >
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 ${
              snackbar.type === "success"
                ? "bg-card border-emerald-500/40 text-foreground"
                : "bg-card border-destructive/50 text-foreground"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                snackbar.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}
            >
              {snackbar.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-xs font-semibold text-foreground tracking-wide">
                {snackbar.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 break-words leading-relaxed">
                {snackbar.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSnackbar(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-md hover:bg-muted/50"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentMatrix;
