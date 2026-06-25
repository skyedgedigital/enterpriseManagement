import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchFinalSettlements, addFinalSettlement, updateFinalSettlement, deleteFinalSettlement } from "@/store/slices/finalSettlementSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import type { FinalSettlement, Bonus, Leave } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";

export function FinalSettlementPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.finalSettlements);
  const employees = useAppSelector((state) => state.employees.items);
  const [deleteTarget, setDeleteTarget] = useState<FinalSettlement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinalSettlement | null>(null);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [bonusList, setBonusList] = useState<Bonus[]>([]);
  const [leaveList, setLeaveList] = useState<Leave[]>([]);
  const [bonusYear, setBonusYear] = useState(new Date().getFullYear());
  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchFinalSettlements());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const getEmpName = (id?: string) => { const e = employees.find((x) => x.id === id); return e?.name || e?.code || "-"; };

  const openCreate = () => {
    setEditing(null);
    setSelectedEmployee("");
    setBonusList([]);
    setLeaveList([]);
    setDialogOpen(true);
  };

  const openEdit = (item: FinalSettlement) => {
    setEditing(item);
    setSelectedEmployee(item.employee ?? "");
    setBonusList(item.bonus ?? []);
    setLeaveList(item.leave ?? []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      employee: selectedEmployee || undefined,
      bonus: bonusList,
      leave: leaveList,
    };

    if (editing) {
      const result = await dispatch(updateFinalSettlement({ id: editing.id, data: payload }));
      if (updateFinalSettlement.fulfilled.match(result)) { toast.success("Settlement updated"); setDialogOpen(false); }
      else toast.error(result.payload as string);
    } else {
      const result = await dispatch(addFinalSettlement(payload));
      if (addFinalSettlement.fulfilled.match(result)) { toast.success("Settlement created"); setDialogOpen(false); }
      else toast.error(result.payload as string);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteFinalSettlement(deleteTarget.id));
    if (deleteFinalSettlement.fulfilled.match(result)) { toast.success("Settlement deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<FinalSettlement>[] = [
    { key: "employee", header: "Employee", render: (s) => getEmpName(s.employee) },
    { key: "bonus", header: "Bonus", render: (s) => `${s.bonus?.length ?? 0} records` },
    { key: "leave", header: "Leave", render: (s) => `${s.leave?.length ?? 0} records` },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Final Settlements"
        description="Manage employee exit settlements"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Settlement</Button>}
      />

      {items.length === 0 ? (
        <EmptyState title="No settlements" description="Create a final settlement record." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Settlement</Button>} />
      ) : (
        <DataTable data={items} columns={columns} searchKey="employee" searchPlaceholder="Search..."
          actions={(item) => (
            <>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </>
          )}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Settlement" : "Add Settlement"}</DialogTitle>
            <DialogDescription>Manage bonus and leave settlement records for an employee.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name || e.code}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Bonus */}
            <div>
              <h4 className="font-semibold mb-3">Bonus</h4>
              <div className="flex gap-2 items-end mb-3">
                <div className="space-y-1"><Label className="text-xs">Year</Label><Input type="number" value={bonusYear} onChange={(e) => setBonusYear(Number(e.target.value))} className="w-28 h-8" /></div>
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  if (!bonusList.some((b) => b.year === bonusYear)) setBonusList((p) => [...p, { year: bonusYear, status: false }]);
                }}><Plus className="h-3 w-3" /></Button>
              </div>
              {bonusList.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded border mb-1">
                  <span className="text-sm font-medium">{b.year}</span>
                  <Badge variant={b.status ? "default" : "secondary"} className="text-xs">{b.status ? "Paid" : "Pending"}</Badge>
                  <div className="flex-1" />
                  <Switch checked={b.status} onCheckedChange={(v) => setBonusList((p) => p.map((x, idx) => idx === i ? { ...x, status: v } : x))} />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => setBonusList((p) => p.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Leave */}
            <div>
              <h4 className="font-semibold mb-3">Leave</h4>
              <div className="flex gap-2 items-end mb-3">
                <div className="space-y-1"><Label className="text-xs">Year</Label><Input type="number" value={leaveYear} onChange={(e) => setLeaveYear(Number(e.target.value))} className="w-28 h-8" /></div>
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  if (!leaveList.some((l) => l.year === leaveYear)) setLeaveList((p) => [...p, { year: leaveYear, status: false }]);
                }}><Plus className="h-3 w-3" /></Button>
              </div>
              {leaveList.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded border mb-1">
                  <span className="text-sm font-medium">{l.year}</span>
                  <Badge variant={l.status ? "default" : "secondary"} className="text-xs">{l.status ? "Encashed" : "Pending"}</Badge>
                  <div className="flex-1" />
                  <Switch checked={l.status} onCheckedChange={(v) => setLeaveList((p) => p.map((x, idx) => idx === i ? { ...x, status: v } : x))} />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => setLeaveList((p) => p.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
