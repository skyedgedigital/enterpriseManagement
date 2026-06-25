import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkOrder } from "@/types";

export interface CLMFormXVIProps {
  location: string;
  employer: string;
  workOrderId: string;
  workOrders: WorkOrder[];
  onLocationChange: (v: string) => void;
  onEmployerChange: (v: string) => void;
  onWorkOrderChange: (id: string) => void;
  onGenerateFormXVI: () => void;
  onGenerateFormXVIExcel: () => void;
  onGenerateForm17: () => void;
  onGenerateForm17Excel: () => void;
}

export function CLMFormXVI({
  location,
  employer,
  workOrderId,
  workOrders,
  onLocationChange,
  onEmployerChange,
  onWorkOrderChange,
  onGenerateFormXVI,
  onGenerateFormXVIExcel,
  onGenerateForm17,
  onGenerateForm17Excel,
}: CLMFormXVIProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[180px]">
            <Label>Name and Location</Label>
            <Input
              placeholder="Enter Location of work"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>
          <div className="space-y-2 flex-1 min-w-[180px]">
            <Label>Employer</Label>
            <Input
              placeholder="Name and Address of Principal"
              value={employer}
              onChange={(e) => onEmployerChange(e.target.value)}
            />
          </div>
          <div className="space-y-2 min-w-[180px]">
            <Label>Work Order</Label>
            <Select value={workOrderId || ""} onValueChange={onWorkOrderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Work Order No." />
              </SelectTrigger>
              <SelectContent>
                {workOrders.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.workOrderNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={onGenerateFormXVI}
            disabled={!location || !employer || !workOrderId}
            variant="secondary"
            className="bg-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            Generate FORMXVI
          </Button>
          <Button
            onClick={onGenerateForm17}
            disabled={!location || !employer || !workOrderId}
            variant="secondary"
            className="bg-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            Generate FORM XVII
          </Button>
          <Button
            onClick={onGenerateFormXVIExcel}
            disabled={!location || !employer || !workOrderId}
            variant="secondary"
            className="bg-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            FORMXVI Excel
          </Button>
          <Button
            onClick={onGenerateForm17Excel}
            disabled={!location || !employer || !workOrderId}
            variant="secondary"
            className="bg-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            FORM XVII Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
