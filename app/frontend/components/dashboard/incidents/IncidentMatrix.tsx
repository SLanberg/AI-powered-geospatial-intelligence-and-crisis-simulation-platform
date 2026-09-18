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
import { IncidentDeleteDialog } from "./IncidentDeleteDialog";
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
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);

  // Success / Info Banner
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.message === message ? null : prev));
    }, 4000);
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
        showFeedback("success", `Incident [${editingIncident.id}] updated successfully.`);
      }
      return ok;
    } else {
      const ok = await createIncident(payload);
      if (ok) {
        showFeedback("success", "New SCADA incident successfully registered and dispatched.");
      }
      return ok;
    }
  };

  const handleDeleteConfirm = async (id: string): Promise<boolean> => {
    const ok = await deleteIncident(id);
    if (ok) {
      showFeedback("success", `Incident [${id}] decommissioned and removed from registry.`);
    }
    return ok;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Feedback banner */}
      {feedbackBanner && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackBanner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="hover:opacity-80 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && !feedbackBanner && (
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

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden">
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
                    setDeletingIncident(inc);
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

      {/* Delete Confirmation Dialog */}
      <IncidentDeleteDialog
        isOpen={Boolean(deletingIncident)}
        incident={deletingIncident}
        onClose={() => setDeletingIncident(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default IncidentMatrix;
