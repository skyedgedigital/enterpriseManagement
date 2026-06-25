import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Employee } from "@/types";

export interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableEmployees: Employee[];
  periodLabel: string;
  workOrderLabel: string;
  onAdd: (employeeIds: string[]) => Promise<void>;
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  availableEmployees,
  periodLabel,
  workOrderLabel,
  onAdd,
}: AddEmployeeModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableEmployees;
    const q = search.toLowerCase();
    return availableEmployees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.code?.toLowerCase().includes(q),
    );
  }, [availableEmployees, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const e of filtered) next.delete(e.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const e of filtered) next.add(e.id);
        return next;
      });
    }
  }, [filtered, allFilteredSelected]);

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onAdd(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSearch("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedIds(new Set());
      setSearch("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add employees to work order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Assign employees to <strong>{workOrderLabel}</strong> for period{" "}
          <strong>{periodLabel}</strong>.
        </p>

        <div className="space-y-2">
          <Label>Search by name or code</Label>
          <Input
            placeholder="Type to filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {availableEmployees.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All employees are already assigned to this work order for this period.
          </p>
        ) : (
          <>
            {filtered.length > 0 && (
              <div className="flex items-center gap-2 border-b pb-2">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  id="select-all"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Select all ({filtered.length})
                </label>
                {selectedIds.size > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No employees match your search.
                </p>
              ) : (
                filtered.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={selectedIds.has(emp.id)}
                      onCheckedChange={() => toggleOne(emp.id)}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{emp.code}</span>
                      {" — "}
                      {emp.name || "No name"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}

        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || submitting}
          >
            {submitting
              ? "Adding…"
              : `Add ${selectedIds.size || ""} employee${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
