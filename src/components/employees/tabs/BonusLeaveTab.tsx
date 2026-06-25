import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Bonus, Leave } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BonusLeaveTabProps {
  bonusList: Bonus[];
  setBonusList: React.Dispatch<React.SetStateAction<Bonus[]>>;
  leaveList: Leave[];
  setLeaveList: React.Dispatch<React.SetStateAction<Leave[]>>;
}

export function BonusLeaveTab({ bonusList, setBonusList, leaveList, setLeaveList }: BonusLeaveTabProps) {
  const [bonusYear, setBonusYear] = useState(new Date().getFullYear());
  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear());

  const addBonus = () => {
    if (bonusList.some((b) => b.year === bonusYear)) return;
    setBonusList((prev) => [...prev, { year: bonusYear, status: false }]);
  };

  const addLeave = () => {
    if (leaveList.some((l) => l.year === leaveYear)) return;
    setLeaveList((prev) => [...prev, { year: leaveYear, status: false }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Bonus Records</h3>
        <div className="flex gap-3 items-end mb-4">
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={bonusYear} onChange={(e) => setBonusYear(Number(e.target.value))} className="w-32" />
          </div>
          <Button type="button" variant="outline" onClick={addBonus}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        {bonusList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bonus records added.</p>
        ) : (
          <div className="space-y-2">
            {bonusList.map((b, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                <span className="font-medium">{b.year}</span>
                <Badge variant={b.status ? "default" : "secondary"}>{b.status ? "Paid" : "Pending"}</Badge>
                <div className="flex-1" />
                <Switch checked={b.status} onCheckedChange={(v) => setBonusList((prev) => prev.map((item, idx) => idx === i ? { ...item, status: v } : item))} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setBonusList((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Leave Records</h3>
        <div className="flex gap-3 items-end mb-4">
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={leaveYear} onChange={(e) => setLeaveYear(Number(e.target.value))} className="w-32" />
          </div>
          <Button type="button" variant="outline" onClick={addLeave}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        {leaveList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave records added.</p>
        ) : (
          <div className="space-y-2">
            {leaveList.map((l, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                <span className="font-medium">{l.year}</span>
                <Badge variant={l.status ? "default" : "secondary"}>{l.status ? "Encashed" : "Pending"}</Badge>
                <div className="flex-1" />
                <Switch checked={l.status} onCheckedChange={(v) => setLeaveList((prev) => prev.map((item, idx) => idx === i ? { ...item, status: v } : item))} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLeaveList((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
