import { useFormContext } from "react-hook-form";
import type { EmployeeFormValues } from "@/lib/validators";
import { useAppSelector } from "@/hooks/useAppSelector";
import { getBankDisplayName } from "@/lib/sanitize";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function BankStatutoryTab() {
  const { register, setValue, watch } = useFormContext<EmployeeFormValues>();
  const banks = useAppSelector((state) => state.banks.items);
  const esiLocations = useAppSelector((state) => state.esiLocations.items);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Banking Information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Bank</Label>
          <Select value={watch("bank") ?? ""} onValueChange={(v) => setValue("bank", v)}>
            <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>
              {banks.map((b) => (<SelectItem key={b.id} value={b.id}>{getBankDisplayName(b.name)} - {b.branch} - {b.ifsc}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input id="accountNumber" {...register("accountNumber")} />
        </div>
      </div>

      <Separator />

      <h3 className="text-lg font-semibold">Statutory Information</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3">
          <Switch checked={watch("pfApplicable") ?? false} onCheckedChange={(v) => setValue("pfApplicable", v)} />
          <Label>PF Applicable</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pfNo">PF Number</Label>
          <Input id="pfNo" {...register("pfNo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uan">UAN</Label>
          <Input id="uan" {...register("uan")} maxLength={12} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={watch("esicApplicable") ?? false} onCheckedChange={(v) => setValue("esicApplicable", v)} />
          <Label>ESIC Applicable</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="esicNo">ESIC Number</Label>
          <Input id="esicNo" {...register("esicNo")} />
        </div>
        <div className="space-y-2">
          <Label>ESI Location</Label>
          <Select value={watch("esiLocation") ?? ""} onValueChange={(v) => setValue("esiLocation", v)}>
            <SelectTrigger><SelectValue placeholder="Select ESI location" /></SelectTrigger>
            <SelectContent>
              {esiLocations.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
