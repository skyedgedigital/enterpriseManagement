import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { EmployeeFormValues } from "@/lib/validators";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SalaryTab() {
  const { register, setValue, watch } = useFormContext<EmployeeFormValues>();

  const basic = watch("basic");
  const da = watch("da");
  useEffect(() => {
    const b = Number(basic) || 0;
    const d = Number(da) || 0;
    setValue("payRate", String(b + d));
  }, [basic, da, setValue]);

  const fields = [
    { id: "basic", label: "Basic" },
    { id: "da", label: "DA (Dearness Allowance)" },
    { id: "payRate", label: "Pay Rate (Basic + DA, editable)" },
    { id: "hra", label: "HRA (House Rent)" },
    { id: "ca", label: "CA (Conveyance)" },
    { id: "food", label: "Food Allowance" },
    { id: "incentives", label: "Incentives" },
    { id: "uniform", label: "Uniform Allowance" },
    { id: "medical", label: "Medical Allowance" },
    { id: "loan", label: "Loan Deduction" },
    { id: "lic", label: "LIC Deduction" },
    { id: "oldBasic", label: "Old Basic" },
    { id: "oldDa", label: "Old DA" },
  ] as const;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Salary Components</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <div key={f.id} className="space-y-2">
            <Label htmlFor={f.id}>{f.label}</Label>
            <Input id={f.id} {...register(f.id)} placeholder="0" />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={watch("attendanceAllowance") ?? false}
            onCheckedChange={(v) => setValue("attendanceAllowance", v)}
          />
          <Label>Attendance Allowance</Label>
        </div>
      </div>
    </div>
  );
}
