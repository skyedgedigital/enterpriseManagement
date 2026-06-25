import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { DamageRegister, AdvanceRegister } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface DamageAdvanceTabProps {
  damageList: DamageRegister[];
  setDamageList: React.Dispatch<React.SetStateAction<DamageRegister[]>>;
  advanceList: AdvanceRegister[];
  setAdvanceList: React.Dispatch<React.SetStateAction<AdvanceRegister[]>>;
}

export function DamageAdvanceTab({ damageList, setDamageList, advanceList, setAdvanceList }: DamageAdvanceTabProps) {
  const [damageDialog, setDamageDialog] = useState(false);
  const [advanceDialog, setAdvanceDialog] = useState(false);

  const [damage, setDamage] = useState<DamageRegister>({
    particularsOfDamageOrLoss: "", dateOfDamageOrLoss: "", didWorkmanShowCause: false,
    personWhoHeardExplanation: "", amountOfDeductionImposed: 0, numberOfInstallments: 1, installmentsLeft: 1,
  });

  const [advance, setAdvance] = useState<AdvanceRegister>({
    amountOfAdvanceGiven: 0, dateOfAdvanceGiven: "", purposeOfAdvanceGiven: "",
    numberOfInstallments: 1, installmentsLeft: 1,
  });

  const addDamage = () => {
    setDamageList((prev) => [...prev, damage]);
    setDamage({
      particularsOfDamageOrLoss: "", dateOfDamageOrLoss: "", didWorkmanShowCause: false,
      personWhoHeardExplanation: "", amountOfDeductionImposed: 0, numberOfInstallments: 1, installmentsLeft: 1,
    });
    setDamageDialog(false);
  };

  const addAdvance = () => {
    setAdvanceList((prev) => [...prev, advance]);
    setAdvance({ amountOfAdvanceGiven: 0, dateOfAdvanceGiven: "", purposeOfAdvanceGiven: "", numberOfInstallments: 1, installmentsLeft: 1 });
    setAdvanceDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Damage Register</h3>
          <Button type="button" variant="outline" onClick={() => setDamageDialog(true)}><Plus className="h-4 w-4" /> Add Entry</Button>
        </div>
        {damageList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No damage records.</p>
        ) : (
          <div className="space-y-2">
            {damageList.map((d, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{d.particularsOfDamageOrLoss}</p>
                    <p className="text-sm text-muted-foreground">Date: {d.dateOfDamageOrLoss} | Amount: {d.amountOfDeductionImposed} | Installments: {d.installmentsLeft}/{d.numberOfInstallments}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDamageList((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Advance Register</h3>
          <Button type="button" variant="outline" onClick={() => setAdvanceDialog(true)}><Plus className="h-4 w-4" /> Add Entry</Button>
        </div>
        {advanceList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No advance records.</p>
        ) : (
          <div className="space-y-2">
            {advanceList.map((a, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{a.purposeOfAdvanceGiven}</p>
                    <p className="text-sm text-muted-foreground">Date: {a.dateOfAdvanceGiven} | Amount: {a.amountOfAdvanceGiven} | Installments: {a.installmentsLeft}/{a.numberOfInstallments}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setAdvanceList((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Damage Dialog */}
      <Dialog open={damageDialog} onOpenChange={setDamageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Damage Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Particulars of Damage/Loss</Label><Textarea value={damage.particularsOfDamageOrLoss} onChange={(e) => setDamage((p) => ({ ...p, particularsOfDamageOrLoss: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={damage.dateOfDamageOrLoss} onChange={(e) => setDamage((p) => ({ ...p, dateOfDamageOrLoss: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={damage.amountOfDeductionImposed} onChange={(e) => setDamage((p) => ({ ...p, amountOfDeductionImposed: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Person Who Heard Explanation</Label><Input value={damage.personWhoHeardExplanation} onChange={(e) => setDamage((p) => ({ ...p, personWhoHeardExplanation: e.target.value }))} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={damage.didWorkmanShowCause} onCheckedChange={(v) => setDamage((p) => ({ ...p, didWorkmanShowCause: v }))} />
              <Label>Workman Showed Cause</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>No. of Installments</Label><Input type="number" min={1} value={damage.numberOfInstallments} onChange={(e) => setDamage((p) => ({ ...p, numberOfInstallments: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Installments Left</Label><Input type="number" min={0} value={damage.installmentsLeft} onChange={(e) => setDamage((p) => ({ ...p, installmentsLeft: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Remarks</Label><Input value={damage.remarks ?? ""} onChange={(e) => setDamage((p) => ({ ...p, remarks: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDamageDialog(false)}>Cancel</Button>
            <Button type="button" onClick={addDamage}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance Dialog */}
      <Dialog open={advanceDialog} onOpenChange={setAdvanceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Advance Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Purpose</Label><Textarea value={advance.purposeOfAdvanceGiven} onChange={(e) => setAdvance((p) => ({ ...p, purposeOfAdvanceGiven: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={advance.dateOfAdvanceGiven} onChange={(e) => setAdvance((p) => ({ ...p, dateOfAdvanceGiven: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={advance.amountOfAdvanceGiven} onChange={(e) => setAdvance((p) => ({ ...p, amountOfAdvanceGiven: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>No. of Installments</Label><Input type="number" min={1} value={advance.numberOfInstallments} onChange={(e) => setAdvance((p) => ({ ...p, numberOfInstallments: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Installments Left</Label><Input type="number" min={0} value={advance.installmentsLeft} onChange={(e) => setAdvance((p) => ({ ...p, installmentsLeft: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Remarks</Label><Input value={advance.remarks ?? ""} onChange={(e) => setAdvance((p) => ({ ...p, remarks: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdvanceDialog(false)}>Cancel</Button>
            <Button type="button" onClick={addAdvance}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
