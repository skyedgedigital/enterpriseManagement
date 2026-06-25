import { useFormContext } from "react-hook-form";
import type { EmployeeFormValues } from "@/lib/validators";
import { useAppSelector } from "@/hooks/useAppSelector";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function EmploymentTab() {
  const { register, setValue, watch } = useFormContext<EmployeeFormValues>();
  const departments = useAppSelector((state) => state.departments.items);
  const designations = useAppSelector((state) => state.designations.items);
  const sites = useAppSelector((state) => state.sites.items);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Employment Information</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={watch("department") ?? ""} onValueChange={(v) => setValue("department", v)}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <Select value={watch("designation") ?? ""} onValueChange={(v) => setValue("designation", v)}>
            <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
            <SelectContent>
              {designations.map((d) => (<SelectItem key={d.id} value={d.id}>{d.designation}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Site</Label>
          <Select value={watch("site") ?? ""} onValueChange={(v) => setValue("site", v)}>
            <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Appointment Date</Label>
          <DatePicker
            value={watch("appointmentDate") ?? ""}
            onChange={(v) => setValue("appointmentDate", v)}
            placeholder="Select appointment date"
          />
        </div>
        <div className="space-y-2">
          <Label>Resign Date</Label>
          <DatePicker
            value={watch("resignDate") ?? ""}
            onChange={(v) => setValue("resignDate", v)}
            placeholder="Select resign date"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={watch("workingStatus") ?? true}
            onCheckedChange={(v) => setValue("workingStatus", v)}
          />
          <Label>Currently Working</Label>
        </div>
      </div>

      <h3 className="text-lg font-semibold pt-4">Safety & Compliance</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="safetyPassNumber">Safety Pass Number</Label>
          <Input id="safetyPassNumber" {...register("safetyPassNumber")} />
        </div>
        <div className="space-y-2">
          <Label>Safety Pass Validity</Label>
          <DatePicker
            value={watch("spValidity") ?? ""}
            onChange={(v) => setValue("spValidity", v)}
            placeholder="Select validity date"
          />
        </div>
        <div className="space-y-2">
          <Label>Police Verification Validity</Label>
          <DatePicker
            value={watch("policeVerificationValidityDate") ?? ""}
            onChange={(v) => setValue("policeVerificationValidityDate", v)}
            placeholder="Select validity date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gatePassNumber">Gate Pass Number</Label>
          <Input id="gatePassNumber" {...register("gatePassNumber")} />
        </div>
        <div className="space-y-2">
          <Label>Gate Pass Valid Till</Label>
          <DatePicker
            value={watch("gatePassValidTill") ?? ""}
            onChange={(v) => setValue("gatePassValidTill", v)}
            placeholder="Select validity date"
          />
        </div>
      </div>
    </div>
  );
}
