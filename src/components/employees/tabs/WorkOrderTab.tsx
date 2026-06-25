import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { EmployeeWorkOrder } from "@/types";
import { useAppSelector } from "@/hooks/useAppSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface WorkOrderTabProps {
  workOrderList: EmployeeWorkOrder[];
  setWorkOrderList: React.Dispatch<React.SetStateAction<EmployeeWorkOrder[]>>;
}

export function WorkOrderTab({ workOrderList, setWorkOrderList }: WorkOrderTabProps) {
  const workOrders = useAppSelector((state) => state.workOrders.items);

  const [entry, setEntry] = useState<EmployeeWorkOrder>({
    period: "", workOrderHr: "", workOrderAtten: 0,
  });

  const addEntry = () => {
    if (!entry.period || !entry.workOrderHr) return;
    setWorkOrderList((prev) => [...prev, entry]);
    setEntry({ period: "", workOrderHr: "", workOrderAtten: 0 });
  };

  const getWoNumber = (id: string) => workOrders.find((w) => w.id === id)?.workOrderNumber ?? id;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Work Order Assignments</h3>

      <div className="grid gap-4 sm:grid-cols-4 items-end">
        <div className="space-y-2">
          <Label>Period (MM-YYYY)</Label>
          <Input
            placeholder="01-2026"
            value={entry.period}
            onChange={(e) => setEntry((p) => ({ ...p, period: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Work Order</Label>
          <Select value={entry.workOrderHr} onValueChange={(v) => setEntry((p) => ({ ...p, workOrderHr: v }))}>
            <SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger>
            <SelectContent>
              {workOrders.map((w) => (<SelectItem key={w.id} value={w.id}>{w.workOrderNumber}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Attendance</Label>
          <Input
            type="number"
            value={entry.workOrderAtten}
            onChange={(e) => setEntry((p) => ({ ...p, workOrderAtten: Number(e.target.value) }))}
          />
        </div>
        <Button type="button" onClick={addEntry} variant="outline">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {workOrderList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No work order assignments.</p>
      ) : (
        <div className="space-y-2">
          {workOrderList.map((wo, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex-1">
                <p className="font-medium">Period: {wo.period}</p>
                <p className="text-sm text-muted-foreground">
                  Work Order: {getWoNumber(wo.workOrderHr)} | Attendance: {wo.workOrderAtten}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setWorkOrderList((prev) => prev.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
